WORKFLOW_ID: epic16-story16-1-artifact-registry-canvas
HANDOVER_ID: epic16-story16-1-artifact-registry-canvas-H013
HANDOVER_SEQ: 13
PARENT_HANDOVER_ID: epic16-story16-1-artifact-registry-canvas-H012
SKILL: review-to-coding
HOST_FROM: Antigravity
HOST_TO: Cursor
STATUS: READY
CHAIN_STATE: .work/inter-agent/epic16-story16-1-artifact-registry-canvas/state.md
HANDOVER_FILE: .work/inter-agent/epic16-story16-1-artifact-registry-canvas/handovers/013-review-to-coding.md

GOAL NEXT HOST
Fix an async background-image loading race condition and memory leak in `ArtifactEditor.tsx` identified during an uncompromising adversarial code review pass.

CURRENT STATE DELTA
- Antigravity conducted a deep adversarial review pass over `ArtifactEditor.tsx`.
- Discovered 1 new actionable `patch` finding (ID 11) regarding an unhandled async race condition in `mountCanvas()` when loading `layout.backgroundImage`.
- `state.md` status changed to `AWAITING_CODE_FIX`.
- Sequence 12 (`review-to-spek`) is superseded by this handover.

ORDERED SSOT + FINGERPRINTS
Unchanged.

CODE/DIFF IDENTITY
- Baseline commit: `f34426f50b0ec5d793795226a066252cf80d2cb9`
- Code head (committed): `cca3b556b61f1e6446617f15fb381e5f8d6ce1b1`
- Working tree: contains uncommitted production changes in `src/components/admin/ArtifactEditor.tsx`, `src/lib/registry/seed.ts`, and `tests/registry.test.mjs`.

REVIEW FINDINGS

[id: 11] [source: edge] [severity: medium] [triage: patch] Async Background Image Loading Race Condition & Canvas Memory Leak
- Detail: In `mountCanvas()`, `fabric.FabricImage.fromURL(layout.backgroundImage, ...)` is awaited asynchronously. If the user rapidly switches selected templates or unmounts the editor while `fromURL()` is pending, `useEffect` cleanup executes and disposes `fabricCanvasRef.current`. When `fromURL()` completes, `mountCanvas()` resumes without checking `if (disposed)`. It proceeds to mutate the disposed canvas, add elements, and attach `selection:created` / `selection:updated` event listeners. Additionally, `removeSelectionListeners` in `useEffect` cleanup executes before `.then()` completes, leaving `removeSelectionListeners` as `undefined` and causing event listeners to leak on the disposed canvas instance.
- Location: `src/components/admin/ArtifactEditor.tsx` (lines 234–305)
- AC Impact: AC-16.1-006
- Required Fix:
  1. Add `if (disposed) { canvas.dispose(); return; }` immediately after `await fabric.FabricImage.fromURL(...)` in `mountCanvas()`.
  2. Ensure event listeners are attached and cleaned up synchronously with canvas lifecycle, or safely unbind listeners on `disposed` state.

EXIT CRITERIA NEXT HOST
1. Implement fix for finding ID 11 in `ArtifactEditor.tsx`.
2. Run test and build verification (`npm test`, `npm run build`).
3. Return via `coding-to-review` (sequence 14).

REQUIRED NEXT HANDOVER
- `coding-to-review`

CONSTRAINTS
- Antigravity does not patch production code or rewrite product documentation.
