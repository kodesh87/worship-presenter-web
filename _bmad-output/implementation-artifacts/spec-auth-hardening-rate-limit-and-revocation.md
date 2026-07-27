---
title: 'Auth hardening — login rate limiting and real session revocation'
type: 'feature'
created: '2026-07-26'
status: 'done'
baseline_revision: 'f668b1e2968293c8330467d255d54c8dc41c6569'
final_revision: 'cb6368737a529f1d03d45da8c00e1ad2c2cdd09b'
review_loop_iteration: 0
followup_review_recommended: true
context:
  - '{project-root}/_bmad-output/project-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/deferred-work.md'
warnings: ['multiple-goals']
---

<intent-contract>

## Intent

**Problem:** Two security gaps from `deferred-work.md` are still open. `POST /api/auth/login` has no rate limiting, logging, or lockout of any kind, so an attacker who reaches the hub can guess passwords at full speed. And the session cookie is a self-contained signed token with a 7-day TTL and no server-side record, so logging out or changing a password revokes nothing — a copied cookie keeps working for up to a week. `POST /api/auth/change-password` compounds this by not asking for the current password, so a stolen cookie is enough to take over an account permanently.

**Approach:** Give the session payload a session id and a per-account token version, record revocations in SQLite, and enforce both at the request gate — which is now possible because Next 16's proxy (formerly middleware) runs on the Node.js runtime. Add SQLite-backed attempt tracking to the login route with per-username and per-IP thresholds returning `429` with `Retry-After`, and require the current password before a change.

## Boundaries & Constraints

**Always:**
- Login responses must not reveal whether an account exists. Wrong password, unknown user, and rate-limited all return the same body shape and leak nothing through timing beyond what `authenticate`'s existing dummy-hash comparison already equalizes.
- A successful login clears that username's failure record; failures for one username must never lock out a different one.
- Revocation is enforced wherever a gated request passes, not only in admin routes — a revoked cookie must fail on pages as well as APIs.
- Password change revokes every other session for that account and leaves the caller's own device signed in with a freshly issued cookie.
- Existing signed cookies that predate the payload change are treated as invalid, so everyone signs in once after deploy. That is acceptable and must be stated in the result, not worked around with a compatibility branch that weakens the check.
- Keep the cookie flags (`httpOnly`, `secure` in production, `sameSite: 'lax'`, `path: '/'`) and the 7-day TTL unchanged.
- New tables and columns go through the existing startup `db.exec()` DDL block and the `try/catch` `ALTER TABLE` pattern in `src/lib/db/index.ts`. No ORM, no migration framework.
- better-sqlite3 is synchronous and server-only. Before relying on it inside the proxy, confirm the app actually boots and serves a gated route — a native addon in that bundle is the main technical risk of this change.
- API JSON errors stay `{ error: string }` with an explicit status; log server detail with `console.error` and never leak stacks.
- TypeScript strict, no `any` — including `src/app/api/auth/change-password/route.ts`, which currently has one.
- New tests use `node:test` and are appended to the explicit `package.json` `test` list.
- Read the relevant guide under `node_modules/next/dist/docs/` before changing proxy/middleware or route APIs. Note `proxy.md`: in Next 16 middleware is renamed to Proxy, defaults to the Node.js runtime, and setting `runtime` in a proxy file throws.

**Block If:**
- better-sqlite3 cannot be loaded from the proxy bundle in a production build. Do not fall back to a signature-only check and call revocation done — stop and report, because a revocation that does not run at the gate does not protect the pages.

