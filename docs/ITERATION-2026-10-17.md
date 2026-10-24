# Product iteration — 2026-10-17

This pass follows the request to keep polishing ScopePay toward a competitive entry. It preserves the existing application and local model. No other project was modified and no subagent was used.

## Audit and implemented fixes

Fresh before screenshots were captured and opened: [review](../evidence/iterations/2026-10-17/before/ai-desktop-review.png), [invoice](../evidence/iterations/2026-10-17/before/ai-desktop-approved.png).

| Step | Observed problem | Implemented improvement |
| --- | --- | --- |
| 1. Compare | Every candidate stayed unclear with repeated technical explanations. | Compact evidence disclosure, alternative related clauses and explicit human dispositions. |
| 2. Review | A raw question became an invoice title; ignored requests had no explicit outcome. | Editable deliverable and rationale; included and clarification sections excluded from totals. |
| 3. Agree | Only the freelancer's approval existed. | Separate local client page, accept/request-changes responses bound to the exact revision, replay protection and withdrawal. |
| 4. Invoice | Hashes and simulation controls dominated the payment surface. | Technical references and demo controls remain available in disclosures; new invoices require the client's acceptance. |

## Flow health after iteration

1. **Compare — healthy locally.** Actual CPU model retrieval, source text visible, no invented obligations.
2. **Review and price — healthy locally.** Additional/included/clarify decisions; only additional work has a price, deliverable and rationale.
3. **Agree — healthy in local prototype.** Client sees the fixed scope and price and can accept or request changes. The test used a synthetic persona. Self-reported identity is explicitly unverified.
4. **Invoice — mock flow healthy; sandbox unverified.** Server requires acceptance of the same revision before a new invoice. Pending, declined, withdrawn and mismatched revisions cannot unlock it.

## Evidence

- `npm.cmd test`: 17/17 passed after client-response and disposition tests were added.
- `npm.cmd run check`: passed.
- `npm.cmd run test:ui:ai`: 16 checks passed, actual local MiniLM retrieval plus client acceptance and objection, desktop/mobile, mock payments. [Result](../evidence/iterations/2026-10-17/after/real-ai-ui-verification.json).
- `node scripts/evaluate-retrieval.mjs`: 12/12 labeled relevant clauses ranked first, 12/12 present in top three. [Detailed actual output](../evidence/iterations/2026-10-17/retrieval-evaluation.json). This is a manually labeled synthetic regression set, not a real-user study, independent accuracy benchmark or contractual classification test.

Final screenshots were opened with `view_image`; inspected quotation readability, decision controls, deliverable/rationale/price, no-charge sections, client acceptance and objection, hash disclosures and mobile wrapping. Automated checks used installed Chrome with a fresh profile because the Browser plugin was absent. No full accessibility compliance is claimed; screen-reader and independent usability testing remain outstanding.

- [After review](../evidence/iterations/2026-10-17/after/ai-desktop-review.png)
- [Client change order](../evidence/iterations/2026-10-17/after/ai-client-proposal.png)
- [Mobile acceptance](../evidence/iterations/2026-10-17/after/ai-client-mobile-accepted.png)
- [Client requested changes](../evidence/iterations/2026-10-17/after/ai-client-declined.png)
- [Accepted revision and mock invoice](../evidence/iterations/2026-10-17/after/ai-desktop-approved.png)

## Remaining risks

Real PayPal sandbox success is the primary gap. No configured credentials were present when checked. Local polish does not establish OAuth, PayPal invoice acceptance, buyer payment, settlement, deployment or final submission. Model retrieval does not establish contractual entailment. The client page records a local response and does not authenticate identity or provide a verified signature. Independent user validation has not been performed.
