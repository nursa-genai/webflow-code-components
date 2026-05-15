const fs = require('fs');
const path = require('path');

const FIRST_PER_LICENSE = 5;
const PUBLIC = path.join(__dirname, '..', 'public');
const INPUT = path.join(PUBLIC, 'searchjobs.json');
const OUT_FULL = path.join(PUBLIC, 'searchjobs.min.json');
const OUT_FIRST = path.join(PUBLIC, 'searchjobs.first.min.json');

const data = JSON.parse(fs.readFileSync(INPUT, 'utf8'));

if (!Array.isArray(data) || data.length === 0) {
  throw new Error('Expected a non-empty array');
}

const keys = Object.keys(data[0]);

function encodeRow(item) {
  return keys.map((k) => {
    const v = item[k];
    if (k === 'pay') {
      return typeof v === 'number' ? Number(v.toFixed(2)) : v;
    }
    return v;
  });
}

const rows = data.map(encodeRow);

// First-N file: take FIRST_PER_LICENSE items per license so the dropdown is
// fully populated on the fast path and the suggestions grid has variety to show
// while the full file is still streaming in.
const perLicense = new Map();
const firstItems = [];
for (const item of data) {
  const count = perLicense.get(item.license) || 0;
  if (count >= FIRST_PER_LICENSE) continue;
  perLicense.set(item.license, count + 1);
  firstItems.push(item);
}
const firstRows = firstItems.map(encodeRow);

fs.writeFileSync(OUT_FULL, JSON.stringify({ k: keys, r: rows }));
fs.writeFileSync(OUT_FIRST, JSON.stringify({ k: keys, r: firstRows }));

const before = fs.statSync(INPUT).size;
const afterFull = fs.statSync(OUT_FULL).size;
const afterFirst = fs.statSync(OUT_FIRST).size;

console.log(`Records: ${data.length}`);
console.log(`Source:        ${(before / 1024).toFixed(2)} KB`);
console.log(
  `Full min:      ${(afterFull / 1024).toFixed(2)} KB  (${(((before - afterFull) / before) * 100).toFixed(1)}% smaller)`,
);
console.log(
  `First-N min:   ${(afterFirst / 1024).toFixed(2)} KB  (${firstItems.length} records, ${perLicense.size} licenses)`,
);
