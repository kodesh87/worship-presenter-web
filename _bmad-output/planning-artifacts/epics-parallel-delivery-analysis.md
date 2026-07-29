---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-bic-pptx-workflow-2026-07-10/prd.md
  - _bmad-output/planning-artifacts/prds/prd-bic-pptx-workflow-2026-07-10/addendum.md
  - _bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/architecture/architecture-epic-16/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/implementation-artifacts/sprint-status.yaml
  - _bmad-output/specs/spec-slide-artifact-model/SPEC.md
  - _bmad-output/specs/spec-slide-artifact-model/registry-contract.md
  - _bmad-output/specs/spec-slide-artifact-model/artifact-catalog.md
  - _bmad-output/implementation-artifacts/stories/16-1-artifact-registry-canvas-editor-foundation.md
  - _bmad-output/project-context.md
scope: "Future delivery after Story 16.1; current Story 16.1 workflow is analysis context only and remains untouched."
status: superseded
superseded_on: '2026-07-26'
superseded_by: '_bmad-output/implementation-artifacts/spec-16-2-artifact-pipeline-completion.md'
---

> **Superseded — historical record only.** This analysis proposed re-decomposing the post-16.1 work into Stories 16.2–16.8 delivered as a parallel wave across isolated worktrees. Its own AR19 required Codex to reconcile that numbering into the SPEC companions, architecture, `epics.md` and sprint status **before** any 16.2 coding handover; that reconciliation never happened, so the three-story decomposition in `epics.md` (16.2 hydration, 16.3 unified rendering, 16.4 semantic preview) remained authoritative and is what shipped, together with Story 16.5 (canvas element authoring) raised from operator feedback. Epic 16 closed on 2026-07-26 — see [`epic-16-retro-2026-07-26.md`](../implementation-artifacts/epic-16-retro-2026-07-26.md).
>
> The requirements inventory below (FR20–FR22, NFR1–NFR6, AR1–AR22) and the acceptance criteria for the finer tracks stayed useful as review input and are kept for traceability. Do not treat the Story 16.2–16.8 numbering as a live plan.

# BIC Worship Presentation Automation - Parallel Delivery Epic Breakdown

## Overview

This document analyzes and redesigns only the delivery work after Story 16.1. It preserves the active Story 16.1 workflow and decomposes future work into contract-first, independently testable deliverables that can use separate inter-agent workflows. The intended topology is a fan-out of non-overlapping implementation tracks followed by an explicit integration and parity gate.

## Requirements Inventory

### Functional Requirements

FR1: Ingest a Telegram Rundown through picoclaw into a structured Weekly Data Payload, upserting the Service by date and surfacing unmapped inputs.

FR2: Validate and resolve Hymns by SDAH number inside the app API, returning resolved titles and failures without sourcing lyrics from web search.

FR3: Maintain an ordered persistent Announcement List supporting keep, replace, remove, recurring, and one-off image items.

FR4: Assemble a complete Deck from the fixed Template Skeleton and Weekly Data Payload in the authoritative Part A/B/C order.

FR5: Render Song Blocks as a title plus readable verse/refrain lyric slides with structure-aware and readability-aware splitting.

FR6: Render variable non-song content including Verse Reading, sermon, sermon flyer, closing-prayer person, family/youth content, and announcements.

FR7: Apply one consistent fade transition across the generated Deck.

FR8: List and retrieve dated Services through authenticated UI and queryable list/detail APIs.

FR9: Preview the latest assembled Service slide-by-slide in the browser with visible incomplete-content indicators.

FR10: Delete a Service and its owned payload, generated Deck, participant text, and one-off assets while preserving recurring announcement items.

FR10b: Automatically delete only expired generated PPTX files according to an Admin-configured Retention Policy while preserving regenerable source data.

FR11: Edit a Service's Weekly Data Payload through the Web Hub and persist changes for regeneration.

FR11b: Create a Service from the Web Hub using Raw Rundown Text, structured overrides, images, collision protection, and Announcement List management.

