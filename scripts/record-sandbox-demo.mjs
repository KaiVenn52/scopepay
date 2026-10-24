import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, copyFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../server.mjs';
import { loadEmbeddingModel } from '../lib/semantic.mjs';

// Browser plugin is not available. Regular Playwright controls only our loopback
// app. It never opens PayPal, user Chrome profiles, or external account pages.
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const output = path.join(root, 'delivery', 'final-demo-2026-10-24');
const realBase = 'http://127.0.0.1:3187';
const scenes = JSON.parse((await readFile(path.join(output, 'audio-scenes.json'), 'utf8')).replace(/^\uFEFF/, ''));
const realState = await (await fetch(realBase + '/api/state')).json();
assert.equal(realState.paypalMode, 'sandbox');
assert.equal(realState.aiMode, 'local-embeddings');
const original = realState.records.find(record => record.invoice?.id === 'INV2-B5KW-9W4K-LJPW-TLGD');
assert(original?.invoice.bindingVerified);
assert.equal(original.approval.totalCents, 24000);
assert.equal(original.invoice.status, 'UNPAID', 'Review narration before recording a changed provider state.');
await mkdir(output, { recursive: true });
await mkdir(path.join(root, 'data'), { recursive: true });
const directory = await mkdtemp(path.join(root, 'data', 'video-local-'));
await loadEmbeddingModel({ localOnly: true });
// This first section performs real inference and local response actions only.
// The second section navigates to the existing account-backed invoice workspace.
const server = await createApp({ env: { ...process.env, AI_MODE: 'local-embeddings', PAYPAL_MODE: 'sandbox' }, directory });
let browser, context, video;
const errors = [], chapters = [];
let started, returnedStatus;
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const localBase = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, recordVideo: { dir: output, size: { width: 1440, height: 1000 } } });
  const page = await context.newPage(); video = page.video(); started = Date.now();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  async function chapter(id) {
    const scene = scenes.find(scene => scene.id === id); assert(scene);
    const atSeconds = (Date.now() - started) / 1000;
    chapters.push({ id, atSeconds, ...scene });
    console.log(`Scene: ${id}`);
    await page.evaluate(({ caption, disclosure }) => {
      let banner = document.querySelector('#demo-caption');
      if (!banner) { banner = document.createElement('div'); banner.id = 'demo-caption'; document.body.append(banner); }
      banner.replaceChildren();
      const line = document.createElement('strong'); line.textContent = caption;
      const note = document.createElement('div'); note.textContent = disclosure;
      banner.append(line, note);
      Object.assign(banner.style, { position: 'fixed', bottom: '0', left: '0', right: '0', zIndex: '9999', padding: '15px 35px', background: '#102c35', color: '#fff', font: '18px/1.5 Arial,sans-serif', boxShadow: '0 -2px 12px #0003' });
      document.body.style.paddingBottom = '110px';
    }, { caption: scene.caption, disclosure: id === 'provider' || id === 'refresh' || id === 'receipt' || id === 'end' ? 'Actual PayPal sandbox invoice · buyer payment not verified · synthetic local acceptance' : 'Real local AI · synthetic project and client · local prototype' });
    await page.screenshot({ path: path.join(output, `${id}.png`) });
    await new Promise(resolve => setTimeout(resolve, Math.ceil(scene.seconds * 1000) + 600));
  }
  await page.goto(localBase);
  await page.locator('#connection').filter({ hasText: 'PayPal sandbox' }).waitFor();
  await chapter('intro');
  await page.locator('#scope').fill(original.scope); await page.locator('#request').fill(original.request);
  await page.locator('#sources').scrollIntoViewIfNeeded(); await chapter('sources');
  await page.getByRole('button', { name: 'Compare the scope' }).click();
  await page.locator('.change').first().waitFor({ timeout: 90000 });
  await page.locator('.review-panel').scrollIntoViewIfNeeded(); await chapter('retrieval');
  for (const [i, value] of ['additional', 'clarify', 'included'].entries()) await page.locator('[data-decision]').nth(i).selectOption(value);
  await page.locator('[data-title]').first().fill('Add a 12-product print store');
  await page.locator('[data-rationale]').first().fill('The agreed scope excludes an online store. This adds a product catalog and checkout flow.');
  await page.locator('[data-price]').first().fill('240.00');
  await page.locator('#recipient').fill(original.approval.recipient); await page.locator('#confirmed').check();
  await page.locator('#approval-form').scrollIntoViewIfNeeded(); await chapter('decision');
  await page.getByRole('button', { name: 'Prepare client proposal' }).click();
  await page.locator('#client-status').filter({ hasText: 'Awaiting client response' }).waitFor();
  await page.locator('#client-panel').scrollIntoViewIfNeeded(); await chapter('proposal');
  const clientPath = await page.locator('#client-link').getAttribute('href');
  await page.goto(localBase + clientPath);
  await page.locator('#proposal-content').getByText('Add a 12-product print store', { exact: true }).waitFor();
  await page.locator('#respondent').fill('Demo client (unverified)'); await page.locator('#accept-confirm').check();
  await page.locator('#proposal-content').scrollIntoViewIfNeeded(); await chapter('client');
  await page.getByRole('button', { name: 'Accept scope & price' }).click();
  await page.locator('#response-result').getByText('Scope agreed. Thank you.').waitFor();
  // No invoice creation or issuance is performed by this recording.
  await page.goto(realBase);
  await page.locator('#connection').filter({ hasText: 'PayPal sandbox' }).waitFor();
  await page.locator(`[data-review="${original.id}"]`).click();
  await page.locator('#invoice-description').filter({ hasText: 'UNPAID' }).waitFor();
  await page.locator('#invoice-panel').scrollIntoViewIfNeeded(); await chapter('provider');
  const [refreshResponse] = await Promise.all([
    page.waitForResponse(response => response.url() === `${realBase}/api/reviews/${original.id}/refresh` && response.request().method() === 'POST', { timeout: 90000 }),
    page.getByRole('button', { name: 'Refresh status', exact: true }).click()
  ]);
  assert.equal(refreshResponse.status(), 200);
  await page.waitForFunction(() => document.body.getAttribute('aria-busy') === 'false');
  const latest = await (await fetch(realBase + '/api/state')).json();
  const invoice = latest.records.find(r => r.id === original.id).invoice;
  assert.equal(invoice.status, 'UNPAID'); assert.equal(invoice.bindingVerified, true);
  assert(new Date(invoice.checkedAt) >= new Date(started)); returnedStatus = invoice.status;
  await chapter('refresh');
  await page.locator('#client-panel').scrollIntoViewIfNeeded();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export evidence receipt' }).click()]);
  await download.saveAs(path.join(output, 'actual-sandbox-receipt.json'));
  await chapter('receipt');
  await page.locator('#invoice-panel').scrollIntoViewIfNeeded(); await chapter('end');
  assert.deepEqual(errors, []);
  await context.close(); context = null;
  const videoFile = path.join(output, 'ScopePay-actual-sandbox-raw.webm'); await copyFile(await video.path(), videoFile);
  const filters = scenes.map((scene, index) => `[${index + 1}:a]adelay=${Math.round(chapters[index].atSeconds * 1000)}:all=1[a${index}]`);
  filters.push(scenes.map((_, i) => `[a${i}]`).join('') + `amix=inputs=${scenes.length}:duration=longest:normalize=0[aout]`);
  const args = ['-y', '-i', videoFile, ...scenes.flatMap(scene => ['-i', path.join(output, scene.id + '.wav')]), '-filter_complex', filters.join(';'), '-map', '0:v', '-map', '[aout]', '-c:v', 'libx264', '-preset', 'fast', '-crf', '22', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', '-shortest', path.join(output, 'ScopePay-actual-sandbox-demo.mp4')];
  const encoded = spawnSync('ffmpeg.exe', args, { encoding: 'utf8', maxBuffer: 4e6 });
  if (encoded.status !== 0) throw new Error(encoded.stderr.slice(-2000));
  const probe = spawnSync('ffprobe.exe', ['-v', 'error', '-show_entries', 'format=duration,size', '-of', 'json', path.join(output, 'ScopePay-actual-sandbox-demo.mp4')], { encoding: 'utf8' });
  const metadata = JSON.parse(probe.stdout).format; assert(Number(metadata.duration) < 180);
  await writeFile(path.join(output, 'recording.json'), JSON.stringify({ result: 'PASS', appVersion: realState.appVersion, actualLocalAI: true, actualPayPalReadOnlyRefresh: true, invoiceState: returnedStatus, invoiceCreatedDuringRecording: false, buyerPaymentVerified: false, clientIdentityVerified: false, durationSeconds: Number(metadata.duration), bytes: Number(metadata.size), voice: 'Microsoft Zira Desktop synthetic narration; no impersonation', browserPath: 'Browser plugin not available; Playwright only on owned loopback application', chapters, errors, published: false }, null, 2));
  console.log(`PASS: narrated actual sandbox walkthrough, ${metadata.duration} seconds`);
} finally {
  if (context) await context.close(); if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
