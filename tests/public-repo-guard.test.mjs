/**
 * Guard for a public repository.
 *
 * This project began as a private tool for one congregation. Its history held
 * real member names, photographs of identifiable minors, private message
 * screenshots, and a scannable tithe QR code — none of which anyone consented
 * to publish. The public repository starts from a clean tree, and this test is
 * what keeps it clean.
 *
 * Instructions in AGENTS.md are the weakest layer, `.gitignore` the middle one.
 * This is the layer that fails a build, which is the only kind anyone notices.
 *
 * Every check runs against files **tracked by git**, not the working tree: a
 * congregation's own data is expected to sit on disk under `data/local/` and
 * `data/uploads/`. The question is never "is it here" but "is it committed".
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function trackedFiles() {
  try {
    return execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return null; // not a git checkout (a tarball, say) — the checks below skip
  }
}

/** Directories whose contents are a congregation's own material. */
const FORBIDDEN_DIRS = [
  'data/local/',
  'data/uploads/',
  'slides/',
  'slides-all/',
  'slides-new/',
];

/** Images belong to the shipped slide plates and nowhere else. */
const IMAGE_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.bmp',
  '.tiff',
]);
const IMAGE_ALLOWED_PREFIXES = ['public/'];

/**
 * Fingerprints of strings that must never be committed — a payment account in
 * both the spaced and unspaced forms it appeared in, private shortlinks, a
 * production hostname — and of the real people named in the original private
 * repository.
 *
 * Stored as truncated SHA-256 rather than as text, because a guard that lists
 * the data it protects publishes it. The first version of this file did exactly
 * that: the account number and five real surnames sat in plain sight inside the
 * very test meant to keep them out.
 *
 * To add a value without writing it here in the clear:
 *
 *   node -e "console.log(require('crypto').createHash('sha256')
 *     .update(process.argv[1]).digest('hex').slice(0,16))" "<value>"
 */
const FORBIDDEN_LITERAL_HASHES = new Set([
  'f4f7eac32cacf04c',
  'cf8162bdf4210d9f',
  '2cdf59be1c876367',
  '5a6748f938190054',
  'a23caf25463f1cb4',
]);

/**
 * Same, for whole words. Hashed lowercased.
 *
 * The last three were added 2026-07-29, after an implementation-readiness audit
 * found real people still named in the planning artifacts that the public-repo
 * sanitisation pass (commit 1ced308) had missed: the volunteer who built the deck
 * by hand, and two predecessors who had held the job before him — one of them by
 * full name. They were named as actual role-holders in the brief, its memlog and
 * addendum, the PRD, and the pressure-test findings. All are now replaced with
 * invented names.
 *
 * A fourth word from that group is deliberately NOT listed: the given name of one
 * predecessor is also a book of the Bible, and this is a worship application whose
 * fixtures and scripture corpus legitimately contain it. Blocking it would fire on
 * real content and train someone to weaken this guard. The surname is what made
 * that person identifiable, and the surname is blocked.
 *
 * The ten after those were added later the same day, when the sweep was widened
 * from the planning artifacts to the whole tracked tree. The 2026-07-29 audit had
 * looked at `_bmad-output/**`; the names were also sitting in the *working*
 * artifacts, where they are easier to mistake for test data:
 *
 *   - `data/asset-map.json` slide 56 — the worst of them. That file is generated
 *     from the real source deck and its `evidence` field is documented as "the
 *     source slide's own text runs", so it carried a family surname, three given
 *     names AND their prayer request verbatim. `deferred-work.md` already referred
 *     to the same slide as "TheExampleFamily(...)", so the reference had been
 *     sanitised while the generated file it described had not.
 *   - `tests/fixtures/sample-rundown.txt` — seven role-holders. The file reproduces
 *     every quirk NFR-5 calls "the real semi-structured format", which is what a
 *     rundown that was actually used looks like.
 *   - `docs/QUICKSTART.md`, `docs/picoclaw-webhook.md` — the same cast, one named
 *     as `Pdt.` (an ordained pastor, so a title that points at one person).
 *   - `scripts/smoke-deck-fidelity.mjs`, `tests/parser.test.mjs`,
 *     `tests/pptx-content.test.mjs` — the same names, some inside `assert.equal`.
 *
 * All are now invented names. Note what this list still cannot do: re-running
 * `scripts/extract-pptx-assets.mjs build-map` against the real deck regenerates
 * `asset-map.json` with the real text runs, and the guard catches that only because
 * these particular names are now known. It will not catch the next family.
 *
 * Three words from this group are deliberately NOT listed, for the same reason as
 * the Bible-book name above:
 *   - one given name is a word in 182 hymns in `data/hymns.json` and in the title
 *     "Amazing Grace";
 *   - one is a figure in the Bible;
 *   - one is a first name in an invented brainstorming cast under `_bmad-output/`,
 *     alongside three other invented personas, and is not a congregation member.
 * In each case the surname is what identified the person, and the surname is blocked.
 */