FR12: Apply a Telegram correction to a confirmed target Service without guessing when the target is ambiguous.

FR13: Regenerate one Service in place from its current payload within the five-minute late-change window.

FR13b: Reject a stale concurrent edit with a conflict response instead of silently overwriting a newer save.

FR14: Download a complete PPTX that presents offline with correct slides, assets, fonts, and Service metadata.

FR15: Present one Service through a full-screen Web Slideshow with linear navigation and best-effort offline continuation after initial load.

FR16: Provide dual-screen Presenter Mode with a clean projector output and an operator view containing current/next slides, Run-Sheet, and participants.

FR17: Display the full Order of Service as an authenticated Run-Sheet with roles, names, songs, numbers, and timings.

FR18: Protect the Web Hub with individual Admin and Operator accounts and database-revalidated authorization.

FR19: Look up KJV scripture inside Presenter Mode, display it on the projector, and return to the unchanged Deck.

FR20: Maintain a live SQLite Artifact Registry seeded missing-only from validated JSON, with safe global admin editing and targeted reset. This is delivered by Story 16.1 and is a prerequisite rather than future parallel work.

FR21: Hydrate the canonical slide order into self-contained Artifact instances with resolved content, stable identity, exact layout data, and SongSet parent/child relationships.

FR22: Render the same hydrated Artifact instances through PPTX, Web Slideshow, Presenter Mode, and Preview without renderer-specific content reshaping or layout branches.

### NonFunctional Requirements

NFR1: Offline PPTX remains the load-bearing Sabbath reliability path and must require zero network access after download.

NFR2: Full Service generation and regeneration must fit within the five-minute late-change budget.

NFR3: Lyric and content rendering must remain readable and must not produce over-full slides.

NFR4: Rendering must be headless-safe and preserve supported fonts, images, backgrounds, clipping, and normalized 16:9 geometry.

NFR5: Parsing, hydration, validation, and rendering failures must be visible and testable; no input or Artifact may be silently dropped.

NFR6: Service data, member PII, registry management, and privileged actions must remain authenticated and role-gated.

### Additional Requirements

- AR1: Preserve the single-repository Next.js monolith and its thin-route/domain-module structure.
- AR2: Preserve decoupled JSON ingestion; presentation code must not depend directly on Telegram or picoclaw.
- AR3: Preserve durable host paths for SQLite, uploads, and PPTX cache in the LiveServer deployment.
- AR4: `buildSlidePlan` remains the single authority for slide order; migration may change its output shape but not observable order or content for identical inputs.
- AR5: Future planner output is a fully hydrated Artifact payload; renderers must not query the registry or independently reshape content.
- AR6: Artifact layouts use stable template/layout/element/placeholder IDs and normalized 16:9 coordinates, including intentional off-canvas values.
- AR7: SQLite remains the live Artifact Registry SSOT and seed JSON remains missing-only; future work must consume this boundary rather than duplicate it.
- AR8: PPTX and web rendering must implement the same supported element primitives and placement semantics.
- AR9: Existing parser behavior, ParsedRundown shape, SlidePlanMedia inputs, Part A/B/C structure, hymn splitting, and standing-content behavior remain compatible unless a later SPEC explicitly changes them.
- AR10: New tests use `node:test`, temporary databases where needed, explicit package test registration, and the repository's Next.js 16 guidance.
- AR11: Each future work item starts with its own `spek-to-coding` chain and follows coding-to-review, review remediation, review-to-spek, and close-spek gates.
- AR12: Parallel implementation is eligible only after a shared contract and fixture version is frozen; parallel tracks must not own the same production files or mutate another track's SSOT.
- AR13: Each parallel track must produce a standalone deliverable with focused tests that pass before integration.
- AR14: A dedicated integration story must remain blocked until every required upstream track is accepted against its exact review target.
- AR15: The integration story owns cross-track wiring, parity tests, regression gates, and cutover; individual component tracks must not perform premature end-to-end wiring.
- AR16: Work in this analysis begins after Story 16.1; the active Story 16.1 implementation, SSOT fingerprints, and handover chain are not modified.
- AR17: True simultaneous implementation requires one isolated Git branch and worktree per child workflow. A shared dirty working tree supports logical modularization only and is not eligible for concurrent Cursor implementation.
- AR18: A parent wave manifest must freeze the common baseline and contract fingerprints, register child workflow IDs and exclusive file ownership, and keep the integration workflow blocked until every required child has an accepted exact-target review and is merged into a reconstructable integration baseline.
- AR19: Before Story 16.2 receives a coding handover, Codex must reconcile the redesigned Story 16.2-16.8 scopes and numbering across the canonical SPEC companions, architecture, epics, sprint status, and dedicated story artifacts; this analysis does not silently supersede those SSOT files.
- AR20: Each parent-wave child advances through `PLANNED`, `READY`, `REVIEW_ACCEPTED`, `MERGED`, and `INTEGRATED` evidence states. Review acceptance alone does not imply merge or integration completion.
- AR21: If a child discovers that the frozen runtime contract or fixtures are insufficient, it must stop local contract invention, use `coding-to-spek`, and pause all affected wave eligibility until Codex resolves and re-fingerprints the shared contract.
- AR22: Structural parity manifests are necessary but insufficient. Integration evidence must include representative browser and PPTX visual checks for Welcome, Song Lyric, and Family & Youth covering geometry, clipping, hierarchy, and legibility without imposing pixel-perfect equality.

