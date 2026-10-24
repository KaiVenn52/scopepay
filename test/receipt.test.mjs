import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { approve, digest } from '../lib/core.mjs';
import { evidenceReceipt, verifyReceipt } from '../lib/receipt.mjs';
import { createApp } from '../server.mjs';

function fixture() {
  const scope = 'PRIVATE-AGREEMENT excludes stores.', request = 'PRIVATE-REQUEST add a store.';
  const record = { id: 'e322c3d0-a69a-4432-a3cb-8ff87962f7da', scope, request, sourceHash: digest({ scope, request }), mode: 'offline',
    model: 'PRIVATE-MODEL', proposalToken: 'PRIVATE-ACCESS-TOKEN', items: [{ id: 'line', title: 'PRIVATE-TITLE', scopeQuote: scope, requestQuote: request, classification: 'unclear' }] };
  record.approval = approve(record, { confirmed: true, recipient: 'private-buyer@example.test', items: [{ id: 'line', amount: '240.00', rationale: 'PRIVATE-RATIONALE' }] });
  record.clientResponse = { decision: 'accepted', hash: record.approval.hash, name: 'PRIVATE-NAME', note: 'PRIVATE-NOTE' };
  record.invoice = { id: 'MOCK-PRIVATE-INVOICE', status: 'PAID', mode: 'mock', url: 'https://private-invoice.test/token', checkedAt: '2026-10-22T00:00:00Z' };
  return record;
}
test('receipt omits private text and access data while preserving totals and a verifiable checksum', () => {
  const receipt = evidenceReceipt(fixture(), 'test');
  const encoded = JSON.stringify(receipt);
  for (const secret of ['PRIVATE-', 'private-buyer', 'private-invoice.test', 'example.test']) assert.ok(!encoded.includes(secret));
  assert.equal(receipt.proposal.totalCents, 24000);
  assert.equal(receipt.invoice.paymentEvidence, 'simulation-only');
  assert.equal(receipt.invoice.realMoneyEvidence, false);
  assert.equal(receipt.client.identityVerified, false);
  const { checksum, ...content } = JSON.parse(encoded);
  assert.equal(verifyReceipt(JSON.parse(encoded)).authenticated, false);
  assert.equal(checksum.value, digest(content));
  content.proposal.totalCents = 1;
  assert.notEqual(checksum.value, digest(content));
  assert.throws(() => verifyReceipt({ ...content, checksum }), /checksum/);
});
test('sandbox and partial snapshots never become independent payment attestations', () => {
  const record = fixture(); record.invoice.mode = 'sandbox';
  assert.equal(evidenceReceipt(record, 'test').invoice.fullyPaidInStoredSnapshot, false);
  record.invoice.bindingVerified = true;
  assert.equal(evidenceReceipt(record, 'test').invoice.fullyPaidInStoredSnapshot, true);
  assert.match(evidenceReceipt(record, 'test').invoice.paymentEvidence, /not independently attested/);
  for (const status of ['PARTIALLY_PAID', 'PAYMENT_PENDING', 'MARKED_AS_PAID', 'REFUNDED']) {
    record.invoice.status = status;
    assert.equal(evidenceReceipt(record, 'test').invoice.fullyPaidInStoredSnapshot, false);
  }
});
test('superseded, withdrawn and unaccepted revisions cannot export an active accepted payment', () => {
  for (const mutate of [r => r.supersededBy = 'next', r => r.withdrawn = true, r => r.clientResponse.decision = 'declined', r => r.clientResponse = null]) {
    const record = fixture(); mutate(record);
    const receipt = evidenceReceipt(record, 'test');
    assert.equal(receipt.client.acceptedActiveRevision, false);
    assert.equal(receipt.invoice.fullyPaidInStoredSnapshot, false);
  }
});
test('receipt refuses changed sources, changed approvals and responses for other revisions', () => {
  for (const mutate of [r => r.scope += 'changed', r => r.approval.totalCents = 1, r => r.clientResponse.hash = 'wrong']) {
    const record = fixture(); mutate(record); assert.throws(() => evidenceReceipt(record, 'test'));
  }
});
test('HTTP receipt export reads persisted state without invoking a provider or changing records', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'scopepay-receipt-'));
  const record = fixture(); let calls = 0;
  await writeFile(path.join(directory, 'records.json'), JSON.stringify({ records: [record] }));
  const server = await createApp({ env: {}, directory, fetcher: () => { calls++; throw new Error('must not fetch'); } });
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const response = await fetch(`${base}/api/reviews/${record.id}/receipt`);
    assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal((await response.json()).invoice.paymentEvidence, 'simulation-only');
    const state = await (await fetch(base + '/api/state')).json();
    assert.deepEqual(state.records, [record]); assert.equal(calls, 0);
    assert.equal((await fetch(`${base}/api/reviews/0000/receipt`)).status, 404);
  } finally { await new Promise(resolve => server.close(resolve)); await rm(directory, { recursive: true, force: true }); }
});
