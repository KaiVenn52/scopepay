import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createApp } from '../server.mjs';
import { localDate } from '../lib/time.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const output = path.join(root, 'evidence', 'iterations', localDate(), 'audit');
await mkdir(output, { recursive: true });
const directory = await mkdtemp(path.join(tmpdir(), 'scopepay-audit-'));
const server = await createApp({ directory, env: {} });
const checks = [], errors = [];
let browser;
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const post = (body, headers = {}) => fetch(url + '/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body });
  assert.equal((await post('{}', { Origin: 'https://untrusted.example' })).status, 403);
  assert.equal((await post('{}', { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await post('{broken')).status, 400);
  assert.equal((await post(JSON.stringify({ scope: 'a'.repeat(65000), request: 'x' }))).status, 413);
  assert.equal((await fetch(url + '/.env')).status, 404);
  assert.equal((await fetch(url + '/data/records.json')).status, 404);
  checks.push('cross-origin writes, wrong content types, malformed/oversize JSON and private-file reads rejected');
  const response = await fetch(url);
  assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.match(response.headers.get('content-security-policy'), /script-src 'self'/);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  checks.push('CSP, frame isolation, nosniff and no-referrer headers present');
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (['warning', 'error'].includes(message.type())) errors.push(message.text()); });
  await page.goto(url); await page.locator('#connection').filter({ hasText: 'AI offline' }).waitFor();
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'ScopePay home');
  checks.push('keyboard entry focuses the labeled home link');
  const malicious = '<img src=x onerror="document.body.dataset.xss=1">';
  await page.locator('#scope').fill('No store. ' + malicious);
  await page.locator('#request').fill('Add a store. ' + malicious);
  await page.getByRole('button', { name: 'Compare the scope' }).click();
  await page.locator('.change').waitFor();
  assert.equal(await page.locator('.change img').count(), 0);
  assert.equal(await page.evaluate(() => document.body.dataset.xss), undefined);
  assert.match(await page.locator('.request-title').innerText(), /<img/);
  checks.push('source and request HTML are rendered literally without injected elements or script execution');
  const unlabeled = await page.evaluate(() => [...document.querySelectorAll('input,textarea,select')].filter(node => !node.labels?.length && !node.getAttribute('aria-label')).map(node => node.id));
  assert.deepEqual(unlabeled, []);
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  checks.push('every rendered form control has a label and document language is explicit');
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow at ${width}px`);
  }
  checks.push('no horizontal overflow at 320, 390, 768, 1024 and 1440 pixels');
  await page.setViewportSize({ width: 320, height: 844 });
  await page.locator('.review-panel').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(output, 'narrow-review.png') });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('#request').fill('Add a store.');
  await page.locator('#scope').fill('No store.');
  await page.getByRole('button', { name: 'Compare the scope' }).click();
  await page.locator('[data-decision]').selectOption('additional');
  await page.locator('[data-title]').fill('New store');
  await page.locator('[data-rationale]').fill('The original agreement excludes this store.');
  await page.locator('[data-price]').fill('240.00');
  await page.locator('#scope').fill('No store. An unsaved source edit.');
  await page.reload();
  await page.locator('#draft-status').filter({ hasText: 'Draft restored' }).waitFor();
  assert.equal(await page.locator('#scope').inputValue(), 'No store. An unsaved source edit.');
  await page.locator('#recipient').fill('buyer@example.test'); await page.locator('#confirmed').check();
  await page.getByRole('button', { name: 'Prepare client proposal' }).click();
  await page.locator('#error').filter({ hasText: 'source text changed' }).waitFor();
  checks.push('restored edited sources still require reanalysis before approval');
  assert.deepEqual(errors, []);
  checks.push('no browser page errors or console warnings/errors');
  const report = { result: 'PASS', date: localDate(), appVersion: (await (await fetch(url + '/api/state')).json()).appVersion, checks, errors,
    providerEvidence: 'offline analysis and mock payments only; real AI is verified separately', browser: 'Installed Chrome, fresh headless profile; Browser plugin not available',
    limitations: 'Targeted security and accessibility checks, not a penetration-test certification or full WCAG audit.' };
  await writeFile(path.join(output, 'audit-verification.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser?.close(); await new Promise(resolve => server.close(resolve)); await rm(directory, { recursive: true, force: true });
}
