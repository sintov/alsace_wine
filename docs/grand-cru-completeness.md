# Grand Cru completeness and visibility review — 19 September 2026

The deployed data.js and main commit d2cecce were compared by identity, not just count, with CIVA's complete list:
https://www.vinsalsace.com/en/grands-crus/pure-expression/

All 51 official identifiers are present, without duplicates. Altenberg de Bergheim and Kanzlerberg are both present, assigned to the atlas's Bergheim-to-Riquewihr area (internal ID `ribeauville`). The independently extracted official identifiers are saved in tests/fixtures/grands-crus.json.

A reproducible visibility problem existed in the matrix: its default evidence filter removed entire geographical rows when the selected grape had no supporting records. For example, choosing Muscat removed Altenberg de Bergheim. This is not proof of the exact filter state encountered by the user, but is a confirmed mechanism that made existing places disappear.

Geographical matrix rows now remain visible for every grape. Explicit area and search filters still apply. Columns include the geographical rows' site geology references, so a grape without documented examples still has usable unknown cells. This does not establish that the grape grows there. The selected-site grapes-by-geology view still hides unsupported grape rows by default; its full research view remains available.

The atlas reports both total visible places and visible Grands Crus, with actions to clear filters or show all 51. The Grand Cru matrix likewise reports its visible count and can clear geography/search filters without changing the chosen grape.

Validation: canonical identity equality against CIVA, all 51 atlas cards and geographical selector entries, all 51 Grand Cru rows and all 7 area rows for all 12 grape/blend options, explicit region/search filtering, Bergheim entries, and the compact Riesling-only Kastelberg view. Existing coverage/exclusion/backup tests also pass. This verifies catalogue completeness and display behavior, not an exhaustive certification of every grape/parcel claim.
