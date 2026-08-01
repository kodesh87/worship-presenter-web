/**
 * Story 24.1 — UI string catalogue, `ui_locale` setting, and room-facing closure.
 *
 * The resolver and settings coercion are pure/server logic. The admin settings
 * route is exercised for validate-before-write. The projected-tree walk reuses
 * the same roots as `tests/theme-chrome.test.mjs` and asserts no module in that
 * tree imports the catalogue or reads `ui_locale` / `getUiLocale`.
 *
 * `<html lang>` in the root layout is the deliberate exception (AC-10): it
 * follows `ui_locale` on room-facing routes too, but paints no string.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

register(
  'data:text/javascript,' +
    encodeURIComponent(
      `export async function resolve(specifier, context, nextResolve) {
         if (specifier === 'next/server') {
           return nextResolve('next/server.js', context);
         }
         return nextResolve(specifier, context);
       }`
    )
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const repoRoot = root;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-test-'));
const previousDbPath = process.env.DB_PATH;
const previousAuthSecret = process.env.AUTH_SECRET;
process.env.DB_PATH = path.join(tmp, 'test.db');
process.env.AUTH_SECRET = 'i18n-test-secret-0123456789';

const srcUrl = (...parts) => pathToFileURL(path.join(root, 'src', ...parts)).href;

const {
  asUiLocale,
  catalogueKeys,
  missingKeyMarker,
  resolveString,
  UI_LOCALE_ORDER,
} = await import(srcUrl('lib', 'i18n', 'index.ts'));
const {
  setSetting,
  getUiLocale,
  setUiLocale,
  getSlideTransition,
  setSlideTransition,
} = await import(srcUrl('lib', 'settings.ts'));
const { GET, PUT } = await import(
  srcUrl('app', 'api', 'admin', 'settings', 'route.ts')
);
const { createAccount } = await import(srcUrl('lib', 'auth', 'accounts.ts'));
const { POST: loginRoute } = await import(
  srcUrl('app', 'api', 'auth', 'login', 'route.ts')
);
const { SESSION_COOKIE } = await import(srcUrl('lib', 'auth', 'session.ts'));

after(() => {
  if (previousDbPath === undefined) delete process.env.DB_PATH;
  else process.env.DB_PATH = previousDbPath;
  if (previousAuthSecret === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = previousAuthSecret;
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {
    // ignore
  }
});

const SETTINGS_URL = 'http://localhost/api/admin/settings';

const { NextRequest } = await import('next/server');

const ADMIN_PASSWORD = 'pw-ok-99';
let adminToken = null;

async function ensureAdminToken() {
  if (adminToken) return adminToken;
  createAccount({
    username: 'i18n-admin',
    password: ADMIN_PASSWORD,
    role: 'admin',
  });
  const res = await loginRoute(
    new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'i18n-admin', password: ADMIN_PASSWORD }),
    })
  );
  assert.equal(res.status, 200);
  adminToken = res.cookies.get(SESSION_COOKIE)?.value;
  assert.ok(adminToken);
  return adminToken;
}

async function adminRequest(init = {}) {
  const token = await ensureAdminToken();
  const headers = {
    cookie: `${SESSION_COOKIE}=${token}`,
    ...(init.headers ?? {}),
  };
  return new NextRequest(SETTINGS_URL, { ...init, headers });
}

const read = (rel) => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

/** Same roots as `tests/theme-chrome.test.mjs` PROJECTED. */
const PROJECTED = [
  'src/components/SlideView.tsx',
  'src/components/artifacts/ArtifactSlide.tsx',
  'src/app/services/[id]/present/projector/ProjectorClient.tsx',
  'src/app/services/[id]/slideshow/SlideshowClient.tsx',
  'src/app/services/[id]/present/projector/page.tsx',
  'src/app/services/[id]/slideshow/page.tsx',
];

const ROOM_FACING_LIB = ['src/lib/pptx.ts'];

function moduleImports(file) {
  const source = read(file);
  const specifiers = [
    ...[
      ...source.matchAll(
        /\b(?:import|export)\s+(?!type\b)[\s\S]*?\bfrom\s+["']([^"']+)["']/g
      ),
    ].map((m) => m[1]),
    ...[...source.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g)].map(
      (m) => m[1]
    ),
    ...[...source.matchAll(/\bimport\s+["']([^"']+)["']/g)].map((m) => m[1]),
  ];
  const inRepo = specifiers.filter((s) => s.startsWith('.') || s.startsWith('@/'));
  return inRepo.flatMap((specifier) => {
    const base = specifier.startsWith('@/')
      ? `src/${specifier.slice('@/'.length)}`
      : path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));
    const resolved = ['.tsx', '.ts', '/index.tsx', '/index.ts']
      .map((ext) => `${base}${ext}`)
      .find((candidate) => fs.existsSync(path.join(repoRoot, candidate)));
    return resolved ? [resolved] : [];
  });
}

