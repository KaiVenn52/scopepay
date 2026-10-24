import { readFile } from 'node:fs/promises';
import { verifyReceipt } from '../lib/receipt.mjs';
try {
  if (process.argv.length !== 3) throw new Error('Usage: npm run verify:receipt -- path/to/downloaded-receipt.json');
  console.log(JSON.stringify(verifyReceipt(JSON.parse(await readFile(process.argv[2], 'utf8'))), null, 2));
} catch {
  console.error('Receipt verification failed: supply one valid ScopePay receipt JSON file with its original content checksum.');
  process.exitCode = 1;
}
