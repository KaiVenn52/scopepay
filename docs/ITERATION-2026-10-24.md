# ScopePay v0.4.2 — actual PayPal sandbox integration

## Actual provider outcome

The user explicitly delegated the local sandbox configuration step. Existing credentials were read through the already logged-in Developer UI and written directly into ignored `.env`; values were not printed. An initial 401 was traced to the Client ID being displayed in two separate DOM spans: only one 40-character span had been read. Reading both visible spans resolved the issue. No new app, key, account, permission or webhook was created.

The real OAuth endpoint returned HTTP 200. An isolated workspace on port 3187 ran actual cached MiniLM on synthetic scope/request text, froze a USD 240 proposal and recorded a clearly unauthenticated local test-client acceptance. PayPal created the draft (201), issued it with both email notification flags false (200), and returned invoice details (200). The invoice's merchant, recipient, number/reference, currency, exact total and line items passed the implemented binding checks. The authoritative state is UNPAID, not PAID.

## Reusable local integration tools

`start:sandbox` requires sandbox mode and configured credentials, uses actual cached AI and keeps its data in ignored `data/sandbox`. Its audit records only HTTP method/path/status, duration and provider debug ID; request headers, credentials, tokens and bodies are omitted. `sandbox:prepare` takes the personal buyer email from ignored configuration, resumes the existing matching review/invoice and blocks uncertain creation. It performs actual sandbox invoice writes but never makes a buyer payment or records an external payment.

## Validation and evidence

Syntax checks and 42/42 backend tests passed. The actual-model browser regression passed 19 checks on v0.4.2. A separate rendered check used the actual saved sandbox invoice and displayed SANDBOX / UNPAID with no injected provider data; desktop 1440×1000 and mobile 390×844 passed without console errors or horizontal mobile overflow.

- [Actual OAuth](../evidence/iterations/2026-10-24/sandbox-preflight.json)
- [Actual invoice API statuses](../evidence/iterations/2026-10-24/actual-sandbox-integration.json)
- [Redacted invoice receipt](../evidence/iterations/2026-10-24/actual-sandbox-receipt.json)
- [Actual saved sandbox UI check](../evidence/iterations/2026-10-24/after/actual-sandbox-ui.json)
- [Actual invoice desktop view](../evidence/iterations/2026-10-24/after/actual-sandbox-desktop.png)
- [Actual invoice mobile view](../evidence/iterations/2026-10-24/after/actual-sandbox-mobile.png)
- [Actual model browser regression](../evidence/iterations/2026-10-24/after/real-ai-ui-verification.json)

## Remaining work

The invoice's sandbox recipient page displays the expected deliverable and USD 240.00. After the user restored the Developer login, the existing independent Personal buyer was successfully signed into the official sandbox website using the existing test credentials. The password was not printed or saved in project files. The original invoice was reloaded under that buyer session. Clicking its PayPal button both before and after login opened an about:blank popup that did not advance; the invoice page reported no console errors. A manual-click comparison was requested to distinguish the browser automation path from the site's own checkout behavior. No checkout confirmation or buyer payment has been observed.

A repeat `sandbox:prepare` run only loaded the existing review, refreshed its invoice and exported a receipt. It did not create or issue another invoice. The provider returned HTTP 200 and UNPAID again, with exact binding verified. Desktop and mobile screenshots were visually inspected; the invoice status and unauthenticated test-client disclosure are readable in both.

Buyer payment is pending and the current receipt is not paid evidence. Final footage, public repository/video, eligibility/registration confirmation and final submission review remain outstanding. No real funds, production payment, public publishing or final submission occurred.