**Never:**
- No third-party rate-limiter, no Redis, no external store — single-node SQLite only.
- No change to the password hashing scheme, the `accounts` role model, or the `safeNextPath` redirect rules.
- No change to `/api/webhook`, which stays gated by `WEBHOOK_SECRET` alone.
- Do not reorder the Part C announcement slides. That third deferred item is contradicted by the canonical `artifact-catalog.md`, which documents the current order as intended (see Design Notes); it needs a product decision, not code.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid login | correct credentials | `200 { ok: true, role, username }` + cookie carrying `sid` and `tv` | — |
| Wrong password | known user, bad password | `401 { error: 'Invalid username or password' }`, failure recorded | — |
| Unknown user | no such account | Identical `401` body, failure recorded under the submitted name | — |
| Username threshold reached | 5 failures for one username inside the window | `429 { error: … }` + `Retry-After` seconds, no password check performed | Same body whether or not the account exists |
| Rate-limited then correct password | locked window, right credentials | Still `429` until the window passes | — |
| Success resets | 4 failures then a correct login | Failures for that username cleared; next wrong password starts from 1 | — |
| Second username unaffected | user A locked out | User B logs in normally | — |
| IP threshold reached | 20 failures from one client across usernames | `429` + `Retry-After` | — |
| Window expiry | oldest failures older than the window | Attempts count again from the surviving ones | — |
| Logout | valid session | `200 { ok: true }` (or `303` per `Accept`), cookie cleared, `sid` recorded revoked | — |
| Revoked cookie replayed | logged-out cookie sent to an API route | `401 { error: 'Unauthorized' }` | — |
| Revoked cookie replayed on a page | same cookie on `/services` | Redirect to `/login` | — |
| Other device after logout | second cookie, different `sid` | Still valid — logout revokes one session, not all | — |
| Password change | correct current password | `200 { ok: true }`, `token_version` bumped, caller receives a fresh cookie | — |
| Password change, wrong current password | bad current password | `401 { error: … }`, password unchanged, no revocation | — |
| Password change, missing current password | body without it | `400 { error: … }` | — |
| Other sessions after password change | any older cookie for that account | Rejected at the gate | — |
| Session for a deleted account | account row gone | Rejected, as today | — |
| Session after role demotion | cookie role ≠ DB role | Rejected, as today | — |
| Legacy cookie without `sid`/`tv` | pre-deploy cookie | Rejected; user signs in again | — |
| Expired revocation rows | `sid` past its expiry | Pruned; no unbounded growth | — |

</intent-contract>

## Code Map

