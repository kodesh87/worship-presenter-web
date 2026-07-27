---
status: final
updated: 2026-07-23
---

# Architecture Spine: Epic 16 (Slide Artifact Model)

## Paradigm
**Data-Driven Presentation Rendering with a Decoupled Editor.** A shift from hardcoded switch-statements to a purely JSON-driven layout AST (Abstract Syntax Tree) where an Uncontrolled Canvas Editor manages the design, and the renderers (React Web & PptxGenJS) act as dumb consumers of pre-hydrated ASTs.

## Inherited Invariants (From `docs/architecture.md`)
- **Monolithic Next.js (App Router)**
- **SQLite WAL Mode Storage**
- **PptxGenJS for slide generation**
- **BroadcastChannel for synchronization**

## Architectural Decisions

### AD-1: Artifact Registry Storage
- **Rule:** The live Artifact Registry will be stored in SQLite. The filesystem JSON (`data/default-registry.json`) serves exclusively as a startup seed: startup inserts missing template IDs and never overwrites persisted administrator edits. Reset restores one selected template from that seed.
- **Binds:** Database schema and the Canvas Editor's save API.
- **Prevents:** Ephemeral data loss in Docker/Vercel and file-lock concurrency issues.

### AD-2: Slide Plan Data Flow (Fat Payload)
- **Rule:** `buildSlidePlan` outputs a fully hydrated AST (Fat Payload) with exact rendering coordinates, fonts, colors, and resolved text content.
- **Binds:** The `buildSlidePlan` return type and all downstream renderers.
- **Prevents:** The Web (`SlideView`) and PPTX renderers from performing independent database lookups or maintaining their own diverging layout logic.

### AD-3: Canvas State Boundary
- **Rule:** The Canvas Editor uses an Uncontrolled Wrapper pattern. Fabric.js owns the canvas state exclusively; React only reads state via `canvas.toJSON()` when the save button is clicked.
- **Binds:** The React-Fabric integration layer.
- **Prevents:** Two-way data binding lag, stuttering drags, and unnecessary React re-renders.

### AD-4: Global Template Administration
- **Rule:** Artifact templates are global across services. Registry management UI and APIs are admin-only and re-check the current account role from SQLite; downstream planners and renderers read the registry through server-side modules rather than the management API.
- **Binds:** `/admin/artifacts`, `/api/admin/artifacts/**`, and the registry access layer.
- **Prevents:** Per-service template drift and operator-level mutation of every service's visual contract.

### AD-5: Stable Layout Identity
- **Rule:** Layouts use a fixed 16:9 canvas with normalized percentage coordinates and stable template/layout/element/placeholder IDs. Coordinates may extend beyond the canvas to preserve intentional source-deck clipping. Canvas serialization is untrusted and must pass strict structural and image-reference validation before persistence.
- **Binds:** Seed data, save/reset validation, future hydration, and both renderers.
- **Prevents:** Unit-specific renderer drift, required-placeholder deletion, and unsafe image references.

## Deferred
- Specific SQLite column names and internal module decomposition are deferred to Story 16.1; observable persistence and API behavior are fixed by the SPEC companion `registry-contract.md`.
- Exact Canvas UI component layout (sidebar vs topbar) is a UX concern, not a structural invariant.
