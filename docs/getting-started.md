# Getting started

Use a Git checkout, Node.js 22.12 or later with npm, and a current browser with IndexedDB enabled. The prototype uses Vite, React, TypeScript, and Tailwind CSS.

## Start the prototype

From an existing checkout, run:

```sh
npm ci
npm run dev
```

Open the local URL Vite prints. The dashboard should show **My egos**, the **Create ego** action, and the sample morph library. Drafts belong to this browser profile and origin. If Vite selects another port, use the original URL to reopen drafts created there.

If npm cannot find `package.json`, switch to the checkout root. If installation fails, check the Node version and registry connectivity. If local drafts cannot open, check that the browser permits site storage for the local origin. Use localhost for development so the browser can generate record ids in a secure context.

## Create a first sleeve

1. Select **Create ego**, enter a name, and set Intuition to 12.
2. Select **Survey Sleeve**, then **Save draft**. The dossier should show Intuition 12 + 5 = 17 and leave unentered totals blank.
3. Reload the page and reopen the saved ego from **My egos**. Check the name, active sleeve, and calculation. Use **Print dossier** to open the browser print dialog.

You can also save without a morph and assign one later from **Edit ego**. The sample rules are illustrative. See [Development](development.md) for checks and the [roadmap](../roadmap/roadmap.json) for upcoming work.