### UX Design Requirements

UX-DR1: Preserve the existing high-contrast Shadcn and Tailwind operator surface and shared Header conventions.

UX-DR2: Preserve the established Friday path from authentication through Service review, edit/regenerate, and PPTX download.

UX-DR3: Preserve the four distinct presentation paths: offline PPTX as primary, Web Slideshow, Presenter/Projector, and in-presenter Scripture display.

UX-DR4: Future preview semantics must use operator-recognizable Artifact labels and represent parent/child relationships such as SongSet without changing the linear presentation order.

### FR Coverage Map

FR1: Existing delivered baseline (Epics 2 and 6); protected as an Epic 16 ingestion regression boundary.

FR2: Existing delivered baseline (Epic 2); protected as an Epic 16 hymn-resolution regression boundary.

FR3: Existing delivered baseline (Epic 6); protected as an Epic 16 announcement hydration boundary.

FR4: Existing delivered baseline (Epics 3, 6, and 7); revalidated by Epic 16 output parity.

FR5: Existing delivered baseline (Epic 3); revalidated by Epic 16 SongSet hydration and rendering parity.

FR6: Existing delivered baseline (Epics 3, 6, and 7); revalidated by Epic 16 placeholder hydration and rendering parity.

FR7: Existing delivered baseline (Epic 3); protected by Epic 16 PPTX and web regression gates.

FR8: Existing delivered baseline (Epics 4, 6, and 7); unchanged by Epic 16.

FR9: Existing delivered baseline (Epic 8); upgraded by Epic 16 Stories 16.6 and 16.8 semantic Artifact preview.

FR10: Existing delivered baseline (Epic 5); unchanged by Epic 16.

FR10b: Existing delivered baseline (Epic 10); unchanged by Epic 16.

FR11: Existing partial baseline (Epics 5 and 14); Epic 16 must preserve current edit behavior but does not expand it.

FR11b: Existing delivered baseline (Epic 14); unchanged by Epic 16.

FR12: Existing delivered baseline (Epic 9); unchanged by Epic 16.

FR13: Existing delivered baseline (Epic 5); Stories 16.7 and 16.8 revalidate regeneration against the new Artifact pipeline.

FR13b: Existing delivered baseline (Epic 9); unchanged by Epic 16.

FR14: Existing delivered baseline (Epics 3 and 7); revalidated by Stories 16.5, 16.7, and 16.8 PPTX parity and offline gates.

