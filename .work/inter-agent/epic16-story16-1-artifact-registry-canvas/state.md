# Workflow State: Epic 16 / Story 16.1

## Identity

- `WORKFLOW_ID`: `epic16-story16-1-artifact-registry-canvas`
- `STATUS`: `CLOSED`
- `CURRENT_OWNER`: `none`
- `HANDOVER_SEQ`: `15`
- `LATEST_HANDOVER_ID`: `epic16-story16-1-artifact-registry-canvas-H015`
- Git object format: `sha1`

## Goal

Implement Story 16.1: a validated SQLite-backed Artifact Registry, missing-only JSON seed, admin-only management APIs, and a constrained Fabric.js editor for existing templates without changing current slide-plan or rendering behavior.

## Definition of Done

1. AC-16.1-001 through AC-16.1-010 have implementation and verification evidence.
2. The v0 seed is transformed into the normative v1 registry contract with complete catalog/base-type coverage and resolvable committed runtime assets.
3. Admin edit -> save -> reload and targeted reset work; read-only base types remain non-editable.
4. Unauthorized, invalid, unsafe, unknown, and stale mutations fail without persistence.
5. Existing slide behavior remains unchanged.
6. Verification evidence is recorded for `npm test`, `npm run lint`, and `npm run build`, with inherited non-story gate debt called out explicitly.
7. Antigravity accepts the exact implementation target through `/bmad-code-review`.
8. Codex synchronizes final documentation and closes the workflow through `close-spek`.

## Ordered SSOT and Fingerprints

Git blob fingerprints use repository object format `sha1`.

1. `_bmad-output/specs/spec-slide-artifact-model/SPEC.md` - `0012013b7edd2b5e33e5e395be1acda7ab3a6099`
2. `_bmad-output/specs/spec-slide-artifact-model/registry-contract.md` - `3bb69a5250f35a1084008cb7e4f62bc4a5ef5712`
3. `_bmad-output/specs/spec-slide-artifact-model/artifact-catalog.md` - `d1021412c785c37150fde60d6055f0f13821b892`
4. `_bmad-output/implementation-artifacts/stories/16-1-artifact-registry-canvas-editor-foundation.md` - `1b0c292da019ac29477800ceec0918c46d2f310e`
5. `_bmad-output/planning-artifacts/architecture-epic-16/ARCHITECTURE-SPINE.md` - `1207d3d916c1fc7b6d3931ab0176a36b560ddf5f`
6. `_bmad-output/project-context.md` - `e6ece93afca70cc36bccc165dd87b183da6a999f`
7. `package.json` - `0fa0113c6d2990d18134763fabadc5e0eb0f7395`
8. `_bmad-output/planning-artifacts/epics.md` - `d1d875576e3702ba9d9becb66a9ce9f90fad3f73`
9. `_bmad-output/implementation-artifacts/sprint-status.yaml` - `5f0998ebfb7a165ce1f6b423b745c3e9747b0e7b`

Any SSOT change must be fingerprinted and recorded in the next state delta.

## Locked Decisions

- SQLite is the live registry SSOT.
- `data/default-registry.json` is a validated missing-only startup seed; it never overwrites saved templates.
- Templates are global. Management page and APIs are admin-only with database role re-check.
- `/admin/artifacts`, `/api/admin/artifacts`, `/api/admin/artifacts/[id]`, and `/api/admin/artifacts/[id]/reset` are the locked routes.
- Fabric.js owns an uncontrolled fixed-16:9 canvas with explicit Save.
- Coordinates use normalized percentage units and may extend outside the viewport to preserve source clipping.
- Story 16.1 edits existing seeded templates/elements only.
- Editable types: General, TextPlaceholder, ImagePlaceholder, MixPlaceholder.
- Read-only types: FullScreenImage, SongSet, Announcement.
- `BibleVerseContemplation` is TextPlaceholder with standing defaults.
- SongSet owns distinct title and lyric layouts under the normative model.
- Required IDs cannot be removed or renamed.
- Reset affects one selected template only.
- Canvas JSON is untrusted; structure and image references are validated server-side.
- Bundled asset references must resolve to committed runtime files.
- Story 16.1 must not change current planner, order, renderers, or preview behavior.

## Assumptions

- Save and reset use `updatedAt` optimistic concurrency and return HTTP 409 when stale.
- The local source deck is available only as extraction evidence. Runtime, tests, review, and later hosts must rely on committed derived assets and data.

## Scope

