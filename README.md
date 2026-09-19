# Alsace · A living wine atlas

A dependency-free static application for GitHub Pages. English UI, responsive desktop/mobile layout, no backend, account, analytics or build step.

## Explore

- **Atlas:** the 51 Grands Crus, village/area entries and 69 verified clos and lieux-dits, grouped north to south. Filter by area, site type, normalized geology and personal status. Add or edit personal vineyards.
- **Coverage:** an interactive grape × geology × area matrix derived entirely from the journal (see below).
- **Producers:** sourced cellar directory arranged north to south, with name/village search, discovery filters, direct bottle recording and personal additions. Existing journal records can be linked by editing their producer selection.
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

The suite is `npm test` (four Playwright files: `browser`, `producers`, `origins`, `matrix`).

Browser regression checks use Playwright (development only):

```sh
npm install
npx playwright install chromium
npm test
```

Start the local server above before running the tests. Tests cover legacy migration, tasted vs wishlist coverage, source validation, comparison linking, unsafe text, persistence, JSON round trips, invalid imports, mobile overflow and browser errors.

An existing Chromium binary can be selected with `CHROMIUM_PATH=/absolute/path/to/chromium npm test`. The implementation was checked with Playwright 1.62.1 and Chrome Headless Shell 145, including desktop 1440px and mobile 390px layouts.

## Producer directory

`producers.js` contains 771 source-linked listings: all 652 entries across 55 pages of the [Alsace Wine Route directory](https://www.routedesvins.alsace/caves-vignerons/) plus 119 additional listings from the [Synvira independent-grower directory](https://www.alsace-du-vin.com/annuaire-alsace-vignerons-7.html), retrieved 2026-09-12. The latter supplied 441 records: 293 matched normalized producer names, 28 additional aliases were reconciled, and one non-Alsace address (Coiffy-le-Haut) was excluded. Aliases and secondary reference links are retained. No source descriptions or photos are republished.

This is a directory of sourced names and cellar locations, not a verified census of distinct operating companies. Multiple trading names and cellar locations can remain separate. Neither active status nor visiting availability is guaranteed. Reference links let readers check the original entry. Refreshing this snapshot should preserve IDs to keep personal bottle links intact.

Coordinates identify cellars. Broad atlas areas use cellar/village geography; entries within an area sort by source latitude. Two invalid Synvira coordinates were omitted; their stated villages determine their areas. Personal additions are placed in a user-selected area and follow the sourced entries alphabetically when no coordinates are available.

The existing v3 localStorage key remains compatible with old backups: missing `producers` becomes an empty array and missing `producerId` becomes an empty link. No existing bottle is matched by name automatically. Personal producers, notes, links and wishlist records are included in JSON backup/restore. A personal producer with linked bottles cannot be deleted until those bottles are unlinked.

`tests/producers.cjs` checks old-v3 migration, directory IDs, name-order search, linking existing and new bottles, wishlist counts, custom producers, safe text, linked-deletion protection, complete backup round trips and mobile layout.

## Producer origins and atlas coverage

Producer cards and atlas places now show reciprocal origin links. Add one or more sourced links per producer, distinguishing wine made from a place from confirmed grape cultivation. Explicit links can be edited or removed. Existing journal bottles with a producer ID, atlas place and origin evidence also provide live links; these follow bottle edits/removal and do not claim land ownership. No vineyard holdings are inferred from cellar addresses or seeded without evidence.

`producerSites` is optional for old v3 backups and preserved by JSON export/import. Links validate producer/place IDs, evidence and relation types. Removing a personal producer removes its manual links; existing linked bottles still prevent deletion.

The headline counter now counts distinct atlas places linked to tasted records across all 72 entries (51 Grands Crus and 21 area/village entries). The denominator derives from the dataset. Wishlist entries and producer-origin reference links do not increase tasting coverage.

## Coverage matrix (v4)

The **Coverage** tab crosses **grape × geology × area**. Rows are grapes and columns geology categories by default; the area selector offers *All areas* plus the seven areas. A second view fixes one grape and shows areas × geology. Cells show ✓ with the encounter count, ◆ for a chosen target, ○ for documented wishlist wines and — for a not-applicable mark. Tapping a cell (or Enter) lists its tasted wines, wishlist wines and catalogue sites, and offers *Record a tasting*, *Mark as target* and *Mark not applicable…*. In *All areas* a cell also says how many areas contribute; a tasting in one area never covers another.

**States.** *Tasted* needs a tasted journal record supporting all three axes. *Not yet tasted* means a matching wishlist wine is documented. *Target* is your own goal. *Unknown* means nothing matching is documented; the catalogue never asserts that a combination does not exist. *Not applicable* is allowed only with a reason you type. Wishlist entries never count as tasted, and opening the record form never creates a checkmark.

**Journal is the only source.** Coverage is recomputed from `wines` on every render, so editing or deleting a tasting updates the matrix immediately. Only targets and not-applicable marks are stored separately (`targets`, `excluded`). Headline figures are distinct combinations tasted and targets reached; there is deliberately no "percentage of Alsace".

### Classification rules

- **Geography** is the origin of the grapes, never the winery or tasting location. A record may name only an area (`originRegion`); it then counts under *Unknown geology* for that area and invents no geology.
- **Geology** has one normalized category per site (11 categories in `sites.js`) plus the original wording, basis and source. Grand Cru wording is mapped through `soilToGeology`. Basis is whole-vineyard reference scale; a wine may carry a sourced **parcel-level correction** (`parcelGeology` + evidence), which overrides the site.
- **Mixed formations** are explicit categories (marl-limestone-sandstone, volcano-sedimentary, other mixed) and are never counted as two pure examples. Sites without documented geology stay unclassified.
- **Blends.** `Blend / other` records components (and optional free-text percentages) and fills its own row. A Riesling-containing blend never marks the single-variety Riesling cell; a small "b" hints that only blend encounters exist there. Unknown composition saves normally and appears in no cell.
- **Multiple origins / incomplete records.** A "several vineyards or areas" flag keeps a bottle out of every single site, area and geology. Records lacking grape, area or a single origin save fine and are listed as "not placed in any cell", with a link to complete them.
- **Suggestions.** Quick entry offers origins from linked producers or earlier bottles as visibly labelled *suggested, not confirmed* buttons; evidence is still required to save a vineyard.

### Data model and migration

The storage key stays `alsace-atlas-v3` and old data is never rewritten before validation. Version 4 adds `personalSites`, `targets` and `excluded`, plus per-wine `originRegion`, `multiOrigin`, `blendGrapes`, `blendNote`, `parcelGeology`, `parcelGeologyEvidence`. Version 3 saved data and backups load unchanged (missing fields default to empty); export writes version 4 and includes the new sites, classifications and targets. Invalid imports are rejected without changing stored data.

## Vineyard research (reviewed 2026-09-19)

`sites.js` holds 69 clos and lieux-dits (north 6, Marlenheim–Molsheim 3, Obernai–Andlau 12, Epfig–Kintzheim 5, Bergheim–Riquewihr 22, Kaysersberg–Colmar 9, south 12), each with ID, name, aliases, type, village, area, parent Grand Cru (for example Clos Saint Urbain within Rangen, Clos Sainte Hune within Rosacker), normalized and original geology, basis, source URL, review date and documented producers. Parcels inside another site keep a parent link instead of a duplicate.

Booked producers: all of Ostertag's named sites (Fronholz, Heissenberg, Zellberg, Clos Mathis, Pflanzer), Weinbach (Clos des Capucins, Altenbourg), Zind-Humbrecht (Clos Windsbuhl, Clos Jebsal, Clos Häuserer, Clos Saint Urbain, Heimbourg, Herrenweg, Rotenberg de Wintzenheim), Zusslin (Clos Liebenberg, Bollenberg, Neuberg, Luft) and Deiss (Engelgarten, Rotenberg de Bergheim, Grasberg, Burg, Gruenspiel, Schoffweg, Huebuhl, Burlenberg, Langenberg) plus Kreydenweiss (Kritt, Lerchenberg, Clos du Val d'Eléon, Clos Rebberg). Broader coverage includes the Cleebourg lieux-dits, Wolxheim, Barr and Mittelbergheim sites, Rorschwihr's lieux-dits, Dirler-Cadé's Bergholtz sites and other named clos.

