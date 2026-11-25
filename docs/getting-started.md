# Getting started

Use a Git checkout, Node.js 22.12 or later with npm, and a current browser with IndexedDB enabled. The prototype uses Vite, React, TypeScript, and Tailwind CSS.

## Start the prototype

From an existing checkout, run:

```sh
npm ci
npm run dev
```

Open the local URL Vite prints. The dashboard should show **My egos**, the **Create ego** action, and the sample morph library. Drafts belong to this browser profile and origin. If Vite selects another port, use the original URL to reopen drafts created there.

If npm cannot find `package.json`, switch to the checkout root. If installation fails, check the Node version and registry connectivity. If local drafts cannot open, check that the browser permits site storage for the local origin. Use localhost for development so the browser can generate record ids in a secure context.

## Create a first sleeve

1. Select **Create ego**, enter a name, and set Intuition to 15.
2. Select **Bouncer**, then **Save draft**. The dossier should show an Intuition check of 15 × 3 = 45 and Bouncer durability of 35. Unentered aptitude checks remain blank.
3. Reload the page and reopen the saved ego from **My egos**. Check the name, active sleeve, and calculation. Use **Print dossier** to preview a print layout.

You can also save without a morph and assign one later from **Edit ego**. Older prototype drafts still open with their original morph assignment. The prototype accepts loose aptitude values for drafting. Full package-buy validation is planned. See [rules sources](rules-sources.md) and the [roadmap](../roadmap/roadmap.json).

## Compare morph profiles

Open **Morph library**. Search by name or description, or choose a category. Select two or three **Compare** checkboxes to see health values and source links side by side. Selections remain in the table when a filter hides a card. On a narrow screen, scroll within the comparison to see all profiles. Use **Clear comparison** to start again.

## Resleeve an ego

1. Open a dossier with an assigned morph and select **Resleeve**.
2. Choose a new morph. Compare its health values with the current sleeve. The same morph profile can be used for a different body.
3. Enter an optional event date, location, cause, and notes. Save the new sleeve.
4. Check that **Sleeve history** shows the new sleeve as active and the old sleeve as previous. Reload and reopen the dossier to verify the history and aptitude checks.

History is shown in save order, newest first. If you leave the event date blank, the history displays the save date. Event details appear in the on-screen history and can be selected separately for GM printing.

## Print a player dossier or GM summary

1. Open an ego’s dossier and choose **Print dossier**.
2. Use **Player dossier** for identity, concept, the active morph, and aptitude calculations. Switch to **GM summary** for compact checks and a list of current and prior morphs.
3. In the GM view, dates, locations, causes, and notes start excluded. Select any of those fields and check the preview. Switching layouts resets those choices.
4. Choose **Print / Save PDF**. Select a printer or your browser’s PDF destination.

## Back up and restore drafts

Use **Export all drafts** on the dashboard to save the workspace, or **Export JSON** in a dossier to save one ego. JSON backups include all saved fields, including sleeve notes.

To restore, choose **Import JSON**, select a backup, and review the names, sleeve counts, and any migration report. Select **Restore as copies** to add the drafts with fresh identifiers. The restore preserves aptitude scores, sleeve history, and event details. A malformed file displays an error before storage changes.
