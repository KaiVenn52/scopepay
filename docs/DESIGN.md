# Local product design

The user disallows unsolicited AI imagery. No concept image was generated. This written specification is the implementation reference, not a claimed user-approved visual mockup.

One workspace: source material on the left, cited review on the right, invoice status below. On mobile the panels stack in reading order. Header uses the ScopePay wordmark; no PayPal brand assets are copied.

- Canvas: cool neutral `#f6f7f8`; surfaces: true white `#ffffff`.
- Text: `#17262a`; secondary text: `#536367`; borders: `#dbe2e4`.
- Accent: green `#176451`; quiet status background `#eaf4ef`.
- Font: system Segoe UI for controls, Georgia for the italic headline and source quotations.
- Spacing: 8, 12, 16, 20, 24, 30, 56px. Radius: 6px on controls, 10px on workspace.
- No remote fonts, image downloads, stock illustrations, invented revenue, or fabricated users.
- Explicit input labels, keyboard focus, status region, error alert, responsive single column, reduced motion support.
- Primary states: empty, unclassified offline review, AI-assisted review, approved snapshot, draft invoice, issued invoice, partial/pending/paid, provider failure.

Target flow: sample sources → compare → inspect quotations → mark additional/included/clarify → title and price additional work → freeze proposal → client accepts or requests changes → create draft only after acceptance → issue without email → refresh invoice status. Mock payment controls remain labeled inside a disclosure. The client page uses the same typography, colors and spacing while showing only the proposal and its relevant quoted evidence.

Browser plugin is not available in this session; use regular Playwright with the installed Chrome browser for validation. Compare desktop and mobile screenshots for typography, panel structure, source readability, approval controls, and invoice status visibility. No fidelity claim against a nonexistent concept image is made.
