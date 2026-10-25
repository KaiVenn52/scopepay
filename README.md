# ScopePay

Turn “just one more thing” into an evidence-backed, reviewed scope change and a PayPal sandbox invoice.

**v0.4.2: runnable local prototype with verified real local AI retrieval, client-requested revisions, guarded invoice recovery and redacted evidence receipts. Actual sandbox OAuth, invoice creation, issuance and exact-bound detail queries are verified. Buyer test payment remains pending.**

[Source repository](https://github.com/KaiVenn52/scopepay) · [133.53-second actual sandbox walkthrough](https://youtu.be/jWOupeUs9II) · [Judge setup](submission/JUDGE-QUICKSTART.md). The video is currently unlisted at the owner's request; the actual event form explicitly allows public or unlisted video with no password. PayPal event registration is confirmed; final submission has not occurred.

ScopePay is for independent developers and designers whose clients add work after agreeing a scope. It preserves exact quotations, distinguishes additional work, included work and requests needing clarification, and presents a frozen proposal in a separate client view. A new invoice requires a response accepting that exact revision. The local client page records a self-reported name; it does not authenticate identity or establish a verified legal signature.

## Run locally

Requires Node.js 22 or newer; verified runtime is Node.js 24.20.0. The offline workflow needs only Node.js. Real local semantic AI uses the pinned Transformers.js npm dependency and cached model assets.

```sh
git clone https://github.com/KaiVenn52/scopepay.git
cd scopepay
npm start
```

On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm`.

Open **http://127.0.0.1:3186**. Defaults are `PAYPAL_MODE=mock` and `AI_MODE=offline`. No account, model, dependency installation or money is needed for the local demonstration.

Click **Load example**, then **Compare the scope**. Mark the store **Additional work**, booking **Needs clarification**, and the headline revision **Already included**. Give the store a deliverable title and rationale, price it at `240.00`, enter `buyer@example.test`, confirm your review, and click **Prepare client proposal**. Open **client review**, enter a synthetic name and accept the scope and price. Return and refresh the client response. Only then can you create and issue an invoice. Expand **Demo controls** to simulate payment states. Try **Request changes** on a separate proposal: it will not unlock invoicing. Nothing is emailed. Offline mode makes no AI claim.

After a client requests changes, choose **Revise this proposal →**. Update the sources or deliverable, rerun the comparison, and prepare a new frozen version. The previous client link becomes retired and the new amount needs fresh acceptance. No invoice is unlocked by the old response.

Local records, source documents and approval snapshots are stored unencrypted in ignored `data/records.json`. Use synthetic or permission-cleared material. Run only one server process per data directory. The app binds only to `127.0.0.1`; do not expose this unauthenticated prototype to the Internet.

## Run the verified real local AI

```powershell
npm.cmd ci
npm.cmd run verify:ai
npm.cmd run start:ai
```

On the first verification run, public model assets are downloaded into ignored `.model-cache/` inside this project (about 23.7 MB). No client text is sent to Hugging Face. `start:ai` requires cached assets and runs actual CPU inference; it does not silently substitute offline rules. On this prepared checkout the assets are already cached. Open **http://127.0.0.1:3186**.

The model is pinned to `Xenova/all-MiniLM-L6-v2` revision `751bff37182d3f1213fa05d7196b954e230abad9`, q8. It embeds the scope clauses and requests, then retrieves related verbatim clauses. All candidates stay `unclear`: similarity is not an inclusion verdict, confidence, or legal entitlement. The freelancer decides which requests represent additional work and sets prices. This is real AI semantic retrieval, not generated contract reasoning. [Model details and limitations](docs/MODEL.md).

Actual CPU inference and actual browser use have passed; see [model evidence](evidence/real-ai-verification.json) and [browser evidence](evidence/real-ai-ui-verification.json). A cached-only repeat loaded the model in about 529 ms and handled the three synthetic requests in about 31 ms on this machine; timing varies with hardware and load.

## Optional generative analysis with Ollama

With Ollama already installed, running, and an appropriate model already downloaded, copy `.env.example` to `.env` and set:

```dotenv
AI_MODE=ollama
OLLAMA_MODEL=your-installed-model-name
OLLAMA_URL=http://127.0.0.1:11434
```

Restart. The backend calls Ollama `/api/chat`, requests JSON, and verifies that every quoted string occurs verbatim in the corresponding source. Invalid model output fails rather than falling back to fake AI. No model price or model approval is accepted. Even valid quotes do not prove that the model's interpretation is correct: review each finding. No paid AI API is configured.

## Enable PayPal sandbox

Sign in yourself at [PayPal Developer](https://developer.paypal.com/dashboard/). Use a business sandbox account and an associated REST app, plus a separate personal sandbox buyer account. Place credentials only in the ignored `.env` locally, never in chat, screenshots, public code, or submission materials:

```dotenv
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=your-sandbox-client-id
PAYPAL_CLIENT_SECRET=your-sandbox-client-secret
PAYPAL_MERCHANT_EMAIL=your-business-sandbox-account-email
```

Restart and create a **new review**. Use your personal sandbox account's email as the recipient. The app creates an Invoicing v2 draft, then issues it with notification flags disabled. If PayPal returns a sandbox recipient view URL, open it and sign in with the sandbox buyer. Complete only a simulated sandbox payment, then click **Refresh status** in ScopePay. The app never records an external payment to fabricate settlement and contains no production PayPal endpoint.

PayPal may restrict capabilities by app, account, or region. Configuration being present is not proof that OAuth or invoicing succeeds. See [integration evidence and remaining gates](docs/EVIDENCE.md). A failed creation with an uncertain remote outcome is blocked from automatic retry; see [the reconciliation procedure](docs/TECHNICAL.md).

## Isolated actual sandbox workflow

After configuring the existing sandbox app and `PAYPAL_SANDBOX_BUYER_EMAIL` locally:

```powershell
npm.cmd run start:sandbox
```

Open `http://127.0.0.1:3187`. This requires real cached AI and sandbox credentials and stores records in ignored `data/sandbox`, separate from the default demonstration workspace. No production endpoint is available.

`npm.cmd run sandbox:prepare` runs a synthetic USD 240 verification proposal through the local service, records an explicitly unauthenticated local test-client response, creates/issues the actual sandbox invoice with email flags disabled and queries its details. This command performs actual sandbox invoice writes; it does not make a buyer payment. Re-running reuses its existing matching review/invoice and blocks uncertain creation. It never records an external payment or simulates a paid state. HTTP statuses are saved without credentials, tokens or provider bodies. Actual verified status is currently UNPAID.

## Evidence receipt

After freezing a proposal, choose **Export evidence receipt**. The JSON contains the proposal/source fingerprints, revision state, USD total, counts of charged/included/clarification items, client decision and the last stored invoice state. It omits names, emails, source text, notes, client access tokens, invoice URLs and raw invoice IDs. Fingerprints and amounts can still be linked to other records, so review before sharing. Export makes no PayPal call and does not update payment status.

A mock payment stays `simulation-only`. A sandbox response remains a stored adapter observation, not an independently attested payment. Client identity is always unverified. A checksum detects content changes; it is not a signature and anyone able to edit the local data could construct another receipt.

```powershell
npm.cmd run verify:receipt -- 'path/to/downloaded-receipt.json'
```

## Sandbox preflight

```powershell
npm.cmd run sandbox:preflight
# After configuring your own sandbox credentials locally:
npm.cmd run sandbox:preflight -- --oauth
```

The default check stays offline and prints configuration booleans, never credential values. `--oauth` explicitly requests one sandbox token check; it does not create an invoice or charge anything. Exit code `2` means missing configuration or unsuccessful requested OAuth. OAuth success does not verify that the configured merchant belongs to the app or that invoicing/buyer payment works. [Account handoff](docs/SANDBOX-HANDOFF.md).

## Verification

```powershell
npm.cmd run check
npm.cmd test
npm.cmd run verify:ai -- --cached-only
npm.cmd run test:ui:ai
```

Unit/HTTP tests use temporary isolated data directories and injected provider responses. They verify cents arithmetic, quote provenance, approval gating, duplicate attempts, persistence, uncertain create outcomes, sandbox request shapes, semantic ranking, input segmentation and payment status distinctions. **Injected responses are not evidence of provider acceptance.** `verify:ai` and `test:ui:ai` separately execute the actual local model; they do not mock it. HTTP tests need local loopback permission in restricted environments.

For the injected invoice-recovery browser check run `npm.cmd run test:ui:recovery`. This tests a deliberately lost creation response and read-only attachment of a matching invoice; it makes no actual PayPal API call.

For offline browser QA run `npm.cmd run test:ui`. For actual local AI browser QA run `npm.cmd run test:ui:ai` after model setup. Browser checks use installed Google Chrome in a fresh, headless profile and start their own ephemeral local service with a temporary workspace. They never read your regular browser profile. Both payment flows remain simulated until PayPal sandbox is configured and tested.

## Delivery files

- [Official rule audit](docs/RULES.md)
- [Integration evidence and blockers](docs/EVIDENCE.md)
- [Technical design and reconciliation](docs/TECHNICAL.md)
- [English submission draft](submission/DESCRIPTION.md)
- [Demo script under three minutes](submission/DEMO-SCRIPT.md)
- [Local UI design specification](docs/DESIGN.md)
- [Product iteration and before/after evidence](docs/ITERATION-2026-10-24.md)
- [Judging readiness and honest gaps](docs/JUDGE-READINESS.md)

The working API uses polling for payment status. A webhook receiver is not implemented; verified webhook delivery requires an additional authorized public HTTPS endpoint. [MIT license](LICENSE). No publishing or submission was authorized in this work round.

## Submission review

Start with [judge setup and the exact demo flow](submission/JUDGE-QUICKSTART.md), [English field copy](submission/FORM-COPY.md), and the [release checklist](submission/RELEASE-CHECKLIST.md). `npm run submission:check -- --write` checks current-version browser QA and the explicitly reviewed external evidence recorded in `submission/submission-state.json`. Exit code 2 means missing gates. It never publishes or submits, and local receipts alone cannot establish an actual sandbox run.

`npm run record:rehearsal` records the real local AI with simulated payments in a fresh local browser and saves a labeled WebM under ignored `delivery/`. It is a silent rehearsal, not qualifying PayPal evidence or a published YouTube video. The final recording still needs actual sandbox footage and publication approval.

## Local source package

On Windows PowerShell, run `./scripts/package-source.ps1` to create a local ZIP under ignored `delivery/`. The script verifies local links, refreshes the SHA-256 source manifest, and excludes credentials, models, dependencies, application data and previous packages. It does not publish anything. `./scripts/verify-package.ps1` then checks the ZIP hash, extracts a fresh copy, installs that copy's dependencies from the npm cache, runs its checks/tests, and executes real model setup/inference. A cache miss during that explicit package verification requires a normal `npm ci` first.

The included GitHub Actions workflow is prepared for Linux/Windows checks after a separately authorized repository publication. It has not run remotely and is not evidence of passing remote CI.
