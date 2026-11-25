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

You can also save without a morph and assign one later from **Edit ego**. Older prototype drafts still open with their original morph assignment. See [rules sources](rules-sources.md) and the [roadmap](../roadmap/roadmap.json).

## Apply an aptitude template

In **Create ego** or **Edit ego**, choose a **Core aptitude template** and select **Apply template** to fill the six scores. Adjust the values and check **Core aptitude budget**. Moving points between aptitudes leaves the total unchanged. Each point above the starting total of 90 costs 1 Customization Point (CP).

The budget shows the aptitude share of the core CP pool and flags scores outside the starting 5–30 range. Partial and out-of-budget drafts can still be saved. The full builder will account for other CP spending and trait bonuses.

## Choose core creation packages

In **Create ego** or **Edit ego**, pick a supported background, career, interest, or faction under **Core creation packages**. Each card lists the package’s skill points and source page. Enter optional Know fields and a faction motivation, or leave those entries open while you draft. Choose **Factionless** to enter a Know field of your choice.

Your selections appear in the dossier and player print view, and are included in JSON backups. The package cards report individual grants. The **Starting skill ledger** combines matching grants, shows their source packages, and adds the linked aptitude. Fray and Perceive use double their linked aptitude.

Choose **Art field** for a player-entered Know field that uses Intuition. Other Know fields use Cognition. Blank field choices are counted as unassigned points. The ledger flags totals above the standard starting cap of 80.

Under **Skill point transfers**, select a source and destination from the skills already in your ledger, enter a positive number of points, and select **Add transfer**. Active points can move to either skill type. Know points can move to another Know skill. Destination totals must stay at or below 80. Save the draft to keep the moves. **Remove** reverses a move and rechecks later transfers.

If a package or aptitude edit makes a transfer invalid, the ledger labels it **Needs review** and skips that move. You can remove it or revise the underlying choices. Adding new destinations, buying skill points with CP, and trait exceptions are planned.

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
