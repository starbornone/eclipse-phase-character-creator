# Agent guide

## Project

**Eclipse Phase 2e Character & Morph Creator** (`eclipse-phase-character-creator`) is a local-first web application for players and GMs. The prototype separates an ego draft from its optional first morph and displays a printable dossier with inspectable aptitude calculations. Resleeving and full character validation are planned.

## Layout

- [README.md](README.md) defines the product, licensing policy, planned workflows, and milestones.
- [docs/](docs/overview.md) covers contributor onboarding, architecture, verification, and decisions.
- [roadmap/](roadmap/roadmap.json) contains work to do, completed items, and cancelled items.
- `src/main.tsx` mounts the React app. `src/app/App.tsx` handles screen navigation, `src/components/` holds the workspace UI, `src/rules/` holds the sample dataset and calculations, `src/lib/storage/` handles IndexedDB, and `src/tests/` contains calculation checks.

## Working agreements

Use Node.js 22.12 or later. Run `npm ci`, `npm run dev`, `npm test`, and `npm run build`. The build runs `npm run typecheck`. For documentation changes, check `git diff --check`, verify relative links, and validate the roadmap JSON. See [Development](docs/development.md) for the verification workflow.

Keep versioned rules datasets and source references separate from application code. Use the [rules source inventory](docs/rules-sources.md) and confirm attribution and content rights before adding published rules or assets. Keep calculations and validation in pure functions, with traces for derived values and tests for incomplete drafts.

## Documentation

Update the relevant files in `docs/` when workflows, architecture, setup commands, verification, or contributor expectations change. Keep the README and supporting docs consistent. Record consequential design choices in [Decisions](docs/decisions.md).

## Roadmap

This project’s key is `eclipse-phase-character-creator` and its title is **Eclipse Phase 2e Character & Morph Creator**. Keep the roadmap in three files in `roadmap/` at the repository root.

- [roadmap/roadmap.json](roadmap/roadmap.json) tracks project status and work to do, highest priority first.
- [roadmap/completed.json](roadmap/completed.json) records finished work.
- [roadmap/cancelled.json](roadmap/cancelled.json) records dropped work.

All three use this shape.

```json
{
  "schema": "name -roadmap/v1",
  "file": "roadmap",
  "updatedAt": "2026-10-14T09:30:00+11:00",
  "project": {
    "key": "eclipse-phase-character-creator",
    "title": "Eclipse Phase 2e Character & Morph Creator",
    "status": "active",
    "summary": "Optional, roadmap.json only."
  },
  "items": [
    {
      "id": "stable-kebab-id",
      "title": "Short imperative title",
      "group": "Optional area",
      "notes": "Optional detail"
    }
  ]
}
```

1. Set `schema` to the literal string `name -roadmap/v1`. Set `file` to `roadmap`, `completed`, or `cancelled` to match the filename.
2. Keep `project.key`, `project.title`, and `project.status` identical across all three files. Never change the key. Status is `active`, `paused`, or `complete`. Use `summary` only in `roadmap.json`.
3. Give each item a lowercase kebab-case `id` that is unique across the three files. Never rename or reuse an id, even after completion or cancellation. Titles and notes may be edited freely.
4. Use only `id`, `title`, and optional `group` and `notes`, plus required `completedAt` in `completed.json` or required `cancelledAt` and optional `reason` in `cancelled.json`.
5. Move finished items to the end of `completed.json` and add `completedAt`. Move dropped items to the end of `cancelled.json` and add `cancelledAt` and a short `reason`. Never delete an item outright. To revive a cancelled item, move it back to `roadmap.json` with the same id and remove `cancelledAt` and `reason`.
6. Keep each item in exactly one file. Give split work new ids and preserve the meaning of existing ids.
7. Set `updatedAt` in every changed file. Use ISO 8601 timestamps with an explicit UTC offset, such as `2026-10-14T09:30:00+11:00`.
8. Keep `roadmap.json` in priority order. Limit titles to 500 characters, notes and reasons to 20,000 characters, and each file to 2,000 items.
9. Write valid UTF-8 JSON with two-space indentation, without comments or trailing commas. Create a missing file with an empty `items` array.
10. Update the roadmap in the same change as the work it describes. Mark an item complete only when the work is done.

See [Roadmap import format](docs/roadmap-format.md) for the contract other repositories can follow.

## Do and don’t

- Prefer small, focused diffs and verify the affected workflow.
- Update the roadmap with the work and preserve item ids across all moves.
- Keep APIs and commands grounded in repository code or documented design decisions.