**Verification depth varies.** The examples you listed (Fronholz, Zellberg, Clos Mathis, Clos Windsbuhl, Clos Jebsal, Rotenberg, Engelgarten) each exist and are attached to the producers shown. Clos Windsbuhl, Clos Jebsal, Heimbourg, Clos Saint Urbain, Clos des Capucins and Altenbourg were read on the producers' own terroir pages; Ostertag's Fronholz, Heissenberg, Zellberg and Clos Mathis descriptions come from importer and retailer material, and Deiss's from an importer catalogue, so treat those geology details as secondary until checked with the domaine. Two facts to note: there are two distinct Rotenbergs (Bergheim and Wintzenheim), stored separately; and the Zind-Humbrecht pages for Herrenweg and Rotenberg state no geology, so both are left unclassified.

**Gaps and limitations.** This is not a complete Alsace vineyard list and makes no such claim: Alsace has several hundred cadastral lieux-dits. Known unverified sites include Burgreben, Patergarten, Letzenberg and Finkenberg. 21 of the 69 named sites have no documented geology and are unclassified. Several entries rely on commune-level descriptions (marked in their basis). Producer cuvée names (for example "Les Jardins", "Au dessus de la Loi") are deliberately excluded until verified as geographical sites. Sources are producer and importer pages, tourist bodies and regional guides; they were read on the review date and not independently cross-checked against the cadastre or INAO records. Some source pages were fetched via summarising tools, so wording is paraphrased where marked; check the source before relying on a parcel detail.
