# Design decisions

These records capture choices expressed in the [README](../README.md) and decisions made for the prototype.

## 1. Use TypeScript, React, shadcn/ui, and Tailwind CSS

**Context.** The builder, morph comparison, and dossiers need a consistent presentation across phone, desktop, and print.

**Decision.** Use Vite to host a TypeScript and React single-page application, with source-owned shadcn/ui-style primitives and Tailwind CSS for styling.

**Consequences.** The prototype builds to static files and uses browser storage. Vite supplies the local setup and build commands. Verify that product-specific views support keyboard navigation and that the dossier layout works in browser printing.

## 2. Represent resleeving with separate sleeve records

**Context.** An ego persists through changes of body, and players need to compare the effects of each morph.

**Decision.** Represent the ego, sourced morph definition, and ego-to-morph pairing separately. Record resleeving as a new sleeve.

**Consequences.** The builder can save an ego before morph assignment. A character can retain prior sleeves while viewing the active one or comparing outcomes.

## 3. Derive rules outputs with pure functions

**Context.** Players need an explanation for each calculation, and drafts can be incomplete.

**Decision.** Calculate and validate from versioned rules data and normalized selections. Return structured issues and a trace with derived outputs.

**Consequences.** UI and exports share calculations. Tests can exercise draft cases and verify modifiers independently of rendering.

## 4. Start with local storage and portable backups

**Context.** Players should be able to build and keep characters without an account.

**Decision.** Use IndexedDB for the MVP, support versioned JSON import/export, and print player and GM dossiers through the browser.

**Consequences.** Backup import needs validation and migration reporting. Dossier exports need controls for private information. Optional account sync comes after local import and export are reliable.

## 5. Track sources and confirm content rights before bundling

**Context.** Mechanics, published text, artwork, and logos can have different attribution and licensing requirements.

**Decision.** Separate game data from code, retain source references for datasets and interpretations, and confirm rights before inclusion.

**Consequences.** Licensing and provenance are discovery work before dataset implementation. Attribution follows the applicable requirements in the app and exports.

## 6. Start with core package-buy

