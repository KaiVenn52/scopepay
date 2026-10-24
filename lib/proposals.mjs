import { requireValue, text, assertApprovalIntegrity } from './core.mjs';

export function proposalView(record) {
  assertApprovalIntegrity(record);
  return { id: record.id, approval: record.approval, response: record.clientResponse || null,
    withdrawn: !!record.withdrawn, superseded: !!record.supersededBy, revisionNumber: record.revisionNumber || 1, invoice: record.invoice, environment: 'Local prototype; respondent identity is not authenticated.' };
}
export function respondToProposal(record, input) {
  requireValue(record.approval && !record.withdrawn, 'This proposal is no longer available.', 409);
  assertApprovalIntegrity(record);
  requireValue(!record.supersededBy, 'A newer proposal replaces this revision. Ask for the current client link.', 409);
  requireValue(!record.clientResponse, 'A response has already been recorded. Request a new proposal to change it.', 409);
  requireValue(input.hash === record.approval.hash, 'The proposal revision does not match. Reload before responding.', 409);
  requireValue(['accepted', 'declined'].includes(input.decision), 'Choose accept or request changes.');
  const name = text(input.name, 'Your name', 80);
  if (input.decision === 'accepted') requireValue(input.confirmed === true, 'Confirm the exact scope and amount before accepting.');
  const note = input.decision === 'declined' ? text(input.note, 'Requested changes', 1000) : (typeof input.note === 'string' ? input.note.trim().slice(0, 1000) : '');
  return { decision: input.decision, name, note, hash: record.approval.hash, at: new Date().toISOString(),
    identityVerified: false, source: 'local-prototype-client-page' };
}
export function requireClientAcceptance(record) {
  assertApprovalIntegrity(record);
  requireValue(!record.supersededBy && !record.withdrawn && record.clientResponse?.decision === 'accepted' && record.clientResponse.hash === record.approval?.hash,
    'Client acceptance of this exact proposal is required before creating an invoice.', 409);
}
