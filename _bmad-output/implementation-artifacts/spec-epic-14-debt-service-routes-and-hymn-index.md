---
title: 'Epic 14 debt — extract service route domain logic, shrink the hymn index payload'
type: 'refactor'
created: '2026-07-26'
status: 'done'
baseline_revision: '6081d7cb9b279df64b62226f9c6c9c2687381da0'
final_revision: '00e1e161f62c4784c1f3b0f273141e8f5c8c5384'
review_loop_iteration: 0
followup_review_recommended: true
context:
  - '{project-root}/_bmad-output/project-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-14-retro-2026-07-19.md'
warnings: ['multiple-goals']
---

<intent-contract>

## Intent

**Problem:** Two Epic 14 retro action items are still open. `src/app/api/services/route.ts` (246 L) and `src/app/api/services/[id]/route.ts` (373 L) carry nearly all their domain logic inline — untyped bodies re-cast ~17 times, a four-way near-identical UPDATE branch, and a string-matched `Error('CONCURRENT_CONFLICT')` sentinel — which violates the repo's thin-route rule and leaves the create/edit paths untestable except through HTTP. Separately, every load of `/services/new` and `/services/[id]` embeds all ~695 hymns (~40 KB of JSON, roughly 80 KB inside the RSC payload) purely so four autocomplete inputs can filter locally.

**Approach:** Move service create/read/update/delete domain logic into `src/lib/services/*` behind typed inputs and discriminated results, leaving the route handlers as HTTP adapters that map result kinds to the exact statuses and bodies they emit today. Replace the full hymn array with a small seed of only the hymns the form currently references, and have the autocomplete query the existing `GET /api/hymns` on demand.

## Boundaries & Constraints

**Always:**
- This is behaviour-preserving. Every existing success and error response keeps its exact HTTP status and JSON body shape; `POST` still returns `201 { message, id, date, failedHymnNumbers }`, `PUT` still returns `200 { message, failedHymnNumbers, updated_at }`, `GET` still returns `{ services, q, count }`.
- `updated_at` optimistic concurrency keeps its current semantics: `400` when the client omits it, `409` with the current `updated_at` when stale, and the guard stays enforced in the `WHERE` clause, not only pre-checked.
- Date-collision behaviour is unchanged: `409 { error, existingId, date }` unless `allowSecond` is set (CAP-4 permits multiple rows per date by design).
- Announcement sync keeps its `clearMaster` guard; image payload merge-or-keep presence semantics on `PUT` are preserved exactly.
- Route handlers stay thin: `await context.params`, read the body, delegate, map the result. No SQL and no business rules left in `src/app/api/services/**`.
- Reuse the existing helpers (`parseServiceId`, `parseRundown`, `coerceImageUrls`, `coerceOptionalSafeImageUrl`, `parseImagesPayloadJson`, `coerceStructuredFields`, `applyStructuredFields`, `normalizeParsedRundown`, `coerceWorshipAnnouncements`, `syncWorshipAnnouncements`) — do not reimplement them.
- better-sqlite3 stays synchronous and server-only; writes stay inside the existing `db.transaction` boundary.
- TypeScript strict: no `any`. Bodies enter as `unknown` and are narrowed once, in one place.
- Log server detail with `console.error`; never leak stacks or SQL to clients.
- New tests use `node:test` and are appended to the explicit `package.json` `test` list.
- Read the relevant guide under `node_modules/next/dist/docs/` before touching Next.js route or page APIs.

**Block If:**
- Preserving a current response byte-for-byte would require keeping SQL in a route handler.
- The hymn seed cannot render a stored hymn's display label without an extra request on first paint.

