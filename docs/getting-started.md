# Getting started

The repository is in planning and pre-build. A Git checkout and a Markdown reader are enough to work on the current project. The planned UI uses TypeScript, React, shadcn/ui, and Tailwind CSS. Runtime versions, supported browsers, and the host framework are open.

## Open the repository

From an existing checkout, run:

```sh
git status --short
git rev-parse --show-toplevel
```

The second command should show the checkout root. The first may return an empty result for a clean worktree. Open [README.md](../README.md) and [the ordered roadmap](../roadmap/roadmap.json) from that root.

There is no application install, start command, or browser smoke test at this stage. Missing `package.json` or `src/` is expected. If Git is unavailable, read the files directly in the repository. If Git reports that the current directory is outside a repository, switch to the checkout root. Browser support and IndexedDB availability need to be verified once the target platforms and runnable app are defined.

## First useful action

Read the README’s **Milestone 0 — Product and rules discovery** and **Open decisions**, then pick the highest-priority unblocked roadmap item. A concrete first task is to record the official licensing source, attribution requirements, and which content may be bundled before preparing game data.

Once the first vertical slice exists, verify it by creating a draft ego, assigning a sample morph, reloading, and checking that the sleeve and its calculated summary survive the reload. See [Development](development.md) for the verification plan and [Contributing](contributing.md) for how to record progress.
