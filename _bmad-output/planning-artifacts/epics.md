---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-post-merge-realign, step-05-audit-hygiene-2026-07-19]
inputDocuments: ['_bmad-output/planning-artifacts/prds/prd-bic-pptx-workflow-2026-07-10/prd.md', '_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md', '_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md']
last_realigned: '2026-07-19'
note: 'FR inventory + coverage map refreshed after close-audit-product-partials (FR-3/FR-4 Done). Remaining product Partials: FR-11 edit dual-path, FR-19 KJV corpus not in data/. See ../implementation-artifacts/deferred-work.md.'
---

# BIC Worship Presentation Automation - Epic Breakdown

## Overview

Epic/story breakdown for BIC Worship Presentation Automation. **PRD FR numbers are authoritative** (`prd.md`). Historical Epics 1–5 shipped the vertical slice; Epics 6–12 closed planned gap and phase stories on `main`. “All epics done” means **story keys**, not zero remaining FR Partials — see the FR Coverage Map and [`audit-code-doc-epic-bmad-flow-2026-07-19.md`](../implementation-artifacts/audit-code-doc-epic-bmad-flow-2026-07-19.md).

## Requirements Inventory

### Functional Requirements (PRD-aligned)

| ID | Summary | Phase |
|----|---------|-------|
| FR-1 | Ingest Rundown → Weekly Data Payload (Telegram / picoclaw → API; date upsert) | 1 |
| FR-2 | Validate/resolve Hymns by SDAH number | 1 |
| FR-3 | Persistent Announcement List (add/replace/remove) | 1 |
| FR-4 | Assemble Deck from Template Skeleton + payload (BIC blueprint) | 1 |
| FR-5 | Song Blocks with readable lyric slides (verse/Reff) | 1 |
| FR-6 | Render variable non-song Slide Types (theme, verse reading, sermon, family, etc.) | 1 |
| FR-7 | One selectable, elegant slide transition (none/cut/fade/dissolve/push; fade default) | 1 |
| FR-8 | List Services by date (+ list/detail for operators) | 1 |
| FR-9 | Slide-by-slide browser preview | 2 |
| FR-10 | Manual delete Service (full cleanup) | 1 |
| FR-10b | Auto-delete generated Decks by retention | 4 |
| FR-11 | Edit Service inputs via web form | 1 |
| FR-12 | Telegram correction path | 3 |
| FR-13 | Regenerate Service in place (≤ 5 min) | 1 |
| FR-13b | First-save-wins concurrency | 3 |
| FR-14 | Download offline-capable PPTX | 1 |
| FR-15 | Full-screen Web Slideshow | 2 |
| FR-16 | Dual-screen Presenter Mode | 5 |
| FR-17 | Full Order of Service Run-Sheet (browser) | 1 |
| FR-18 | Per-person accounts + Admin/Operator roles | 1 |
| FR-19 | On-demand Scripture Display (KJV) | 6 |

### Non-functional themes (from PRD §9 — not separately numbered in PRD)

- Presentation offline reliability  
- Generation performance (≤ 5 min)  
- Headless-safe rendering  
- Robust parsing (no silent failures)

### Architecture Decisions

- AD-1: Web presentation + PPTX offline (**Phase 1 ships PPTX-first**; web slideshow is Phase 2)
- AD-2: Single repository monolith (`src/` App Router)
- AD-3: Decoupled ingestion API (webhook JSON) vs presentation

### UX Design Requirements

UX-DR1: High-contrast UI on Tailwind / Shadcn defaults (as-built hub/run-sheet).

### FR Coverage Map (honest)

