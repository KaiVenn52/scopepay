import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { approve, digest, invoicePayload, assertApprovalIntegrity } from '../lib/core.mjs';
import { verifyInvoiceBinding } from '../lib/recovery.mjs';
import { createApp } from '../server.mjs';

function fixture() {
  const scope = 'No online store.', request = 'Please add a store.';
  const record = { id: 'e322c3d0-a69a-4432-a3cb-8ff87962f7da', scope, request, sourceHash: digest({ scope, request }), items: [{ id: 'line', title: 'Add store', scopeQuote: scope, requestQuote: request, classification: 'unclear' }] };
  record.approval = approve(record, { confirmed: true, recipient: 'buyer@example.test', items: [{ id: 'line', amount: '240.00' }] });
  const raw = { ...invoicePayload(record, 'merchant@example.test'), id: 'INV2-AAAA-BBBB', status: 'PAID', amount: { currency_code: 'USD', value: '240.00' } };
  return { record, raw };
}
test('invoice recovery compares a full provider response to the frozen proposal', () => {
  const { raw, record } = fixture(); const result = verifyInvoiceBinding(raw, record, 'merchant@example.test', raw.id);
  assert.equal(result.bindingVerified, true); assert.equal(result.settled, true);
  raw.status = 'PARTIALLY_PAID'; assert.equal(verifyInvoiceBinding(raw, record, 'merchant@example.test', raw.id).settled, false);
});
test('wrong reference, recipient, merchant, currency, amount, description, quantity and lines fail closed', () => {
  const changes = [
    raw => raw.detail.reference = 'other-proposal', raw => raw.detail.invoice_number = 'other-number',
    raw => raw.primary_recipients[0].billing_info.email_address = 'other@example.test', raw => raw.invoicer.email_address = 'other@example.test',
    raw => raw.amount.currency_code = 'EUR', raw => raw.amount.value = '240.01', raw => raw.items[0].name = 'Other work',
    raw => raw.items[0].description = 'Other request', raw => raw.items[0].quantity = '2', raw => raw.items[0].unit_amount.value = '12.00',
    raw => raw.items.push(structuredClone(raw.items[0])), raw => raw.id = 'INV2-WRONG-ID'
  ];
  for (const change of changes) { const { raw, record } = fixture(); change(raw); assert.throws(() => verifyInvoiceBinding(raw, record, 'merchant@example.test', 'INV2-AAAA-BBBB')); }
});
test('proposal content and original source changes invalidate the frozen fingerprint', () => {
  const { record } = fixture(); record.approval.items[0].cents = 1;
  assert.throws(() => assertApprovalIntegrity(record), /frozen proposal content changed/);
  const other = fixture().record; other.scope = 'A different agreement.';
  assert.throws(() => assertApprovalIntegrity(other), /source record changed/);
});

