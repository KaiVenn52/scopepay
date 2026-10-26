import { test } from 'node:test';
import assert from 'node:assert/strict';
import { approve, validateAnalysis, invoicePayload, safeInvoice } from '../lib/core.mjs';
import { analyze, PayPal } from '../lib/providers.mjs';

const scope = 'A five-page site. No store.';
const request = 'Please add a store.';
const output = { items: [{ title: 'Add store', scopeQuote: 'No store.', requestQuote: request, classification: 'possible_change', reason: 'Store is excluded from the supplied scope.', price: 999, approved: true }] };
const record = () => ({ id: 'e322c3d0-a69a-4432-a3cb-8ff87962f7da', items: validateAnalysis(output, scope, request) });
const approval = record => ({ confirmed: true, recipient: 'buyer@example.test', items: [{ id: record.items[0].id, amount: '125.50' }] });

test('reject fabricated quotations and ignore model price/approval', () => {
  assert.throws(() => validateAnalysis({ items: [{ ...output.items[0], scopeQuote: 'All changes cost $999.' }] }, scope, request), /verbatim/);
  const item = record().items[0]; assert.equal(item.price, undefined); assert.equal(item.approved, undefined);
});
test('approval requires explicit confirmation, eligible items and exact positive cents', () => {
  const r = record(); const input = approval(r);
  assert.throws(() => approve(r, { ...input, confirmed: false }), /confirm/);
  for (const amount of ['0.00', '-1.00', '1e3', '12.345', '100000.00', '12', 12]) assert.throws(() => approve(r, { ...input, items: [{ id: r.items[0].id, amount }] }));
  assert.throws(() => approve(r, { ...input, items: [input.items[0], input.items[0]] }));
  r.items[0].classification = 'included'; assert.throws(() => approve(r, input), /already-included/);
});
test('approved content freezes cents and PayPal payload reference', () => {
  const r = record(); r.approval = approve(r, approval(r));
  assert.equal(r.approval.totalCents, 12550); assert.equal(r.approval.hash.length, 64);
  assert.throws(() => approve(r, approval(r)), /already approved/);
  const payload = invoicePayload(r, 'merchant@example.test');
  assert.equal(payload.items[0].unit_amount.value, '125.50'); assert.equal(payload.items[0].quantity, '1');
  assert.equal(payload.detail.reference, r.approval.hash.slice(0, 40));
});
test('partial, pending and refunded statuses are never treated as settled', () => {
  for (const status of ['PARTIALLY_PAID', 'PAYMENT_PENDING', 'MARKED_AS_PAID', 'REFUNDED', 'SENT']) assert.equal(safeInvoice({ id: 'INV2-X', status }, 'sandbox').settled, false);
  assert.equal(safeInvoice({ id: 'INV2-X', status: 'PAID' }, 'sandbox').settled, true);
  assert.equal(safeInvoice({ id: 'x', status: 'SENT', detail: { metadata: { recipient_view_url: 'https://evil.example/a' } } }, 'sandbox').url, null);
});
test('offline mode is explicitly non-AI and does not invent scope findings', async () => {
  const result = await analyze(scope, request, {}); assert.equal(result.mode, 'offline'); assert.equal(result.model, null);
  assert.equal(result.items[0].classification, 'unclear');
});
test('Ollama adapter validates real-shaped model output and rejects invented evidence', async () => {
  const env = { AI_MODE: 'ollama', OLLAMA_MODEL: 'test-model' };
  let sent;
  const fetcher = async (url, options) => { sent = JSON.parse(options.body); return new Response(JSON.stringify({ message: { content: JSON.stringify(output) } })); };
  const result = await analyze(scope, request, env, fetcher); assert.equal(result.mode, 'ollama'); assert.equal(sent.stream, false); assert.equal(sent.format, 'json');
  assert.equal(result.items[0].price, undefined);
  await assert.rejects(() => analyze(scope, request, env, async () => new Response(JSON.stringify({ message: { content: '{"items":[]}' } }))), /1–12/);
});
test('sandbox contract uses OAuth, draft creation, suppressed notifications and detail polling', async () => {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url: String(url), ...options });
    if (url.endsWith('/token')) return Response.json({ access_token: 'test-only-token' });
    if (url.endsWith('/send')) return new Response('', { status: 202 });
    if (options.method === 'POST') return Response.json({ href: 'https://api-m.sandbox.paypal.com/v2/invoicing/invoices/INV2-AAAA-BBBB' });
    return Response.json({ ...invoicePayload(r, 'merchant@example.test'), id: 'INV2-AAAA-BBBB', status: calls.some(call => call.url.endsWith('/send')) ? 'PARTIALLY_PAID' : 'DRAFT', amount: { currency_code: 'USD', value: '125.50' } });
  };
  const paypal = new PayPal({ PAYPAL_MODE: 'sandbox', PAYPAL_CLIENT_ID: 'test-id', PAYPAL_CLIENT_SECRET: 'test-secret', PAYPAL_MERCHANT_EMAIL: 'merchant@example.test' }, fetcher);
  const r = record(); r.approval = approve(r, approval(r));
  const invoice = await paypal.create(r); assert.equal(invoice.id, 'INV2-AAAA-BBBB');
  const sent = await paypal.send(invoice, r); assert.equal(sent.settled, false); assert.equal(sent.bindingVerified, true);
  const sendCall = calls.find(call => call.url.endsWith('/send'));
  assert.deepEqual(JSON.parse(sendCall.body), { send_to_recipient: false, send_to_invoicer: false });
  assert.ok(calls.every(call => call.url.startsWith('https://api-m.sandbox.paypal.com/')));
});
test('missing credentials and live modes fail closed', async () => {
  assert.throws(() => new PayPal({ PAYPAL_MODE: 'live' }), /Only mock and sandbox/);
  const r = record(); r.approval = approve(r, approval(r));
  await assert.rejects(() => new PayPal({ PAYPAL_MODE: 'sandbox' }).create(r), /not configured/);
});

