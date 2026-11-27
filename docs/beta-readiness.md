# Public beta readiness

Use **Get started with the beta** on an empty dashboard or **Beta help** on any page. The guide covers first creation, JSON restore, supported rules, and reporting a problem. A complete example runs from a blank ego through a saved sleeve, both print layouts, and backup restore. [Worked character](getting-started.md#create-a-complete-first-character)

## Known limitations

- Drafts are stored in IndexedDB for the current browser profile and site origin. A new host, local port, or browser profile opens a separate workspace. Export JSON before replacing that workspace or clearing site data.
- The supported path uses core package-buy and one starting sleeve. The catalogue contains 16 player morphs. Creation review and the budgets cover the supported rules. Resolve reserve morph purchases, installed gear effects, and situational bonuses with the GM.
- JSON backups contain all saved fields, including private sleeve notes. Share a player dossier or select specific GM print fields when preparing a copy for someone else.
- The digital audit covers keyboard behavior, desktop and narrow layouts, and A4 and Letter PDFs. Physical grayscale output has a separate roadmap item. [Accessibility review](accessibility-review.md) · [Print review](print-review.md) · [Roadmap](../roadmap/roadmap.json)

## Feedback loop

- Players can search existing issues or open the issue form from **Beta help**. Choose **Beta bug report** for a reproducible error and **Beta workflow feedback** for usability or feature feedback. Both forms ask for fictional examples and warn that issues are public. [GitHub Issues](https://github.com/starbornone/eclipse-phase-character-creator/issues)
- Before the next beta build, review new issues, link duplicates, and try the steps in a clean browser with synthetic data. Ask for the browser, app version, and the smallest reproducible example when information is missing.
- Prioritize inaccessible actions, lost progress, data corruption, and unexpected failures ahead of workflow polish. Link fixes to the original issue, repeat the affected workflow, and record unresolved limitations in the next beta notes.

## Error reporting and voluntary metrics

**Optional diagnostics** starts off in a fresh tab. Turning it on counts fixed workflow and error events in the current tab. Reloading that tab preserves the counts. Turning diagnostics off clears them. The report contains the app version and event counts, capped at 9,999 per event. Review the preview and copy it manually if you want to share it alongside a report.

| Signal | What the count represents |
| --- | --- |
| Draft and sleeve saves | Successful writes after creating, editing, or resleeving |
| Backup activity | Requests to export JSON and successful restore operations |
| Printing | Requests to open the print dialog |
| Recoverable failures | Workspace load, draft or resleeve save, revision conflict, backup read or validation, and restore failures |
| Unexpected failures | Errors that reach the workspace recovery screen |

The diagnostics code stores numeric event counts in tab session storage. Reports are separate from character backups. The app lets the player copy the report and submit it in GitHub after review. Treat shared counts as voluntary samples. Compare recurring reported failures across builds and keep any summary tied to the number of submitted reports.

## Beta release check

1. Run `npm ci`, `npm test`, and `npm run build`. Use the production build to check direct visits to the library, editor, dossier, print preview, and help. Configure the static host as described in [Serve browser routes](development.md#serve-browser-routes).
2. Complete the worked character and restore a JSON backup in a clean browser profile. Open **Beta help** on desktop and at a narrow width.
3. Enable diagnostics, create a fictional character, and try an invalid backup. Check the preview and copy flow. Reload, turn diagnostics off, and confirm that turning them on again starts from zero. Try an unavailable app route or storage error and confirm the user can reach **Beta help**.
4. Confirm the issue forms appear on the default branch before sharing a public build link. Check that the host serves the same version shown on **Beta help** and that the app and dossier retain their attribution. [Rules sources and content policy](rules-sources.md)

On 28 November 2026, the local production build passed the Chrome beta workflow at desktop and 320 CSS pixels. Checks covered axe, local opt-in, clipboard and manual copy, reload, tab isolation, opt-out, unavailable storage, and a failed route asset. Synthetic draft and sleeve details stayed out of the diagnostic report. All 204 tests passed.
