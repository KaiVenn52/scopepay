# Shortest path to real sandbox evidence

Actual OAuth, invoice creation, issuance and exact-bound details queries passed on 2026-10-24. The existing application credentials are configured privately. The current USD 240.00 sandbox invoice is UNPAID; do not create another invoice to resume buyer testing. `npm run start:sandbox` resumes the isolated workspace on port 3187; `npm run sandbox:prepare` reuses its matching existing review and invoice. Buyer payment remains the next gate. Do not send secrets in chat.

## Resume this configured project

The Business seller, independent Personal buyer and REST app already exist. Credentials are configured in ignored `.env`, and the buyer has successfully logged into the official sandbox site. Reuse the current invoice; do not repeat account setup or create a replacement invoice. The outstanding browser issue is a checkout popup that remains at `about:blank` after clicking PayPal. Compare a manual click in the logged-in browser before changing the integration. No checkout confirmation or paid result has been observed.

Run `npm.cmd run start:sandbox` if the service is stopped, then `npm.cmd run sandbox:prepare` to refresh the existing invoice and receipt. The latest provider result is UNPAID. When buyer checkout becomes available, validate only sandbox test funds and refresh the original invoice afterward. Preserve the current state until the provider reports PAID with the exact invoice binding.

## Fresh installation only

The steps below are for a separate clean installation, not for resuming the existing configured project.

1. Sign in yourself at [PayPal Developer](https://developer.paypal.com/dashboard/). In the sandbox account area, create/select a **business** seller and a separate **personal** buyer. Keep their test logins locally.
2. In the sandbox REST app area, create/select an app associated with that business seller. Copy its sandbox client ID and client secret locally.
3. Copy `.env.example` to `.env` inside ScopePay and set `PAYPAL_MODE=sandbox`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and `PAYPAL_MERCHANT_EMAIL` to the business sandbox account's email. This file is ignored and excluded from the source package. Leave production credentials out entirely.
4. Run `npm.cmd run sandbox:preflight` (offline config only), then `npm.cmd run sandbox:preflight -- --oauth` for the sandbox token check. A configured app or token alone does not establish invoicing capability or matching merchant identity. Reports omit credential values; exit code 2 is an unmet gate. Restart with `npm.cmd run start:ai`. Create a new review, use the **personal sandbox buyer email**, prepare the proposal, open client review, accept the exact scope and price, and refresh the response. Create and issue the sandbox invoice. No notification emails are requested by ScopePay.
5. Open the returned sandbox invoice URL, use the personal sandbox buyer, and complete only a sandbox payment. Refresh the ScopePay invoice status. Save sanitized evidence of invoice ID, request/response status and the invoice's actual final state. Export the evidence receipt after refreshing; it is a redacted local snapshot and not an independent PayPal attestation. Never save OAuth tokens or passwords in the evidence folder.

If the account/API refuses invoicing, capture only the sanitized error name, HTTP status and provider debug reference (when available). Account setup, OAuth success, invoice creation, issuance, sandbox payment and final settlement are separate checkpoints. A manually recorded payment is not proof of a buyer transaction, and the app does not call PayPal's external-payment recording endpoint.

No real funds, production payment, public publishing or final submission is authorized by this checklist. An uncertain create outcome must be reconciled against the sandbox dashboard before retrying; see [technical notes](TECHNICAL.md).