function projectedTree() {
  const seen = new Map(PROJECTED.map((file) => [file, null]));
  const queue = [...PROJECTED];
  while (queue.length > 0) {
    const file = queue.shift();
    for (const resolved of moduleImports(file)) {
      if (seen.has(resolved)) continue;
      seen.set(resolved, file);
      queue.push(resolved);
    }
  }
  return [...seen.keys()];
}

const I18N_IMPORT = /(?:@\/lib\/i18n|lib\/i18n)/;
const UI_LOCALE_READ = /\bgetUiLocale\b/;

test('catalogue key sets match across locales', () => {
  assert.deepEqual(catalogueKeys('en'), catalogueKeys('id'));
  assert.ok(catalogueKeys('en').length > 0);
});

test('resolveString returns catalogue text for a known key', () => {
  assert.equal(
    resolveString('admin.uiLocale.title', 'en'),
    'Interface language'
  );
  assert.equal(
    resolveString('admin.uiLocale.title', 'id'),
    'Bahasa antarmuka'
  );
});

test('asUiLocale coerces junk stored values to en', () => {
  assert.equal(asUiLocale('xx'), 'en');
  assert.equal(asUiLocale(undefined), 'en');
  assert.equal(asUiLocale('id'), 'id');
});

test('getUiLocale coerces a junk settings row and logs', () => {
  setSetting('ui_locale', 'not-a-locale');
  const errors = [];
  const original = console.error;
  console.error = (...args) => errors.push(args.join(' '));
  try {
    assert.equal(getUiLocale(), 'en');
    assert.ok(errors.some((line) => line.includes('ui_locale')));
  } finally {
    console.error = original;
    setSetting('ui_locale', 'en');
  }
});

test('missing key is a visible defect, not blank and not English', () => {
  const marker = resolveString('admin.uiLocale.__missing__', 'id');
  assert.equal(marker, missingKeyMarker('admin.uiLocale.__missing__'));
  assert.ok(marker.includes('admin.uiLocale.__missing__'));
  assert.notEqual(marker, resolveString('admin.uiLocale.title', 'en'));
  assert.notEqual(marker, '');
});

test('setUiLocale rejects unknown locales', () => {
  assert.throws(() => setUiLocale('fr'), /ui_locale must be one of/);
});

test('GET /api/admin/settings includes ui_locale', async () => {
  setUiLocale('id');
  const res = await GET(await adminRequest());
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ui_locale, 'id');
});

test('PUT rejects a body with only unknown fields', async () => {
  const before = getSlideTransition();
  const res = await PUT(
    await adminRequest({
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
  );
  assert.equal(res.status, 400);
  assert.equal(getSlideTransition(), before);
});

test('PUT accepts ui_locale alone', async () => {
  const res = await PUT(
    await adminRequest({
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ui_locale: 'id' }),
    })
  );
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ui_locale, 'id');
  assert.equal(getUiLocale(), 'id');
});

test('PUT rejects an unknown ui_locale before writing anything', async () => {
  setUiLocale('en');
  setSlideTransition('fade');
  const res = await PUT(
    await adminRequest({
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ui_locale: 'fr',
        slide_transition: 'push',
      }),
    })
  );
  assert.equal(res.status, 400);
  assert.equal(getUiLocale(), 'en');
  assert.equal(getSlideTransition(), 'fade');
});

test('PUT error names the accepted ui_locale set', async () => {
  const res = await PUT(
    await adminRequest({
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ui_locale: 'de' }),
    })
  );
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.error, new RegExp(UI_LOCALE_ORDER.join('|')));
});

test('the projected tree does not import the catalogue or call getUiLocale', () => {
  const offenders = [];
  for (const file of projectedTree()) {
    // settings.ts is reachable for slide_transition only; it defines getUiLocale
    // but room-facing code must not call it.
    if (file === 'src/lib/settings.ts') continue;
    const source = read(file);
    if (I18N_IMPORT.test(source)) offenders.push(`${file}: i18n import`);
    if (UI_LOCALE_READ.test(source)) offenders.push(`${file}: getUiLocale call`);
  }
  assert.deepEqual(
    offenders,
    [],
    `room-facing modules must not import the catalogue or call getUiLocale ` +
      `(layout lang is the deliberate exception, not in this tree). ` +
      `Found: ${offenders.join(' | ')}`
  );
});

test('pptx generation does not read ui_locale', () => {
  for (const file of ROOM_FACING_LIB) {
    const source = read(file);
    assert.ok(!I18N_IMPORT.test(source), `${file} must not import i18n`);
    assert.ok(
      !/\bgetUiLocale\b/.test(source),
      `${file} must not call getUiLocale`
    );
  }
});
