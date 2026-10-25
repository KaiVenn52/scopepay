## Inspiration

"Just one more thing" can contain three different conversations: work outside the original agreement, work already paid for, and something that still needs clarification. A freelancer needs to explain the difference before asking for more money. ScopePay keeps that explanation connected to the client's response and the invoice.

## What it does

Paste an agreed scope and a client's new requests. Local AI retrieves relevant agreement clauses and shows the original words. Quotations must occur verbatim in the input. The freelancer decides which requests are additional, included, or need clarification, then describes and prices only the additional deliverable.

The client gets a separate review page showing both the charged work and the work with no additional charge. A response accepting the exact frozen proposal unlocks invoicing. Requested changes require a new revision and fresh acceptance; old links cannot approve the replacement. This local prototype records self-reported responses without authenticating identity or claiming a legal signature.

PayPal Invoicing v2 creates a sandbox draft, issues it without notification emails, and queries the invoice. ScopePay binds the returned invoice to the frozen reference, seller, buyer, currency, integer-cent total and line items. An uncertain creation outcome blocks blind retries and supports read-only reconciliation of an existing matching invoice. Partial and pending states remain unsettled.

## How we built it

Node.js serves a loopback-only HTML, CSS and JavaScript workspace. Transformers.js runs a pinned, quantized MiniLM model locally on CPU. Model assets are checked against committed sizes and SHA-256 hashes. Source text is not sent to a hosted AI service. The model can retrieve evidence; it cannot set prices, approve a proposal or authorize payments.

Proposal fingerprints, response gates and persisted records keep the review and invoice connected across reloads and revisions. PayPal status tracking uses authenticated polling. Public webhooks and a hosted multi-user service are not implemented.

## What we verified

The project passed 45 automated backend/workflow tests, 19 actual-model browser checks, independent clean-package setup with real model download and CPU inference, and Windows/Ubuntu GitHub Actions.

Actual account-backed sandbox OAuth, USD 240 invoice creation, issuance and exact-bound details queries succeeded. The 133.53-second video demonstrates fresh local AI inference and synthetic client review, then explicitly switches to the matching example previously issued through PayPal and performs a fresh authenticated status query. The invoice is UNPAID. Buyer checkout/payment has not been verified; no recovered revenue, customer outcomes or production payment success are claimed. Simulated payment-state tests are separate from this provider evidence.

## What we learned and what comes next

Related wording is not a billing decision. An event is not necessarily settlement, and a timeout is not proof that no invoice exists. Preserving those distinctions made the workflow more useful than a model-generated invoice.

Next are completing the buyer checkout test, validating the workflow with freelancers, and adding authenticated client identity and protected multi-user storage. Judges can run the documented local build from the public MIT repository; sandbox credentials belong in their own ignored local configuration.
