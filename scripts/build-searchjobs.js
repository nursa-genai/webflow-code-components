const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');
const CSV_DIR = path.join(PUBLIC, 'searchjobs-csv');
const OUTPUT = path.join(PUBLIC, 'searchjobs.json');

const LICENSE_CONFIG = {
  rn: { display: 'RN', urlPrefix: '/rn/' },
  qmap: { display: 'QMAP', urlPrefix: '/qmap/' },
  'rn-icu': { display: 'RN ICU', urlPrefix: '/jobs/prn/registered-nurse/rn-icu/' },
  'rn icu': { display: 'RN ICU', urlPrefix: '/jobs/prn/registered-nurse/rn-icu/' },
  cna: { display: 'CNA', urlPrefix: '/cna/' },
  lpn: { display: 'LPN', urlPrefix: '/lpn/' },
  lvn: { display: 'LVN', urlPrefix: '/lvn/' },
  rt: { display: 'RT', urlPrefix: '/rt/' },
  cma: { display: 'CMA', urlPrefix: '/cma/' },
  crma: { display: 'CRMA', urlPrefix: '/crma/' },
  gna: { display: 'GNA', urlPrefix: '/gna/' },
  'ma-c': { display: 'MA-C', urlPrefix: '/ma-c/' },
  cg: { display: 'CG', urlPrefix: '/caregiver/' },
  'cna-med-surg': { display: 'CNA Med Surg', urlPrefix: '/jobs/prn/certified-nursing-assistant/cna-med-surg/' },
  'cna med surg': { display: 'CNA Med Surg', urlPrefix: '/jobs/prn/certified-nursing-assistant/cna-med-surg/' },
  'cna-er': { display: 'CNA ER', urlPrefix: '/jobs/prn/certified-nursing-assistant/cna-er/' },
  'cna er': { display: 'CNA ER', urlPrefix: '/jobs/prn/certified-nurse/cna-er/' },
  'cna-icu': { display: 'CNA ICU', urlPrefix: '/jobs/prn/certified-nursing-assistant/cna-icu/' },
  'cna icu': { display: 'CNA ICU', urlPrefix: '/jobs/prn/certified-nurse/cna-icu/' },
  'rn-med-surg': { display: 'RN Med Surg', urlPrefix: '/jobs/prn/registered-nurse/rn-med-surg/' },
  'rn med surg': { display: 'RN Med Surg', urlPrefix: '/jobs/prn/registered-nurse/rn-med-surg/' },
  'rn-er': { display: 'RN ER', urlPrefix: '/jobs/prn/registered-nurse/rn-er/' },
  'rn er': { display: 'RN ER', urlPrefix: '/jobs/prn/registered-nurse/rn-er/' },
  'rn-tele': { display: 'RN Tele', urlPrefix: '/jobs/prn/registered-nurse/rn-tele/' },
  'rn tele': { display: 'RN Tele', urlPrefix: '/jobs/prn/registered-nurse/rn-tele/' },
};

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
  if (lines.length < 2) return { items: [], skipped: 0, reason: 'fewer than 2 rows' };
  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const nameIdx = headers.indexOf('name');
  const slugIdx = headers.indexOf('slug');
  const payIdx = headers.indexOf('pay');
  const licenseIdx = headers.indexOf('license');
  if (nameIdx === -1 || slugIdx === -1 || payIdx === -1 || licenseIdx === -1) {
    return {
      items: [],
      skipped: 0,
      reason: `missing required header (need name, slug, pay, license; got ${headers.join(', ')})`,
    };
  }
  const items = [];
  let skipped = 0;
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const name = cols[nameIdx] && cols[nameIdx].trim();
    const slug = cols[slugIdx] && cols[slugIdx].trim();
    const pay = parseFloat(cols[payIdx] && cols[payIdx].trim());
    const licenseKey = cols[licenseIdx] && cols[licenseIdx].trim().toLowerCase();
    const config = LICENSE_CONFIG[licenseKey];
    if (name && slug && !isNaN(pay) && config) {
      items.push({ name, slug, pay, license: config.display, urlPrefix: config.urlPrefix });
    } else {
      skipped++;
    }
  }
  return { items, skipped, reason: null };
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
    console.error('Each CSV must have columns: name, slug, pay, license');
    process.exit(1);
  }

  console.log(`Reading ${files.length} CSV file(s) from public/searchjobs-csv/`);
  const all = [];
  let totalSkipped = 0;
  for (const file of files) {
    const text = fs.readFileSync(path.join(CSV_DIR, file), 'utf8');
    const { items, skipped, reason } = parseCsv(text);
    if (reason) {
      console.error(`  ${file}: SKIPPED — ${reason}`);
      continue;
    }
    console.log(`  ${file}: ${items.length} items${skipped ? ` (${skipped} rows skipped)` : ''}`);
    totalSkipped += skipped;
    all.push(...items);
  }

  console.log(`Total: ${all.length} items${totalSkipped ? ` (${totalSkipped} rows skipped across all files)` : ''}`);

  if (all.length === 0) {
    console.error('No items parsed — aborting (not overwriting public/searchjobs.json).');
    process.exit(1);
  }

  // Deterministic ordering so unchanged data produces unchanged JSON.
  all.sort((a, b) => {
    if (a.license !== b.license) return a.license.localeCompare(b.license);
    if (a.name !== b.name) return a.name.localeCompare(b.name);
    return a.slug.localeCompare(b.slug);
  });

  fs.writeFileSync(OUTPUT, JSON.stringify(all, null, 2) + '\n');
  console.log(`Wrote ${OUTPUT}`);
}

main();