**Never:**
- No change to the `services` or `hymns` schema, and no migration framework.
- No change to parser behaviour, `ParsedRundown`, announcement semantics, or worship form fields.
- Do not close the known gaps this refactor merely makes visible — PPTX cache invalidation on edit, orphaned upload cleanup on delete, and the missing `GET /api/services/[id]` handler stay out of scope and go to deferred work.
- No new HTTP client library, no global state library, no data-fetching framework.
- Do not remove the `?all=1` mode from `GET /api/hymns`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| List services | `GET /api/services` | `{ services, q: null, count }` | 500 on DB failure |
| Search services | `GET /api/services?q=advent` | LIKE match on date and `raw_payload` | 500 on DB failure |
| Create valid | `POST` with `raw_payload` | `201 { message, id, date, failedHymnNumbers }` | — |
| Create, malformed JSON | unparseable body | — | `400 { error: 'Invalid JSON' }` |
| Create, no raw payload | `{}` | — | `400 { error: 'raw_payload is required' }` |
| Create, undated rundown | text with no date | — | `400 { error: 'Could not parse service date from raw_payload' }` |
| Create, date taken | existing row same date, no `allowSecond` | — | `409 { error, existingId, date }` |
| Create, date taken + `allowSecond` | same | `201`, second row created | — |
| Update valid | `PUT` with matching `updated_at` | `200 { message, failedHymnNumbers, updated_at }` | — |
| Update, malformed JSON | unparseable body | — | `400 { error: 'Invalid JSON' }` (today this falls through to 500) |
| Update, missing `updated_at` | body without it | — | `400 { error: 'updated_at is required for concurrent edit protection' }` |
| Update, stale `updated_at` | older value | — | `409 { error, updated_at }`, row unchanged |
| Update, unknown id | id not in table | — | `404 { error: 'Service not found' }` |
| Update, neither raw nor fields | `{ updated_at }` only | — | `400 { error: 'Missing raw_payload or structured fields' }` |
| Update, images key absent | body omits `images` | Stored image payload kept unchanged | — |
| Update, images key present | body sets `images: []` | Stored image payload replaced | — |
| Delete existing | valid id | `200 { message: 'Service deleted successfully' }` | — |
| Delete unknown | id not in table | — | `404 { error: 'Service not found' }` |
| Bad service id | `/api/services/abc` | — | `400 { error: 'Invalid Service ID' }` |
| Hymn seed, create page | no hymns chosen yet | Empty seed, no hymn rows embedded | — |
| Hymn seed, edit page | service references 4 hymns | Only those 4 embedded; labels render on first paint | Unknown number renders the raw number |
| Autocomplete typing | user types `159` or `amaz` | Debounced `GET /api/hymns?q=…`, up to 40 matches | Fetch failure shows a non-blocking empty/error state, input still usable |
| Autocomplete offline | fetch rejects | Previously seen hymns still selectable | No crash, no lost input |

</intent-contract>

## Code Map

- `src/app/api/services/route.ts` (246 L) -- `GET` (list/search) + `POST` (create); 9 inline `(body as { X?: unknown })` casts, duplicated `ServiceRow` type, collision SELECT, transaction with INSERT + announcement sync.
- `src/app/api/services/[id]/route.ts` (373 L) -- `DELETE` + `PUT`; `request.json()` implicitly `any`, 8 further body casts, 4-way UPDATE branch, `Error('CONCURRENT_CONFLICT')` sentinel, three separate 404 sites. No `GET` handler exists.
- `src/lib/service-id.ts` -- `parseServiceId`.
- `src/lib/parsed-fields.ts` -- `coerceStructuredFields`, `applyStructuredFields`, `normalizeParsedRundown`.
- `src/lib/announcements.ts` -- `coerceWorshipAnnouncements`, `syncWorshipAnnouncements` (+ a large existing surface; reuse).
- `src/lib/images.ts` -- `coerceImageUrls`, `coerceOptionalSafeImageUrl`, `parseImagesPayloadJson`.
- `src/lib/db/index.ts:109` -- `announcement_items` FK `ON DELETE CASCADE`; startup DDL pattern.
- `src/middleware.ts:57` -- all auth for these routes; handlers contain none.
- `src/app/api/hymns/route.ts` -- existing `GET /api/hymns`: `?all=1` full list, `?q=` LIKE on number/title `LIMIT 15`, else first 15. No client calls it today.
- `src/app/services/new/page.tsx:27` and `src/app/services/[id]/page.tsx:108` -- both run `SELECT number, title FROM hymns ORDER BY number` (~695 rows, ~40 KB JSON) and pass it down.
- `src/app/services/new/CreateForm.tsx:41,44` / `src/app/services/[id]/EditForm.tsx:62,77` -- `hymnIndex: HymnIndexEntry[]`, each passed to four `<HymnNumberAutocomplete>` instances.
- `src/components/HymnNumberAutocomplete.tsx` -- uses `hymnFieldDisplayValue` (display), `filterHymnIndex(…, 40)` (dropdown), `filterHymnIndex(…, 2)` (unique free-text match), and an `hymnIndex.length === 0` "Hymn index not loaded" state.
- `src/lib/worship-form-fields.ts:19` -- `HymnIndexEntry`, `formatHymnFieldDisplay`, `normalizeHymnFilterQuery`, `hymnFieldDisplayValue`, `filterHymnIndex`.
- `tests/services-create.test.mjs`, `tests/services-api.test.mjs`, `tests/worship-form-fields.test.mjs` -- current coverage is lib-level; no HTTP test exists for `/api/services`.
- `tests/artifacts-api.test.mjs`, `tests/auth-http.test.mjs` -- the precedent for importing a route handler directly in a test.

