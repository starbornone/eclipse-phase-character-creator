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

See [Architecture](architecture.md) for component boundaries and the [roadmap](../roadmap/roadmap.json) for remaining work.
