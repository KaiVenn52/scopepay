# ScopePay — Devpost field copy

Prepared 2026-10-23. Local review draft. Do not submit until the release checklist is satisfied. The actual form field inventory has not been inspected in an authenticated PayPal hackathon draft; adapt labels without changing claims.

## Project name

ScopePay

## Tagline

Turn “just one more thing” into a cited scope change, client agreement and PayPal invoice.

## Inspiration

A freelancer's hardest invoice often starts with a small request after the price is agreed. Before asking for more money, they need to show what changed—and recognize the work the client already paid for. ScopePay connects that conversation to a reviewed change order and its invoice.

## What it does

Paste the agreed scope and the new requests. Local AI retrieves relevant original clauses, and ScopePay verifies that the quotations occur in the source. The freelancer makes the decision: additional work, already included, or needing clarification. Only reviewed additional work receives a price.

The client sees a frozen proposal containing both charged and no-charge work. Acceptance of that exact version unlocks its invoice. If changes are requested, a linked replacement retires the old proposal and needs fresh acceptance. Local client responses are self-reported; they are not authenticated legal signatures.

The PayPal Invoicing v2 adapter creates a sandbox draft, issues without notification emails and queries invoice status. It binds the invoice to the proposal reference, seller, buyer, USD amount and line items. If a creation response is lost, a read-only recovery check can attach a matching existing invoice without creating another. Partial and pending payments remain unsettled. A redacted local evidence receipt records the version and stored state without exposing source text or client access tokens.

## How we built it

Node.js serves the HTML/CSS/JavaScript application and controls quote validation, integer-cent pricing, proposal fingerprints, response gates and PayPal calls. Transformers.js runs pinned, quantized MiniLM embeddings locally on CPU. SHA-256 and byte-size checks protect model setup from truncated downloads. No model can set a price, approve a proposal or charge a client. Payment status uses authenticated invoice polling; verified public webhooks are not implemented.

## Challenges

Similar wording is not proof that a request is excluded. A payment event is not necessarily full settlement. A timeout is not proof that an invoice was never created. ScopePay handles these as distinct decisions: human review, authoritative status queries and blocked retries with exact invoice reconciliation.

## Accomplishments

The real local AI workflow, separate client review, immutable proposal revisions and redacted receipt export are reproducibly tested. Account-backed PayPal sandbox OAuth, invoice creation, issuance and exact-bound details queries succeeded. A narrated 133.53-second recording demonstrates real local inference and a fresh authenticated query of the previously issued USD 240 invoice, which remains UNPAID. Simulated lifecycle tests are separate from this provider evidence. No customer outcomes or recovered revenue are claimed.

## What we learned

The useful automation is preserving the relationship between the original words, the reviewed amount and the exact invoice. Retrieval can accelerate finding the clause; the billing decision belongs to the people making the agreement.

## Next steps

Complete the buyer test payment and record the final account-backed payment/status flow. Then test the workflow with freelancers, and add authenticated client identity and protected multi-user storage before any hosted production use.

## Built with

Node.js; JavaScript; HTML; CSS; PayPal Invoicing v2 and sandbox OAuth; Transformers.js 3.8.1; Xenova/all-MiniLM-L6-v2 (pinned q8 ONNX); Playwright for QA; SHA-256. Ollama is an optional, unverified adapter and is not the demonstrated AI path. Do not claim unused sponsor technologies.

## Links and disclosures still required

Public source repository URL: https://github.com/KaiVenn52/scopepay (MIT; anonymously accessible).

YouTube demo URL: https://youtu.be/jWOupeUs9II (133.53 seconds; actual sandbox query and local AI; currently unlisted at the owner's request). The actual event form explicitly permits public or unlisted with no password; that guidance has been inspected and saved.

Functional demo access: repository setup instructions in [JUDGE-QUICKSTART.md](JUDGE-QUICKSTART.md).

Current integration disclosure: actual sandbox OAuth, invoice creation, issuance and exact-bound detail queries are verified; buyer payment and PAID confirmation remain outstanding. Keep this disclosure until observed evidence supports a replacement.

Entrant eligibility: confirmed directly by the entrant. PayPal hackathon registration: confirmed on this event's own page after action-time terms approval. Final project submission: not performed.