FR15: Existing delivered baseline (Epic 8); revalidated by Stories 16.4, 16.7, and 16.8 web-renderer parity.

FR16: Existing delivered baseline (Epic 11); revalidated by Stories 16.4, 16.7, and 16.8 Presenter Mode compatibility.

FR17: Existing delivered baseline (Epics 4 and 7); unchanged by Epic 16.

FR18: Existing delivered baseline (Epics 1 and 6); protects Artifact administration and all existing authenticated surfaces.

FR19: Existing partial baseline (Epic 12); Epic 16 preserves the Presenter scripture overlay but does not close corpus operations.

FR20: Story 16.1 prerequisite; provides the accepted registry, seed, validation, persistence, API, and editor boundary.

FR21: Epic 16 Stories 16.2, 16.3, 16.7, and 16.8 - define, hydrate, integrate, and accept the canonical self-contained Artifact plan.

FR22: Epic 16 Stories 16.2, 16.4, 16.5, 16.6, 16.7, and 16.8 - define, implement, integrate, and accept consistent Artifact rendering across PPTX, Web Slideshow, Presenter Mode, and Preview.

## Epic List

### Epic 16: Editable Layouts Applied Consistently Everywhere

Administrators can edit one global Artifact layout and operators receive the same ordered, recognizable, and reliable presentation across downloaded PPTX, Web Slideshow, Presenter Mode, and Preview. The epic preserves current worship content and ordering while replacing renderer-specific layout behavior with a shared hydrated Artifact contract.

**Primary FRs covered:** FR21, FR22

**Existing behavior revalidated:** FR4, FR5, FR6, FR7, FR9, FR13, FR14, FR15, FR16

**Prerequisite:** Story 16.1 is accepted against its exact implementation target and its inter-agent workflow is closed.

**Delivery shape:** Establish and freeze the shared contract and conformance fixtures, register a parent wave manifest, then fan out non-overlapping independently testable implementation tracks into isolated Git branches/worktrees. Each child uses its own inter-agent workflow and exact review target. The integration workflow remains blocked until all required children are accepted and merged into one reconstructable baseline; it then owns parity, regression, wiring, and cutover. Technical tracks are stories within this user-value epic rather than separate technical-layer epics.

## Epic 16: Editable Layouts Applied Consistently Everywhere

Administrators can edit one global Artifact layout and operators receive the same ordered, recognizable, and reliable presentation across downloaded PPTX, Web Slideshow, Presenter Mode, and Preview.

### Story 16.2: Artifact Runtime Contract & Conformance Kit

As a maintainer,
I want a versioned runtime Artifact contract and representative conformance fixtures,
So that planner, PPTX, web, and preview tracks can be implemented independently without semantic drift.

**Acceptance Criteria:**

**Given** the accepted Story 16.1 registry contract
**When** the runtime Artifact types are defined
**Then** they represent stable instance identity, template identity, semantic label, base type, resolved layout, positioned elements, and optional parent/child relationships
**And** the contract is versioned and renderer-neutral.

**Given** a hydrated Artifact instance
**When** any downstream consumer receives it
**Then** no unresolved placeholder, registry lookup, standing-content lookup, or content reshaping is required
**And** invalid or unsupported contract versions fail visibly (NFR5).

**Given** a SongSet fixture
**When** it is read through the contract
**Then** it preserves one semantic parent with ordered title/lyric children
**And** each renderable child has stable identity and fully resolved elements.

**Given** the existing slide-plan behavior and registry catalog
**When** the conformance corpus is created
**Then** it covers General, TextPlaceholder, FullScreenImage, ImagePlaceholder, MixPlaceholder, SongSet, and Announcement behavior
**And** includes standing content, optional omission, off-canvas geometry, empty announcements, multiple announcements, and real hymn/lyric cases.

**Given** the planned parallel tracks
**When** Story 16.2 registers its tests
**Then** it pre-allocates separate hydration, web-renderer, PPTX-renderer, and preview conformance test files in `package.json`
**And** every file already contains passing contract/fixture assertions that its future owner can extend without modifying another track's test file.

