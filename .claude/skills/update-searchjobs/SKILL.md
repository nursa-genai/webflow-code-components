---
name: update-searchjobs
description: |
  Run after replacing CSV files in public/searchjobs-csv/ with fresh exports. Backs up the previous JSON, rebuilds public/searchjobs.json, regenerates the minified files, summarizes the diff, then on user confirmation commits, pushes to main + master, purges the jsDelivr CDN, and verifies the live URL.
---

# update-searchjobs

Use this skill after the user has dropped fresh CSV exports into `public/searchjobs-csv/`. Each CSV must have columns `name, slug, pay, license`. Filenames are ignored — the script reads every `*.csv` in that directory and merges them.

Do not invoke this skill if neither `public/searchjobs-csv/` nor `public/searchjobs.json` has changed versus `HEAD` — say so and stop.

## Flow

Run steps in order. Stop on any unexpected error and surface it to the user.

### 1. Verify there are CSV changes to publish

Check `git status -- public/searchjobs-csv/ public/searchjobs.json`. If nothing in either path differs from `HEAD`, abort with a one-line message: "searchjobs-csv/ and searchjobs.json match HEAD — nothing to publish."

If the user only changed CSVs and hasn't rebuilt yet, that's fine — step 2 will produce the new JSON.

### 2. Rebuild searchjobs.json from the CSVs

```
node scripts/build-searchjobs.js
```

Capture stdout (per-file item counts + total + skipped-row count). The script aborts (non-zero exit, no file write) if the total is 0 or the directory is missing/empty.

If any single file is skipped because of a header problem, that's a sign the CSV is malformed — surface the message to the user before continuing.

### 3. Verify the rebuild produced a change

After step 2, re-check `git diff --stat public/searchjobs.json`. If still identical to `HEAD` even after the rebuild, abort: the CSVs were edited but the changes don't affect the resulting JSON (e.g. only whitespace tweaks). Tell the user.

### 4. Back up the previous version

Restore the previous committed version into `public/searchjobs-old.json`:

```
git show HEAD:public/searchjobs.json > public/searchjobs-old.json
```

This file is gitignored (`/public/searchjobs-old.json` in `.gitignore`) and stays local for manual rollback/verification.

### 5. Regenerate the minified files

```
node scripts/optimize-searchjobs.js
```

Capture the script's stdout (record count, source size, full minified size, first-N file size + license count). You will quote it back in the summary.

The script writes two minified files:
- `public/searchjobs.min.json` — full dataset, served as the primary fetch
- `public/searchjobs.first.min.json` — small (~8 KB) priming file with 5 items per license; loaded first by the component for fast initial paint

### 6. Show summary and ask for confirmation

Report to the user:

- Per-file item counts (from step 2)
- Total records + any skipped rows
- Source vs full minified size (and % reduction)
- First-N file size + license count
- Number of records added/removed vs previous commit (parse `HEAD:public/searchjobs.json` for old count and subtract)
- Files that will be committed: every changed CSV under `public/searchjobs-csv/`, plus `public/searchjobs.json`, `public/searchjobs.min.json`, `public/searchjobs.first.min.json`

Then ask the user: "OK to commit and push to main + master, then purge jsDelivr?"

Do not proceed without an explicit yes.

### 7. Commit and push

Stage the CSV directory and the three JSON files:

```
git add public/searchjobs-csv/ public/searchjobs.json public/searchjobs.min.json public/searchjobs.first.min.json
```

Commit with a message like `Update search jobs CSV data and regenerate minified files`. Use the project's standard Co-Authored-By trailer.

Push to both branches (the CDN URL points at `@master`; `main` is the default branch):

```
git push origin main
git push origin main:master
```

### 8. Purge jsDelivr

Hit both purge URLs (in parallel) via WebFetch:

- `https://purge.jsdelivr.net/gh/nursa-genai/webflow-code-components@master/public/searchjobs.min.json`
- `https://purge.jsdelivr.net/gh/nursa-genai/webflow-code-components@master/public/searchjobs.first.min.json`

Confirm both return `"status": "finished"`.

**Important:** purge can race with jsDelivr's branch indexing — if a 404 was cached just before the push completed, the first purge can finish without actually clearing it. After the purge, fetch the full URL once to check (step 9). If it 404s, re-purge once and re-check.

### 9. Verify live

Fetch `https://cdn.jsdelivr.net/gh/nursa-genai/webflow-code-components@master/public/searchjobs.min.json` via WebFetch and check it returns JSON (not 404). Spot-check the shape: the response should have `k` and `r` keys, and `r[0]` should be an array whose length matches `k.length`.

If 404: re-purge once, re-fetch. If still 404, surface the failure to the user — do not silently move on.

### 10. Final report

One short paragraph:
- Commit SHA pushed
- Record count
- jsDelivr status (verified live / failed)
- Reminder that `public/searchjobs-old.json` is local-only and can be deleted once the user confirms the update looks good in their app

## Notes and guardrails

- **Never** commit `public/searchjobs-old.json` — it's gitignored, leave it that way.
- **Never** stage unrelated working-tree changes (e.g. `src/App.js`). Stage CSV files and the three JSON files by path.
- **Never** force-push. If `git push origin main:master` is rejected as non-fast-forward, stop and ask the user — `master` may have diverged.
- If `scripts/build-searchjobs.js` or `scripts/optimize-searchjobs.js` throws, do not proceed past that step. Report the error verbatim.
- The CDN URLs are hardcoded in `src/components/SearchJobs.jsx` at `@master`. If the URLs ever change (different branch, tag, or commit pin), update the purge/verify URLs in this skill to match.
- jsDelivr caches `@master` for ~12h without a purge. The purge step is mandatory if the user wants the update visible immediately.
- The build script strips rows whose license key is not in the LICENSE_CONFIG map (in `scripts/build-searchjobs.js`). If a new license type is added in the source data, update both that map and the matching one in `src/components/SearchJobs.jsx`.
- CSV filenames inside `public/searchjobs-csv/` are not meaningful — the license value comes from each row's `license` column. The directory may contain one file per license, or one combined file, or anything in between.
