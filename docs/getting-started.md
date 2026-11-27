# Getting started

Use a Git checkout, Node.js 22.12 or later with npm, and a current browser with IndexedDB enabled. The prototype uses Vite, React, TypeScript, and Tailwind CSS.

## Start the prototype

From an existing checkout, run:

```sh
npm ci
npm run dev
```

Open the local URL Vite prints. The dashboard should show **My egos**, the **Create ego** action, and the sample morph library. Drafts belong to this browser profile and origin. If Vite selects another port, use the original URL to reopen drafts created there.

The top navbar provides **My egos**, **Morph library**, **Import JSON**, and **Create ego** on every screen. It wraps on narrow screens. **Export all drafts** appears beside the dashboard's saved egos.

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

The faction selector covers the 15 broad affiliations in the core book and lists **Solarian**, **Sifter**, **Belter**, **Europan**, **Ringer**, and **Skimmer** under **Regional**. Each named choice adds 30 points to its faction Know skill. You can also leave the faction undecided or select **Factionless**.

Nine core backgrounds are available, including **Indenture**, **Infolife**, **Isolate**, **Underclass**, and **Uplift**. **Lost** is deferred until its required Psi trait and skill are supported. Indenture asks you to choose **Fray** or **Melee** for 20 points; Underclass offers **Guns** or **Melee** for 40 points. Leave **Choose a skill** selected to keep those points pending. Changing that choice updates the ledger and rechecks existing transfers. Save the draft to retain it in backups and print output.

Your selections appear in the dossier and player print view, and are included in JSON backups. The package cards report individual grants. The **Starting skill ledger** combines matching grants, shows their source packages, and adds the linked aptitude. Fray and Perceive use double their linked aptitude.

All 14 core careers are available, each with its sourced skill grants and matching gear pack. Most have two optional Know fields; Academic has three. Enforcer and Soldier's Fray grants combine with double Reflexes, so review the total when adding another package with Fray points. Investigator's Perceive grant similarly combines with double Intuition.

**Hacker**, **Scavenger**, **Scientist**, and **Techie** also have matching gear packs and two optional Know fields. The last three offer a Hardware field; Scavenger also offers a Pilot field. Use a suggested field or enter a custom one. Leaving a field blank keeps those points pending. Choosing Demolitions for Scavenger's open Hardware field combines it with the package's fixed Demolitions grant; review the cap before play.

All 15 core interests that do not require Psi are available, from **Animal Handler** to **Survivalist**. **Async** awaits Psi trait and skill support. **Pilot** offers a 30-point Hardware field and two separate Pilot fields worth 30 and 40 points. Fill them independently; matching fields combine and can exceed the cap. **Jammer** has one 40-point Pilot field. **Animal Handler** and **Forensics Specialist** supply their fixed Active fields directly. **Jack-of-All-Trades** splits its Active points into four 25-point grants.

For **Artist/Icon**, enter an artistic Know field such as Music and choose **Art field** in the ledger to link it to Intuition. Other interests with an open Know field use the same control. Changing interest clears the previous package's field selections and rechecks saved allocations; save the draft to retain the new selection.

Choose **Art field** for a player-entered Know field that uses Intuition. Other Know fields use Cognition. Blank field choices are counted separately as unassigned Active or Know points. Matching fields from different packages combine in the ledger, which flags totals above the starting cap.

Under **Allocate skill points**, select a source skill and destination, enter a positive number of points, and select **Add transfer**. For a new destination, choose a skill from the **New Active skill** group or select **New Know field…** and enter a name. Select **Art field (Intuition)** to use Intuition for the new field. Active package points can move to either skill type. Know package points can move to another Know skill. Destination totals must stay at or below 80.

To buy points, choose **Customization Points (CP)** as the **Point source**, then select **Add purchase**. Each CP buys up to five points across skills. The budget shows any points still available from a partly allocated batch. **Remove** reverses a transfer or purchase and recalculates the ledger and budget. Save the draft to keep your allocations.

If an edit makes an allocation invalid, the ledger labels it **Needs review** and skips it. Purchases awaiting review still count toward CP spent. Remove the entry or revise the underlying choices. Psi and trait exceptions are planned.

