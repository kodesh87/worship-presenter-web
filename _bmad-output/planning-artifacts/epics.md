---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-post-merge-realign, step-05-audit-hygiene-2026-07-19, step-06-correct-course-2026-07-29, step-07-correct-course-2026-08-01, step-08-correct-course-2026-08-01-locale, step-09-correct-course-2026-08-01-input-model]
inputDocuments: ['_bmad-output/planning-artifacts/prds/prd-bic-pptx-workflow-2026-07-10/prd.md', '_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md', '_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md', '_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md']
last_realigned: '2026-08-01'
note: 'SECOND Correct Course of 2026-08-01 (sprint-change-proposal-2026-08-01-locale.md), run hours after the first: language becomes two explicit axes. FR-24 (Data Locale as a browsable axis; the default filters the view, never the query) and FR-25 (UI Locale) added to the PRD as new section 4.12; a third projection_locale was proposed and REJECTED. FR-22 and FR-23 amended for the locale axis rather than rewritten. The corpus paths move to data/<locale>/bible-translation/<code>.json and data/<locale>/song-book/<code>.json, superseding IN WRITING the paths done Stories 21.1 and 22.1 assert. FR-24 is delivered by AMENDING Epics 21 and 22 rather than by a new epic -- each corpus family already owns its own table and code, and a separate locale epic would touch both, which is exactly what the per-family cut below exists to prevent. Only Epic 24 (UI Locale) is new. Target schema routed to bmad-architecture, not decided here. PRIOR, first pass of the same day: Epics 21-23 opened for the shipped-corpus gap, cut per data family so each epic owns its feature AND its data and no table is touched twice -- 21 scripture, 22 song book, 23 fresh clone. FR-21 backfilled into the inventory and coverage map (committed to the PRD 2026-07-30, absent here since); FR-22 and FR-23 added for several Bible translations and several song books, each with one configurable default whose shipped corpus is committed seed data. FR-2 moved Done to Partial on measurement, not regression. Two obligations route out of this pass: a bmad-architecture Update (no AD governs a shipped reference corpus; blocks Story 22.2) and a bmad-ux Update (EXPERIENCE.md:143). PRIOR, 2026-07-29 (sprint-change-proposal-2026-07-29.md): FR-11b and FR-20 added to the inventory and coverage map; NFRs given the stable ids PRD S10 now carries; coverage map refreshed past Epics 14-16 (FR-11 Partial to Done); Epic 14 closed; Epic 16 story-file reality stated. See ../implementation-artifacts/deferred-work.md.'
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
| FR-11b | Create a Service via Web Form (Raw Rundown paste + structured fields; date-collision warning with explicit override; in-form Announcement List) | 1 |
| FR-12 | Telegram correction path | 3 |
| FR-13 | Regenerate Service in place (≤ 5 min) | 1 |
| FR-13b | First-save-wins concurrency | 3 |
| FR-14 | Download offline-capable PPTX | 1 |
| FR-15 | Full-screen Web Slideshow | 2 |
| FR-16 | Dual-screen Presenter Mode | 5 |
| FR-17 | Full Order of Service Run-Sheet (browser) | 1 |
| FR-18 | Per-person accounts + Admin/Operator roles | 1 |
| FR-19 | On-demand Scripture Display (KJV) | 6 |
| FR-20 | Runtime-editable Artifact Registry + canvas template authoring (Admin) | post-Phase-1 (delivered 2026-07-26) |
| FR-21 | Author the Deck's ordered structure in the Artifact Registry | post-Phase-1 (committed 2026-07-30) |
| FR-22 | Several Bible translations, one configurable default (KJV shipped) | post-Phase-1 (committed 2026-08-01; amended same day for the locale axis) |
| FR-23 | Several song books, one configurable default (SDAH shipped) | post-Phase-1 (committed 2026-08-01; amended same day for the locale axis) |
| FR-24 | Data Locale as a browsable axis — every corpus carries its language; the default filters the view, never the query | post-Phase-1 (committed 2026-08-01) |
| FR-25 | UI Locale — the operator interface in the operator's language | post-Phase-1 (committed 2026-08-01) |

> **FR-21 was missing from this table, not new.** PRD §4.10 committed it on 2026-07-30 and Epic 20 realizes it, but this inventory — in a document declaring PRD FR numbers authoritative — stopped at FR-20. Same defect Correct Course 2026-07-29 fixed for FR-11b and FR-20; backfilled 2026-08-01.

### Non-functional Requirements (PRD §10 — ids introduced 2026-07-29)

Until 2026-07-29 the PRD presented these as unnumbered prose, so no story or test could cite one and this section listed only four of them as "themes" — mis-cited to §9 (Constraints and Guardrails) instead of §10. The ids below are the PRD's own, added by the same Correct Course.

| NFR | Requirement | Epic representation |
|-----|-------------|---------------------|
| NFR-1 | Offline reliability (load-bearing) — a downloaded PPTX presents a full Service with zero network access | Epic 3 + Epic 7 (FR-14) |
| NFR-2 | Generation performance — full ~68-slide assemble/regenerate within the ≤ 5-min late-change window | Epic 3 + Epic 5 (FR-13) |
| NFR-3 | Readability — lyric slides never over-full; splitting governed by FR-5 | **None.** No epic and no UX artifact owns "is this readable from the pews?" — see the readiness report F4-6 |
| NFR-4 | Headless-safe rendering — no interactive PowerPoint; all background paths render | Epic 3 + Epic 6 (Story 6.3) |
| NFR-5 | Robust parsing — tolerate the real semi-structured format and **fail visibly**, surfacing every unmapped line or image (a general channel, not hymn-only) | Epic 5 (5.1) + Epic 6 (6.6). **Partial:** the general unmapped-input channel has no UX surface (F4-5) |
| NFR-6 | Access control — all Service data and actions authenticated and Role-gated; no public endpoint exposes member PII | Epic 1 + Epic 6 (6.2, 6.7) via FR-18 |
| NFR-7 | Font licensing and availability — freely-licensed, headless-safe; embedded when feasible, else a standardized documented font, verified on a **clean** machine | Epic 7 (7-4 deploy note). **Tension:** 7-4 documents Arial, which is not freely licensed — see readiness report M5-4 |

### Architecture Decisions

- AD-1: Web presentation + PPTX offline (**Phase 1 ships PPTX-first**; web slideshow is Phase 2)
- AD-2: Single repository monolith (`src/` App Router)
- AD-3: Decoupled ingestion API (webhook JSON) vs presentation

### UX Design Requirements

UX-DR1: High-contrast UI on Tailwind / Shadcn defaults (as-built hub/run-sheet).

### FR Coverage Map (honest)

