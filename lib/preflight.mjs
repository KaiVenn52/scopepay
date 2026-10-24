export async function sandboxPreflight(env = process.env, { oauth = false, fetcher = fetch } = {}) {
  const usable = value => typeof value === 'string' && value.trim().length > 0 && !/^(your[-_ ]|placeholder|example)/i.test(value.trim());
  const checks = {
    sandboxMode: env.PAYPAL_MODE === 'sandbox',
    clientIdPresent: usable(env.PAYPAL_CLIENT_ID),
    clientSecretPresent: usable(env.PAYPAL_CLIENT_SECRET),
    merchantEmailValid: usable(env.PAYPAL_MERCHANT_EMAIL) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.PAYPAL_MERCHANT_EMAIL)
  };
  const configured = Object.values(checks).every(Boolean);
  const report = { schema: 'scopepay-sandbox-preflight/v1', checkedAt: new Date().toISOString(),
    endpoint: 'https://api-m.sandbox.paypal.com', checks, configured,
    oauth: { requested: oauth, attempted: false, result: oauth ? 'blocked-by-configuration' : 'not-requested' },
    invoiceCapabilityVerified: false, buyerPaymentVerified: false, invoiceWrites: 0,
    limitation: 'Configuration and OAuth do not establish merchant identity, invoicing capability, a buyer payment or settlement. No invoice is created by this command.' };
  if (!oauth || !configured) return report;
  report.oauth.attempted = true;
  try {
    const response = await fetcher('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST', signal: AbortSignal.timeout(20000),
      headers: { Authorization: `Basic ${Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials'
    });
    report.oauth.httpStatus = response.status;
    if (!response.ok) { report.oauth.result = 'rejected'; return report; }
    const token = await response.json();
    report.oauth.result = typeof token.access_token === 'string' && token.access_token.length > 0 ? 'authenticated' : 'invalid-token-response';
  } catch { report.oauth.result = 'network-or-response-error'; }
  // Provider bodies, tokens, secrets and thrown messages never enter the report.
  return report;
}
