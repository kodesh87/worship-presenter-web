---
baseline_commit: 81b9e17
---

# Story 23.1: A Fresh Clone Can Show a Finished Deck

Status: done

## Story

As someone evaluating or developing this product,
I want one opt-in command that fills an empty install with a believable service,
so that I can see a generated deck without inventing a congregation first.

## Acceptance Criteria

1. **Given** a clone with its normal setup completed, **When** a user runs `npm run seed:demo`, **Then** the command is available explicitly and creates one demo service only on an empty `services` table. Neither `npm run setup`, database startup, nor application startup invokes it automatically.

2. **Given** an empty database, **When** the command succeeds, **Then** it creates one normal service through the existing service-creation path, with an authored-synthetic rundown and announcement set that use the same invented congregation as the shipped registry. The rundown contains section markers, known SDAH hymn numbers, and a resolvable shipped Bible reference so the normal deck/PPTX path has complete input; it is not a demo-only rendering path.

3. **Given** the seeded service, **When** it is read through the existing service/slide-plan flow, **Then** its parsed data has no failed hymn numbers and it can be used to generate a finished deck. The fixture relies on the shipped corpus for hymn resolution; it must not hard-code lyric payloads or introduce a second slide-order/content source.

4. **Given** a database with one or more existing services, **When** `npm run seed:demo` is run, **Then** it refuses before creating, updating, or deleting any service or announcement. Its output explains that demo seeding is only for an empty installation.

5. **Given** the committed demo fixture and command, **When** the public-repository guard evaluates tracked files, **Then** it remains authored synthetic and contains no real congregation names, photographs, prayer requests, contact/payment details, source decks, `data/local/` material, uploaded images, or rendered deck output. Announcement references use the existing safe-image contract; no new raster fixture is committed.

6. **Given** the new seeder, **When** focused tests run against a temporary `DB_PATH`, **Then** they prove first-run creation, parsed/deck-ready content, and refusal/non-mutation on a second run. The new test file is explicitly registered in `package.json`'s `test` command; Story 23.2 retains ownership of the full fresh-clone install/setup/seed/deck E2E verification.

## Tasks / Subtasks

- [x] Add a testable server-side demo-seeding module (AC: 1-5)
  - [x] Create `src/lib/demo-seed.ts` with the authored-synthetic fixture and a named seeding function; keep the fixture in code, not in `data/local/`, an upload directory, or a generated deck.
  - [x] Check `SELECT COUNT(*)` on `services` before every write and return/throw one deliberate refusal for any non-empty result.
  - [x] Build the input with `narrowCreateBody()` and call `createService(db, input)` rather than duplicating rundown parsing, SQL insertion, structured-field normalisation, or announcement syncing.
  - [x] Treat an unexpectedly invalid narrowed payload or failed `createService()` result as a command failure; do not leave partial rows behind.

- [x] Add the explicit command without changing normal setup (AC: 1, 4)
  - [x] Add `scripts/seed-demo.mjs`, following `scripts/setup.mjs`'s Node TypeScript-loader bridge and repository-root handling to invoke the server-side module.
  - [x] Add `seed:demo` to `package.json`; leave the `setup` script and `scripts/setup.mjs` free of any demo-seed invocation.
  - [x] Print a concise success result (service id/date and how to open it) or a clear empty-install refusal; return a non-zero exit status for refusal/failure.