- Registry types, validator, SQLite access, missing-only seed loader, and startup DDL.
- Transformation of the committed v0 seed into the normative v1 contract.
- Committed reusable runtime assets required by the seed.
- Admin list/read/update/reset routes.
- Admin Artifact editor and uncontrolled Fabric.js wrapper.
- Focused Node tests, package test-list update, and compatible Fabric.js dependency.

## Non-goals

- No `ArtifactInstance[]` or `buildSlidePlan` migration.
- No standing-content removal from `slide-plan.ts`.
- No PPTX, `SlideView`, presenter, or preview refactor.
- No template/element creation or deletion.
- No autosave, per-service templates, slide reordering, video, or general-purpose design tool.

## Constraints

- Cursor changes production code, tests, implementation configuration, seed data, and runtime assets only; it does not edit product documentation.
- Next.js code must follow installed documentation under `node_modules/next/dist/docs/`.
- Keep TypeScript strict and use repository App Router, auth, SQLite startup-DDL, image-safety, and `node:test` patterns.
- Source PPTX files are external extraction inputs and must not become runtime dependencies.
- Do not trigger BMAD skills except where explicitly permitted by the inter-agent workflow.

## Code / Diff Identity

- Baseline commit: `f34426f50b0ec5d793795226a066252cf80d2cb9`
- Accepted code head (committed): `cca3b556b61f1e6446617f15fb381e5f8d6ce1b1`
- Accepted review target: `cca3b556b61f1e6446617f15fb381e5f8d6ce1b1 + working tree`
- Reconstruct accepted diff: `git diff f34426f50b0ec5d793795226a066252cf80d2cb9 -- src tests package.json package-lock.json data scripts public`
- Close-spek finalization changed only `_bmad-output/**` documentation and `.work/inter-agent/**` operational chain artifacts.

## Verification Evidence

- BMad Spec coherence pass: `pass` - CAP-1 through CAP-9 retain stable IDs and intent/success pairs.
- BMad Spec preservation pass: `pass` - approved defaults, source geometry, security, and scope claims are preserved against the accepted implementation target.
- `git diff --check` on changed product documentation: `pass` - no whitespace errors; Git emitted line-ending warnings only.
- Accepted production-code diff check: `pass` - the reviewed target remains reconstructable from the recorded baseline and current accepted path set.
- Registry contract and seed coverage evidence: `pass` - accepted implementation carries the transformed v1 seed, committed runtime assets, and validator-backed catalog coverage.
- `npm test`: `pass` - 75 tests on the accepted review target.
- `npm run build`: `pass` - accepted review target.
- `npm run lint`: `accepted inherited failure` - repo-wide pre-existing lint errors remain outside the Story 16.1 diff and are carried as explicit close-record debt rather than a story regression.

## Review State

- Review target: `cca3b556b61f1e6446617f15fb381e5f8d6ce1b1 + working tree`
- Review verdict: `ACCEPTED`
- Finding IDs: `1,6,7,9,10,11 (fixed), 2-5,8 (deferred)`
- Finding disposition: `1,6,7,9,10,11 patched; 2-5,8 deferred`
- Accepted target still current at close: `yes`

## Open Questions

- None.

## Deviations and Known Gaps

- Immutable handover `H014` preserves stale placeholder SSOT paths (`_bmad-output/specs/artifact-registry-canvas/SPEC.md` and `_bmad-output/implementation-artifacts/stories/epic16-story16.1.md`), but the canonical workflow state and close record resolve against the actual repository SSOT paths listed above.
- Repo-wide `npm run lint` failures remain inherited debt outside the Story 16.1 diff; the workflow closes with passing accepted `npm test` and `npm run build` evidence plus that explicit exception.
- Some source geometry intentionally extends beyond the slide and must not be clamped.

## Deferred Work

- Accepted review deferred findings `2`, `3`, `4`, `5`, and `8` remain future follow-up; see `_bmad-output/implementation-artifacts/deferred-work.md`.
- Story 16.2: Artifact hydration and standing-content migration.
- Story 16.3: unified PPTX/web rendering.
- Story 16.4: semantic preview labels and grouping.

## Residual Risks

- Runtime background assets increase the committed footprint; future registry expansion should continue watching bundle size and asset reuse.
- Repo-wide lint debt can still obscure future story-specific lint regressions until the broader cleanup lands.
- The accepted workflow closes on implementation evidence and review acceptance without changing the inherited lint baseline.

## Documentation to Synchronize at Close

