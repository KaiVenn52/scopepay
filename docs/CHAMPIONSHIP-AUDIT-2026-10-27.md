# ScopePay comprehensive audit — 2026-10-27

ScopePay was submitted to the PayPal AI Hackathon after explicit owner approval. This audit improves the working prototype and checks competitive weaknesses; it is not a prize prediction. The reviewed submitted release was v0.4.2. The maintenance release is v0.4.3; its independent CI result is recorded in the release audit evidence.

## Issues found and fixes

| Priority | Finding | Resolution and evidence |
| --- | --- | --- |
| High | sharp 0.34.5 inherited native image-library security advisories through Transformers.js | Pin transitive sharp 0.35.5. Production npm audit returns zero known advisories. Real CPU inference and browser workflow rerun. No image upload/decoding endpoint exists; exposure is narrower than a general image service. |
| High | Issuing succeeds remotely but follow-up query is lost; local DRAFT could trigger another send | Read and exactly bind the existing remote invoice before any issue write; non-DRAFT returns the observed state. Regression injects lost follow-up response and proves only one send, plus paid/pending/cancelled/partial cases. |
| Medium | UTF-8 source text could be corrupted across HTTP chunks | Node UTF-8 stream decoder preserves split characters; a real HTTP regression splits a Chinese character over chunks. Non-object JSON now returns 400. |
| Medium | Reload discarded unfinished decisions and prices | Per-review, source-bound session draft preserves decisions, titles, reasons, prices, recipient and source edits. Explicit confirmation never restores; freezing clears the draft. Browser tests verify stale restored sources still block approval. Tab storage is optional and not a trusted authorization source. |
| Medium | README/current handoff pages contradicted actual submission and CI | Current pages now distinguish submitted facts, old snapshots, current local checks and later CI. Historical receipts are preserved. |
| Open | Unlisted form guidance conflicts with controlling-rule wording | The owner-requested unlisted setting is preserved. The readiness checker no longer treats a known unresolved conflict as passing. Organizer clarification draft is prepared but not sent. |

## Verification rounds

Baseline: v0.4.2 passed 45 tests and 19 real-model browser checks. After fixes: 49 domain/provider/HTTP/submission tests; 21 real-model browser checks; 5 injected recovery browser checks; 8 targeted security/accessibility/responsive audit groups. See machine-readable evidence in evidence/iterations/2026-10-27/. Checks use a fresh Chrome profile and temporary isolated databases. Browser plugin is not available; owned-loopback Playwright fallback is used. No actual payment is simulated into provider evidence.

The targeted audit rejects cross-origin writes, non-JSON/malformed/oversize bodies and private-file reads; checks CSP/frame isolation/nosniff/referrer headers; renders malicious source HTML literally; checks form labels, language and keyboard entry; and checks horizontal overflow at widths 320/390/768/1024/1440. This is not full WCAG certification, an independent penetration test, load testing or a guarantee of security.

Independent installation: a separate source copy without node_modules completed npm ci, syntax checks, 49 tests and actual CPU inference. Its model cache was deliberately copied and reverified, so this is fresh dependency installation, not another cold model download.

Actual account-backed read-only PayPal check: OAuth 200, invoice details GET 200, exact merchant/recipient/reference/amount/line binding passed. Latest status UNPAID. No invoice writes, no buyer payment attempt and no local database change in that audit. The real buyer checkout remains unverified.

## Does the AI help?

On the unchanged 12 manually labeled synthetic English retrieval examples, actual MiniLM ranked the expected clause first in 12/12 cases; a transparent lowercase word-set Jaccard comparator ranked it first in 6/12. Both included the expected clause in their top three for 12/12. This small developer-authored diagnostic establishes a useful paraphrase example, not general accuracy, user benefit, logical entailment or legal interpretation. Every item remains unclear until a human decides, and no price is model-generated. No held-out real-world corpus has been evaluated.

## Product quality review

These are internal assessments for the declared local prototype, not independent judge scores.