async function harness(env = {}, fetcher = fetch) {
  const directory = await mkdtemp(path.join(tmpdir(), 'scopepay-recovery-'));
  let server, base;
  async function start() { server = await createApp({ env, fetcher, directory }); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); base = `http://127.0.0.1:${server.address().port}`; }
  const post = async (route, body) => { const response = await fetch(base + route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return { status: response.status, body: await response.json() }; };
  const get = async route => (await fetch(base + route)).json();
  const review = async extra => (await post('/api/reviews', { scope: 'No store.', request: 'Add a store.', ...extra })).body;
  const approveReview = async record => post(`/api/reviews/${record.id}/approve`, { confirmed: true, recipient: 'buyer@example.test', items: [{ id: record.items[0].id, amount: '1.00' }] });
  const respond = async (record, decision) => post(`/api/proposals/${record.proposalToken}/respond`, { name: 'Example Client', decision, confirmed: true, note: decision === 'declined' ? 'Please revise the deliverable.' : '', hash: record.approval.hash });
  await start(); return { post, get, review, approveReview, respond, restart: async () => { await new Promise(resolve => server.close(resolve)); await start(); }, close: async () => { if (server?.listening) await new Promise(resolve => server.close(resolve)); await rm(directory, { recursive: true, force: true }); } };
}
const sandbox = { PAYPAL_MODE: 'sandbox', PAYPAL_CLIENT_ID: 'test-only', PAYPAL_CLIENT_SECRET: 'test-only', PAYPAL_MERCHANT_EMAIL: 'merchant@example.test' };
test('uncertain create recovers by read only after restart; mismatched paid invoice cannot close the case', async () => {
  const calls = []; let raw, wrongAmount = false;
  const fetcher = async (url, options) => {
    calls.push({ url, method: options.method });
    if (url.endsWith('/token')) return Response.json({ access_token: 'injected-test-token' });
    if (options.method === 'POST') { raw = { ...JSON.parse(options.body), id: 'INV2-RECOVER-TEST', status: 'PARTIALLY_PAID', amount: { currency_code: 'USD', value: '1.00' } }; throw new Error('Response lost after remote create'); }
    return Response.json({ ...raw, amount: { currency_code: 'USD', value: wrongAmount ? '9.00' : '1.00' } });
  };
  const app = await harness(sandbox, fetcher);
  try {
    const record = (await app.approveReview(await app.review())).body; await app.respond(record, 'accepted'); const route = `/api/reviews/${record.id}`;
    assert.equal((await app.post(`${route}/invoice`, {})).status, 500); await app.restart();
    wrongAmount = true; assert.equal((await app.post(`${route}/reconcile`, { invoiceId: raw.id })).status, 409);
    assert.equal((await app.get('/api/state')).records[0].invoice, null);
    wrongAmount = false; const recovered = await app.post(`${route}/reconcile`, { invoiceId: raw.id });
    assert.equal(recovered.status, 200); assert.equal(recovered.body.createUncertain, false); assert.equal(recovered.body.invoice.settled, false);
    assert.equal(calls.filter(call => call.url.includes('/invoicing/') && call.method === 'POST').length, 1);
    raw.status = 'PAID'; wrongAmount = true; assert.equal((await app.post(`${route}/refresh`, {})).status, 409);
    assert.equal((await app.get('/api/state')).records[0].invoice.settled, false);
    wrongAmount = false; assert.equal((await app.post(`${route}/refresh`, {})).body.invoice.settled, true);
  } finally { await app.close(); }
});
test('failed OAuth does not mark creation uncertain because no invoice write was attempted', async () => {
  let writes = 0;
  const app = await harness(sandbox, async (url, options) => { if (url.endsWith('/token')) return new Response('{}', { status: 401 }); if (options.method === 'POST') writes++; throw new Error('unexpected invoice request'); });
  try { const record = (await app.approveReview(await app.review())).body; await app.respond(record, 'accepted');
    assert.equal((await app.post(`/api/reviews/${record.id}/invoice`, {})).status, 502);
    assert.equal((await app.get('/api/state')).records[0].createUncertain, false); assert.equal(writes, 0);
  } finally { await app.close(); }
});
test('a declined proposal can be revised once; replacing it invalidates its old client link for acceptance', async () => {
  const app = await harness();
  try {
    const parent = (await app.approveReview(await app.review())).body;
    assert.equal((await app.post('/api/reviews', { scope: parent.scope, request: parent.request, parentId: parent.id })).status, 409);
    await app.respond(parent, 'declined');
    const child = await app.review({ parentId: parent.id }); const sibling = await app.review({ parentId: parent.id });
    assert.equal(child.revisionNumber, 2); assert.equal(child.parentId, parent.id);
    const replacement = (await app.approveReview(child)).body;
    assert.equal((await app.approveReview(sibling)).status, 409);
    assert.equal((await app.get(`/api/proposals/${parent.proposalToken}`)).superseded, true);
    assert.equal((await app.respond(parent, 'accepted')).status, 409);
    assert.equal((await app.post(`/api/reviews/${parent.id}/invoice`, {})).status, 409);
    assert.equal((await app.post(`/api/reviews/${child.id}/invoice`, {})).status, 409);
    await app.respond(replacement, 'accepted'); assert.equal((await app.post(`/api/reviews/${child.id}/invoice`, {})).status, 200);
  } finally { await app.close(); }
});
