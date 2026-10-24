# Technical design

The local Node HTTP service serves a small HTML/CSS/JavaScript client. Offline mode needs only Node.js; the real local semantic mode uses pinned Transformers.js and cached MiniLM weights. Model and payment adapters are independent of the review domain, so unit tests can inject provider-shaped responses while preserving honest evidence labels. Actual model and model-backed browser checks run separately without injected inference output.

## State and approval boundary

`sources → cited review → human dispositions and prices → frozen proposal → client response → invoice DRAFT → issued invoice → polled provider status`

All model suggestions are review candidates. Every item requires exact source and request quotations. Unknown or malformed outputs are rejected. Offline mode does no inference and labels every request unclear. Actual local semantic mode ranks related source passages using normalized embeddings, still labeling all requests unclear; retrieval is not contractual classification. The optional Ollama mode proposes classifications subject to human review. No model can supply prices or approval. The freelancer selects eligible changes, enters positive USD prices, confirms the recipient and scope, and commits an immutable application-level snapshot with a SHA-256 digest. This is provenance and accidental change protection, not a digital signature or legal client acceptance.

The server uses integer cents. The current MVP supports USD, one unit per selected change, and no taxes, discounts, tips, or split payments. Subsequent source edits create a new review. The UI blocks approval when the source fields differ from the analyzed revision. The freelancer may edit a deliverable title and rationale; source quotes remain server-owned. Charged items must be marked additional. Included and clarification items appear separately in the proposal and never in the billed total.

Client review uses a random 256-bit local URL token. The projection omits full original documents and model-only data; relevant excerpts are intentionally included. Responses must contain the exact approval hash. Acceptance requires confirmation; rejection requires a note. Duplicate responses are rejected; an unanswered uninvoiced proposal may be withdrawn. New invoice creation requires acceptance of the same revision. Names are self-reported and no identity authentication, legal signature or public delivery is claimed.

Mutations are serialized in one process; records are written using a temporary file and rename. Duplicate create clicks reuse the existing local invoice. This is a local prototype, not a multi-process database or multi-user system. Source material is stored unencrypted; use synthetic test data.

## Sandbox integration

The only remote PayPal host is `api-m.sandbox.paypal.com`. OAuth tokens and credentials remain on the backend and are not returned to the UI. Draft creation parses either an invoice object or a HATEOAS self link, persists the invoice ID, then allows a separate issue operation. Issuing suppresses merchant and recipient email notifications. Payment status is obtained by querying that invoice ID. Only `PAID` is displayed as fully paid; partial, pending, refunded and manually marked paid are not treated as settled. Recipient links are restricted to HTTPS sandbox PayPal hosts.

`INVOICING.INVOICE.PAID` is not synonymous with full settlement. The MVP deliberately uses authenticated polling instead of an unverified public webhook. A later webhook implementation must verify the signature, deduplicate event IDs, bind the invoice to the local approval and re-fetch authoritative invoice details; it must handle reordered events.

## Creation outcome reconciliation

PayPal's invoicing creation reference inspected this round does not document a request idempotency guarantee. ScopePay does not claim one. It persists `creating` before the remote request. A failure or a process restart with an unfinished create marks the result uncertain and blocks automatic retries, preventing a naive duplicate invoice.

For a real uncertain outcome, v0.3 provides a read-only recovery path:

1. Retain the local record. Do not start another review to bypass the uncertain-create gate.
2. Find the invoice number shown in the recovery panel in your PayPal sandbox dashboard. It is `SP-` plus the first 20 hyphen-free characters of the review ID.
3. Enter the existing `INV2-…` ID in **Verify & recover existing invoice**. The server performs an authenticated sandbox GET and checks the ID, invoice number, approval reference hash, merchant, single recipient, USD currency, exact total and every line's name, description, quantity and unit price. Only a complete match is attached to the local record; recovery performs no invoice creation or charge.
4. If no invoice exists, establish that the provider did not create it before clearing the uncertain flag. Absence after a timeout alone is insufficient; an automatic no-match reset is not provided.

A failed OAuth request is distinguished from an attempted invoice write and does not itself create an uncertain-write flag. Send and refresh operations recheck invoice binding; a mismatched response cannot overwrite the last valid state. Issuing can be retried against the same invoice ID; the official send reference says resending an already sent invoice has no effect. These paths have injected contract and browser evidence, not actual PayPal account-backed evidence.

## Proposal revisions

A declined or withdrawn, uninvoiced proposal can be revised. The new review records its parent and revision number, reruns source analysis, and requires fresh decisions, pricing and client acceptance. Freezing a child retires the old client link. Only one replacement can be frozen for a parent; pending sibling drafts cannot bypass that gate. V3 approval digests include the source fingerprint and revision lineage. Invoice operations verify the frozen digest and original sources. Older V2 snapshots retain their original digest contract.

## Local security limits

The service binds to loopback, checks the Host header, blocks cross-origin mutation requests, requires JSON, bounds body and source sizes, escapes UI content, applies a restrictive CSP and no-referrer policy, and keeps a fixed static-file allowlist. These controls do not replace authentication or encryption. There is no public deployment, account login, authenticated client signature, multi-user isolation, production money movement, or production credential path.

No existing project source or dependencies are modified by this project. All persistent ScopePay application data remains within its own directory.

## Redacted local receipt and preflight

`GET /api/reviews/:id/receipt` checks proposal/source integrity and response hash, then returns an allowlisted projection. It makes no provider request and writes no state. Names, recipient email, notes, source clauses, proposal tokens and raw invoice links/IDs are omitted. Fingerprints remain linkable. The checksum is SHA-256 over `JSON.stringify(content)` with preserved property order and no `checksum` member. `verify:receipt` validates that checksum, not the author, local storage, identity, invoice ownership or actual settlement. Arbitrary model names are omitted; unknown status/mode strings are not copied into the receipt.

`sandbox:preflight` is offline by default. `--oauth` checks the fixed sandbox token endpoint only after sandbox configuration is complete. Neither credential values, token bodies nor exception messages are printed. A successful token response does not validate the configured merchant or invoice capability. No preflight path creates or issues an invoice.
