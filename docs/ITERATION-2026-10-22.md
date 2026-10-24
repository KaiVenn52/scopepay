# ScopePay v0.4 — 2026-10-22

## Product outcome

A frozen proposal now has an **Export evidence receipt** control. It downloads redacted JSON connecting the proposal/source fingerprints, version state, reviewed amount, client decision and stored invoice observation. The separate human-readable change order remains available. No provider request occurs during export. Personal source text, names, email addresses, proposal tokens, notes, invoice URLs and raw IDs are omitted. Hashes and amounts remain linkable; this is not anonymous data or a signed proof.

A mock paid state exports as `simulation-only`, with `realMoneyEvidence: false`. Sandbox records remain local adapter observations, not independently attested payment. Changed source/approval content and a client response for another proposal are rejected. Superseded, withdrawn, declined or unanswered proposals cannot export an active accepted payment. Partial, pending, manually marked and refunded states are not treated as fully paid.

The new preflight command defaults to local configuration checks. An explicit `--oauth` performs one sandbox OAuth request, only with sandbox configuration. It cannot create an invoice and does not export secrets, token bodies or thrown exception text. It separates configuration, token validity, invoice capability and buyer payment.

## Validation

33/33 backend tests passed. Actual local MiniLM inference plus the browser workflow passed 19 checks at desktop 1440×1000 and mobile 390×844. The browser downloaded a real receipt from the implemented UI; its amount, simulation label, identity disclosure and checksum were checked. The standalone verifier also accepted this downloaded JSON and explicitly returned `authenticated: false`. No browser warnings/errors or horizontal mobile overflow were observed. Browser plugin was unavailable; installed Chrome ran through Playwright in a fresh headless profile. Desktop and mobile screenshots were opened and visually inspected.

- [Actual model browser checks](../evidence/iterations/2026-10-22/after/real-ai-ui-verification.json)
- [Downloaded receipt from synthetic mock-payment flow](../evidence/iterations/2026-10-22/after/ai-downloaded-evidence-receipt.json)
- [Desktop export control](../evidence/iterations/2026-10-22/after/ai-evidence-export-desktop.png)
- [Mobile export control](../evidence/iterations/2026-10-22/after/ai-evidence-export-mobile.png)
- [Actual offline preflight](../evidence/iterations/2026-10-22/sandbox-preflight.json)

## Remaining gaps

The actual offline preflight found no sandbox credentials/configuration; it did not attempt OAuth and made zero invoice writes. Unit OAuth responses are injected and do not clear this gate. Actual sandbox invoicing, buyer payment, and provider-backed recovery still require account access. Client identity is unauthenticated; local storage is editable and unencrypted. No external user research, public repository/deployment/video, registration, eligibility certification or final submission is claimed. Historical rule research is retained with its original check date, not represented as rechecked this round.
