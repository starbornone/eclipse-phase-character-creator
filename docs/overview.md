# Project overview

Eclipse Phase 2e Character & Morph Creator is a web application for players building characters and GMs reviewing them at the table. The planned release helps users create, validate, save, and print characters with the rules and calculations visible along the way.

The prototype supports saved ego drafts, Quick-Start morph profiles, resleeving with sleeve history, aptitude checks, player and GM print layouts, and JSON backup and restore. The workflows below describe the intended release.

## From ego to dossier

1. **Build an ego.** Record the character’s identity, aptitudes, skills, traits, motivations, reputation, and gear. Review the budget and validation for core package-buy, the [first planned creation method](decisions.md#6-start-with-core-package-buy).
2. **Assign a morph.** Browse supported bodies, compare up to three, and choose a morph and permitted options. The resulting **sleeve** pairs the ego with a morph.
3. **Resleeve.** Compare the old and proposed sleeve’s derived stats and record the event. Keep prior sleeves in the character’s history.
4. **Take the character to a session.** Print a player dossier or concise GM summary with explicit controls over private notes. Export a JSON backup for later import.

The first release is designed for local use without an account. Virtual tabletop play, full campaign management, multiplayer collaboration, live sheets, cloud sync, and automated combat simulation are outside its scope. The tool assists with character creation alongside the core rulebook. Bundled rules content must follow the confirmed licensing and attribution plan.

See [Getting started](getting-started.md) for the current repository workflow, [Architecture](architecture.md) for the planned system, [Visual design direction](design-direction.md) for the Astral Archives references and sci-fi wireframe guidance, and the [roadmap](../roadmap/roadmap.json) for delivery priorities.