- [x] Cover the command contract and privacy boundary (AC: 2-6)
  - [x] Add `tests/demo-seed.test.mjs`, using a newly created temporary directory and `DB_PATH` set before importing `getDb`; restore environment state and remove the temp directory after the suite.
  - [x] Run the actual `npm run seed:demo` command in the isolated database for both paths (spawn npm via `process.env.npm_execpath`, or `node_modules/npm/bin/npm-cli.js` as fallback, through `process.execPath` with `shell: false` — avoids unreliable Windows `.cmd` spawn without `shell: true`): first run exits zero and reports the created service; second run exits non-zero with the empty-install refusal.
  - [x] Assert exactly one service and its announcement rows after a first seed, valid parsed rundown data including zero failed hymns, and the persisted-service media path `resolveSlideMediaForService(serviceId, images_payload)` to `buildSlidePlan(...)` includes the fixture's `announcements` header and flyer. Do not prove deck readiness with an empty media array or a demo-only adapter.
  - [x] Snapshot row counts/content before the second command; assert refusal leaves all service and announcement rows unchanged.
  - [x] Assert the demo command is opt-in (database initialization alone creates no demo service) and retain/extend `tests/public-repo-guard.test.mjs` coverage as needed. If a guard changes, inject its prohibited condition once and confirm it fails before finalizing.
  - [x] Register the new test file in the explicit `npm test` file list.

- [x] Verify the scoped change (AC: 1-6)
  - [x] Run the focused demo-seed test and its related service/slide-plan tests.
  - [x] Run `npm test`, `npm run build`, and the mandatory public-repository guard.
  - [x] Confirm `git diff --check` is clean and no forbidden artifact is staged.

### Review Findings

- [x] [Review][Decision] Test npm spawn — resolved 2026-08-03: story updated to document the `npm-cli.js` spawn pattern via `npm_execpath` (option A); avoids unreliable Windows `.cmd` spawn without `shell: true`.

- [x] [Review][Patch] Reuse synthetic sermon speaker `Pastor Adam` [`src/lib/demo-seed.ts:19`]
- [x] [Review][Patch] Catch `seedDemoService` throws in CLI wrapper for user-facing failure output [`scripts/seed-demo.mjs:10-17`]
- [x] [Review][Patch] Assert exactly one announcement row after first seed [`tests/demo-seed.test.mjs:77`]
- [x] [Review][Patch] Isolate test subprocess from parent `IMAGE_URL_ALLOWLIST` [`tests/demo-seed.test.mjs:33`]
- [x] [Review][Patch] Remove stale "implementation has not started" completion note [`23-1-opt-in-demo-seed.md:139`]

- [x] [Review][Defer] Concurrent `seed:demo` race on empty table could create two services [`src/lib/demo-seed.ts:46-48`] — deferred, pre-existing CLI pattern; negligible for opt-in demo CLI

## Dev Notes

### Scope and dependency boundaries

- Epic 23 adds no new FR; it makes the already-shipped corpus and deck capabilities reachable in a fresh clone. This story is the prerequisite for Story 23.2, not the full fresh-clone E2E test itself.
- Story 23.1 has no stated prerequisite and can now proceed. Story 23.2 waits for both this demo seed and Story 22.3. Story 22.3 is still gated by Story 20.7; do not take its `data/<locale>/song-book/<code>.json` move, `song_book_code` rename, book defaults, or per-song override into this story.
- The partial documentation guards already delivered in `tests/corpus.test.mjs` belong to Story 23.2 tracking. Preserve them, but do not claim that story is implemented.
- This is a CLI-only capability. Do not add a route, UI component, schema/migration, registry template, design-token change, or UX IA update; `DESIGN.md` and `EXPERIENCE.md` remain unchanged.

### Implementation guardrails

