import { verifyReceipt } from './receipt.mjs';
export function submissionReadiness(state, { receipt = null, qa = null, appVersion, licensePresent = false, now = new Date() } = {}) {
  const urlMatches = (value, hosts) => { try { const url = new URL(value); return url.protocol === 'https:' && hosts.includes(url.hostname) && url.pathname !== '/'; } catch { return false; } };
  let sandbox = false;
  try {
    verifyReceipt(receipt);
    sandbox = state.sandbox?.accountBackedRunReviewed === true && receipt.invoice?.mode === 'sandbox' && receipt.invoice.status === 'PAID' && receipt.invoice.proposalBindingChecked === true && receipt.client.acceptedActiveRevision === true && receipt.invoice.fullyPaidInStoredSnapshot === true && receipt.uncertainCreation === false;
  } catch { /* Local receipts alone cannot establish an actual account-backed run. */ }
  const checks = [
    { gate: 'current-local-build', passed: !!(licensePresent && qa?.result === 'PASS' && qa.appVersion === appVersion && qa.providers?.analysis === 'actual local MiniLM inference' && Array.isArray(qa.errors) && qa.errors.length === 0) },
    { gate: 'account-backed-sandbox-run', passed: sandbox },
    { gate: 'public-open-source-repository', passed: state.repository?.anonymousAccessReviewed === true && state.repository?.licenseVisibleReviewed === true && urlMatches(state.repository?.url, ['github.com', 'gitlab.com', 'bitbucket.org']) },
    { gate: 'public-working-demo-video', passed: state.video?.publicAccessReviewed === true && state.video?.actualSandboxFootageReviewed === true && Number.isFinite(state.video?.durationSeconds) && state.video.durationSeconds > 0 && state.video.durationSeconds < 180 && urlMatches(state.video?.url, ['www.youtube.com', 'youtube.com', 'youtu.be']) },
    { gate: 'eligibility-and-registration', passed: state.entrant?.eligibilityConfirmed === true && state.entrant?.paypalEventRegistrationConfirmed === true },
    { gate: 'entry-materials-reviewed', passed: state.finalMaterialsReviewed === true },
    { gate: 'within-submission-window', passed: now >= new Date('2026-10-01T16:15:00Z') && now < new Date('2026-11-12T20:00:00Z') }
  ];
  return { result: checks.every(check => check.passed) ? 'READY_FOR_FINAL_HUMAN_REVIEW' : 'BLOCKED', appVersion, checkedAt: now.toISOString(), checks, finalSubmissionAuthorized: false,
    limitation: 'Local consistency checks plus explicit human review attestations. Public URLs and receipts are not independently authenticated by this command. It never publishes, registers or submits.' };
}
