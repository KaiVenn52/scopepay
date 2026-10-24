import { readdir, readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { localDate } from '../lib/time.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const files = [];
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['node_modules', '.git', 'data', 'test-results', '.model-cache', 'delivery'].includes(entry.name) || (entry.name.startsWith('.env') && entry.name !== '.env.example')) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(target);
    else if (entry.isFile() && !['SHA256SUMS.txt', 'delivery-verification.json'].includes(entry.name)) files.push(target);
  }
}
await collect(root);
const broken = [];
for (const file of files.filter(file => file.endsWith('.md'))) {
  const content = await readFile(file, 'utf8');
  for (const match of content.matchAll(/\]\(([^)]+)\)/g)) {
    const link = match[1];
    if (/^(https?:|#|mailto:)/.test(link)) continue;
    const target = path.resolve(path.dirname(file), link.split('#')[0]);
    if (!target.startsWith(root + path.sep)) { broken.push(`${file}: outside project: ${link}`); continue; }
    try { await access(target); } catch { broken.push(`${path.relative(root, file)}: ${link}`); }
  }
}
if (broken.length) throw new Error(`Broken local links:\n${broken.join('\n')}`);
const sums = [];
for (const file of files.sort()) sums.push(`${createHash('sha256').update(await readFile(file)).digest('hex')}  ${path.relative(root, file).replaceAll('\\', '/')}`);
await writeFile(path.join(root, 'evidence', 'SHA256SUMS.txt'), sums.join('\n') + '\n');
const summary = { date: localDate(), timezone: 'Asia/Kuala_Lumpur', filesHashed: sums.length, brokenLocalLinks: 0, manifest: 'evidence/SHA256SUMS.txt', excludes: ['node_modules', '.git', 'data', '.env', '.model-cache', 'delivery', 'test-results', 'manifest and this verification record'] };
await writeFile(path.join(root, 'evidence', 'delivery-verification.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
