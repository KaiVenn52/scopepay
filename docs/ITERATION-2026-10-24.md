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

Buyer payment is pending and the current receipt is not paid evidence. The subsequent publication/registration update below supersedes the earlier unpublished status. No real funds, production payment or final submission occurred.

## Narrated video, publication and registration

A 133.525669-second H.264/AAC screen recording now demonstrates fresh local MiniLM inference, human review/price, synthetic client acceptance, then an explicitly disclosed switch to the previously issued account-backed invoice. The recording performs a fresh authenticated PayPal refresh and exports its redacted UNPAID receipt. It never creates another invoice or simulates payment. Microsoft Zira Desktop supplies English synthetic narration. Start/middle/end frames were inspected, both media streams decode correctly, and audio peak/mean levels are -2.4/-21.2 dB.

Source was publicly released with MIT at https://github.com/KaiVenn52/scopepay after authorization. Anonymous repository/license access and Windows/Ubuntu GitHub Actions passed. Video https://youtu.be/jWOupeUs9II was published, then explicitly changed to unlisted at the owner's request. The actual event form explicitly allows public or unlisted with no password, resolving the earlier overly strict interpretation of the overview wording.

The entrant confirmed age, Malaysia residence and no disqualifying affiliation, and subsequently approved the exact registration data and official terms at action time. PayPal event registration returned "Thanks for registering!". Project creation triggered a CAPTCHA; completing the current challenge was separately authorized. The challenge passed and draft 1259804 was filled through the final review step (4/5). Final submission is not authorized or performed.
