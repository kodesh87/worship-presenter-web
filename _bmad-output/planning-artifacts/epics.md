---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-post-merge-realign, step-05-audit-hygiene-2026-07-19, step-06-correct-course-2026-07-29]
inputDocuments: ['_bmad-output/planning-artifacts/prds/prd-bic-pptx-workflow-2026-07-10/prd.md', '_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md', '_bmad-output/planning-artifacts/architecture/architecture-epic-16/ARCHITECTURE-SPINE.md', '_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md', '_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md']
last_realigned: '2026-07-29'
note: 'Realigned by Correct Course 2026-07-29 (sprint-change-proposal-2026-07-29.md): FR-11b and FR-20 added to the inventory and coverage map; NFRs given the stable ids PRD §10 now carries; coverage map refreshed past Epics 14-16 (FR-11 Partial → Done); Epic 14 closed; Epic 16 story-file reality stated. Remaining product Partial: FR-19 (KJV corpus still not under data/, import:kjv remains an ops step). See ../implementation-artifacts/deferred-work.md.'
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
| FR-19 | Epic 12 | Partial (`import:kjv` + Presenter lookup; KJV corpus still not committed under `data/` — re-verified 2026-07-29, `data/` holds `hymns.json` only) |
| FR-20 | Epic 16 | Done (Artifact Registry + canvas editor; contract in `../specs/spec-slide-artifact-model/` and `../implementation-artifacts/spec-16-2-artifact-pipeline-completion.md`) |

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

### Epic 14: Worship Web Input Boundary *(done — closed 2026-07-29 by Correct Course)*

Retrospective BMAD for commit `b679ff7` closed Story `14-1`. Spec: `spec-worship-web-input/SPEC.md`. FR-11 Edit Service inputs via web form. Story `14-2` (UX refinements: Parse button, hymn autocomplete, unified raw input) reopened the epic via Correct Course (`sprint-change-proposal-14-2-ux.md`). Stories `14-3` (UI tweaks) and `14-4` (show→create-parity + shell; CAP-7/CAP-8) continue the epic from operator testing of `/services/[id]`. Story `14-5` (Sermon Card split + CAP-6 KJV resolve) from post-14.4 operator testing. Story `14-6` (remove Service Highlights, hymn number+title display, Announcement Flyers helper UX) from post-14.5 operator testing / SPEC companion revisions.

Planning drift for 14.1 closed by Correct Course 2026-07-19 (`sprint-change-proposal-2026-07-19.md`).

**Closed 2026-07-29** by Correct Course (`sprint-change-proposal-2026-07-29.md`): all six stories `14-1`…`14-6` were already `done`, so both this heading and `epic-14: in-progress` contradicted the sprint tracker's own definition (*"done: All stories in epic completed"*). **FRs realized: FR-11 and FR-11b** — the latter was absent from this document entirely until the same Correct Course, despite being a Phase-1 requirement in `prd.md` (§6) and the documented fallback for a Telegram intake outage (UJ-5).

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
So that NFR-5 (robust parsing) and NFR-6 (access control) are covered.

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

**Realizes FR-20** (§4.10 of the PRD), added 2026-07-29. Until then this epic — a runtime-editable template system that changes how every slide is produced — had no FR ancestry at all, in a document that declares PRD FR numbers authoritative.

**Story-file reality (recorded 2026-07-29):** only Story 16.1 has a story file. Stories 16.2–16.5 shipped with no story file and therefore no acceptance criteria; their four `done` keys have been retired from `sprint-status.yaml` rather than backfilled with AC written to match already-shipped code. `spec-16-2-artifact-pipeline-completion.md` is the delivery contract for all four. The user-story statements below are retained as the scope record — they are not evidence that a tracked, AC-bearing delivery unit existed.

### Story 16.1: Artifact Registry & Canvas Editor Foundation *(delivered)*
As an administrator,
I want a SQLite-backed Artifact Registry seeded from validated JSON, with 7 base types and a constrained canvas editor for existing templates,
So that global slide layouts can be safely edited and restored without deploying code changes (CAP-1, CAP-2, CAP-3, CAP-9).

### Story 16.2: buildSlidePlan Refactoring & Placeholder Resolution *(delivered — no story file; contract: `spec-16-2-artifact-pipeline-completion.md`)*
As the system,
I want `buildSlidePlan` to output `ArtifactInstance[]` and resolve dynamic placeholders (and standing defaults) from `ParsedRundown` and `SlidePlanMedia`,
So that the output feeds downstream consumers uniformly (CAP-4, CAP-7, CAP-8).

