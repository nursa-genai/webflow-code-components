const fs = require('fs');
const path = require('path');

const FIRST_COUNT = 18;
const PUBLIC = path.join(__dirname, '..', 'public');
const INPUT = path.join(PUBLIC, 'nursing-programs.json');
const OUT_FULL = path.join(PUBLIC, 'nursing-programs.min.json');
const OUT_FIRST = path.join(PUBLIC, 'nursing-programs.first.min.json');
const OUT_IMAGES = path.join(PUBLIC, 'nursing-programs.images.min.json');

// Fields every card needs to render, filter, and sort. Image URLs are
// deliberately NOT here: they are ~250 chars of high-entropy hash each, which
// gzip cannot compress, and inlining them makes the primary fetch ~6x heavier.
// They ship in a separate file the component merges in after first paint.
const CORE_KEYS = ['name', 'slug', 'city', 'state', 'degrees'];
const IMAGE_KEYS = ['slug', 'image', 'imageAlt'];

const data = JSON.parse(fs.readFileSync(INPUT, 'utf8'));

if (!Array.isArray(data) || data.length === 0) {
  throw new Error('Expected a non-empty array');
}

const pack = (items, keys) => ({
  k: keys,
  r: items.map((item) => keys.map((k) => item[k])),
});

fs.writeFileSync(OUT_FULL, JSON.stringify(pack(data, CORE_KEYS)));
// First-N file: a small slice for instant first paint. The component swaps in
// the full dataset (accurate dropdown counts) as soon as it arrives.
fs.writeFileSync(OUT_FIRST, JSON.stringify(pack(data.slice(0, FIRST_COUNT), CORE_KEYS)));

const withImages = data.filter((item) => item.image);
fs.writeFileSync(OUT_IMAGES, JSON.stringify(pack(withImages, IMAGE_KEYS)));

const kb = (p) => (fs.statSync(p).size / 1024).toFixed(2);
const before = fs.statSync(INPUT).size;
const afterFull = fs.statSync(OUT_FULL).size;

console.log(`Records: ${data.length}`);
console.log(`Source:          ${(before / 1024).toFixed(2)} KB`);
console.log(
  `Full minified:   ${kb(OUT_FULL)} KB  (${(((before - afterFull) / before) * 100).toFixed(1)}% smaller)`,
);
console.log(`First ${FIRST_COUNT} records: ${kb(OUT_FIRST)} KB`);
console.log(`Images (${withImages.length} of ${data.length}): ${kb(OUT_IMAGES)} KB  — fetched separately, after first paint`);