const FORBIDDEN_NAME_HASHES = new Set([
  'c54262408caa0d45',
  'a87de5b443469841',
  'a2dd2d405bac0a84',
  '12e9b279a363b095',
  '7da24c28cba89a30',
  '692a0b8721a3f704',
  '65c3f75641b22925',
  '931f22c9283e090b',
  '44554623ac571276',
  '2da866399f105840',
  '7c60939f1ca7243e',
  'c3b454249c0b91a2',
  '7814459b3f23f455',
  '848484decf61671f',
  'd129312e995b5317',
  '6bc161ef5ce65309',
  '0f20b5a458ac66a2',
  'c0dfb0bc178c4b94',
  'e87f468fb9123488',
]);

function fingerprint(value) {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.json',
  '.md',
  '.txt',
  '.yaml',
  '.yml',
  '.css',
  '.html',
  '.ps1',
  '.example',
]);

const DIGIT_RUN = /[0-9][0-9 ]{9,}[0-9]/g;
const LINKISH = /[A-Za-z0-9.]+\/[A-Za-z0-9-]+|[a-z0-9-]+(?:\.[a-z0-9-]+){2,}/g;
const WORDS = /[A-Za-z][a-z]{3,}/g;

/**
 * A name can arrive glued to its neighbours and carrying a plural — a family
 * line in the source deck read as "TheSurnames(...)'s Family", one token with no
 * spaces. The first version of this guard hashed each word exactly as written
 * and let that through. Each candidate is therefore also tested with a trailing
 * "s" removed.
 */
function candidateForms(word) {
  const lower = word.toLowerCase();
  const forms = new Set([lower]);
  if (lower.endsWith('s')) forms.add(lower.slice(0, -1));
  return forms;
}

test('no congregation directory is tracked', () => {
  const tracked = trackedFiles();
  if (tracked === null) return;
  const offenders = tracked.filter((file) =>
    FORBIDDEN_DIRS.some((dir) => file.startsWith(dir))
  );
  assert.deepEqual(
    offenders,
    [],
    `these belong to a congregation, not to a public repository:\n  ${offenders.join('\n  ')}`
  );
});

test('no source presentation deck is tracked', () => {
  const tracked = trackedFiles();
  if (tracked === null) return;
  const offenders = tracked.filter((file) => /\.pptx?$|\.potx$/i.test(file));
  assert.deepEqual(
    offenders,
    [],
    `source decks are extraction inputs, never committed:\n  ${offenders.join('\n  ')}`
  );
});

test('images are tracked only under public/', () => {
  const tracked = trackedFiles();
  if (tracked === null) return;
  const offenders = tracked.filter((file) => {
    if (!IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase())) return false;
    return !IMAGE_ALLOWED_PREFIXES.some((prefix) => file.startsWith(prefix));
  });
  assert.deepEqual(
    offenders,
    [],
    `an image outside public/ is almost always someone's photograph:\n  ${offenders.join('\n  ')}`
  );
});

test('no private literal or real name is committed', () => {
  const tracked = trackedFiles();
  if (tracked === null) return;
  const offenders = [];

  for (const file of tracked) {
    if (!TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())) continue;
    const full = path.join(root, file);
    if (!fs.existsSync(full)) continue;

    let text;
    try {
      text = fs.readFileSync(full, 'utf8');
    } catch {
      // A file that cannot be read is a gap, not a pass. Say so.
      offenders.push(`${file}: unreadable, so it was not checked`);
      continue;
    }

    for (const candidate of text.match(DIGIT_RUN) ?? []) {
      if (FORBIDDEN_LITERAL_HASHES.has(fingerprint(candidate.trim()))) {
        offenders.push(`${file}: a forbidden account number`);
      }
    }
    for (const candidate of text.match(LINKISH) ?? []) {
      if (FORBIDDEN_LITERAL_HASHES.has(fingerprint(candidate))) {
        offenders.push(`${file}: a forbidden private link or hostname`);
      }
    }
    for (const candidate of text.match(WORDS) ?? []) {
      for (const form of candidateForms(candidate)) {
        if (FORBIDDEN_NAME_HASHES.has(fingerprint(form))) {
          offenders.push(`${file}: a real person's name`);
        }
      }
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `private data reached a tracked file:\n  ${[...new Set(offenders)].join('\n  ')}`
  );
});