## Tasks & Acceptance

**Execution:**

- [x] `src/lib/services/types.ts` -- new: `ServiceRow`, `ServiceListItem`, `CreateServiceInput`, `UpdateServiceInput`, and discriminated results (`{ ok: true, … }` | `{ ok: false, kind: 'validation' | 'conflict' | 'collision' | 'not-found', … }`) -- one shared vocabulary so the routes never re-declare row shapes.
- [x] `src/lib/services/body.ts` -- new: narrow an `unknown` request body into `CreateServiceInput` / `UpdateServiceInput` once, returning either the typed input or a validation result carrying the exact message the route emits today -- removes the `any` and all ~17 scattered casts.
- [x] `src/lib/services/queries.ts` -- new: `listServices(db, q)` (both SQL variants + row→DTO mapping + the tolerant `parsed_data` parse) and `deleteService(db, id)` returning whether a row was removed.
- [x] `src/lib/services/create-service.ts` -- new: `createService(db, input)` — parse, structured overlay, image coercion, collision check honouring `allowSecond`, INSERT and announcement sync inside one transaction.
- [x] `src/lib/services/update-service.ts` -- new: `updateService(db, id, input)` — existence check, `updated_at` guard, images merge-or-keep, raw re-parse or stored re-normalize, one dynamically built UPDATE keeping the `COALESCE(updated_at, created_at)` guard in the `WHERE` clause, announcement sync, and a typed stale/not-found result replacing the string sentinel.
- [x] `src/app/api/services/route.ts` -- reduce `GET`/`POST` to HTTP adapters: read body, delegate, map result kind to the existing status/body. Add the same `Invalid JSON` guard shape both handlers use.
- [x] `src/app/api/services/[id]/route.ts` -- reduce `DELETE`/`PUT` the same way; wrap `request.json()` so a malformed body returns `400 { error: 'Invalid JSON' }` instead of falling through to 500.
- [x] `src/app/api/hymns/route.ts` -- accept an optional `limit` (default 15, capped at 40 to match `filterHymnIndex`) and an optional `numbers=1,2,3` batch lookup for label resolution; keep `?all=1` and the existing default behaviour untouched.
- [x] `src/lib/worship-form-fields.ts` -- add a helper that merges hymn entries from several sources (seed, fetched, user-picked) into one lookup without duplicates, so display labels survive after the full array is gone.
- [x] `src/app/services/new/page.tsx` + `src/app/services/[id]/page.tsx` -- replace the full-table query with a seed of only the hymn numbers the initial form values reference (empty on create), keeping the same prop name so the forms need no signature change.
- [x] `src/components/HymnNumberAutocomplete.tsx` -- treat the prop as a seed: keep a local merged lookup, fetch matches from `GET /api/hymns?q=…&limit=40` on a debounce while typing, retain picked hymns for label rendering, apply the existing unique-free-text rule against fetched results, and replace the `length === 0` "Hymn index not loaded" state (an empty seed is now the normal create-page case).
- [x] `tests/services-lib.test.mjs` -- new: cover the create/update/delete/list rows of the I/O matrix against a temp DB, including collision + `allowSecond`, stale `updated_at` leaving the row unchanged, images merge-or-keep, and announcement `clearMaster`.
- [x] `tests/hymns-api.test.mjs` -- new: cover `?q=`, `limit` default and cap, `numbers=`, `?all=1`, and malformed params.
- [x] `package.json` -- append both new test files to the explicit `test` list.
- [x] `_bmad-output/implementation-artifacts/sprint-status.yaml` -- close the two Epic 14 action items.

**Acceptance Criteria:**
- Given any request in the I/O matrix, when it is sent before and after the refactor, then the HTTP status and JSON body are identical (except the documented malformed-`PUT`-body case, which improves from 500 to 400).
- Given `src/app/api/services/route.ts` and `src/app/api/services/[id]/route.ts` after the change, when they are inspected, then neither contains SQL, a domain rule, or an `any`, and both are substantially shorter than today.
- Given the edit page for a service that references hymns, when it is first painted, then each hymn input shows its `number - title` label with no client fetch.
- Given the create page, when it is loaded, then no hymn rows are embedded in the page payload, and typing in a hymn input still offers matching hymns.
- Given a hymn the user picked earlier in the session, when the input re-renders, then its label is still shown without another request.
- Given `npm test`, `npm run build` and `npx tsc --noEmit`, when they run, then all pass and no new lint error appears inside this change's diff.

