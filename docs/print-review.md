# Dossier print review

Reviewed on 27 November 2026 using headless Microsoft Edge 158.0.4370.33 on Windows, the browser's PDF renderer, and Poppler grayscale page renders. This completes the grayscale review for the core screen wireframes. It does not complete the broader keyboard, assistive technology, browser, and physical printer audit.

## Scenario and results

Imported a backup into an isolated browser profile, restored it as a copy, opened the saved dossier, and reloaded it before opening the print route. The draft used Colonist, Explorer, Spacer, and Argonaut packages; named and unnamed field slots; over-cap skills; a specialization; motivations and goals; reputation; a trait; starting gear; and two sleeves with private event details.

| Check | Result |
| --- | --- |
| Player PDF, A4 and Letter, backgrounds disabled | Three pages each. Ego and morph headings, skill calculations, warnings, gear restrictions, and attribution remain legible in grayscale. |
| GM PDF, A4, private fields excluded | Two pages. Skill table headers repeat across pages and sleeve history distinguishes Active and Previous in text. |
| GM PDF with only sleeve notes selected | Notes appear beneath the matching morph. Locations and causes remain excluded. |
| Switch player → GM after selecting notes | Private choices reset, and notes disappear. |
| Player and default GM PDF text | No private event markers appear in the extracted text. |
| Player preview at 390 px width | No document-level horizontal overflow. Skill headings and warning text remain readable. |
| Incomplete player draft, no morph | Missing aptitude totals stay Pending; unnamed Active and Know points and a rejected purchase are visible. |
| Browser runtime | No page errors during import, reload, and print layout changes. |

The review found missing skill totals in both print layouts. The print view now uses the existing starting skill calculation, including transfers, purchases, pending aptitudes, unnamed field points, over-cap warnings, and rejected allocation notices. Regression tests cover incomplete and over-cap drafts. The review also led to darker preview warnings and page-break rules that keep source notes with their tables and short sleeve entries together.

An additional review on 27 November 2026 covered all six aptitude check ego traits at mixed levels. The saved dossier and restored backup showed the same adjusted targets and source contributions. Player and GM A4 PDFs each spanned two pages; every page was rendered in grayscale and checked for readable formulas, trait levels, repeated skill headers, and attribution. The dossier at 320 px had no horizontal overflow. A draft with traits and blank aptitudes retained pending check targets. Changing levels updated CP costs, and removing the traits restored the base checks without changing the skill ledger.

Contact and Morph Familiarity were also reviewed on 27 November 2026 using two contact/network entries and two familiar morph types. Each appears separately in the saved dossier and in player and GM A4 PDFs. All four grayscale pages retain the names, networks, effects, and attribution. Add/remove, duplicate rejection, save/reload, resleeving, and backup restore passed in an isolated Edge profile. The 320 px editor has readable Remove buttons and no horizontal overflow.

Hardening was reviewed on 27 November 2026 with all three supported stress types, Resolve Level 2, a Face/Networker package overlap, a Persuade transfer, and a specialization. The WIL trace combines positive and negative contributions, while Persuade retains its rating beside the adjusted Test target. The player PDF spans three A4 pages and the GM PDF two; every grayscale page was inspected. Trait entries now stay together at page breaks. Mobile review at 320 px verified the named skill table's horizontal scroll region, readable skill labels, and penalty sources. Save/reload, removal, backup restore, and rejection of Unknown imports passed without browser errors.

## Repeat the review

1. Follow [local setup](getting-started.md#start-the-prototype) and [the print walkthrough](getting-started.md#print-a-player-dossier-or-gm-summary).
2. Use a saved ego with enough skills to cross a page boundary, an unnamed field, an over-cap skill, gear packs, a specialization, and at least two sleeves. Add distinct private event markers so omissions are easy to verify.
3. Save player PDFs at A4 and Letter with background graphics disabled. Render every page in grayscale and inspect headings, repeated table headers, row boundaries, warning text, gear restrictions, and the final attribution.
4. Save GM PDFs with all private fields off, then with only notes on. Check the preview and extracted PDF text. Switch layouts and verify the private choices reset.
5. Review the preview at a narrow phone width. Also print an incomplete draft and check that missing aptitude totals remain pending.

Native print-dialog controls, browser headers and footers, physical grayscale output, very long notes, and the complete accessibility audit remain in the [layout verification roadmap item](../roadmap/roadmap.json).