| FR | Primary epic | Status (2026-07-19 audit) |
|----|--------------|---------------------------|
| FR-1 | Epic 2 + Epic 6 | Done (webhook+upsert+readback; `.claude/skills/picoclaw-webhook/`) |
| FR-2 | Epic 2 | Done (695-hymn corpus) |
| FR-3 | Epic 6 | Done (persistent list; Announcements title gated on non-empty flyers) |
| FR-4 | Epic 3 + Epic 6 + Epic 7 | Done (Part A/B/C + Intercessory standing `#671`/`#684` pair) |
| FR-5 | Epic 3 | Done (verse/Reff splitter) |
| FR-6 | Epic 3 + Epic 6 + Epic 7 | Done (optional sermon/family graphic slots) |
| FR-7 | Epic 3 + `spec-transitions-and-blank-screen` | Done (configurable transition, PPTX + web from one table) |
| FR-8 | Epic 4 + Epic 6 + Epic 7 | Done (`GET /api/services?q=`) |
| FR-9 | Epic 8 | Done (slideshow preview) |
| FR-10 | Epic 5 | Done |
| FR-10b | Epic 10 | Done (`.cache/pptx/` retention) |
| FR-11 | Epic 5 | Partial (raw text + images edit; dual-path with Announcement List) |
| FR-12 | Epic 9 | Done (webhook `action: correct`) |
| FR-13 | Epic 5 | Done (re-parse / re-download) |
| FR-13b | Epic 9 | Done (`updated_at` / 409) |
| FR-14 | Epic 3 + Epic 7 | Done (download + Arial deploy note) |
| FR-15 | Epic 8 | Done (full-screen web slideshow) |
| FR-16 | Epic 11 | Done (presenter + projector BroadcastChannel) |
| FR-17 | Epic 4 + Epic 7 | Done (timings on Run-Sheet) |
| FR-18 | Epic 1 + Epic 6 | Done (per-person admin/operator) |
| FR-19 | Epic 12 | Partial (`import:kjv` + Presenter lookup; KJV corpus not committed under `data/`) |

## Epic List

### Epic 1–5 — Shipped story slices (historical)

See story files under `_bmad-output/implementation-artifacts/stories/`. Sprint marks these epics **done** for their story ACs.

### Epic 6: Phase 1 Gap Closure *(done — story keys)*

Closed planned Phase 1 gap stories (announcements, auth, blueprint, sections, picoclaw, tests, SSRF, deploy). FR-3/FR-4 product Partials closed by `spec-close-audit-product-partials`. Remaining **Partial** on the FR map: FR-11 edit dual-path, FR-19 corpus ops (not in `data/`).

**FRs addressed:** FR-1 (picoclaw skill), FR-3 (list), FR-4/6 fidelity, FR-18, hardening/tests

### Epics 7–12 — Phases 1 residuals + Phases 2–6 *(done — story keys)*

See stories `7-1`…`7-4`, `8-1`, `9-1`, `10-1`, `11-1`, `12-1` and `spec-7-1-phase1-residuals-through-phase6.md`. FR-19 remains Partial until KJV corpus commit/ops path is documented as complete.

### Epic 13: Hub UX + LiveServer gap *(done — retrospective)*

Retrospective BMAD for vibe-coded commits `acad206..458aa01` (plus local-upload alignment): LiveServer Docker/tunnel, shared Header/profile/dashboard search, hub-local announcement uploads. Spec: `spec-13-hub-ux-and-liveserver-gap.md`. Stories `13-1`…`13-3`. Amends 6.1/6.7 image-ref rules for `/api/uploads/...`.

Planning drift closed by Correct Course 2026-07-19 (`sprint-change-proposal-2026-07-19.md`): PRD / Architecture / UX as-built amended to follow code.

### Epic 14: Worship Web Input Boundary *(in-progress — Story 14.6)*

Retrospective BMAD for commit `b679ff7` closed Story `14-1`. Spec: `spec-worship-web-input/SPEC.md`. FR-11 Edit Service inputs via web form. Story `14-2` (UX refinements: Parse button, hymn autocomplete, unified raw input) reopened the epic via Correct Course (`sprint-change-proposal-14-2-ux.md`). Stories `14-3` (UI tweaks) and `14-4` (show→create-parity + shell; CAP-7/CAP-8) continue the epic from operator testing of `/services/[id]`. Story `14-5` (Sermon Card split + CAP-6 KJV resolve) from post-14.4 operator testing. Story `14-6` (remove Service Highlights, hymn number+title display, Announcement Flyers helper UX) from post-14.5 operator testing / SPEC companion revisions.

