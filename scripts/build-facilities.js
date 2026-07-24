const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');
const CSV_DIR = path.join(PUBLIC, 'facilities-csv');
const OUTPUT = path.join(PUBLIC, 'facilities.json');

// Output keys, in the exact order the existing facilities.json used.
// The component reconstructs records by key name, so order is cosmetic —
// but keeping it stable minimizes diffs.
const OUT_KEYS = ['Name', 'Slug', 'stateCode', 'City', 'Latitude', 'Longitude'];

// Map lowercased CSV headers -> output key. Accepts a couple of common aliases.
const HEADER_MAP = {
  name: 'Name',
  slug: 'Slug',
  statecode: 'stateCode',
  state: 'stateCode',
  city: 'City',
  latitude: 'Latitude',
  lat: 'Latitude',
  longitude: 'Longitude',
  lng: 'Longitude',
  lon: 'Longitude',
};

// stateCode is intentionally NOT required: ~1/3 of real records ship with it
// blank and the component derives it from the City slug's trailing "-xx" at
// runtime. We preserve whatever the CSV has.
const REQUIRED = ['Name', 'Slug', 'City'];

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

function toNumberOrString(raw) {
  if (raw === '' || raw == null) return '';
  const n = Number(raw);
  return Number.isFinite(n) ? n : raw;
}

function parseCsv(text) {
  // Tolerate Windows line endings + UTF-8 BOM from Google Sheets exports.
  const cleaned = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const lines = cleaned.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return { items: [], skipped: 0, reason: 'fewer than 2 rows' };

  const rawHeaders = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const colKey = rawHeaders.map((h) => HEADER_MAP[h] || null);

  // Verify every required output key is covered by some column.
  const covered = new Set(colKey.filter(Boolean));
  const missing = REQUIRED.filter((k) => !covered.has(k));
  if (missing.length) {
    return {
      items: [],
      skipped: 0,
      reason: `missing required column(s): ${missing.join(', ')} (need Name, Slug, City; got headers: ${rawHeaders.join(', ')})`,
    };
  }

  const items = [];
  let skipped = 0;
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const rec = {};
    for (let c = 0; c < colKey.length; c++) {
      const key = colKey[c];
      if (!key) continue;
      rec[key] = (cols[c] || '').trim();
    }
    // Required fields must be non-empty.
    if (REQUIRED.some((k) => !rec[k])) {
      skipped++;
      continue;
    }
    items.push({
      Name: rec.Name,
      Slug: rec.Slug,
      stateCode: rec.stateCode ? rec.stateCode.toUpperCase() : '',
      City: rec.City,
      Latitude: toNumberOrString(rec.Latitude),
      Longitude: toNumberOrString(rec.Longitude),
    });
  }
  return { items, skipped, reason: null };
}

function main() {
  if (!fs.existsSync(CSV_DIR)) {
    console.error(`CSV directory not found: ${CSV_DIR}`);
    console.error('Create it and drop one or more *.csv files inside.');
    console.error('Each CSV must have columns: Name, Slug, stateCode, City, Latitude, Longitude');
    process.exit(1);
  }

  const files = fs
    .readdirSync(CSV_DIR)
    .filter((f) => f.toLowerCase().endsWith('.csv'))
    .sort();

  if (files.length === 0) {
    console.error(`No *.csv files found in ${CSV_DIR}`);
    console.error('Each CSV must have columns: Name, Slug, stateCode, City, Latitude, Longitude');
    process.exit(1);
  }

  console.log(`Reading ${files.length} CSV file(s) from public/facilities-csv/`);
  const all = [];
  let totalSkipped = 0;
  for (const file of files) {
    const text = fs.readFileSync(path.join(CSV_DIR, file), 'utf8');
    const { items, skipped, reason } = parseCsv(text);
    if (reason) {
      console.error(`  ${file}: SKIPPED — ${reason}`);
      continue;
    }
    console.log(`  ${file}: ${items.length} records${skipped ? ` (${skipped} rows skipped)` : ''}`);
    totalSkipped += skipped;
    all.push(...items);
  }

  // Dedup by Slug (slugs are unique keys); keep first occurrence.
  const seen = new Set();
  const deduped = [];
  let dupes = 0;
  for (const item of all) {
    if (seen.has(item.Slug)) {
      dupes++;
      continue;
    }
    seen.add(item.Slug);
    deduped.push(item);
  }

  console.log(
    `Total: ${deduped.length} records` +
      (totalSkipped ? ` (${totalSkipped} rows skipped across all files)` : '') +
      (dupes ? ` (${dupes} duplicate slugs dropped)` : '')
  );

  if (deduped.length === 0) {
    console.error('No records parsed — aborting (not overwriting public/facilities.json).');
    process.exit(1);
  }

  // Deterministic ordering so an unchanged CSV produces an unchanged JSON.
  deduped.sort((a, b) => a.Slug.localeCompare(b.Slug));

  // Re-key each record into the canonical OUT_KEYS order.
  const ordered = deduped.map((item) => {
    const out = {};
    for (const k of OUT_KEYS) out[k] = item[k];
    return out;
  });

  fs.writeFileSync(OUTPUT, JSON.stringify(ordered, null, 2) + '\n');
  console.log(`Wrote ${OUTPUT}`);
}

main();
