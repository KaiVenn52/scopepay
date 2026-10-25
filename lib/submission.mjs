import { verifyReceipt } from './receipt.mjs';
export function submissionReadiness(state, { receipt = null, qa = null, appVersion, licensePresent = false, now = new Date() } = {}) {
  const urlMatches = (value, hosts) => { try { const url = new URL(value); return url.protocol === 'https:' && hosts.includes(url.hostname) && url.pathname !== '/'; } catch { return false; } };
  let sandbox = false;
  let buyerPayment = false;
  try {
    verifyReceipt(receipt);
    const paidSnapshot = receipt.invoice?.status === 'PAID' && receipt.invoice.fullyPaidInStoredSnapshot === true;
    const disclosedUnpaidSnapshot = receipt.invoice?.status === 'UNPAID' && receipt.invoice.fullyPaidInStoredSnapshot === false && state.sandbox?.unpaidDemoDisclosureReviewed === true && state.video?.unpaidStateDisclosedReviewed === true;
    sandbox = state.sandbox?.accountBackedRunReviewed === true && receipt.invoice?.mode === 'sandbox' && (paidSnapshot || disclosedUnpaidSnapshot) && receipt.invoice.proposalBindingChecked === true && receipt.client.acceptedActiveRevision === true && receipt.uncertainCreation === false;
    buyerPayment = sandbox && paidSnapshot && state.sandbox?.buyerCheckoutReviewed === true;
  } catch { /* Local receipts alone cannot establish an actual account-backed run. */ }
  const videoVisibility = state.video?.visibility;
  const acceptableVisibility = !videoVisibility || videoVisibility === 'public' || (videoVisibility === 'unlisted' && state.video?.eventAllowsUnlistedReviewed === true);
  const checks = [
    { gate: 'current-local-build', passed: !!(licensePresent && qa?.result === 'PASS' && qa.appVersion === appVersion && qa.providers?.analysis === 'actual local MiniLM inference' && Array.isArray(qa.errors) && qa.errors.length === 0) },
    { gate: 'account-backed-sandbox-run', passed: sandbox },
    { gate: 'public-open-source-repository', passed: state.repository?.anonymousAccessReviewed === true && state.repository?.licenseVisibleReviewed === true && urlMatches(state.repository?.url, ['github.com', 'gitlab.com', 'bitbucket.org']) },
    { gate: 'public-working-demo-video', passed: acceptableVisibility && state.video?.publicAccessReviewed === true && state.video?.actualSandboxFootageReviewed === true && Number.isFinite(state.video?.durationSeconds) && state.video.durationSeconds > 0 && state.video.durationSeconds < 180 && urlMatches(state.video?.url, ['www.youtube.com', 'youtube.com', 'youtu.be']) },
    { gate: 'eligibility-and-registration', passed: state.entrant?.eligibilityConfirmed === true && state.entrant?.paypalEventRegistrationConfirmed === true },
    { gate: 'entry-materials-reviewed', passed: state.finalMaterialsReviewed === true },
    { gate: 'within-submission-window', passed: now >= new Date('2026-10-01T16:15:00Z') && now < new Date('2026-11-12T20:00:00Z') }
  ];
  return { result: checks.every(check => check.passed) ? 'READY_FOR_FINAL_HUMAN_REVIEW' : 'BLOCKED', appVersion, checkedAt: now.toISOString(), checks, finalSubmissionAuthorized: false,
    qualityChecks: [{ gate: 'buyer-checkout-and-paid-invoice', passed: buyerPayment, requiredByOfficialSubmissionRules: false, note: 'A disclosed account-backed UNPAID invoice can demonstrate invoicing. It never proves buyer payment or settlement.' }],
    limitation: 'Local consistency checks plus explicit human review attestations. Public URLs and receipts are not independently authenticated by this command. It never publishes, registers or submits.' };
}
