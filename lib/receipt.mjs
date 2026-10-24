import { assertApprovalIntegrity, digest, requireValue } from './core.mjs';

export function verifyReceipt(receipt) {
  requireValue(receipt?.schema === 'scopepay-evidence-receipt/v1', 'Unknown receipt format.');
  const { checksum, ...content } = receipt;
  requireValue(checksum?.value === digest(content), 'Receipt checksum does not match its content.');
  return { checksumMatches: true, authenticated: false, limitation: 'Content checksum only; not a PayPal attestation or author signature.' };
}

// A projection of local state, never a provider attestation or authenticated signature.
export function evidenceReceipt(record, appVersion, now = new Date().toISOString()) {
  assertApprovalIntegrity(record);
  const response = record.clientResponse;
  if (response) {
    requireValue(response.hash === record.approval.hash, 'Client response belongs to a different proposal.', 409);
    requireValue(['accepted', 'declined'].includes(response.decision), 'Invalid client response.', 409);
  }
  const invoice = record.invoice;
  if (invoice) requireValue(['mock', 'sandbox'].includes(invoice.mode), 'Unknown invoice evidence mode.', 409);
  const active = !record.withdrawn && !record.supersededBy;
  const decision = response?.decision || 'pending';
  const bound = invoice?.bindingVerified === true;
  const content = {
    schema: 'scopepay-evidence-receipt/v1', appVersion, exportedAt: now,
    evidenceBasis: 'Redacted projection of local records; no provider call is made during export.',
    proposal: { fingerprint: record.approval.hash, sourceFingerprint: record.sourceHash || null,
      revision: record.revisionNumber || 1, hasParent: !!record.parentId,
      state: record.supersededBy ? 'superseded' : record.withdrawn ? 'withdrawn' : 'active',
      currency: record.approval.currency, totalCents: record.approval.totalCents,
      chargedItems: record.approval.items.length,
      includedItems: (record.approval.reviewed || []).filter(item => item.disposition === 'included').length,
      clarificationItems: (record.approval.reviewed || []).filter(item => item.disposition === 'clarify').length },
    analysis: { mode: ['offline', 'local-embeddings', 'ollama'].includes(record.mode) ? record.mode : 'unknown',
      limitation: 'Retrieval and quoted text do not establish contractual entitlement or model accuracy.' },
    client: { decision, matchesProposal: !!response, identityVerified: false,
      acceptedActiveRevision: active && decision === 'accepted' },
    invoice: invoice ? { mode: invoice.mode, status: ['DRAFT', 'SENT', 'SCHEDULED', 'PAID', 'MARKED_AS_PAID', 'CANCELLED', 'REFUNDED', 'PARTIALLY_PAID', 'PARTIALLY_REFUNDED', 'PAYMENT_PENDING', 'UNPAID'].includes(invoice.status) ? invoice.status : 'UNKNOWN',
      idFingerprint: digest(invoice.id), lastCheckedAt: invoice.checkedAt || null,
      proposalBindingChecked: bound, bindingCheckedAt: invoice.bindingCheckedAt || null,
      paymentEvidence: invoice.mode === 'mock' ? 'simulation-only' :
        bound ? 'stored-sandbox-adapter-response; not independently attested' : 'sandbox-binding-not-verified',
      fullyPaidInStoredSnapshot: active && decision === 'accepted' && invoice.status === 'PAID' && (invoice.mode === 'mock' || bound),
      realMoneyEvidence: false } : null,
    uncertainCreation: !!record.createUncertain,
    privacy: 'Names, emails, proposal access tokens, source excerpts, notes, invoice URLs and raw invoice IDs are omitted. Fingerprints and amounts remain potentially linkable.',
    limitations: ['Local records can be edited by their owner. This receipt is not a signature or notarized payment proof.',
      'A checksum detects content changes; it does not authenticate the author or validate PayPal acceptance.',
      'No public deployment, registration, production payment or competition submission is established.']
  };
  return { ...content, checksum: { algorithm: 'SHA-256 of JSON.stringify(content), preserving property order; excludes checksum', value: digest(content) } };
}
