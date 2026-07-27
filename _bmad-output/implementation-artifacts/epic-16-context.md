# Epic 16 Context: Slide Artifact Model Refactoring

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Replace the flat, hardcoded slide-kind taxonomy with a template-based Artifact model, so that a worship slide's layout is data an administrator can edit rather than TypeScript a developer must redeploy. Today the same layout rules are duplicated across the planner, the PPTX exporter, the web slideshow, and the preview UI, which makes every visual tweak a code change and lets PPTX and web output drift apart. The epic introduces a runtime-editable Artifact Registry of named worship templates (Welcome, Verse Reading, Sermon, Family & Youth, and so on), a constrained canvas editor for those layouts, a slide plan that emits fully hydrated artifact instances, and renderers that simply draw what the hydrated layout instructs. The epic is complete when one saved layout edit drives PPTX, web slideshow, presenter, and preview output identically, with no renderer-specific layout branches, and with the existing worship structure, slide order, and visible content unchanged.

## Stories

- Story 16.1: Artifact Registry & Canvas Editor Foundation (done)
- Story 16.2: buildSlidePlan Refactoring & Placeholder Resolution
- Story 16.3: Unified Rendering across PPTX & Web Slideshow
- Story 16.4: Live Slide Preview & Semantic Badges

## Requirements & Constraints

- Every slide the planner emits must map to exactly one cataloged Artifact template or one declared child layout of a template; no slide may remain outside the taxonomy.
- Every template declares one of seven base types — General, TextPlaceholder, FullScreenImage, ImagePlaceholder, MixPlaceholder, SongSet, Announcement — which determines its placeholder rules, required layouts, and whether it is canvas-editable.
- The planner remains the single source of slide order. Its output shape may change, but for identical inputs the resulting slide sequence and visible content must match current behavior; parser behavior, the parsed rundown shape, the Part A/B/C structure, and hymn-splitting rules are all frozen.
- Standing content currently hardcoded in the planner (offering/tithe details, midweek prayer, fellowship etiquette, contact, default theme-verse reference and text) must be sourced from registry template defaults instead of code literals.
- Dynamic templates declare typed placeholder slots that the planner resolves from the parsed rundown and slide-plan media. Required values must be present for hydration to succeed; optional values fall back to their declared default or documented omission behavior.
- SongSet templates expand into ordered children: a title slide plus lyric slides, using separate title and lyric layout variants.
- The theme-verse artifact is always a TextPlaceholder; relying on its standing defaults must not change its base type.
- Layouts use a fixed 16:9 canvas with normalized percentage coordinates. Coordinates may fall outside 0–100 to preserve deliberate clipping inherited from the source deck; renderers convert to native units without clamping.
- Rendering must stay headless-safe and preserve supported fonts, images, backgrounds, and clipping across both output formats.
- Registry image references are restricted to bundled public assets, valid local upload references, or HTTP(S) URLs accepted by the existing image-safety policy; every bundled reference must resolve to a committed file.
- Registry templates are global across services; management surfaces are admin-only and re-check the account role from the database. Out of scope: per-service template customization, drag-and-drop reordering of artifacts, video elements, autosave, and any change to the worship service structure.
- Tests use the repository's existing runner conventions with temporary databases where a database is needed, and new test files must be registered explicitly in the package test list. Lint, build, and the full test suite must pass, and existing slide-plan tests must remain unchanged and green.
- Package manifest is version authority; anything touching framework APIs must follow the installed framework docs bundled in the dependency tree, not prior assumptions.

## Technical Decisions

- **Data-driven rendering.** Layout is a JSON AST stored in the registry, not logic in renderers. Adding a template built from existing element primitives must require zero renderer branches.
- **SQLite is the live registry; JSON is only a seed.** Startup inserts templates whose IDs are absent and never overwrites persisted edits. Reset restores a single selected template from the shipped seed. Schema changes follow the repository's startup-DDL pattern — no ORM, no migration framework.
- **Fat payload.** The planner hydrates everything — resolved text, image references, coordinates, fonts, colors — into artifact instances. Downstream consumers (PPTX, slideshow, presenter, preview) perform no registry lookups and no content reshaping of their own; the registry is read once, during planning.
- **Renderers are dumb consumers.** Both the PPTX exporter and the web slide view iterate positioned elements from the hydrated layout and translate them into their native units. Element primitives are text, image, image-placeholder, and shape, with a constrained style vocabulary (font family/size/color/weight/style, text and vertical alignment, contain/cover image fit, shape fill and opacity).
- **Stable identity.** Template, layout, element, and placeholder IDs are stable and internally consistent; required layouts, placeholders, and elements cannot be removed or renamed. Persisted templates carry a schema version.
- **Untrusted serialization.** Anything arriving from the canvas is validated server-side for structure, unknown fields, and image safety before persistence; client checks never substitute for that.
- **Optimistic concurrency.** Registry writes and resets carry a last-updated token and reject stale mutations, matching the repository's existing stale-write pattern.
- **Canvas state boundary.** The canvas library owns its own state through an uncontrolled React wrapper; React reads serialized state only on explicit save.

## UX & Interaction Patterns

- Registry administration lives on an admin-only settings surface that lists templates, marks read-only base types clearly, loads one template at a time into a fixed 16:9 canvas, and offers explicit save and reset with busy, success, validation-error, and stale-conflict feedback. Reset requires confirmation because it discards persisted customization.
- Live Slide Preview must identify slides by operator-recognizable Artifact labels (for example Welcome, Song Title, Song Lyric, Sermon Flyer, Family & Youth) rather than internal kinds, and must visually nest SongSet children under their parent so the preview mirrors the worship structure.
- Operator-facing surfaces (hub, run sheet, slideshow, presenter) keep the existing component and theming conventions of the shipped operator UI; this epic changes what they render, not how the shell looks.

## Cross-Story Dependencies

- Story 16.1 (registry persistence, seed, validation, admin APIs, minimal editor) is complete and is the prerequisite for everything else; it deliberately left the planner, renderers, and preview untouched.
- Story 16.2 is the linchpin: 16.3 and 16.4 both consume the hydrated artifact instance shape it defines, so that contract should be frozen before renderer or preview work begins.
- 16.3 and 16.4 are largely independent of each other once the hydrated shape exists, but both revalidate already-shipped behavior — PPTX fidelity, web slideshow, presenter mode, and preview — which act as regression boundaries rather than new scope.
- A parallel-delivery analysis proposes decomposing the post-16.1 work into a finer set of tracks (contract/conformance kit, hydration, separate web and PPTX renderer tracks, preview projection, then an integration and parity cutover). That decomposition is not yet reconciled into the epics file, sprint status, or spec companions, so treat the 16.2/16.3/16.4 numbering above as authoritative until that reconciliation happens.
