/**
 * Smoke: section-aware hymn bucketing vs positional fallback.
 * Uses Node strip-types to load src/lib/hymn-sections.ts (no KJV).
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

let failed = 0;
function check(name, cond) {
  if (cond) {
    console.log(`PASS  ${name}`);
  } else {
    console.error(`FAIL  ${name}`);
    failed += 1;
  }
}

const pptxSrc = fs.readFileSync(path.join(root, 'src', 'lib', 'pptx.ts'), 'utf8');
check(
  'pptx uses bucketHymnsBySection (no hard slice)',
  /bucketHymnsBySection/.test(pptxSrc) && !/hymns\.slice\(0,\s*2\)/.test(pptxSrc)
);

const helperSrc = fs.readFileSync(
  path.join(root, 'src', 'lib', 'hymn-sections.ts'),
  'utf8'
);
check(
  'hymn-sections has fallback slice + section walk',
  /usedFallback/.test(helperSrc) &&
    /BIBLE/.test(helperSrc) &&
    /DIVINE/.test(helperSrc) &&
    /slice\(0,\s*2\)/.test(helperSrc)
);

const helperUrl = pathToFileURL(
  path.join(root, 'src', 'lib', 'hymn-sections.ts')
).href;
const runner = `
import { bucketHymnsBySection } from ${JSON.stringify(helperUrl)};

function hymn(n) {
  return { type: 'hymn', number: n, title: 'H' + n, lyrics: 'x' };
}

const atypical = [
  { type: 'section', title: 'BIBLE TALK (09.30-10.50)' },
  hymn(1), hymn(2), hymn(3),
  { type: 'section', title: 'Break (5m)' },
  { type: 'section', title: 'DIVINE SERVICE (10.50)' },
  hymn(10), hymn(11),
];
const a = bucketHymnsBySection(atypical);
if (a.usedFallback) throw new Error('expected section mode');
if (a.bibleTalkHymns.map((h) => h.number).join(',') !== '1,2,3') {
  throw new Error('BT expected 1,2,3 got ' + a.bibleTalkHymns.map((h) => h.number));
}
if (a.divineServiceHymns.map((h) => h.number).join(',') !== '10,11') {
  throw new Error('DS expected 10,11 got ' + a.divineServiceHymns.map((h) => h.number));
}

const noMarkers = [hymn(1), hymn(2), hymn(3), hymn(4), hymn(5)];
const b = bucketHymnsBySection(noMarkers);
if (!b.usedFallback) throw new Error('expected fallback');
if (b.bibleTalkHymns.map((h) => h.number).join(',') !== '1,2') {
  throw new Error('fallback BT expected 1,2');
}
if (b.divineServiceHymns.map((h) => h.number).join(',') !== '3,4,5') {
  throw new Error('fallback DS expected 3,4,5');
}

console.log('OK');
`;

const tmp = path.join(root, '.work', 'smoke-hymn-sections-run.mts');
fs.mkdirSync(path.dirname(tmp), { recursive: true });
fs.writeFileSync(tmp, runner);

const r = spawnSync(
  process.execPath,
  ['--experimental-strip-types', tmp],
  { encoding: 'utf8', cwd: root }
);
check(
  'section atypical + positional fallback runtime',
  r.status === 0 && /OK/.test(r.stdout || '')
);
if (r.status !== 0) {
  console.error(r.stderr || r.stdout);
}

// no bible/kjv in helper
check(
  'no bible/kjv in hymn-sections',
  !/tp_bible|kjv|bible_verses/i.test(helperSrc)
);

try {
  fs.unlinkSync(tmp);
} catch {
  /* ignore */
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll hymn-section smoke checks passed');