Planning drift for 14.1 closed by Correct Course 2026-07-19 (`sprint-change-proposal-2026-07-19.md`).

### Epic 15: Parser & Rendering Refinements (Phase 2) *(done — retrospective 2026-07-26)*

Refinements for lyric formatting, chorus placement logic, and service flow slide skips based on operator feedback.

### Story 15.1: Lyric Formatting and Service Flow Skips

As an operator,
I want lyrics formatted as continuous text, chorus injected after every verse, and unnecessary song titles skipped during prayer flow,
So that the generated PPTX flow is more seamless and lyric slides are easier to read.


### Story 14.1: Worship Web Input Forms & API

As an operator,
I want to create and edit service inputs via a web form,
So that I can customize worship details (family/youth photos, announcements) directly in the hub.

### Story 14.2: Worship Web Input UX Refinements

As an operator,
I want a unified raw text input with a manual parse trigger and autocomplete hymn dropdowns,
So that I can easily extract structured roles and select hymns without separate helper sidebars, and explicitly group UI sections.

### Story 14.3: Worship Web Input UI Tweaks

As an operator,
I want hymn labels, section nesting, Parse placement, and autocomplete fixed on create and edit forms,
So that the structured overlays match the intended layout after Story 14.2.

### Story 14.4: Service Page Create-Parity & Shell Stability

As an operator,
I want `/services/[id]` to present the same worship form as create (with a working edit/save path) plus Preview/Present/Delete/Download PPTX and Announcement Manage list, without Order of Service chrome and without header/width jumps,
So that opening an existing service feels like editing create — not a separate show/run-sheet.

### Story 14.5: Sermon Section Split & KJV Resolve

As an operator,
I want Sermon as its own form Card after Divine Worship (create and edit lockstep), and Resolve KJV to return scripture text when the corpus is imported,
So that section grouping matches the intended overlays and CAP-6 scripture lookup works during worship planning.

### Story 14.6: Worship Form UX Polish (Highlights, Hymn Labels, Announcement Help)

As an operator,
I want Service Highlights removed, hymn inputs that show number and title together, and clear Announcement Flyers usage guidance,
So that create/edit forms stay focused on Raw Rundown Text and I can pick hymns and manage flyers without confusion.

### Story 6.1: Persistent Announcement List

As an operator,  
I want a persistent Announcement List with add/replace/remove,  
So that weekly flyers follow FR-3 (not only per-service URL arrays).

### Story 6.2: Per-person Admin / Operator Auth

As a church admin,  
I want individual accounts with Admin and Operator roles,  
So that FR-18 is met beyond a shared Basic Auth password.

### Story 6.3: Deck Blueprint Fidelity

As an operator,  
I want the PPTX to follow BIC Part A/B/C payload rules more closely (theme verse from rundown, standing liturgy lyrics, family/youth, verse reading),  
So that FR-4 / FR-6 approach Sabbath-ready fidelity.

### Story 6.4: Section-aware Hymn Mapping

As the system,  
I want hymns assigned to Bible Talk vs Divine Service by section markers,  
So that atypical song counts do not mis-slot Song Blocks.

### Story 6.5: picoclaw Intake + Hymn Title Readback

As Events Department,  
I want picoclaw to call the webhook and receive resolved hymn titles / failed numbers,  
So that FR-1 Telegram round-trip is complete.

### Story 6.6: Automated Tests (parser / middleware / webhook)

As a maintainer,  
I want regression tests for auth, webhook, and rundown parsing,  
So that NFR-4 and story testing notes are covered.

### Story 6.7: Image URL Allowlist (SSRF Harden)

As the system,  
I want remote announcement image URLs restricted to an allowlist / safe download path (hub-local `/api/uploads/...` is a separate exception — Epic 13.3),  
So that open webhook/edit cannot SSRF via `addImage`.

### Story 6.8: Deploy + SQLite Production Hardening