**Context.** The publisher presents package-buy as the standard Second Edition workflow. Freeform skill allocation is a core alternative and the expanded lifepath is described in *Character Options*. [Second Edition overview](https://eclipsephase.com/whats-new-in-eclipse-phase-second-edition/) · [Character Options](https://eclipsephase.com/2024/10/24/eclipse-phase-character-options-pdf-available/)

**Decision.** Implement one guided creation method for v1 using the current core rulebook’s package-buy chapter and errata 1.4. Cover background, career, interest, faction, aptitude choices, starting skills and customization, motivations, traits, reputation, equipment, and assignment of a supported published morph. Keep a route through creation that uses only verified core choices. Track the alternative freeform path and the expanded lifepath as future scope.

Use published morphs for v1. Defer custom morph creation until the catalogue and validation for published morphs are reliable.

**Consequences.** Each shipped option needs a versioned source reference and matching validation. The prototype can continue to save incomplete egos while package-buy tables and budgets are verified. [Rules source inventory](rules-sources.md)

## 7. Consolidate workspace navigation in a top navbar

**Context.** The working app has two primary destinations, My egos and Morph library. A sidebar takes space from character editing, while create/import actions were only available on the dashboard.

**Decision.** Put the brand, two primary destinations, Create ego, Import JSON, and the local workspace indicator in a shared top navbar. Remove the separate status bar and Prototype badge. Keep all links visible on small screens, with two columns on phones.

**Consequences.** The workspace uses the full available width. Existing browser routes, active-link semantics, keyboard focus, unsaved-edit guards, and print visibility continue to apply. Workspace export remains a contextual dashboard action beside the saved drafts. Contributor docs continue to describe the app's current scope and limitations.

## 8. Expand Regional into concrete faction choices

**Context.** The core faction sidebar lists 15 broad affiliations and a Regional category naming Solarian, Sifter, Belter, Europan, Ringer, and Skimmer. A generic Regional selection would leave both the faction Know field and motivation vague.

**Decision.** Expose the six regional affiliations as individual choices under a native Regional optgroup. Give each a stable id, a 30-point faction Know grant, and the same editable motivation default used by other named factions. Preserve the original Anarchist, Argonaut, and Factionless choices.

**Consequences.** The selector offers 21 named affiliations plus Factionless. Grouping is dataset metadata and does not enter the saved ego schema. Knowledge of an old faction can use the existing Know transfer workflow while motivation follows the selected allegiance. [Core faction source](rules-sources.md#source-inventory)

## 9. Identify repeatable ego traits by their scope

**Context.** Contact and Morph Familiarity can be bought more than once, while existing trait controls and backup validation assume one selection per trait id. Each repeat needs its own contact/network or morph type and CP cost.

**Decision.** Extend ego trait choices with optional detail and reputation network fields. Require both for Contact and only a morph type detail for Morph Familiarity. Treat the normalized trait/detail/network tuple as the identity for these two traits. Preserve id-only uniqueness for all existing traits. Use explicit Add and Remove controls so unnamed or duplicate entries do not become saved purchases.

**Consequences.** Each entry costs one CP and renders separately in dossier and print summaries. The current draft and backup versions can read earlier choices unchanged. Situational benefits stay as reference text. Freeform morph type names allow GM-approved scope without expanding the supported morph catalogue. [Rules sources](rules-sources.md#source-inventory)

## 10. Keep skill ratings separate from trait-adjusted test targets

**Context.** Hardening applies a cumulative Persuade Test penalty for each stress immunity. Subtracting that penalty from the skill rating would conceal excess package points and incorrectly permit purchases above the starting cap.

**Decision.** Retain the existing skill rating, allocations, and cap checks. Derive a separate test target with named trait modifier contributions after allocation. Specialization targets add their situational bonus to that adjusted target. Show both values wherever a penalty applies. Use the existing scoped trait representation for Hardening's distinct stress types and defer Unknown with Psi support.

**Consequences.** Removing Hardening changes test targets and CP costs while preserving skill allocations. Pending aptitudes stay pending. Existing drafts and backups require no new fields or version changes. [Rules sources](rules-sources.md#source-inventory)

## 11. Store starting gear swaps by original pack item

**Context.** The core rules allow equal-GP swaps. A draft can change campaign, career, or its first morph before the initial sleeve is assigned, and some gear has an unresolved additional cost.

**Decision.** Store each swap against a pack and original item. Resolve its replacement from the supported pack catalogue after applying first-sleeve alternatives. Allow fixed-cost swaps at equal GP and use the replacement's source and restriction.

**Consequences.** Swaps preserve pack totals. Inactive choices can return if the player restores the earlier selection before saving. A save keeps applicable swaps, and an import validates every supplied swap before restore. Resleeving preserves the original first-sleeve context. [Core gear pack rules](https://eclipsephase.github.io/en/04/27-gear-packs.html#gear-packs)

## 12. Offer the optional Infomorph pack in the campaign slot

**Context.** The core book places the optional 10 GP Infomorph pack in its Campaign Packs section and assigns two starting gear packs to each character.

**Decision.** Let a player with an infomorph first sleeve opt into the Infomorph pack for the campaign slot. Save the choice independently of the campaign so the original campaign pack can be restored.

**Consequences.** The career still supplies its own pack. The first sleeve governs eligibility for the pack and its swap items across edits, backup restore, and later resleeving. [Core campaign packs](https://eclipsephase.github.io/en/04/27-gear-packs.html#optional-pack-infomorph)

## 13. Derive temporary Flex from the starting morph budget

**Context.** The core rules give a GM-set starting MP allowance and a Resources bonus. The conversion to temporary Flex costs 2 MP per point and lasts until resleeving.

**Decision.** Store the optional GM allowance and derive the rest from the Resources trait and original sleeve. Interpret the conversion as one Flex per complete 2 MP pair. A second sleeve expires the bonus.

**Consequences.** The dossier retains the starting budget through resleeving and backup restore. Pending and over-budget drafts can still be saved. Ego Flex and the published morph pools keep their own values. [Starting morph and gear rules](https://eclipsephase.github.io/en/04/15-step-12-starting-morph-gear.html)

## 14. Price extra starting equipment from listed complexity

**Context.** Step 12 sets the MP price of extra starting gear by complexity. The core Gear chapter also lists GP values for pack swaps.

**Decision.** Use one sourced equipment catalogue for both workflows. Record one item ID per purchase and derive quantity and MP cost from those IDs. Use the listed GP value for a pack swap.

**Consequences.** The editor and saved outputs show the same MP spend and recalculate temporary Flex after additions or removals. The catalogue can expand independently of existing draft records. [Step 12, Extra Gear](https://eclipsephase.github.io/en/04/15-step-12-starting-morph-gear.html#extra-gear)

## 15. Store morph traits on individual sleeves

**Context.** Morph traits affect a particular sleeve. Their starting MP cost or bonus remains part of the original budget after resleeving.

**Decision.** Save the selected trait IDs and levels on the first sleeve. Derive health from those inputs and keep the base catalogue profiles available for comparison. Use published eligibility and the 6 MP cap for negative traits.

**Consequences.** Resleeving preserves the first sleeve's choices in history and starts the new sleeve with its base profile. Older drafts can omit the added field. [Core morph trait rules](https://eclipsephase.github.io/en/04/28-traits.html)

See [Architecture](architecture.md) for component boundaries and the [roadmap](../roadmap/roadmap.json) for remaining work.
