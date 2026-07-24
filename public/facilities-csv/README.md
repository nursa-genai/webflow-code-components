# facilities-csv

Drop your facilities export(s) here as `*.csv`, then run the **update-facilities** skill.

- Every `*.csv` in this folder is read and merged; filenames don't matter.
- Required columns (header row, case-insensitive): `Name, Slug, stateCode, City, Latitude, Longitude`
  - `State` is accepted as an alias for `stateCode`; `lat`/`lng` for the coordinates.
- Rows missing `Name`, `Slug`, `stateCode`, or `City` are skipped.
- Duplicate `Slug` values are dropped (first wins).
- Records are sorted by `Slug` so an unchanged CSV produces an unchanged `public/facilities.json`.

The skill runs `scripts/build-facilities.js` to produce `public/facilities.json`, then the
existing minify → commit → push → jsDelivr-purge pipeline. Non-`.csv` files here (like this
README) are ignored by the build.