## Spec Change Log

## Review Triage Log

### 2026-07-26 - Review pass

- intent_gap: 0
- bad_spec: 0
- patch: 14: (high 4, medium 8, low 2)
- defer: 8: (high 0, medium 5, low 3)
- reject: 2: (high 0, medium 0, low 2)
- addressed_findings:
  - `[high]` `[patch]` Clicking Save could outrun an uncommitted hymn: `commitDraft` had become async, blur fires on the Save button's mousedown, and the click handler read a stale `fields` closure, so the request carried the previous hymn number. `commitDraft` is synchronous again for every resolvable case, unresolved commits register in a module-level pending set during blur, both forms await `flushPendingHymnCommits()` first, and the body is built from a ref written synchronously in `setField`.
  - `[high]` `[patch]` A failed `/api/hymns` lookup made the small seed look authoritative, so an ambiguous free-text entry committed a confidently wrong hymn (typing `praise` with an expired session committed hymn 1). A null lookup now short-circuits before the unique-match rule.
  - `[high]` `[patch]` The same failure path cleared the field via `onChange('')`, silently erasing a typed title on a transient blip. The draft is now kept with a non-blocking `aria-live` notice; an empty *answer* still clears, because that is a real result.
  - `[high]` `[patch]` The refactor's one promise, byte-identical HTTP responses, had no test at all. Added `tests/services-http.test.mjs`: 23 tests importing the four handlers directly, asserting status and exact body for every I/O-matrix row plus the three error-precedence cases; verified discriminating by breaking the 409 collision mapping.
  - `[medium]` `[patch]` A late commit could overwrite a newer draft; added a generation token bumped on commit start, focus, keystroke and pick.
  - `[medium]` `[patch]` The dropdown reported "No hymns found" during the debounce window and the round trip, a definitive negative while the search was still pending. A negative is now shown only once the answer for the active query has arrived.
  - `[medium]` `[patch]` `GET /api/hymns` built its LIKE pattern with no `ESCAPE`, so `_` and `%` acted as SQL wildcards and the client filtered the extra rows away, showing "No hymns found" for a query the server answered non-empty. Wildcards are escaped and both clauses carry `ESCAPE`.
  - `[medium]` `[patch]` `?numbers=` was never actually batched: each of the four autocompletes owned its own cache, so a Parse hydrate fired four single-integer requests. A module-level shared cache plus a micro-task queue coalesces them into one.
  - `[medium]` `[patch]` Focusing a resolved field searched for its own display string, so tabbing through four inputs issued four full-text searches. The debounce now bails when the draft still equals the resolved label.
  - `[medium]` `[patch]` `mergeHymnIndexEntries` accepted `Number.isFinite` while `coerceHymnIndexEntries` required `Number.isSafeInteger`, letting a fractional number become a permanently unresolvable ghost row. One predicate now.
  - `[medium]` `[patch]` `createService`/`updateService` advertised an injectable `db` while `syncWorshipAnnouncements` called `getDb()` internally, so a second connection would have written announcements outside the transaction. The handle is threaded through (defaulted, so existing callers are unaffected) and covered by a test using a second connection.
  - `[medium]` `[patch]` The stale-write path returned from inside the transaction, which commits, where the legacy sentinel threw and rolled back. Harmless only because nothing had been written yet, so correctness depended on statement order. A typed private error restores rollback structurally.
  - `[low]` `[patch]` The learned-hymn dedupe pinned a stale title for the component's lifetime; the merge now prefers fresh rows and compares element-wise.
  - `[low]` `[patch]` `hymnIndex = []` default parameters minted a new array identity per render, which would re-run the lookup effect; hoisted to module-level constants in both forms.


## Design Notes

The result type is what keeps the routes honest — one shape carries every outcome the handler must map, so no domain rule can leak back into the adapter:

```ts
export type UpdateServiceResult =
  | { ok: true; failedHymnNumbers: number[]; updatedAt: string }
  | { ok: false; kind: 'validation'; message: string }
  | { ok: false; kind: 'not-found' }
  | { ok: false; kind: 'conflict'; updatedAt: string };
```

The hymn seed is deliberately derived from the form's *initial values* rather than from a fixed count: create pages seed nothing, edit pages seed the handful of hymns already chosen. That removes the payload without costing a round-trip on first paint, which is the whole reason the array was embedded in the first place (decision 5a, Epic 14).

