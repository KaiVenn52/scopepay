import { readFile, mkdir, rename, unlink, stat } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { requireValue } from './core.mjs';

export const modelManifest = JSON.parse(await readFile(new URL('./model-assets.json', import.meta.url), 'utf8'));
export async function ensureModelAssets(cacheDirectory, { localOnly = false, fetcher = fetch, assets = modelManifest.assets, timeoutMs = 60000, attempts = 2, log = () => {} } = {}) {
  const cache = path.resolve(cacheDirectory);
  const results = [];
  for (const asset of assets) {
    requireValue(typeof asset.file === 'string' && /^[a-zA-Z0-9_./-]+$/.test(asset.file) && !asset.file.split('/').some(part => part === '..' || !part), 'Invalid model asset path.');
    const target = path.resolve(cache, modelManifest.model, modelManifest.revision, asset.file);
    requireValue(target.startsWith(cache + path.sep), 'Model asset must stay inside its cache.');
    const valid = async () => {
      try { return (await stat(target)).size === asset.bytes && createHash('sha256').update(await readFile(target)).digest('hex') === asset.sha256; }
      catch (error) { if (error.code === 'ENOENT') return false; throw error; }
    };
    if (await valid()) { results.push({ file: asset.file, source: 'verified-cache' }); continue; }
    requireValue(!localOnly, `Cached model asset is absent or corrupt: ${asset.file}. Run npm run verify:ai to repair it.`, 503);
    await mkdir(path.dirname(target), { recursive: true });
    let success = false;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      const temporary = `${target}.tmp-${randomUUID()}`;
      try {
        log(`Downloading ${asset.file}, attempt ${attempt}/${attempts}; size and SHA-256 must match.`);
        const signal = AbortSignal.timeout(timeoutMs);
        const response = await fetcher(`https://huggingface.co/${modelManifest.model}/resolve/${modelManifest.revision}/${asset.file}`, { signal });
        requireValue(response.ok && response.body, 'Model download did not return a readable success response.', 503);
        let bytes = 0; const hash = createHash('sha256');
        const validateStream = new Transform({ transform(chunk, encoding, callback) {
          bytes += chunk.length;
          if (bytes > asset.bytes) { callback(new Error('Model asset exceeds pinned size.')); return; }
          hash.update(chunk); callback(null, chunk);
        } });
        await pipeline(Readable.fromWeb(response.body), validateStream, createWriteStream(temporary, { flags: 'wx' }), { signal });
        requireValue(bytes === asset.bytes && hash.digest('hex') === asset.sha256, 'Model download failed its pinned size or SHA-256 check.', 503);
        await rename(temporary, target);
        success = true; results.push({ file: asset.file, source: 'verified-download' }); break;
      } catch {
        log(`Download or integrity check failed for ${asset.file}, attempt ${attempt}/${attempts}.`);
      } finally { await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
    }
    requireValue(success, `Could not obtain verified model asset: ${asset.file}. Check the connection and rerun npm run verify:ai; incomplete files are not accepted.`, 503);
  }
  return results;
}
