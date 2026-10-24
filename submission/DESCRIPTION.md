# ScopePay

**One-line description:** Turn client scope creep into a cited, human-approved change order and a PayPal sandbox invoice.

**Draft only — not submitted.** Local AI retrieval and the simulated payment workflow have been verified. Actual sandbox OAuth, invoice creation, issuance and bound status queries are verified. A buyer test payment is still outstanding.

## Inspiration

For an independent developer or designer, “just one more thing” often arrives after the price is agreed. The hard part is explaining what changed without misquoting the agreement or turning a client conversation into a fight. ScopePay keeps the evidence, review and invoice in one place.

## What it does

Paste the original scope and the client's additional request. A real local MiniLM model retrieves the most related scope clause for each request. ScopePay shows both original excerpts and validates that the quoted words occur in the input. The freelancer interprets the relationship: semantic similarity does not establish whether a request is included or additional. All retrieval candidates stay unclear until human review. Optional Ollama-generated comparison is supported but has not been verified with an actual model; offline mode makes no AI claim.

The freelancer marks every request additional, already included, or needing clarification. Only additional work receives a deliverable title, rationale and USD amount. The client sees the frozen proposal, including the work not being charged, and can accept or request changes. New invoices remain locked until a response accepts the exact revision. If the client requests changes, a linked replacement revision retires the old link and requires fresh acceptance. Local client names are self-reported; no authenticated legal signature is claimed.

The sandbox adapter is implemented to create a PayPal draft, issue it without notification emails, and poll status. Actual sandbox API creation, issuance and exact-bound detail queries have passed; buyer-payment evidence is still outstanding. A labeled simulated mode lets reviewers exercise the workflow without credentials. A redacted evidence receipt connects the frozen proposal, local client response and last invoice observation without exposing the source documents or access token. Its checksum detects content changes; it is not a payment attestation.

## How it is built

Node.js serves a local review workspace and owns source validation, cents arithmetic, approval snapshots and provider calls. A local JSON store preserves revisions. PayPal Invoicing v2 is the intended payment path: the invoice carries the reviewed line items and an approval reference. Pinned Transformers.js and an Apache-2.0 MiniLM ONNX model perform real CPU semantic retrieval without a hosted inference account. The model has no pricing or payment authority.

## What makes it different

The product connects a specific scope disagreement to a specific invoice. It does not let an assistant decide what a client legally owes, invent a quote, select a price or charge a card. It also avoids interpreting a partial-payment event as final settlement. If an invoice creation response is lost, a read-only recovery check can attach an existing sandbox invoice only after its merchant, recipient, amount, lines and frozen reference all match. Contract tests cover this path; actual sandbox validation remains outstanding.

## Evidence status before finalization

- Local review, approval, mock invoice and status workflow: implemented; see the verification record.
- Real model inference: actual local MiniLM CPU execution and model-backed browser workflow verified, with pinned revision, input/output evidence and asset hashes.
- Real PayPal sandbox OAuth, invoice creation, issuance and detail queries: verified against the account; buyer payment and PAID confirmation still required.
- Verified webhook delivery: not implemented; current status tracking uses polling.
- Public repository, public video, registration and final submission: not completed.

## What is next

Capture a complete PayPal sandbox buyer payment and record the real model, client response and sandbox workflow. Validate the implemented recovery flow against an actual sandbox account and add authenticated client identity before considering a hosted multi-user product. No user outcomes, recovered revenue or production usage are claimed.

**Submission fields still needed:** public repository URL; public YouTube URL; confirmed entrant eligibility and registration; accurate tools/model list based on the eventual real run; final evidence-backed revision of this draft.