The autocomplete keeps `filterHymnIndex` for filtering whatever entries it currently holds; the only new behaviour is where those entries come from. The unique-free-text rule (`limit 2`) must run against fetched results, so it needs the fetch to have settled before `commitDraft` accepts a title.

## Verification

**Commands:**
- `npm test` -- expected: all suites pass, including the two new ones
- `npx tsc --noEmit` -- expected: no type errors
- `npm run build` -- expected: succeeds
- `npm run lint` -- expected: no new error attributable to this diff
- `node scripts/smoke-deck-fidelity.mjs` -- expected: no regression versus the current baseline (two checks are known-stale and already failing; the create/edit/PUT/409 checks must stay green)

**Manual checks (if no CLI):**
- View source / RSC payload of `/services/new`: no hymn titles embedded.
- Open an existing service: hymn inputs show `number - title` immediately; typing filters; selecting persists the number.

## Auto Run Result

Status: done
Blocking condition: none

### Summary

Closed both open Epic 14 retro action items. Service route domain logic moved into `src/lib/services/*` behind typed inputs and discriminated results, cutting `src/app/api/services/route.ts` from 246 to 68 lines and `src/app/api/services/[id]/route.ts` from 373 to 87, with every HTTP status and body preserved byte-for-byte (one intentional improvement: malformed `PUT` JSON now returns 400 instead of 500). The ~695-hymn array embedded in every create/edit page load was replaced by a seed of only the hymns the form already references, with on-demand search against the existing `GET /api/hymns`.

### Files changed

**New - service domain**

- `src/lib/services/types.ts` - shared row shapes, narrowed inputs, discriminated results
- `src/lib/services/body.ts` - the single `unknown` to typed-input narrowing point
- `src/lib/services/queries.ts` - list/search, delete, `updated_at` token read
- `src/lib/services/create-service.ts` - parse, overlay, collision policy, INSERT + announcement sync in one transaction
- `src/lib/services/update-service.ts` - 404/409 gates, images merge-or-keep, one dynamically built guarded UPDATE

**Changed**

- `src/app/api/services/route.ts`, `src/app/api/services/[id]/route.ts` - pure HTTP adapters; no SQL, no domain rule, no `any`
- `src/lib/announcements.ts` - `syncWorshipAnnouncements` accepts the caller's connection (defaulted)
- `src/app/api/hymns/route.ts` - `limit` (default 15, cap 40), `numbers=` batch lookup, escaped LIKE wildcards; `?all=1` untouched
- `src/lib/worship-form-fields.ts` - hymn entry merging, wire coercion, and the pure `resolveHymnDraft` decision function
- `src/app/services/new/page.tsx`, `src/app/services/[id]/page.tsx` - hymn seed instead of the full table
- `src/components/HymnNumberAutocomplete.tsx` - seed + debounced search + shared module-level cache
- `src/app/services/new/CreateForm.tsx`, `src/app/services/[id]/EditForm.tsx` - await pending hymn commits before saving; field ref mirror

**New tests** - `services-lib`, `services-http`, `hymns-api`, plus extensions to `worship-form-fields`

### Payload measurement

| Page | Before | After |
|---|---|---|
| `/services/new` | 695 rows, 40,581 B | 0 rows, 2 B |
| `/services/[id]` | 695 rows, 40,581 B | 4 rows, 229-264 B |

### Review findings

14 patches applied (4 high, 8 medium, 2 low), 8 deferred, 2 rejected. Full breakdown in the Review Triage Log; deferred items recorded in [deferred-work.md](./deferred-work.md).

### Verification

- `npm test` - 202 pass, 0 fail (up from 139; all 21 suites registered explicitly)
- `npx tsc --noEmit` - clean
- `npm run build` - succeeds
- `npx eslint` over every changed area - no new finding; the 10 pre-existing `react-hooks/set-state-in-effect` errors and one unused-import warning are untouched
- `node scripts/smoke-deck-fidelity.mjs` - 28 pass, 2 fail (both known-stale checks predating this change, recorded as deferred)
- Mutation-checked: breaking the 409 collision mapping fails the new HTTP suite; dropping the threaded DB handle fails the new announcement-connection test

### Residual risks

- The autocomplete's save path now depends on blur firing before click (standard browser behaviour) plus a field ref mirror. It is covered by unit tests of the pure decision function, but not by a browser test - worth one manual pass on create and edit before relying on it.
- Hymn search is now a network call. On a slow link the dropdown lags behind typing; the input stays usable and a failed lookup keeps the draft rather than guessing.
- `?all=1` still exposes the full hymn dump to any authenticated client (deferred).
