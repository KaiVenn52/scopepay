import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readdir, mkdir, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { ensureModelAssets, modelManifest } from '../lib/model-assets.mjs';
const bytes = Buffer.from('pinned-model-test');
const asset = { file: 'tiny.bin', bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
async function workspace(fn) { const directory = await mkdtemp(path.join(tmpdir(), 'scopepay-assets-')); try { await fn(directory); } finally { await rm(directory, { recursive: true, force: true }); } }
const targetPath = directory => path.join(directory, modelManifest.model, modelManifest.revision, asset.file);
test('a pinned download is checked before use and the verified cache needs no network', () => workspace(async directory => {
  let calls = 0;
  const fetcher = async url => { calls++; assert.equal(url, `https://huggingface.co/${modelManifest.model}/resolve/${modelManifest.revision}/tiny.bin`); return new Response(bytes); };
  await ensureModelAssets(directory, { assets: [asset], fetcher });
  await ensureModelAssets(directory, { assets: [asset], localOnly: true, fetcher });
  assert.equal(calls, 1); assert.deepEqual(await readFile(targetPath(directory)), bytes);
}));
test('truncated, wrong-hash and oversized downloads are bounded and never published to the cache', () => workspace(async directory => {
  for (const body of [bytes.subarray(0, 2), Buffer.alloc(bytes.length, 0), Buffer.alloc(bytes.length + 1, 0)]) {
    let calls = 0;
    await assert.rejects(ensureModelAssets(directory, { assets: [asset], attempts: 2, fetcher: async () => { calls++; return new Response(body); } }), /Could not obtain verified/);
    assert.equal(calls, 2);
    const files = await readdir(path.dirname(targetPath(directory)));
    assert.deepEqual(files, []);
  }
}));
test('a corrupt prior cache is rejected offline and replaced only by verified bytes', () => workspace(async directory => {
  await mkdir(path.dirname(targetPath(directory)), { recursive: true }); await writeFile(targetPath(directory), 'truncated');
  await assert.rejects(ensureModelAssets(directory, { assets: [asset], localOnly: true }), /absent or corrupt/);
  await assert.rejects(ensureModelAssets(directory, { assets: [asset], attempts: 1, fetcher: async () => new Response('bad') }));
  assert.equal(await readFile(targetPath(directory), 'utf8'), 'truncated');
  await ensureModelAssets(directory, { assets: [asset], fetcher: async () => new Response(bytes) });
  assert.deepEqual(await readFile(targetPath(directory)), bytes);
}));
test('interrupted downloads can retry and never leave a partial cache file', () => workspace(async directory => {
  let calls = 0;
  await ensureModelAssets(directory, { assets: [asset], fetcher: async () => { if (++calls === 1) throw new Error('interrupted'); return new Response(bytes); } });
  assert.equal(calls, 2); assert.deepEqual(await readdir(path.dirname(targetPath(directory))), ['tiny.bin']);
}));
test('asset paths cannot escape the model cache', () => workspace(async directory => {
  await assert.rejects(ensureModelAssets(directory, { assets: [{ ...asset, file: '../../outside' }] }), /Invalid model asset path/);
}));