**Given** Story 16.2 implementation ownership
**When** its production and test changes are inspected
**Then** changes are limited to `src/lib/artifacts/runtime-contract.ts`, `tests/fixtures/artifacts/**`, the initial conformance content of the four pre-allocated track test files, and their `package.json` registration
**And** future parallel tracks consume the contract and fixtures read-only.

**Given** Story 16.2 has an accepted exact-target review
**When** the parallel wave is prepared
**Then** Codex records a parent wave manifest containing the common baseline, frozen contract and fixture fingerprints, child workflow IDs, isolated branch/worktree identities, exclusive ownership, and join prerequisites
**And** no child `spek-to-coding` handover becomes `READY` until the inter-agent protocol explicitly supports and validates those fields.

**Given** the redesigned Story 16.2-16.8 scopes
**When** Story 16.2 is prepared for coding
**Then** the canonical SPEC companions, architecture, epics, sprint status, and dedicated story artifacts use the same numbering, boundaries, dependencies, and fingerprints
**And** any older three-story decomposition is explicitly superseded rather than left as competing guidance.

**Given** Story 16.2 is complete
**When** repository gates run
**Then** focused contract tests, `npm test`, `npm run lint`, and `npm run build` pass
**And** `buildSlidePlan`, PPTX, Web Slideshow, Presenter Mode, and Preview retain their current behavior.

### Story 16.3: Canonical Artifact Plan Hydration

As an operator,
I want each Service converted into a fully resolved Artifact plan without changing its worship flow,
So that every presentation surface receives the same correct slides and content.

**Acceptance Criteria:**

**Given** the accepted runtime contract and Story 16.1 registry
**When** a Service is hydrated from `ParsedRundown` and `SlidePlanMedia`
**Then** the result is a valid ordered Artifact hierarchy
**And** its renderable children preserve the current slide order and visible content.

**Given** General, text, image, mixed, and announcement templates
**When** their instances are hydrated
**Then** all required placeholders are resolved before success
**And** optional values follow declared default-or-omission behavior without silent data loss.

**Given** standing slides and `BibleVerseContemplation`
**When** the Artifact plan is generated
**Then** standing text and default verse content come from registry templates
**And** the new hydrator does not introduce another hardcoded copy.

**Given** weekly and standing SongSets
**When** they are hydrated
**Then** existing hymn splitting, refrain repetition, labels, title inclusion/omission, and ordering are preserved
**And** the SongSet parent contains stable ordered title/lyric children, preserving readability requirements (NFR3).

**Given** missing required content, an unknown template, or an invalid registry record
**When** hydration runs
**Then** it fails visibly with attributable diagnostic information
**And** no partial Artifact plan is returned as successful.

**Given** this track's exclusive ownership
**When** its diff is inspected
**Then** it changes only a new Artifact hydration module and `tests/artifact-hydration.test.mjs`
**And** it treats the runtime contract, fixtures, registry implementation, current renderers, and current entry points as read-only.

**Given** the frozen contract or fixture corpus cannot express a required hydration behavior
**When** the gap is discovered
**Then** the child stops without creating a private extension and issues `coding-to-spek` with evidence and impact
**And** the parent wave pauses affected child and join eligibility until the shared contract is resolved and re-fingerprinted.

**Given** hydration tests using representative empty, typical, optional, standing-hymn, long-lyric, image, and announcement cases
**When** focused and repository gates run
**Then** the hydrated output passes contract validation and legacy-order/content parity assertions
**And** `npm test`, `npm run lint`, and `npm run build` pass without changing current presentation behavior.

### Story 16.4: Fixture-Driven Web Artifact Renderer

As an operator,
I want hydrated Artifact slides rendered faithfully in the browser,
So that edited layouts appear consistently in Web Slideshow and Presenter Mode after integration.

**Acceptance Criteria:**

