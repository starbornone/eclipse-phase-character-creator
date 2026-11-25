# Visual design direction

Design the app as a technical dossier for Eclipse Phase. Take cues from orbital habitat interfaces and spacecraft instrumentation. Use the Astral Archives family as a reference for how to organize character tools and keep rules visible during play. These notes guide the first wireframes.

## Reference patterns

The patterns below come from the corresponding local source checkouts.

| Reference | Pattern to adapt for Eclipse Phase |
| --- | --- |
| [Astral Archives](https://www.astralarchives.games/) | The hub’s scannable card grid puts a title and short description ahead of each destination. Give saved egos a similarly clear hierarchy, with their current morph, draft state, and last edit at a glance. Keep **Create ego** and **Import JSON** easy to find on an empty dashboard. |
| [Vampire: The Masquerade Character Creator](https://vtm.astralarchives.games/) | Its step-by-step builder keeps the character summary alongside editing and offers a dedicated sheet review. Adapt that rhythm to ego creation, with non-linear step navigation and a separate sleeve dossier. |
| [Pathfinder 2e Attribute Calculator](https://pf.astralarchives.games/) | Its live ledger shows where boosts come from, with a jump link at narrow widths and a print layout. Give each derived value an inspectable breakdown of its base value, morph contribution, and other applicable modifiers. |
| [D&D 5e Point-Buy Calculator (2024)](https://dnd.astralarchives.games/?rules=2024) | It makes the active rules mode visible in setup and keeps remaining points in view on small screens. Put the selected creation method and applicable budget near the controls they govern. Label over-budget states in text. |

## Visual language

- Use deep navy and graphite surfaces, pale text, and a restrained cool accent for focus, selection, and active controls. Reserve warning colours for warnings and pair them with a label or icon.
- Use a legible sans serif for navigation, prose, and form labels. Use tabular numerals for aligned stats and deltas. Restrict monospaced text to short technical readouts where it supports scanning.
- Use fine dividers, clear field labels, and consistent spacing to organize dense information. Confine any original orbital or habitat imagery to a quiet header or empty state, so the workspace stays easy to read.
- Give **Ego** and **Morph** explicit headings wherever both appear. Show the active sleeve in text. The user should be able to identify persistent character data and the currently assigned body even in grayscale.
- Style print as a light, high-contrast dossier with readable type and controlled page breaks. Apply the selected player or GM view and private-note choices before printing.

## First wireframes

1. **Dashboard.** Show an empty state that explains ego and morph in a sentence, then a populated state with an obvious way to resume a draft. Include an ego awaiting its first morph.
2. **Builder.** On desktop, place section navigation and the budget summary within reach of the editing area. On mobile, use a compact budget readout and a way to reach the full summary. Show how keyboard users reach an incomplete or invalid field from the issue summary.
3. **Morph library.** Use scan-friendly cards on mobile and aligned stats for up to three morphs on larger screens. Show how the user reaches source and restrictions and distinguishes base values from sleeve customisation.
4. **Sleeve dossier.** Separate ego and morph details, make derived values expandable, and label the old and proposed sleeves clearly during resleeving. Include the player and GM print previews and show where private-note visibility is set.

Review the wireframes for an empty dashboard, an incomplete draft, an over-budget choice, a before-and-after morph comparison, and a grayscale printout. See the [product overview](overview.md) and the [wireframing roadmap item](../roadmap/roadmap.json).

### Screen map for review

| Screen | Desktop reading order | Narrow-screen reading order |
| --- | --- | --- |
| Dashboard | Workspace navigation → Create ego → saved egos beside the morph preview | Navigation → Create ego → saved egos → morph preview |
| Builder | Section navigation → active editor next to budget and validation → save controls | Section navigation → compact budget summary → active editor → linked validation and save controls |
| Morph library | Search and filters → results beside selected morphs → comparison table | Search and filters → result cards → selected morphs → scrollable comparison with labelled columns |
| Dossier | Identity and actions → separate Ego and Morph panels → calculations → print options | Identity → actions → Ego → Morph → calculations → print options |

For the first table-ready player dossier, include identity, aptitude checks, skills, the active morph and its health stats and pools, traits and equipment, and the rules credit. The GM view should lead with the values needed during play and include private notes only when selected. Preserve the ego and morph headings in grayscale. Use the [official sheet](rules-sources.md#source-inventory) to check field names.

The dashboard, draft editor, sample library, and dossier can be reviewed in the current prototype. Both comparison tables scroll on narrow screens. The player and GM print previews have been reviewed for private-field visibility and narrow layouts. The aptitude editor has been reviewed for range and CP warnings on narrow screens. The full creation budget and final print pagination remain open for review.

## Dashboard artwork

The prototype uses an original [orbital habitat banner](../src/assets/orbital-habitat.jpg) generated with the built-in ImageGen tool. The artwork is decorative and the dashboard’s text and controls remain live HTML.

> Wide cinematic website banner, photorealistic hard sci-fi concept art. Deep ink-blue space with sparse stars, an enormous cold cyan planet crescent on the right, and a small ring-shaped orbital habitat silhouetted in the light above it. Keep the left half very dark and low-detail for overlaid white text. Precise metallic details, high contrast, understated teal highlights. No text, logos, people, or UI. Landscape 3:1 composition.
