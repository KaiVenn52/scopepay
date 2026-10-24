import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { localDate } from '../lib/time.mjs';
import { requireValue } from '../lib/core.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const base = 'http://127.0.0.1:3187';
const output = path.join(root, 'evidence', 'iterations', localDate());
await mkdir(output, { recursive: true });
const actions = [];
const report = { date: localDate(), kind: 'Actual account-backed PayPal sandbox integration; synthetic scope and local client response', actions, buyerPaymentValidated: false };
let reviewId;
async function api(route, body) {
  const response = await fetch(base + route, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  actions.push({ action: route.split('/').at(-1), method: body === undefined ? 'GET' : 'POST', httpStatus: response.status });
  if (!response.ok) throw new Error(data.error || 'Local sandbox operation failed.');
  return data;
}
try {
  requireValue(typeof process.env.PAYPAL_SANDBOX_BUYER_EMAIL === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.PAYPAL_SANDBOX_BUYER_EMAIL), 'Set the personal sandbox buyer email in the ignored local configuration.');
  let state = await api('/api/state');
  requireValue(state.paypalMode === 'sandbox' && state.paypalConfigured && state.aiMode === 'local-embeddings', 'Start the configured sandbox service with real local AI on port 3187.');
  const scope = 'ScopePay sandbox verification: build a five-page portfolio website. Includes one contact form and two rounds of copy revisions. An online store and booking integrations are not included.';
  const request = 'Can you add a store for 12 prints?\nPlease connect Calendly so visitors can book a call.\nCan we change the About page headline in our second revision?';
  const matches = state.records.filter(record => record.scope === scope && record.request === request);
  requireValue(matches.length <= 1, 'Multiple matching sandbox reviews exist; inspect them before continuing.');
  let record = matches[0] || await api('/api/reviews', { scope, request });
  reviewId = record.id;
  if (record.approval) requireValue(record.approval.recipient.toLowerCase() === process.env.PAYPAL_SANDBOX_BUYER_EMAIL.toLowerCase(), 'The existing proposal uses a different sandbox buyer. Inspect it before continuing.');
  if (!record.approval) record = await api(`/api/reviews/${record.id}/approve`, { confirmed: true,
    recipient: process.env.PAYPAL_SANDBOX_BUYER_EMAIL,
    decisions: record.items.map((item, index) => ({ id: item.id, disposition: ['additional', 'clarify', 'included'][index] })),
    items: [{ id: record.items[0].id, amount: '240.00', title: 'Add a 12-product print store', rationale: 'The agreed scope excludes an online store. This adds a product catalog and checkout flow.' }] });
  if (!record.clientResponse) {
    await api(`/api/proposals/${record.proposalToken}/respond`, { hash: record.approval.hash, decision: 'accepted', name: 'Sandbox test client', confirmed: true });
    state = await api('/api/state'); record = state.records.find(candidate => candidate.id === reviewId);
  }
  requireValue(record.clientResponse?.decision === 'accepted', 'The sandbox test proposal is not accepted.');
  requireValue(!record.createUncertain, 'Sandbox creation is uncertain. Use read-only reconciliation; do not create another invoice.');
  if (!record.invoice) record = await api(`/api/reviews/${record.id}/invoice`, {});
  report.invoiceCreated = true; report.invoiceId = record.invoice.id;
  if (record.invoice.status === 'DRAFT') record = await api(`/api/reviews/${record.id}/send`, {});
  record = await api(`/api/reviews/${record.id}/refresh`, {});
  report.result = 'INVOICE_VERIFIED'; report.status = record.invoice.status;
  report.providerPaidStatusObserved = record.invoice.status === 'PAID';
  report.bindingVerified = record.invoice.bindingVerified === true;
  report.paymentLinkAvailable = !!record.invoice.url;
  report.totalCents = record.approval.totalCents; report.currency = record.approval.currency;
  report.clientIdentityVerified = false;
  const receipt = await api(`/api/reviews/${record.id}/receipt`);
  await writeFile(path.join(output, 'actual-sandbox-receipt.json'), JSON.stringify(receipt, null, 2));
} catch (error) {
  report.result = 'INCOMPLETE';
  report.error = error.message.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+/g, '[email omitted]').slice(0, 600);
  process.exitCode = 2;
} finally {
  if (reviewId) report.localReviewId = reviewId;
  const lines = await readFile(path.join(root, 'data', 'sandbox', 'provider-log.jsonl'), 'utf8').catch(() => '');
  report.providerRequests = lines.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
  await writeFile(path.join(output, 'actual-sandbox-integration.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