For a field beyond the rulebook samples, choose **Custom Active field…** as the destination. Choose Hardware, Medicine, Pilot, or Exotic Skill and enter a field name. Hardware and Medicine use Cognition, Pilot uses Reflexes, and Exotic Skill uses the aptitude agreed with the GM. You can create the field with a transfer of Active package points or a CP purchase, then specialize in it from the ledger.

## Add a skill specialization

Under **Skill specializations**, choose a skill from the ledger, enter a name, and select **Add specialization**. Each specialization costs 1 CP. The displayed target includes +10 for situations where it applies. The regular skill total still uses the chosen skill’s starting cap.

Save the draft to keep the choice in the dossier and JSON backup. Both print previews include specializations with a skill still in the ledger. If a package or allocation change removes the skill, the dossier marks its specialization **Needs review**. Restore the skill to reactivate the bonus, or remove the specialization to release its CP.

## Record starting motivations

Under **Motivations**, enter a short phrase for each personal choice and select **Support** or **Oppose**. A named faction supplies a default faction motivation and leaves two personal slots. Enter a signed phrase in **Faction motivation** to override the default. With no faction or **Factionless**, you can enter three personal motivations.

The faction default is an editable **+Name Interests** placeholder. Each regional affiliation gets its own name. To represent a defector with knowledge of an old faction, keep the new allegiance selected and use a Know-to-Know skill transfer to move the faction's 30 points to the old faction's field.

You can save a draft with empty slots. If the ego joins a faction, an existing third personal motivation stays in the draft and returns when the ego has no faction. Active motivations appear in the dossier and player print preview. JSON backups preserve the choices.

Use the optional goal field beside a motivation to record a specific short-term aim. The dossier and player print preview show it beneath the active motivation. If you draft a personal goal before naming the motivation, the goal stays in the draft until the motivation is named. Changing factions clears the previous faction’s custom motivation and goal.

## Choose starting gear

Under **Starting gear**, select Firewall, Criminal, or Gatecrashing. Firewall and Criminal use the same core gear pack. A supported career adds its own pack. The editor lists each pack’s items, Gear Points (GP), and restrictions along with the free muse.

Choosing a synthmorph as the first sleeve applies the campaign pack’s listed alternatives. Resleeving leaves the starting loadout tied to the first sleeve. The dossier and player print preview show the packs. JSON backups preserve the campaign choice. Individual swaps and extra gear purchases are planned.

The **Soldier** career pack also has a synthmorph alternative: **Fixer Swarm** replaces **Meds (5 doses)** when the first sleeve is synthetic. Both versions cost 10 GP. The Enforcer pack shows the Shredder’s Restricted label, and the Soldier pack labels the Assault Rifle Railgun as Restricted. Gear is listed for reference; its effects are not automatically applied to checks or pools.

**Covert Operative** replaces **Skinflex** with **Synthetic Mask** for a synthetic first sleeve. Resleeving preserves that starting choice. The **Mindhacker** pack follows errata 1.4: it includes Psychosurgery App, with Fokus and Servitor removed. **Medic** includes five doses of Meds.

**Genehacker** lists the Pusher Swarm's price as **1 GP + drug/toxin**. Its pack total is labelled **10 GP base**, summing the listed base values. The app does not assign a swarm payload or calculate its cost. Review the payload against the source when finalizing gear.

## Choose ego traits

Under **Ego traits**, choose a supported trait or level. Positive traits spend CP. Negative traits increase the available budget by up to 6 CP. Select **None** to remove a trait and recalculate the budget.

The dossier and both print previews list the chosen traits and their effects for reference during play. JSON backups include the choices.

**Acumen**, **Empathy**, **Fitness**, **Good Instincts**, **Quickness**, and **Resolve** each have three levels costing 1, 2, or 3 CP in total. They add +5 per level to Cognition, Savvy, Somatics, Intuition, Reflexes, or Willpower checks respectively. For example, Intuition 15 with Good Instincts Level 2 produces **15 × 3 + 10 = 55** in the saved dossier. The calculation names the contributing trait in both print layouts as well. An unentered aptitude stays pending. These check bonuses leave aptitude scores, linked skill bases, and free-language thresholds unchanged. Select **None** to remove the bonus and release its CP.

