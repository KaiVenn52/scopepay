# Run ScopePay for judging

ScopePay is a loopback-only Node.js desktop web application. No public hosting is required. Use synthetic examples. Client identity is self-reported, and payment modes are visibly distinguished. Source documents are stored unencrypted locally.

## Prerequisites

Node.js 22 or newer (24 tested), npm, a modern browser and an Internet connection for the initial dependency/model setup. Windows PowerShell may require `npm.cmd` instead of `npm`. The application itself does not require Chrome; automated browser checks use installed Google Chrome.

## Start with real AI and simulated payments

From the repository root:

```sh
npm ci
npm run verify:ai
npm run start:ai
```

Open `http://127.0.0.1:3186`. The model setup downloads about 23.7 MB from the pinned public Hugging Face revision. Each file must match a committed size and SHA-256. Temporary downloads are renamed only after verification; failures time out and retry at most twice. Re-running resumes at the level of complete verified files. `start:ai` requires the complete verified cache and does not silently switch to offline rules. Once installed, source text stays local.

If installation is unavailable, `npm start` runs a clearly labeled offline review helper without AI inference. It is not a substitute for evaluating the real AI path.

## Follow the product flow

1. Load the example and compare its scope. Real MiniLM embeddings retrieve relevant agreement clauses; they do not determine legal inclusion or price.
2. Mark the store as additional, booking as needing clarification, and the headline revision as already included. Enter a store deliverable, rationale, USD 240.00, and a synthetic buyer email. Confirm and prepare the proposal.
3. Open client review. Inspect the included work and clarification, then accept as a synthetic client. Return and refresh the response. A proposal without acceptance cannot unlock a new invoice.
4. Create and issue the simulated invoice. Under Demo controls, partial and pending payments remain unsettled. Fully paid remains explicitly labeled SIMULATION.
5. Export the evidence receipt. It omits private source text and access data. Verify with `npm run verify:receipt -- path/to/receipt.json`. The checksum is not a signature or PayPal attestation.
6. For the objection flow, use a new proposal and request changes. Revise it, prepare a replacement and obtain new acceptance. The old link becomes retired.

## Actual PayPal sandbox test

Use your own PayPal Developer login, a business sandbox seller's REST app and a separate personal sandbox buyer. Do not use production credentials. Copy `.env.example` to an ignored `.env` only if `.env` does not already exist, then configure:

```dotenv
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=your-sandbox-app-client-id
PAYPAL_CLIENT_SECRET=your-sandbox-app-secret
PAYPAL_MERCHANT_EMAIL=your-business-sandbox-email
PAYPAL_SANDBOX_BUYER_EMAIL=your-personal-sandbox-buyer-email
```

Run `npm run sandbox:preflight` for local configuration checks and `npm run sandbox:preflight -- --oauth` for a token check. Neither creates an invoice. Restart with `npm run start:ai`, create a separate review and use the personal sandbox buyer's email. Accept the proposal, create the draft, issue it without emails, open the returned sandbox invoice, pay with the test buyer, and refresh status. Only a provider `PAID` state is fully settled; a partially paid event is insufficient.

If creation becomes uncertain, do not create another review to bypass the gate. Find its displayed invoice number in the sandbox dashboard and use the existing invoice ID in **Verify & recover existing invoice**. A read-only query must match the merchant, recipient, frozen reference, currency, exact amount and every line. Account or capability errors are separate from software tests.

## Verification and troubleshooting

```sh
npm run check
npm test
npm run verify:ai -- --cached-only
npm run test:ui:ai
```

Only one instance should use the same data directory. If port 3186 is already used, stop the earlier ScopePay instance or configure a different `PORT`; do not terminate another application's process. A version mismatch message means the server needs restarting after files changed. A corrupt or missing model asset fails explicitly; rerun `npm run verify:ai`. Do not expose this unauthenticated local service to the Internet.

No shared credentials are included in the repository. Account-backed sandbox results must be checked separately from unit fixtures and simulated demo controls. See the current [evidence status](../docs/EVIDENCE.md) and [sandbox handoff](../docs/SANDBOX-HANDOFF.md).
