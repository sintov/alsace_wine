# False-exclusion and catalogue integrity review

This review supersedes the automatic-X policy described in the earlier matrix audit.

## Confirmed error and correction

A whole-vineyard category was treated as an exhaustive geological boundary. This caused false exclusions. Kaefferkopf is summarized as granite–limestone / mixed-other, yet CIVA describes granite uphill, other formations downhill, and local surface deposits. Domaine Maurice Schoech explicitly describes its Riesling Kaefferkopf parcels as granite-derived, and its Gewurztraminer Kaefferkopf as clay/granite-derived. Both granite cells were previously crossed out unless the user had already entered parcel evidence.

Sources re-read for this review:

- [CIVA: Kaefferkopf](https://www.vinsalsace.com/en/grands-crus/kaefferkopf/)
- [Maurice Schoech: wine and parcel descriptions](https://www.domaineschoech.com/vins-alsace-bio/)
- [CIVA: Gloeckelberg](https://www.vinsalsace.com/en/grands-crus/gloeckelberg/) — dominant granite, with schist/sandstone debris uphill and colluvium below.
- [CIVA: Hengst](https://www.vinsalsace.com/en/grands-crus/hengst/) — the broad category does not identify every producer parcel.

Automatic exclusions are removed across the catalogue. A different reference category supplies an informational note, never a disabled target. Unknown combinations remain ?. Only a user's explicit exclusion produces ×, visibly labelled as personal and reversible. Existing exclusions are retained; no access to the user's browser-local exclusions is assumed.

Two producer-specific positive examples are added for Kaefferkopf (Riesling and Gewurztraminer on granite-derived parcels). They also feed the Colmar regional view. They do not assign granite to Pinot Gris or every Kaefferkopf parcel, and they do not automatically change the geology of existing wine records.

## Coverage of verification

The structural audit covers all 144 atlas entries: 51 Grands Crus, 21 village/area entries and 72 other named sites. Checks cover unique IDs, valid regions/geology/grape keys, existing parent links and absence of parent cycles. All 24,192 site × grape × geology combinations, plus the seven regions and the Alsace overview, are checked to have no automatic exclusion with empty personal state.

This is **not certification of every factual field**. The earlier pass checked the 51 CIVA/producer Grand Cru profiles and six northern producer profiles; this pass rechecks the heterogeneous-site counterexamples above and the exclusion logic. The remaining named vineyards have not all been independently cross-checked against parcel maps or producer technical sheets. References may describe different scales or historical plantings. The site is not an appellation-eligibility database.

## Known data limits (current catalogue)

- 84 entries have no explicit grape-example list: 21 village/area entries and 63 named vineyards. They cannot be used to infer that a grape does not occur there.
- 44 entries have no normalized geology: the 21 village/area entries and 23 named vineyards. This is missing or deliberately unassigned data, not absence of soil.
- Some named-vineyard references are importers, guides or commune descriptions rather than parcel-level primary sources. Their existing basis/source fields must be consulted. A populated field is not proof of independent verification.
- Even the Grands Crus with primary references generally use whole-vineyard categories. All now display this limitation in the Atlas. Kaefferkopf, Gloeckelberg and Hengst have specific additional notes.
- Compact matrix axes are a view of currently documented examples and personal entries. Hidden axes are explicitly not ruled out; the full research view remains available.

## Validation

`node tests/site-matrix.cjs` passes the complete structural and no-automatic-exclusion checks, source-example propagation, exact-origin and regional isolation, personal exclusion round-trip/removal, targets and parcel overrides. JavaScript syntax and whitespace checks pass. DOM interaction checks pass for unknown cells remaining open, source dialogs, producer examples, target persistence and manual exclusion removal. Full Chromium visual/mobile validation was not run.
