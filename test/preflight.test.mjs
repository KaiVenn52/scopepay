import test from 'node:test';
import assert from 'node:assert/strict';
import { sandboxPreflight } from '../lib/preflight.mjs';
const env = { PAYPAL_MODE: 'sandbox', PAYPAL_CLIENT_ID: 'PRIVATE-ID', PAYPAL_CLIENT_SECRET: 'PRIVATE-SECRET', PAYPAL_MERCHANT_EMAIL: 'merchant@test.invalid' };
test('preflight is network-free by default, even when credentials are present', async () => {
  let calls = 0;
  const report = await sandboxPreflight(env, { fetcher: () => { calls++; } });
  assert.equal(report.configured, true); assert.equal(report.oauth.attempted, false); assert.equal(calls, 0);
  assert.equal(report.invoiceCapabilityVerified, false); assert.equal(report.buyerPaymentVerified, false);
  assert.ok(!JSON.stringify(report).includes('PRIVATE-'));
});
test('live, absent and placeholder configuration blocks OAuth without sending credentials', async () => {
  let calls = 0;
  for (const config of [{}, { ...env, PAYPAL_MODE: 'live' }, { ...env, PAYPAL_CLIENT_SECRET: 'your-secret' }, { ...env, PAYPAL_MERCHANT_EMAIL: 'invalid' }]) {
    const report = await sandboxPreflight(config, { oauth: true, fetcher: () => { calls++; } });
    assert.equal(report.configured, false); assert.equal(report.oauth.attempted, false);
  }
  assert.equal(calls, 0);
});
test('explicit OAuth sends exactly one token request to the fixed sandbox host and never exports token', async () => {
  const calls = [];
  const report = await sandboxPreflight(env, { oauth: true, fetcher: async (url, options) => {
    calls.push(url); assert.equal(options.method, 'POST'); assert.equal(options.body, 'grant_type=client_credentials');
    assert.match(options.headers.Authorization, /^Basic /);
    return { ok: true, status: 200, json: async () => ({ access_token: 'PRIVATE-TOKEN' }) };
  } });
  assert.deepEqual(calls, ['https://api-m.sandbox.paypal.com/v1/oauth2/token']);
  assert.equal(report.oauth.result, 'authenticated'); assert.equal(report.invoiceWrites, 0);
  assert.equal(report.buyerPaymentVerified, false); assert.ok(!JSON.stringify(report).includes('PRIVATE-'));
});
test('OAuth rejection and network errors cannot leak response bodies or exception secrets', async () => {
  for (const fetcher of [async () => ({ ok: false, status: 401, text: async () => 'PRIVATE-BODY' }), async () => { throw new Error('PRIVATE-SECRET'); }]) {
    const report = await sandboxPreflight(env, { oauth: true, fetcher });
    assert.notEqual(report.oauth.result, 'authenticated'); assert.ok(!JSON.stringify(report).includes('PRIVATE-'));
  }
});
test('a successful HTTP status without an access token is not authenticated evidence', async () => {
  const report = await sandboxPreflight(env, { oauth: true, fetcher: async () => ({ ok: true, status: 200, json: async () => ({}) }) });
  assert.equal(report.oauth.result, 'invalid-token-response');
});
