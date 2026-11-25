# Getting started

Use a Git checkout, Node.js 22.12 or later with npm, and a current browser with IndexedDB enabled. The prototype uses Vite, React, TypeScript, and Tailwind CSS.

## Start the prototype

From an existing checkout, run:

```sh
npm ci
npm run dev
```

Open the local URL Vite prints. The dashboard should show **My egos**, the **Create ego** action, and the sample morph library. Drafts belong to this browser profile and origin. If Vite selects another port, use the original URL to reopen drafts created there.

You can bookmark a dossier, editor, or print link and reopen it in the browser profile and origin where the ego was saved. Browser Back and Forward follow the screens you visited.

If npm cannot find `package.json`, switch to the checkout root. If installation fails, check the Node version and registry connectivity. If local drafts cannot open, check that the browser permits site storage for the local origin. Use localhost for development so the browser can generate record ids in a secure context.

## Create a first sleeve

1. Select **Create ego**, enter a name, and set Intuition to 15.
2. Select **Bouncer**, then **Save draft**. The dossier should show an Intuition check of 15 × 3 = 45 and Bouncer durability of 35. Unentered aptitude checks remain blank.
3. Reload the page and reopen the saved ego from **My egos**. Check the name, active sleeve, and calculation. Use **Print dossier** to preview a print layout.

You can also save without a morph and assign one later from **Edit ego**. Older prototype drafts still open with their original morph assignment. See [rules sources](rules-sources.md) and the [roadmap](../roadmap/roadmap.json).

## Apply an aptitude template

In **Create ego** or **Edit ego**, choose a **Core aptitude template** and select **Apply template** to fill the six scores. Adjust the values and check **Customization Point budget**. Moving points between aptitudes leaves the total unchanged. Each point above the starting total of 90 costs 1 Customization Point (CP).

The budget combines aptitude, skill, Flex, language, reputation, specialization, and ego trait costs. It also adds CP from negative traits and flags aptitude scores outside the starting 5–30 range. Partial and out-of-budget drafts can still be saved.

## Choose ego Flex and languages

Under **Customization**, choose 1–3 **Ego Flex**. The first point is free, and each additional point costs 2 CP. Enter one language per line. The free allowance starts at two languages, rises to three at a combined Cognition and Intuition of 35, and rises to four at 45. Each language above the allowance costs 1 CP. Duplicate names count once.

Save the draft to keep your choices. Both print layouts and the dossier show ego Flex and recorded languages. JSON backups include both choices.

## Allocate starting reputation

Under **Reputation**, distribute 100 free points among the seven networks. Each network accepts a whole number from 0 to 80. Leave any network blank while you decide. Once you allocate more than 100 points, the **Customization Point budget** charges 1 CP for each batch of five additional points and shows any purchased points still available.

Saved scores appear in the dossier, both print layouts, and JSON backups.

## Choose core creation packages

In **Create ego** or **Edit ego**, pick a supported background, career, interest, or faction under **Core creation packages**. Each card lists the package’s skill points and source page. When a package asks for a Hardware or Pilot field, choose a suggested name or enter your own. You can leave Active and Know fields blank while you draft. Choose **Factionless** to enter a Know field of your choice.

Your selections appear in the dossier and player print view, and are included in JSON backups. The package cards report individual grants. The **Starting skill ledger** combines matching grants, shows their source packages, and adds the linked aptitude. Fray and Perceive use double their linked aptitude.

Choose **Art field** for a player-entered Know field that uses Intuition. Other Know fields use Cognition. Blank field choices are counted separately as unassigned Active or Know points. Matching fields from different packages combine in the ledger, which flags totals above the starting cap.

Under **Allocate skill points**, select a source skill and destination, enter a positive number of points, and select **Add transfer**. For a new destination, choose a skill from the **New Active skill** group or select **New Know field…** and enter a name. Select **Art field (Intuition)** to use Intuition for the new field. Active package points can move to either skill type. Know package points can move to another Know skill. Destination totals must stay at or below 80.

To buy points, choose **Customization Points (CP)** as the **Point source**, then select **Add purchase**. Each CP buys up to five points across skills. The budget shows any points still available from a partly allocated batch. **Remove** reverses a transfer or purchase and recalculates the ledger and budget. Save the draft to keep your allocations.

If an edit makes an allocation invalid, the ledger labels it **Needs review** and skips it. Purchases awaiting review still count toward CP spent. Remove the entry or revise the underlying choices. Psi and trait exceptions are planned.

For a field beyond the rulebook samples, choose **Custom Active field…** as the destination. Choose Hardware, Medicine, Pilot, or Exotic Skill and enter a field name. Hardware and Medicine use Cognition, Pilot uses Reflexes, and Exotic Skill uses the aptitude agreed with the GM. You can create the field with a transfer of Active package points or a CP purchase, then specialize in it from the ledger.

## Add a skill specialization

Under **Skill specializations**, choose a skill from the ledger, enter a name, and select **Add specialization**. Each specialization costs 1 CP. The displayed target includes +10 for situations where it applies. The regular skill total still uses the chosen skill’s starting cap.

Save the draft to keep the choice in the dossier and JSON backup. Both print previews include specializations with a skill still in the ledger. If a package or allocation change removes the skill, the dossier marks its specialization **Needs review**. Restore the skill to reactivate the bonus, or remove the specialization to release its CP.

## Choose ego traits

Under **Ego traits**, choose a supported trait or level. Positive traits spend CP. Negative traits increase the available budget by up to 6 CP. Select **None** to remove a trait and recalculate the budget.

The dossier and both print previews list the chosen traits and their effects for reference during play. JSON backups include the choices.

In the **Starting skill ledger**, choose an **Expert Training skill** to spend 2 CP and raise that skill’s starting cap from 80 to 90. The trait changes the cap. Allocate points to raise the skill itself. If the field is new, add it to the ledger before choosing Expert Training. Removing or changing the choice rechecks existing allocations and flags any that now exceed the cap.

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