- `_bmad-output/specs/spec-slide-artifact-model/SPEC.md`
- `_bmad-output/specs/spec-slide-artifact-model/registry-contract.md`
- `_bmad-output/specs/spec-slide-artifact-model/artifact-catalog.md`
- `_bmad-output/planning-artifacts/architecture-epic-16/ARCHITECTURE-SPINE.md`
- `_bmad-output/implementation-artifacts/stories/16-1-artifact-registry-canvas-editor-foundation.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/project-context.md`
- `.work/inter-agent/epic16-story16-1-artifact-registry-canvas/state.md`
- `.work/inter-agent/epic16-story16-1-artifact-registry-canvas/handovers/015-close.md`
- Relevant `docs/**` architecture/development references if implementation introduces durable patterns.

## Traceability Matrix

| AC ID | Spec / decision | Implementation | Test / gate | Review / finding | Final documentation | Status |
| --- | --- | --- | --- | --- | --- | --- |
| AC-16.1-001 | Story AC + registry-contract "Registry Ownership and Seed" | `src/lib/db/index.ts`, `src/lib/registry/seed.ts`, `src/lib/registry/store.ts`, `data/default-registry.json` | `tests/registry.test.mjs`, accepted diff reconstruction | Accepted | Story 16.1 + `015-close.md` | done |
| AC-16.1-002 | Story AC + registry-contract "Normative Template Shape", "Base-Type Rules", "Seed Baseline and Transformation" | `data/default-registry.json`, `src/lib/registry/types.ts`, `src/lib/registry/validate.ts`, `public/assets/*`, `scripts/transform-registry-v1.mjs` | `tests/registry.test.mjs`, registry coverage evidence | Accepted | Story 16.1 + `015-close.md` | done |
| AC-16.1-003 | Story AC + registry-contract "Admin Routes and Responses" | `src/app/admin/artifacts/page.tsx`, `src/app/api/admin/artifacts/**`, `src/components/Header.tsx`, `src/lib/registry/store.ts` | `tests/artifacts-api.test.mjs`, accepted diff reconstruction | ID `7` fixed, accepted | Story 16.1 + `015-close.md` | done |
| AC-16.1-004 | Story AC + registry-contract validation and image-safety rules | `src/lib/registry/validate.ts`, `src/lib/registry/asset-safety.ts`, `src/lib/registry/store.ts`, `src/app/api/admin/artifacts/[id]/route.ts` | `tests/registry.test.mjs`, `tests/artifacts-api.test.mjs` | ID `7` fixed, accepted | Story 16.1 + `015-close.md` | done |
| AC-16.1-005 | Story AC + SPEC optimistic-concurrency assumption | `src/lib/registry/store.ts`, `src/app/api/admin/artifacts/[id]/route.ts`, `src/app/api/admin/artifacts/[id]/reset/route.ts` | `tests/registry.test.mjs` | Accepted | Story 16.1 + `015-close.md` | done |
| AC-16.1-006 | Story AC + registry-contract "Minimal Editor" | `src/components/admin/ArtifactEditor.tsx`, `src/app/admin/artifacts/page.tsx` | Accepted editor save/reload evidence, `npm run build` | ID `11` fixed, accepted | Story 16.1 + `015-close.md` | done |
| AC-16.1-007 | Story AC + reset/persistence rules | `src/lib/registry/store.ts`, `src/app/api/admin/artifacts/[id]/reset/route.ts`, `src/lib/registry/seed.ts` | `tests/registry.test.mjs` | Accepted | Story 16.1 + `015-close.md` | done |
| AC-16.1-008 | Story AC + base-type editability and stable-ID rules | `src/components/admin/ArtifactEditor.tsx`, `src/lib/registry/store.ts`, `src/lib/registry/validate.ts` | Accepted editor/read-only evidence, accepted diff reconstruction | Accepted | Story 16.1 + `015-close.md` | done |
| AC-16.1-009 | Story AC + SPEC Story 16.1 no-drift constraint | Story-scoped registry/admin path set only; no planner/renderer mutations | `npm test` including unchanged slide-plan coverage | Accepted | Story 16.1 + `015-close.md` | done |
| AC-16.1-010 | Story AC + registry-contract "Verification Gates" + project context | `package.json`, `tests/registry.test.mjs`, `tests/artifacts-api.test.mjs` | `npm test` pass, `npm run build` pass, inherited repo-wide `npm run lint` failure documented | Accepted with inherited lint exception | Story 16.1 + `state.md` + `015-close.md` | done with inherited lint exception documented |

## Chain Integrity

