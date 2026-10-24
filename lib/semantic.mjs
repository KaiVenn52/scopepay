import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireValue, validateAnalysis } from './core.mjs';
import { ensureModelAssets } from './model-assets.mjs';

export const MODEL = 'Xenova/all-MiniLM-L6-v2';
export const REVISION = '751bff37182d3f1213fa05d7196b954e230abad9';
export const cacheDir = path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), '.model-cache');
let loading;

// Keep exact contiguous source substrings. Split before embedding to reduce truncation.
export function passages(value, maxLength = 600) {
  const parts = value.split(/(?<=[.!?])\s+|\n+/);
  return parts.flatMap(part => {
    const chunks = [];
    let remaining = part.trim();
    while (remaining.length > maxLength) {
      const boundary = remaining.lastIndexOf(' ', maxLength);
      const end = boundary >= maxLength / 2 ? boundary : maxLength;
      chunks.push(remaining.slice(0, end).trim()); remaining = remaining.slice(end).trim();
    }
    if (remaining) chunks.push(remaining);
    return chunks;
  }).filter(Boolean);
}
export async function loadEmbeddingModel({ localOnly = false } = {}) {
  if (!loading) {
    loading = (async () => {
      await ensureModelAssets(cacheDir, { localOnly, log: message => console.log(message) });
      const { pipeline, env } = await import('@huggingface/transformers');
      env.cacheDir = cacheDir;
      env.allowLocalModels = true;
      env.localModelPath = path.join(cacheDir, 'local');
      return pipeline('feature-extraction', MODEL, { revision: REVISION, dtype: 'q8', device: 'cpu',
        local_files_only: true, session_options: { intraOpNumThreads: 2, interOpNumThreads: 1 } });
    })().catch(error => { loading = undefined; throw error; });
  }
  return loading;
}
export function rankPassages(sourceParts, requestParts, vectors) {
  requireValue(vectors.length === sourceParts.length + requestParts.length, 'Embedding output count does not match input.', 502);
  return requestParts.map((requestQuote, index) => {
    const query = vectors[sourceParts.length + index];
    requireValue(Array.isArray(query) && query.length === 384 && query.every(Number.isFinite), 'Invalid query embedding.', 502);
    const ranked = sourceParts.map((scopeQuote, sourceIndex) => {
      const vector = vectors[sourceIndex];
      requireValue(Array.isArray(vector) && vector.length === query.length && vector.every(Number.isFinite), 'Invalid source embedding.', 502);
      return { scopeQuote, similarity: vector.reduce((sum, value, dimension) => sum + value * query[dimension], 0) };
    }).sort((a, b) => b.similarity - a.similarity);
    return { requestQuote, matches: ranked.slice(0, 3) };
  });
}
export async function semanticAnalysis(scope, request, extractor) {
  const sourceParts = passages(scope);
  const requestParts = passages(request);
  requireValue(sourceParts.length > 0 && sourceParts.length <= 80, 'Use at most 80 scope passages for this local model.');
  requireValue(requestParts.length > 0 && requestParts.length <= 12, 'Use at most 12 request passages; split larger requests into separate reviews.');
  const model = extractor || await loadEmbeddingModel();
  const tensor = await model([...sourceParts, ...requestParts], { pooling: 'mean', normalize: true });
  const ranked = rankPassages(sourceParts, requestParts, tensor.tolist());
  const items = validateAnalysis({ items: ranked.map(({ requestQuote, matches }) => ({
    title: requestQuote.slice(0, 90), scopeQuote: matches[0].scopeQuote, requestQuote, classification: 'unclear',
    reason: `Local AI retrieved the closest scope passage (cosine similarity ${matches[0].similarity.toFixed(3)}). Similarity measures topic overlap, not inclusion, exclusion, confidence, or an obligation to pay. Review the original agreement before selecting this change.`
  })) }, scope, request);
  return { mode: 'local-embeddings', model: MODEL, revision: REVISION,
    notice: 'Real local AI retrieves related scope clauses. It does not decide contractual inclusion or price. All findings require human review.',
    items: items.map((item, index) => ({ ...item, semanticMatches: ranked[index].matches.map(match => ({ ...match, similarity: Number(match.similarity.toFixed(6)) })) })) };
}
