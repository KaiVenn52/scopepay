import { requireValue, invoicePayload, assertApprovalIntegrity, safeInvoice } from './core.mjs';

function cents(value) {
  requireValue(typeof value === 'string' && /^\d{1,10}(?:\.\d{1,2})?$/.test(value), 'PayPal returned an invalid USD amount.', 409);
  const [whole, fraction = ''] = value.split('.');
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  requireValue(Number.isSafeInteger(result), 'PayPal amount exceeds supported precision.', 409); return result;
}
const email = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
export function verifyInvoiceBinding(raw, record, merchant, expectedId) {
  assertApprovalIntegrity(record);
  const expected = invoicePayload(record, merchant);
  requireValue(raw?.id === expectedId && /^INV2-[A-Z0-9-]+$/.test(expectedId), 'Invoice ID does not match the requested sandbox record.', 409);
  requireValue(raw.detail?.invoice_number === expected.detail.invoice_number && raw.detail?.reference === expected.detail.reference,
    'Invoice number or approval reference does not match this proposal.', 409);
  requireValue(raw.detail?.currency_code === 'USD' && raw.amount?.currency_code === 'USD' && cents(raw.amount?.value) === record.approval.totalCents,
    'Invoice currency or total differs from the approved proposal.', 409);
  requireValue(email(raw.invoicer?.email_address) === email(merchant) && email(merchant), 'Invoice merchant does not match this sandbox account.', 409);
  requireValue(Array.isArray(raw.primary_recipients) && raw.primary_recipients.length === 1 && email(raw.primary_recipients[0]?.billing_info?.email_address) === email(record.approval.recipient),
    'Invoice recipient differs from the approved proposal.', 409);
  requireValue(Array.isArray(raw.items) && raw.items.length === expected.items.length, 'Invoice line count differs from the approved proposal.', 409);
  const remaining = [...raw.items];
  for (const line of expected.items) {
    const index = remaining.findIndex(candidate => candidate.name === line.name && candidate.description === line.description &&
      typeof candidate.quantity === 'string' && /^1(?:\.0+)?$/.test(candidate.quantity) && candidate.unit_amount?.currency_code === 'USD' && cents(candidate.unit_amount?.value) === cents(line.unit_amount.value));
    requireValue(index >= 0, 'Invoice deliverable, description, quantity or unit price differs from the approved proposal.', 409);
    remaining.splice(index, 1);
  }
  return { ...safeInvoice(raw, 'sandbox'), bindingVerified: true, bindingCheckedAt: new Date().toISOString() };
}
