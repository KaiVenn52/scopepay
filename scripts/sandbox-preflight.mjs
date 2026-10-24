import { sandboxPreflight } from '../lib/preflight.mjs';
const args = process.argv.slice(2);
if (args.some(arg => arg !== '--oauth')) {
  console.error('Usage: npm run sandbox:preflight [-- --oauth]. No invoice writes are performed.');
  process.exitCode = 2;
} else {
  const report = await sandboxPreflight(process.env, { oauth: args.includes('--oauth') });
  console.log(JSON.stringify(report, null, 2));
  if (!report.configured || (report.oauth.requested && report.oauth.result !== 'authenticated')) process.exitCode = 2;
}