**Given** a renderable Artifact fixture
**When** the Web Artifact Renderer receives it
**Then** it renders a fixed 16:9 slide using only the resolved runtime contract
**And** it performs no registry lookup, placeholder resolution, or content reshaping.

**Given** a layout with background color or background image
**When** it is projected to browser styles
**Then** the background fills the slide according to the contract
**And** bundled, uploaded, and approved remote image references retain their resolved source.

**Given** text, image, image-placeholder, and shape elements
**When** they are rendered
**Then** supported typography, alignment, fill, opacity, object-fit, and z-order semantics are preserved
**And** unsupported element variants fail visibly rather than disappearing silently.

**Given** normalized geometry including negative or greater-than-100 coordinates
**When** it is converted to CSS placement
**Then** percentage geometry remains proportional to the 16:9 viewport
**And** intentional off-canvas placement is preserved without clamping (NFR4).

**Given** a SongSet parent or another non-renderable grouping node
**When** the renderer is invoked
**Then** only its ordered renderable children produce slides
**And** semantic parent/child identity remains available for later preview integration.

**Given** this track's exclusive ownership
**When** its diff is inspected
**Then** it changes only new web-render-model and Artifact slide component files plus `tests/artifact-web-renderer.test.mjs`
**And** it does not modify `SlideView.tsx`, slideshow pages, presenter components, the runtime contract, fixtures, registry, hydrator, or PPTX code.

**Given** the frozen contract or fixture corpus cannot express a required Web rendering behavior
**When** the gap is discovered
**Then** the child stops without creating a private extension and issues `coding-to-spek` with evidence and impact
**And** the parent wave pauses affected child and join eligibility until the shared contract is resolved and re-fingerprinted.

**Given** the conformance fixture corpus
**When** focused rendering tests and repository gates run
**Then** deterministic markup/style assertions cover every supported primitive, geometry boundary, background mode, and SongSet child
**And** `npm test`, `npm run lint`, and `npm run build` pass while existing browser presentation behavior remains unchanged.

### Story 16.5: Fixture-Driven PPTX Artifact Renderer

As an operator,
I want hydrated Artifact slides rendered faithfully into PPTX,
So that edited layouts remain available in the reliable offline Sabbath presentation path after integration.

**Acceptance Criteria:**

**Given** a renderable Artifact fixture
**When** the PPTX Artifact Renderer receives it
**Then** it creates one PPTX slide using only resolved runtime data
**And** it performs no registry lookup, placeholder resolution, or content reshaping.

**Given** normalized 16:9 geometry
**When** positions and sizes are converted to PPTX units
**Then** the conversion is deterministic and proportional to the widescreen slide dimensions
**And** negative or greater-than-slide coordinates remain unclamped.

**Given** text, image, image-placeholder, and shape elements
**When** they are rendered
**Then** supported typography, alignment, fill, opacity, object-fit, and z-order semantics map to PptxGenJS operations
**And** unsupported element variants produce attributable failures.

**Given** bundled assets, local uploads, and approved remote images
**When** a PPTX is generated headlessly
**Then** available images are embedded into the output
**And** missing or unreadable images produce an explicit fallback or failure instead of an invisible omission (NFR1, NFR4).

**Given** equivalent Web and PPTX conformance fixtures
**When** their renderer projection models are compared
**Then** they expose equivalent element identity, ordering, geometry, content, and supported styling semantics
**And** platform-specific units do not alter the shared contract.

**Given** this track's exclusive ownership
**When** its diff is inspected
**Then** it changes only new PPTX Artifact renderer files plus `tests/artifact-pptx-renderer.test.mjs`
**And** it does not modify `pptx.ts`, download routes, the runtime contract, fixtures, registry, hydrator, Web renderer, or preview code.

**Given** the frozen contract or fixture corpus cannot express a required PPTX rendering behavior
**When** the gap is discovered
**Then** the child stops without creating a private extension and issues `coding-to-spek` with evidence and impact
**And** the parent wave pauses affected child and join eligibility until the shared contract is resolved and re-fingerprinted.

