import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PayPal } from '../lib/providers.mjs';
import { evidenceReceipt } from '../lib/receipt.mjs';
import { localDate } from '../lib/time.mjs';
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const id = process.argv[2];
if (!/^[a-f0-9-]{36}$/.test(id || '')) throw new Error('Provide the existing local review UUID. This command never creates an invoice.');
const db = JSON.parse(await readFile(path.join(root, 'data', 'sandbox', 'records.json'), 'utf8'));
const record = db.records.find(record => record.id === id);
if (!record?.invoice || record.invoice.mode !== 'sandbox') throw new Error('An existing sandbox invoice is required.');
const calls = [];
const paypal = new PayPal({ ...process.env, PAYPAL_MODE: 'sandbox' }, async (url, options) => {
  const request = new URL(url);
  if (request.hostname !== 'api-m.sandbox.paypal.com' || !(options.method === 'GET' || (options.method === 'POST' && request.pathname === '/v1/oauth2/token'))) throw new Error('Read-only audit blocked a provider write.');
  const response = await fetch(url, options);
  calls.push({ method: options.method, path: request.pathname === '/v1/oauth2/token' ? request.pathname : '/v2/invoicing/invoices/[existing-id]', httpStatus: response.status });
  return response;
});
try {
  const invoice = await paypal.inspect(record, record.invoice.id);
  const version = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')).version;
  const output = path.join(root, 'evidence', 'iterations', localDate()); await mkdir(output, { recursive: true });
  const receipt = evidenceReceipt({ ...record, invoice }, version);
  await writeFile(path.join(output, 'actual-sandbox-readonly-receipt.json'), JSON.stringify(receipt, null, 2));
  const report = { result: 'PASS', checkedAt: new Date().toISOString(), accountBacked: true, status: invoice.status, settled: invoice.settled,
    exactBindingVerified: invoice.bindingVerified, invoiceWrites: 0, buyerPaymentAttempted: false, localDatabaseChanged: false, calls };
  await writeFile(path.join(output, 'actual-sandbox-readonly-audit.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(JSON.stringify({ result: 'UNVERIFIED', invoiceWrites: 0, calls, note: 'Read-only sandbox query failed; no provider response body or credentials exported.' }));
  process.exitCode = 2;
}