### Story 16.3: Unified Rendering across PPTX & Web Slideshow *(delivered — no story file; contract: `spec-16-2-artifact-pipeline-completion.md`)*
As the system,
I want PPTX (`pptx.ts`) and Web Slideshow (`SlideView.tsx`) to render directly from the positioned elements defined in the Artifact JSON,
So that layout changes apply instantly across both formats without hardcoded switch statements (CAP-6).

### Story 16.4: Live Slide Preview & Semantic Badges *(delivered — no story file; contract: `spec-16-2-artifact-pipeline-completion.md`)*
As an operator,
I want the Live Slide Preview to group children under parents (e.g. SongSets) and display semantic Artifact labels,
So that the preview accurately reflects the worship structure and Artifact taxonomy (CAP-5).

### Story 16.5: Canvas Element Authoring *(delivered — no story file; contract: `spec-16-2-artifact-pipeline-completion.md`)*
As an administrator,
I want to add and delete my own text boxes and shapes on an editable Artifact template,
So that layouts can be extended without a code change.

**Note:** seeded element IDs and any element marked `required` stay immutable — the save API rejects their removal or rename (400) and read-only base types (FullScreenImage, SongSet, Announcement) expose no add/delete affordances at all. Only elements authored in the editor may be deleted.

### Epic 17: An operator surface that is readable and honest *(in-progress — Story 17.1)*

Created 2026-07-29 from the implementation-readiness assessment's product defects, via the epic route rather than inline patching — the point of Correct Course that day was that inline is how the drift happened. Titled around what an operator gets, per the C5-1 remediation: the value standard applies to new epics from here.

**Requirement ancestry — a recorded decision, not an omission.** These stories change the *operator chrome's* visual identity and self-presentation. Per the authority map in `AGENTS.md`, that is governed by `DESIGN.md`, not by a PRD FR. Unlike Epic 16 — which changed how every slide is produced and needed FR-20 — nothing here alters a Deck, a Slide Type, or any payload contract. **Constraint that keeps that true:** whatever an operator's theme, the projected output (`slide-surface`, PPTX, projector window) must be byte-identical. The congregation never sees operator chrome.

### Story 17.1: Reachable Dark Mode *(ready-for-dev)*
As an operator running a service in a dim sanctuary,
I want the hub to follow a dark theme I can choose,
So that a full-brightness white screen in my hands does not light up the room.

**Corrected 2026-07-30 (`bmad-ux` Update):** this story previously ended *"…stops being dead code"*, inheriting a claim from the readiness assessment. The 33-token `.dark` palette is **not** dead — `PresenterOperator.tsx:449` and `SlideGridDialog.tsx:176` pin the class on their own wrappers and `globals.css:5` matches any descendant, so it renders today in the two surfaces an operator uses during a service. What is missing is **choice**, and the story's real constraint is to add it *without* disturbing those two deliberate opt-outs.

### Story 17.2: `muted-foreground` Contrast *(backlog)*
As an operator reading secondary text,
I want the muted foreground token to meet WCAG AA,
So that labels, hints and timings are legible. Measured 2026-07-29 against the running app: **4.35:1 on `muted`, which fails AA (4.5:1)**, and 4.74:1 on `background`, passing by 0.24. Darkening `--muted-foreground` to about `#6b6b6b` clears both surfaces; no other token moves.

### Story 17.3: The App Says Its Own Name *(backlog)*
As anyone with the hub open,
I want the browser tab and bookmarks to name this application,
So that it is not filed as *Create Next App*. `src/app/layout.tsx` still exports the create-next-app `metadata`. One-line change; the wording is product-owned.

### Story 17.4: Unsaved Canvas Work Is Not Lost Silently *(backlog)*
As an administrator editing an Artifact template,
I want a dirty indicator and a navigation guard,
So that leaving the canvas editor cannot discard layout work without warning. Today unsaved changes are invisible to the application (FR-20 surface).

### Story 17.5: The Presenter Knows When the Projector Is Gone *(backlog)*
As an operator presenting to a congregation,
I want the presenter to tell me the moment the projector window stops answering,
So that I cannot advance a deck for the rest of a service with nothing on the second screen.

