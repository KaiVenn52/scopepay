# Official rule audit

Rechecked **2026-10-23, Asia/Kuala_Lumpur** against the [official rules](https://paypalaihackathon.devpost.com/rules) and [overview](https://paypalaihackathon.devpost.com/), both readable in the web reader this round. This is research evidence, not registration or personal eligibility evidence.

| Requirement | Verified rule / ScopePay response |
| --- | --- |
| Window | Oct 1, 2026 09:15 Pacific to Nov 12, 2026 12:00 Pacific. Malaysia: Oct 2 00:15 to Nov 13 04:00. Development is open. |
| Eligibility | Individuals of local majority age, teams, and organizations. Malaysia is not named among excluded locations; personal age and conflict eligibility remain unverified. |
| Core | PayPal free sandbox plus an AI tool. Both must genuinely function; mock-only output is insufficient. |
| Existing work | New projects or significant updates during the submission period. ScopePay starts locally on Oct 16. |
| Demo | Working build with complete setup instructions or hosted access. Static mockups do not qualify. |
| Repository | Public source repository with a detectable open source license. Local MIT file prepared; public publication pending authorization. |
| Video | Public YouTube demonstration, under three minutes, showing working software. Script prepared; recording and publication pending. |
| Language | English materials prepared. |
| Registration | Join through Devpost; account and enrollment not verified. |
| Judging | Implementation, design, impact, innovation, presentation are equally weighted. |

Local implementation and testing are authorized. Payment, live financial transactions, public publishing, and final submission are not authorized this round. No external messages have been sent.

The cash prize total calculated from the listed official cash categories is $67,500; sponsor credits are separate. Prize availability does not establish eligibility or expected winnings.

## Official technical sources

The API links below are retained from the earlier integration research; the 2026-10-23 recheck covered the event rules and overview.

- [PayPal Invoicing overview](https://developer.paypal.com/invoicing/about): invoice creation and secure hosted payment pages fit a specific client change order.
- [Create invoice](https://developer.paypal.com/api/invoicing/v2/invoices-create): draft creation is separate from issuing; OAuth uses sandbox client credentials.
- [Issue invoice](https://developer.paypal.com/api/invoicing/v2/invoices-send): notification controls allow a share-link flow. ScopePay disables recipient and merchant emails.
- [Show invoice details](https://developer.paypal.com/api/invoicing/v2/invoices-get): used for payment status polling.
- [Webhook event names](https://developer.paypal.com/api/rest/webhooks/event-names/): `INVOICING.INVOICE.PAID` may also mean partial or pending payment. Event name alone cannot establish settlement.
- [Sandbox testing overview](https://developer.paypal.com/sandbox-testing/overview): test accounts and environment are distinct from live accounts.
- [Ollama chat](https://docs.ollama.com/api/chat): local JSON model inference path.

## Submission readiness decisions

ScopePay will demonstrate one credible end-to-end client change. Real local semantic retrieval is now verified; the payment simulation and optional offline mode remain visibly labeled. The final submission must use the verified real AI mode, add actual PayPal sandbox evidence, and explain the human approval boundary. No sponsor-specific prize is claimed at this stage.