- `scripts/setup.mjs` creates `.env`, initializes the database, verifies corpora, seeds the registry, and may be rerun safely. It must never call the demo seed: automatic synthetic worship data in a real installation is the failure this epic exists to avoid.
- `getDb()` is the sole startup DDL/bootstrap path and honors `DB_PATH`, WAL, foreign keys, corpus reconciliation, registry seeding, and optional admin bootstrap. Reuse it; do not create a second schema/bootstrap path or hand-write service SQL.
- The canonical service seam is `narrowCreateBody()` → `createService(db, input)`. `createService` parses the rundown, applies structured fields, normalizes data, inserts the service, and synchronizes announcements inside one transaction. Preserve its validation and collision semantics.
- `buildSlidePlan` remains the only order/content source for PPTX, slideshow, and presenter. The demo must be a normal persisted service consumed by that function, never special-cased rendering data.
- Announcement image validation permits remote HTTP(S) URLs and `/api/uploads/<32-hex>.<extension>` references. `public/assets/*` is a registry-background vocabulary, not an announcement URL vocabulary. Follow the existing synthetic `https://example.com/*.png` test precedent if an announcement URL is required; do not add an upload reference, scrape/download an image, or commit a new image outside `public/`.
- Put testable logic in `.ts` under `src/lib`; the `.mjs` command should be a thin process/UI wrapper. Use strict TypeScript, named exports, `@/...` imports in app modules, and existing safe image/announcement helpers. No new framework, dependency, test runner, or global state.
- The repository runs Node 22.x. Use the project-pinned dependencies rather than upgrading packages for this CLI. Node’s stable child-process API distinguishes direct executable invocation from shell execution; keep fixed arguments and never pass user input through a shell. [Node.js child-process docs](https://nodejs.org/api/child_process.html)

### Privacy and data requirements

- This public repository’s hard boundary is `AGENTS.md`: prefer not producing real values over filtering them later. Author every fixture value as synthetic; do not copy, extract, or redact a real deck/rundown.
- Payload-bearing fields (family/youth, sermon speaker, special song, verse reading, hymn lyrics) are especially sensitive. The demo needs only authored synthetic values and corpus references; no real person, request, photo, telephone/address, payment information, uploaded flyer, source deck, local database, or `.env` may reach a tracked file.
- `tests/public-repo-guard.test.mjs` scans tracked text, not only fixture folders. Run it unchanged at minimum; if its implementation changes, prove the altered guard rejects the defect it claims to catch.

### Testing requirements

- Use Node’s built-in `node:test` / `node:assert/strict` harness with `--import ./tests/register-ts-resolve.mjs --experimental-strip-types`; do not introduce Jest or Vitest.
- Initialize each DB test with a distinct temporary `DB_PATH` **before** importing `getDb`; clean it up and restore environment changes in the same suite. Follow `tests/services-create.test.mjs` and `tests/slide-plan.test.mjs` patterns.
- Exercise the package command, not only the exported seeding function: spawn npm through `process.env.npm_execpath` (fallback: `node_modules/npm/bin/npm-cli.js`) via `process.execPath` with `['run', 'seed:demo']` and `shell: false`. This exercises the same `seed:demo` script an operator runs, without shell execution or user-controlled arguments. On Windows, spawning `npm.cmd` directly with `shell: false` is unreliable; the `npm-cli.js` indirection is intentional.
- For deck readiness, read the stored `images_payload` and resolve flyers through `resolveSlideMediaForService(serviceId, images_payload)` before calling `buildSlidePlan`. Assert the seeded announcement header and flyer node exist, so the test covers the same service-bound announcement resolution used by the PPTX route.
- Any new `tests/*.test.mjs` file must be added to the explicit `package.json` `scripts.test` list or it will not execute locally/CI.
- Required final checks: focused test, full `npm test`, `npm run build`, `git diff --check`, and `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/public-repo-guard.test.mjs`.

### Previous-story and Git intelligence

- This is the first Story 23 file, so there is no prior Epic 23 implementation to inherit. The latest five commits concern Story 17’s contrast/documentation work, not this scope.
- Story 22.1 established the current shipped song-book state (`data/song-book/sdah.json`, `book_code`) and Story 22.2 corrected titles. Those are current runtime facts until Story 22.3; do not preemptively use the future FR-24 spelling in code or tests.
- The working tree already contains the approved 2026-08-03 Correct Course edits to `epics.md`, `sprint-status.yaml`, and its proposal. Preserve them exactly; they are user work, not Story 23.1 implementation output.

### Project Structure Notes

- New: `src/lib/demo-seed.ts` — testable server-side fixture and seeding orchestration.
- New: `scripts/seed-demo.mjs` — thin opt-in command wrapper.
- New: `tests/demo-seed.test.mjs` — isolated command/seeder contract tests.
- Update: `package.json` — `seed:demo` and explicit test registration.
- Existing files to read before editing: `scripts/setup.mjs`, `src/lib/db/index.ts`, `src/lib/services/body.ts`, `src/lib/services/create-service.ts`, `src/lib/announcements.ts`, `src/lib/images.ts`, `src/lib/parser.ts`, `src/lib/slide-plan.ts`, `tests/services-create.test.mjs`, and `tests/public-repo-guard.test.mjs`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 23: A fresh clone runs]
- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-08-03.md#Implementation Handoff]
- [Source: _bmad-output/planning-artifacts/prds/prd-bic-pptx-workflow-2026-07-10/prd.md#FR-2; #FR-19; #FR-22 / FR-23]
- [Source: _bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md#AD-7 — One slide plan; #AD-9 — Schema evolution through startup DDL; #AD-16 — Service-Bound Registry Snapshot]
- [Source: _bmad-output/project-context.md#Technology Stack & Versions; #Testing Rules; #Development Workflow Rules]
- [Source: AGENTS.md#Public repository — congregation data never enters it]
- [Source: package.json#scripts]
- [Source: scripts/setup.mjs#First-run setup]
- [Source: src/lib/services/create-service.ts#Create a service from an already narrowed body]
- [Source: tests/services-create.test.mjs#Parser and structured fields work correctly]
- [Source: tests/public-repo-guard.test.mjs#Guard for a public repository]
- [Source: Node.js child-process documentation (stable)](https://nodejs.org/api/child_process.html)

## Dev Agent Record

### Agent Model Used

GPT-5.6-Codex

### Debug Log References

- BMad create-story context analysis completed 2026-08-03.
- Architecture, planning, repository, dependency, and current-version Node API review completed before story creation.
- 2026-08-03: Red-green tests covered the missing package command and then the missing resolved verse text before the seeder implementation supplied both.

### Implementation Plan

- Keep the authored synthetic fixture in a server-side module, delegate all service writes to `narrowCreateBody()` and `createService()`, and wrap the call in an outer transaction so any unexpected failure rolls back.
- Resolve the shipped KJV verse through `lookupScripture()` before creating the normal persisted service; the test exercises the package command and the real service-bound media resolver before `buildSlidePlan()`.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Validation improvements applied 2026-08-03: the test contract executes the real opt-in command and verifies persisted service-bound announcement media reaches the normal slide-plan path.
- Implemented the opt-in `seed:demo` command with one synthetic service, a KJV-resolved verse, valid SDAH hymns, and an `example.com` announcement flyer.
- The command refuses non-empty installations before writing; the test spawns npm via `npm_execpath` / `npm-cli.js` with `shell: false` for both success and refusal paths.
- Code review 2026-08-03: five patch items applied; npm spawn contract documented in story; concurrent-seed race deferred.
- Validation passed: focused demo/service/slide-plan tests (14/14), `npm run build`, `npm test` (440 pass, 0 fail, 1 skipped), targeted ESLint, public-repository guard (5/5), and `git diff --check`.

### File List

- `_bmad-output/implementation-artifacts/stories/23-1-opt-in-demo-seed.md` (new)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)
- `package.json` (modified)
- `scripts/seed-demo.mjs` (new)
- `src/lib/demo-seed.ts` (new)
- `tests/demo-seed.test.mjs` (new)

## Change Log

- 2026-08-03: Implemented the opt-in demo seeder, package command, and command-level deck-readiness tests; status moved to review.
- 2026-08-03: Code review closed — patch items applied, npm spawn contract documented, status moved to done.