| FR | Primary epic | Status (2026-07-29 correct course) |
|----|--------------|---------------------------|
| FR-1 | Epic 2 + Epic 6 | Done (webhook+upsert+readback; `.claude/skills/picoclaw-webhook/`) |
| FR-2 | Epic 2 + Epic 22 | Done (Stories 22.1 + 22.2, 2026-08-01: corpus at `data/song-book/sdah.json` carrying its own book code, attribution and takedown statement; `hymns` keyed by `(book_code, number)`; all 695 titles replaced with the owner-supplied index, so the PRD `:120` readback echoes a title a human can recognise rather than a lyric line. FR-23's several-song-books work remains open in Story 22.3) |
| FR-3 | Epic 6 | Done (persistent list; Announcements title gated on non-empty flyers) |
| FR-4 | Epic 3 + Epic 6 + Epic 7 | Done (Part A/B/C + Intercessory standing `#671`/`#684` pair) |
| FR-5 | Epic 3 | Done (verse/Reff splitter) |
| FR-6 | Epic 3 + Epic 6 + Epic 7 | Done (optional sermon/family graphic slots) |
| FR-7 | Epic 3, then architecture AD-23 | Done (configurable transition, PPTX + web from one table — `src/lib/transitions.ts`) |
| FR-8 | Epic 4 + Epic 6 + Epic 7 | Done (`GET /api/services?q=`) |
| FR-9 | Epic 8 | Done (slideshow preview) |
| FR-10 | Epic 5 | Done |
| FR-10b | Epic 10 | Done (`.cache/pptx/` retention) |
| FR-11 | Epic 5 + Epic 14 | Done (Epic 14 closed the dual-path Partial: `/services/[id]` presents the same worship form as create with a working save path — Story 14.4 — and the Announcement List is managed in-form — Story 14.6) |
| FR-11b | Epic 14 (14-1, 14-4) | Done (`/services/new`; date-collision warning with explicit override asserted in `tests/services-lib.test.mjs:161`) |
| FR-12 | Epic 9 | Done (webhook `action: correct`) |
| FR-13 | Epic 5 | Done (re-parse / re-download) |
| FR-13b | Epic 9 | Done (`updated_at` / 409) |
| FR-14 | Epic 3 + Epic 7 | Done (download + Arial deploy note) |
| FR-15 | Epic 8 | Done (full-screen web slideshow) |
| FR-16 | Epic 11 | Done (presenter + projector BroadcastChannel) |
| FR-17 | Epic 4 + Epic 7 | Done (timings on Run-Sheet) |
| FR-18 | Epic 1 + Epic 6 | Done (per-person admin/operator) |
| FR-19 | Epic 12 + Epic 21 | Done (Story 21.1, 2026-08-01: `data/bible/kjv.json` ships and seeds an empty database on first boot — 66 books, 1,189 chapters, 31,102 verses, asserted structurally in `tests/corpus.test.mjs`. A fresh clone resolves a reference with no file handed to it. FR-22's several-translations work remains open in Stories 21.2/21.3) |
| FR-20 | Epic 16 | Done (Artifact Registry + canvas editor; contract in `../specs/spec-slide-artifact-model/` and `../implementation-artifacts/spec-16-2-artifact-pipeline-completion.md`) |
| FR-21 | Epic 20 | Backlog (specified before any of its code exists — PRD §4.10; `AD-16`..`AD-22` all `[TARGET]`) |
| FR-22 | Epic 21 | Backlog — **amended 2026-08-01** for the locale axis; realized by Stories 21.2 and 21.3 |
| FR-23 | Epic 22 | Backlog — **amended 2026-08-01** for the locale axis; realized by Story 22.3 |
| FR-24 | Epic 21 **+** Epic 22 | Backlog — the one FR deliberately delivered by **amending two epics rather than opening a third**. Each corpus family already owns its own table, file and read paths; a separate locale epic would have had to touch `bible_verses` *and* `hymns`, which is precisely what the per-family cut of 2026-08-01 exists to prevent. The shared surface is `settings.ts` plus one admin component each — append-shaped, the same contact point the first cut accepted |
| FR-25 | Epic 24 | Backlog — **no i18n infrastructure exists.** Measured 2026-08-01: `lang="en"` hard-coded in `src/app/layout.tsx` is the entirety of it |

> **FR-2 went `Done` → `Partial` → `Done` inside 2026-08-01, and the row above is the end state.** The morning's measurement moved it to `Partial` — not a regression: the resolved-title readback PRD `:120` relies on was echoing lyric lines, and the corpus behind it could not be rebuilt. `Done` had been recorded against "695 hymns resolve", which was still true and was never the whole requirement. Stories 22.1 and 22.2 then shipped that same day and closed exactly that gap, returning it to `Done`. *This paragraph previously stated only the downgrade, which contradicted the table directly above it from the moment 22.2 landed; repaired by the second Correct Course of the day.*

## Epic List

### Epics 1–5: the shipped vertical slice *(historical)*

Story files live under `_bmad-output/implementation-artifacts/stories/`. Condensed from ten near-empty headings into one table on 2026-07-30. Every "done" claim is scoped to its own story ACs — several were later superseded, and the successor is named rather than left implied.

| Epic | Stories | Status and what superseded it |
| --- | --- | --- |
| **1** System Foundation & Authentication | 1.1, 1.2 | Done. 1.1 has a retrospective stub (`stories/1-1-next-js-foundation-and-monorepo-setup.md`). 1.2 delivered *shared* Basic Auth (architecture v1); full FR-18 → **Story 6.2** |
| **2** Data Ingestion & Processing | 2.1, 2.2 | Done — webhook + hymnal corpus. picoclaw skill completed in **Story 6.5** (`.claude/skills/picoclaw-webhook/`) |
| **3** Presentation Assembly & PPTX Export | 3.1 | Done. FR-4/6 fidelity → **Stories 6.3, 6.4, Epic 7** (intercessory `#671`/`#684` closed) |
| **4** Web Hub & Operator Interface | 4.1 | Done for Phase-1 UI — list + shadcn run sheet. FR-9/15/16/19 shipped later in **Epics 8–12**, and were never part of Epic 4's "done" claim |
| **5** MVP Completion & Bug Fixes | 5.1–5.4 | Done. 5.4 was the per-service images MVP; FR-3 persistent list → **Story 6.1** (empty-list Announcements title closed by `spec-close-audit-product-partials`) |

### Epic 6: Phase 1 Gap Closure *(done — story keys)*

Closed planned Phase 1 gap stories (announcements, auth, blueprint, sections, picoclaw, tests, SSRF, deploy). FR-3/FR-4 product Partials closed by `spec-close-audit-product-partials`. Remaining **Partial** on the FR map: FR-11 edit dual-path, FR-19 corpus ops (not in `data/`).

**FRs addressed:** FR-1 (picoclaw skill), FR-3 (list), FR-4/6 fidelity, FR-18, hardening/tests

#### Story 6.1: Persistent Announcement List

As an operator,  
I want a persistent Announcement List with add/replace/remove,  
So that weekly flyers follow FR-3 (not only per-service URL arrays).

#### Story 6.2: Per-person Admin / Operator Auth

As a church admin,  
I want individual accounts with Admin and Operator roles,  
So that FR-18 is met beyond a shared Basic Auth password.

#### Story 6.3: Deck Blueprint Fidelity

As an operator,  
I want the PPTX to follow BIC Part A/B/C payload rules more closely (theme verse from rundown, standing liturgy lyrics, family/youth, verse reading),  
So that FR-4 / FR-6 approach Sabbath-ready fidelity.

#### Story 6.4: Section-aware Hymn Mapping

As the system,  
I want hymns assigned to Bible Talk vs Divine Service by section markers,  
So that atypical song counts do not mis-slot Song Blocks.

#### Story 6.5: picoclaw Intake + Hymn Title Readback

As Events Department,  
I want picoclaw to call the webhook and receive resolved hymn titles / failed numbers,  
So that FR-1 Telegram round-trip is complete.

#### Story 6.6: Automated Tests (parser / middleware / webhook)

As a maintainer,  
I want regression tests for auth, webhook, and rundown parsing,  
So that NFR-5 (robust parsing) and NFR-6 (access control) are covered.

#### Story 6.7: Image URL Allowlist (SSRF Harden)

As the system,  
I want remote announcement image URLs restricted to an allowlist / safe download path (hub-local `/api/uploads/...` is a separate exception — Epic 13.3),  
So that open webhook/edit cannot SSRF via `addImage`.

#### Story 6.8: Deploy + SQLite Production Hardening

As a maintainer,  
I want `DB_PATH`, WAL/busy timeout, and deploy notes for a single-node host (LiveServer Docker + tunnel + durable volumes — Epic 13.1),  
So that `better-sqlite3` is production-safe for BIC’s hosting choice.

### Epics 7–12 — Phases 1 residuals + Phases 2–6 *(done — story keys)*

See stories `7-1`…`7-4`, `8-1`, `9-1`, `10-1`, `11-1`, `12-1` and `spec-7-1-phase1-residuals-through-phase6.md`. FR-19 remains Partial until KJV corpus commit/ops path is documented as complete.

### Epic 13: Hub UX + LiveServer gap *(done — retrospective)*

Retrospective BMAD for vibe-coded commits `acad206..458aa01` (plus local-upload alignment): LiveServer Docker/tunnel, shared Header/profile/dashboard search, hub-local announcement uploads. Spec: `spec-13-hub-ux-and-liveserver-gap.md`. Stories `13-1`…`13-3`. Amends 6.1/6.7 image-ref rules for `/api/uploads/...`.

Planning drift closed by Correct Course 2026-07-19 (`sprint-change-proposal-2026-07-19.md`): PRD / Architecture / UX as-built amended to follow code.

### Epic 14: Worship Web Input Boundary *(done — closed 2026-07-29 by Correct Course)*

Retrospective BMAD for commit `b679ff7` closed Story `14-1`. Spec: `spec-worship-web-input/SPEC.md`. FR-11 Edit Service inputs via web form. Story `14-2` (UX refinements: Parse button, hymn autocomplete, unified raw input) reopened the epic via Correct Course (`sprint-change-proposal-14-2-ux.md`). Stories `14-3` (UI tweaks) and `14-4` (show→create-parity + shell; CAP-7/CAP-8) continue the epic from operator testing of `/services/[id]`. Story `14-5` (Sermon Card split + CAP-6 KJV resolve) from post-14.4 operator testing. Story `14-6` (remove Service Highlights, hymn number+title display, Announcement Flyers helper UX) from post-14.5 operator testing / SPEC companion revisions.

Planning drift for 14.1 closed by Correct Course 2026-07-19 (`sprint-change-proposal-2026-07-19.md`).

**Closed 2026-07-29** by Correct Course (`sprint-change-proposal-2026-07-29.md`): all six stories `14-1`…`14-6` were already `done`, so both this heading and `epic-14: in-progress` contradicted the sprint tracker's own definition (*"done: All stories in epic completed"*). **FRs realized: FR-11 and FR-11b** — the latter was absent from this document entirely until the same Correct Course, despite being a Phase-1 requirement in `prd.md` (§6) and the documented fallback for a Telegram intake outage (UJ-5).

#### Story 14.1: Worship Web Input Forms & API

As an operator,
I want to create and edit service inputs via a web form,
So that I can customize worship details (family/youth photos, announcements) directly in the hub.

#### Story 14.2: Worship Web Input UX Refinements

As an operator,
I want a unified raw text input with a manual parse trigger and autocomplete hymn dropdowns,
So that I can easily extract structured roles and select hymns without separate helper sidebars, and explicitly group UI sections.

#### Story 14.3: Worship Web Input UI Tweaks

As an operator,
I want hymn labels, section nesting, Parse placement, and autocomplete fixed on create and edit forms,
So that the structured overlays match the intended layout after Story 14.2.

#### Story 14.4: Service Page Create-Parity & Shell Stability

As an operator,
I want `/services/[id]` to present the same worship form as create (with a working edit/save path) plus Preview/Present/Delete/Download PPTX and Announcement Manage list, without Order of Service chrome and without header/width jumps,
So that opening an existing service feels like editing create — not a separate show/run-sheet.

#### Story 14.5: Sermon Section Split & KJV Resolve

As an operator,
I want Sermon as its own form Card after Divine Worship (create and edit lockstep), and Resolve KJV to return scripture text when the corpus is imported,
So that section grouping matches the intended overlays and CAP-6 scripture lookup works during worship planning.

#### Story 14.6: Worship Form UX Polish (Highlights, Hymn Labels, Announcement Help)

As an operator,
I want Service Highlights removed, hymn inputs that show number and title together, and clear Announcement Flyers usage guidance,
So that create/edit forms stay focused on Raw Rundown Text and I can pick hymns and manage flyers without confusion.

### Epic 15: Parser & Rendering Refinements (Phase 2) *(done — retrospective 2026-07-26)*

Refinements for lyric formatting, chorus placement logic, and service flow slide skips based on operator feedback.

#### Story 15.1: Lyric Formatting and Service Flow Skips

As an operator,
I want lyrics formatted as continuous text, chorus injected after every verse, and unnecessary song titles skipped during prayer flow,
So that the generated PPTX flow is more seamless and lyric slides are easier to read.


### Epic 16: Slide Artifact Model Refactoring *(done — retrospective 2026-07-26)*

Rearchitect the slide plan from a flat `SlideKind` enum into a template-based Artifact model with placeholder resolution, including a canvas editor for layout definitions.

Delivered across Stories 16.1–16.5. Specs: `../specs/spec-slide-artifact-model/SPEC.md` (contract), `../implementation-artifacts/spec-16-2-artifact-pipeline-completion.md` (Stories 16.2–16.5). An alternative 16.2–16.8 decomposition was proposed while the three-host inter-agent chain was still in use, and never adopted: its own AR19 required reconciliation into this file, the SPEC companions and sprint status *before* any 16.2 handover, and that reconciliation never happened — so this three-story breakdown remained authoritative. It was recorded in `epics-parallel-delivery-analysis.md`, **deleted 2026-08-01** at the owner's direction along with the chain the whole proposal depended on. Run records dated before then still cite it by name; that is deliberate, and this sentence is what resolves them.

**Realizes FR-20** (§4.10 of the PRD), added 2026-07-29. Until then this epic — a runtime-editable template system that changes how every slide is produced — had no FR ancestry at all, in a document that declares PRD FR numbers authoritative.

**Story-file reality (recorded 2026-07-29):** only Story 16.1 has a story file. Stories 16.2–16.5 shipped with no story file and therefore no acceptance criteria; their four `done` keys have been retired from `sprint-status.yaml` rather than backfilled with AC written to match already-shipped code. `spec-16-2-artifact-pipeline-completion.md` is the delivery contract for all four. The user-story statements below are retained as the scope record — they are not evidence that a tracked, AC-bearing delivery unit existed.

#### Story 16.1: Artifact Registry & Canvas Editor Foundation *(delivered)*
As an administrator,
I want a SQLite-backed Artifact Registry seeded from validated JSON, with 7 base types and a constrained canvas editor for existing templates,
So that global slide layouts can be safely edited and restored without deploying code changes (CAP-1, CAP-2, CAP-3, CAP-9).

#### Story 16.2: buildSlidePlan Refactoring & Placeholder Resolution *(delivered — no story file; contract: `spec-16-2-artifact-pipeline-completion.md`)*
As the system,
I want `buildSlidePlan` to output `ArtifactInstance[]` and resolve dynamic placeholders (and standing defaults) from `ParsedRundown` and `SlidePlanMedia`,
So that the output feeds downstream consumers uniformly (CAP-4, CAP-7, CAP-8).

#### Story 16.3: Unified Rendering across PPTX & Web Slideshow *(delivered — no story file; contract: `spec-16-2-artifact-pipeline-completion.md`)*
As the system,
I want PPTX (`pptx.ts`) and Web Slideshow (`SlideView.tsx`) to render directly from the positioned elements defined in the Artifact JSON,
So that layout changes apply instantly across both formats without hardcoded switch statements (CAP-6).

#### Story 16.4: Live Slide Preview & Semantic Badges *(delivered — no story file; contract: `spec-16-2-artifact-pipeline-completion.md`)*
As an operator,
I want the Live Slide Preview to group children under parents (e.g. SongSets) and display semantic Artifact labels,
So that the preview accurately reflects the worship structure and Artifact taxonomy (CAP-5).

#### Story 16.5: Canvas Element Authoring *(delivered — no story file; contract: `spec-16-2-artifact-pipeline-completion.md`)*
As an administrator,
I want to add and delete my own text boxes and shapes on an editable Artifact template,
So that layouts can be extended without a code change.

**Note:** seeded element IDs and any element marked `required` stay immutable — the save API rejects their removal or rename (400) and read-only base types (FullScreenImage, SongSet, Announcement) expose no add/delete affordances at all. Only elements authored in the editor may be deleted.

### Epic 17: An operator surface that is readable and honest *(in-progress — Story 17.1 done; 17.8 ready-for-dev; 17.2–17.7 backlog)*

Created 2026-07-29 from the implementation-readiness assessment's product defects, via the epic route rather than inline patching — the point of Correct Course that day was that inline is how the drift happened. Titled around what an operator gets, per the C5-1 remediation: the value standard applies to new epics from here.

**Requirement ancestry — a recorded decision, not an omission.** These stories change the *operator chrome's* visual identity and self-presentation. Per the authority map in `AGENTS.md`, that is governed by `DESIGN.md`, not by a PRD FR. Unlike Epic 16 — which changed how every slide is produced and needed FR-20 — nothing here alters a Deck, a Slide Type, or any payload contract. **Constraint that keeps that true:** whatever an operator's theme, the projected output (`slide-surface`, PPTX, projector window) must be byte-identical. The congregation never sees operator chrome.

#### Story 17.1: Reachable Dark Mode *(done — closed by the owner 2026-08-01. Four review rounds; round 4's 15 patch items and its one blocking decision item both closed that day, the latter by the `bmad-architecture` Update run that repaired AD-24's closure-gate ceiling bullet. AC-4 scoped in writing to the **token** guarantee, its shell half owned by Story 17.7. Closed on the condition that the debt be **owned, not absent**: the five code-owned findings that Update run's Reviewer Gate opened against `tests/theme-chrome.test.mjs` are all latent and all filed — two to Story 17.7, four to the new Story 17.8 — leaving no unassigned entry in `deferred-work.md`)*
As an operator running a service in a dim sanctuary,
I want the hub to follow a dark theme I can choose,
So that a full-brightness white screen in my hands does not light up the room.

**Corrected 2026-07-30 (`bmad-ux` Update):** this story previously ended *"…stops being dead code"*, inheriting a claim from the readiness assessment. The 33-token `.dark` palette is **not** dead — `PresenterOperator.tsx:449` and `SlideGridDialog.tsx:176` pin the class on their own wrappers and `globals.css:5` matches any descendant, so it renders today in the two surfaces an operator uses during a service. What is missing is **choice**, and the story's real constraint is to add it *without* disturbing those two deliberate opt-outs.

#### Story 17.2: `muted-foreground` Contrast *(backlog)*
As an operator reading secondary text,
I want the muted foreground token to meet WCAG AA,
So that labels, hints and timings are legible. Measured 2026-07-29 against the running app: **4.35:1 on `muted`, which fails AA (4.5:1)**, and 4.74:1 on `background`, passing by 0.24. Darkening `--muted-foreground` to about `#6b6b6b` clears both surfaces; no other token moves.

#### Story 17.3: The App Says Its Own Name *(backlog)*
As anyone with the hub open,
I want the browser tab and bookmarks to name this application,
So that it is not filed as *Create Next App*. `src/app/layout.tsx` still exports the create-next-app `metadata`. One-line change; the wording is product-owned.

#### Story 17.4: Unsaved Canvas Work Is Not Lost Silently *(backlog)*
As an administrator editing an Artifact template,
I want a dirty indicator and a navigation guard,
So that leaving the canvas editor cannot discard layout work without warning. Today unsaved changes are invisible to the application (FR-20 surface).

#### Story 17.5: The Presenter Knows When the Projector Is Gone *(backlog)*
As an operator presenting to a congregation,
I want the presenter to tell me the moment the projector window stops answering,
So that I cannot advance a deck for the rest of a service with nothing on the second screen.

**This block is the single source for the evidence** — `EXPERIENCE.md` Open Item 1 points here rather than repeating it. `EXPERIENCE.md` had specified *Lost sync* as a shipped state since 2026-07-19; verified against `src/` on 2026-07-30, **no detection of any kind exists:**

- `BroadcastChannel` gives the sender no delivery signal;
- `src/lib/present-channel.ts` defines no heartbeat and no acknowledgement message;
- `projectorRef.current.closed` is read only inside `openProjector` (`PresenterOperator.tsx:271-276`) — only if the operator clicks the button again;
- the only surfaced projector state is `projectorBlocked`, which is the popup blocker.

**Constraint:** AD-10 forbids a server realtime channel, so this is solved locally or not at all — a `closed` poll on the retained window handle, or an acknowledgement added to `present-channel.ts`. Extending `PresentMessage` is a wire change, and the presenter must stay the single authority (see that file's header contract).

#### Story 17.6: The Toast Channel Two Documents Describe Does Not Exist *(backlog)*
As an operator completing an action,
I want the transient confirmation the design documents promise to actually appear — or the promise withdrawn,
So that I am not the only one who knows the channel is empty.

**Registered 2026-07-31 at the owner's direction, during Story 17.1's review remediation, as a tracked home rather than as work to start.** `sonner` is installed and `src/components/ui/sonner.tsx` exports `Toaster`; verified against `src/` that day, **it is mounted in no layout or page and `toast(` is called nowhere.** Both `DESIGN.md` → *Components* and `EXPERIENCE.md` → *Component Patterns* describe toasts as a shipped pattern, so two artifacts document a channel that cannot fire.

This is what Story 17.1's AC-5 ran into: the AC requires toasts to follow the theme, which is structurally satisfied — `sonner.tsx` calls `useTheme()` and now resolves against a real provider — and unobservable, because nothing triggers a toast. Mounting `<Toaster />` to make it observable was **explicitly declined** by the owner as a UI surface no story had asked for.

**The story's first job is a decision, not an implementation:** does this product want a transient channel at all? Every confirmation today is inline, which is a defensible design for an operator tool used under pressure — and if that is the answer, this story deletes two documentation rows and uninstalls a dependency, which is smaller than building the alternative. `EXPERIENCE.md` Open Item 4 owns the question.

#### Story 17.7: The Room-Facing Shell Belongs to the Route, Not to the App *(backlog)*
As a congregation watching the screen at the front of the room,
I want nothing the operator chose about their own screen to reach mine — including on the frames and failure paths nobody planned for,
So that a theme switch in the back row cannot change what is projected, mid-service.

**Registered 2026-07-31 at the owner's direction, from round 2 of Story 17.1's code review.** It carries the constraint stated in this epic's own preamble — *"whatever an operator's theme, the projected output must be byte-identical"* — for the half Story 17.1 could not reach. 17.1 closes AC-4's **token** guarantee: the projected tree paints in literal colours or registry-resolved inline styles, enforced by `PROJECTED` in `tests/theme-chrome.test.mjs`. This story owns AC-4's **shell** guarantee: `html` and `body`, which no component in the projected tree can see.

**Four paths leak it, and a hook cannot reach any of them.** `src/lib/use-projected-shell.ts` fixes the two full-screen Clients and nothing else:

- **First paint, on every projected load.** The hook is a `useEffect`, so from the server's paint until hydration completes, `html` keeps `scrollbar-gutter: stable` and `body` keeps `bg-background` — and next-themes' blocking script has *already* resolved the theme class on `<html>` by then. `useLayoutEffect` is not a fix: the paint that leaks is the server's.
- **The two Server-Component error branches** — `slideshow/page.tsx` and `projector/page.tsx`, the `fixed inset-0` screens a `buildSlidePlan` throw renders. They cannot call a hook at all.
- **`notFound()`, six reachable sites** across those same two routes. Verified 2026-07-31: `find src -name "not-found.tsx" -o -name "error.tsx" -o -name "global-error.tsx"` returns **zero**, so Next renders its default 404 inside the themed root layout, full-screen, at a room-facing URL.
- **Any future route shell.** The guard's closure test walks imports *out of* projected files, so nothing checks what renders *above* them — `layout.tsx` today, and an `error.tsx` / `loading.tsx` / `template.tsx` the moment someone adds one. This is verbatim the argument that put `page.tsx` into `PROJECTED` in the first place.

**Owner's decision on the shape (2026-07-31): one route-group layout owning every room-facing URL**, with `FULL_SCREEN` widened to it. Four point-fixes close the first three and leave the fourth open; the layout closes all four, including the shell nobody has written yet. The architecture spine's *Deferred* records the three candidates and names this one for that reason.

**This story is what takes AD-24 from `[ADOPTED, partial]` to `[ADOPTED]`.** Two same-change-set obligations follow from `AGENTS.md` and are part of the story, not follow-ups: a new route surface updates the IA table in `EXPERIENCE.md`, and the spine amendment goes through a `bmad-architecture` Update run rather than an inline edit. A third consumer is already waiting — `deferred-work.md` records that `PresenterOperator` pins `dark` on its own wrapper and not on the shell, so a light-theme operator gets a white canvas framing the dark Presenter.

**Two findings from the 2026-08-01 Update run's Reviewer Gate are filed against this story specifically**, both in `tests/theme-chrome.test.mjs`: the gate keeps **four** hardcoded room-facing lists where one derivation would do (`PROJECTED`, `ROUTE_SHELLS`, `FULL_SCREEN`, and an inline pair — `AD-24` claimed two until that run corrected it), and `exportedProps` cannot read an `export default async function`, which is the shape of every Server Component this story adds. The route segment this story creates is the first real value the roots could be **derived from** rather than listed — which is what would make the spine's *encode the criterion* instruction satisfiable here instead of merely correct. Related but deliberately **not** this story's: the four guard narrownesses in Story 17.8.

#### Story 17.8: The Guard Encodes Its Criteria, Not Its Spellings *(ready-for-dev)*
As the maintainer of the one test `AD-24` names as its closure gate,
I want each of that gate's four remaining narrownesses closed by stating the rule rather than by adding the next spelling to a list,
So that the guarantee AC-4 rests on stops needing a fifth review round to discover a fifth spelling.

**Registered 2026-08-01, after the `bmad-architecture` Update run that closed Story 17.1's decision item.** Four rounds of review on 17.1 produced one recurring finding, now promoted to spine altitude: *a rule applied too narrowly keeps being closed by widening the list rather than by encoding the rule.* This story is that instruction executed, and it collects the four findings that left round 4 and that Update run with **no owner** — the focus-ring guard's subtraction list (its arbitrary-value forms `outline-[transparent]` / `outline-[inherit]` are accepted today, reproduced against the shipped regex); the `className` props guard, defeated by an inline index signature and blind to a `.ts` call site; the edge-width guard, which never received the transitive sweep its two sibling guards have; and `DARK_VARIANT`, which misses `dark:!…` and `dark:2xl:…`.

**All four are latent** — no shipped code uses any of these spellings, and both projected components declare closed inline props today. This is not a bug fix; it closes the gap between what the guard asserts and what it reads as asserting. Kept out of Story 17.7 on purpose: 17.7 owns the shell closure and the two findings above that belong to it, and folding pure guard-hardening in would grow that story and mix two unrelated pieces of work. Test-only by construction, so no `DESIGN.md` or `EXPERIENCE.md` obligation follows — but closing it makes the spine's *Deferred* ceiling entry stale, and that amendment routes through a `bmad-architecture` Update run rather than an inline edit.

### Epic 18: Member data stays gated even when the perimeter moves *(backlog)*

**FRs addressed:** FR-18 (per-person accounts and Roles), NFR-6 (access control — no endpoint exposes member PII).

Nine API routes rely on `src/proxy.ts` as their only authorization layer, with no in-route `requireSession`. The gate's `config.matcher` regex *is* the authorization boundary, so anything unmatched is served with no session check — a single exclusion added without its matching assertion silently publishes member data. `tests/proxy-matcher.test.mjs` guards the regex; nothing guards a route that stops being matched. The pressure test raised this as watch-list item **L4** ("hand-rolled auth is a time sink and a security risk for a solo dev") and it was accepted un-actioned; `deferred-work.md` then recorded the nine routes. This epic is that item coming due.

Separate from Epic 17 deliberately: one epic is what an operator sees, this one is what a visitor must never see. Bundling them would have produced exactly the mixed technical/UX epic C5-1 flags.

#### Story 18.1: In-route Authorization for the Nine Proxy-Only Routes *(backlog)*
As a church member whose name and prayer request live in this system,
I want every API route to check the session itself,
So that no single regex edit can expose Service data. Privileged routes re-check role against the database (`requireAdminSession`), not the cookie.

### Epic 19: Liturgical rules live in data, not in the planner *(retired 2026-07-30)*

Created 2026-07-30 at the owner's direction, to give a tracked home to an item carried as a bare *"Consider"* in `sprint-status.yaml` since 2026-07-29. Not opened as a Story 15.2 because Epic 15 is `done`, and moving a rule from code to data is a new capability rather than a refinement.

> **RETIRED 2026-07-30 by owner decision — do not implement.** Its goal is met by `AD-20`, but not by its method. This epic assumed the `skipTitle` suppression flag moves from code into data. The owner's decision is that the three suppressed songs — `#671`, `#684`, *We Have This Hope* — become **General** registry entries, edited by hand. A General generates no title slide, so **`skipTitle` is removed rather than migrated**: there is nothing left to suppress and no flag to store anywhere. The liturgical decision stops requiring a deploy, which is what this epic wanted; the work happens inside Story 20.1's seed, not as a data migration. The line-number table below is kept because that seed still needs it.

#### Story 19.1: Song-Title Suppression Becomes Registry Data *(backlog)*
As an administrator adjusting the order of service,
I want to control which songs are announced with a title slide,
So that a liturgical decision does not require a code change and a deploy.

A normal Song Block renders a title slide (`"O Worship the King · SDAH #83"`) followed by its lyric slides — FR-5. Three call sites in `src/lib/slide-plan.ts` suppress that title with `{ skipTitle: true }`. **This table is the only record of those line numbers and their liturgical reasons; Story 20.1 will need it.**

| Site | Song | Why the title is suppressed |
| --- | --- | --- |
| `slide-plan.ts:438` | Group `intercessory-671` — the fixed hymn `#671` standing response **before** the intercessory prayer | The congregation is already standing and sings straight in; announcing a number breaks the prayer |
| `slide-plan.ts:460` | Group `intercessory-684` — the fixed hymn `#684` standing response **after** it | Same reason |
| `slide-plan.ts:550` | Group `hope` — closing *We Have This Hope* (`weHaveThisHopeFixed`) | A fixed song needs no introduction |

**Corrected 2026-07-30 against the source.** This table previously named `slide-plan.ts:460` as *"Around the Special Song"*. It is not: it is `intercessory-684`, the second half of the fixed pair. **No `skipTitle` site touches the Special Song at all.** The error mattered because this table is the only record of these sites, and Story 20.1 was told to rely on it.

**What the source also shows, and what makes this more than a flag move:** none of the three songs is one of the four predefined SongSet slots (Bible Talk open/close, Divine Service open/close). All three are *fixed liturgical songs the planner injects itself* — `#671`, `#684`, and `We Have This Hope`. So the constants CAP-1 objects to are not only the suppression flags but the choice of song. See `AD-20` for how far that moves into data.

Each is a **liturgical** judgment about this congregation's order of service, expressed as a literal in the slide planner.

**Open question the story must answer before implementation, not during:** whether suppression is a property of the template, of the plan node, or of a service-level setting. Getting that wrong makes the rule harder to change than the literal it replaced. `buildSlidePlan` remains the single slide-order source (AD-7) — this story moves *where the rule is stored*, never who applies it.

### Epic 20: The registry becomes where the deck is authored *(backlog)*

**Contract:** `../specs/spec-artifact-registry-authoring/SPEC.md` + companions `authoring-boundaries.md`, `placeholder-catalog.md`, `slide-kinds.md`. **The SPEC is authoritative for every detail below** — this epic exists to make it a tracked delivery unit, not to restate it.

Adopted whole 2026-07-30 by owner decision: **this SPEC is the final reference for development.** It is marked *Canonical contract*, supersedes Story 16.1's non-goals, and states that where adopted Epic 16 companions conflict, *"this SPEC wins"*.

Epic 16 shipped a **template catalog** — rows in `artifact_templates` holding layout JSON, editable on a Fabric canvas, rendering identically to web and PPTX with no deploy (FR-20). It deliberately shipped no notion of **order** and no way to **create or delete** an entry; slide sequence stayed in `buildSlidePlan`. This epic makes the registry the **ordered** authoring surface for the deck itself.

**Epic 19 is a subset.** Story 19.1 moves the `{ skipTitle: true }` literals out of `slide-plan.ts`; CAP-1's success criterion is *"…without editing TypeScript plan constants."* Deliver 19.1 inside Story 20.1 or retire Epic 19 — not both.

Two consequences are breaking, and both are the SPEC's explicit instruction rather than an interpretation.

**1. Seven base types collapse to three kinds.** SPEC *Constraints*: *"Slide kinds are exactly three: General, SongSet, Announcement. Epic 16's TextPlaceholder / ImagePlaceholder / MixPlaceholder / FullScreenImage are retired as distinct kinds."*

| Epic 16 `base_type` | Becomes |
| --- | --- |
| `general`, `text-placeholder`, `image-placeholder`, `mix-placeholder` | **General** — a placeholder stops being a *kind* and becomes an element inserted from the Placeholder Catalog (CAP-4) |
| `fullscreen-image` | **Announcement** (CAP-7: upload means fullscreen, no extra elements) |
| `song-set` | **SongSet** (CAP-8) — and per `AD-19` this is the one kind that **expands**, into four immutable slot identities (`songset-bt-open`, `songset-bt-close`, `songset-ds-open`, `songset-ds-close`) because the slot identity is what the hymnal binding hangs on. Whether they sit in the `base_type` column or a discriminator beside it is this story's schema call |
| `announcement` | **Announcement** |

`READ_ONLY_BASE_TYPES` / `EDITABLE_BASE_TYPES` in `src/lib/registry/types.ts` collapse with them: *General* becomes the only canvas-authorable kind, and SongSet/Announcement expose label, order and background but never a freeform canvas. This is a migration of the `base_type` column and its validator rules, not an additive change — and it is cheap **only while no production system exists**, since after deployment the same change needs a backfill over live `artifact_templates` rows plus every service snapshot.

**2. `AD-14` is reversed.** That decision states registry edits are **global and immediate**, with no per-service override *by design*. CAP-6 requires the opposite: creating a service **clones** the ordered registry into a service-bound snapshot, live edits do **not** reach an existing service, and **Sync Artifact** refreshes it. This is an architecture invariant reversal, so before Story 20.8 is implemented:

- ~~the architecture spine needs a new `AD-n` superseding it~~ — **done 2026-07-30** via `bmad-architecture` Update. `AD-16` supersedes the *"global across services"* clause of `AD-14` and nothing else in it; the admin-only authorization clause stands. Three further decisions landed in the same pass because the Reviewer Gate found them, and stories below are bound by them: `AD-17` (the seed is a bootstrap, so a delete or reorder is no longer undone by a restart), `AD-18` (vocabulary changes travel as explicit one-time migrations; the seven-to-three collapse ships as a total replacement under an owner waiver that **expires at first deploy**), and `AD-19` (a key referenced across a boundary is a stable server-owned identity — which settles Story 20.7's central question and Story 20.5's enforcement boundary at spine altitude rather than per-story). **Numbering note:** the same day, the owner folded the Epic 16 child spine into the one project spine, so these carry their post-merge numbers — `epic-16 AD-1..AD-9` are now `AD-11..AD-19`, per the AD map in the spine.
- `EXPERIENCE.md` → *Venue & Projection Constraints* states the global-and-immediate rule, and Flow 5's climax turns on it. **Still outstanding** — this is what remains of Story 20.8's block.

Stories below are one per capability in dependency order. Acceptance criteria live in the story files; each SPEC capability's `success:` clause is the starting point.

#### Story 20.1: One Ordered Registry *(backlog)* — CAP-1
As an administrator, I want the registry to define which slides exist **and in what order**, so that deck structure is data. Adds ordering to `artifact_templates` (no such column exists today) and makes the ordered snapshot the sequence source `buildSlidePlan` consumes. **Replaces Epic 19 rather than absorbing it** — `AD-20` fixes that the planner holds no rule of its own, and the three `skipTitle` songs become hand-edited **General** entries, so the flag is deleted rather than moved. `buildSlidePlan` remains the single order source for PPTX, slideshow and presenter (AD-7); what changes is where its sequence comes from, never that there is one. What this story owes the seed is named in the spine's *Deferred*: one General row per lyric page, and those lyrics stop passing the FR-5 splitter and stop tracking `data/hymns.json`.

#### Story 20.2: Three Slide Kinds *(backlog)* — CAP-5 + *Constraints*
As an administrator, I want every entry to be General, SongSet or Announcement with an editable label shown as `[kind] label`, so that the list reads as a deck. The breaking migration described above. Renaming a General's label updates Presenter badges for services that clone or sync afterward — which is only meaningful once 20.8 exists, so until then the story's own AC must say what "afterward" means.

#### Story 20.3: Add, Delete, Rename, Reorder *(backlog)* — CAP-2
As an administrator, I want to add, delete, rename and reorder entries, including inserting SongSet and Announcement entries. Today the admin API has only list, read, update and reset — no create, delete or reorder verb. Explicit Save; no autosave (SPEC *Constraints*). Every new verb is an authorization surface: `/api/admin` is admin-gated in `src/proxy.ts`, and per Epic 18 the route must re-check with `requireAdminSession` rather than trusting the cookie.

#### Story 20.4: Full Canvas Authoring for General Slides *(backlog)* — CAP-3
As an administrator, I want background, inserted images and text areas, drag and resize, and font colour/size/style on **General** slides only. Story 16.5 shipped element add/delete against the old base types; this story is scoped to what the three-kind model changes and to the style properties CAP-3 names. Validation still rejects any property the registry vocabulary does not admit (`AD-15`) — a rejected Save keeps the operator's work and names the property.

#### Story 20.5: The Placeholder Catalog *(backlog)* — CAP-4
As an administrator, I want to insert predefined placeholders onto General slides and style them locally, with weekly worship fields filling the bindings. The same catalog key may appear on several Generals with different styling. **The UI must not be able to invent a catalog key** — extending the catalog is a code-plus-tests change (SPEC *Constraints*), which is also what keeps a placeholder from becoming a channel for arbitrary congregation text.

#### Story 20.6: Announcement Is One Entry That Expands *(backlog)* — CAP-7
As an administrator, I want a single Announcement entry that expands to one full-bleed slide per image from the Announcements list. No canvas editor for it, ever (SPEC *Non-goals*). Image membership keeps coming from the Announcements menu, not from inside the registry.

#### Story 20.7: SongSet Slots *(backlog)* — CAP-8
As an administrator, I want four predefined SongSet slots — Bible Talk open/close, Divine Service open/close — with configurable backgrounds, reorderable, each receiving its hymn number from worship-service settings. No freeform canvas for lyric pages. **The identity question is settled at spine altitude, not here:** `AD-19` makes the slot's own immutable identity the binding key, carried by the type vocabulary, so identity is immutable by construction. What this story owes is the two requirements that make it unambiguous — `base_type` not administrator-editable for a slot-carrying type, at most one row per slot type — and the inert-binding behaviour when a slot row is deleted.

#### Story 20.8: Service Clones the Registry, and Sync Artifact *(backlog)* — CAP-6
As an operator, I want a service to hold its own snapshot of the registry, and a **Sync Artifact** action to refresh it. Live registry edits must not reach an existing service until Sync. **Still blocked, but on one item rather than two** — `AD-16` was recorded on 2026-07-30, so what remains is the `EXPERIENCE.md` reconciliation above. Two `AD-16` clauses the story must implement rather than re-decide: Sync carries the service's `updated_at` precondition (`AD-6`, which the spine had been silent on — a different decision, not a typo), and Sync is permitted on **any** service including one already presented — because the freeze event is service **creation**, and what a service holds against the registry is its supporting data entry, not a reproducible deck. Announcement membership is deliberately **not** frozen, and a later structural change need not keep an old snapshot renderable. It is last for a reason: every story above defines what gets cloned.


### Epic 21: Scripture is on hand, in the translation being read *(in-progress — Story 21.1 done 2026-08-01; 21.2 done 2026-08-02; 21.3, 21.4 and 21.5 backlog)*

**FRs addressed:** FR-19 (on-demand Scripture Display — the last product `Partial` on the coverage map above), **FR-22** (several translations, one default) — added to the PRD by the same Correct Course that opened this epic — and, since the second Correct Course of 2026-08-01, **FR-24** (Data Locale) for the scripture half.

**Amended 2026-08-01 by the second Correct Course of the day — read this before Story 21.2.** Language became a first-class dimension hours after this epic opened, and it lands *here* rather than in an epic of its own **on purpose**: this epic already owns `bible_books`, `bible_verses` and every scripture read path, and a separate locale epic would have had to reach into them alongside Epic 22's `hymns`. That is the collision the per-family cut exists to prevent. Three things change for the stories below:

- **The corpus path moves to `data/<locale>/bible-translation/<code>.json`** — e.g. `data/en/bible-translation/kjv.json`. This **supersedes the `data/bible/kjv.json` that Story 21.1 shipped and asserts in its acceptance criteria**; that story is `done` and its AC is superseded in writing in the story file rather than quietly rewritten. Verified 2026-08-01: no locale code collides with `data/local/`, `data/uploads/` or `data/*.db`, and `.gitignore` does not swallow `data/en/`. The move itself is small — `src/lib/corpus.ts` is the single owner of both corpus paths (`bibleCorpusPath`, `songBookCorpusPath`), so this is two functions and their documented header, not a scattered edit.
- **`bible-translation` is the standard term, not `bible`.** In paths, in tables, in prose.
- **Book names belong to the translation** and ship inside its corpus file. Input is generous — typing `Kejadian` or `Genesis` searches names across every installed translation and resolves to one canonical book identity — and output is exact: the screen shows the chosen translation's own name. `BOOK_ALIASES` (`src/lib/scripture.ts:65`, verified 2026-08-01 — the citation the handoff brief carried had already rotted by one line) is a hard-coded English-only alias map covering two books, and it is what this replaces.

**The target schema is not this epic's to decide.** Per-translation book names, a canonical `bible_books` identity, a `bible_translations` registry carrying `locale`, and the rename `bible_verses.translation` → `translation_code` are routed to a `bmad-architecture` Update run. Stories below name what must be true, not the DDL.

> **That run landed the same day — cite it rather than re-deciding.** **AD-26** fixes the `bible_translations` registry, that the translation **code** is the globally unique key while **locale is an attribute that never enters a key or a predicate**, that the file declares and the path merely locates, and the `translation` → `translation_code` rename. **AD-27** fixes the canonical book identity — translation-independent, carrying no display text, with every name owned by a translation and a book outside the canon refused by name. **AD-25** fixes how any corpus reaches its table at all. Two things the run settled that this epic did not ask: the declared corpus field is spelled **`locale`**, not the `language` both committed files ship today, and a corpus whose file is missing or unreadable **does not reconcile** rather than reconciling to empty. The physical shape — a names table against a payload column, the canon as a seeded table against a module constant — is still the stories', deliberately.

Created 2026-08-01 by Correct Course. Not a story on Epic 12: that epic is `done`, and reopening a closed epic is the contradiction Correct Course closed on Epic 14 (2026-07-29) and avoided again when Story 19.1 was refused a place in the closed Epic 15.

**What is broken, measured 2026-08-01 rather than inherited from the coverage map.** `bible_books` and `bible_verses` are created by the startup DDL (`src/lib/db/index.ts:156-171`) and **nothing ever fills them**. The only writer is `scripts/import-kjv.mjs`, reading `.work/tp_bible_*.json` — a git-ignored export. A fresh clone therefore ships FR-19's UI, its API route and its empty-corpus message, and no corpus: the feature is unreachable by construction. The export holds **31,102 KJV verses across 66 books** — the canonical count — and normalises to **≈4.3 MB**, against 14.5 MB raw.

**Owner decisions, 2026-08-01.** The corpus is **committed**, not fetched by a setup-time downloader: offline in one step and no third-party host in the boot path, which is the reasoning NFR-1 already applies to the Sabbath deck. The `.work/tp_bible_*.json` export is **deleted once the committed corpus is verified** — the repository should not depend on an export whose terms it does not state — and the sequencing is load-bearing: delete after the corpus is green, never before.

**This epic seeds empty tables from zero, so AD-21 does not reach it.** No persisted value changes. That is why it carries no architecture gate while Epic 22 does, and why it can start immediately.

**Constraint: KJV is the shipped default, not the only possibility.** The corpus lands at `data/bible/<code>.json`, a shape a second translation extends by addition, and `bible_verses.translation` already exists and already defaults to `'KJV'`. What must not survive this epic is the *literal*: `lookupScripture()` takes no translation argument, `scripture.ts:116` and `isKjvCorpusEmpty()` hard-code `'KJV'`, and `/api/scripture` has no translation parameter.

#### Story 21.1: The Verse Database Ships With the Repository *(done — 2026-08-01)*
As an operator who has just cloned this repository,
I want scripture lookup to work without being handed a file,
So that FR-19 is a feature of the product rather than of one maintainer's disk.

Converts the export to a normalised `data/bible/kjv.json` and seeds it from zero on first boot. Provenance and licence are recorded beside it — KJV is public domain, with the UK Crown copyright exception stated rather than glossed. Completeness is asserted **structurally** (66 books, 1,189 chapters, 31,102 verses), not sampled. `.work/tp_bible_*.json` is deleted only once that assertion is green.

> **Path superseded 2026-08-01, after this story closed.** FR-24 moves the corpus to **`data/en/bible-translation/kjv.json`**. This story's AC-1 and its file list name `data/bible/kjv.json`, and they are left standing as the record of what shipped — the move is Story 21.2's to perform, not a retroactive edit to a `done` story. Everything else this story asserts (the seed-from-zero channel, the structural completeness counts, the deleted export) is unaffected: only the path changes.

#### Story 21.2: Translation Is a Parameter, Not a Literal *(done — story file 2026-08-01)*
As the system,
I want every scripture read path to name the translation it is reading,
So that a second corpus is an addition rather than a rewrite of six call sites.

`lookupScripture(ref, translation)`, a translation parameter on `/api/scripture`, and an emptiness check that answers per translation instead of for `'KJV'` alone — `isKjvCorpusEmpty()` becomes `isBibleTranslationEmpty(code)`. ~~The 503 message stops naming `.work/` and `npm run import:kjv`, which will no longer be how a corpus arrives.~~ **Struck 2026-08-01 by `bmad-create-story`: Story 21.1 already did that.** Verified at `route.ts:22-24` — the shipped message names neither, it names `npm run corpus:verify`. What is left for this story is a different thing: that message hard-codes a **translation** and the **old path**, and FR-22 requires absence to be reported *for that translation* while the others keep working.

**Measured 2026-08-01, so the story knows its own size.** The `'KJV'` literal survives at four sites in `src/lib/scripture.ts` — the type at `:6`, the emptiness count at `:106`, the lookup predicate at `:128` and the returned value at `:144` — plus the two importers in `src/app/api/scripture/route.ts`. That is the whole surface; the epic preamble's older "six call sites" and this list agree.

**Amended 2026-08-01 (FR-24).** This story also performs the **path move to `data/<locale>/bible-translation/<code>.json`** that supersedes Story 21.1's shipped path, and it is where `translation` becomes `translation_code`. Two rules bind every read path it touches: a listing endpoint returns **every** installed translation with its locale — **no `WHERE locale = …` reaches the database** — and a resolved reference displays the **chosen translation's own book name**, never a name from a setting or from another translation.

#### Story 21.3: A Default Translation, and the Presenter May Choose Another *(backlog)*
As an operator whose speaker is reading from a translation the hub does not default to,
I want to pick the translation at the moment of lookup,
So that what the congregation sees matches what is being read aloud.

A default-translation setting following the shipped per-concern pattern (`RetentionSettings.tsx`, `TransitionSettings.tsx`, with its key pair in `src/lib/settings.ts` — verified 2026-08-01: `RETENTION_KEY` and `SLIDE_TRANSITION_KEY` are the two existing precedents), a translation control in the Presenter panel, and — the part that is easy to miss — **a resolved passage records which translation it came from wherever it is persisted**, so a passage saved under one default does not silently re-render under another.

**Amended 2026-08-01 (FR-24).** This story owns **two** of the four settings — `default_bible_translation` and the shared `default_data_locale` — and it is where the never-filter rule becomes visible to an Operator. The translation control opens on the default locale's translations and carries an **always-present** way to reach the others; it is not a preference the Operator has to go and change. `default_data_locale` is a contact point with Story 22.3, which owns `default_song_book` and reads the same locale key: **append-shaped**, one `const` and its getter/setter each, exactly like the two precedents above. `ui_locale`, the fourth key, belongs to Epic 24 and is not this story's.

#### Story 21.4: Book Names Belong to the Translation *(backlog)* — FR-24

As an operator whose speaker reads from an Indonesian Bible,
I want to type `Kejadian` and see `Kejadian` come back,
So that the reference on the screen matches the one being read aloud.

Book names ship **inside** each translation's corpus file, so a new translation brings its own names in the same file and there is never a second place to edit. **This is the server half — the data, the schema and the one matcher. The operator input surface is Story 21.5.**

- **Input is scoped.** An Operator types inside the translation they have chosen: `1 Kings` under KJV, `1 Raja-raja` under TB. **There is no cross-language lookup on an operator surface**, and book names are used exactly as that translation spells them.
- **Output is exact.** What renders is the chosen translation's own name for that book and nothing else. Pick TB, look up Kejadian 1:1, and the screen reads *"Kejadian 1:1"* — following the translation, never a setting. Input and output now agree by construction, because both are that one translation's names.
- **One matcher, two scopes.** Operator surfaces match the **chosen** translation's names; the **rundown matches every installed translation**, because a Telegram sender picks none. Same implementation, scope as a parameter — not two matchers that happen to agree.
- **Longest-prefix match against corpus-supplied names replaces the regex**, and that is what finds where a book name *ends*. `Kisah Para Rasul 1:8` and `1 Raja-raja 3:5` both parse, so **the two-word cap and the hyphen stop being concepts** rather than being widened. Paste keeps working.
- **Non-prefix aliases live in the matcher and belong to a translation.** Prefix matching already absorbs `Ps`, `1 Cor` and `Kis` for free; the residue is `Jn`, `Mt` and their kind. They are held **by the matcher, never by a corpus file** — that is AD-27's one-way collapse — and each belongs to a translation, so **`Kej` must not resolve while KJV is chosen.** A collision between two translations in rundown scope is surfaced as **unmapped input (NFR-5), never guessed.**
- **`shortName` is dropped.** Six sites, measured 2026-08-01: the corpus files, `src/lib/corpus.ts:27`/`:108`/`:134`, the `bible_books.short_name` column (`src/lib/db/index.ts:227`, written `:100-117`, read `src/lib/scripture.ts:87-88`), the verifier assertion (`scripts/verify-corpora.mjs:71`) and the fixture (`tests/scripture.test.mjs:40`). Prefix matching is what replaces it — on an operator surface `Ps` still reaches Psalms through autocomplete, and the field ends up holding the full name.

The canonical book identity is what makes *"same passage, another translation"* a single query, so it is a schema property rather than a display convenience. **Its *properties* are settled and its *shape* is this story's to choose** — AD-27 fixes the identity as canonical, translation-independent and carrying no display text, and AD-28 fixes the matcher that reads its names, while whether the canonical list is a seeded table or a module constant, and whether the per-translation names are their own table or a payload column, are shapes the spine deliberately declines to fix (AD-19 precedent, recorded in its *Deferred*). *(Corrected 2026-08-01 by the AD-28 run's cross-document check. This line previously read "its shape is the `bmad-architecture` Update run's to settle, not this story's" — while the spine had already declined it in writing, so the two documents pointed at each other and this story read as blocked on a decision nobody was going to make.)*

**The retirement is a replacement, not a deletion, and it crosses an epic boundary.** `BOOK_ALIASES` (`src/lib/scripture.ts:65`) and **both** copies of the reference regex — `src/lib/scripture.ts:42` *and* `src/lib/parser.ts:152`/`:162` — collapse into the one matcher. `parser.ts` belongs to Epics 2/5, not to this epic; it is in scope here **because one rule may not have two implementations** (the spine's *Boundaries* convention), and today it has exactly that. Recorded so it is planned rather than discovered mid-implementation.

> **Settled 2026-08-01 — this story is unblocked, and the run found the retirement is not one job but two.** **AD-27** fixes the identity: translation-independent, carrying no display text, every name owned by a translation, and a book outside the canon refused **by name** rather than silently skipped. It also splits what this story was about to collapse — **a translation owns its *names*; one shared server-side matcher owns how forgivingly it *compares*.** Retiring `BOOK_ALIASES` wholesale drops the second half. Measured against the shipped code: of its six entries, `psalms` and `ps` are already redundant against the corpus, and `song of solomon` / `songofsolomon` / `sos` resolve to nothing — they target `Song of Solomon` while `data/bible/kjv.json` names book 22 `Song of Songs`.
>
> **The map is not the error, and this story needs the direction right before it starts.** The KJV's own title for book 22 **is** `Song of Solomon` — verified against Project Gutenberg's KJV, where the book heading reads *Song of Solomon* and *"the song of songs"* is a phrase inside verse 1, not the book's name. `Song of Songs` is the Hebrew-derived title other translations use, and it reached the file through the SQL export the corpus was normalised from. So the **corpus is wrong**, this is a live AD-27 *output is exact* violation on the shipped default translation, and it is a **one-word data fix** — after which two of those three entries are merely redundant and `sos` starts working. Checked across all 66 books, not just the one that surfaced: **exactly one mismatch against conventional KJV titles.**
>
> **The parser is the harder half and a corpus fix does not reach it:** `parseScriptureRef` caps a book name at **two words** and ASCII letters, so `Song of Solomon 2:1` is rejected just as `Song of Songs 2:1` is — the correct name is untypeable exactly as the wrong one was, and book 22 is the *only* book whose name runs past two words, which is why the cap has hidden this long. And it is **two limits, not one** — which only becomes visible in a second language. Probed against the shipped parser with Indonesian *Terjemahan Baru* names verified at `sabda.org`: **four of eight cannot be typed.** `Kisah Para Rasul 1:8` fails the word cap; `Hakim-hakim 2:16`, `1 Raja-raja 3:5` and `2 Raja-raja 2:11` fail on **the hyphen** — `[A-Za-z]+` does not match `-`, so the pattern stops at `Hakim`. Reduplication is ordinary Indonesian morphology, so this is a standing fraction of the book list rather than a long tail. `Kidung Agung`, `1 Tawarikh`, `2 Tawarikh` and `Wahyu` pass. **Sizing:** the answer is a matcher comparing against corpus-supplied names (AD-27), not a widened regex — admitting hyphens and three words is list-widening, and the next language brings a fourth shape. All of it is in the spine's *Deferred* under this story; an architecture run does not patch production code or data.
>
> **Amended the same day by the input-model Correct Course — read the AC above, not the two behaviours this block was written against.** The owner reversed *input is generous*: search is **not** cross-language on an operator surface, and the block's *"one shared server-side matcher"* is now **one matcher with a scope** — chosen translation for the operator, all installed for the rundown. Everything else in this block survives intact and is still owed: the `Song of Songs` → `Song of Solomon` corpus correction (still an *output is exact* violation, and `Song` now prefixes the right name), the two parser limits, and the sizing verdict — **a matcher over corpus-supplied names, not a widened regex** — which the owner's own answer independently confirms. The alias half is *narrowed rather than dropped*: aliases survive in the matcher for the rundown, which has no autocomplete to fall back on, but each belongs to a translation.

#### Story 21.5: One Field, Inline Autocomplete, Every Operator Surface *(backlog)* — FR-24

As an operator entering a verse reading,
I want to type the reference into one field and have it complete itself,
So that I never have to know where the book name ends.

**This is the operator half of Story 21.4.** 21.4 owns the data, the schema and the matcher; this story owns the surface. The contact point is the matcher's suggestion endpoint — **append-shaped**, nothing 21.4 has to reshape for it, the same cut `default_data_locale` already uses between Stories 21.3 and 22.3.

- **One field, not a picker.** A single input holds the whole reference — **no book dropdown and no separate chapter/verse fields.** The owner chose this over the picker that was recommended, and the choice pays for itself: the field still has to find where the book name ends, but longest-prefix match against corpus-supplied names does that, so **paste of a full reference keeps working** and the picker's *second* mechanism for the rundown is never needed.
- **Inline autocomplete, scoped to the chosen translation.** Suggestions come from Story 21.4's matcher in operator scope — never across translations.
- **Accepting a suggestion leaves the full corpus name in the field.** This is what pays for dropping `shortName`: `Ps` still reaches Psalms as a *typing shortcut*, and the abbreviation is never stored anywhere.
- **One component serves every operator surface** — Presenter Mode lookup and the create/edit service forms — on the shipped `HymnNumberAutocomplete` precedent (`src/components/HymnNumberAutocomplete.tsx`), already mounted at four sites in `src/app/services/new/CreateForm.tsx` and four in `src/app/services/[id]/EditForm.tsx`.
- **Follow that precedent's mechanics, not merely its shape:** `'use client'`, a debounce before the round trip, a settled-response cache keyed by query string, and in-flight de-duplication so concurrent callers share one request (`HymnNumberAutocomplete.tsx:25`, `:41-45`, `:57-81`). The matcher stays server-side — `better-sqlite3` is server-only.
- **An unresolved reference is visible as a defect, never silently blank** — the same posture Epic 24 fixes for an unresolved interface string.

**No `src/proxy.ts` change, verified rather than assumed (2026-08-01).** The matcher's exclusion list is `api/webhook`, `api/auth/login`, `api/auth/logout`, `login`, `_next/static`, `_next/image`, `favicon.ico` and `assets`. `/api/scripture` and `/api/hymns` carry no exclusion, so they are **gated by default** and a sibling suggestion endpoint inherits the session gate — `tests/proxy-matcher.test.mjs` is untouched. Stated because AD-5 makes that regex the authorization boundary, and a new endpoint is exactly when someone reaches for it.

### Epic 22: The song book is a choice, and its titles are real *(in-progress — Stories 22.1 and 22.2 done 2026-08-01; 22.3 backlog)*

**FRs addressed:** FR-2 (validate/resolve Hymns by number — the corpus it resolves against becomes reproducible, correctly titled and licensed in writing), **FR-23** (several song books, one default) — added to the PRD by the same Correct Course — and, since the second Correct Course of 2026-08-01, **FR-24** (Data Locale) for the song-book half.

**Amended 2026-08-01 by the second Correct Course of the day — read this before Story 22.3.** The locale axis lands in this epic rather than in one of its own for the same reason it lands in Epic 21: this epic already owns `hymns`, the corpus file and every hymn read path, and a separate locale epic would have had to reach into them alongside Epic 21's `bible_verses`. Three things change:

- **The corpus path moves to `data/<locale>/song-book/<code>.json`** — e.g. `data/en/song-book/sdah.json`. This **supersedes the `data/song-book/sdah.json` that Story 22.1 shipped and asserts in its acceptance criteria**; that story is `done`, and its AC is superseded in writing in the story file rather than quietly rewritten.
- **`hymns.book_code` becomes `song_book_code`**, and a `song_books` registry carries each book's `locale`, name, attribution and licence.
- **`song-book` is the container term; `hymn` stays the entry term.** Recorded as a decision, because it is the one place the vocabulary deliberately stops: the **`hymns` table keeps its name**, so does **`/api/hymns`**, and so do the **`resolvedHymns` / `failedHymnNumbers`** webhook fields — that last pair is an external contract an outside Telegram bot consumes (`src/app/api/webhook/route.ts`), and renaming it would break a caller this product does not own.

**The target schema is not this epic's to decide** — the `song_books` registry shape is routed to the same `bmad-architecture` Update run that already blocks Story 22.2's successor question.

> **That run landed 2026-08-01 and both halves are settled.** **AD-26** fixes the `song_books` registry and the `book_code` → `song_book_code` rename, and gives the rename a reason beyond tidiness: `book_code` names a *song* book here while `bible_books` makes *book* mean a Bible book next door. It also fixes that the song-book **code** is the globally unique key while **locale is an attribute** — two files declaring one code refuse the boot, and a `default_song_book` naming an uninstalled book is **inert rather than an error** and is not rewritten, so re-installing restores the choice. **AD-25** answers the successor question below.

**What is broken, and it is worse than `deferred-work.md` records.** `data/hymns.json` is committed but **cannot be regenerated at all**: `scripts/import-hymnal.mjs` reads `.work/lirik-lagu.json`, which does not exist on this machine or anywhere under the project root. The committed output is the only surviving copy — found 2026-08-01 while verifying the entry that said only that the corpus was un-reviewed for licence.

**Titles are first lyric lines, and that is by design rather than a bug.** The source dump carried no title column, so `deriveTitle()` (`scripts/import-hymnal.mjs:23`) takes the first line after a `Verse` header, exactly as `spec-phase1-hymnal-fr4-parser.md:115` instructs. SDAH #522 is stored as *"My hope is built on nothing less"*; its title is *"The Solid Rock"*. 40 of the 695 stored titles run past 45 characters. This matters beyond tidiness: PRD `:120` makes the resolved-title readback the product's **only** defence against a valid-but-wrong SDAH number, and a readback that echoes a lyric line is not a check a human can fail.

**A second song book cannot be stored today — this is schema, not configuration.** `hymns.number` is `NOT NULL UNIQUE` (`src/lib/db/index.ts:106`), globally unique, and every hymnal has a #1. **Eight** read sites query `hymns` with no book qualifier (`api/hymns/route.ts` ×4, `services/[id]/page.tsx:126`, `lyrics.ts` ×2, `parser.ts:240`) and all become ambiguous the moment a second book exists. *(Corrected 2026-08-01: this sentence said "Seven" and then listed eight. Re-counted against `src/` the same day — the list was right and only the word was wrong. There are now **nine** `FROM hymns` in `src/`, and the ninth is deliberately **not** in this list: `db/index.ts:47` is the one-time `INSERT…SELECT` boot migration Story 22.1 introduced to stamp existing rows, not a read path a second book makes ambiguous.)* `book_code` and `UNIQUE(book_code, number)` therefore land in Story 22.1, beside the file move, so the table is touched once — the spine's own argument for the Epic 20 `base_type` collapse (*"cheap only while no production system exists"*, with no deployment confirmed 2026-07-29) applies unchanged.

**Owner decision on licence, 2026-08-01: an accepted risk, not a review.** The SDAH lyrics ship with attribution to the copyright holder and a stated willingness to take them down on request. This is the owner's standing decision and it closes the spine's `Deferred` bullet at `:363` — the one Story 20.1's seed work was told it would touch.

**One architecture gate and one epic gate:**

- ~~**Story 22.2 is blocked on a `bmad-architecture` Update.**~~ **Gate settled 2026-08-01 by AD-25 — and the answer is neither of the two this bullet offered.** A shipped reference corpus is a **projection of its committed file**: developer-owned, exactly one writer, the file authoritative and the table reconciled to it. So correcting 695 titles was never AD-21's case — a corpus table holds no value anybody persisted deliberately — and AD-21's counter is still unassigned at Epic 20's first release. What *does* change for **Story 22.3**: the reconcile becomes **complete**, so a hymn the corpus no longer holds is removed rather than surviving, bounded to that book's own code; and a missing or unreadable corpus file **does not reconcile at all** rather than reconciling the book to empty. The bullet's own text is left standing below as the record of the question, because it was the right question and the framing is what turned out to be wrong. No AD governs a *shipped reference corpus*: AD-11 and AD-17 govern the registry seed only, while the hymnal is upserted on **every boot** (`src/lib/db/index.ts:262`), overwriting `title` and `lyrics` — the boot-time value-change channel AD-17 removed for the registry and AD-21 routes through a declared transition *n*→*n+1*. Correcting 695 persisted titles is exactly AD-21's case, and the spine records at `:370` that **AD-21's counter does not exist and no story owns introducing it**. The same run amends the Structural Seed tree (`:315` names `data/ # hymnal corpus (hymns.json)`; `:322` the scripts list) and clears the two `Deferred` bullets (`:360`, `:363`).
- **Story 22.3 is gated on Epic 20 Story 20.7.** A per-song "which book" qualifier hangs off the same binding AD-19 governs, and AD-19 fixes that a weekly value has **exactly one persisted home** and that the four `songset-*` slot identities **replace** `song1Number..song4Number`, *"deleted, not aliased"*. Built before 20.7, this ships four fields Epic 20 then deletes.

#### Story 22.1: The Song Book Ships as One of Several, and Says Whose It Is *(done — 2026-08-01)*
As a maintainer,
I want the corpus at `data/song-book/sdah.json`, carrying its own book code and its attribution,
So that the last undocumented corpus stops being unreproducible, unattributed and unable to have a sibling.

Moves the file, adds `hymns.book_code` (default `'SDAH'`) with `UNIQUE(book_code, number)`, writes the attribution and takedown statement, and updates the loader. **It must also decide what `npm run import:hymnal` now means** — its source is gone, so the committed corpus becomes the source of record and the script is repointed or retired. It does not stay in `package.json` pointing at a file nobody has.

> **Path and column superseded 2026-08-01, after this story closed.** FR-24 moves the corpus to **`data/en/song-book/sdah.json`** and renames the column this story added, `book_code` → **`song_book_code`**. This story's AC-1 and its file list name `data/song-book/sdah.json`, and they are left standing as the record of what shipped — the move and the rename are Story 22.3's to perform, not a retroactive edit to a `done` story. The `UNIQUE(…, number)` constraint, the attribution and the retired importer are unaffected.

#### Story 22.2: A Hymn Title Is a Title *(done — 2026-08-01)*
As an operator confirming a hymn number before it enters the run sheet,
I want the readback to show the hymn's actual title,
So that FR-2's only defence against a valid-but-wrong number is checking something a human can recognise.

**Fix at the generator and re-run the import — do not hand-patch 695 rows.** That is `AGENTS.md`'s *prefer not producing the value to blocking it afterwards*, and it is the disposition `deferred-work.md` recorded for this finding on 2026-08-01, hours before this epic existed: that entry named `bmad-correct-course` as the route to give the finding an owning epic, and this story is what the route produced. Because the original source is gone, *the generator* now means one that reads the committed corpus plus the owner-supplied title index and writes `data/song-book/sdah.json` — so 22.1 lands first and the join happens once, in the new file.

**Four consumer boundaries make the title payload rather than internal**, which is why this is not a quick fix: the song title slide (`slide-plan.ts:158`, `songTitle: hymn.title`, FR-5), the group label, the number+title autocomplete (Story 14.6) and picoclaw's `resolvedHymns` readback (Story 6.5). `tests/pptx-content.test.mjs` asserts title text, so correcting the corpus **moves the suite** — expected, and part of this story rather than a surprise in review. One artefact already disagrees with the data in writing: `epics.md:382` gives the intended title slide as `"O Worship the King · SDAH #83"` while the corpus stores `"O worship the King, all-glorious above"`.

Blocked on the architecture gate above **and** on the owner-supplied index. Neither is a decision this story makes.

#### Story 22.3: A Default Song Book, and a Per-Song Override *(backlog)*
As an operator planning a service that draws one song from another book,
I want to say which book that song comes from,
So that the deck resolves the hymn the worship team actually meant.

A default-song-book setting on the shipped per-concern pattern, a per-song override in the worship form, and the chosen book **persisted beside the number in the same single home AD-19 requires** — never as a second copy. Gated on Story 20.7.

**Amended 2026-08-01 (FR-24), and the amendment is most of the story now.** This is where the song-book half of the locale axis lands, because the override and the locale browse are the same control seen twice:

- Owns **`default_song_book`** and reads the shared **`default_data_locale`** — the contact point with Story 21.3, append-shaped, one `const` plus getter/setter each on the `RETENTION_KEY` / `SLIDE_TRANSITION_KEY` precedent in `src/lib/settings.ts`.
- Performs the **path move to `data/<locale>/song-book/<code>.json`** and the **`book_code` → `song_book_code`** rename that supersede Story 22.1.
- **The never-filter rule, stated as the case that must work: an Indonesian service that sings one English hymn.** Picking that hymn changes no setting, and the next song still defaults to the Indonesian book. The listing API returns **every** installed song book with its locale; `default_data_locale` decides only what the picker shows first, and **no `WHERE locale = …` reaches the database**.
- Eight unqualified `FROM hymns` read sites (listed in this epic's preamble) become book-aware here. The ninth, the boot migration, is not one of them.

Still gated on Story 20.7 — the per-song override hangs off the four `songset-*` slot identities `AD-19` governs, and those replace `song1Number..song4Number` rather than aliasing them.

### Epic 23: A fresh clone runs *(backlog)*

**FRs addressed:** none directly — this epic makes FR-2, FR-19, FR-22 and FR-23 reachable by someone who has just cloned the repository, and verifies they stay that way. Recorded as a decision rather than left silent, the way Epic 17's requirement ancestry is: nothing here changes a Deck, a Slide Type or a payload contract.

Titled with the owner's own phrase. The work is neither corpus family's, and attaching it to one would put `scripts/`, `tests/` and `docs/` under two epics at once — the touch-it-twice problem this three-way split exists to avoid.

**Owner decision, 2026-08-01: demo data is opt-in.** `npm run seed:demo` never runs by itself. A seeder that ran automatically would put synthetic worship data into a real congregation's install — the failure AD-17 exists to prevent in the registry, arriving through a different door.

#### Story 23.1: A Fresh Clone Can Show a Finished Deck *(backlog)*
As someone evaluating or developing this product,
I want one opt-in command that fills an empty install with a believable service,
So that I can see a generated deck without inventing a congregation first.

A synthetic service, rundown and announcement set, using the same invented congregation the shipped registry already uses. Refuses to run on a database that already holds services. The fixture is **authored** synthetic under the *prefer not producing the value* rule in `AGENTS.md` rather than filtered afterwards, and is covered by `tests/public-repo-guard.test.mjs`.

#### Story 23.2: The Fresh-Clone Path Is Verified, Not Assumed *(backlog)*
As a maintainer,
I want the clone-to-working-deck path exercised by the suite,
So that the next corpus to quietly stop shipping is caught here instead of by a volunteer on a Sabbath morning.

`npm install` → `npm run setup` → `npm run seed:demo` yields a resolvable scripture reference, resolved hymn titles and a generated deck. Carries the documentation sweep the corpus moves leave behind. **Stated as a criterion rather than a line list, deliberately** — line numbers in this repository rot within days, and one merge moved six spine citations while this proposal was being written. The criterion: **no tracked document may still tell a reader to run `npm run import:kjv` or `npm run import:hymnal` to obtain a corpus, or name `data/hymns.json` as the corpus path.** Grep for `import:kjv`, `import:hymnal` and `data/hymns.json` across `docs/` and `README.md`; eight files matched on 2026-08-01 (`deploy.md`, `development-guide-monolith.md`, `index.md`, `QUICKSTART.md`, `data-models-monolith.md`, `liveserver-implementation-plan.md`, `source-tree-analysis.md`, `README.md`). This is the story that would have caught the FR-19 gap in 2026-07-19.

> **Amended 2026-08-01 (FR-24).** The corpus paths move again, to `data/<locale>/bible-translation/<code>.json` and `data/<locale>/song-book/<code>.json`. This story's criterion is written as a rule rather than a line list precisely so an amendment like this does not invalidate it — but the **rule itself widens**: no tracked document may name `data/hymns.json`, **`data/bible/`** or **`data/song-book/`** as a corpus path, nor tell a reader to run `npm run import:kjv` or `npm run import:hymnal`. The two middle spellings are new, and they are ones this repository's own documentation started using *this morning*, which is the argument for the criterion form restated in miniature.

### Epic 24: The interface speaks the operator's language *(in-progress — Story 24.1 ready-for-dev; 24.2 backlog)*

**FRs addressed:** **FR-25** (UI Locale) — added to the PRD by the second Correct Course of 2026-08-01, as new §4.12.

Created 2026-08-01. **Deliberately not folded into Epic 21 or 22**, which carry the *data* half of the same day's locale work. The two halves share a word and nothing else — no table, no module, no test, no file. FR-24 is a data-layer capability over two corpus registries; this epic is an interface-wide string refactor. Bundling a UI-wide refactor into a data-layer epic is exactly the drift pattern `AGENTS.md` names after Epic 14, and separating them is also what keeps the two worktrees from colliding: this epic touches no corpus file and no corpus table, and Epics 21–22 touch no `.tsx` string.

**Requirement ancestry is FR-25, not `DESIGN.md`** — recorded because Epic 17 sets the opposite precedent. Epic 17's stories change the operator chrome's *visual identity*, which the `AGENTS.md` authority map assigns to `DESIGN.md` rather than to a PRD FR. This epic changes what the product *says*, in every surface, driven by a stored setting — a product capability, so it gets an FR. The distinction is the same one that gave Epic 16 FR-20 and left Epic 17 without one.

**What exists today, measured 2026-08-01 rather than estimated.** **No i18n infrastructure of any kind.** `lang="en"` hard-coded at `src/app/layout.tsx:31` is the entirety of it. The surface is small and that is the point — 39 `.tsx` files, 26 client components, roughly 55 user-facing literals in JSX and attributes, plus about 158 message strings under `src/lib` and `src/app/api`, many of them developer-facing and not translatable. **Estimate 100–150 real strings.**

**Two boundaries, both load-bearing:**

- **Projected slide text is already data and is out of scope.** The 28 templates in `data/default-registry.json` hold their text in element `content` fields, Admin-editable via FR-20 / Epic 16. Whatever an Admin types is what projects. There is deliberately **no `projection_locale`** (PRD §4.12), so nothing this epic builds may reach a room-facing surface — which is Epic 17's *"the congregation never sees operator chrome"* constraint read in the other direction.
- **The planner's legacy labels are in scope, and this is the one non-obvious inclusion.** `src/lib/slide-plan.ts` hard-codes English headings — *Welcome*, *Opening Song*, *Congregation, please stand*, *Prayer Partners*, *Break Time*. Verified 2026-08-01: they populate the plan's `LegacyProjection` field (`slide-plan.ts:76`), read **only** by `src/app/services/[id]/present/presenter-model.ts` and `src/components/SlidePreviewList.tsx`. **`pptx.ts` does not read it and neither does the projector** — grepped, zero hits. They are operator chrome, so they belong here. *The handoff brief scoped these to `slide-plan.ts:260-360`; re-measured, the literals run from `:260` to at least `:662` — 36 `title:` / `subtitle:` literals in the file — so the range in that brief understates the work and the story should not inherit it.*

**Noted, and explicitly out of scope:** `src/lib/slide-plan.ts:261` hard-codes `'Bandung International Community'` — a church name living in code rather than configuration. Story 24.2 passes directly over this line and will be tempted to fix it. It should not: a church name is not a translatable string, and moving it to configuration is a different capability with a different owner. Recorded here so the temptation is a decision rather than a drive-by.

#### Story 24.1: A String Catalogue, a Switcher, and an Honest `lang` *(ready-for-dev — story file 2026-08-01)*

As an operator who reads Indonesian more comfortably than English,
I want to set the hub's language and have the page say which language it is in,
So that the interface meets me where I am and a screen reader is not lied to.

The infrastructure half: a string catalogue, the `ui_locale` setting on the shipped per-concern pattern (`RetentionSettings.tsx` / `TransitionSettings.tsx`, key pair in `src/lib/settings.ts`), a switcher, and `<html lang>` following the setting instead of the hard-coded `"en"`. **An unresolved key must be visible as a defect, not rendered blank** — a missing translation that fails silently is how half a UI ships in the wrong language without anyone noticing.

`ui_locale` is the fourth of FR-24's four settings keys and the only one this epic owns; `default_data_locale`, `default_song_book` and `default_bible_translation` belong to Epics 21 and 22. **The contact point is `src/lib/settings.ts` and one admin component** — append-shaped, one `const` plus getter/setter, the same merge surface the 2026-08-01 cut already accepted between Epics 21 and 22.

#### Story 24.2: The Strings Move *(backlog)*

As a maintainer,
I want every user-facing literal resolved from the catalogue rather than typed inline,
So that adding a language is a data change and not another sweep of 39 files.

The 100–150 strings, including the `slide-plan.ts` operator-facing labels above. Mechanical by construction, which is why it is separate from 24.1: the infrastructure decision is small and worth reviewing on its own, and the sweep is large and worth reviewing as a sweep. **The two boundaries in this epic's preamble are the acceptance surface** — nothing this story touches may reach the PPTX or the projector, and the church name at `slide-plan.ts:261` stays where it is.
