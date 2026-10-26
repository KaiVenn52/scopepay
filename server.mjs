import http from 'node:http';
import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { randomUUID, randomBytes } from 'node:crypto';
import { requireValue, text, approve, digest, assertReviewSources, assertApprovalIntegrity } from './lib/core.mjs';
import { analyze, PayPal } from './lib/providers.mjs';
import { MODEL } from './lib/semantic.mjs';
import { evidenceReceipt } from './lib/receipt.mjs';
import { proposalView, respondToProposal, requireClientAcceptance } from './lib/proposals.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const appVersion = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')).version;
export async function createApp({ env = process.env, directory = path.join(root, 'data'), fetcher = fetch } = {}) {
  const paypal = new PayPal(env, fetcher);
  await mkdir(directory, { recursive: true });
  const file = path.join(directory, 'records.json');
  let db;
  try { db = JSON.parse(await readFile(file, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; db = { records: [] }; }
  requireValue(Array.isArray(db.records), 'Invalid local data file.');
  // If a process died during creation, never silently create a second remote invoice.
  for (const record of db.records) if (record.creating) { record.creating = false; record.createUncertain = true; }
  const save = async () => { await writeFile(`${file}.tmp`, JSON.stringify(db, null, 2)); await rename(`${file}.tmp`, file); };
  let queue = Promise.resolve();
  const serial = work => { const next = queue.then(work); queue = next.catch(() => {}); return next; };
  const publicFiles = { '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/style.css': ['style.css', 'text/css'], '/client.js': ['client.js', 'text/javascript'] };
  const server = http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    const json = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
    try {
      const host = req.headers.host || '';
      requireValue(/^(127\.0\.0\.1|localhost):\d+$/.test(host), 'Local access only.', 403);
      const url = new URL(req.url, `http://${host}`);
      if (req.method === 'GET' && /^\/proposal\/[a-f0-9]{64}$/.test(url.pathname)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(await readFile(path.join(root, 'public', 'client.html'))); return;
      }
      if (req.method === 'GET' && url.pathname === '/favicon.ico') { res.writeHead(204); res.end(); return; }
      if (req.method === 'GET' && publicFiles[url.pathname]) {
        const [name, mime] = publicFiles[url.pathname]; res.writeHead(200, { 'Content-Type': `${mime}; charset=utf-8` }); res.end(await readFile(path.join(root, 'public', name))); return;
      }
      if (req.method === 'GET' && url.pathname === '/api/state') {
        json(200, { appVersion, paypalMode: paypal.mode, paypalConfigured: paypal.configured, aiMode: env.AI_MODE || 'offline', model: env.AI_MODE === 'local-embeddings' ? MODEL : env.OLLAMA_MODEL || null, records: db.records }); return;
      }
      const receiptMatch = url.pathname.match(/^\/api\/reviews\/([a-f0-9-]+)\/receipt$/);
      if (req.method === 'GET' && receiptMatch) {
        const record = db.records.find(candidate => candidate.id === receiptMatch[1]);
        requireValue(record, 'Review not found.', 404);
        json(200, evidenceReceipt(record, appVersion)); return;
      }
      const proposalMatch = url.pathname.match(/^\/api\/proposals\/([a-f0-9]{64})(?:\/(respond))?$/);
      if (req.method === 'GET' && proposalMatch && !proposalMatch[2]) {
        const record = db.records.find(record => record.proposalToken === proposalMatch[1]);
        requireValue(record && record.approval, 'Proposal not found.', 404); json(200, proposalView(record)); return;
      }
      requireValue(req.method === 'POST', 'Not found.', 404);
      requireValue(!req.headers.origin || req.headers.origin === `http://${host}`, 'Cross-origin requests are blocked.', 403);
      requireValue(req.headers['content-type']?.split(';')[0] === 'application/json', 'JSON required.', 415);
      req.setEncoding('utf8');
      let body = ''; for await (const chunk of req) { body += chunk; requireValue(Buffer.byteLength(body) <= 64000, 'Request too large.', 413); }
      let input; try { input = JSON.parse(body); } catch { requireValue(false, 'Invalid JSON.'); }
      requireValue(input && typeof input === 'object' && !Array.isArray(input), 'JSON body must be an object.');
      const result = await serial(async () => {
        if (proposalMatch && proposalMatch[2] === 'respond') {
          const record = db.records.find(record => record.proposalToken === proposalMatch[1]); requireValue(record, 'Proposal not found.', 404);
          record.clientResponse = respondToProposal(record, input);
          record.events.push({ action: `client-${record.clientResponse.decision}`, hash: record.approval.hash, at: record.clientResponse.at });
          await save(); return proposalView(record);
        }
        if (url.pathname === '/api/reviews') {
          requireValue(db.records.length < 200, 'Local workspace limit reached. Archive data before continuing.', 409);
          const scope = text(input.scope, 'Original scope'); const request = text(input.request, 'New request');
          const parent = input.parentId ? db.records.find(record => record.id === input.parentId) : null;
          if (input.parentId) {
            requireValue(parent && parent.approval && !parent.invoice && (parent.withdrawn || parent.clientResponse?.decision === 'declined'), 'Revise only a withdrawn proposal or one where the client requested changes.', 409);
            requireValue(!parent.supersededBy, 'This proposal already has a frozen replacement. Use the current revision.', 409);
            assertApprovalIntegrity(parent);
          }
          const analysis = await analyze(scope, request, env, fetcher);
          const record = { id: randomUUID(), createdAt: new Date().toISOString(), scope, request, sourceHash: digest({ scope, request }), parentId: parent?.id || null, revisionNumber: parent ? (parent.revisionNumber || 1) + 1 : 1, ...analysis, approval: null, invoice: null, events: [] };
          db.records.push(record); await save(); return record;
        }
        const match = url.pathname.match(/^\/api\/reviews\/([a-f0-9-]+)\/(approve|proposal|withdraw|invoice|reconcile|send|refresh|simulate)$/);
        requireValue(match, 'Not found.', 404);
        const record = db.records.find(record => record.id === match[1]); requireValue(record, 'Review not found.', 404);
        const action = match[2];
        if (action === 'approve') {
          assertReviewSources(record);
          const parent = record.parentId ? db.records.find(candidate => candidate.id === record.parentId) : null;
          if (record.parentId) requireValue(parent && !parent.invoice && !parent.supersededBy && (parent.withdrawn || parent.clientResponse?.decision === 'declined'), 'The parent proposal is no longer eligible for replacement.', 409);
          record.approval = approve(record, input); record.proposalToken = randomBytes(32).toString('hex');
          if (parent) { parent.supersededBy = record.id; parent.events.push({ action: 'superseded', replacementId: record.id, at: new Date().toISOString() }); }
        }
        else if (action === 'proposal') { requireValue(record.approval, 'Approve a change order first.', 409); record.proposalToken ||= randomBytes(32).toString('hex'); }
        else if (action === 'withdraw') { requireValue(record.approval && !record.invoice && !record.clientResponse, 'Only an unanswered, uninvoiced proposal can be withdrawn.', 409); record.withdrawn = true; }
        else if (action === 'reconcile') {
          requireValue(paypal.mode === 'sandbox' && record.createUncertain && !record.invoice, 'Reconciliation is only available for an uncertain sandbox creation without a saved invoice.', 409);
          requireClientAcceptance(record);
          record.invoice = await paypal.inspect(record, text(input.invoiceId, 'Sandbox invoice ID', 110));
          record.createUncertain = false; record.creating = false;
          record.reconciliation = { invoiceId: record.invoice.id, at: new Date().toISOString(), method: 'authenticated-sandbox-read-and-exact-proposal-comparison' };
        }
        else if (action === 'invoice') {
          requireValue(record.approval, 'Approve the scope change before invoicing.', 409);
          if (record.invoice) return record;
          requireClientAcceptance(record);
          requireValue(!record.createUncertain, 'Previous create outcome is uncertain. Reconcile using invoice number in PayPal sandbox dashboard; automatic retry is blocked.', 409);
          requireValue(paypal.mode === 'mock' || paypal.configured, 'Configure PayPal sandbox credentials first.', 503);
          record.creating = true; await save();
          try { record.invoice = await paypal.create(record); record.creating = false; }
          catch (error) { record.creating = false; record.createUncertain = error.remoteWriteAttempted !== false; await save(); throw error; }
        } else {
          assertApprovalIntegrity(record);
          requireValue(record.invoice, 'Create an invoice first.', 409);
          requireValue(record.invoice.mode === paypal.mode, 'Restarted in a different payment mode. Create a separate review.', 409);
          if (action === 'send') {
            requireValue(record.invoice.status === 'DRAFT', 'Only a draft invoice can be issued.', 409);
            record.invoice = await paypal.send(record.invoice, record);
          } else if (action === 'refresh') record.invoice = await paypal.refresh(record.invoice, record);
          else {
            requireValue(paypal.mode === 'mock' && record.invoice.status !== 'DRAFT', 'Simulation is available only for issued mock invoices.', 409);
            requireValue(['PARTIALLY_PAID', 'PAYMENT_PENDING', 'PAID'].includes(input.status), 'Invalid simulation status.');
            record.invoice = { ...record.invoice, status: input.status, settled: input.status === 'PAID', checkedAt: new Date().toISOString() };
          }
        }
        record.events.push({ action, at: new Date().toISOString(), mode: paypal.mode }); await save(); return record;
      });
      json(200, result);
    } catch (error) { json(error.status || 500, { error: error.status ? error.message : 'Operation failed. No success was recorded; inspect local provider configuration or reconcile sandbox state.' }); }
  });
  server.requestTimeout = 150000;
  return server;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3186); const server = await createApp();
  server.listen(port, '127.0.0.1', () => console.log(`ScopePay: http://127.0.0.1:${port} | PayPal=${process.env.PAYPAL_MODE || 'mock'} | AI=${process.env.AI_MODE || 'offline'}`));
}