**Given** the fixture corpus and temporary output paths
**When** focused renderer tests and repository gates run
**Then** generated commands or PPTX archive evidence covers every primitive, geometry boundary, background mode, image mode, and SongSet child
**And** `npm test`, `npm run lint`, and `npm run build` pass while current PPTX output remains unchanged.

### Story 16.6: Semantic Artifact Preview Projection

As an operator,
I want preview entries grouped and labeled using worship terminology,
So that I can understand the Service structure without interpreting internal slide kinds.

**Acceptance Criteria:**

**Given** a hydrated Artifact hierarchy
**When** the preview projection is created
**Then** every renderable slide receives its operator-facing Artifact label and stable linear slide index
**And** labels come from the runtime contract rather than a renderer-specific kind mapping.

**Given** a SongSet with title and lyric children
**When** it appears in preview
**Then** one recognizable parent group contains its ordered child slides
**And** child badges distinguish Song Title and Song Lyric while preserving presentation order.

**Given** repeated templates, standing SongSets, announcements, and optional omitted Artifacts
**When** preview groups are built
**Then** instance identity prevents unrelated items from being merged
**And** omitted content does not create empty or misleading groups.

**Given** semantic preview fixtures
**When** the preview component renders
**Then** hierarchy, labels, current-selection state, and slide numbering remain clear using existing high-contrast UI conventions
**And** the component does not need registry access or content reshaping (UX-DR1, UX-DR4).

**Given** this track's exclusive ownership
**When** its diff is inspected
**Then** it changes only new preview-model and Artifact preview component files plus `tests/artifact-preview.test.mjs`
**And** it does not modify current preview consumers, `SlideView.tsx`, slideshow/presenter pages, the runtime contract, fixtures, registry, hydrator, or either renderer.

**Given** the frozen contract or fixture corpus cannot express a required preview hierarchy or identity behavior
**When** the gap is discovered
**Then** the child stops without creating a private extension and issues `coding-to-spek` with evidence and impact
**And** the parent wave pauses affected child and join eligibility until the shared contract is resolved and re-fingerprinted.

**Given** empty, repeated, SongSet, standing-hymn, announcement, and mixed Artifact fixtures
**When** focused preview tests and repository gates run
**Then** grouping, labels, indexes, ordering, and omission behavior pass deterministic assertions
**And** `npm test`, `npm run lint`, and `npm run build` pass while the current preview remains unchanged.

### Story 16.7: Artifact Pipeline Cutover & Dual-Renderer Parity

As an operator,
I want browser and PPTX presentations generated from the same hydrated Artifact plan,
So that layout and content remain consistent across online and offline presentation paths.

**Acceptance Criteria:**

**Given** the parent wave manifest
**When** Story 16.7 eligibility is evaluated
**Then** Stories 16.3, 16.4, and 16.5 each have an accepted exact-target review and parent-wave state `REVIEW_ACCEPTED`
**And** their accepted heads are merged into one reconstructable integration baseline, recorded as `MERGED`, with the frozen Story 16.2 contract fingerprint.

**Given** any missing review, merge conflict, changed contract fingerprint, or unmerged child target
**When** integration is requested
**Then** Story 16.7 remains blocked
**And** the discrepancy is routed to the owning child workflow rather than guessed around.

**Given** identical Service inputs
**When** the production slide plan is built after cutover
**Then** `buildSlidePlan` returns the canonical hydrated Artifact hierarchy
**And** flattened renderable slides retain legacy order, visible content, conditional omissions, hymn flow, and stable semantic identity.

**Given** the hydrated production plan
**When** Web Slideshow, Presenter Mode, and PPTX generation run
**Then** they delegate to the accepted Web and PPTX Artifact renderers
**And** no consumer performs registry lookup, placeholder resolution, or per-kind content reshaping.

