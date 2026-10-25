# ScopePay v0.3 — 2026-10-18

The previous version recorded objections but left the freelancer without a supported revision path; an uncertain invoice creation also required manual data repair. This version closes both local product gaps.

## Product changes

- A declined or withdrawn, uninvoiced proposal can create a linked revision. Sources are compared again. The freelancer confirms a new deliverable and price; freezing the replacement retires the old link. Only a new response can unlock its invoice. Parallel sibling drafts cannot both become frozen replacements.
- A lost invoice-creation response leaves creation blocked. The recovery form reads an existing sandbox invoice and verifies its ID, invoice number, frozen reference, merchant, recipient, USD total and every line. Wrong invoices stay rejected; recovery does not create another invoice.
- Invoice send and refresh revalidate the binding. A mismatched response cannot replace a valid stored state. Partial payment remains unsettled. Approval content and source changes are detected before invoice operations. OAuth failures before invoice writes no longer imply an uncertain invoice write.

## Observed validation

23/23 backend tests passed. Actual cached MiniLM browser execution passed 18 checks, including a USD 240 objection followed by a linked USD 220 proposal, retired old link and new acceptance. Desktop 1440×1000 and mobile 390×844 were checked, with zero console errors. The 12-case synthetic retrieval regression again ranked every labeled clause first; this is a small authored regression set, not measured customer accuracy.

A separate recovery browser run passed 5 checks using injected provider-shaped responses. It observed one attempted invoice write, then one recovery GET, and zero console errors. This is contract evidence only. Actual PayPal credentials are absent and the Developer dashboard currently redirects to login.

## Inspected screenshots

The following screenshots were opened and visually inspected for readable amounts, client state, recovery controls and payment labels. No generated UI image is used.

- [Real model: replacement accepted at USD 220](../evidence/iterations/2026-10-18/after/ai-revision-accepted.png)
- [Injected contract: uncertain create and recovery form](../evidence/iterations/2026-10-18/after/contract-fixture-recovery-before.png)
- [Injected contract: matching partial invoice, not settled](../evidence/iterations/2026-10-18/after/contract-fixture-recovery-after.png)
- [Actual model browser checks](../evidence/iterations/2026-10-18/after/real-ai-ui-verification.json)
- [Injected recovery checks](../evidence/iterations/2026-10-18/after/recovery-ui-verification.json)

## Remaining competition gates

Actual PayPal OAuth, invoice creation, issuance, sandbox buyer payment, and provider-backed recovery still need account access. Client identity remains unverified; storage and tokens are local and unauthenticated. Entrant eligibility/registration, independent user validation, public repository, public video and final submission remain incomplete. No real funds, publication or submission occurred.