As a maintainer,  
I want `DB_PATH`, WAL/busy timeout, and deploy notes for a single-node host (LiveServer Docker + tunnel + durable volumes — Epic 13.1),  
So that `better-sqlite3` is production-safe for BIC’s hosting choice.

### Epic 16: Slide Artifact Model Refactoring *(done — retrospective 2026-07-26)*

Rearchitect the slide plan from a flat `SlideKind` enum into a template-based Artifact model with placeholder resolution, including a canvas editor for layout definitions.

Delivered across Stories 16.1–16.5. Specs: `../specs/spec-slide-artifact-model/SPEC.md` (contract), `../implementation-artifacts/spec-16-2-artifact-pipeline-completion.md` (Stories 16.2–16.5). `epics-parallel-delivery-analysis.md`, which proposed an alternative 16.2–16.8 decomposition, is **superseded** — its AR19 reconciliation never happened, so this three-story breakdown remained authoritative.

### Story 16.1: Artifact Registry & Canvas Editor Foundation *(delivered)*
As an administrator,
I want a SQLite-backed Artifact Registry seeded from validated JSON, with 7 base types and a constrained canvas editor for existing templates,
So that global slide layouts can be safely edited and restored without deploying code changes (CAP-1, CAP-2, CAP-3, CAP-9).

### Story 16.2: buildSlidePlan Refactoring & Placeholder Resolution *(delivered)*
As the system,
I want `buildSlidePlan` to output `ArtifactInstance[]` and resolve dynamic placeholders (and standing defaults) from `ParsedRundown` and `SlidePlanMedia`,
So that the output feeds downstream consumers uniformly (CAP-4, CAP-7, CAP-8).

### Story 16.3: Unified Rendering across PPTX & Web Slideshow *(delivered)*
As the system,
I want PPTX (`pptx.ts`) and Web Slideshow (`SlideView.tsx`) to render directly from the positioned elements defined in the Artifact JSON,
So that layout changes apply instantly across both formats without hardcoded switch statements (CAP-6).

### Story 16.4: Live Slide Preview & Semantic Badges *(delivered)*
As an operator,
I want the Live Slide Preview to group children under parents (e.g. SongSets) and display semantic Artifact labels,
So that the preview accurately reflects the worship structure and Artifact taxonomy (CAP-5).

### Story 16.5: Canvas Element Authoring *(delivered)*
As an administrator,
I want to add and delete my own text boxes and shapes on an editable Artifact template,
So that layouts can be extended without a code change.

**Note:** seeded element IDs and any element marked `required` stay immutable — the save API rejects their removal or rename (400) and read-only base types (FullScreenImage, SongSet, Announcement) expose no add/delete affordances at all. Only elements authored in the editor may be deleted.

---

## Epic 1: System Foundation & Authentication *(shipped)*

### Story 1.1 / 1.2 — see `stories/` (done)

**Note:** Story 1.1 has a retrospective stub (`stories/1-1-next-js-foundation-and-monorepo-setup.md`). Story 1.2 delivered shared Basic Auth (architecture v1); full FR-18 → Story 6.2 (done).

## Epic 2: Data Ingestion & Processing *(shipped)*

### Story 2.1 / 2.2 — done (webhook + hymnal corpus)

**Note:** picoclaw skill completed in Story 6.5 (`.claude/skills/picoclaw-webhook/`).

## Epic 3: Presentation Assembly & PPTX Export *(shipped)*

### Story 3.1 — done; FR-4/6 fidelity → Story 6.3 / 6.4 / Epic 7 (Intercessory `#671`/`#684` closed)

## Epic 4: Web Hub & Operator Interface *(shipped for Phase 1 UI)*

### Story 4.1 — done (list + Shadcn run-sheet)

**Note:** FR-9/15/16/19 later shipped in Epics 8–12; not part of Epic 4’s original “done” claim.

## Epic 5: MVP Completion & Bug Fixes *(shipped)*

### Stories 5.1–5.4 — done

**Note:** 5.4 was per-service images MVP; FR-3 persistent list → Story 6.1 (empty-list Announcements title closed by `spec-close-audit-product-partials`).
