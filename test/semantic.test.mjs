import { test } from 'node:test';
import assert from 'node:assert/strict';
import { passages, rankPassages, semanticAnalysis } from '../lib/semantic.mjs';
import { analyze } from '../lib/providers.mjs';

test('passages preserve exact quotes, decimal amounts and long text without dropping punctuation', () => {
  const source = 'Price is $12.50. No store.\nTwo revisions are included.';
  assert.deepEqual(passages(source), ['Price is $12.50.', 'No store.', 'Two revisions are included.']);
  const long = 'a long clause '.repeat(100);
  assert.ok(passages(long).every(part => part.length <= 600 && long.includes(part)));
});
const vector = position => Array.from({ length: 384 }, (_, index) => Number(index === position));
test('semantic rankings use query embeddings and never turn similarity into inclusion or prices', async () => {
  const source = 'No store. Two revisions are included.';
  const request = 'Add a shop.\nChange the headline.';
  const vectors = [vector(0), vector(1), vector(0), vector(1)];
  const fakeExtractor = async inputs => { assert.equal(inputs.length, 4); return { tolist: () => vectors }; };
  const result = await semanticAnalysis(source, request, fakeExtractor);
  assert.equal(result.items[0].scopeQuote, 'No store.'); assert.equal(result.items[1].scopeQuote, 'Two revisions are included.');
  for (const item of result.items) { assert.equal(item.classification, 'unclear'); assert.equal(item.price, undefined); assert.match(item.reason, /not inclusion/); }
});
test('invalid embeddings fail closed and overlong requests are rejected rather than silently omitted', async () => {
  assert.throws(() => rankPassages(['A.'], ['B.'], [[1], [1]]), /embedding/);
  await assert.rejects(() => semanticAnalysis('Scope.', Array.from({ length: 13 }, (_, index) => `Request ${index}.`).join('\n')), /at most 12/);
  await assert.rejects(() => analyze('Scope.', Array.from({ length: 13 }, (_, index) => `Request ${index}`).join('\n'), {}), /at most 12/);
});
