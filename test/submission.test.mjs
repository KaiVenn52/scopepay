import test from 'node:test';
import assert from 'node:assert/strict';
import { digest } from '../lib/core.mjs';
import { submissionReadiness } from '../lib/submission.mjs';
const qa = { result: 'PASS', appVersion: 'test', providers: { analysis: 'actual local MiniLM inference' }, errors: [] };
const options = { appVersion: 'test', licensePresent: true, qa, now: new Date('2026-10-23T00:00:00Z') };
function fixture() {
  const content = { schema: 'scopepay-evidence-receipt/v1', client: { acceptedActiveRevision: true }, invoice: { mode: 'sandbox', status: 'PAID', proposalBindingChecked: true, fullyPaidInStoredSnapshot: true }, uncertainCreation: false };
  return { state: { sandbox: { accountBackedRunReviewed: true }, repository: { url: 'https://github.com/owner/scopepay', anonymousAccessReviewed: true, licenseVisibleReviewed: true }, video: { url: 'https://www.youtube.com/watch?v=test', durationSeconds: 160, publicAccessReviewed: true, actualSandboxFootageReviewed: true }, entrant: { eligibilityConfirmed: true, paypalEventRegistrationConfirmed: true }, finalMaterialsReviewed: true }, receipt: { ...content, checksum: { value: digest(content) } } };
}
test('missing external evidence blocks readiness even when local QA passes', () => {
  const report = submissionReadiness({}, options); assert.equal(report.result, 'BLOCKED');
  assert.equal(report.checks.find(c => c.gate === 'current-local-build').passed, true);
});
test('a mock paid receipt and a local video cannot qualify as real sandbox evidence', () => {
  const { state, receipt } = fixture(); receipt.invoice.mode = 'mock';
  const { checksum, ...content } = receipt; receipt.checksum.value = digest(content); state.video.url = 'http://127.0.0.1/rehearsal.mp4';
  const report = submissionReadiness(state, { ...options, receipt });
  assert.equal(report.result, 'BLOCKED');
  for (const gate of ['account-backed-sandbox-run', 'public-working-demo-video']) assert.equal(report.checks.find(c => c.gate === gate).passed, false);
});
test('stale QA, a 180-second video and an unreviewed repository remain blocked', () => {
  const { state, receipt } = fixture(); state.video.durationSeconds = 180; state.repository.anonymousAccessReviewed = false;
  const report = submissionReadiness(state, { ...options, receipt, qa: { ...qa, appVersion: 'old' } });
  for (const gate of ['current-local-build', 'public-working-demo-video', 'public-open-source-repository']) assert.equal(report.checks.find(c => c.gate === gate).passed, false);
});
test('consistent reviewed evidence permits human review only, never automatic submission', () => {
  const { state, receipt } = fixture(); const report = submissionReadiness(state, { ...options, receipt });
  assert.equal(report.result, 'READY_FOR_FINAL_HUMAN_REVIEW'); assert.equal(report.finalSubmissionAuthorized, false);
  assert.equal(submissionReadiness(state, { ...options, receipt, now: new Date('2026-11-12T20:00:00Z') }).result, 'BLOCKED');
});

function unpaidFixture() {
  const f = fixture(); f.receipt.invoice.status = 'UNPAID'; f.receipt.invoice.fullyPaidInStoredSnapshot = false;
  const { checksum, ...content } = f.receipt; f.receipt.checksum.value = digest(content); return f;
}

test('an unpaid invoice without reviewed disclosure cannot pass materials readiness', () => {
  const { state, receipt } = unpaidFixture();
  assert.equal(submissionReadiness(state, { ...options, receipt }).checks.find(c => c.gate === 'account-backed-sandbox-run').passed, false);
});

test('explicitly disclosed actual unpaid invoicing permits review while buyer payment stays unverified', () => {
  const { state, receipt } = unpaidFixture(); state.sandbox.unpaidDemoDisclosureReviewed = true; state.video.unpaidStateDisclosedReviewed = true;
  const report = submissionReadiness(state, { ...options, receipt });
  assert.equal(report.result, 'READY_FOR_FINAL_HUMAN_REVIEW');
  assert.equal(report.qualityChecks[0].passed, false); assert.equal(report.qualityChecks[0].requiredByOfficialSubmissionRules, false);
  assert.equal(report.finalSubmissionAuthorized, false);
});

test('unlisted video needs reviewed event guidance and private video always blocks', () => {
  const { state, receipt } = fixture(); state.video.visibility = 'unlisted';
  assert.equal(submissionReadiness(state, { ...options, receipt }).result, 'BLOCKED');
  state.video.eventAllowsUnlistedReviewed = true;
  assert.equal(submissionReadiness(state, { ...options, receipt }).result, 'READY_FOR_FINAL_HUMAN_REVIEW');
  state.video.visibility = 'private';
  assert.equal(submissionReadiness(state, { ...options, receipt }).result, 'BLOCKED');
});

test('known conflict between form guidance and controlling rules blocks unlisted readiness until clarified', () => {
  const { state, receipt } = fixture();
  Object.assign(state.video, { visibility: 'unlisted', eventAllowsUnlistedReviewed: true, rulesConflictUnresolved: true });
  assert.equal(submissionReadiness(state, { ...options, receipt }).result, 'BLOCKED');
  state.video.rulesConflictUnresolved = false;
  assert.equal(submissionReadiness(state, { ...options, receipt }).result, 'READY_FOR_FINAL_HUMAN_REVIEW');
});
