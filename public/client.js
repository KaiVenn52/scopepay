const $ = selector => document.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value / 100);
const token = location.pathname.split('/').at(-1);
let proposal, busy = false;
async function request(path, body) {
  const response = await fetch(`/api/proposals/${token}${path}`, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
  const result = await response.json(); if (!response.ok) throw new Error(result.error); return result;
}
function render() {
  const a = proposal.approval;
  const included = (a.reviewed || []).filter(item => item.disposition === 'included');
  const clarify = (a.reviewed || []).filter(item => item.disposition === 'clarify');
  $('#proposal-content').innerHTML = `<div class="section-heading"><h2>Your change order</h2><span>USD · fixed revision</span></div><p class="helper">Prepared for ${escape(a.recipient)}</p>${a.items.map(item => `<article class="client-line"><div class="proposal-line"><h3>${escape(item.title)}</h3><strong>${money(item.cents)}</strong></div><p>${escape(item.rationale || 'Additional work reviewed against the original agreement.')}</p><details><summary>Why this is a change · source evidence</summary><p class="quote-label">Original agreement</p><blockquote>${escape(item.scopeQuote)}</blockquote><p class="quote-label">Your request</p><blockquote>${escape(item.requestQuote)}</blockquote></details></article>`).join('')}${included.length ? `<div class="no-charge"><h3>Already included. No extra charge.</h3>${included.map(item => `<p>${escape(item.requestQuote)}</p>`).join('')}</div>` : ''}${clarify.length ? `<div class="no-charge muted"><h3>For a separate conversation. Not billed.</h3>${clarify.map(item => `<p>${escape(item.requestQuote)}</p>`).join('')}</div>` : ''}<div class="total"><span>Total additional work · USD</span><strong>${money(a.totalCents)}</strong></div><details class="audit-details"><summary>Exact revision</summary><p class="invoice-meta">${escape(a.hash)}</p><p class="helper">Your response is bound to this fixed scope and price.</p></details>`;
  $('#proposal-content .section-heading span').textContent = `Revision ${proposal.revisionNumber || 1} · USD`;
  const response = proposal.response;
  $('#respond-panel').hidden = !!response || proposal.withdrawn || proposal.superseded;
  $('#response-result').hidden = !response && !proposal.withdrawn && !proposal.superseded;
  if (proposal.superseded) $('#response-result').innerHTML = '<h2>A newer revision replaces this proposal.</h2><p>Ask for the current client review link. This older proposal cannot be accepted or invoiced.</p>';
  else if (proposal.withdrawn) $('#response-result').innerHTML = '<h2>This proposal has been withdrawn.</h2><p>Ask for an updated revision. Nothing has been invoiced from this proposal.</p>';
  else if (response) $('#response-result').innerHTML = `<h2>${response.decision === 'accepted' ? 'Scope agreed. Thank you.' : 'Changes requested. No invoice created.'}</h2><p>${escape(response.name)} · ${escape(new Date(response.at).toLocaleString('en-GB'))}</p>${response.note ? `<p>${escape(response.note)}</p>` : ''}<p class="helper">${response.decision === 'accepted' ? 'The freelancer can now create the invoice. Accepting this proposal did not make a payment.' : 'The freelancer can prepare a new revision for you to review.'} Self-reported identity; not verified.</p>${proposal.invoice?.url ? `<a class="button-link" target="_blank" rel="noopener noreferrer" href="${escape(proposal.invoice.url)}">View PayPal sandbox invoice ↗</a>` : ''}`;
}
async function work(task) {
  if (busy) return; busy = true; $('#client-error').hidden = true; document.querySelectorAll('button').forEach(button => button.disabled = true);
  try { await task(); } catch (error) { $('#client-error').textContent = error.message; $('#client-error').hidden = false; $('#client-error').scrollIntoView({ block: 'center' }); }
  finally { busy = false; document.querySelectorAll('button').forEach(button => button.disabled = false); }
}
$('#response-form').addEventListener('submit', event => { event.preventDefault(); const decision = event.submitter?.value; work(async () => {
  if (decision === 'accepted' && !$('#accept-confirm').checked) throw new Error('Confirm the scope and price before accepting.');
  proposal = await request('/respond', { decision, name: $('#respondent').value, note: $('#client-note').value, confirmed: $('#accept-confirm').checked, hash: proposal.approval.hash }); render(); $('#response-result').scrollIntoView({ block: 'center' });
}); });
$('#reload').addEventListener('click', () => work(async () => { proposal = await request(''); render(); }));
$('#print').addEventListener('click', () => window.print());
work(async () => { proposal = await request(''); render(); });
