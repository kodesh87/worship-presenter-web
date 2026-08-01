---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-post-merge-realign, step-05-audit-hygiene-2026-07-19, step-06-correct-course-2026-07-29]
inputDocuments: ['_bmad-output/planning-artifacts/prds/prd-bic-pptx-workflow-2026-07-10/prd.md', '_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md', '_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md', '_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md']
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

Delivered across Stories 16.1–16.5. Specs: `../specs/spec-slide-artifact-model/SPEC.md` (contract), `../implementation-artifacts/spec-16-2-artifact-pipeline-completion.md` (Stories 16.2–16.5). `epics-parallel-delivery-analysis.md`, which proposed an alternative 16.2–16.8 decomposition, is **superseded** — its AR19 reconciliation never happened, so this three-story breakdown remained authoritative.

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

