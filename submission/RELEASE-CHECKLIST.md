# ScopePay submission release checklist

Checked 2026-10-23 against the [official rules](https://paypalaihackathon.devpost.com/rules) and [event requirements](https://paypalaihackathon.devpost.com/). Deadline: 2026-11-13 04:00 Asia/Kuala_Lumpur. Status: **NOT READY FOR FINAL SUBMISSION**.

## Required evidence

| Gate | Current evidence | Required next action |
| --- | --- | --- |
| Working source and license | Local Node application, MIT and third-party notices | Publish the reviewed source only after authorization; verify anonymous repository and license access |
| Reproducible demo access | [Judge quickstart](JUDGE-QUICKSTART.md), pinned local model and verified mock workflow | Validate the current packaged source; maintain working access through judging |
| Actual AI | Real local MiniLM CPU inference and browser workflow | Keep pinned model/setup instructions and truthful retrieval limitations |
| Actual PayPal | Actual OAuth, invoice creation/issuance and exact-bound status queries verified; current invoice UNPAID | Complete the remaining buyer test payment and PAID query on the same existing invoice; do not create another invoice |
| Public video | [Recording script](DEMO-SCRIPT.md); no qualifying published final video | Record actual functioning PayPal + AI flow, under 3 minutes, and publish on YouTube after authorization |
| English description/tools | [Field copy](FORM-COPY.md) and [description](DESCRIPTION.md) | Replace pending integration disclosure only after actual evidence; add verified public links |
| Eligibility | Personal majority age, residency/conflicts not certified | Entrant confirms eligibility and ownership; inspect the PayPal event's own registration state |
| Registration/submission | No verified PayPal registration or accepted submission | Register with required human terms confirmation, review fields, obtain final submit approval |

## Sandbox acceptance record

Record these checkpoints privately with synthetic/test information. Do not put secrets or raw provider bodies in public materials.

- OAuth returned a valid token; no token captured in video or evidence.
- The business sandbox app and configured merchant match; a separate personal sandbox buyer is available.
- The frozen proposal and client response match; the buyer recipient and integer-cent amount are correct.
- Draft invoice ID and displayed invoice number correspond to the proposal reference.
- Invoice issuance succeeds without email notification requests.
- The buyer completes a real sandbox test payment through PayPal, not a simulated local control or external-payment recording API.
- A fresh authenticated detail query returns `PAID`; partial/pending/manual marking does not clear this checkpoint.
- Redacted receipt and captured screen footage agree with that same invoice and amount.

## Final review order

Freeze source and record the ZIP checksum. Run checks/tests and actual model/browser verification. Inspect video start/middle/end and duration; remove credentials and unrelated browser/account material. Verify the repository and YouTube video anonymously. Reconcile description, tools, screenshots and evidence. Confirm eligibility and registration. Only then request final submission approval on the concrete filled entry.

No real funds or public hosting are required for this route. Public repository and video are required artifacts, but have not been published. No pending item becomes satisfied merely because a URL or a local receipt exists. The receipt is a local snapshot, not provider attestation.

## Repeatable local gate

Run `npm run submission:check -- --write`. Update `submission-state.json` only after reviewing the actual evidence for each field. The command rejects a mock paid receipt, a local/unreviewed video, a video of 180 seconds or more, old-version QA and missing eligibility/registration. It returns at most READY_FOR_FINAL_HUMAN_REVIEW; it never grants submission authorization or independently authenticates a PayPal receipt.

The official core requirement is meaningful PayPal sandbox plus AI integration. A completed buyer payment is ScopePay's own end-to-end demo acceptance gate, rather than a separately quoted rule requiring every entrant to demonstrate a PAID invoice.
