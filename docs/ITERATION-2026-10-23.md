# ScopePay v0.4.1 — submission preparation, 2026-10-23

## Delivered

- Model setup now checks committed byte sizes/SHA-256 for every asset, retries at most twice with a 60-second attempt limit and only renames complete verified temporary files. Corrupt caches fail explicitly in cached-only mode. A fresh real download completed, including a successful retry of the ONNX model.
- English Devpost field copy, judge installation/testing instructions, updated rule audit and a release checklist are prepared. The actual authenticated PayPal submission form has not yet been inspected.
- `submission:check` evaluates current-version real-AI browser QA and explicit human attestations for the sandbox run, public repository/video, eligibility/registration and final material review. It detects mock receipts and old QA and returns at most READY_FOR_FINAL_HUMAN_REVIEW; it never publishes, registers or submits.
- A continuous silent local screen rehearsal was recorded with actual MiniLM and simulated payment. A persistent subtitle overlay discloses SIMULATION REHEARSAL, REAL LOCAL AI, and NO PAYPAL API CALLS. MP4: H.264, 1440×900, 89.28 seconds. First/middle/end extracted frames were inspected. This footage is a rehearsal only and cannot replace the final sandbox/YouTube requirement.

## Validation

Syntax checks passed; 42/42 backend/domain/provider/model-setup/submission-gate tests passed. The actual model browser workflow passed 19 checks at 1440×1000 and 390×844 with zero console errors. Five model-setup tests exercise verified cache reuse, truncation/hash/size rejection, corrupt-cache repair, interrupted retries and path containment. Four submission tests reject missing remote evidence, mock receipts/local video, stale QA and overlong video, and enforce final human review rather than auto-submission.

Evidence: [fresh download](../evidence/iterations/2026-10-23/model-download-verification.json), [actual model browser QA](../evidence/iterations/2026-10-23/after/real-ai-ui-verification.json), [submission readiness](../evidence/iterations/2026-10-23/submission-readiness.json).

## Exact remaining gates

The user confirmed having a normal PayPal account and can personally log in. No developer sandbox credentials or actual API/payment success have been observed. Developer browser control timed out, so a dashboard tab title was not treated as login proof. The external gates remain actual sandbox integration/payment evidence, public open-source repository, public under-three-minute YouTube footage, entrant eligibility/registration and final entry review/approval. No real-money action, public publishing or final submission occurred.

See [field copy](../submission/FORM-COPY.md), [judge quickstart](../submission/JUDGE-QUICKSTART.md), [release checklist](../submission/RELEASE-CHECKLIST.md) and [official rule audit](RULES.md).
