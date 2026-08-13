---
name: update-nursing-programs
description: |
  Run after replacing CSV files in public/nursing-programs-csv/ with fresh exports. Backs up the previous JSON, rebuilds public/nursing-programs.json, regenerates the minified files, summarizes the diff, then on user confirmation commits, pushes to main + master, purges the jsDelivr CDN, and verifies the live URL.
---

# update-nursing-programs

Use this skill after the user has dropped fresh CSV exports into `public/nursing-programs-csv/`. Each CSV must have columns `University name, City, State, Nursing Degrees, Slug`, plus the optional `image` and `Image Alt Tag` columns that drive card thumbnails. Filenames are ignored — the script reads every `*.csv` in that directory and merges them.

`Nursing Degrees` is a single cell holding one or more degree slugs separated by semicolons (e.g. `bachelor-of-science-nursing; master-of-science-nursing`). `City` may be blank. `Slug` is the program's canonical id and the link target; rows without a name or slug are skipped.

Do not invoke this skill if neither `public/nursing-programs-csv/` nor `public/nursing-programs.json` has changed versus `HEAD` — say so and stop.

## Flow

Run steps in order. Stop on any unexpected error and surface it to the user.

### 1. Verify there are CSV changes to publish

Check `git status -- public/nursing-programs-csv/ public/nursing-programs.json`. If nothing in either path differs from `HEAD`, abort with a one-line message: "nursing-programs-csv/ and nursing-programs.json match HEAD — nothing to publish."

If the user only changed CSVs and hasn't rebuilt yet, that's fine — step 2 will produce the new JSON.

### 2. Rebuild nursing-programs.json from the CSVs

```
node scripts/build-nursing-programs.js
```

Capture stdout (per-file item counts + total + skipped-row count + duplicate-slug merges + any unrecognized degree slugs). The script aborts (non-zero exit, no file write) if the total is 0 or the directory is missing/empty.

If a file is skipped because of a header problem, that's a sign the CSV is malformed — surface the message to the user before continuing.

If the script reports unrecognized degree slugs, mention them: they are kept and slug-to-titled by the component, but a new intentional degree type should also be added to `DEGREE_LABELS` in `src/components/NursingPrograms.jsx` (and `KNOWN_DEGREES` in `scripts/build-nursing-programs.js`) for a clean label.

### 3. Verify the rebuild produced a change

After step 2, re-check `git diff --stat public/nursing-programs.json`. If still identical to `HEAD` even after the rebuild, abort: the CSVs were edited but the changes don't affect the resulting JSON (e.g. only whitespace tweaks). Tell the user.

### 4. Back up the previous version

Restore the previous committed version into `public/nursing-programs-old.json`:

```
git show HEAD:public/nursing-programs.json > public/nursing-programs-old.json
```

This file is gitignored (`/public/nursing-programs-old.json` in `.gitignore`) and stays local for manual rollback/verification.

### 5. Regenerate the minified files

```
node scripts/optimize-nursing-programs.js
```

Capture the script's stdout (record count, source size, full minified size + % reduction, first-N file size). You will quote it back in the summary.

The script writes three minified files:
- `public/nursing-programs.min.json` — core dataset (name, slug, city, state, degrees), served as the primary fetch
- `public/nursing-programs.first.min.json` — small priming file (first 20 records) loaded first by the component for fast initial paint; the full file replaces it and gives accurate dropdown counts
- `public/nursing-programs.images.min.json` — slug-to-image-URL map, fetched separately after first paint. Image URLs are ~250 chars of high-entropy hash that gzip cannot compress, so inlining them would make the primary fetch ~6x heavier — keep them out of the core file.

### 6. Show summary and ask for confirmation

Report to the user:

- Per-file item counts (from step 2)
- Total records + any skipped rows + any merged duplicate slugs
- Any unrecognized degree slugs
- Source vs full minified size (and % reduction)
- First-N file size
- Number of records added/removed vs previous commit (parse `HEAD:public/nursing-programs.json` for old count and subtract)
- Image coverage (how many records have an image, how many have an alt tag)
- Files that will be committed: every changed CSV under `public/nursing-programs-csv/`, plus `public/nursing-programs.json`, `public/nursing-programs.min.json`, `public/nursing-programs.first.min.json`, `public/nursing-programs.images.min.json`