In the **Starting skill ledger**, choose an **Expert Training skill** to spend 2 CP and raise that skill’s starting cap from 80 to 90. The trait changes the cap. Allocate points to raise the skill itself. If the field is new, add it to the ledger before choosing Expert Training. Removing or changing the choice rechecks existing allocations and flags any that now exceed the cap.

Under **Repeatable ego traits**, choose **Contact**, enter a contact name, select its reputation network, and select **Add Contact**. Each purchase costs 1 CP. Add other contacts separately. The same contact/network combination is rejected even if spacing or capitalization differs. The +10 applies to Rep Tests using that contact; the recorded reputation score stays unchanged. Agree the contact's relationship with the GM.

Choose **Morph Familiarity**, enter a morph type, and select **Add Morph Familiarity** for another 1 CP. You can buy it for multiple distinct morph types. It exempts Integration Tests when sleeving that type. Naming a type here does not add a morph to the library. Use **Remove** to release a purchase's CP; remove and add a replacement to correct its details. Select **Add** before saving the draft. These choices follow the ego through resleeving, appear in both print layouts, and round-trip in backups.

Choose **Hardening**, select **Alienation**, **Helplessness**, or **Violence**, and select **Add Hardening**. Each distinct stress type costs 1 CP and grants immunity to stress of that type. Each purchase also applies −10 to WIL Checks and Persuade Tests, cumulatively. **Unknown** awaits its required Psi support. The ledger shows the Persuade rating and a separate **Test target** with penalty sources. The rating still determines the starting cap: a penalty does not free skill points or permit an over-cap purchase. Persuade specialization targets include both Hardening and the specialization's +10. Remove an entry to release its CP and penalty. On phones, scroll within **Starting skill totals** to read the expanded calculation.

## Review derived ego stats

**Derived ego stats** updates in the editor as you change aptitudes or Composure. The saved dossier and both print layouts show the same calculations and sources.

| Stat | Calculation |
| --- | --- |
| Initiative | (Reflexes + Intuition) ÷ 5, rounded normally |
| Lucidity | Willpower × 2, plus Composure if selected |
| Trauma Threshold | Lucidity ÷ 5, rounded normally |
| Insanity Rating | Lucidity × 2 |

Normal rounding goes to the nearest whole number. For example, Reflexes 16 and Intuition 17 give Initiative 7 from 6.6. **Composure** costs 2 CP and adds 5 Lucidity, which also raises Trauma Threshold by 1 and Insanity Rating by 10. Willpower 12 with Composure gives Lucidity 29, Trauma Threshold 6, and Insanity Rating 58. Select **None** to remove it and release its CP.

These values use aptitude scores. Resolve, Quickness, Good Instincts, and Hardening modify checks rather than these bases. Missing aptitudes leave their dependent stats **Pending**, including when Composure is selected. Composure and these ego stats follow the ego through resleeving and backup restore. Morph health and gear effects remain separate.

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
2. Use **Player dossier** for identity, concept, the active morph, and aptitude calculations. Switch to **GM summary** for compact checks and a list of current and prior morphs. Both layouts include starting skills with their points, aptitude bases, totals, and warnings. Incomplete totals stay pending, and invalid transfers or purchases are flagged for review.
3. In the GM view, dates, locations, causes, and notes start excluded. Select any of those fields and check the preview. Switching layouts resets those choices.
4. Choose **Print / Save PDF**. Select a printer or your browser’s PDF destination.

The [grayscale print review](print-review.md) records the checked paper sizes and remaining layout audit work.

## Back up and restore drafts

Use **Export all drafts** on the dashboard to save the workspace, or **Export JSON** in a dossier to save one ego. JSON backups include all saved fields, including sleeve notes.

To restore, choose **Import JSON**, select a backup, and review the names, sleeve counts, and any migration report. Select **Restore as copies** to add the drafts with fresh identifiers. The restore preserves aptitude scores, sleeve history, and event details. A malformed file displays an error before storage changes.
