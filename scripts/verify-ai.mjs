import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { semanticAnalysis, loadEmbeddingModel, MODEL, REVISION, cacheDir } from '../lib/semantic.mjs';
import { localDate } from '../lib/time.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const scope = 'Build a five-page portfolio website. Includes one contact form and two rounds of copy revisions. An online store and booking integrations are not included.';
const request = 'Can you add a shop for selling prints?\nPlease connect Calendly so visitors can book a call.\nCan we change the About page headline in our second revision?';
const started = performance.now();
console.log(`Loading pinned local CPU model ${MODEL} @ ${REVISION}. First run downloads public model assets into this project only.`);
await loadEmbeddingModel({ localOnly: process.argv.includes('--cached-only') });
const loadMs = performance.now() - started;
const inferenceStart = performance.now();
const result = await semanticAnalysis(scope, request);
assert.equal(result.mode, 'local-embeddings');
assert.equal(result.items.length, 3);
for (const item of result.items) { assert.ok(scope.includes(item.scopeQuote)); assert.ok(request.includes(item.requestQuote)); assert.equal(item.classification, 'unclear'); assert.ok(item.semanticMatches.every(match => scope.includes(match.scopeQuote) && Number.isFinite(match.similarity))); }
const inferenceMs = performance.now() - inferenceStart;
const assets = [];
async function hashAssets(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await hashAssets(file);
    else if (entry.isFile()) { const bytes = await readFile(file); assets.push({ path: path.relative(cacheDir, file).replaceAll('\\', '/'), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }); }
  }
}
await hashAssets(cacheDir);
const evidence = { date: localDate(), timezone: 'Asia/Kuala_Lumpur', result: 'PASS', kind: 'Actual CPU model inference, not an injected provider response', model: MODEL, revision: REVISION, dtype: 'q8', cachedOnlyRequested: process.argv.includes('--cached-only'), task: 'feature-extraction with mean pooling, normalized 384-dimensional embeddings; cosine retrieval', loadMs: Math.round(loadMs), inferenceMs: Math.round(inferenceMs), scope, request, analysis: result, assets, limitations: ['retrieval is not contractual classification', 'similarity is not confidence', 'human review and pricing required', 'this does not establish PayPal sandbox success'] };
await mkdir(path.join(root, 'evidence'), { recursive: true });
await writeFile(path.join(root, 'evidence', 'real-ai-verification.json'), JSON.stringify(evidence, null, 2));
console.log(JSON.stringify({ result: evidence.result, model: MODEL, revision: REVISION, loadMs: evidence.loadMs, inferenceMs: evidence.inferenceMs, items: result.items.map(item => ({ request: item.requestQuote, matchedScope: item.scopeQuote, score: item.semanticMatches[0].similarity })), assetBytes: assets.reduce((sum, item) => sum + item.bytes, 0) }, null, 2));
