/**
 * Smoke: theme/verse/family mapping, We Have This Hope lyrics, Special Song omit,
 * structured field PUT. KJV/bible tables are Presenter-only (never in slide-plan/pptx).
 * Requires `npm run build` first. Uses temp SQLite (does not touch data.db).
 */
import { spawn } from 'child_process';
import { createHash } from 'crypto';
import fs from 'fs';
import http from 'http';
import JSZip from 'jszip';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

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

// --- Deck must never call KJV scripture lookup ---
const deckFiles = [
  path.join(root, 'src', 'lib', 'pptx.ts'),
  path.join(root, 'src', 'lib', 'slide-plan.ts'),
];
let deckBibleHit = null;
for (const file of deckFiles) {
  const text = fs.readFileSync(file, 'utf8');
  if (
    /lookupScripture|bible_verses|tp_bible|from ['"]@\/lib\/scripture/i.test(text)
  ) {
    deckBibleHit = file;
    break;
  }
}
check('deck plan/pptx never import KJV scripture lookup', deckBibleHit === null);
if (deckBibleHit) console.error('  found in', path.relative(root, deckBibleHit));

const lyricsSrc = fs.readFileSync(path.join(root, 'src', 'lib', 'lyrics.ts'), 'utf8');
check(
  // Story 20.1 (AC-4/AD-20): resolveWeHaveThisHope is deleted, not migrated —
  // "We Have This Hope" is now two fixed General rows in the registry seed.
  'lyrics has title fuzzy lookup',
  /lookupHymnByTitleFuzzy/.test(lyricsSrc)
);

const planSrc = fs.readFileSync(path.join(root, 'src', 'lib', 'slide-plan.ts'), 'utf8');
const pptxSrc = fs.readFileSync(path.join(root, 'src', 'lib', 'pptx.ts'), 'utf8');
check(
  'slide-plan maps verseReading / familyYouth',
  /verseReading/.test(planSrc) && /familyYouth/.test(planSrc)
);
check(
  // Story 20.1 (AC-2) reorganized presence rules from `if (specialSong) {...}`
  // pushes into a `ROW_HANDLERS` lookup, so the conditional is now a ternary
  // guard on the row handler rather than an `if` statement.
  'slide-plan omits Special Song when empty (conditional divider)',
  /ctx\.specialSong\s*\?/.test(planSrc)
);
check(
  'slide-plan uses section-aware hymn bucketing (Story 6.4)',
  /bucketHymnsBySection/.test(planSrc) && !/hymns\.slice\(0,\s*2\)/.test(planSrc)
);
check(
  'pptx consumes buildSlidePlan',
  /buildSlidePlan/.test(pptxSrc)
);

const editSrc = fs.readFileSync(
  path.join(root, 'src', 'app', 'services', '[id]', 'EditForm.tsx'),
  'utf8'
);
// Epic 14 renamed themeReference → theme fields, familyYouth → split
// family/youth prayer requests, and the raw block label.
check(
  'EditForm has structured fields + raw payload',
  /verseReference/.test(editSrc) &&
    /familyPrayerRequest/.test(editSrc) &&
    /youthPrayerRequest/.test(editSrc) &&
    /sermonSpeaker/.test(editSrc) &&
    /specialSong/.test(editSrc) &&
    /closingPrayerPerson/.test(editSrc) &&
    /Raw Rundown Text/.test(editSrc)
);

// --- HTTP smoke ---
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'deck-smoke-'));
const port = 3600 + Math.floor(Math.random() * 200);
const dbPath = path.join(tmp, 'http.db');
const AUTH_SECRET = createHash('sha256').update(`deck-${Date.now()}`).digest('hex');
const WEBHOOK_SECRET = 'smoke-deck-webhook';
const BOOTSTRAP_USER = 'admin';
const BOOTSTRAP_PASSWORD = 'bootstrap-pass-99';

function fetchRaw(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: opts.method || 'GET',
        headers: opts.headers || {},
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks),
          });
        });
      }
    );
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

function parseSetCookie(header) {
  if (!header) return null;
  const list = Array.isArray(header) ? header : [header];
  for (const c of list) {
    const m = /^auth_session=([^;]+)/.exec(c);
    if (m) return m[1];
  }
  return null;
}

