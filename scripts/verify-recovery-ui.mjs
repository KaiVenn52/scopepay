import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../server.mjs';
import { localDate } from '../lib/time.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const directory = await mkdtemp(path.join(tmpdir(), 'scopepay-recovery-ui-'));
const output = path.join(root, 'evidence', 'iterations', localDate(), 'after'); await mkdir(output, { recursive: true });
const calls = [], errors = []; let invoice;
const fetcher = async (url, options) => {
  calls.push({ url, method: options.method });
  if (url.endsWith('/token')) return Response.json({ access_token: 'injected-contract-test-token' });
  if (options.method === 'POST') {
    invoice = { ...JSON.parse(options.body), id: 'INV2-FIXTURE-RECOVERY', status: 'PARTIALLY_PAID', amount: { currency_code: 'USD', value: '240.00' } };
    throw new Error('Injected lost create response');
  }
  return Response.json(invoice);
};
const server = await createApp({ directory, fetcher, env: { PAYPAL_MODE: 'sandbox', PAYPAL_CLIENT_ID: 'fixture-only', PAYPAL_CLIENT_SECRET: 'fixture-only', PAYPAL_MERCHANT_EMAIL: 'merchant@example.test' } });
let browser;
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); const base = `http://127.0.0.1:${server.address().port}`;
  const post = async (route, body, status = 200) => { const response = await fetch(base + route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); assert.equal(response.status, status); return response.json(); };
  const review = await post('/api/reviews', { scope: 'No online store.', request: 'Please add a print store.' });
  const approved = await post(`/api/reviews/${review.id}/approve`, { confirmed: true, recipient: 'buyer@example.test', items: [{ id: review.items[0].id, title: 'Add a print store', amount: '240.00' }] });
  await post(`/api/proposals/${approved.proposalToken}/respond`, { confirmed: true, name: 'Example Client', decision: 'accepted', hash: approved.approval.hash });
  await post(`/api/reviews/${review.id}/invoice`, {}, 500);
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()); });
  await page.goto(base); await page.locator('#reconcile-form').waitFor();
  assert.equal(await page.getByRole('button', { name: 'Create draft invoice' }).count(), 0);
  await page.locator('#invoice-panel').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(output, 'contract-fixture-recovery-before.png') });
  await page.locator('#reconcile-id').fill(invoice.id);
  await page.getByRole('button', { name: 'Verify & recover existing invoice' }).click();
  await page.locator('#invoice-description').filter({ hasText: 'PARTIALLY PAID' }).waitFor();
  assert.match(await page.locator('#invoice-description').innerText(), /Not settled/);
  assert.match(await page.locator('#invoice-details').innerText(), /Invoice fields match/);
  assert.equal(calls.filter(call => call.url.includes('/invoicing/') && call.method === 'POST').length, 1);
  await page.screenshot({ path: path.join(output, 'contract-fixture-recovery-after.png') });
  assert.deepEqual(errors, []);
  const result = { date: localDate(), result: 'PASS', providerEvidence: 'INJECTED CONTRACT RESPONSES ONLY — not actual PayPal sandbox access or payment', checks: ['uncertain create exposes recovery form and blocks new invoice', 'invoice recovered through authenticated-read adapter without a second invoice write', 'partial payment stays unsettled', 'verified invoice binding displayed', 'no browser page errors or console warnings/errors'], invoiceWriteCount: 1, recoveryReadCount: calls.filter(call => call.url.includes('/invoicing/') && call.method === 'GET').length, realPayPalValidated: false };
  await writeFile(path.join(output, 'recovery-ui-verification.json'), JSON.stringify(result, null, 2)); console.log(JSON.stringify(result, null, 2));
} finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); await rm(directory, { recursive: true, force: true }); }
