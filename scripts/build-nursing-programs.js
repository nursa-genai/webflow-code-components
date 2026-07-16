const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');
const CSV_DIR = path.join(PUBLIC, 'nursing-programs-csv');
const OUTPUT = path.join(PUBLIC, 'nursing-programs.json');

// Known nursing-degree slugs. Any slug not listed here is still kept (the
// component falls back to a generic slug->Title formatter), but listing the
// known ones lets the build warn about typos in the source data.
const KNOWN_DEGREES = new Set([
  'bachelor-of-science-nursing',
  'master-of-science-nursing',
  'doctor-of-nursing',
  'post-graduate-aprn',
  'nurse-practitioner-residency',
  'employee-based-entry-to-practice-residency',
  'federally-funded-traineeship-residency',
]);

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(text) {
  // Tolerate Windows line endings + UTF-8 BOM from Google Sheets exports.
  const cleaned = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const lines = cleaned.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return { items: [], skipped: 0, unknownDegrees: [], reason: 'fewer than 2 rows' };

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const nameIdx = headers.indexOf('university name');
  const cityIdx = headers.indexOf('city');
  const stateIdx = headers.indexOf('state');
  const degreesIdx = headers.indexOf('nursing degrees');
  const slugIdx = headers.indexOf('slug');
  if (nameIdx === -1 || cityIdx === -1 || stateIdx === -1 || degreesIdx === -1 || slugIdx === -1) {
    return {
      items: [],
      skipped: 0,
      unknownDegrees: [],
      reason: `missing required header (need "University name, City, State, Nursing Degrees, Slug"; got ${headers.join(', ')})`,
    };
  }

  const items = [];
  const unknownDegrees = new Set();
  let skipped = 0;
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const name = cols[nameIdx] && cols[nameIdx].trim();
    const slug = cols[slugIdx] && cols[slugIdx].trim().toLowerCase();
    const city = ((cols[cityIdx] && cols[cityIdx].trim()) || '').toLowerCase();
    const state = ((cols[stateIdx] && cols[stateIdx].trim()) || '').toLowerCase();
    const degrees = ((cols[degreesIdx] && cols[degreesIdx].trim()) || '')
      .split(';')
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);

    // A program is only useful if we can name it and link it.
    if (!name || !slug) {
      skipped++;
      continue;
    }
    for (const d of degrees) {
      if (!KNOWN_DEGREES.has(d)) unknownDegrees.add(d);
    }
    items.push({ name, slug, city, state, degrees });
  }
  return { items, skipped, unknownDegrees: [...unknownDegrees], reason: null };
}

function main() {
  if (!fs.existsSync(CSV_DIR)) {
    console.error(`CSV directory not found: ${CSV_DIR}`);
    console.error('Create it and drop one or more *.csv files inside.');
    process.exit(1);
  }
  const files = fs
    .readdirSync(CSV_DIR)
    .filter((f) => f.toLowerCase().endsWith('.csv'))
    .sort();

  if (files.length === 0) {
    console.error(`No *.csv files found in ${CSV_DIR}`);
    console.error('Each CSV must have columns: University name, City, State, Nursing Degrees, Slug');
    process.exit(1);
  }

  console.log(`Reading ${files.length} CSV file(s) from public/nursing-programs-csv/`);
  const all = [];
  let totalSkipped = 0;
  const allUnknownDegrees = new Set();
  for (const file of files) {
    const text = fs.readFileSync(path.join(CSV_DIR, file), 'utf8');
    const { items, skipped, unknownDegrees, reason } = parseCsv(text);
    if (reason) {
      console.error(`  ${file}: SKIPPED — ${reason}`);
      continue;
    }
    console.log(`  ${file}: ${items.length} items${skipped ? ` (${skipped} rows skipped)` : ''}`);
    totalSkipped += skipped;
    unknownDegrees.forEach((d) => allUnknownDegrees.add(d));
    all.push(...items);
  }

  // Dedup by slug — the slug is the canonical identity of a program. Keep the
  // first occurrence and union the degrees of any later duplicates so no degree
  // is silently dropped.
  const bySlug = new Map();
  let duplicates = 0;
  for (const item of all) {
    const existing = bySlug.get(item.slug);
    if (!existing) {
      bySlug.set(item.slug, item);
    } else {
      duplicates++;
      const merged = new Set([...existing.degrees, ...item.degrees]);
      existing.degrees = [...merged];
    }
  }
  const deduped = [...bySlug.values()];

  console.log(
    `Total: ${deduped.length} programs` +
      `${totalSkipped ? ` (${totalSkipped} rows skipped)` : ''}` +
      `${duplicates ? ` (${duplicates} duplicate slugs merged)` : ''}`,
  );
  if (allUnknownDegrees.size) {
    console.log(`Note: ${allUnknownDegrees.size} unrecognized degree slug(s): ${[...allUnknownDegrees].join(', ')}`);
    console.log('  (kept — the component will slug-to-title them. Add to KNOWN_DEGREES + DEGREE_LABELS if intentional.)');
  }

  if (deduped.length === 0) {
    console.error('No programs parsed — aborting (not overwriting public/nursing-programs.json).');
    process.exit(1);
  }

  // Deterministic ordering so unchanged data produces unchanged JSON.
  deduped.sort((a, b) => {
    if (a.name !== b.name) return a.name.localeCompare(b.name);
    return a.slug.localeCompare(b.slug);
  });
  for (const item of deduped) item.degrees.sort();

  fs.writeFileSync(OUTPUT, JSON.stringify(deduped, null, 2) + '\n');
  console.log(`Wrote ${OUTPUT}`);
}

main();