async function waitForServer(base, attempts = 80) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetchRaw(`${base}/login`);
      if (res.status && res.status < 500) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Server did not become ready');
}

async function pptxText(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const parts = [];
  for (const name of Object.keys(zip.files)) {
    if (!/^ppt\/slides\/slide\d+\.xml$/.test(name)) continue;
    parts.push(await zip.files[name].async('string'));
  }
  return parts.join('\n');
}

function decodeXmlText(value) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&amp;/g, '&');
}

/** Decoded visible text runs of the whole deck, one run per line. */
function visibleDeckText(xml) {
  return [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)]
    .map((m) => decodeXmlText(m[1]))
    .join('\n');
}

const rundown = `SABBATH, JULY 18, 2026

BIBLE TALK (09.30-10.50 /80 min)
[  ] Opening song : SDAH #159
Verse Reading: Acts 18:9,10 — And the Lord said to Paul one night in a vision
[  ] Closing Song : SDAH #163
Closing Prayer  : Mr. Damar

DIVINE SERVICE (10.50- 12.05/ 75 min)
Theme Verse: Psalm 100:1 — Make a joyful noise to the Lord, all the earth
[  ] Opening Song : SDAH #83
Special Song : -
Sermon : Timotius Wicaksana "Working Out"
[  ] Closing Song : SDAH #249
Closing Prayer: The Speaker
Family & Youth of the Week: The Wicaksana family — pray for health
`;

