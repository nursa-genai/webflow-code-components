---
name: update-facilities
description: |
  Run after dropping a fresh facilities CSV into public/facilities-csv/. Rebuilds public/facilities.json from the CSV(s), backs up the previous JSON, regenerates the two minified files, summarizes the diff, then on user confirmation commits, pushes to main + master, purges the jsDelivr CDN, and verifies the live URL.
---

# update-facilities

Use this skill after the user has dropped fresh CSV export(s) into `public/facilities-csv/`. Each CSV must have a header row with columns `Name, Slug, stateCode, City, Latitude, Longitude` (case-insensitive; `State` is accepted for `stateCode`, and `lat`/`lng` for the coordinates). Filenames are ignored — the script reads every `*.csv` in that directory and merges them.

Do not invoke this skill if neither `public/facilities-csv/` nor `public/facilities.json` has changed versus `HEAD` — say so and stop.

**Legacy path:** if the user hand-edited `public/facilities.json` directly and there is no CSV to rebuild from, skip steps 2–3 and start at step 4 (backup). Only do this when `public/facilities-csv/` has no `*.csv` files.

## Flow

Run steps in order. Stop on any unexpected error and surface it to the user.

### 1. Verify there is a change to publish

Check `git status -- public/facilities-csv/ public/facilities.json`. If nothing in either path differs from `HEAD`, abort with a one-line message: "facilities-csv/ and facilities.json match HEAD — nothing to publish."

If the user only changed CSVs and hasn't rebuilt yet, that's fine — step 2 will produce the new JSON.

### 2. Rebuild facilities.json from the CSVs

```
node scripts/build-facilities.js
```

Capture stdout (per-file record counts + total, plus any skipped-row and duplicate-slug counts). The script aborts (non-zero exit, no file write) if the total is 0 or the directory is missing/empty.

What the build does:
- Reads every `*.csv` in `public/facilities-csv/`, matching columns by header name.
- Skips rows missing `Name`, `Slug`, or `City`. `stateCode` is intentionally optional — ~1/3 of real records ship with it blank, and the component derives it from the `City` slug's trailing `-xx` at runtime. Don't treat blank `stateCode` as an error.
- Drops duplicate `Slug` values (first wins).
- Sorts by `Slug` so an unchanged CSV yields an unchanged JSON.
- Trims whitespace from every field (this can produce small diffs like a stray leading space removed from a `Name`).

If a file is skipped for a header problem, or the skipped/duplicate counts are surprisingly high, surface the message to the user before continuing — it usually means a malformed or misaligned CSV.

### 3. Verify the rebuild produced a change

After step 2, re-check `git diff --stat public/facilities.json`. If still identical to `HEAD` even after the rebuild, abort: the CSVs were edited but the changes don't affect the resulting JSON (e.g. only whitespace tweaks that trim away). Tell the user.

Note: because the build sorts by `Slug`, the **first** run of this new pipeline may reorder every record versus the old hand-maintained JSON — a large but harmless diff. Mention this to the user if the diff looks huge but the record count is unchanged.

### 4. Back up the previous version

Restore the previous committed version into `public/facilities-old.json`:

```
git show HEAD:public/facilities.json > public/facilities-old.json
```

This file is gitignored (`/public/facilities-old.json` in `.gitignore`) and stays local for manual rollback/verification.

### 5. Regenerate minified files

```
node scripts/optimize-json.js
```

Capture the script's stdout (record count, source size, full minified size, first-N size). You will quote it back in the summary.

The script writes two minified files:
- `public/facilities.min.json` — full dataset, served as the primary fetch
- `public/facilities.first.min.json` — small priming file (first 20 records) loaded first by the component for fast initial paint

### 6. Show summary and ask for confirmation

Report to the user:

- Per-file record counts (from step 2)
- Total records + any skipped rows or dropped duplicate slugs
- Source vs full minified size (and % reduction)
- First-N file size
- Number of records added/removed vs the previous commit (parse `HEAD:public/facilities.json` for the old count and subtract)
- Files that will be committed: every changed CSV under `public/facilities-csv/`, plus `public/facilities.json`, `public/facilities.min.json`, `public/facilities.first.min.json` (and `.gitignore` only if it has unrelated changes — do not stage anything else)

Then ask the user: "OK to commit and push to main + master, then purge jsDelivr?"

Do not proceed without an explicit yes.

### 7. Commit and push

Stage the CSV directory and the three JSON files:

```
git add public/facilities-csv/ public/facilities.json public/facilities.min.json public/facilities.first.min.json
```

Commit with a message like `Update facilities CSV data and regenerate minified files`. Use the project's standard Co-Authored-By trailer.

Push to both branches (the CDN URL points at `@master`; `main` is the default branch):

```
git push origin main
git push origin main:master
```

### 8. Purge jsDelivr

Hit both purge URLs (in parallel) via WebFetch:

- `https://purge.jsdelivr.net/gh/nursa-genai/webflow-code-components@master/public/facilities.min.json`
- `https://purge.jsdelivr.net/gh/nursa-genai/webflow-code-components@master/public/facilities.first.min.json`

Confirm both return `"status": "finished"`.

**Important:** purge can race with jsDelivr's branch indexing — if a 404 was cached just before the push completed, the first purge can finish without actually clearing it. After the purge, fetch the full URL once to check (step 9). If it 404s, re-purge once and re-check.

### 9. Verify live

Fetch `https://cdn.jsdelivr.net/gh/nursa-genai/webflow-code-components@master/public/facilities.min.json` via WebFetch and check it returns JSON (not 404). Spot-check the shape: the response should have `k` and `r` keys, and `r[0]` should be an array whose length matches `k.length`.

If 404: re-purge once, re-fetch. If still 404, surface the failure to the user — do not silently move on.

### 10. Final report

One short paragraph:
- Commit SHA pushed
- Record count
- jsDelivr status (verified live / failed)
- Reminder that `public/facilities-old.json` is local-only and can be deleted once the user confirms the update looks good in their app

## Notes and guardrails

- **Never** commit `public/facilities-old.json` — it's gitignored, leave it that way.
- **Never** stage unrelated working-tree changes (e.g. `src/App.js`). Stage the CSV directory and the three JSON files by path.
- **Never** force-push. If `git push origin main:master` is rejected as non-fast-forward, stop and ask the user — `master` may have diverged.
- If `scripts/build-facilities.js` or `scripts/optimize-json.js` throws, do not proceed past that step. Report the error verbatim.
- The CDN URLs are hardcoded in `src/components/FacilitiesList.jsx` at `@master`. If the URLs ever change (different branch, tag, or commit pin), update the purge/verify URLs in this skill to match.
- jsDelivr caches `@master` for ~12h without a purge. The purge step is mandatory if the user wants the update visible immediately.
- The build reads by column **header name**, not position, so column order in the CSV doesn't matter. Required columns are `Name, Slug, City`; `stateCode`, `Latitude`, `Longitude` are optional and preserved when present. Coordinates are parsed to numbers (the component doesn't read them; this just keeps them clean).
- `public/facilities-csv/README.md` documents the CSV format for the user and is ignored by the build (only `*.csv` files are read).
