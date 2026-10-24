# ScopePay judging readiness

Checked 2026-10-23 against [official rules](https://paypalaihackathon.devpost.com/rules). An evidence map, not a predicted score or prize promise.

| Judging dimension | Demonstrable strength | Material gap |
| --- | --- | --- |
| Technical implementation | Actual local AI retrieval, verified citations, reviewed dispositions, frozen prices, client response binding, linked replacement revisions, invoice gates and read-only recovery with exact field binding. | Actual sandbox OAuth, invoice creation/issuance and bound detail queries now pass; buyer payment remains pending. |
| Design | Coherent source → review → client → invoice workflow, desktop and mobile checked. | Independent usability and assistive-technology testing. |
| Potential impact | Specific freelancer problem; also protects the client from charges for included work. | Real users and measured outcomes have not been established. |
| Innovation | Traceable connection between agreement, request, billing decision, client agreement and invoice reference. | No uniqueness or competitor-superiority claim is established. |
| Presentation | Real AI, distinct client view, acceptance and objection, clear mock/sandbox separation. | Final real-sandbox video and public artifacts. |

## The story to demonstrate

“An AI can find the clause. It should not decide what your client owes.”

A portfolio job receives three new requests. ScopePay retrieves agreement clauses. The freelancer prices only the excluded store, records the headline revision as included, and leaves booking for clarification. The client sees the distinction and can accept or object. Acceptance of the frozen scope and amount unlocks the invoice.

PayPal must be central in the final demo: the reviewed line and frozen reference reach a real sandbox invoice, a sandbox buyer pays, and a provider query establishes status. The required integration cannot be called complete before this evidence exists.

## Gates

- Working local build, repeatable checks, MIT license: prepared.
- Actual local model and synthetic regression evidence: verified.
- Client acceptance/refusal and invoice guard: verified locally; identity unverified.
- Real sandbox invoice/payment: requires account configuration and execution.
- Devpost registration and personal eligibility: unconfirmed.
- Public repository, public YouTube video and final submission: pending authorization and actual execution.

No interviews, usage numbers, recovered revenue, audience reach, independent accuracy, live payments or prize likelihood are invented.

## Submission review package

The current entry copy, judge setup, and release gates are in [FORM-COPY](../submission/FORM-COPY.md), [JUDGE-QUICKSTART](../submission/JUDGE-QUICKSTART.md) and [RELEASE-CHECKLIST](../submission/RELEASE-CHECKLIST.md). The local readiness command currently returns BLOCKED for actual sandbox evidence, public repository/video, eligibility/registration and final materials review. Local build QA and the submission window pass. These are consistency checks with human attestations, not independent verification of remote services.