- `src/lib/auth/session.ts` -- `SESSION_COOKIE = 'auth_session'`, `SESSION_TTL_SECONDS` (7 days), payload `{ uid, role, exp }` signed with HMAC-SHA256 over `AUTH_SECRET`; `signSession`, `verifySession` (returns `null`, never throws), `sessionCookieOptions(maxAge)`. Web Crypto only.
- `src/lib/auth/accounts.ts` -- `accounts(id, username UNIQUE, password_hash, role CHECK admin|operator, created_at)`; `authenticate` (dummy-hash timing equalization, rejects password > 128 first), `getAccountById`, `getAccountByUsername`, `updateAccount` (transactional, last-admin guards), `createAccount`, `deleteAccount`. Errors are thrown `Error`s.
- `src/lib/auth/password.ts` -- `scryptSync` default params, `saltHex$hashHex`, `hashPassword`, `verifyPassword` (timing-safe, false on any parse error).
- `src/lib/auth/require.ts` -- `requireSession(request, role?)` / `requireAdminSession(request)`; re-reads the account, rejects a missing row or a role mismatch, returns a fresh payload. Used **only** by the six `/api/admin/**` routes today.
- `src/middleware.ts:57` -- the single gate for everything else: negative-lookahead matcher exempting `api/webhook`, `api/auth/login`, `api/auth/logout`, `login`, `_next/*`, `favicon.ico`; calls `verifySession` only (signature + expiry, no DB); `401`/redirect for anonymous, `403` for non-admin on `/admin*` and `/api/admin*`.
- `src/app/api/auth/login/route.ts` -- parse, validate, `authenticate`, `signSession`, set cookie; `401 { error: 'Invalid username or password' }` for every credential failure; `503` when `AUTH_SECRET` is missing.
- `src/app/api/auth/logout/route.ts` -- clears the cookie with `maxAge: 0`; `200 { ok: true }` for JSON, else `303` to `/login`. No server-side invalidation.
- `src/app/api/auth/change-password/route.ts` -- `verifySession` directly (no DB re-check), requires `newPassword` ≥ 8, calls `updateAccount`, returns `200 { ok: true }`. No current-password confirmation, no re-issue, `body: any`.
- `src/lib/db/index.ts:84-149` -- one `db.exec()` template holding every `CREATE TABLE IF NOT EXISTS`, followed by `try/catch` `ALTER TABLE` migrations swallowing `/duplicate column/i`, then `upsertHymns`, `seedArtifactRegistry`, `bootstrapAdminIfEmpty`. Tables: `services`, `hymns`, `announcement_items`, `accounts`, `settings`, `bible_books`, `bible_verses`, `artifact_templates`. No index is created anywhere yet.
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md:221-223,774-776` -- Proxy defaults to the Node.js runtime in v16; the `runtime` config option throws if set.
- `tests/services-http.test.mjs:14-52`, `tests/hymns-api.test.mjs:13-40` -- in-process route-handler test convention: a data-URL ESM resolve hook mapping `next/server` → `next/server.js`, temp `DB_PATH` set before importing, `new NextRequest(...)`.
- `tests/auth-http.test.mjs` -- out-of-process: requires a prior `npm run build`, spawns `next start` on a random port with bootstrap env, hand-rolled `fetchRaw` over `node:http` that returns `{ status, body }` and **does not capture headers**.

## Tasks & Acceptance

**Execution:**

- [x] `src/lib/db/index.ts` -- add `login_attempts(id INTEGER PRIMARY KEY, scope TEXT NOT NULL, key TEXT NOT NULL, attempted_at INTEGER NOT NULL)` and `revoked_sessions(sid TEXT PRIMARY KEY, expires_at INTEGER NOT NULL)` to the startup DDL block, an index on `(scope, key, attempted_at)` and one on `revoked_sessions(expires_at)`, and an `ALTER TABLE accounts ADD COLUMN token_version INTEGER NOT NULL DEFAULT 1` following the existing swallow-duplicate pattern.
- [x] `src/lib/auth/session.ts` -- extend the payload with `sid: string` and `tv: number`; `signSession` generates a cryptographically random `sid` when none is supplied; `verifySession` rejects a token missing either field so legacy cookies fail closed.
- [x] `src/lib/auth/rate-limit.ts` -- new: `recordLoginFailure(scope, key)`, `clearLoginFailures(key)`, `checkLoginRateLimit(username, ip)` returning either `{ limited: false }` or `{ limited: true, retryAfterSeconds }`, plus opportunistic pruning of rows older than the window. Thresholds as constants: 5 failures per username and 20 per IP within a 15-minute window.
- [x] `src/lib/auth/client-ip.ts` -- new: derive the client address from `cf-connecting-ip` first (the hub sits behind a Cloudflare Tunnel), then the leftmost `x-forwarded-for` entry, then `x-real-ip`, falling back to a constant when none is present -- documented as best-effort, with per-username limiting as the primary defence.
- [x] `src/lib/auth/revocation.ts` -- new: `revokeSession(sid, expiresAt)`, `isSessionRevoked(sid)`, `pruneExpiredRevocations()`, and `bumpTokenVersion(accountId)` returning the new value.
- [x] `src/lib/auth/require.ts` -- extend the DB re-check to also reject a revoked `sid` and a `tv` that does not match `accounts.token_version`, keeping the existing missing-account and role-mismatch rejections.
- [x] `src/middleware.ts` -- after `verifySession` succeeds, apply the same DB re-check so revocation is enforced at the gate for pages and non-admin APIs; keep the existing `401`-vs-redirect and `403` behaviour byte-identical. Confirm the proxy runs on the Node.js runtime and do not set a `runtime` export.
- [x] `src/app/api/auth/login/route.ts` -- check the rate limit before touching credentials, return `429 { error }` with `Retry-After` when limited, record a failure on every credential rejection, and clear that username's failures on success. The `429` body must be identical whether or not the account exists.
- [x] `src/app/api/auth/logout/route.ts` -- record the current `sid` as revoked until its `exp` before clearing the cookie; keep the `Accept`-based `200`/`303` behaviour.
- [x] `src/app/api/auth/change-password/route.ts` -- require `currentPassword` and verify it, bump `token_version`, issue a fresh cookie for the caller, drop the `any`, and keep the existing error bodies for the cases that already exist.
- [x] Change-password UI -- add the current-password field to whichever surface posts to that route, matching the existing shadcn/Tailwind form conventions.
- [x] `tests/auth-rate-limit.test.mjs` -- new: cover the rate-limiting rows of the I/O matrix against a temp DB, including per-username isolation, IP threshold, window expiry, success reset, and identical responses for known and unknown accounts.
- [x] `tests/auth-revocation.test.mjs` -- new: cover logout revoking one session and not the others, password change revoking all but the caller's fresh cookie, legacy payloads failing closed, and expired revocation rows being pruned.
- [x] `package.json` -- append both new test files to the explicit `test` list.
- [x] `_bmad-output/implementation-artifacts/deferred-work.md` -- mark the two closed items as resolved and record the Part C ordering item as blocked on a product decision, with the `artifact-catalog.md` evidence.

**Acceptance Criteria:**
- Given five consecutive failed logins for one username, when a sixth is attempted, then the response is `429` with a `Retry-After` header and no password comparison is performed; and a different username still logs in normally.
- Given a rate-limited username, when the window elapses, then a correct password logs in successfully.
- Given a user logs out, when their old cookie is replayed against an API route and against a page, then the API returns `401` and the page redirects to `/login`.
- Given a user is signed in on two devices, when they log out on one, then the other stays signed in.
- Given a user changes their password with the correct current password, when any older cookie for that account is replayed, then it is rejected, while the caller's own browser stays signed in.
- Given a password-change request without the correct current password, when it is submitted, then the password is unchanged and no session is revoked.
- Given `npm test`, `npm run build` and `npx tsc --noEmit`, when they run, then all pass; and the built app serves a gated route with the proxy performing the DB re-check.

## Spec Change Log

### 2026-07-26 - Review pass 1

**Triggering finding:** the per-username lockout was weaponizable. `USERNAME_FAILURE_THRESHOLD = 5` counted failures for a username globally and the login route returned 429 before checking the password, so an attacker who knew the admin username could send six wrong passwords every 15 minutes - one request per 2.5 minutes, from any address - and the admin could never sign in again. The ledger cleared only on a successful login, which was unreachable while locked, and no unlock path existed short of opening the SQLite file by hand.

**Amended:** the lockout decision is now scoped to the `(username, client-address)` pair (5 failures / 15 min), with the address-only scope retained (20 / 15 min). The global per-username counter was dropped rather than kept as telemetry. `recordLoginFailure` / `clearLoginFailures` / `checkLoginRateLimit` take `(username, ip)`. An operator unlock script was added (`npm run auth:unlock`).

**Known-bad state avoided:** shipping a denial-of-service against the church's own admin account, on a hub that must work at a fixed hour on Sabbath morning, in the name of closing a password-guessing gap.

**Contract impact:** the `<intent-contract>` matrix row "Username threshold reached - 5 failures for one username inside the window" is now satisfied per-address rather than globally, and "A successful login clears that username's failure record" clears the pair plus the whole address bucket. The intent (throttle online guessing without revealing account existence) is unchanged.

**KEEP:** the identical response body for wrong password, unknown user, and rate-limited; the `Retry-After` counted from the oldest surviving attempt; the refusal to count or refuse the shared unknown-address bucket; and the rule that only a value parsing as a real IPv4/IPv6 address is ever used as a rate-limit key.

### 2026-07-26 - Review pass 1 (second entry)

**Triggering finding:** logout failed open. A failed `revokeSession` write was caught, logged, and still answered `{ok:true}` with the cookie cleared, so on a full disk or a `SQLITE_BUSY` past the busy timeout the user was told they were signed out while the token - and any copy of it - stayed valid for up to 7 days. That is exactly what `sid` was introduced to prevent.

**Amended:** logout now fails closed. If the revocation is not recorded it returns `500 { error: 'Logout failed' }` (or a plain-text 500) and does **not** clear the cookie, so the browser stays visibly signed in and the user can retry.

**Known-bad state avoided:** a logout that silently does nothing on the one occasion it matters - when the machine is already unhealthy.

**Contract impact:** adds a failure row the `<intent-contract>` matrix does not list (it names only `200 {ok:true}` / `303`). The success path is unchanged.

**KEEP:** the `Accept`-based `200`/`303` split on success, and `revokeSession` throwing rather than returning quietly, so "did not throw" can be trusted to mean "recorded".


**2026-07-26 — implementation, one deviation from the Code Map.**

The task list names `src/middleware.ts`; the gate now lives at `src/proxy.ts` (function renamed `middleware` → `proxy`, matcher byte-identical). The rename is what makes the DB re-check possible and is not cosmetic: in Next 16 a `middleware.ts` entry is still routed to the **Edge** compiler unless it exports `runtime = 'nodejs'` (`node_modules/next/dist/build/entries.js:235-243` — `isProxyFile` → `onServer()`, `isMiddlewareFile` → `onEdgeServer()` unless `pageRuntime === 'nodejs'`), and only a `proxy.ts` entry is unconditionally a Node.js server entry. The contract forbids a `runtime` export (`proxy.md:221-223`), so the file convention had to move. Verified in the build output: `.next/server/middleware-manifest.json` has an empty `middleware` map (no edge entry) while `.next/server/functions-config-manifest.json` reports `"/_middleware": { "runtime": "nodejs" }`, and `.next/server/middleware.js.nft.json` traces `better-sqlite3/build/Release/better_sqlite3.node`.

Follow-on edits the rename forced: `scripts/smoke-auth.mjs` reads `src/proxy.ts` instead of `src/middleware.ts` (two check labels renamed with it), and the stale "Session required (middleware)" comments in `src/app/api/scripture/route.ts` and `src/app/api/services/route.ts` now say "proxy gate".

Beyond the task list, two additions:

1. `src/app/api/auth/change-password/route.ts` was switched from bare `verifySession` to `requireSession`, so a cookie that logout or an earlier rotation already revoked cannot set a new password.
2. `PATCH /api/admin/accounts/[id]` now bumps `token_version` when it sets a password, and re-issues the caller's cookie when an admin resets their own. The deferred item this spec closes is worded "logout and **password reset** do not revoke already-issued session cookies", and the admin reset is the path an operator would actually use after a suspected compromise — leaving it non-revoking would have made the resolved entry false. A role change deliberately does **not** bump: the gate already rejects a cookie whose role no longer matches the row. No response body or status changed on that route.

**Block If — cleared.** better-sqlite3 loads from the proxy bundle in a production build; a revoked cookie is refused at the gate on both `/api/services` (401) and a page (307 → `/login`), verified against `next start` on the built app.

## Review Triage Log

### 2026-07-26 - Review pass

- intent_gap: 0
- bad_spec: 0
- patch: 19: (high 7, medium 9, low 3)
- defer: 7: (high 0, medium 4, low 3)
- reject: 2: (high 0, medium 1, low 1)
- addressed_findings:
  - `[high]` `[bad_spec]` The per-username lockout was a denial-of-service against the church's own admin account, with no unlock path. Rescoped to `(username, address)` pairs plus the address-only scope, and an operator unlock script added. See the Spec Change Log.
  - `[high]` `[patch]` The shared `unknown` address bucket was poisonable into a global lockout: 20 failures carrying no forwarding header locked out loopback, LAN, and the direct-to-box recovery path. That bucket is now never counted and never refused, and only a value parsing as a real IPv4/IPv6 address is used as a key.
  - `[high]` `[patch]` `change-password` allowed unlimited `currentPassword` guessing, so a stolen cookie could brute-force its way to a permanent takeover. It now shares the login ledger, so an attacker locked out on one route cannot switch to the other.
  - `[high]` `[patch]` Password change was not atomic with revocation: a failed `bumpTokenVersion` left the password rotated and every old cookie live while the user saw an error. Both that route and the admin reset now run the pair in one transaction.
  - `[high]` `[bad_spec]` Logout failed open, reporting success when the revocation write failed. Now fails closed without clearing the cookie. See the Spec Change Log.
  - `[high]` `[patch]` The matcher - the entire authorization boundary - had no test; the revocation suite called `proxy()` directly and would have passed with `/api/services` excluded. Added `tests/proxy-matcher.test.mjs` over `unstable_doesMiddlewareMatch`, verified to fail on a deliberate matcher break.
  - `[high]` `[patch]` Six gated pages still used signature-only `verifySession`, and two derived `isAdmin` from the cookie claim with no DB read, so revocation was not enforced in the second layer. All six moved onto a DB-checked `validateSessionToken`.
  - `[medium]` `[patch]` An over-long password charged the username ledger, giving a free targeted lockout for five cheap requests. It now returns 401 without recording.
  - `[medium]` `[patch]` `login_attempts` was unbounded inside the window; capped at 5000 rows, oldest dropped first.
  - `[medium]` `[patch]` A successful login never cleared the address ledger, so operators behind one NAT could lock out the site with no way to reset but time. Success now clears both scopes.
  - `[medium]` `[patch]` `Retry-After` was unclamped against clock skew and could exceed the window; clamped to `[1, window]`.
  - `[medium]` `[patch]` `username` had no length cap before the DB lookup, so a multi-megabyte string was lower-cased and used as an index probe on every request. Capped at 96 chars.
  - `[medium]` `[patch]` Every `public/assets` request cost two synchronous SQLite queries - roughly 34 blocking queries to load a projector deck. `assets/` is now exempt; `/api/uploads/*` stays gated and is pinned by a test comment saying why.
  - `[medium]` `[patch]` Revocation rows were pruned by wall-clock expiry, so a clock step forward followed by a correction would permanently delete revocations for still-valid cookies. Rows are now kept a full TTL past `exp`.
  - `[medium]` `[patch]` `signSession` accepted an injectable `sid` and an unvalidated `tv`, inviting a future caller to reuse a session id or mint a `tv: 0` cookie that can never verify. Both sides now share the same predicates.
  - `[medium]` `[patch]` Three gated pages were not marked dynamic and the gate emitted no cache headers, so behind a Cloudflare "cache everything" rule a rendered deck could be served without the origin running. Added `force-dynamic` plus `Cache-Control: private, no-store` and `Vary: Cookie` on every gate response.
  - `[low]` `[patch]` Matcher asymmetry: `_next/static` and `_next/image` were bare prefixes while the other exclusions were anchored, so `/_next/staticfoo` would have been ungated. Uniformly anchored.
  - `[low]` `[patch]` A comment in the gate miscounted the `requireSession` call sites; replaced with a statement that cannot rot.
  - `[low]` `[patch]` `docs/index.md` and `docs/source-tree-analysis.md` still pointed at the deleted `src/middleware.ts`; both now point at `src/proxy.ts`.


## Design Notes

The gate moved. Before Next 16 this design would have been impossible without a second store, because middleware ran on the Edge runtime and could not open SQLite — which is why `session.ts` is deliberately Web-Crypto-only. In Next 16 the proxy defaults to Node.js (`proxy.md:774-776`), so the same DB re-check that `requireSession` performs can run for every gated request. That is what makes revocation real rather than advisory: today only six `/api/admin/**` routes call `requireSession`, so enforcing revocation only there would leave every page and every service API untouched.

Two revocation mechanisms, because they answer different questions:

```
sid  -> one session      (logout: revoke this cookie, leave other devices alone)
tv   -> all sessions     (password change: assume compromise, invalidate everything)
```

Requiring the current password is included because it is the same vulnerability: without it, a stolen cookie can set a new password, and revoking sessions afterwards would revoke the victim's, not the attacker's.

`Retry-After` is reported in seconds from the oldest attempt still inside the window, so the value shrinks as the window slides rather than resetting on every rejected try.

**The third deferred item is deliberately not implemented.** `deferred-work.md` records that Part C flyer slides "still appear after standing Part C slides (not a contiguous Announcements block)". The canonical `artifact-catalog.md` (a SPEC companion, and the authority for product behaviour) documents Part C as: `announcements` header (1), `welcome-repeat` (2), `offering-tithe` (3), `midweek-prayer` (4), `fellowship-etiquette` (5), `contact` (6), `family-youth` (7), `flyer-*` (8–N), `thank-you` (N+1) — exactly what the code emits. Two contradictory sources describe the same worship deck, and picking one silently would change what the congregation sees on a Sabbath. It needs a decision from the project lead, not an unattended guess.

## Verification

**Commands:**
- `npm test` -- expected: all suites pass, including the two new ones
- `npx tsc --noEmit` -- expected: no type errors
- `npm run build` -- expected: succeeds
- `npm run lint` -- expected: no new error attributable to this diff
- `node scripts/smoke-deck-fidelity.mjs` -- expected: no regression versus the current baseline of 28 pass / 2 known-stale fail; its login and webhook checks must stay green

**Manual checks (if no CLI):**
- Start the built app, sign in, copy the cookie, log out, replay the cookie against `/api/services` (expect `401`) and against `/services` (expect a redirect to `/login`) — this is the check that proves the proxy is doing the DB lookup.
- Fail a login five times and confirm the sixth returns `429` with `Retry-After`, then confirm a different username is unaffected.

## Auto Run Result

Status: done
Blocking condition: none

### Summary

Closed the two auth gaps from `deferred-work.md`. Login now records failures in SQLite and refuses `(username, address)` pairs past 5 failures and addresses past 20 within a 15-minute window, answering `429` with `Retry-After`. Sessions gained a per-session `sid` and a per-account `tv`, backed by a `revoked_sessions` table and an `accounts.token_version` column, and the check runs at the request gate for every gated page and API. `change-password` now requires the current password, is throttled on the same ledger, and revokes every other session for the account atomically.

### The finding that shaped the change

Next 16 still compiles a `middleware.ts` entry to the **Edge** runtime unless it exports `runtime = 'nodejs'`, which a proxy file is forbidden to do (`node_modules/next/dist/build/entries.js:231-243`, `proxy.md:223`). better-sqlite3 cannot load there, so the gate was moved to `src/proxy.ts`, which defaults to Node.js. Without that move, revocation could only have been enforced in the six admin routes that call `requireSession` - every page and every service API would have kept honouring a logged-out cookie. Verified empirically on a production build: `functions-config-manifest.json` reports `"/_middleware": { "runtime": "nodejs" }`, the NFT trace includes `better_sqlite3.node`, and a revoked cookie is rejected at the gate on both an API route and a page.

### Files changed

**New** - `src/proxy.ts` (the gate, replacing `src/middleware.ts`), `src/lib/auth/rate-limit.ts`, `src/lib/auth/revocation.ts`, `src/lib/auth/client-ip.ts`, `scripts/auth-unlock.mjs`, and the `auth-rate-limit` / `auth-revocation` / `proxy-matcher` test suites.

**Changed** - `src/lib/db/index.ts` (DDL for `login_attempts`, `revoked_sessions`, two indexes, and the `token_version` column), `src/lib/auth/session.ts` (`sid` + `tv`, legacy cookies fail closed), `src/lib/auth/require.ts` (shared `validateSessionAgainstDb` / `validateSessionToken`), `src/lib/auth/accounts.ts`, the three `/api/auth/*` routes, `PATCH /api/admin/accounts/[id]`, six gated `page.tsx` files, three present/slideshow pages (`force-dynamic`), `src/components/Header.tsx` (current-password field), `package.json`, `scripts/smoke-auth.mjs`, `docs/index.md`, `docs/source-tree-analysis.md`.

**Deleted** - `src/middleware.ts`.

### Review findings

19 patches applied (7 high, 9 medium, 3 low), 7 deferred, 2 rejected. Two of the high findings were routed as `bad_spec` and are recorded in the Spec Change Log: the lockout rescoping and the fail-closed logout. Deferred items are in [deferred-work.md](./deferred-work.md).

### Verification

- `npm test` - 250 pass, 0 fail (up from 202)
- `npx tsc --noEmit` - clean
- `npm run build` - succeeds, emits `Proxy (Middleware)`
- `npx eslint` over every changed file - zero findings; the remaining repo-wide errors and warnings are all in files this branch does not touch
- `node scripts/smoke-deck-fidelity.mjs` - 28 pass, 2 fail (the two known-stale checks predating this work); its login and webhook checks are green
- Matcher test verified to bite: excluding `/api/services` and un-anchoring `_next/static` each fail the suite
- Runtime gate check against `next start` on the built app: 23 checks including revoked cookie rejected on an API and on a page, other device still signed in, sixth failure returning 429 with `Retry-After`, and older cookies rejected after a password change

### Residual risks

- **Everyone signs in once after deploy.** Legacy cookies lack `sid`/`tv` and fail closed by design - no compatibility branch was added, because one that accepted them would have defeated the check.
- **A lockout is now per (username, address).** A distributed attacker gets more attempts against one account than a global counter would have allowed. That was the deliberate trade for removing a trivial denial-of-service against the admin account; Cloudflare is the volumetric layer in front.
- **The gate is the only authorization layer for nine API routes.** The matcher is now pinned by a test and the pages were moved onto the DB-checked path, but the Next docs recommend a second in-route check that these routes still lack.
- **`/api/webhook` remains unthrottled** and compares its secret without a constant-time comparison - the same class of gap, out of scope here and deferred.
