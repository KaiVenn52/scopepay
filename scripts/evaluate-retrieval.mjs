import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { loadEmbeddingModel, semanticAnalysis, passages, MODEL, REVISION } from '../lib/semantic.mjs';
import { localDate } from '../lib/time.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const cases = JSON.parse(await readFile(path.join(root, 'fixtures', 'retrieval-cases.json'), 'utf8'));
await loadEmbeddingModel({ localOnly: true });
const results = [];
// A deliberately simple, transparent comparator; not a tuned search engine.
const tokens = text => new Set((text.toLowerCase().match(/[a-z0-9]+/g) || []).filter(word => !new Set(['a', 'an', 'the', 'and', 'is', 'are', 'in', 'to', 'of', 'for', 'we', 'can', 'you', 'our', 'on', 'it', 'with']).has(word)));
function lexicalMatches(scope, request) {
  const query = tokens(request);
  return passages(scope).map(scopeQuote => {
    const words = tokens(scopeQuote); const shared = [...query].filter(word => words.has(word)).length;
    return { scopeQuote, score: shared / (new Set([...query, ...words]).size || 1) };
  }).sort((a, b) => b.score - a.score).slice(0, 3);
}
for (const example of cases) {
  const started = performance.now(); const result = await semanticAnalysis(example.scope, example.request);
  const matches = result.items[0].semanticMatches;
  const lexical = lexicalMatches(example.scope, example.request);
  results.push({ ...example, lexical, lexicalHitAt1: lexical[0].scopeQuote === example.expected, lexicalHitAt3: lexical.some(match => match.scopeQuote === example.expected), topMatch: matches[0], matches, hitAt1: matches[0].scopeQuote === example.expected,
    hitAt3: matches.some(match => match.scopeQuote === example.expected), classification: result.items[0].classification,
    inferenceMs: Math.round(performance.now() - started) });
}
const score = { date: localDate(), timezone: 'Asia/Kuala_Lumpur', model: MODEL, revision: REVISION, task: 'Relevant-clause retrieval only; not contractual classification',
  sample: '12 manually labeled synthetic English cases, not a real-user study or independent accuracy benchmark', count: results.length,
  hitsAt1: results.filter(result => result.hitAt1).length, hitsAt3: results.filter(result => result.hitAt3).length,
  lexicalBaseline: { algorithm: 'Lowercase word-set Jaccard overlap, fixed English stopwords, source-order tie breaks', hitsAt1: results.filter(result => result.lexicalHitAt1).length, hitsAt3: results.filter(result => result.lexicalHitAt3).length },
  nonBillingDecisionsPreserved: results.every(result => result.classification === 'unclear'), results };
const output = path.join(root, 'evidence', 'iterations', localDate()); await mkdir(output, { recursive: true });
await writeFile(path.join(output, 'retrieval-evaluation.json'), JSON.stringify(score, null, 2));
console.log(JSON.stringify({ count: score.count, hitsAt1: score.hitsAt1, hitsAt3: score.hitsAt3, lexicalBaseline: score.lexicalBaseline, misses: results.filter(result => !result.hitAt1).map(result => ({ id: result.id, expected: result.expected, retrieved: result.topMatch.scopeQuote })), nonBillingDecisionsPreserved: score.nonBillingDecisionsPreserved }, null, 2));