**Added 2026-07-30 by `bmad-ux` Update.** This is the one finding of that run that was not a documentation defect. `EXPERIENCE.md` had specified *Lost sync* as a cross-cutting state since 2026-07-19 and asserted in Flow 3 Branch 3a that the presenter surfaces it immediately; verified against `src/`, **no detection of any kind exists.** `BroadcastChannel` gives the sender no delivery signal, `src/lib/present-channel.ts` defines no heartbeat or acknowledgement, and `projectorRef.current.closed` is read only inside `openProjector` — only if the operator clicks the button again. The only surfaced projector state is `projectorBlocked`, which is the popup blocker.

**Constraint:** INIT AD-10 forbids a server realtime channel, so this is solved locally or not at all — a `closed` poll on the retained window handle, or an acknowledgement message added to `present-channel.ts`. Extending `PresentMessage` is a wire change and the presenter must stay the single authority (see that file's header contract).

**Placed in Epic 17 rather than its own epic** because it is precisely what this epic is named for: an operator surface that is *honest* about what the congregation is seeing.

### Epic 18: Member data stays gated even when the perimeter moves *(backlog)*

**FRs addressed:** FR-18 (per-person accounts and Roles), NFR-6 (access control — no endpoint exposes member PII).

Nine API routes rely on `src/proxy.ts` as their only authorization layer, with no in-route `requireSession`. The gate's `config.matcher` regex *is* the authorization boundary, so anything unmatched is served with no session check — a single exclusion added without its matching assertion silently publishes member data. `tests/proxy-matcher.test.mjs` guards the regex; nothing guards a route that stops being matched. The pressure test raised this as watch-list item **L4** ("hand-rolled auth is a time sink and a security risk for a solo dev") and it was accepted un-actioned; `deferred-work.md` then recorded the nine routes. This epic is that item coming due.

Separate from Epic 17 deliberately: one epic is what an operator sees, this one is what a visitor must never see. Bundling them would have produced exactly the mixed technical/UX epic C5-1 flags.

### Story 18.1: In-route Authorization for the Nine Proxy-Only Routes *(backlog)*
As a church member whose name and prayer request live in this system,
I want every API route to check the session itself,
So that no single regex edit can expose Service data. Privileged routes re-check role against the database (`requireAdminSession`), not the cookie.

### Epic 19: Liturgical rules live in data, not in the planner *(backlog)*

Created 2026-07-30 at the owner's direction, to give a tracked home to an item that had been carried as a bare *"Consider"* in `sprint-status.yaml` since the 2026-07-29 Correct Course. A "Consider" with no story is how a decision stays unmade indefinitely.

**Not opened as a Story 15.2.** Epic 15 (*Parser & Rendering Refinements*) is `done`, and reopening a closed epic for this is the exact contradiction Correct Course closed on Epic 14 the day before. This is also not a refinement: moving a rule from code to data is a new capability.

> **This epic may be absorbed whole.** `spec-artifact-registry-authoring` CAP-1 states its success criterion as *"reordering two registry entries … **without editing TypeScript plan constants**"* — and the constant below is one of those. That SPEC is a canonical contract that no epic, story or sprint key currently references, and whether to adopt it is a pending owner decision. If it is adopted, this epic is a subset of it and should be folded in rather than delivered twice. Recorded here so the overlap is visible at the point of work, not discovered during it.

### Story 19.1: Song-Title Suppression Becomes Registry Data *(backlog)*
As an administrator adjusting the order of service,
I want to control which songs are announced with a title slide,
So that a liturgical decision does not require a code change and a deploy.

A normal Song Block renders a title slide (`"O Worship the King · SDAH #83"`) followed by its lyric slides — FR-5. Three call sites in `src/lib/slide-plan.ts` suppress that title with `{ skipTitle: true }`:

| Site | Song | Why the title is suppressed |
| --- | --- | --- |
| `slide-plan.ts:438` | Standing response either side of the intercessory prayer (the fixed `#671` / `#684` pair) | The congregation is already standing and sings straight in; announcing a number breaks the prayer |
| `slide-plan.ts:460` | Around the Special Song | Same reason |
| `slide-plan.ts:550` | Closing *We Have This Hope* (`weHaveThisHopeFixed`) | A fixed song needs no introduction |

Each is a **liturgical** judgment about this congregation's order of service, currently expressed as a literal in the slide planner. The Artifact Registry now exists and is runtime-editable (FR-20), so the rule *can* be data.

**Open question the story must answer before implementation, not during:** whether suppression is a property of the template, of the plan node, or of a service-level setting. Getting that wrong makes the rule harder to change than the literal it replaced. `buildSlidePlan` must remain the single slide-order source for PPTX, slideshow and presenter (INIT AD-7) — this story moves *where the rule is stored*, never who applies it.

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
