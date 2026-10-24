import { createHash, randomUUID } from 'node:crypto';

export function requireValue(condition, message, status = 400) {
  if (!condition) throw Object.assign(new Error(message), { status });
}
export function text(value, label, max = 12000) {
  requireValue(typeof value === 'string' && value.trim().length > 0 && value.length <= max, `${label} must contain 1–${max} characters.`);
  return value.trim();
}
export const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function assertReviewSources(record) {
  if (record.sourceHash) requireValue(record.sourceHash === digest({ scope: record.scope, request: record.request }), 'The stored source record changed. Create a new review.', 409);
}
export function assertApprovalIntegrity(record) {
  requireValue(record.approval, 'A frozen approval is required.', 409);
  assertReviewSources(record);
  const { hash, at, ...content } = record.approval;
  requireValue(hash === digest(content), 'The frozen proposal content changed. Do not invoice this revision.', 409);
  if (record.approval.contractVersion >= 3) requireValue(record.approval.sourceHash === (record.sourceHash || null), 'Proposal and source fingerprints do not match.', 409);
}
export function validateAnalysis(output, scope, request) {
  requireValue(Array.isArray(output.items) && output.items.length > 0 && output.items.length <= 12, 'Analysis must contain 1–12 cited items.');
  return output.items.map(item => {
    const scopeQuote = text(item.scopeQuote, 'Scope quote', 2000);
    const requestQuote = text(item.requestQuote, 'Request quote', 2000);
    requireValue(scope.includes(scopeQuote) && request.includes(requestQuote), 'Analysis rejected: a quotation does not occur verbatim in the supplied material.', 422);
    requireValue(['included', 'possible_change', 'unclear'].includes(item.classification), 'Unknown classification.');
    // Ignore model-supplied prices, obligations, and approval flags.
    return { id: randomUUID(), title: text(item.title, 'Title', 120), scopeQuote, requestQuote,
      classification: item.classification, reason: text(item.reason, 'Reason', 1500) };
  });
}
export function approve(record, input) {
  requireValue(!record.approval, 'This revision is already approved. Create a new review to change it.', 409);
  requireValue(input.confirmed === true, 'Review and confirm scope, amount, and sandbox recipient first.');
  const recipient = text(input.recipient, 'Recipient', 254);
  requireValue(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient), 'Enter a valid sandbox recipient email.');
  requireValue(Array.isArray(input.items) && input.items.length > 0 && input.items.length <= record.items.length, 'Select at least one reviewed change.');
  const seen = new Set();
  const items = input.items.map(item => {
    const original = record.items.find(candidate => candidate.id === item.id);
    requireValue(original && !seen.has(item.id), 'Invalid or duplicate change.');
    requireValue(original.classification !== 'included' || (typeof item.rationale === 'string' && item.rationale.trim().length >= 10), 'Overriding an already-included suggestion requires a written reason.');
    seen.add(item.id);
    requireValue(typeof item.amount === 'string' && /^\d{1,5}\.\d{2}$/.test(item.amount), 'Each price must be a positive USD amount with two decimals, up to 99999.99.');
    const cents = Number(item.amount.replace('.', ''));
    requireValue(cents > 0 && cents <= 9999999, 'Each price must be greater than zero and at most 99999.99.');
    return { id: original.id, title: item.title ? text(item.title, 'Deliverable title', 120) : original.title,
      rationale: item.rationale ? text(item.rationale, 'Why this is additional', 1000) : 'Reviewed against the quoted scope and request.',
      scopeQuote: original.scopeQuote, requestQuote: original.requestQuote, cents };
  });
  const decisions = input.decisions || record.items.map(item => ({ id: item.id, disposition: seen.has(item.id) ? 'additional' : 'clarify' }));
  requireValue(Array.isArray(decisions) && decisions.length === record.items.length && new Set(decisions.map(item => item.id)).size === record.items.length, 'Review each request once.');
  const reviewed = decisions.map(decision => {
    const item = record.items.find(item => item.id === decision.id);
    requireValue(item && ['additional', 'included', 'clarify'].includes(decision.disposition), 'Choose a disposition for every request.');
    requireValue(seen.has(item.id) === (decision.disposition === 'additional'), 'Only reviewed additional work may be charged.');
    return { id: item.id, title: item.title, requestQuote: item.requestQuote, scopeQuote: item.scopeQuote, disposition: decision.disposition };
  });
  const content = { currency: 'USD', recipient, items, reviewed, totalCents: items.reduce((sum, item) => sum + item.cents, 0), contractVersion: 3,
    sourceHash: record.sourceHash || null, parentId: record.parentId || null, revisionNumber: record.revisionNumber || 1 };
  return { ...content, hash: digest(content), at: new Date().toISOString() };
}
export function invoicePayload(record, merchant) {
  requireValue(record.approval, 'Human approval is required.', 409);
  return {
    detail: { invoice_number: `SP-${record.id.replaceAll('-', '').slice(0, 20)}`, currency_code: 'USD',
      reference: record.approval.hash.slice(0, 40), note: 'ScopePay change order. Local prototype acceptance is recorded separately; respondent identity is not authenticated.',
      payment_term: { term_type: 'DUE_ON_RECEIPT' } },
    invoicer: { email_address: merchant }, primary_recipients: [{ billing_info: { email_address: record.approval.recipient } }],
    items: record.approval.items.map(item => ({ name: item.title, description: item.requestQuote.slice(0, 1000), quantity: '1', unit_amount: { currency_code: 'USD', value: (item.cents / 100).toFixed(2) } })),
    configuration: { partial_payment: { allow_partial_payment: false }, allow_tip: false }
  };
}
export function safeInvoice(raw, mode) {
  requireValue(raw && typeof raw.id === 'string' && typeof raw.status === 'string', 'Provider returned no invoice ID/status.', 502);
  const href = raw.detail?.metadata?.recipient_view_url;
  let url = null;
  if (href) {
    try { const parsed = new URL(href); if (parsed.protocol === 'https:' && (parsed.hostname === 'sandbox.paypal.com' || parsed.hostname.endsWith('.sandbox.paypal.com'))) url = parsed.href; } catch {}
  }
  return { id: raw.id, status: raw.status, mode, url, settled: raw.status === 'PAID', checkedAt: new Date().toISOString() };
}
