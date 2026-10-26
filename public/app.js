const $ = selector => document.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
let state, current, busy = false, draftParentId = null;
async function api(url, body) {
  const res = await fetch(url, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json(); if (!res.ok) throw new Error(data.error); return data;
}
async function work(fn) {
  if (busy) return; busy = true; $('#error').hidden = true;
  document.querySelectorAll('button').forEach(button => button.disabled = true); document.body.setAttribute('aria-busy', 'true');
  try { await fn(); } catch (error) { $('#error').textContent = error.message; $('#error').hidden = false; $('#error').scrollIntoView({ block: 'nearest' }); }
  finally { busy = false; document.body.setAttribute('aria-busy', 'false'); document.querySelectorAll('button').forEach(button => button.disabled = false); }
}
async function reload(id = current?.id) { state = await api('/api/state'); current = state.records.find(record => record.id === id); if (current) { $('#scope').value = current.scope; $('#request').value = current.request; } render(); }
const draftKey = id => `scopepay:review-draft:${id}`;
function saveDraft() {
  if (!current || current.approval) return;
  const draft = { sourceHash: current.sourceHash, scope: $('#scope').value, request: $('#request').value, recipient: $('#recipient').value,
    fields: [...document.querySelectorAll('[data-decision],[data-title],[data-rationale],[data-price]')].map(field => ({ id: field.id, value: field.value })) };
  try { sessionStorage.setItem(draftKey(current.id), JSON.stringify(draft)); $('#draft-status').textContent = 'Draft saved in this tab. Confirmation is never restored.'; }
  catch { $('#draft-status').textContent = 'Tab storage is unavailable. Keep this tab open until you freeze the proposal.'; }
}
function restoreDraft() {
  $('#draft-status').textContent = '';
  if (!current) return;
  try {
    if (current.approval) { sessionStorage.removeItem(draftKey(current.id)); return; }
    const draft = JSON.parse(sessionStorage.getItem(draftKey(current.id)) || 'null');
    if (!draft || draft.sourceHash !== current.sourceHash || !Array.isArray(draft.fields)) return;
    for (const entry of draft.fields) {
      if (typeof entry.id !== 'string' || typeof entry.value !== 'string') continue;
      const field = document.getElementById(entry.id);
      if (field && $('#items').contains(field)) field.value = entry.value.slice(0, field.maxLength > 0 ? field.maxLength : 1000);
    }
    if (typeof draft.scope === 'string') $('#scope').value = draft.scope.slice(0, 12000);
    if (typeof draft.request === 'string') $('#request').value = draft.request.slice(0, 12000);
    if (typeof draft.recipient === 'string') $('#recipient').value = draft.recipient.slice(0, 254);
    $('#confirmed').checked = false;
    updateDecisions();
    $('#draft-status').textContent = 'Draft restored in this tab. Review it again before confirming.';
  } catch { /* Storage is optional; approval and invoice records stay server-side. */ }
}
function renderItem(item, index) {
  const id = escape(item.id);
  const alternatives = (item.semanticMatches || []).slice(1).map(match => `<blockquote>${escape(match.scopeQuote)}</blockquote>`).join('');
  return `<article class="change"><h3 class="request-title">${index + 1}. ${escape(item.requestQuote)}</h3><details class="source-evidence" ${index === 0 ? 'open' : ''}><summary>Read the original evidence</summary><p class="quote-label">Related agreement clause · verbatim</p><blockquote>${escape(item.scopeQuote)}</blockquote>${alternatives ? `<details class="more-evidence"><summary>Other related clauses</summary>${alternatives}</details>` : ''}<p class="helper">${item.semanticMatches ? 'AI retrieves related wording; similarity does not establish what is included.' : escape(item.reason)}</p></details><label for="decision-${id}">Your decision</label><select id="decision-${id}" data-decision="${id}" required><option value="">Choose after reviewing the evidence</option><option value="additional">Additional work — price separately</option><option value="included">Already included — no extra charge</option><option value="clarify">Needs clarification — leave out for now</option></select><div class="charge-fields" data-fields="${id}" hidden><label for="title-${id}">Client-facing deliverable</label><input id="title-${id}" data-title="${id}" type="text" maxlength="120" value="${escape(item.title)}" placeholder="e.g. Add a 12-product print store"><label for="reason-${id}">Why this is additional</label><textarea id="reason-${id}" data-rationale="${id}" rows="2" maxlength="1000" placeholder="Explain the change in plain language, using the agreement above."></textarea><div class="price-row"><label for="price-${id}">Your price · USD</label><input id="price-${id}" data-price="${id}" type="text" inputmode="decimal" placeholder="0.00" maxlength="8"></div></div></article>`;
}
function noCharge(approval) {
  const included = (approval.reviewed || []).filter(item => item.disposition === 'included');
  const clarify = (approval.reviewed || []).filter(item => item.disposition === 'clarify');
  return `${included.length ? `<div class="no-charge"><strong>Already included · no extra charge</strong>${included.map(item => `<p>${escape(item.requestQuote)}</p>`).join('')}</div>` : ''}${clarify.length ? `<div class="no-charge muted"><strong>Needs clarification · not billed</strong>${clarify.map(item => `<p>${escape(item.requestQuote)}</p>`).join('')}</div>` : ''}`;
}
function render() {
  if (state.appVersion !== '0.4.3') throw new Error('The app files were updated. Restart ScopePay to load the matching server version.');
  const aiLabel = { offline: 'AI offline', ollama: 'Ollama', 'local-embeddings': 'Local semantic AI' }[state.aiMode] || 'AI unavailable';
  $('#connection').textContent = `${state.paypalMode === 'mock' ? 'Mock payments' : 'PayPal sandbox'} · ${aiLabel}`;
  $('#mode-notice').textContent = `${state.paypalMode === 'mock' ? 'Payment simulation — no PayPal API calls or money movement.' : 'PayPal sandbox only. ' + (state.paypalConfigured ? 'Provider responses determine payment status.' : 'Sandbox credentials are missing.')} ${state.aiMode === 'offline' ? 'AI is off; review candidates manually.' : 'AI finds related clauses. You decide what is billable.'}`;
  const step = current?.clientResponse?.decision === 'accepted' || current?.invoice ? 4 : current?.approval ? 3 : current ? 2 : 1;
  $('#step-number').textContent = `0${step} / 04`;
  document.querySelectorAll('[data-step]').forEach(element => { element.setAttribute('aria-current', Number(element.dataset.step) === step ? 'step' : 'false'); element.classList.toggle('complete', Number(element.dataset.step) < step); });
  $('#empty').hidden = !!current; $('#approval-form').hidden = !current || !!current.approval; $('#approved').hidden = !current?.approval;
  $('#review-label').textContent = current?.approval ? `Frozen proposal · revision ${current.revisionNumber || 1}` : current ? `Review revision ${current.revisionNumber || 1}` : 'Awaiting sources';
  $('#revision-notice').hidden = !draftParentId && !current?.parentId;
  if (!$('#revision-notice').hidden) $('#revision-notice').textContent = draftParentId ? 'Revising a previous proposal. Update the request below, then compare again. The old proposal and its client response remain preserved.' : `Revision ${current.revisionNumber}: linked to the previous proposal. The client must accept this new price and scope separately.`;
  if (current) {
    $('#analysis-note').textContent = `${current.mode === 'offline' ? 'Offline review: no AI inference. ' : 'AI-assisted evidence retrieval. '}Read the source, then decide which requests change the agreement.${current.model ? ` Model: ${current.model}.` : ''}`;
    $('#items').innerHTML = current.items.map(renderItem).join('');
    if (current.approval) {
      const a = current.approval;
      $('#approved').innerHTML = `<h3>Scope reviewed. Price set.</h3><p class="helper">A fixed revision for client review. ${escape(new Date(a.at).toLocaleString('en-GB'))}.</p>${a.items.map(item => `<div class="change"><div class="proposal-line"><strong>${escape(item.title)}</strong><strong>${money(item.cents)}</strong></div><p>${escape(item.rationale || '')}</p><details><summary>Source evidence</summary><blockquote>${escape(item.scopeQuote)}</blockquote><p class="quote-label">Client request</p><blockquote>${escape(item.requestQuote)}</blockquote></details></div>`).join('')}${noCharge(a)}<div class="total"><span>Additional work · USD</span><strong>${money(a.totalCents)}</strong></div><p class="helper">Recipient: ${escape(a.recipient)}</p><details class="audit-details"><summary>Revision & evidence record</summary><p class="invoice-meta">Approval SHA-256<br>${escape(a.hash)}</p></details>`;
    }
  }
  restoreDraft(); renderClient(); renderInvoice();
  $('#history').innerHTML = state.records.length ? [...state.records].reverse().map((record, i) => `<button type="button" data-review="${escape(record.id)}" aria-current="${record.id === current?.id}">${escape(new Date(record.createdAt).toLocaleTimeString('en-GB'))} · ${escape(record.invoice?.status || (record.clientResponse?.decision === 'accepted' ? 'Client accepted' : record.clientResponse?.decision === 'declined' ? 'Changes requested' : record.approval ? 'Client review' : 'Review'))} · ${state.records.length - i}</button>`).join('') : '<p class="helper">Your reviewed changes will appear here.</p>';
}
function renderClient() {
  $('#client-panel').hidden = !current?.approval; if (!current?.approval) return;
  const response = current.clientResponse;
  $('#client-status').textContent = current.supersededBy ? 'Replaced by a newer revision' : current.withdrawn ? 'Withdrawn' : response?.decision === 'accepted' ? 'Accepted locally' : response?.decision === 'declined' ? 'Changes requested' : 'Awaiting client response';
  $('#client-description').textContent = 'Review the exact scope, price, and included work in a separate client view. This local prototype records the response without authenticating the respondent. No message is sent.';
  $('#client-actions').innerHTML = `${current.proposalToken ? `<a class="button-link" id="client-link" href="/proposal/${escape(current.proposalToken)}" target="_blank" rel="noopener">Open client review ↗</a>` : '<button class="secondary" data-action="proposal">Prepare client review link</button>'}<button class="secondary" data-local-action="refresh-client">Refresh client response</button>${!response && !current.withdrawn ? '<button class="text-button" data-action="withdraw">Withdraw proposal</button>' : ''}<button class="text-button" data-local-action="download">Download change order</button><button class="text-button" data-local-action="receipt">Export evidence receipt</button>`;
  $('#client-response').innerHTML = response ? `<p class="response-note"><strong>${response.decision === 'accepted' ? 'Accepted' : 'Changes requested'}</strong> by ${escape(response.name)} · ${escape(new Date(response.at).toLocaleString('en-GB'))}${response.note ? `<br>${escape(response.note)}` : ''}<br><span class="helper">Self-reported name; identity not verified. Response bound to this proposal revision.</span></p>` : '';
  if ((current.withdrawn || response?.decision === 'declined') && !current.supersededBy) $('#client-actions').insertAdjacentHTML('beforeend', '<button class="secondary" data-local-action="revise">Revise this proposal →</button>');
}
function renderInvoice() {
  const invoice = current?.invoice; $('#invoice-details').textContent = ''; $('#invoice-actions').textContent = '';
  if (!current?.approval) { $('#invoice-description').textContent = 'Review and price the extra work first.'; return; }
  if (!invoice && (current.withdrawn || current.clientResponse?.decision !== 'accepted')) { $('#invoice-description').textContent = current.withdrawn ? 'Proposal withdrawn. Compare again to create a new revision.' : current.clientResponse?.decision === 'declined' ? 'Client requested changes. Create a new revision; nothing has been invoiced.' : 'Waiting for the client to accept this exact scope and price.'; return; }
  if (!invoice) {
    $('#invoice-description').textContent = current.createUncertain ? 'Create outcome uncertain. Reconcile in PayPal sandbox before retrying.' : `${money(current.approval.totalCents)} · client accepted · ${state.paypalMode === 'mock' ? 'mock invoice' : 'sandbox invoice'} ready`;
    if (!current.createUncertain) $('#invoice-actions').innerHTML = '<button class="secondary" data-action="invoice">Create draft invoice →</button>';
    else $('#invoice-details').innerHTML = `<p class="helper">Find invoice <strong>SP-${escape(current.id.replaceAll('-', '').slice(0, 20))}</strong> in the PayPal sandbox dashboard. This check only reads the existing invoice; it does not create or charge anything.</p><form id="reconcile-form"><label for="reconcile-id">Existing sandbox invoice ID</label><input id="reconcile-id" type="text" required maxlength="110" placeholder="INV2-…"><button type="submit" class="secondary">Verify & recover existing invoice</button></form>`;
    return;
  }
  $('#invoice-description').textContent = `${invoice.mode === 'mock' ? 'SIMULATION' : 'SANDBOX'} · ${invoice.status.replaceAll('_', ' ')} · ${invoice.settled ? 'Fully paid' : 'Not settled'}`;
  $('#invoice-actions').innerHTML = `${invoice.status === 'DRAFT' ? '<button class="secondary" data-action="send">Issue invoice (no email) →</button>' : ''}<button class="secondary" data-action="refresh">Refresh status</button>`;
  $('#invoice-details').innerHTML = `<details><summary>Invoice reference</summary><p class="invoice-meta">${escape(invoice.id)}<br>Checked: ${escape(invoice.checkedAt)}</p></details>${invoice.url ? `<a class="button-link" target="_blank" rel="noopener noreferrer" href="${escape(invoice.url)}">Open PayPal sandbox invoice ↗</a>` : ''}${invoice.mode === 'mock' && invoice.status !== 'DRAFT' ? '<details class="simulation-tools"><summary>Demo controls · simulated payments only</summary><button class="secondary" data-simulate="PARTIALLY_PAID">Simulate partial payment</button><button class="secondary" data-simulate="PAYMENT_PENDING">Simulate pending</button><button class="secondary" data-simulate="PAID">Simulate fully paid</button></details>' : ''}`;
  if (invoice.bindingVerified) $('#invoice-details').insertAdjacentHTML('beforeend', '<p class="helper">Invoice fields match this frozen scope, recipient and amount.</p>');
}
function decisions() { return [...document.querySelectorAll('[data-decision]')].map(input => ({ id: input.dataset.decision, disposition: input.value })); }
function selected() { return decisions().filter(item => item.disposition === 'additional').map(item => ({ id: item.id, amount: $(`[data-price="${item.id}"]`).value, title: $(`[data-title="${item.id}"]`).value, rationale: $(`[data-rationale="${item.id}"]`).value })); }
function updateDecisions() {
  for (const item of decisions()) { const fields = $(`[data-fields="${item.id}"]`); fields.hidden = item.disposition !== 'additional'; fields.querySelectorAll('input,textarea').forEach(input => input.required = !fields.hidden); }
  $('#total').textContent = money(selected().reduce((sum, item) => sum + (/^\d{1,5}\.\d{2}$/.test(item.amount) ? Number(item.amount.replace('.', '')) : 0), 0));
  const list = decisions(); $('#decision-summary').textContent = `${list.filter(item => item.disposition === 'additional').length} additional · ${list.filter(item => item.disposition === 'included').length} included · ${list.filter(item => item.disposition === 'clarify').length} to clarify · ${list.filter(item => !item.disposition).length} unreviewed`;
}
document.addEventListener('input', () => { updateDecisions(); saveDraft(); }); document.addEventListener('change', () => { updateDecisions(); saveDraft(); });
$('#sample').addEventListener('click', () => {
  $('#scope').value = 'Build a five-page portfolio website: Home, About, Work, Services, and Contact. Includes one contact form and two rounds of copy revisions. An online store, multilingual content, and booking integrations are not included.';
  $('#request').value = 'Can you also add an online store for 12 prints?\nPlease connect Calendly so visitors can book a call.\nCan we change the About page headline in our second revision?';
});
$('#review-form').addEventListener('submit', event => { event.preventDefault(); work(async () => { const label = $('#analyze').textContent; $('#analyze').textContent = 'Finding related clauses…'; try { const record = await api('/api/reviews', { scope: $('#scope').value, request: $('#request').value, parentId: draftParentId || (!current?.approval ? current?.parentId : null) }); draftParentId = null; $('#confirmed').checked = false; $('#recipient').value = ''; await reload(record.id); updateDecisions(); } finally { $('#analyze').textContent = label; } }); });
$('#approval-form').addEventListener('submit', event => { event.preventDefault(); work(async () => {
  if ($('#scope').value.trim() !== current.scope || $('#request').value.trim() !== current.request) throw new Error('The source text changed. Compare the scope again before approving a new revision.');
  await api(`/api/reviews/${current.id}/approve`, { confirmed: $('#confirmed').checked, recipient: $('#recipient').value, items: selected(), decisions: decisions() }); await reload(); $('#client-panel').scrollIntoView({ block: 'center' });
}); });
function downloadChangeOrder() {
  const a = current.approval;
  const lines = ['# ScopePay change order', '', `Revision: ${a.hash}`, `Recipient: ${a.recipient}`, '', ...a.items.flatMap(item => [`## ${item.title}`, `${money(item.cents)} USD`, item.rationale || '', '', `Original scope: ${item.scopeQuote}`, `Client request: ${item.requestQuote}`, '']), `Total additional work: ${money(a.totalCents)} USD`, '', ...(a.reviewed || []).filter(item => item.disposition !== 'additional').map(item => `${item.disposition === 'included' ? 'Included, no extra charge' : 'Needs clarification, not billed'}: ${item.requestQuote}`), '', `Client response: ${current.clientResponse?.decision || 'pending'}`, 'Local prototype; respondent identity is not authenticated.'];
  const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/markdown' })); const link = document.createElement('a'); link.href = url; link.download = `ScopePay-${current.id.slice(0, 8)}.md`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
document.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  if (button.dataset.review) work(async () => { saveDraft(); draftParentId = null; $('#confirmed').checked = false; $('#recipient').value = ''; await reload(button.dataset.review); updateDecisions(); });
  if (button.dataset.localAction === 'revise') { draftParentId = current.id; $('#scope').value = current.scope; $('#request').value = current.request; render(); $('#sources').scrollIntoView({ block: 'start' }); $('#request').focus(); }
  if (button.dataset.localAction === 'refresh-client') work(async () => { await reload(); });
  if (button.dataset.localAction === 'download') downloadChangeOrder();
  if (button.dataset.localAction === 'receipt') work(async () => {
    const receipt = await api(`/api/reviews/${current.id}/receipt`);
    const blobUrl = URL.createObjectURL(new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = blobUrl; link.download = `ScopePay-evidence-${current.id.slice(0, 8)}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  });
  if (button.dataset.action || button.dataset.simulate) work(async () => { await api(`/api/reviews/${current.id}/${button.dataset.action || 'simulate'}`, button.dataset.simulate ? { status: button.dataset.simulate } : {}); await reload(); });
});
document.addEventListener('submit', event => { if (event.target.id !== 'reconcile-form') return; event.preventDefault(); work(async () => { await api(`/api/reviews/${current.id}/reconcile`, { invoiceId: $('#reconcile-id').value.trim() }); await reload(); }); });
work(async () => { state = await api('/api/state'); current = state.records.at(-1); if (current) { $('#scope').value = current.scope; $('#request').value = current.request; } render(); });
