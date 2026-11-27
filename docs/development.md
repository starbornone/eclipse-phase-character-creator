# Development

## Current workflow

The root [README](../README.md) holds the product brief. [Architecture](architecture.md) describes the prototype and planned boundaries. Use Node.js 22.12 or later and run commands from the checkout root.

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the locked dependencies. |
| `npm run dev` | Serve the prototype locally with Vite. |
| `npm test` | Run Node tests for incomplete drafts, invalid aptitude input, and calculation traces. |
| `npm run typecheck` | Check TypeScript types without emitting files. |
| `npm run build` | Type-check and build the static site into `dist/`. |
| `npm run preview` | Serve the built site locally. |

1. Review the README milestone and relevant [roadmap item](../roadmap/roadmap.json). Check the working tree with `git status --short`.
2. For a change to game content or rules, record its source and version. Confirm the content boundary before adding published mechanics, text, or assets.
3. Run the test and build commands for source changes, then follow the local [first sleeve walkthrough](getting-started.md#create-a-first-sleeve). Review `git diff --check` and validate links and roadmap JSON for documentation changes.
4. Update the affected docs and move any finished roadmap item in the same change.

## Serve browser routes

Vite dev and preview serve the app shell for direct visits to workspace paths. When deploying `dist/`, configure the static host to serve `index.html` for application paths without changing their URLs. Serve existing files such as `/favicon.png` and `/assets/*` directly. After deploying, open `/morphs` and refresh a nested ego URL to verify the host fallback.

## Verification as implementation lands

| Layer | Scenarios to cover |
| --- | --- |
| Rules and data | Test aptitude checks and sourced morph values, then add coverage for core package-buy, skills, budgets, pools, incomplete drafts, import parsing, and migrations as those workflows land. |
| Components | Verify builder completion cues, validation links and announcements, keyboard navigation, morph filter/sort/compare, and dossier visibility controls for private notes. |
| End to end | Create and save an ego and sleeve, reload an incomplete draft, resleeve and inspect history, export and re-import, and print a complete dossier. Verify that malformed imports preserve existing local characters. |

The README calls for calculation and character-creation constraint coverage before UI code depends on those rules. For UI work, include visible focus, error cues that are understandable without colour, and layouts that remain legible on phones and in print. See [Contributing](contributing.md) for review expectations.

For print changes, repeat the [dossier grayscale review](print-review.md), including multi-page tables and private-field checks in the generated PDF text.
