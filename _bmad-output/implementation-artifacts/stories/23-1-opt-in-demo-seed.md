---
baseline_commit: 81b9e17
---

# Story 23.1: A Fresh Clone Can Show a Finished Deck

Status: ready-for-dev

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

- [ ] Add a testable server-side demo-seeding module (AC: 1-5)
  - [ ] Create `src/lib/demo-seed.ts` with the authored-synthetic fixture and a named seeding function; keep the fixture in code, not in `data/local/`, an upload directory, or a generated deck.
  - [ ] Check `SELECT COUNT(*)` on `services` before every write and return/throw one deliberate refusal for any non-empty result.
  - [ ] Build the input with `narrowCreateBody()` and call `createService(db, input)` rather than duplicating rundown parsing, SQL insertion, structured-field normalisation, or announcement syncing.
  - [ ] Treat an unexpectedly invalid narrowed payload or failed `createService()` result as a command failure; do not leave partial rows behind.

- [ ] Add the explicit command without changing normal setup (AC: 1, 4)
  - [ ] Add `scripts/seed-demo.mjs`, following `scripts/setup.mjs`'s Node TypeScript-loader bridge and repository-root handling to invoke the server-side module.
  - [ ] Add `seed:demo` to `package.json`; leave the `setup` script and `scripts/setup.mjs` free of any demo-seed invocation.
  - [ ] Print a concise success result (service id/date and how to open it) or a clear empty-install refusal; return a non-zero exit status for refusal/failure.

- [ ] Cover the command contract and privacy boundary (AC: 2-6)
  - [ ] Add `tests/demo-seed.test.mjs`, using a newly created temporary directory and `DB_PATH` set before importing `getDb`; restore environment state and remove the temp directory after the suite.
  - [ ] Assert exactly one service and its announcement rows after a first seed, valid parsed rundown data including zero failed hymns, and that the normal `buildSlidePlan` path can consume it.
  - [ ] Snapshot row counts/content before a second seed; assert the command/module refuses and all service and announcement rows remain unchanged.
  - [ ] Assert the demo command is opt-in (database initialization alone creates no demo service) and retain/extend `tests/public-repo-guard.test.mjs` coverage as needed. If a guard changes, inject its prohibited condition once and confirm it fails before finalizing.
  - [ ] Register the new test file in the explicit `npm test` file list.

- [ ] Verify the scoped change (AC: 1-6)
  - [ ] Run the focused demo-seed test and its related service/slide-plan tests.
  - [ ] Run `npm test`, `npm run build`, and the mandatory public-repository guard.
  - [ ] Confirm `git diff --check` is clean and no forbidden artifact is staged.

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

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Status set to `ready-for-dev`; implementation has not started.

### File List

- `_bmad-output/implementation-artifacts/stories/23-1-opt-in-demo-seed.md` (new)
