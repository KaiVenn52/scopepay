import { test } from 'node:test';
import assert from 'node:assert/strict';
import { approve } from '../lib/core.mjs';
import { respondToProposal, requireClientAcceptance, proposalView } from '../lib/proposals.mjs';

function fixture() {
  const record = { id: 'test', scope: 'PRIVATE DOCUMENT', request: 'PRIVATE FULL REQUEST', items: [
    { id: 'store', title: 'Add store?', classification: 'unclear', scopeQuote: 'No store.', requestQuote: 'Add a store.' },
    { id: 'copy', title: 'Change headline?', classification: 'unclear', scopeQuote: 'Two revisions.', requestQuote: 'Revise the headline.' }
  ] };
  record.approval = approve(record, { confirmed: true, recipient: 'buyer@example.test', items: [{ id: 'store', amount: '240.00', title: 'Add a 12-product print store', rationale: 'The original scope excludes an online store.' }], decisions: [{ id: 'store', disposition: 'additional' }, { id: 'copy', disposition: 'included' }] });
  return record;
}
test('reviewed decisions, edited deliverable and no-charge work are bound into proposal hash', () => {
  const record = fixture(); assert.equal(record.approval.items[0].title, 'Add a 12-product print store');
  assert.equal(record.approval.reviewed[1].disposition, 'included'); assert.equal(record.approval.totalCents, 24000);
  const other = fixture(); other.items[1].requestQuote = 'A different request.';
  const input = { confirmed: true, recipient: 'buyer@example.test', items: [{ id: 'store', amount: '240.00' }], decisions: [{ id: 'store', disposition: 'included' }, { id: 'copy', disposition: 'included' }] };
  delete other.approval; assert.throws(() => approve(other, input), /Only reviewed additional work/);
});
test('client acceptance requires exact hash and confirmation, with unverified identity explicitly recorded', () => {
  const record = fixture(); const input = { name: 'Example Client', decision: 'accepted', confirmed: true, hash: record.approval.hash };
  assert.throws(() => requireClientAcceptance(record), /Client acceptance/);
  assert.throws(() => respondToProposal(record, { ...input, hash: 'other' }), /revision/);
  assert.throws(() => respondToProposal(record, { ...input, confirmed: false }), /Confirm/);
  record.clientResponse = respondToProposal(record, input); requireClientAcceptance(record);
  assert.equal(record.clientResponse.identityVerified, false);
  assert.throws(() => respondToProposal(record, input), /already been recorded/);
  record.approval.hash = 'changed'; assert.throws(() => requireClientAcceptance(record), /frozen proposal content changed/);
});
test('declined and withdrawn proposals cannot unlock invoicing', () => {
  const record = fixture();
  assert.throws(() => respondToProposal(record, { decision: 'declined', name: 'Client', hash: record.approval.hash, note: '' }), /Requested changes/);
  record.clientResponse = respondToProposal(record, { decision: 'declined', name: 'Client', hash: record.approval.hash, note: 'Please revise the scope.' });
  assert.throws(() => requireClientAcceptance(record), /Client acceptance/);
  const withdrawn = fixture(); withdrawn.withdrawn = true;
  assert.throws(() => respondToProposal(withdrawn, { decision: 'accepted', name: 'Client', confirmed: true, hash: withdrawn.approval.hash }), /no longer/);
  assert.throws(() => requireClientAcceptance(withdrawn), /Client acceptance/);
});
test('client view omits the full original agreement and analysis-only data', () => {
  const record = fixture(); const view = proposalView(record);
  assert.equal(view.scope, undefined); assert.equal(view.request, undefined); assert.equal(view.items, undefined);
  assert.equal(view.approval.hash, record.approval.hash);
});
