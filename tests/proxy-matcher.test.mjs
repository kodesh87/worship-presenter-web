/**
 * The proxy matcher is the authorization boundary.
 *
 * `tests/auth-revocation.test.mjs` calls `proxy()` directly, which proves the
 * gate refuses a revoked cookie but says nothing about *which requests reach
 * the gate at all* — those tests would still pass with `/api/services` sitting
 * in the exclusion list. A path the matcher misses is served with no session
 * check whatsoever, so every entry in that one regex is pinned here.
 *
 * Next ships a matcher evaluator for exactly this. Note the name: `proxy.md`
 * documents it as `unstable_doesProxyMatch`, but the shipped build of
 * next@16.2.10 only exports `unstable_doesMiddlewareMatch`
 * (`node_modules/next/dist/experimental/testing/server/middleware-testing-utils.d.ts`)
 * — the doc is ahead of the code. It evaluates a `config.matcher` through the
 * same `getMiddlewareMatchers` / `getMiddlewareRouteMatcher` pair the build
 * uses, so this is the real matching logic and not a re-implementation of it.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AsyncLocalStorage } from 'node:async_hooks';
import { register } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Next ships `next/server.js` without an ESM exports map; node needs the
// extension. Chained ahead of the repo's ts-resolve hook, same as
// `tests/auth-revocation.test.mjs`.
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

// The testing entry pulls in Next's request storage, which asserts this global
// exists. Set it before the import, not after.
globalThis.AsyncLocalStorage ??= AsyncLocalStorage;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// `src/proxy.ts` imports the auth stack, which reaches `getDb()`. Nothing here
// runs a query, but point `DB_PATH` at a throwaway file so an accidental open
// can never touch the developer database.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'proxy-matcher-test-'));
process.env.DB_PATH = path.join(tmp, 'test.db');

const { unstable_doesMiddlewareMatch } = await import(
  'next/experimental/testing/server.js'
);
const { config } = await import(
  pathToFileURL(path.join(root, 'src', 'proxy.ts')).href
);

const matches = (url) => unstable_doesMiddlewareMatch({ config, url });

/**
 * Gated: the proxy must run, so an anonymous or revoked cookie is refused.
 * `/api/uploads/*` is on this list on purpose — it serves member photos and is
 * the one asset-shaped route that must never be exempted for speed.
 */
const GATED = [
  '/',
  '/services',
  '/services/1',
  '/services/1/present',
  '/services/1/present/projector',
  '/services/1/slideshow',
  '/services/new',
  '/admin',
  '/admin/artifacts',
  '/announcements',
  '/api/services',
  '/api/services/1',
  '/api/admin/accounts',
  '/api/admin/accounts/1',
  '/api/uploads/x.jpg',
  '/api/uploads/0123456789abcdef0123456789abcdef.jpg',
  '/api/hymns',
  '/api/scripture',
];

/** Exempt: reachable with no session, by design. */
const EXEMPT = [
  '/api/webhook',
  '/api/auth/login',
  '/api/auth/logout',
  '/login',
  '/_next/static/x.js',
  '/_next/static/chunks/main.js',
  '/_next/image',
  '/favicon.ico',
  // public/assets/* — the slide backgrounds. Not sensitive, and gating them
  // put two synchronous SQLite queries in front of every projector background.
  '/assets/welcome-bg.jpg',
];

test('every gated path reaches the proxy', () => {
  for (const url of GATED) {
    assert.equal(
      matches(`http://localhost${url}`),
      true,
      `${url} must be gated — the matcher lets it through unauthenticated`
    );
  }
});

test('every exempt path bypasses the proxy', () => {
  for (const url of EXEMPT) {
    assert.equal(
      matches(`http://localhost${url}`),
      false,
      `${url} must be exempt — gating it breaks sign-in or static delivery`
    );
  }
});

test('a query string does not change whether a path is gated', () => {
  assert.equal(matches('http://localhost/services?tab=all'), true);
  assert.equal(matches('http://localhost/_next/image?url=%2Fassets%2Fx.jpg&w=64&q=75'), false);
  assert.equal(matches('http://localhost/login?next=%2Fservices'), false);
});

test('exclusions are anchored, so a prefix cannot be widened by accident', () => {
  // Each of these only *starts* like an exempt path. A bare `_next/static`
  // prefix would exempt `/_next/staticfoo`; `login` would exempt `/logins`.
  for (const url of [
    '/_next/staticfoo',
    '/_next/imagefoo',
    '/loginfoo',
    '/logins',
    '/assetsfoo',
    '/api/webhookfoo',
    '/api/auth/loginfoo',
    '/api/auth/logoutfoo',
    '/favicon.ico.map',
  ]) {
    assert.equal(
      matches(`http://localhost${url}`),
      true,
      `${url} is not an exempt path and must stay gated`
    );
  }
});

test('the exempt list is a prefix rule, not an exact-path rule', () => {
  // Sub-paths of an exempt prefix stay exempt.
  assert.equal(matches('http://localhost/api/webhook/telegram'), false);
  assert.equal(matches('http://localhost/login/'), false);
});
