# Evidence and next gates

## Current integration verification — 2026-10-24, v0.4.2

Actual PayPal sandbox OAuth returned HTTP 200 after the existing app credentials were saved to the ignored local configuration. A new synthetic proposal ran through actual local AI and a clearly unauthenticated local test-client response. PayPal created its USD 240.00 invoice (HTTP 201), issued it with notification flags disabled (HTTP 200), and returned its details (HTTP 200). Exact invoice binding passed for merchant, recipient, number/reference, currency, total and line items. Authoritative status is **UNPAID**. Buyer payment is not yet verified.

- [Actual OAuth preflight](../evidence/iterations/2026-10-24/sandbox-preflight.json)
- [Actual provider request/status record](../evidence/iterations/2026-10-24/actual-sandbox-integration.json)
- [Redacted actual sandbox invoice receipt](../evidence/iterations/2026-10-24/actual-sandbox-receipt.json)

The sandbox recipient page displayed the same store deliverable and USD 240.00 amount. Checkout work is ongoing. No external-payment recording endpoint or mock paid state was used. No real funds or final submission occurred.

The [source repository](https://github.com/KaiVenn52/scopepay) is public with MIT detected and anonymously accessible. GitHub Actions passed on Windows and Ubuntu. A 133.53-second actual local-AI/sandbox-query walkthrough was published on YouTube, then explicitly changed to unlisted at the owner's request. [Video](https://youtu.be/jWOupeUs9II). The actual event form subsequently clarified that public or unlisted with no password is accepted; the earlier strict-Public interpretation was corrected. PayPal event registration succeeded after explicit entrant terms approval; the authorized CAPTCHA was completed and draft 1259804 reached the final review step.

## Earlier account access update — 2026-10-24

The authenticated PayPal Developer UI was successfully read in sandbox mode. It contains an existing Default Application linked to a Business sandbox account, with Invoicing checked, and a separate Personal sandbox buyer. No new app, account, key, permission or webhook was created. The secret remained masked. The local ignored `.env` template is prepared; its credential fields are not yet populated at the last preflight. This clears the observed Developer-access/account-availability gap only. OAuth, invoicing API acceptance and buyer payment remain unverified. [Sanitized UI access record](../evidence/iterations/2026-10-24/sandbox-access.json).

## Current verification — 2026-10-23, v0.4.1

Model setup now verifies pinned sizes/digests, uses temporary downloads and bounded retries. A fresh download test completed all four files; the ONNX download needed a retry. A submission consistency gate and English review package are prepared. Final submission is still blocked by external evidence and review gates.

| Check | Observed result |
| --- | --- |
| Syntax and backend/domain/provider/setup/submission tests | Passed; 42/42 tests |
| Actual local model browser workflow | 19 checks passed on v0.4.1; desktop/mobile; zero console errors |
| Fresh model download | All four files downloaded and matched pinned size/SHA-256; no prior cache copy |
| Submission checker | BLOCKED as expected; local QA and submission window pass, external requirements remain pending |
| Real PayPal | User has a normal PayPal account and can log in; no sandbox configuration/API run yet |

[Fresh download record](../evidence/iterations/2026-10-23/model-download-verification.json), [actual AI browser record](../evidence/iterations/2026-10-23/after/real-ai-ui-verification.json), [submission gate report](../evidence/iterations/2026-10-23/submission-readiness.json), [current iteration](ITERATION-2026-10-23.md). A silent 89.28-second local rehearsal was recorded with real local AI and visibly simulated payments; it is not final sandbox footage, public video, or a qualifying submission artifact.

## Previous verification — 2026-10-22, v0.4.0

Redacted evidence receipt export and sandbox preflight are implemented. Receipts preserve the proposal fingerprint and last local status while omitting client text/access data and clearly labeling simulation. Export/checksum verification is not provider attestation or identity authentication.

| Check | Observed result |
| --- | --- |
| Backend/domain/provider/preflight/receipt tests | 33/33 passed |
| Actual local MiniLM browser workflow | 19 checks passed, including downloading and checking the exported JSON; desktop/mobile, zero console errors |
| Receipt checksum CLI | Downloaded browser receipt verified; `authenticated: false` explicitly returned |
| Actual configuration preflight | Sandbox mode, client ID, secret and merchant configuration absent; no OAuth attempted and zero invoice writes |

[Current iteration](ITERATION-2026-10-22.md), [actual model UI record](../evidence/iterations/2026-10-22/after/real-ai-ui-verification.json), [downloaded synthetic receipt](../evidence/iterations/2026-10-22/after/ai-downloaded-evidence-receipt.json), [actual offline preflight](../evidence/iterations/2026-10-22/sandbox-preflight.json). Actual sandbox OAuth, invoice and buyer payment remain unproven. Earlier dated records below remain historical.

## Previous verification — 2026-10-18, v0.3.0

Linked proposal revisions now retire obsolete client links and require fresh acceptance. Uncertain invoice creation has a supported read-only recovery form; full invoice binding is checked before recovery, send and refresh. Approval/source tampering and sibling replacement attempts are rejected.

| Check | Observed result |
| --- | --- |
| Domain/provider/HTTP contracts | 23/23 passed |
| Actual local AI browser workflow | 18 checks passed, including replacement proposal and new acceptance; desktop/mobile, zero console errors |
| Injected recovery browser workflow | 5 checks passed; one attempted create and one recovery GET; zero console errors |
| Actual retrieval regression | 12/12 synthetic clauses ranked first; not independent accuracy evidence |
| Actual PayPal | No credentials; Developer dashboard redirects to login on 2026-10-18. No OAuth/invoice/payment demonstrated. |

[Current iteration](ITERATION-2026-10-18.md), [real-model UI record](../evidence/iterations/2026-10-18/after/real-ai-ui-verification.json), [injected recovery UI record](../evidence/iterations/2026-10-18/after/recovery-ui-verification.json), [retrieval record](../evidence/iterations/2026-10-18/retrieval-evaluation.json). Recovery screenshots display injected sandbox-shaped responses and do not establish actual sandbox access. Earlier dated evidence below remains historical.

## Previous verification — 2026-10-17, v0.2.0

The current product adds explicit additional/included/clarify decisions, editable deliverables and rationale, a separate local client review page, acceptance/objection records bound to the exact proposal revision, withdrawal and an invoice gate requiring acceptance. Respondent identity remains unverified. No external message, payment, publication or submission occurred.

| Current check | Actual result |
| --- | --- |
| Unit/provider/HTTP contracts | 17/17 passed |
| Actual local AI browser workflow | 16 checks passed, including client acceptance and requests for changes; desktop/mobile, no console errors |
| Actual retrieval regression | 12/12 labeled clauses ranked first across 12 synthetic English cases; no independent accuracy or legal-classification claim |
| Real PayPal sandbox | Still not configured or demonstrated |
| Remote CI | Workflow prepared; not executed remotely |

[Current iteration and before/after screenshots](ITERATION-2026-10-17.md), [current browser record](../evidence/iterations/2026-10-17/after/real-ai-ui-verification.json), [retrieval output](../evidence/iterations/2026-10-17/retrieval-evaluation.json), [judging readiness](JUDGE-READINESS.md), [sandbox handoff](SANDBOX-HANDOFF.md).

## Earlier verification snapshot — 2026-10-16

The following records the earlier build. Its missing-client-acceptance limitation has been replaced by the local, explicitly unauthenticated client-response workflow above. Earlier screenshots are retained as historical evidence rather than overwritten.

Verified **2026-10-16, Asia/Kuala_Lumpur**. This local project was created after reading `hackathon-briefs-20261016/paypal-scopepay.md` and the workspace `AGENTS.md`. No pre-existing ScopePay directory was found. Work was confined to `paypal-scopepay/` and temporary isolated test directories. Other projects were not edited. No child agent was created.

## Evidence matrix

| Claim | Actual evidence | Status |
| --- | --- | --- |
| Competition is open | Official Devpost rules: Oct 1–Nov 12, 2026 submission period | Verified; [rule audit](RULES.md) |
| Runnable local application | Node 24.20.0; real HTTP service and Chrome interaction | Verified |
| Syntax checks | `npm.cmd run check`, exit 0 | Passed |
| Domain/provider/HTTP tests | `npm.cmd test`, current run: 13 tests, 13 passed, 0 failed | Passed |
| Browser flow | `npm.cmd run test:ui`, exit 0; [machine-readable checks](../evidence/ui-verification.json) | 12 checks passed |
| Desktop and mobile | Installed Chrome via Playwright, 1440×1000 and 390×844 | Verified |
| Browser console | Final run: zero page errors, warnings or console errors | Passed |
| Actual model inference | Actual CPU MiniLM execution, pinned model revision and model asset SHA-256 hashes; [real output](../evidence/real-ai-verification.json) | Verified |
| Actual AI browser flow | `npm.cmd run test:ui:ai`, 12 checks passed; [record](../evidence/real-ai-ui-verification.json) | Verified; payments still mock |
| Generative Ollama mode | Adapter tested using injected responses; no installed Ollama run | Not demonstrated; optional |
| Actual PayPal OAuth | No sandbox credentials configured | Not attempted |
| Actual PayPal invoice/payment | Adapter contract tested with injected responses; browser workflow uses mock | Not demonstrated |
| Webhook verification/delivery | Not implemented; use authenticated invoice polling | Not claimed |
| Entrant registration/eligibility | No logged-in Devpost state or personal eligibility evidence inspected | Not verified |
| Public repo/video/submission | No public publishing or final submission authorized | Not performed |

## Meaningful tests

The tests reject invented quotes and model-supplied prices; require a positive USD amount and explicit human confirmation; reject duplicate or included items; freeze approved amounts; distinguish partial, pending, manually marked and refunded states from fully paid; verify sandbox OAuth and invoice request shapes; prevent concurrent duplicate approvals/invoices; preserve records across restart; block cross-origin mutation requests; and block automatic retries after an uncertain remote create, including after restart.

Unit provider tests deliberately inject responses and make no external API calls. They establish request handling and state-machine behavior, not PayPal acceptance or account capability. Separate `verify:ai` and `test:ui:ai` runs execute the actual pinned MiniLM model; inference output is not injected there.

The browser run exercises example loading, three source-backed offline candidates, stale-source approval rejection, manual selection and USD 240.00 pricing, confirmation, draft creation, issuance, partial/pending/paid simulations, status refresh, and persistence after page reload. The final run has no horizontal page overflow at 390px.

The real-model browser run repeats this workflow with actual local semantic retrieval. The store and booking requests retrieve the supplied exclusion clause, while the headline request retrieves the included revision clause. All three remain `unclear` for human interpretation. [Actual model-backed review](../evidence/real-ai-ui-review.json). The cached-only direct repeat loaded assets in 529 ms and performed the three-request inference in 31 ms; this is a measured run on this machine, not a performance guarantee.

## Visual inspection

Browser plugin was unavailable; regular Playwright used a fresh headless installed Google Chrome session. Final screenshots were opened with `view_image`. Inspected points: source/review panel structure, type and contrast, exact source readability, approval amount and recipient, explicit simulation/payment labels, mobile stacking, controls, and hash wrapping. Fixed a missing favicon 404 and a clipped approval hash before the final pass. The implemented layout follows [the written design](DESIGN.md); no generated or user-approved concept image exists.

- [Desktop entry screen](../evidence/desktop-empty.png)
- [Desktop approved change and invoice](../evidence/desktop-approved.png)
- [Mobile entry screen](../evidence/mobile-top.png)
- [Mobile invoice state](../evidence/mobile-invoice.png)

The original screenshots above show offline analysis and simulated payments. New model-backed screenshots were also inspected with `view_image`: [real AI review](../evidence/ai-desktop-review.png), [real AI mobile entry](../evidence/ai-mobile-top.png), and [real AI approved invoice](../evidence/ai-desktop-approved.png). New screenshots correspond to real local retrieval, but every shown USD 240.00 invoice remains simulated. No screenshot establishes a PayPal sandbox payment or production usage.

## Exact remaining gates

1. **PayPal sandbox:** the user signs in to PayPal Developer, confirms business sandbox access, creates/selects a sandbox REST app, and places credentials only in the ignored local `.env`. A distinct personal sandbox buyer must be available. Run OAuth → create draft → issue → sandbox buyer payment → detail refresh. Record sanitized invoice ID, response statuses and payment outcome. Configuration presence alone does not clear this gate. No `.env` or PayPal environment configuration was present when checked this round.
2. **Competition access:** user confirms age and absence of disqualifying affiliations/conflicts; verify Devpost join state. Malaysia is not in the named exclusion list, but personal eligibility has not been certified.
3. **Final artifacts:** after sandbox passes, capture the real screen demonstration below three minutes and revise the English description to match actual evidence. Public code/video publication and final submission each remain outside the current authorization.

The real AI execution gate is now cleared for semantic retrieval, with a pinned public model downloaded into this project's ignored cache. Generative contract analysis remains an optional unverified Ollama capability and is not conflated with retrieval. No paid inference API was used.

The local product is intentionally a single-user prototype: unencrypted local storage, USD-only pricing, no authenticated client signature, no automatic retry/reset after uncertain creation, and no public webhook receiver. These are disclosed limits, not completed production features.
