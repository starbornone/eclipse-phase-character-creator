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

Derived ego stats and Composure were reviewed on 27 November 2026 with partial aptitudes and non-multiple-of-five scores. Player, GM, and incomplete-player A4 PDFs each span two pages; all six grayscale pages retain readable formulas, rounding steps, Composure's source contribution, pending values, and attribution. The 320 px editor and saved dossier have no horizontal overflow. Live edits, Composure removal, save/reload, resleeving from Bouncer to Synth, and backup restore preserve the expected values. No browser errors were reported.

The Frailty review on 28 November 2026 used a Bouncer with Frailty Level 2 and Unattractiveness Level 2. The Player and GM layouts each rendered to two A4 pages from the preview markup in headless Chrome. The grayscale pages and extracted text show both levels, the 6 MP bonus, Durability 25, Wound Threshold 5, and Death Rating 38. Both Edge previews and the 390 px editor showed the same configured health. Resleeving moved the trait summary to the previous sleeve.

The included morph trait review on 28 November 2026 resleeved a Case with added Toughness into an Operator. Each print layout rendered to two A4 pages from the preview markup in headless Chrome. Grayscale renders and extracted text showed Digital Speed and Exotic Morphology Level 3 on the Operator and only the added Toughness cost in the trait budget. The GM summary retained Case's included and added traits in sleeve history. Edge at 390 px verified that the private location appeared only when selected in the GM preview and reset when switching layouts. Both default PDFs omitted the location.

The field equipment review on 28 November 2026 used both Laser/Microwave Link sizes, two Spindle Climbers, a Pocket Lab, and a 2 GP pack swap. The player layout rendered to three A4 pages and the GM layout to two from preview markup in headless Chrome. Grayscale pages and extracted text kept the pack swap, purchased quantities, and per-item MP prices legible. Both layouts showed 7 MP spent on equipment and a 1 MP deficit. The skill table repeated its headers across the player page break, and both PDFs omitted the private resleeving location. Edge at 320 px verified the category picker, changes to temporary Flex, save and reload, and preserved equipment after resleeving.

The sleeve aptitude review on 28 November 2026 used ego and sleeve Resolve, a sleeve Timidity penalty, and two pending checks with sleeve penalties. Both layouts rendered to three A4 pages from preview markup in headless Chrome. All six grayscale pages were reviewed, and extracted text confirmed the separate trait contributions, the 6 MP bonus, and the original WIL 15 skill base. The player table repeated its headers at the page break. Edge at 320 px showed Willpower 60 in the configured Bouncer and 50 after resleeving to a Case. The GM preview kept the first sleeve's traits in history and excluded the private location by default.

The resleeving target review on 28 November 2026 used Adaptability, Morphing Disorder, and Morph Familiarity. Edge at 320 px verified the SOM and WIL targets, a zero target, the Exotic Morphology override reset, and the Integration waiver for a familiar Case. A later save assigned an Operator and kept the previous Bouncer's Fitness in history. Player and GM dossiers each rendered to two A4 pages from preview markup in headless Chrome. Grayscale pages and extracted text confirmed the new trait and the active checks. Both layouts kept the event location private by default.

The Everyday Technology review on 28 November 2026 used two tool kits, a shop, a facility, and a Portable Sensor. Edge at 320 px verified search by name and category, the three tool prices, an equal-GP swap, and save and reload. The player and GM dossiers rendered to three and two A4 pages respectively from preview markup in headless Chrome. Grayscale pages and extracted text confirmed the 9 MP total and that the player layout displayed per-item prices, quantities, and the pack replacement. Both layouts kept the resleeving location private by default.

The [first-character walkthrough](getting-started.md#create-a-complete-first-character) passed on 28 November 2026 in Edge at 375 px. Creation review, IndexedDB reload, JSON export and restore, and the first resleeve retained the expected values. Headless Chrome rendered the player and GM previews to four and three A4 pages. The grayscale pages and extracted text show the same pool values, built-in ware, specialization target, and source credits. The player copy includes the purchased Spider Hand and the campaign gear swap.

## Repeat the review

1. Follow [local setup](getting-started.md#start-the-prototype) and [the print walkthrough](getting-started.md#print-a-player-dossier-or-gm-summary).
2. Use a saved ego with enough skills to cross a page boundary, an unnamed field, an over-cap skill, gear packs, a specialization, and at least two sleeves. Add distinct private event markers so omissions are easy to verify.
3. Save player PDFs at A4 and Letter with background graphics disabled. Render every page in grayscale and inspect headings, repeated table headers, row boundaries, warning text, gear restrictions, and the final attribution.
4. Save GM PDFs with all private fields off, then with only notes on. Check the preview and extracted PDF text. Switch layouts and verify the private choices reset.
5. Review the preview at a narrow phone width. Also print an incomplete draft and check that missing aptitude totals remain pending.

Native print-dialog controls, browser headers and footers, physical grayscale output, very long notes, and the complete accessibility audit remain in the [layout verification roadmap item](../roadmap/roadmap.json).
