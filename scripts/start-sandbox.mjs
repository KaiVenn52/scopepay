import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, appendFile } from 'node:fs/promises';
import { createApp } from '../server.mjs';
import { loadEmbeddingModel } from '../lib/semantic.mjs';
import { requireValue } from '../lib/core.mjs';

requireValue(process.env.PAYPAL_MODE === 'sandbox', 'Set PAYPAL_MODE=sandbox in the ignored local configuration.');
requireValue(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET && process.env.PAYPAL_MERCHANT_EMAIL, 'Complete the local sandbox app configuration.');
process.env.AI_MODE = 'local-embeddings';
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const directory = path.join(root, 'data', 'sandbox');
await mkdir(directory, { recursive: true });
await loadEmbeddingModel({ localOnly: true });
const fetcher = async (url, options) => {
  const parsed = new URL(url);
  requireValue(parsed.origin === 'https://api-m.sandbox.paypal.com', 'Sandbox integration uses only the PayPal sandbox API.');
  const started = Date.now();
  const response = await fetch(url, options);
  const debug = response.headers.get('paypal-debug-id');
  const event = { at: new Date().toISOString(), method: options?.method || 'GET', path: parsed.pathname,
    httpStatus: response.status, durationMs: Date.now() - started,
    debugId: debug && /^[a-zA-Z0-9-]{1,80}$/.test(debug) ? debug : null,
    kind: 'actual-account-backed-sandbox-request; headers, credentials and bodies omitted' };
  await appendFile(path.join(directory, 'provider-log.jsonl'), JSON.stringify(event) + '\n').catch(() => console.warn('Sandbox request completed; sanitized local audit write failed.'));
  return response;
};
const server = await createApp({ directory, fetcher });
const port = Number(process.env.SANDBOX_PORT || 3187);
server.listen(port, '127.0.0.1', () => console.log(`ScopePay sandbox: http://127.0.0.1:${port} | actual local AI | PayPal sandbox | isolated data/sandbox`));