Then ask the user: "OK to commit and push to main + master, then purge jsDelivr?"

Do not proceed without an explicit yes.

### 7. Commit and push

Stage the CSV directory and the four JSON files:

```
git add public/nursing-programs-csv/ public/nursing-programs.json public/nursing-programs.min.json public/nursing-programs.first.min.json public/nursing-programs.images.min.json
```

Commit with a message like `Update nursing programs CSV data and regenerate minified files`. Use the project's standard Co-Authored-By trailer.

Push to both branches (the CDN URL points at `@master`; `main` is the default branch):

```
git push origin main
git push origin main:master
```

### 8. Purge jsDelivr

Hit both purge URLs (in parallel) via WebFetch:

- `https://purge.jsdelivr.net/gh/nursa-genai/webflow-code-components@master/public/nursing-programs.min.json`
- `https://purge.jsdelivr.net/gh/nursa-genai/webflow-code-components@master/public/nursing-programs.first.min.json`
- `https://purge.jsdelivr.net/gh/nursa-genai/webflow-code-components@master/public/nursing-programs.images.min.json`

Confirm all three return `"status": "finished"`.

**Important:** purge can race with jsDelivr's branch indexing — if a 404 was cached just before the push completed, the first purge can finish without actually clearing it. After the purge, fetch the full URL once to check (step 9). If it 404s, re-purge once and re-check.

### 9. Verify live

Fetch `https://cdn.jsdelivr.net/gh/nursa-genai/webflow-code-components@master/public/nursing-programs.min.json` via WebFetch and check it returns JSON (not 404). Spot-check the shape: the response should have `k` and `r` keys, `r[0]` should be an array whose length matches `k.length`, and the `degrees` position should be an array.

If 404: re-purge once, re-fetch. If still 404, surface the failure to the user — do not silently move on.

### 10. Final report

One short paragraph:
- Commit SHA pushed
- Record count
- jsDelivr status (verified live / failed)
- Reminder that `public/nursing-programs-old.json` is local-only and can be deleted once the user confirms the update looks good in their app

## Notes and guardrails

- **Never** commit `public/nursing-programs-old.json` — it's gitignored, leave it that way.
- **Never** stage unrelated working-tree changes (e.g. `src/App.js`). Stage CSV files and the four JSON files by path.
- **Never** force-push. If `git push origin main:master` is rejected as non-fast-forward, stop and ask the user — `master` may have diverged.
- If `scripts/build-nursing-programs.js` or `scripts/optimize-nursing-programs.js` throws, do not proceed past that step. Report the error verbatim.
- The CDN URLs are hardcoded in `src/components/NursingPrograms.jsx` at `@master`. If the URLs ever change (different branch, tag, or commit pin), update the purge/verify URLs in this skill to match.
- jsDelivr caches `@master` for ~12h without a purge. The purge step is mandatory if the user wants the update visible immediately.
- Degree display labels live in `DEGREE_LABELS` in `src/components/NursingPrograms.jsx`. State and city labels are derived from the slugs at render time (no map needed). City slugs are expected to end in a 2-letter state abbreviation (e.g. `akron-oh`); the state itself comes from the dedicated `State` column, not the city slug, so a mismatched city suffix won't corrupt the state filter.
- CSV filenames inside `public/nursing-programs-csv/` are not meaningful — the data comes from the row columns. The directory may contain one combined file or several.

- Card thumbnails come from the CMS `image` column. Those assets are full-size (~420 KB each) and Webflow has **not** generated `-p-500` responsive variants for them (those URLs 403), so the component resizes via the `Image Sizing Mode` prop. The `proxy` default uses wsrv.nl, which is free and carries **no SLA** — switch to a paid resizer (Cloudinary/imgix/Bunny) or get the Webflow variants generated before depending on it in production. If the variants ever do exist, flip the prop to `webflow` and the third party drops out entirely.