const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
const child = spawn(process.execPath, [nextBin, 'start', '-p', String(port)], {
  cwd: root,
  env: {
    ...process.env,
    PORT: String(port),
    DB_PATH: dbPath,
    AUTH_SECRET,
    AUTH_BOOTSTRAP_USER: BOOTSTRAP_USER,
    AUTH_BOOTSTRAP_PASSWORD: BOOTSTRAP_PASSWORD,
    WEBHOOK_SECRET,
    NODE_ENV: 'production',
    // Assert against the committed public seed, not data/local/.
    WPW_USE_SHIPPED_REGISTRY: '1',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let serverLog = '';
child.stdout.on('data', (d) => {
  serverLog += d.toString();
});
child.stderr.on('data', (d) => {
  serverLog += d.toString();
});

const base = `http://127.0.0.1:${port}`;

try {
  await waitForServer(base);

  const login = await fetchRaw(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: BOOTSTRAP_USER,
      password: BOOTSTRAP_PASSWORD,
    }),
  });
  const cookie = parseSetCookie(login.headers['set-cookie']);
  check('auth login still works', login.status === 200 && !!cookie);

  const created = await fetchRaw(`${base}/api/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': WEBHOOK_SECRET,
    },
    body: JSON.stringify({ text: rundown }),
  });
  const createdJson = JSON.parse(created.body.toString('utf8') || '{}');
  const serviceId = createdJson.id ?? createdJson.serviceId ?? createdJson.service?.id;
  check(
    'webhook creates service',
    created.status === 200 || created.status === 201
  );
  check('webhook returns service id', Number.isInteger(serviceId));

  const pptxRes = await fetchRaw(`${base}/api/services/${serviceId}/pptx`, {
    headers: { Cookie: `auth_session=${cookie}` },
  });
  check('pptx download ok', pptxRes.status === 200);
  const xml = await pptxText(pptxRes.body);

  check('theme verse from payload in PPTX', /Psalm 100:1/.test(xml));
  check(
    'theme verse text in PPTX',
    /Make a joyful noise to the Lord/.test(xml)
  );
  check('verse reading reference in PPTX', /Acts 18:9,10/.test(xml));
  check('sermon title in PPTX', /Working Out/.test(xml));
  check('family/youth in PPTX', /Wicaksana family/.test(xml));
  check(
    'We Have This Hope lyrics (not title-only)',
    /hope that burns within our hearts/i.test(xml)
  );
  // --- Standing Part C content ---
  // This copy lives in `data/default-registry.json` and reaches the deck only
  // through registry hydration, so assert the rendered words. Grepping
  // slide-plan.ts for slide ids proved nothing: the ids are emitted whether or
  // not the templates carry any content at all.
  const deckText = visibleDeckText(xml);

  // The Divine Service sequence slide legitimately prints "Special Song" as one
  // line of the printed order of service, so the standalone slide is detected by
  // a second occurrence rather than by any occurrence at all.
  check(
    'no Special Song divider when empty/-',
    (deckText.match(/Special Song/gi) ?? []).length === 1
  );
  check(
    'Part C offering & tithe bank copy rendered from the registry',
    deckText.includes('Offering & Tithe') &&
      deckText.includes('Bank Mandiri') &&
      deckText.includes('1234567890123') &&
      deckText.includes('Gereja Masehi Advent Hari Ketujuh BIC')
  );
  check(
    'Part C midweek prayer copy rendered from the registry',
    deckText.includes('Midweek Prayer Meeting') &&
      /prayer and fellowship/i.test(deckText)
  );
  // Fellowship Etiquette is deliberately the one Part C slide with no registry
  // text. Both source decks author that sentence as shape #0 with a full-bleed
  // picture as shape #1, so PowerPoint paints the picture over it and the words
  // are never visible; `fellowship-bg.png` already carries the identical
  // sentence in its pixels. Our renderer gives text a higher zIndex than
  // pictures, so keeping the element printed the sentence twice. The element was
  // removed, which means the copy must NOT be extractable deck text — if it
  // comes back, the doubling has come back with it.
  check(
    'Part C fellowship etiquette copy comes from the plate, not a text element',
    !/Return used plates/i.test(deckText) &&
      !/finish your water/i.test(deckText)
  );
  check(
    'Part C contact copy rendered from the registry',
    /For more information/i.test(deckText) &&
      /example\.org\/contact/.test(deckText)
  );

  const listRes = await fetchRaw(`${base}/api/services`, {
    headers: { Cookie: `auth_session=${cookie}` },
  });
  const listJson = JSON.parse(listRes.body.toString('utf8') || '{}');
  const listed = (listJson.services || []).find((s) => s.id === serviceId);
  check('GET /api/services lists created service', listRes.status === 200 && !!listed);
  const updatedAt = listed?.updated_at;
  check('service has updated_at', typeof updatedAt === 'string' && updatedAt.length > 0);

  // Structured field edit without full Telegram rewrite
  const patch = await fetchRaw(`${base}/api/services/${serviceId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `auth_session=${cookie}`,
    },
    body: JSON.stringify({
      updated_at: updatedAt,
      fields: {
        themeVerse: {
          reference: 'Isaiah 40:31',
          text: 'But they who wait for the Lord shall renew their strength',
        },
        specialSong: 'Choir — Be Still',
        youthPrayerRequest: 'Tirta — exam week',
      },
    }),
  });
  check('structured PUT without raw_payload', patch.status === 200);

  const stale = await fetchRaw(`${base}/api/services/${serviceId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `auth_session=${cookie}`,
    },
    body: JSON.stringify({
      updated_at: updatedAt,
      fields: { specialSong: 'Should conflict' },
    }),
  });
  check('stale updated_at returns 409', stale.status === 409);

  const pptx2 = await fetchRaw(`${base}/api/services/${serviceId}/pptx`, {
    headers: { Cookie: `auth_session=${cookie}` },
  });
  const xml2 = await pptxText(pptx2.body);
  check('structured theme update in PPTX', /Isaiah 40:31/.test(xml2));
  // youthPrayerRequest fills the youthText slot (label is separate plate copy).
  check(
    'structured family update in PPTX',
    /Tirta/.test(xml2) && /exam week/.test(xml2)
  );
  check(
    'Special Song divider appears when set',
    /Special Song/i.test(xml2) && /Choir/.test(xml2)
  );

  // Auth gate still on
  const unauthPptx = await fetchRaw(`${base}/api/services/${serviceId}/pptx`);
  check(
    'pptx still requires auth',
    unauthPptx.status === 401 ||
      unauthPptx.status === 307 ||
      unauthPptx.status === 302 ||
      unauthPptx.status === 303
  );
} catch (e) {
  console.error('Smoke error:', e);
  console.error(serverLog.slice(-2000));
  failed += 1;
} finally {
  child.kill('SIGTERM');
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll deck-fidelity smoke checks passed');
