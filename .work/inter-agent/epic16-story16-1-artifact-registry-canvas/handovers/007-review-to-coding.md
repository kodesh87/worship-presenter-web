WORKFLOW_ID: epic16-story16-1-artifact-registry-canvas
HANDOVER_ID: epic16-story16-1-artifact-registry-canvas-H007
HANDOVER_SEQ: 7
PARENT_HANDOVER_ID: epic16-story16-1-artifact-registry-canvas-H006
SKILL: coding-to-review
HOST_FROM: Antigravity
HOST_TO: Cursor
STATUS: READY
CHAIN_STATE: .work/inter-agent/epic16-story16-1-artifact-registry-canvas/state.md
HANDOVER_FILE: .work/inter-agent/epic16-story16-1-artifact-registry-canvas/handovers/007-review-to-coding.md

GOAL NEXT HOST
Fix actionable deep adversarial review findings identified by Antigravity `/bmad-code-review`.

CURRENT STATE DELTA
- Antigravity conducted a strict adversarial review pass over the full Story 16.1 implementation.
- Discovered 2 new actionable `patch` findings in `ArtifactEditor.tsx` and `PUT /api/admin/artifacts/[id]` error handling.
- `state.md` updated to `AWAITING_CODE_FIX` status.

ORDERED SSOT + FINGERPRINTS
Unchanged from H006.

CODE/DIFF IDENTITY
- Baseline commit: `f34426f50b0ec5d793795226a066252cf80d2cb9`
- Code head (committed): `cca3b556b61f1e6446617f15fb381e5f8d6ce1b1`
- Working tree: contains uncommitted production changes in `src/components/admin/ArtifactEditor.tsx`.

REVIEW FINDINGS

[id: 6] [source: edge] [severity: high] [triage: patch] Fabric object flipping produces negative scale/dimensions (w/h), triggering HTTP 400 on Save
- Detail: Dragging scale handles across an object in Fabric sets scaleX/scaleY to negative values. In `serializeCanvas`, `width = obj.width * obj.scaleX` yields a negative `w`/`h` percentage. Server validator enforces `w > 0` and `h > 0` (`parsePositiveNumber`), causing Save requests to fail with HTTP 400.
- Location: src/components/admin/ArtifactEditor.tsx:137-145
- AC Impact: AC-16.1-006
- Required Fix: Apply `Math.abs()` to calculated width and height in `serializeCanvas` (or sanitize scaleX/scaleY) before converting to percentage.

[id: 7] [source: edge] [severity: medium] [triage: patch] `PUT /api/admin/artifacts/[id]` returns HTTP 500 when template is not in seed file
- Detail: `assertStableAgainstSeed` calls `getSeedTemplateById(id)`, which throws plain `new Error('Seed template not found: ...')`. Unlike `POST /reset/route.ts`, `PUT /route.ts` does not catch plain `Error` for seed template lookup failures, resulting in an uncaught exception and HTTP 500 Internal Server Error instead of HTTP 404.
- Location: src/app/api/admin/artifacts/[id]/route.ts:56-71 & src/lib/registry/seed.ts:32
- AC Impact: AC-16.1-003, AC-16.1-004
- Required Fix: Either throw `RegistryNotFoundError` inside `getSeedTemplateById` when a seed template is missing, or catch the seed lookup error in `PUT /route.ts` and return HTTP 404.

[id: 8] [source: blind] [severity: low] [triage: defer] Seed file disk re-reading and re-validation on every PUT request
- Detail: `getSeedTemplateById` calls `loadSeedTemplates()`, synchronously re-reading `data/default-registry.json` and re-validating all 28 templates on every single PUT request.
- Location: src/lib/registry/seed.ts:28-35

EXIT CRITERIA NEXT HOST
1. Implement fixes for finding ID 6 and finding ID 7.
2. Re-run verification gates (`npm test`, `npm run build`, `npm run lint`).
3. Return via `coding-to-review` (handover sequence 8).

REQUIRED NEXT HANDOVER
- `coding-to-review`

CONSTRAINTS
- Antigravity does not patch production code or modify product documentation.
