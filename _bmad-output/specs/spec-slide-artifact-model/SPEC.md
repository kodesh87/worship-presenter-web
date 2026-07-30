---
id: SPEC-slide-artifact-model
companions:
  - artifact-catalog.md
  - registry-contract.md
  - ../../planning-artifacts/prds/prd-bic-pptx-workflow-2026-07-10/prd.md
  - ../../planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md
  - ../../project-context.md
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability only.

# Slide Artifact Model

## Why

The current slide plan conflates content purpose with hardcoded renderer branches. Layout rules are repeated across `slide-plan.ts`, `pptx.ts`, `SlideView.tsx`, and preview UI, so a visual change requires TypeScript edits and can create PPTX/web drift. Operators instead think in reusable worship Artifacts such as Welcome, Verse Reading, Sermon, and Family & Youth. A runtime-editable Artifact Registry makes those templates explicit and lets an administrator change a layout without redeploying code.

## Capabilities

- **CAP-1**
  - **intent:** The system maintains a declarative registry of named worship Artifact templates and their layouts, placeholder schemas, defaults, and content strategies.
  - **success:** Every slide currently emitted by `buildSlidePlan` maps to exactly one cataloged Artifact or one declared child layout, and all shipped templates are available from the live registry after startup.

- **CAP-2**
  - **intent:** Every Artifact uses one of seven base types—General, TextPlaceholder, FullScreenImage, ImagePlaceholder, MixPlaceholder, SongSet, or Announcement—to declare its content and editing behavior.
  - **success:** Registry validation enforces the base-type rules in `registry-contract.md`, and the editor exposes only the controls allowed for that type.

- **CAP-3**
  - **intent:** An administrator can visually edit the layout of an existing canvas-editable Artifact template.
  - **success:** An administrator moves or resizes an element, changes supported text styling, saves, reloads `/admin/artifacts`, and sees the persisted layout; resetting that template restores its shipped seed.

- **CAP-4**
  - **intent:** `buildSlidePlan` produces fully hydrated `ArtifactInstance[]` values whose placeholders and layout coordinates are already resolved, while SongSet Artifacts expand into ordered title and lyric children.
  - **success:** One hydrated output supplies PPTX, slideshow, presenter, and preview consumers without consumer-side registry lookups or content reshaping.

- **CAP-5**
  - **intent:** Live Slide Preview identifies and groups slides using operator-recognizable Artifact labels.
  - **success:** Preview badges show labels such as Welcome, Song Title, Song Lyric, Sermon Flyer, and Family & Youth, with SongSet children visibly nested under their parent.

- **CAP-6**
  - **intent:** PPTX and web slideshow rendering consume positioned elements from the hydrated Artifact layout rather than per-kind layout branches.
  - **success:** The same layout change produces equivalent placement and styling in PPTX and web output, and a new registry template using existing element primitives requires no renderer branch.

- **CAP-7**
  - **intent:** The Artifact Registry owns standing content and dynamic-template defaults that are currently embedded in `slide-plan.ts`.
  - **success:** Offering, midweek, etiquette, contact, and default theme-verse content are loaded from registry templates; `buildSlidePlan` no longer owns those literals.

- **CAP-8**
  - **intent:** Dynamic Artifacts declare typed placeholder slots that `buildSlidePlan` resolves from `ParsedRundown` and `SlidePlanMedia`.
  - **success:** Required values are present before hydration succeeds, optional values use their declared default or omission behavior, and `BibleVerseContemplation` remains a TextPlaceholder whether it uses its standing default or a weekly override.

- **CAP-9**
  - **intent:** Registry management rejects unauthorized, unsafe, structurally invalid, or stale mutations.
  - **success:** Non-admin access is forbidden; malformed layouts, unsafe image references, removal of required elements, and stale writes are rejected without changing the persisted template.

## Constraints

- SQLite is the live Artifact Registry source of truth. `data/default-registry.json` is a startup seed that inserts missing template IDs only and never overwrites persisted administrator edits.
- Artifact templates are global across services. Registry management UI and HTTP APIs are admin-only and must re-check the account role from the database.
- Story 16.1 is limited to registry persistence, seed behavior, validation, admin APIs, and the minimal editor defined in `registry-contract.md`. It must not change `SlideKind`, `SlidePlanItem`, `buildSlidePlan`, slide order, PPTX rendering, web rendering, or preview badges.
- `buildSlidePlan` remains the single slide-order source. Story 16.2 may change its output shape, but the resulting sequence and visible content must match the current behavior for identical inputs.
- `ParsedRundown`, parser behavior, Part A/B/C structure, and existing hymn splitting rules remain unchanged.
- Layouts use a fixed 16:9 canvas with normalized percentage coordinates. Elements may extend beyond the canvas to preserve intentional clipping from the source deck; renderers convert the values into native units without clamping.
- Fabric.js owns canvas state through an uncontrolled wrapper; React reads serialized state only on explicit Save. Autosave is excluded.
- Canvas management is limited to existing seeded templates and elements. Required elements cannot be removed; Story 16.1 does not create or delete templates or elements.
- SongSet, FullScreenImage, and Announcement layouts are registry-defined but read-only in the Story 16.1 canvas. SongSet declares separate title and lyric layout variants.
- Registry image references must be bundled public assets, valid local upload references, or HTTP(S) references accepted by the existing image-safety policy.
- The committed `data/default-registry.json` is a v0 extraction baseline. Story 16.1 must transform it into the validated contract while preserving geometry/content evidence from `data/raw-slides.json` and `slides-new/*.jpg`; every bundled runtime asset reference in the resulting seed must resolve to a committed file.
- SQLite schema changes follow the repository startup-DDL pattern; no ORM or migration framework is introduced.
- `package.json` remains version authority. Implementation involving Next.js APIs must follow the installed Next.js documentation under `node_modules/next/dist/docs/`.

## Non-goals

- Real-time or automatic saving of canvas edits.
- Creation or deletion of Artifact templates or canvas elements in Story 16.1.
- Drag-and-drop reordering of worship Artifacts.
- Per-service template customization.
- Video elements.
- Changing the worship-service structure or slide sequence.
- A design-tool-grade canvas with arbitrary paths, masks, blending, or complex layer management.
- Migrating the planner, renderers, or preview as part of Story 16.1.

## Success signal

For Story 16.1, an administrator edits a seeded Welcome layout, saves it, reloads the editor, and observes the same persisted result; a stale, unauthorized, malformed, or unsafe mutation is rejected, and reset restores only Welcome from the shipped seed. Existing slide-plan behavior and tests remain unchanged. Epic 16 is complete when the same saved layout drives PPTX, web slideshow, presenter, and preview output without renderer-specific layout branches.

## Assumptions

- Registry save and reset use `updatedAt` optimistic concurrency and return HTTP 409 for stale mutations, matching the repository’s existing stale-write safety pattern.