| Dimension | Internal assessment | Evidence / remaining weakness |
| --- | --- | --- |
| Onboarding | 7/10 | Clear example and four steps; real AI still needs dependency/model setup. |
| Core experience | 7/10 | Additional/included/clarify, exact-price client response and revision path pass; real buyer checkout unfinished. |
| Error recovery | 8/10 | Lost-create recovery and lost-issue-query reconciliation; no automated recovery from filesystem failure. |
| Information architecture | 7/10 | Coherent four-step layout and expandable source clauses; review list lacks search and projects. |
| Visual polish | 7/10 | Desktop/mobile and five widths checked; dense long comparisons remain a limitation. |
| Performance | 7/10 | Actual cached model runs on CPU; timings are machine-specific and no sustained-load evidence exists. |
| Accessibility | 6/10 | Labels, keyboard entry, overflow and live/error regions checked; no screen-reader or comprehensive contrast audit. |
| Completeness | 5/10 | Strong local verification prototype; no remote client access, identity authentication, protected multi-user service, or verified buyer payment. |

## Competition against the five official dimensions

The rules weight technical implementation, design, potential impact, innovation and presentation equally. Technical safeguards are demonstrated. The main competitive gaps are real-user validation, real client access and buyer checkout; more test count alone will not address them.

HoneyBook already describes AI-assisted invoices and agent access to projects/contracts/invoices. Bonsai already documents scope control and project/invoice workflows. Therefore “AI invoicing for freelancers” is not a defensible novelty claim. ScopePay's demonstrated distinction is the source quotation → human additional/included/clarify decision → exact revision response → bound PayPal invoice trace, with local text processing and explicit unresolved payment states. This is a positioning inference, not proof those products lack equivalent features; no hands-on competitor test was performed.

Primary competitor references checked 2026-10-27:
- https://www.honeybook.com/blog/introducing-the-honeybook-mcp-ask-claude-about-your-pipeline-invoices-and-contracts
- https://help.honeybook.com/en/articles/8809780-configure-invoice-settings-taxes-discounts-and-payment-options-in-honeybook
- https://www.hellobonsai.com/blog/how-to-avoid-scope-creep
- https://docs.hellobonsai.com/

## Remaining work ranked by expected competitive value

1. Validate three anonymized real scope-change examples with consenting freelancers: observe decisions, time-to-proposal, misunderstandings and willingness to use. No fabricated users, quotes or outcomes. Outreach needs explicit authorization.
2. Resolve the unlisted-video wording with the organizer; official rules 4/11.4 and form guidance differ. Do not silently change the owner's visibility choice or claim compliance certainty. Official source: https://paypalaihackathon.devpost.com/rules.
3. Complete the existing sandbox buyer checkout and re-query that same invoice when browser/account access permits; never record an external payment to manufacture PAID or create a duplicate invoice.
4. Make the client review usable remotely only after implementing authentication, authorization, storage isolation, deployment secrets and operational safeguards. The current loopback service must not simply be exposed publicly.
5. After the above evidence exists, update the demonstration to show the actual full journey and a credible user outcome. The current video honestly shows retrieval/client review plus the previously issued matching invoice and live status refresh; it does not show a complete payment.

## Formal-rule ambiguity

The event form explicitly permits public or unlisted video without a password. The formal rules require a YouTube video to be publicly visible, and rule 11.4 gives the formal rules precedence over conflicting form disclosures. Whether unlisted qualifies under that wording is unresolved; this audit does not assert automatic disqualification. The previous unconditional compliance conclusion was too strong. Written clarification is the clean resolution while preserving the owner's instruction.

## Artifacts and limitations

No real funds, deployment, new public message, organizer email or new final submission is part of this audit. The already-submitted entry remains submitted. A historical validation copy belonging only to ScopePay was moved from delivery/check-ce66cc6db1 to this chat's D-drive artifact directory to relieve C-drive pressure; no unrelated project or global package configuration was changed. Public-source updates must exclude local credentials, runtime records and private eligibility confirmations.
