const fs = require('fs');
const path = require('path');

const FIRST_COUNT = 20;
const PUBLIC = path.join(__dirname, '..', 'public');
const INPUT = path.join(PUBLIC, 'facilities.json');
const OUT_FULL = path.join(PUBLIC, 'facilities.min.json');
const OUT_FIRST = path.join(PUBLIC, 'facilities.first.min.json');

const data = JSON.parse(fs.readFileSync(INPUT, 'utf8'));

if (!Array.isArray(data) || data.length === 0) {
  throw new Error('Expected a non-empty array');
}

const keys = Object.keys(data[0]);

const rows = data.map((item) =>
  keys.map((k) => {
    const v = item[k];
    if (k === 'Latitude' || k === 'Longitude') {
      return typeof v === 'number' ? Number(v.toFixed(5)) : v;
    }
    return v;
  })
);

fs.writeFileSync(OUT_FULL, JSON.stringify({ k: keys, r: rows }));
fs.writeFileSync(
  OUT_FIRST,
  JSON.stringify({ k: keys, r: rows.slice(0, FIRST_COUNT) })
);

const before = fs.statSync(INPUT).size;
const afterFull = fs.statSync(OUT_FULL).size;
const afterFirst = fs.statSync(OUT_FIRST).size;

console.log(`Records: ${data.length}`);
console.log(`Source:          ${(before / 1024 / 1024).toFixed(2)} MB`);
console.log(`Full minified:   ${(afterFull / 1024 / 1024).toFixed(2)} MB  (${(((before - afterFull) / before) * 100).toFixed(1)}% smaller)`);
console.log(`First ${FIRST_COUNT} records: ${(afterFirst / 1024).toFixed(2)} KB`);
