---
name: update-facilities
description: |
  Run after replacing public/facilities.json with a new export. Backs up the previous JSON, regenerates the two minified files, summarizes the diff, then on user confirmation commits, pushes to main + master, purges the jsDelivr CDN, and verifies the live URL.
---

# update-facilities

Use this skill when the user has dropped a new `public/facilities.json` into the repo and wants to publish it. Do not invoke this skill if `public/facilities.json` is unchanged versus `HEAD` — say so and stop.

## Flow

Run steps in order. Stop on any unexpected error and surface it to the user.

### 1. Verify there is a change to publish

Check `git status` and `git diff --stat public/facilities.json`. If the file is identical to `HEAD`, abort with a one-line message: "facilities.json matches HEAD — nothing to publish."

### 2. Back up the previous version

Restore the previous committed version into `public/facilities-old.json`:

```
git show HEAD:public/facilities.json > public/facilities-old.json
```

This file is gitignored (`/public/facilities-old.json` in `.gitignore`) and stays local for manual rollback/verification.

### 3. Regenerate minified files

```
node scripts/optimize-json.js
```

Capture the script's stdout (record count, source size, full minified size, first-N size). You will quote it back in the summary.

### 4. Show summary and ask for confirmation

Report to the user:

- Record count from optimize-json
- Source vs full minified size (and % reduction)
- First-N file size
- Number of records added/removed vs previous (compare new record count to the old; old count = lines in `git show HEAD:public/facilities.min.json` parsed, OR diff the keys array — simplest: re-run optimize against `facilities-old.json` in a temp dir if needed, but usually the optimize stdout is enough)
- Names of files that will be committed: `public/facilities.json`, `public/facilities.min.json`, `public/facilities.first.min.json` (and `.gitignore` only if it has unrelated changes — do not stage anything else)

Then ask the user: "OK to commit and push to main + master, then purge jsDelivr?"

Do not proceed without an explicit yes.

### 5. Commit and push

Stage only the three JSON files:

```
git add public/facilities.json public/facilities.min.json public/facilities.first.min.json
```

Commit with a message like `Update facilities data and regenerate minified files`. Use the project's standard Co-Authored-By trailer.

Push to both branches (the CDN URL points at `@master`; `main` is the default branch):

```
git push origin main
git push origin main:master
```

### 6. Purge jsDelivr

Hit both purge URLs (in parallel) via WebFetch:

- `https://purge.jsdelivr.net/gh/nursa-genai/webflow-code-components@master/public/facilities.min.json`
- `https://purge.jsdelivr.net/gh/nursa-genai/webflow-code-components@master/public/facilities.first.min.json`

Confirm both return `"status": "finished"`.

**Important:** purge can race with jsDelivr's branch indexing — if a 404 was cached just before the push completed, the first purge can finish without actually clearing it. After the purge, fetch the full URL once to check (step 7). If it 404s, re-purge once and re-check.

### 7. Verify live

Fetch `https://cdn.jsdelivr.net/gh/nursa-genai/webflow-code-components@master/public/facilities.min.json` via WebFetch and check it returns JSON (not 404). Spot-check that the first record matches what you'd expect from the new data (e.g. compare the first `Name` field to row 0 of the freshly generated `public/facilities.min.json`).

If 404: re-purge once, re-fetch. If still 404, surface the failure to the user — do not silently move on.

### 8. Final report

One short paragraph:
- Commit SHA pushed
- Record count
- jsDelivr status (verified live / failed)
- Reminder that `public/facilities-old.json` is local-only and can be deleted once the user confirms the update looks good in their app

## Notes and guardrails

- **Never** commit `public/facilities-old.json` — it's gitignored, leave it that way.
- **Never** stage unrelated working-tree changes (e.g. `src/App.js`). Stage the three JSON files by name.
- **Never** force-push. If `git push origin main:master` is rejected as non-fast-forward, stop and ask the user — `master` may have diverged.
- If `scripts/optimize-json.js` throws (e.g. malformed JSON, empty array), do not proceed past step 3. Report the error verbatim.
- The CDN URL is hardcoded in `src/components/FacilitiesList.jsx` at `@master`. If the URL ever changes (different branch, tag, or commit pin), update the purge/verify URLs in this skill to match.
- jsDelivr caches `@master` for ~12h without a purge. The purge step is mandatory if the user wants the update visible immediately.
