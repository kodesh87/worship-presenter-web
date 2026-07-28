WORKFLOW_ID: epic16-story16-1-artifact-registry-canvas
HANDOVER_ID: epic16-story16-1-artifact-registry-canvas-H001
HANDOVER_SEQ: 1
PARENT_HANDOVER_ID: none
SKILL: spek-to-coding
HOST_FROM: Codex
HOST_TO: Cursor
STATUS: READY
CHAIN_STATE: .work/inter-agent/epic16-story16-1-artifact-registry-canvas/state.md
HANDOVER_FILE: .work/inter-agent/epic16-story16-1-artifact-registry-canvas/handovers/001-spek-to-coding.md

GOAL NEXT HOST
Implement Story 16.1 so AC-16.1-001 through AC-16.1-010 have code and test evidence: a validated SQLite registry, missing-only v1 seed, admin-only APIs, and constrained Fabric.js editor, with no existing slide-plan/rendering drift.

CURRENT STATE DELTA
- Created the Story 16.1 product contract with ten stable ACs and status `ready-for-dev`.
- Re-derived `SPEC.md` from append-only `.memlog.md`; retained CAP-1 through CAP-9.
- Added normative `registry-contract.md` and reconciled `artifact-catalog.md`.
- Reconciled architecture and epic wording with SQLite-live / JSON-seed semantics and admin-only global templates.
- Added Epic 16 / Story 16.1 to sprint tracking.
- Audited current code and committed v0 extraction; no production code was changed by Codex.

ORDERED SSOT + FINGERPRINTS
1. `_bmad-output/specs/spec-slide-artifact-model/SPEC.md` — `0012013b7edd2b5e33e5e395be1acda7ab3a6099`
2. `_bmad-output/specs/spec-slide-artifact-model/registry-contract.md` — `3bb69a5250f35a1084008cb7e4f62bc4a5ef5712`
3. `_bmad-output/specs/spec-slide-artifact-model/artifact-catalog.md` — `d1021412c785c37150fde60d6055f0f13821b892`
4. `_bmad-output/implementation-artifacts/stories/16-1-artifact-registry-canvas-editor-foundation.md` — `15ec65f0ec478ab65352aab05a81c22c38e89fe6`
5. `_bmad-output/planning-artifacts/architecture-epic-16/ARCHITECTURE-SPINE.md` — `1207d3d916c1fc7b6d3931ab0176a36b560ddf5f`
6. `_bmad-output/project-context.md` — `e6ece93afca70cc36bccc165dd87b183da6a999f`
7. `package.json` — `b69aa9595acb74cf0d2ab6b5ec6e1673558df004`
8. `_bmad-output/planning-artifacts/epics.md` — `d1d875576e3702ba9d9becb66a9ce9f90fad3f73`
9. `_bmad-output/implementation-artifacts/sprint-status.yaml` — `5d3c45541176443b6d48ae434d966363920279f1`

LOCKED KNOWLEDGE
- Decisions: SQLite is live SSOT; JSON seed inserts missing IDs only; templates are global/admin-only; exact admin routes are locked; Fabric.js uses an uncontrolled 16:9 canvas with explicit Save; normalized percentage coordinates may extend off-canvas; existing templates/elements only; read-only types are FullScreenImage, SongSet, Announcement; `BibleVerseContemplation` is TextPlaceholder; SongSet has title/lyric layouts; reset is one-template only; unsafe/invalid/stale mutations do not persist.
- Scope/non-goals: Implement registry/seed/validation/auth/APIs/editor/tests/assets only. Do not migrate `buildSlidePlan`, standing constants, PPTX/web rendering, presenter, or preview; do not add template/element creation, autosave, per-service templates, reordering, video, or a general design tool.
- Assumptions/constraints: Save/reset use `updatedAt` and 409 on stale state. Preserve source off-canvas geometry. Bundled seed asset paths must resolve to committed files. Source PPTX files are extraction-only and cannot become runtime/test dependencies. Cursor must read relevant installed Next.js docs before route/page changes and must not edit product documentation.

TRACEABILITY DELTA
- AC-16.1-001 → specified: durable SQLite missing-only seed behavior.
- AC-16.1-002 → specified: complete v1 registry, seven base types, catalog coverage, stable IDs, SongSet variants, committed assets.
- AC-16.1-003 → specified: DB-revalidated admin-only page and exact API routes.
- AC-16.1-004 → specified: strict structure, identity, image, and unknown-template validation.
- AC-16.1-005 → specified: `updatedAt` optimistic concurrency and 409.
- AC-16.1-006 → specified: minimal uncontrolled Fabric.js editor and UI feedback.
- AC-16.1-007 → specified: save/reload persistence and targeted reset.
- AC-16.1-008 → specified: read-only base types and stable required IDs.
- AC-16.1-009 → specified: no existing slide behavior drift.
- AC-16.1-010 → specified: Node tests plus test/lint/build and Next.js-doc gate.

CODE/DIFF IDENTITY
- Baseline: `f34426f50b0ec5d793795226a066252cf80d2cb9`
- Head: `f34426f50b0ec5d793795226a066252cf80d2cb9` plus current user-owned documentation/workflow working-tree changes.
- Diff source: initial production diff is empty; reconstruct with `git diff -- src tests package.json package-lock.json data scripts public`.

VERIFICATION EVIDENCE
- BMad Spec coherence pass: pass — CAP-1 through CAP-9 have stable IDs and intent/success pairs.
- BMad Spec preservation pass: pass — approved defaults, current code boundaries, source geometry, v0 seed transformation, security rules, and non-goals are preserved.
- Product-document `git diff --check`: pass — no whitespace errors; line-ending warnings only.
- Initial production-code diff check: pass — no modified paths under `src tests package.json package-lock.json data scripts public`.
- V0 seed audit: pass with expected implementation gap — 25 templates, five represented base types, separate SongSet entries, incomplete catalog coverage, invalid/duplicate mappings, and missing `/public/assets` targets are explicitly routed into AC-16.1-002/004.
- `npm test`: not run — documentation/specification phase only.
- `npm run lint`: not run — documentation/specification phase only.
- `npm run build`: not run — documentation/specification phase only.

OPEN ITEMS / DEVIATIONS / RISKS
- Transform the committed v0 `data/default-registry.json` rather than treating it as already valid.
- Use `data/raw-slides.json`, `slides-new/*.jpg`, `scripts/build-registry.mjs`, and the locally available source deck as extraction evidence; commit required reusable runtime assets, not the source deck.
- Some extracted positions exceed the canvas bounds intentionally; do not clamp them.
- Fabric.js is not installed; choose a release compatible with current `package.json`.
- Preserve all user-owned dirty worktree changes outside Cursor's implementation boundary.

EXIT CRITERIA NEXT HOST
1. Implement every Story 16.1 AC without editing product documentation.
2. Populate AC → implementation → test evidence in `state.md`.
3. Run and record `npm test`, `npm run lint`, and `npm run build`, plus the required editor demonstration.
4. Record exact baseline/head/diff identity and all deviations or residual risks.
5. If implementation is review-ready, create `coding-to-review`; if a material upstream decision blocks implementation, create `coding-to-spek` with evidence and options.

REQUIRED NEXT HANDOVER
- `coding-to-review` when the exact implementation target is review-ready.
- `coding-to-spek` only for a genuine upstream specification/design blocker.

CONSTRAINTS
- Do not trigger BMAD skills except `/bmad-code-review` in Antigravity or another skill explicitly requested/approved by the user.
- Read CHAIN_STATE and HANDOVER_FILE before acting; do not rely on chat summary alone.