test('issue retry reconciles remote state after a lost follow-up response without sending twice', async () => {
  const r = record(); r.approval = approve(r, approval(r));
  let sends = 0, details = 0;
  const paypal = new PayPal({ PAYPAL_MODE: 'sandbox', PAYPAL_CLIENT_ID: 'test', PAYPAL_CLIENT_SECRET: 'test', PAYPAL_MERCHANT_EMAIL: 'merchant@example.test' }, async (url, options) => {
    if (url.endsWith('/token')) return Response.json({ access_token: 'test-only' });
    if (url.endsWith('/send')) { sends++; return new Response(null, { status: 202 }); }
    details++;
    if (details === 2) throw new Error('Follow-up query timed out after successful issue');
    return Response.json({ ...invoicePayload(r, 'merchant@example.test'), id: 'INV2-AAAA-BBBB', status: sends ? 'UNPAID' : 'DRAFT', amount: { currency_code: 'USD', value: '125.50' } });
  });
  const stale = safeInvoice({ id: 'INV2-AAAA-BBBB', status: 'DRAFT' }, 'sandbox');
  await assert.rejects(() => paypal.send(stale, r), /timed out/);
  const recovered = await paypal.send(stale, r);
  assert.equal(sends, 1); assert.equal(recovered.status, 'UNPAID'); assert.equal(recovered.bindingVerified, true); assert.equal(recovered.settled, false);
});

test('issuing a locally stale draft never sends again when provider reports paid, pending or cancelled', async () => {
  const r = record(); r.approval = approve(r, approval(r));
  for (const status of ['PAID', 'PAYMENT_PENDING', 'CANCELLED', 'PARTIALLY_PAID']) {
    let writes = 0;
    const paypal = new PayPal({ PAYPAL_MODE: 'sandbox', PAYPAL_CLIENT_ID: 'test', PAYPAL_CLIENT_SECRET: 'test', PAYPAL_MERCHANT_EMAIL: 'merchant@example.test' }, async (url, options) => {
      if (url.endsWith('/token')) return Response.json({ access_token: 'test-only' });
      if (options.method !== 'GET') writes++;
      return Response.json({ ...invoicePayload(r, 'merchant@example.test'), id: 'INV2-AAAA-BBBB', status, amount: { currency_code: 'USD', value: '125.50' } });
    });
    const result = await paypal.send(safeInvoice({ id: 'INV2-AAAA-BBBB', status: 'DRAFT' }, 'sandbox'), r);
    assert.equal(writes, 0); assert.equal(result.status, status); assert.equal(result.settled, status === 'PAID');
  }
});
