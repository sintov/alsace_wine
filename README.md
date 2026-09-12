# Alsace · A living wine atlas

A dependency-free static application for GitHub Pages. English UI, responsive desktop/mobile layout, no backend, account, analytics or build step.

## Explore

- **Atlas:** all 51 Alsace Grands Crus plus selected geographical areas, grouped north to south. Filter by region, entry type, geology and personal discovery status. Site facts link to CIVA references.
- **Learning axes:** grapes, terroir and climate, labelling, sweetness, cellar choices, sparkling wine, time, producers, food and buying. A tasted wine can support multiple topics.
- **Wine journal:** tasted encounters and wishlist/buying leads. Producer address is independent of verified grape origin. Repeat encounters can refer to the same bottle.
- **Comparisons:** at least two tasted encounters plus a written observation. No automatic inference of comparative learning from individual checkmarks.
- **Backup & history:** complete JSON export/import and readable text export. Local progress belongs to the browser and origin; export to move between devices.

## Existing checklist data

On first use the app reads `alsace-checklist-v2` from this origin's localStorage, copies all checked IDs and notes into preserved history, and writes the new `alsace-atlas-v3` key. **The old key is never modified or deleted.** Old marks do not create made-up bottle details or mark comparisons as complete. A historical note can be copied into a new journal form; the history remains intact.

Old JSON `{checked, notes}` backups can also be imported. Atlas backups replace the current atlas only after validation and explicit confirmation; legacy backups merge into history. Notes and labels are rendered as text, not interpreted as HTML. Remote Claude storage from the old application is not available on GitHub Pages; export/import is required for data from another platform or browser.

## Reference policy

`data.js` holds geographical facts, editorial learning questions and a legacy-label dictionary. CIVA site descriptions were checked on 2026-09-12. Geology is shown at whole-site reference scale and does not prescribe flavours. Missing source metadata is left absent instead of inferred. Legal statements and producer specifications should be checked against the current source and relevant vintage. Availability is a dated user entry, never a permanent claim of Israeli stock.

Legacy labels are retained solely to identify existing personal notes, not as endorsed reference content. The atlas is a long-term discovery tool, not a trip itinerary or a promise to exhaust a region.

## Run locally

```sh
python -m http.server 8765
```

Open http://localhost:8765. No install or build is needed for the site.

## Checks

`node --check app.js`

Browser regression checks use Playwright (development only):

```sh
npm install
npx playwright install chromium
npm test
```

Start the local server above before running the tests. Tests cover legacy migration, tasted vs wishlist coverage, source validation, comparison linking, unsafe text, persistence, JSON round trips, invalid imports, mobile overflow and browser errors.

An existing Chromium binary can be selected with `CHROMIUM_PATH=/absolute/path/to/chromium npm test`. The implementation was checked with Playwright 1.62.1 and Chrome Headless Shell 145, including desktop 1440px and mobile 390px layouts.