- This workflow began at `.work/inter-agent/epic16-story16-1-artifact-registry-canvas/handovers/001-spek-to-coding.md`.
- Sequence 1 has parent `none`, sender Codex, receiver Cursor, skill `spek-to-coding`, and status `READY`.
- Sequence 2 exists at `.work/inter-agent/epic16-story16-1-artifact-registry-canvas/handovers/002-spek-to-coding.md`.
- Sequence 2 has parent `epic16-story16-1-artifact-registry-canvas-H001`, sender Codex, receiver Cursor, skill `spek-to-coding`, and status `READY`.
- H002 superseded only the Story 16.1 fingerprint after a non-semantic Markdown whitespace correction.
- Sequence 3 exists at `.work/inter-agent/epic16-story16-1-artifact-registry-canvas/handovers/003-coding-to-review.md`.
- Sequence 3 has parent `epic16-story16-1-artifact-registry-canvas-H002`, sender Cursor, receiver Antigravity, skill `coding-to-review`, and status `DONE`.
- Sequence 4 exists at `.work/inter-agent/epic16-story16-1-artifact-registry-canvas/handovers/004-review-to-coding.md`.
- Sequence 4 has parent `epic16-story16-1-artifact-registry-canvas-H003`, sender Antigravity, receiver Cursor, skill `review-to-coding`, and status `READY`.
- Sequence 5 exists at `.work/inter-agent/epic16-story16-1-artifact-registry-canvas/handovers/005-coding-to-review.md`.
- Sequence 5 has parent `epic16-story16-1-artifact-registry-canvas-H004`, sender Cursor, receiver Antigravity, skill `coding-to-review`, and status `DONE`.
- Sequence 6 exists at `.work/inter-agent/epic16-story16-1-artifact-registry-canvas/handovers/006-review-to-spek.md`.
- Sequence 6 has parent `epic16-story16-1-artifact-registry-canvas-H005`, sender Antigravity, receiver Codex, skill `review-to-spek`, and status `SUPERSEDED`.
- Sequence 7 exists at `.work/inter-agent/epic16-story16-1-artifact-registry-canvas/handovers/007-review-to-coding.md`.
- Sequence 7 has parent `epic16-story16-1-artifact-registry-canvas-H006`, sender Antigravity, receiver Cursor, skill `review-to-coding`, and status `DONE`.
- Sequence 8 exists at `.work/inter-agent/epic16-story16-1-artifact-registry-canvas/handovers/008-coding-to-review.md`.
- Sequence 8 has parent `epic16-story16-1-artifact-registry-canvas-H007`, sender Cursor, receiver Antigravity, skill `coding-to-review`, and status `DONE`.
- Sequence 9 exists at `.work/inter-agent/epic16-story16-1-artifact-registry-canvas/handovers/009-review-to-spek.md`.
- Sequence 9 has parent `epic16-story16-1-artifact-registry-canvas-H008`, sender Antigravity, receiver Codex, skill `review-to-spek`, and status `SUPERSEDED`.
- Sequence 10 exists at `.work/inter-agent/epic16-story16-1-artifact-registry-canvas/handovers/010-review-to-coding.md`.
- Sequence 10 has parent `epic16-story16-1-artifact-registry-canvas-H009`, sender Antigravity, receiver Cursor, skill `review-to-coding`, and status `DONE`.
- Sequence 11 exists at `.work/inter-agent/epic16-story16-1-artifact-registry-canvas/handovers/011-coding-to-review.md`.
- Sequence 11 has parent `epic16-story16-1-artifact-registry-canvas-H010`, sender Cursor, receiver Antigravity, skill `coding-to-review`, and status `DONE`.
- Sequence 12 exists at `.work/inter-agent/epic16-story16-1-artifact-registry-canvas/handovers/012-review-to-spek.md`.
- Sequence 12 has parent `epic16-story16-1-artifact-registry-canvas-H011`, sender Antigravity, receiver Codex, skill `review-to-spek`, and status `SUPERSEDED`.
- Sequence 13 exists at `.work/inter-agent/epic16-story16-1-artifact-registry-canvas/handovers/013-review-to-coding.md`.
- Sequence 13 has parent `epic16-story16-1-artifact-registry-canvas-H012`, sender Antigravity, receiver Cursor, skill `review-to-coding`, and status `DONE`.
- Sequence 14 exists at `.work/inter-agent/epic16-story16-1-artifact-registry-canvas/handovers/014-review-to-spek.md`.
- Sequence 14 has parent `epic16-story16-1-artifact-registry-canvas-H013`, sender Antigravity, receiver Codex, skill `review-to-spek`, and status `READY`.
- Sequence 15 exists at `.work/inter-agent/epic16-story16-1-artifact-registry-canvas/handovers/015-close.md`.
- Sequence 15 has parent `epic16-story16-1-artifact-registry-canvas-H014`, sender Codex, receiver `none`, skill `close-spek`, and status `CLOSED`.
- The workflow is `CLOSED`; no further handovers are required.
