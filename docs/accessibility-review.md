# Accessibility and layout review

The 28 November 2026 review covered the local player workflow on Windows in Edge 158, Chrome 158, and Firefox 159. Browser checks used 320 CSS pixels for narrow layouts and 1280 CSS pixels for desktop. The dashboard contrast check also covered 768 CSS pixels.

| Area | Verified behavior |
| --- | --- |
| Workspace navigation | On a fresh page, Tab reaches **Skip to content** first. Activating it moves focus to the workspace. In-app navigation moves focus to the destination heading. |
| Creation and validation | Keyboard activation follows a Creation review link to the malformed aptitude. Saving identifies the field with an error message and invalid state. Completing the worked character clears the review and saves the first sleeve. |
| Morph library | Space toggles three comparisons. Arrow keys scroll the focused table. The detail drawer moves focus inside and returns it to its opener when dismissed with Escape. |
| Saved character | A resleeve records the active and previous sleeves and preserves long text after reload. Export and restore preserve the saved content. A malformed import leaves existing drafts available. |
| Print preview | Arrow keys switch print layouts and Space toggles private notes. Switching back to GM summary clears the note choice. The player and GM previews fit narrow layouts. A desktop check also used 200% text sizing. |
| Display preferences | Tested keyboard focus with Edge's forced-colors and reduced-motion emulation. Dashboard text measured at least 8.59:1 against the sampled background at 320, 768, and 1280 CSS pixels. |
| Automated checks | Axe-core 4.14.1 reported zero violations across 11 Edge checkpoints after the fixes. Checks included public screens, editor and import errors, a comparison and drawer, and both print layouts. |

The audit fixed the initial keyboard focus, gear heading order, comparison landmark names, a small trait-link target, and dashboard contrast. Axe findings were checked alongside keyboard and layout testing. The audit covers the named scenarios and browser versions. [WCAG 2.2](https://www.w3.org/TR/WCAG22/) · [Axe-core](https://github.com/dequelabs/axe-core)

## Repeat the browser checks

1. Open an isolated browser profile and a fresh workspace. Tab to the skip link and activate it. Navigate to **Create ego** and verify that focus follows the route heading.
2. Enter an invalid aptitude, follow the review link, and try to save. Correct it and finish the [worked character](getting-started.md#create-a-complete-first-character).
3. At 320 CSS pixels, compare three morphs, scroll the focused comparison with the arrow keys, and open and dismiss a drawer with the keyboard. Check focus and the document width on each screen.
4. Resleeve with a long unbroken string plus line breaks in the notes. Reload, export the draft, test an invalid JSON import, and restore the valid file as a copy.
5. Open both print layouts. Exercise the private-field controls with the keyboard and follow the [print review](print-review.md#digital-print-and-long-notes) for A4 and Letter.
