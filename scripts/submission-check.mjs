import { readFile, mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { submissionReadiness } from '../lib/submission.mjs';
import { localDate } from '../lib/time.mjs';
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const readLocal = async file => {
  if (typeof file !== 'string') return null;
  const target = path.resolve(root, file);
  if (!target.startsWith(root + path.sep)) throw new Error('Evidence path must stay inside ScopePay.');
  try { return JSON.parse(await readFile(target, 'utf8')); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
};
const state = await readLocal('submission/submission-state.json');
const pkg = await readLocal('package.json');
const qa = await readLocal(state.localQaFile);
const receipt = await readLocal(state.sandbox?.receiptFile);
const licensePresent = await access(path.join(root, 'LICENSE')).then(() => true, () => false);
const report = submissionReadiness(state, { qa, receipt, appVersion: pkg.version, licensePresent });
if (process.argv.includes('--write')) {
  const directory = path.join(root, 'evidence', 'iterations', localDate()); await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'submission-readiness.json'), JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report, null, 2));
if (report.result === 'BLOCKED') process.exitCode = 2;