**Given** equivalent Web and PPTX output
**When** normalized render manifests are compared
**Then** slide identity, count, order, text, images, geometry, z-order, and supported styles match within declared platform tolerances
**And** mismatches fail an attributable parity test.

**Given** current presentation features
**When** the new pipeline is used
**Then** fade transitions, slideshow navigation, Presenter/Projector synchronization, scripture overlay, incomplete-content visibility, and offline PPTX behavior remain functional
**And** obsolete layout switch branches and standing-content literals are removed only after parity passes (UX-DR3, NFR1).

**Given** this join story's ownership
**When** its diff is inspected
**Then** it owns production wiring in `slide-plan.ts`, `pptx.ts`, `SlideView.tsx`, slideshow/presenter consumers, and integration/parity tests
**And** accepted child modules are changed only for integration defects recorded against the integration target.

**Given** representative Services and a persisted non-default layout
**When** focused integration tests, `npm test`, `npm run lint`, `npm run build`, PPTX inspection, and browser verification run
**Then** both renderers reflect the same saved layout without ordering/content drift
**And** Welcome, Song Lyric, and Family & Youth visual checks confirm geometry, clipping, hierarchy, and legibility while full regeneration remains inside the existing five-minute budget (NFR2).

### Story 16.8: Semantic Preview Integration & Epic Acceptance

As an operator,
I want the live preview to explain the Artifact structure and match every presentation output,
So that I can verify a Service confidently before downloading or presenting it.

**Acceptance Criteria:**

**Given** the parent wave manifest
**When** Story 16.8 eligibility is evaluated
**Then** Stories 16.6 and 16.7 have accepted exact-target reviews and parent-wave state `REVIEW_ACCEPTED`
**And** their accepted heads are recorded as `MERGED` with the frozen runtime contract still intact.

**Given** an incomplete upstream merge, unresolved integration finding, or contract fingerprint change
**When** preview integration is requested
**Then** Story 16.8 remains blocked
**And** the issue is returned to its owning workflow.

**Given** the preview API receives valid create or edit form data
**When** it builds the Artifact plan
**Then** its response preserves semantic parents, ordered renderable children, labels, and stable flattened slide indexes
**And** it exposes no unresolved placeholders or internal registry data.

**Given** Create and Edit live-preview surfaces
**When** an operator previews a Service
**Then** both use the accepted semantic preview model/component
**And** SongSets are grouped with Song Title/Song Lyric children while other Artifacts retain recognizable labels and presentation order.

**Given** repeated templates, optional omissions, announcements, standing hymns, and incomplete content
**When** preview entries render
**Then** identity, badges, grouping, numbering, selection, and error visibility remain correct
**And** existing high-contrast and responsive form behavior is preserved.

**Given** an administrator saves a non-default editable layout
**When** an operator regenerates or previews a representative Service
**Then** Live Preview, Web Slideshow, Presenter/Projector, and generated PPTX all reflect the same accepted layout and content
**And** targeted reset restores the shipped layout consistently across those surfaces, with Welcome, Song Lyric, and Family & Youth visual evidence retained for final review.

**Given** the established Friday operator journey
**When** Epic 16 is exercised end to end
**Then** authentication, Service review, edit, regeneration, preview, and PPTX download remain available in their existing sequence
**And** the Artifact migration introduces no new operator-only setup step (UX-DR2, NFR6).

**Given** this final integration story's ownership
**When** its diff is inspected
**Then** it owns `/api/services/preview`, Create/Edit preview wiring, preview integration tests, and removal of obsolete badge/kind mappings
**And** it does not introduce a second preview projection or renderer-specific Artifact taxonomy.

**Given** the complete Epic 16 implementation
**When** focused tests, `npm test`, `npm run lint`, `npm run build`, browser verification, PPTX inspection, and the five-minute regeneration check run
**Then** all FR21/FR22, affected regression requirements, and UX-DR4 evidence pass
**And** the parent wave reaches `INTEGRATED` only after exact-target Antigravity acceptance, with enough evidence for subsequent `close-spek`.
