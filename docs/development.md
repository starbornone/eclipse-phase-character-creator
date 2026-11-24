# Development

## Current workflow

The root [README](../README.md) holds the product brief. [Architecture](architecture.md) maps the proposed source tree. The repository currently has no package manifest, source tree, lint script, or test runner. When a runnable stack is selected, record the actual prerequisites and commands in [Getting started](getting-started.md) and [AGENTS.md](../AGENTS.md).

1. Review the README milestone and relevant [roadmap item](../roadmap/roadmap.json). Check the working tree with `git status --short`.
2. For a change to game content or rules, record its source and version. Confirm the content boundary before adding published mechanics, text, or assets.
3. Review `git diff --check` for whitespace errors. For new files, also read them directly because unstaged additions do not appear in `git diff`. Follow relative Markdown links and check roadmap JSON against the [format contract](roadmap-format.md).
4. Update the affected docs and move any finished roadmap item in the same change.

## Verification as implementation lands

| Layer | Scenarios to cover |
| --- | --- |
| Rules and data | Test aptitude, skill, cost, pool, and morph modifiers, both planned creation paths as supported, incomplete drafts, calculation traces, import parsing, and migrations. |
| Components | Verify builder completion cues, validation links and announcements, keyboard navigation, morph filter/sort/compare, and dossier visibility controls for private notes. |
| End to end | Create and save an ego and sleeve, reload an incomplete draft, resleeve and inspect history, export and re-import, and print a complete dossier. Verify that malformed imports preserve existing local characters. |

The README calls for calculation and character-creation constraint coverage before UI code depends on those rules. For UI work, include visible focus, error cues that are understandable without colour, and layouts that remain legible on phones and in print. See [Contributing](contributing.md) for review expectations.
