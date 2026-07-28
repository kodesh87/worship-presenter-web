/**
 * Smoke: IMAGE_URL_ALLOWLIST + private/localhost blocking (no KJV).
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

const imagesSrc = fs.readFileSync(
  path.join(root, 'src', 'lib', 'images.ts'),
  'utf8'
);
check(
  'images.ts documents allowlist + private block',
  /IMAGE_URL_ALLOWLIST/.test(imagesSrc) && /isBlockedImageHost/.test(imagesSrc)
);
check('no bible/kjv in images.ts', !/tp_bible|kjv|bible_verses/i.test(imagesSrc));

const pptxSrc = fs.readFileSync(path.join(root, 'src', 'lib', 'pptx.ts'), 'utf8');
check('pptx still gates images with isSafeImageUrl', /isSafeImageUrl/.test(pptxSrc));

const runner = `
import { isSafeImageUrl } from ${JSON.stringify(
  pathToFileURL(path.join(root, 'src', 'lib', 'images.ts')).href
)};

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

delete process.env.IMAGE_URL_ALLOWLIST;
assert(isSafeImageUrl('https://cdn.example.com/a.jpg') === true, 'public https ok');
assert(isSafeImageUrl('http://cdn.example.com/a.jpg') === true, 'public http ok');
assert(isSafeImageUrl('ftp://cdn.example.com/a.jpg') === false, 'ftp blocked');
assert(isSafeImageUrl('http://127.0.0.1/a.jpg') === false, 'loopback blocked');
assert(isSafeImageUrl('http://localhost/a.jpg') === false, 'localhost blocked');
assert(isSafeImageUrl('http://192.168.1.1/a.jpg') === false, 'rfc1918 blocked');
assert(isSafeImageUrl('http://10.0.0.5/a.jpg') === false, '10/8 blocked');
assert(isSafeImageUrl('http://169.254.169.254/latest/meta') === false, 'metadata blocked');
assert(isSafeImageUrl('http://[::1]/a.jpg') === false, 'ipv6 loopback blocked');

process.env.IMAGE_URL_ALLOWLIST = 'cdn.example.com, images.bic.local';
assert(isSafeImageUrl('https://cdn.example.com/a.jpg') === true, 'allowlisted ok');
assert(isSafeImageUrl('https://evil.example.com/a.jpg') === false, 'non-allowlisted blocked');
assert(isSafeImageUrl('http://127.0.0.1/a.jpg') === false, 'loopback not on allowlist');

console.log('OK');
`;

const tmp = path.join(root, '.work', 'smoke-image-ssrf-run.mts');
fs.mkdirSync(path.dirname(tmp), { recursive: true });
fs.writeFileSync(tmp, runner);

const r = spawnSync(
  process.execPath,
  [
    '--import',
    pathToFileURL(path.join(root, 'tests', 'register-ts-resolve.mjs')).href,
    '--experimental-strip-types',
    tmp,
  ],
  { encoding: 'utf8', cwd: root }
);
check('runtime allowlist + private IP rules', r.status === 0 && /OK/.test(r.stdout || ''));
if (r.status !== 0) console.error(r.stderr || r.stdout);

try {
  fs.unlinkSync(tmp);
} catch {
  /* ignore */
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll image SSRF smoke checks passed');
