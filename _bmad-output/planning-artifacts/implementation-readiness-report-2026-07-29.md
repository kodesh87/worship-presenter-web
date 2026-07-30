---
project_name: 'worship-presenter-web'
user_name: 'kodesh87'
date: '2026-07-29'
stepsCompleted:
  - step-01-document-discovery
  - step-02-prd-analysis
  - step-03-epic-coverage-validation
  - step-04-ux-alignment
  - step-05-epic-quality-review
  - step-06-final-assessment
readinessStatus: 'NEEDS WORK'
findingsTotal: 38
assessor: 'bmad-check-implementation-readiness (Claude Opus 5)'
documentsIncluded:
  prd:
    - _bmad-output/planning-artifacts/prds/prd-bic-pptx-workflow-2026-07-10/prd.md
    - _bmad-output/planning-artifacts/prds/prd-bic-pptx-workflow-2026-07-10/addendum.md
    - _bmad-output/planning-artifacts/prds/prd-bic-pptx-workflow-2026-07-10/pressure-test-findings.md
  architecture:
    - _bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md
    - _bmad-output/planning-artifacts/architecture/architecture-epic-16/ARCHITECTURE-SPINE.md
  ux:
    - _bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md
    - _bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md
  epics:
    - _bmad-output/planning-artifacts/epics.md
    - _bmad-output/planning-artifacts/epics-parallel-delivery-analysis.md
  stories:
    - _bmad-output/implementation-artifacts/stories/ (38 files, epics 1-16)
  tracking:
    - _bmad-output/implementation-artifacts/sprint-status.yaml
  specs:
    - _bmad-output/specs/spec-worship-web-input/SPEC.md
    - _bmad-output/specs/spec-lyrics-and-flow/SPEC.md
    - _bmad-output/specs/spec-slide-artifact-model/SPEC.md
    - _bmad-output/specs/spec-artifact-registry-authoring/SPEC.md
  runtime_rules:
    - _bmad-output/project-context.md
excluded:
  - .next/standalone/_bmad-output/** (build output, not a source of truth)
---

# Implementation Readiness Assessment Report

**Date:** 2026-07-29
**Project:** worship-presenter-web

## Step 1 — Document Inventory

### Documents included in this assessment

| Type | Location | Notes |
| --- | --- | --- |
| PRD | `prds/prd-bic-pptx-workflow-2026-07-10/` | `prd.md` (55.1 KB) is the primary document, plus `addendum.md` (deck blueprint) and `pressure-test-findings.md`. Folder-based, not sharded — no `index.md`, therefore no whole-vs-sharded duplicate. |
| Architecture | `architecture/architecture-bic-pptx-workflow-2026-07-10/` | Initiative altitude, authoritative parent. AD-1 … AD-10. |
| Architecture | `architecture/architecture-epic-16/` | Epic altitude, child of the above. Inherits parent decisions read-only as `INIT AD-n`. |
| UX | `ux-designs/ux-bic-pptx-workflow-2026-07-10/` | `DESIGN.md` (visual identity) + `EXPERIENCE.md` (IA, behavior, flows). |
| Epics | `epics.md`, `epics-parallel-delivery-analysis.md` | Whole documents; no sharded variant. |
| Stories | `implementation-artifacts/stories/` | 38 files spanning epics 1–16. |
| Sprint tracking | `implementation-artifacts/sprint-status.yaml` | |
| SPECs | `specs/` (4 packages) | `spec-worship-web-input`, `spec-lyrics-and-flow`, `spec-slide-artifact-model`, `spec-artifact-registry-authoring`. |
| Runtime rules | `project-context.md` | Loaded as persistent facts by every BMad skill. |

**Excluded:** `.next/standalone/_bmad-output/**` — a build-output copy of the artifact tree, not a source of truth.

### Issues found at discovery, and how each was resolved

Discovery surfaced three issues. All were resolved before the assessment proceeded, each through the skill that owns the artifact rather than by ad-hoc edit.

| # | Issue | Resolution |
| --- | --- | --- |
| 1 | **Two architecture spines, one misplaced.** `architecture-epic-16/` sat outside the BMad default `spine_output_path` (`{planning_artifacts}/architecture`), leaving parent/child authority ambiguous. | Relocated via `git mv` into the default path; three referencing paths updated (`spec-slide-artifact-model/SPEC.md`, story `16-1`, `epics-parallel-delivery-analysis.md`). Hierarchy made explicit: initiative spine is the authoritative parent, epic-16 its child. Completed through `bmad-architecture` **Update** intent, including the Reviewer Gate. |
| 2 | **UX documents stale and wrongly shaped.** Both last touched 2026-07-19; they missed two shipped surfaces, and `DESIGN.md` carried a route/surface table that the `bmad-ux` contract assigns to `EXPERIENCE.md`. | Reshaped through `bmad-ux` **Update** intent: `DESIGN.md` rebuilt to the Google Labs `design.md` spec, `EXPERIENCE.md` given its full required section set. Reviewer Gate run; both `doc_standards` passes applied. |
| 3 | **Document set unconfirmed.** The user could not confirm which documents were authoritative, because earlier work had often bypassed the BMad flow. | Resolved by assessor judgment: the inventory above **is** the set. Establishing whether it is complete and internally consistent is the purpose of Steps 2–6, not a precondition for them. |

### Assessment scope, stated honestly

This assessment evaluates **artifacts**: whether PRD, UX, architecture, epics, and stories are complete, mutually consistent, and sufficient to implement from. It is not a line-by-line audit of code against artifacts.

Two consequences follow, and they shape how later findings should be read:

- Where code has outrun the artifacts, the correct output is a `bmad-correct-course` recommendation, not a readiness pass.
- Several behaviors specified in `EXPERIENCE.md` during this session's UX work are **designed** behavior distilled from architecture invariants, and were not verified against shipped code. They are carried forward as findings to verify, not as satisfied requirements.

### Defects already on record before Step 2

Recorded during the Step 1 remediation and carried into the assessment rather than treated as closed:

1. `muted-foreground` contrast is approximately 4.4:1 on `muted` — below WCAG AA for normal text — on the token carrying all secondary text. Estimate, not tool-measured.
2. Dark mode is unreachable: a complete `.dark` palette exists but no `ThemeProvider` is mounted anywhere. — **⚠ CORRECTED 2026-07-30, this finding was wrong.** The absent provider is real; the conclusion drawn from it is not. `PresenterOperator.tsx:449` and `SlideGridDialog.tsx:176` each pin `className="dark …"` on their own wrapper, and `globals.css:5` — `@custom-variant dark (&:is(.dark *))` — matches any *descendant*, so the palette renders today in the two surfaces used while a service is running. No provider is required for that. The real defect is that dark mode cannot be **chosen**. Annotated rather than rewritten: this is a dated assessment, not a living contract. The corrected statement lives in `DESIGN.md` → *Open Item 2* and Story 17.1.
3. `src/app/layout.tsx` still exports create-next-app metadata, so the production hub's browser tab reads *Create Next App*.
4. Unsaved canvas changes in the Artifact Editor are invisible to the application — no dirty indicator, no navigation guard.
5. Nine API routes rely on the `src/proxy.ts` gate as their only authorization layer, with no in-route `requireSession`.

---

## Step 2 — PRD Analysis

**Read in full:** `prd.md` (501 lines), `addendum.md` (111 lines, authoritative for the Deck Blueprint per PRD §4.2). `pressure-test-findings.md` is a prior review artifact, not a requirements source, and is read in Step 5 where findings are assessed.

### Functional Requirements

22 FRs, numbered globally by the PRD. Phase assignment from §6.

| FR | Requirement (verbatim statement) | Phase | Realizes |
| --- | --- | --- | --- |
| FR-1 | Ingest a Rundown from Telegram into a structured Weekly Data Payload — picoclaw can read the week's Telegram messages and submit a structured Weekly Data Payload the API accepts. | 1 | UJ-1 |
| FR-2 | Validate and resolve Hymns by SDAH Number in the app API — the app's Service-input API validates each submitted SDAH Number against the Hymnal Database and resolves the Hymn's title and structured lyrics server-side, reporting validity back to the caller. | 1 | UJ-1 |
| FR-3 | Manage the persistent Announcement List — the app maintains an ordered, persistent Announcement List across weeks; picoclaw (and Operators via the Web Hub) can instruct which items stay, which are replaced or removed, which one-off items are added for a single Service, and in what order. | 1 | UJ-1 |
| FR-4 | Assemble a Deck from Template Skeleton + Weekly Data Payload — the generator can produce a complete Deck for a Service by combining the fixed Template Skeleton with the variable Weekly Data Payload, per the Deck Blueprint. | 1 | UJ-1 |
| FR-5 | Render Song Blocks with readable lyric slides — a song-title slide (title + "SDAH #nnn") followed by K lyric slides, where slide breaks are governed by structure **and readability**. | 1 | UJ-1, UJ-4 |
| FR-6 | Render the variable non-song content into its Slide Types — Verse Reading, sermon speaker name, family/youth-of-the-week details, and Announcement List. | 1 | UJ-1 |
| FR-7 | Apply one selectable, elegant slide transition — an administrator chooses from none, cut, fade, dissolve or push; the choice applies uniformly to the whole Deck. Fade is the default. | 1 | UJ-4 |
| FR-8 | List Services by date — an authenticated user can see a dated list of Services and open any one. | 1 | UJ-2 |
| FR-9 | Preview an assembled Service slide-by-slide — a Reviewer can visually preview the assembled Service's slides in the browser without downloading the PPTX. | 2 | UJ-2 |
| FR-10 | Delete a Service manually (full cleanup) — an authenticated user with the right Role can delete an entire Service and all its assets. | 1 | weekly loop cleanup |
| FR-10b | Auto-delete generated Decks by Retention Policy — the system can automatically delete **only generated Decks (PPTX)** past an Admin-configured Retention Policy window. | 4 | — |
| FR-11 | Edit a Service's inputs via the web form — participants, songs, Verse Reading, sermon speaker/graphic, family/youth, Announcement List entries and order. | 1 | UJ-2 |
| FR-11b | Create a Service via Web Form — an Operator can create a new Service directly from the Web Hub by pasting the Raw Rundown Text and optionally filling out structured fields and image URLs. | 1 | UJ-5 |
| FR-12 | Submit a correction via Telegram — picoclaw identifies the target Service and updates the affected part of the existing Service's Weekly Data Payload. | 3 | UJ-3 |
| FR-13 | Regenerate a Service in place — a Reviewer can regenerate a Service's Deck from its current Weekly Data Payload without creating a new Service. | 1 | UJ-2, UJ-3 |
| FR-13b | Resolve concurrent edits first-save-wins — the first save to commit wins; a later conflicting save is rejected with an error. | 3 | — |
| FR-14 | Download an offline-capable PPTX — an authenticated user can download a Service's Deck as a PPTX file that presents fully offline. | 1 | UJ-4 |
| FR-15 | Present a Service as a full-screen Web Slideshow — single-screen, using the same configured transition as the Deck. | 2 | UJ-4 |
| FR-16 | Provide dual-screen Presenter Mode in the browser — a clean full-screen output on one screen and an operator view on the other (current slide, next slide, Run-Sheet, participant list), including projector blanking. | 5 | UJ-4 |
| FR-17 | Display the full Order of Service as a Run-Sheet — roles, names, songs with numbers, and timings. | 1 | UJ-2, UJ-4 |
| FR-18 | Authenticate users with per-person accounts and two Roles — individual accounts, Admin and Operator; unauthenticated visitors cannot access any Service. | 1 | UJ-2, UJ-4 |
| FR-19 | Look up and display a scripture passage on demand within Presenter Mode — search the Verse Database by reference, push to the projector output, then return to the Deck. Depends on FR-16. | 6 | ad-hoc verse need |

**Total FRs: 22** (19 primary + 3 late-inserted sub-numbered: FR-10b, FR-11b, FR-13b).

### Non-Functional Requirements

**The PRD does not number its NFRs.** Numbers below are assigned by this assessment for traceability; see *PRD Completeness Assessment* — this is a real traceability weakness, not a formatting nit.

| NFR | Requirement | Source |
| --- | --- | --- |
| NFR-1 | **Offline reliability (load-bearing).** A downloaded PPTX must present a full Service — all slides, images, fonts — with zero network access. The Phase-2 Web Slideshow is best-effort offline after initial online load, scoped to one Service. | §10 |
| NFR-2 | **Generation performance.** Assembling/regenerating a full ~68-slide Service must fit within the ≤ 5-minute late-change window (SM-5), including PPTX export. | §10, §4.5 |
| NFR-3 | **Readability.** Lyric slides must never be over-full; splitting rules (FR-5) exist so the congregation can read every slide from the pews. | §10 |
| NFR-4 | **Headless-safe rendering.** Deck generation runs without a human-driven PowerPoint; fonts and backgrounds must render correctly headless. All supported background paths (solid fill, full-bleed image) must render. | §10 |
| NFR-5 | **Robust parsing.** Parsing must tolerate the real semi-structured format (honorifics, first-name-only names, markers `》`/`[ ]`, `"-"` empties, `"The Speaker"` references, variable song counts) and **fail visibly, not silently** — surfacing *every* line or input that could not be confidently mapped, and every unresolvable or missing image. A general "unmapped input" channel, not a hymn-only one. | §10 |
| NFR-6 | **Access control.** All Service data and actions require authentication and are gated by Role (FR-18); no public endpoints expose member PII or Services. | §10 |
| NFR-7 | **Font licensing and availability.** Fonts are freely-licensed and headless-safe; the generator embeds fonts in the PPTX when feasible, otherwise a standardized font is documented and installed on the presentation machine(s). Verified on a *clean* machine. | §4.2, §11 |

**Total NFRs: 7.**

### Additional Requirements

**Constraints and guardrails (§9)** — three, all binding:
- **Privacy.** Family/Youth slides and the Run-Sheet carry member PII (names, photos, prayer requests). Access restricted by Role; the Web Hub is never public; manual delete removes PII-bearing data on the church's choosing.
- **Cost.** Solo developer, modest budget. Production topology as-built: home-PC LiveServer + Docker Desktop + Cloudflare Tunnel.
- **Maintainability.** One maintainer owns all three layers. Includes an explicit **break-glass fallback**: if the app is unavailable before a Sabbath, that week's deck can be produced by hand-editing the master template.

**Phase 1 pre-requisites (§6) — five go/no-go gates, each stated as blocking before build:**
1. Hymnal Database acquired and structure/coverage/numbering validated.
2. picoclaw confirmed customizable to the intake/readback/image-binding spec.
3. Font strategy proven — embeds cleanly headless, or renders on a clean machine with the standardized font installed.
4. **Fidelity sign-off** — explicit sign-off from the church/Bimo on a sample rebuilt slide set.
5. **Rundown corpus** — 5–10 historical Rundowns gathered to measure real format variance before locking parse rules.

**Success metrics (§7):** SM-1 … SM-7 primary/secondary, plus counter-metrics SM-C1 (don't trade fidelity for speed), SM-C2 (don't over-delete), SM-C3 (don't re-centralize on one person). **SM-3 is explicitly the gate for building Phases 2–6**, with a leading gate at ~week 4.

**Dependencies (§11):** Hymnal Database, KJV Verse Database, picoclaw agent, Telegram, OBS, fonts.

**Non-goals (§5):** 10 explicit exclusions, including no video handling of any kind, no guest/performer decks, no flyer generation, no live presentation control, no per-church configurability.

**Assumptions index (§12):** 4 entries, 2 marked *Decided*. Deferred by choice (§8): 3 items — finer Events-Department permissions, Scripture Display trigger/dismiss UX, retention granularity.

### PRD Completeness Assessment

The PRD is unusually strong on requirement quality: every FR carries testable consequences, vocabulary is anchored in a Glossary used verbatim, and phase assignment is explicit per FR. It is a genuinely implementable specification. Four issues bear on readiness, and the second is severe.

1. **`status: draft` (MEDIUM).** Frontmatter still reads `draft` and `updated: 2026-07-19`, while Phase 1 has shipped and epics 1–16 exist. The authoritative requirements document does not present itself as authoritative.

2. **The phase gate was never closed, and every phase shipped anyway (HIGH — carried to Step 3).** §6 states plainly: *"Phase 1 is the MVP and the only committed phase … Phases 2–6 are nice-to-have: specified now, built in order only if Phase 1 proves genuinely useful in weekly service."* SM-3 makes this a measured gate — 13 consecutive weeks, with a leading gate at week 4 (Friday review ≤ 10 min, two distinct Operators each running a Sabbath unaided, zero break-glass weeks). The architecture spine's *Shipped* list records FR-9/15 (Phase 2), FR-12/13b (Phase 3), FR-10b (Phase 4), FR-16 (Phase 5) and FR-19 (Phase 6) as delivered. **No artifact records the gate being evaluated, passed, or waived.** Either the gate was skipped, or it was met and never written down; both are readiness findings, and only the user can say which.

3. **Whole shipped capabilities have no FR (HIGH — carried to Step 3).** The PRD's requirement set stops at FR-19. It contains no requirement for the runtime-editable **Artifact Registry and canvas editor** (Epic 16 — `/admin/artifacts`, a SQLite-backed template registry with a Fabric.js editor, covered by two SPEC packages and its own architecture spine), nor for the Epic 15 lyric-formatting and flow-skip work. FR-7 covers transitions but not the projector blank-screen behavior that now sits inside FR-16's consequences. This is drift in the *reverse* direction from the usual: implementation and specs ran ahead of the requirements document.

4. **NFRs are unnumbered (MEDIUM).** §10 presents six cross-cutting NFRs as prose bullets and §4.2/§4.5 add feature-specific ones. Without stable identifiers, no story or test can cite an NFR, and NFR coverage cannot be traced the way FR coverage can. Every NFR here had to be assigned a number by this assessment to be checkable at all.

**Also noted, not yet findings:** the five Phase-1 pre-requisites are written as blocking go/no-go gates, two of which are human sign-offs (church fidelity sign-off; a 5–10 Rundown corpus). Whether they were performed is unrecorded and is checked in Step 5.

---

## Step 3 — Epic Coverage Validation

**Read in full:** `epics.md` (270 lines), `sprint-status.yaml` (173 lines). Story-file existence verified against the filesystem rather than trusted from either document.

**Inventory correction from Step 1:** `epics.md:212` declares `epics-parallel-delivery-analysis.md` **superseded** — *"its AR19 reconciliation never happened, so this three-story breakdown remained authoritative."* Step 1 listed it as an included document without that qualifier. It is retained for history only and carries no authority in this assessment.

`epics.md` does maintain an explicit **FR Coverage Map**, which is good practice and made this step verifiable rather than inferential.

### Coverage Matrix

| FR | PRD requirement (short) | Epic coverage | Status |
| --- | --- | --- | --- |
| FR-1 | Ingest Rundown → Weekly Data Payload | Epic 2 + Epic 6 | ✓ Covered |
| FR-2 | Validate/resolve Hymns by SDAH Number | Epic 2 | ✓ Covered |
| FR-3 | Persistent Announcement List | Epic 6 | ✓ Covered |
| FR-4 | Assemble Deck from Skeleton + payload | Epic 3 + 6 + 7 | ✓ Covered |
| FR-5 | Song Blocks with readable lyric slides | Epic 3 (+ Epic 15 refinements) | ✓ Covered |
| FR-6 | Render variable non-song Slide Types | Epic 3 + 6 + 7 | ✓ Covered |
| FR-7 | One selectable slide transition | Epic 3 + `spec-transitions-and-blank-screen` | ✓ Covered |
| FR-8 | List Services by date | Epic 4 + 6 + 7 | ✓ Covered |
| FR-9 | Slide-by-slide browser preview | Epic 8 | ✓ Covered |
| FR-10 | Manual delete Service | Epic 5 | ✓ Covered |
| FR-10b | Auto-delete Decks by Retention Policy | Epic 10 | ✓ Covered |
| FR-11 | Edit Service inputs via web form | Epic 5 (+ Epic 14) | ⚠️ Covered, marked **Partial** — see F3-3 |
| **FR-11b** | **Create a Service via Web Form** | **NOT FOUND** | ❌ **MISSING** |
| FR-12 | Telegram correction path | Epic 9 | ✓ Covered |
| FR-13 | Regenerate a Service in place | Epic 5 | ✓ Covered |
| FR-13b | First-save-wins concurrency | Epic 9 | ✓ Covered |
| FR-14 | Download offline-capable PPTX | Epic 3 + 7 | ✓ Covered |
| FR-15 | Full-screen Web Slideshow | Epic 8 | ✓ Covered |
| FR-16 | Dual-screen Presenter Mode | Epic 11 | ✓ Covered |
| FR-17 | Full Order of Service Run-Sheet | Epic 4 + 7 | ✓ Covered |
| FR-18 | Per-person accounts + two Roles | Epic 1 + 6 | ✓ Covered |
| FR-19 | On-demand KJV Scripture Display | Epic 12 | ⚠️ Covered, marked **Partial** — corpus not committed |

### Missing Requirements

#### Critical

**FR-11b — Create a Service via Web Form.** Absent from `epics.md` entirely: not in the Requirements Inventory table, not in the FR Coverage Map. A `grep` for `11b` across `epics.md` returns nothing.

- **Impact:** FR-11b is a **Phase 1** requirement realizing **UJ-5** (*"Bimo creates a new service directly in the web app"*) — the documented fallback for when the Telegram channel is unconfigured or down. It is the only path that keeps the product usable during an intake outage, and it carries two consequences no other FR states: date-collision warning with explicit override, and in-form Announcement List management.
- **Mitigating:** the capability appears to be **implemented** — `/services/new` exists and Epic 14's six stories work the create/edit surface. So this is a traceability failure, not necessarily a functional gap.
- **Recommendation:** add FR-11b to the `epics.md` Requirements Inventory and FR Coverage Map, mapped to **Epic 14** (stories 14.1, 14.4 create-parity). Verify its two distinctive consequences — collision warning and in-form announcement ordering — are actually tested, since no story cites FR-11b today.

### Additional coverage findings

**F3-1 (HIGH) — Four stories are marked `done` with no story file.** `sprint-status.yaml` marks `16-2`, `16-3`, `16-4`, `16-5` as `done`, and `epics.md` states Epic 16 was *"Delivered across Stories 16.1–16.5"*. Only `16-1-artifact-registry-canvas-editor-foundation.md` exists on disk.

This contradicts the status vocabulary defined in that same file: `ready-for-dev` means *"Story file created in stories folder"*, and `done` sits downstream of it. Four stories therefore reached `done` without passing through the state that requires a story file to exist. `spec-16-2-artifact-pipeline-completion.md` (28.4 KB) covers the work, so the *specification* exists — what is missing is the delivery unit with acceptance criteria. This is precisely the failure mode `AGENTS.md` was hardened against ("Do not jump from PRD/Spec edit straight to thousands of lines of app code").

**F3-2 (MEDIUM-HIGH) — Epic 14 status is self-contradictory.** `sprint-status.yaml` records `epic-14: in-progress` while all six of its stories (`14-1` … `14-6`) are `done`. The file's own definition: *"done: All stories in epic completed."* `epics.md` likewise still reads *"(in-progress — Story 14.6)"* though 14.6 is complete. Either the epic is done and the status is stale, or something remains that no story captures.

**F3-3 (MEDIUM) — The FR Coverage Map predates a third of the delivered work.** `epics.md` frontmatter says `last_realigned: 2026-07-19`, and every status in the map is labelled *"(2026-07-19 audit)"*. Epic 14 ran through 2026-07-20, and Epics 15 and 16 closed 2026-07-26. FR-11 is still marked **Partial** — *"raw text + images edit; dual-path with Announcement List"* — even though Epic 14 spent six stories on exactly that surface. The Partial is probably closed in code and definitely unverified in the artifact.

**F3-4 (MEDIUM) — NFR coverage is materially incomplete.** `epics.md` lists four "Non-functional themes": offline reliability, generation performance, headless-safe rendering, robust parsing. Three of the seven NFRs identified in Step 2 have **no epic representation**: NFR-3 Readability, NFR-6 Access control, NFR-7 Font licensing/availability. (NFR-6 is satisfied in practice via FR-18/Epic 6, and NFR-7 partly via story `7-4-font-deploy-note`, but neither is tracked as an NFR.) The section also cites *"from PRD §9"* when the cross-cutting NFRs are in **§10** — §9 is Constraints and Guardrails.

**F3-5 (MEDIUM) — A story cites an NFR identifier that does not exist.** Story 6.6's goal statement reads *"So that **NFR-4** and story testing notes are covered."* The PRD does not number its NFRs at all (Step 2, finding 4), so `NFR-4` resolves to nothing upstream. By this assessment's numbering, story 6.6 (tests for auth, webhook, parser) maps to **NFR-5 robust parsing** — not NFR-4 headless-safe rendering. The citation is unresolvable and, read literally, wrong.

**F3-6 (HIGH, operational) — Two open Epic 16 action items are pre-service safety gates.** `sprint-status.yaml` carries six open `action_items`, two owned by the user and unresolved:

- *"Inspect a generated deck and the projector before the next service (registry now owns layout; only order/content are machine-verified)"*
- *"Reset welcome, verse-reading, special-song, family-youth, bible-verse-contemplation on the production DB (missing-only seeding keeps the old rows)"*

Epic 16 moved layout ownership into the Artifact Registry, and the seeder inserts missing template IDs only — so the production database still holds the **old** rows for those five templates. Combined with the first item being unperformed, no one has yet confirmed what the projector will actually show. This is the highest-consequence open item in the whole artifact set, because it lands on a Sabbath.

Four further items remain open: a seed conformance test, a deck-size/generation-time ceiling assertion, repair of two stale checks in `scripts/smoke-deck-fidelity.mjs` left from the Epic 14 field renames, and an Epic 15 refactor of hardcoded song-title skip rules.

### Capabilities delivered with no PRD requirement

The reverse-direction gap flagged in Step 2, now enumerated against the epic list:

| Epic | Capability | PRD requirement |
| --- | --- | --- |
| Epic 13 | LiveServer Docker/tunnel deploy, shared Header/profile/dashboard search, hub-local announcement uploads | None. Retrospectively reconciled by Correct Course 2026-07-19 (PRD/Architecture/UX amended to follow code). |
| Epic 14 | Worship web input boundary (create/edit parity, parse trigger, hymn autocomplete, sermon card) | Partially FR-11 / FR-11b — and FR-11b is itself untracked. |
| Epic 15 | Lyric formatting as continuous text, chorus after every verse, song-title skips in prayer flow | Arguably an FR-5 refinement, but the behavior change (chorus injected after *every* verse) is not what FR-5 states. |
| Epic 16 | **Artifact Registry + canvas editor** — SQLite template registry, placeholder resolution, unified PPTX/web rendering, element authoring | **None.** Nine capability IDs (CAP-1 … CAP-9) live only in SPEC files with no FR ancestry. |

Epic 16 is the substantive case: a runtime-editable template system that changes how every slide is produced, specified across two SPEC packages and its own architecture spine, with no requirement in the document the epics themselves call authoritative (*"PRD FR numbers are authoritative"*).

### Coverage Statistics

- **Total PRD FRs:** 22
- **FRs present in the epics inventory:** 21
- **FRs missing from epics:** 1 (FR-11b)
- **FR coverage:** **95.5%**
- **FRs marked Done in the coverage map:** 19 of 21 present (90.5%)
- **FRs marked Partial:** 2 (FR-11, FR-19) — both statuses dated 2026-07-19 and unverified since
- **Total NFRs:** 7 · **represented in epics:** 4 · **NFR coverage: 57%**
- **Epics with capability but no FR ancestry:** 3 of 16 (Epics 13, 15, 16)
- **Stories marked `done` with no story file:** 4 (16.2–16.5)
- **Open action items:** 6 (2 pre-service safety gates, 3 test/tooling, 1 refactor)

---

## Step 4 — UX Alignment Assessment

### UX Document Status

**Found** — `DESIGN.md` and `EXPERIENCE.md` at `ux-designs/ux-bic-pptx-workflow-2026-07-10/`, both `status: final`, `updated: 2026-07-29`.

> **Declared conflict of interest.** Both spines were rewritten *earlier in this same session* by this assessor, as remediation for the Step 1 discovery that they were stale and wrongly shaped. This step therefore reviews the assessor's own work. It is recorded here so the reader can weight it accordingly, and the checks below were deliberately run against the PRD and the code rather than against recollection. One finding (F4-1) contradicts a claim this assessor made only hours ago.

### F4-1 (HIGH) — The UX spines discard the PRD's named protagonists, and a prior gate check on this was wrong

The `bmad-ux` contract requires source-defined journey names to be mirrored verbatim. The PRD §2.1 and §2.3 name three protagonists:

| PRD | Journey |
| --- | --- |
| **Sari**, events department | UJ-1 — sends the rundown; the service assembles itself |
| **Bimo**, current builder | UJ-2 — reviews Friday, fixes a wrong song · UJ-5 — creates a service directly in the web app |
| **Elen**, new to the rotation | UJ-4 — presents on Sabbath offline |

`EXPERIENCE.md` instead invents **Yohana** and **Yosef**. A `grep` for the PRD names across both spines returns nothing.

**This assessment's own Reviewer Gate got this wrong.** `review-rubric.md` records under Flow coverage: *"PRD defines **no named personas** — only role descriptions — so the invented protagonists introduce no conflict with source naming"*, and passed the check. That conclusion came from a grep whose pattern (`persona|protagonist|As an? (operator|admin|…)|Mary|named user`) could not match names embedded in journey prose. The check should have failed. `review-rubric.md` and `validation-report.md` are corrected as part of this step.

- **Impact:** downstream traceability. A story or test citing "UJ-2" cannot be matched to a flow by protagonist, and two vocabularies now exist for the same three people. The PRD is the authority; the UX spines must follow it.
- **Recommendation:** rename the flows to Sari / Bimo / Elen and map each flow to its UJ id explicitly.

### F4-2 (CRITICAL — real congregation PII was committed to a public repository. Working tree remediated; git history is NOT)

Raised as a question — *are these protagonists real people?* — and answered by the user on 2026-07-29: **one of the three was a real congregation member.** Searching for it then surfaced **two more real names in the same sentence**, which had not been asked about because they had not yet been found — including one **full name** (given name + surname), which is materially more identifying than a first name.

All three were named as *actual role-holders*, not as examples: the volunteer who built the deck each week, and two predecessors who had held the job before him.

**Where they were.** 21 occurrences across five tracked artifacts: the brief, its `.memlog.md` and `addendum.md`, `prd.md`, and `pressure-test-findings.md`.

**Why the guard did not catch it.** `tests/public-repo-guard.test.mjs` matches a list of *known* private literals, stored as truncated SHA-256 so the guard does not itself publish what it protects. It cannot detect a real name nobody registered. It passed throughout — correctly, and uselessly, because these three names were never on the list. Commit `1ced308` is titled *"sanitize docs for public"*; that pass missed them.

**Remediated (2026-07-29):**

- All three replaced with invented names across all five files, plus the three assessment artifacts written earlier in this session that had quoted them.
- Fingerprints for all three added to `FORBIDDEN_NAME_HASHES` so they cannot return. One further given name from that group was **deliberately not** listed: it is also a book of the Bible, and in a worship application whose scripture corpus and fixtures legitimately contain it, blocking the word would fire on real content and teach someone to weaken the guard. The surname is what identified that person, and the surname is blocked.
- Verified: `git grep -i -w` for all three now returns nothing across tracked files.

**NOT remediated, and it needs a decision (see the Recommendations section):** this repository is public at `github.com/kodesh87/worship-presenter-web`, and commit `1ced308` **is pushed to `origin/main`**. Editing the working tree removes the names from the current state only. They remain readable in commit history on GitHub, and no file edit can change that. Options and their costs are set out in the final recommendations; the destructive one was not taken unprompted.

### UX ↔ PRD Alignment

| PRD journey | UX coverage | Verdict |
| --- | --- | --- |
| UJ-1 (Sari, Telegram intake) | No flow. The contributor never opens the Web Hub, so this journey lives outside the UI. | Acceptable, but state it — currently silent |
| UJ-2 (Friday review + fix) | Flow 1 (+ Branch 1b stale write) | ✓ Aligned, wrong protagonist |
| UJ-3 (Saturday Telegram song swap, Phase 3) | **No flow** | ⚠️ Gap |
| UJ-4 (Sabbath offline presentation) | Flow 2 (+ Branch 2a lost projector) | ✓ Aligned, wrong protagonist |
| UJ-5 (create a service in the web app) | Flow 1 **Branch 1a** only | ⚠️ A PRD key journey represented as a sub-branch |

**F4-3 (MEDIUM) — UJ-3 has no UX representation.** Telegram correction (FR-12, Phase 3, shipped per the coverage map) is a documented key user journey whose reviewer-facing half — being told a correction arrived and re-checking the service — appears nowhere in `EXPERIENCE.md`.

**F4-4 (MEDIUM) — UJ-5 is demoted to a branch.** FR-11b is already missing from the epics (Step 3, Critical); its journey is a sub-branch of another flow. The one requirement with no epic coverage is also the one journey with no flow of its own — the two gaps compound.

**F4-5 (HIGH) — Requirements with specified behavior that no UX artifact describes:**

- **FR-16 projector blanking.** The PRD states four testable consequences: blank to black at any time and restore, without moving the Deck position, losing the projector window, or disturbing a scripture overlay; the operator view keeps showing current/next while blanked and *indicates* the blanked state; a projector opened or reloaded while blanked comes up blank. `EXPERIENCE.md` has **no blanking state and no blanking interaction** — the word "blank" appears only in an unrelated empty-plan phrase. A shipped, four-consequence FR with zero UX ownership.
- **NFR-5 general unmapped-input channel.** The PRD is emphatic: *"surface **every** line or input they could not confidently map … a general 'unmapped input' channel, not a hymn-only one."* `EXPERIENCE.md` covers the hymn case (unresolved hymn on create, failed-hymn readback in Flow 1) and the image-rejection case, but has no general surface for unmapped rundown lines. The PRD ties this directly to safety: it is part of the net that compensates for having no slide preview.
- **NFR-2 generation performance.** Generation is budgeted at up to 5 minutes. `EXPERIENCE.md` has an in-flight state for *form submit* but none for deck generation or PPTX download. A multi-minute operation with no progress state is a real experience gap, not a nicety.

### UX ↔ Architecture Alignment

Verified every architecture citation in the spines resolves: `INIT AD-1, AD-5, AD-6, AD-7, AD-8, AD-10` and `epic-16 AD-2, AD-3, AD-4, AD-5` all exist as written.

| Check | Result |
| --- | --- |
| Offline-first Sabbath path | ✓ `EXPERIENCE.md` Foundation and Flow 2 follow INIT AD-1; PPTX is primary, web additive |
| Presenter ↔ projector transport | ✓ Single `BroadcastChannel` per INIT AD-10; no second channel proposed |
| Authorization model | ✓ Per-surface 403-not-redirect behavior follows INIT AD-5; Admin/Operator matches FR-18 |
| Concurrency | ✓ Stale-write 409 follows INIT AD-6 |
| Image references | ✓ Constrained to the INIT AD-8 shared helpers |
| Registry-driven slides | ✓ `slide-surface` clipping follows epic-16 AD-5; DESIGN.md correctly disclaims the slide interior |
| Desktop-only ≥1024px commitment | No architectural conflict — the spine fixes no viewport constraint |
| Generation performance (NFR-2) | ⚠️ Neither the architecture spine nor the UX spines fix a performance budget; see F4-5 |

**F4-6 (MEDIUM) — no UX artifact owns the congregation-facing output.** `DESIGN.md` scopes itself to the *operator chrome* and explicitly delegates projected slide appearance to the Artifact Registry. `EXPERIENCE.md` treats `slide-surface` only as clipping behavior. The result: the ~68-slide deck the congregation actually sees — the product's primary visual output, and the subject of FR-5 readability and NFR-3 — has **no UX document**. It is governed by SPEC companions plus registry data.

That is defensible now that layout is data-driven, but it is currently a silence rather than a stated boundary. Nobody owns the question *"is this readable from the pews?"* — which the PRD raises as a cross-cutting NFR.

**F4-7 (LOW) — epics were built without the experience contract.** `epics.md` `inputDocuments` lists `DESIGN.md` but not `EXPERIENCE.md`, and its entire UX requirement set is one line (UX-DR1: high-contrast UI on Tailwind/Shadcn defaults). Consistent with DESIGN.md, but no epic was informed by IA, states, or flows.

### Warnings

1. UX documentation exists and is now correctly shaped, but **three shipped requirements have specified behavior no UX artifact describes** (FR-16 blanking, NFR-5 unmapped-input channel, NFR-2 progress) — F4-5.
2. The UX spines' protagonists **contradict the PRD's**, and this assessment's own earlier gate wrongly cleared it — F4-1.
3. Whether those PRD names are real people is **unresolved and is a public-repository question** — F4-2, needs the user.
4. Architecture supports every UX requirement checked except a performance budget, which no artifact fixes.

---

## Step 5 — Epic Quality Review

Validated against `create-epics-and-stories` standards. **Read:** `epics.md`, `sprint-status.yaml`, `pressure-test-findings.md` (202 lines), and story files sampled deliberately at both ends of the size range (0.3 KB → 14.4 KB): `1-2`, `5-2`, `7-4`, `8-1`, `11-1`, `12-1`, `14-4`, `16-1`.

**Standard applied without discount, and one thing said up front in fairness:** `epics.md` is unusually honest about its own state — *"All epics done means **story keys**, not zero remaining FR Partials"* — and it maintains a real FR Coverage Map. The findings below are about structure, not candour. The candour is what made them findable.

### 🔴 Critical Violations

#### C5-1 — Most epics are technical or process buckets, not units of user value

The standard's red flags are "Infrastructure Setup", "API Development", technical milestones. Applying it to all 16:

| Epic | Title | Verdict |
| --- | --- | --- |
| 1 | System Foundation & Authentication | ❌ Infrastructure + borderline-auth |
| 2 | Data Ingestion & Processing | ❌ Technical milestone, no user outcome |
| 3 | Presentation Assembly & PPTX Export | ⚠️ Technical framing, but a deck is real user value |
| 4 | Web Hub & Operator Interface | ✅ User value |
| 5 | MVP Completion & Bug Fixes | ❌ A milestone, not an epic |
| 6 | Phase 1 Gap Closure | ❌ Process bucket |
| 7 | Phase 1 residuals | ❌ Process bucket |
| 8–12 | one phase each | ❌ Delivery-schedule buckets, one story apiece |
| 13 | Hub UX + LiveServer gap | ⚠️ Mixed UX and infrastructure |
| 14 | Worship Web Input Boundary | ✅ User value ("boundary" is technical framing for a real operator surface) |
| 15 | Parser & Rendering Refinements | ❌ Technical |
| 16 | Slide Artifact Model **Refactoring** | ❌ Names itself a refactor — zero user value, **and no FR ancestry** (Step 3) |

**Three of sixteen** epics are framed around what a user can do. The rest are named after code areas, delivery phases, or cleanup rounds.

**Remediation:** do not retitle shipped history for cosmetics. Apply the standard to *new* epics from here, and let the FR Coverage Map carry traceability for the historical ones, which is what it already does well.

#### C5-2 — Four epics forward-depend on later epics to satisfy their own FRs

The rule is absolute: Epic N cannot require Epic N+1. Every violation below is stated in `epics.md` itself:

| Epic | Its own note | Forward dependency |
| --- | --- | --- |
| 1 | *"Story 1.2 delivered shared Basic Auth; full FR-18 → Story 6.2"* | Epic 1 → **Epic 6** |
| 3 | *"FR-4/6 fidelity → Story 6.3 / 6.4 / Epic 7"* | Epic 3 → **Epics 6, 7** |
| 4 | *"FR-9/15/16/19 later shipped in Epics 8–12"* | Epic 4 → **Epics 8–12** |
| 5 | *"5.4 was per-service images MVP; FR-3 persistent list → Story 6.1"* | Epic 5 → **Epic 6** |
| 6 | *"Remaining Partial: FR-11 edit dual-path, FR-19 corpus ops"* | Epic 6 → **Epics 12, 14** |

This is a systematic pattern, not four accidents: ship a thin slice, close the gap in a later epic. That is a defensible *delivery* strategy and it was documented rather than hidden — but it is the exact structure the standard forbids, and the cost is real: no epic in 1–5 can be trusted as "its FRs are done" without consulting a map maintained elsewhere.

#### C5-3 — Five epic-sized stories: one story carrying an entire PRD phase

| Story | Size | Carries | PRD scope |
| --- | --- | --- | --- |
| `8-1` | 0.6 KB | FR-9 + FR-15 | all of Phase 2 |
| `9-1` | 0.6 KB | FR-12 + FR-13b | all of Phase 3 |
| `10-1` | 0.6 KB | FR-10b | all of Phase 4 |
| `11-1` | 0.6 KB | FR-16 | all of Phase 5 |
| `12-1` | 0.7 KB | FR-19 | all of Phase 6 |

This is not a theoretical concern — it produced measurable coverage loss, verified against the PRD:

- **`11-1` has 3 ACs for an FR with 5 testable consequences.** Uncovered: (a) projector **blanking** — black at any time and restore, without moving deck position, losing the window, or disturbing a scripture overlay; operator view keeps showing current/next and *indicates* blanked; a projector reloaded while blanked comes up blank; (b) the operator view's **participant list**, which AC-1 omits.
- **`8-1` has 3 ACs for two FRs.** Uncovered: FR-9's *"any incomplete Song Block (invalid SDAH Number) is visibly flagged"* — the one consequence that makes the preview a safety net rather than a convenience.

**Blanking is the sharpest case.** Verified in code: it **is** implemented (`src/app/services/[id]/present/projector/ProjectorClient.tsx`, `PresenterOperator.tsx`, `src/lib/present-channel.ts`), delivered through `spec-transitions-and-blank-screen.md`. So a four-consequence FR behavior shipped with **no story AC** and **no UX specification** (Step 4, F4-5 — added to `EXPERIENCE.md` only today). It is the third instance in this repository of a capability delivered by SPEC with no story behind it.

#### C5-4 — Story 5.2 has no acceptance criteria at all, and cites an FR that does not exist

`stories/5-2-delete-service.md` contains a user story and a Tasks/Subtasks checklist. **There is no Acceptance Criteria section.** Its "so that" clause cites **FR-10a** — the PRD defines FR-10 and FR-10b; there is no FR-10a. Marked `done`.

Deleting a service removes a member's photos, prayer-request text, and uploaded images (PRD FR-10). That this is the one story with no verifiable criteria is the least comfortable place for the gap to be.

#### C5-5 — Four stories marked `done` with no story file

Restated from Step 3 because it is a story-quality defect, not only a tracking one: `16-2` … `16-5` are `done` in `sprint-status.yaml`, and `epics.md` says Epic 16 was *"Delivered across Stories 16.1–16.5"*. Only `16-1` exists. There are therefore no acceptance criteria for four of the five stories in the epic that rebuilt how every slide is produced.

### 🟠 Major Issues

#### M5-1 — The five Phase-1 pre-requisite spikes are unrecorded, and they were written as go/no-go gates

PRD §6 lists them as blocking before any generator work; `pressure-test-findings.md` closes with *"**Still requiring follow-through** (execution, not PRD text): run the §6 spikes … and gather the Rundown corpus **before** Phase-1 build begins."*

| Spike | Recorded anywhere? |
| --- | --- |
| Hymnal Database acquired + structure/coverage/numbering validated | Implied by a shipped 695-hymn corpus, never recorded as a gate |
| picoclaw confirmed customizable to spec | Implied by story 6.5, never recorded as a gate |
| Font strategy proven on a **clean** machine (font not pre-installed) | **No record** |
| **Church fidelity sign-off** on a sample rebuilt slide set | **No record** |
| **5–10 historical Rundowns** gathered before locking parse rules | **No record** |

The last three are the ones that cannot be inferred from code, and two require a human decision that no artifact captures. The pressure test rated fidelity sign-off (H5) as an *adoption* risk — the deck looking subtly "not our deck" on the worship screen — and that judgment belongs to the church, not to the repository.

#### M5-2 — Stale technical guidance inside `done` stories propagates to future work

`stories/1-2-basic-authentication-and-roles.md` (`done`) instructs a future implementer to:

- create **`src/middleware.ts`** — deleted; the gate is `src/proxy.ts` under Next 16
- target **Next.js App Router v14+** — the project runs 16.2.10
- implement **a shared password / Basic Auth** — superseded by per-person accounts in story 6.2
- follow an architecture "Deferred Decision" it quotes verbatim: *"complex RBAC is deferred"* — RBAC shipped, and that text no longer exists in the spine

This matters mechanically: `bmad-dev-story` reads prior stories as *"Previous Story Intelligence"*, so a `done` story is not inert history — it is context a future agent will act on.

#### M5-3 — Acceptance criteria are frequently non-user-observable, off-format, or unverifiable

- `7-4-font-deploy-note.md` is **not a user story**: *"As a maintainer, I want a deploy note…"*, single AC *"Given `docs/deploy.md`, When read, Then Arial guidance is documented."* A documentation task promoted to a story.
- `8-1` AC-1 — *"Given `buildSlidePlan`, When PPTX generates, Then it consumes that plan"* — a code-structure assertion, not a user-observable outcome.
- `12-1` AC-1 depends on `.work/tp_bible_*.json`, a path deliberately outside the repository, so the AC **cannot be verified in CI** — this is the mechanism behind FR-19's standing "Partial".
- `12-1` AC-4 — *"**Never** use KJV for deck theme/verse slides"* — a prohibition, not Given/When/Then. Testable as an assertion; off-format.
- **Error paths are absent** across the small stories. None of `5-2`, `7-1`…`7-4`, `8-1`, `9-1`, `10-1`, `11-1` carries a failure-condition AC.

#### M5-4 — Story 7.4 documents Arial, which sits in tension with NFR-7

NFR-7 requires **freely-licensed**, headless-safe fonts, and the PRD's resolution log records the decision as *"embed fonts in the PPTX; else a standardized, **freely-licensed** font installed on the presentation machine."* Arial is neither freely licensed nor the Montserrat/look-alike pair the PRD names. The PRD's "standardized font installed on the presentation machine" clause arguably permits it in practice, but the artifact set now says two different things about the font contract. This needs an owner's decision, not an assessor's guess.

#### M5-5 — Pressure-test watch-list items that were deferred and have since come true

`pressure-test-findings.md` marked L1–L4 as "watch-list; not actioned this round." Two have since materialised:

- **L4 — *"hand-rolled auth is a time sink and a security risk for a solo dev. Use a managed/library auth solution."*** Not actioned; auth is hand-rolled (scrypt, session signing, revocation, rate limiting). It works and is well tested — and `deferred-work.md` now records that **nine API routes carry no in-route authorization and rely on the proxy gate as their only enforcement layer**. That is precisely the surface L4 warned about.
- **M1 — PII persistence, *"Accepted as-is."*** The same document observed that *"the repo holds real, unredacted member PII."* Fifteen days later this assessment found **three real congregation names still in the public repository and in its pushed git history** (F4-2). The risk was identified, accepted, and then realised.
- **L1 — regeneration overwrites last-good with no versioning/undo.** Still unaddressed.

### 🟡 Minor Concerns

- **m5-1 — Epics 13–16 are retrospective.** Each is explicitly *"Retrospective BMAD"* for already-written commits. This inverts Epic → Story → Spec → implement, so acceptance criteria were written to match code rather than code written to satisfy criteria — which weakens AC as a verification instrument even where present. Honestly labelled, and the reason `AGENTS.md`'s gate was hardened.
- **m5-2 — Story 1.1 is a retrospective stub (0.9 KB) where the standard wants a starter-template setup story.** The architecture names no starter, but `create-next-app` was plainly used — the untouched `metadata` export still reading *"Create Next App"* in production is the visible cost of that story never being written properly.
- **m5-3 — Database/entity timing deviates from the standard by design.** The standard prefers each story creating the tables it needs; this project centralises DDL on the `getDb` startup path (now fixed as architecture AD-9). Justified for a single-file SQLite bootstrap; recorded so the deviation is deliberate rather than accidental.
- **m5-4 — Story 6.6 cites `NFR-4`, an identifier the PRD never defines** (Step 3, F3-5).
- **m5-5 — Epic 14 story granularity is the inverse problem to C5-3:** six stories where 14.3 and 14.6 are UI-tweak iterations driven by operator testing. Not a defect — but it shows story sizing in this repository is set by how the work arrived, not by a standard.

### Best-practices compliance summary

| Check | Result |
| --- | --- |
| Epic delivers user value | ❌ 3 of 16 |
| Epic can function independently | ❌ 4 epics forward-depend on later epics |
| Stories appropriately sized | ❌ 5 epic-sized stories; 1 story = 1 PRD phase |
| No forward dependencies | ❌ systematic |
| Database tables created when needed | ⚠️ deliberate deviation, architecture-justified |
| Clear acceptance criteria | ❌ 1 story with none; error paths broadly absent |
| Traceability to FRs maintained | ✅ **strongest area** — an explicit FR Coverage Map exists and is honest about Partials, though it is 10 days stale and omits FR-11b |

---

## Summary and Recommendations

### Overall Readiness Status

## ⚠️ NEEDS WORK

Not *NOT READY*. The artifact set is substantially real: 22 FRs each carrying testable consequences, an explicit and honest FR Coverage Map, four SPEC packages, two architecture spines that now pass their gate, and UX spines that are now correctly shaped. A competent builder could work from this.

But **READY** is not available, for two reasons that have nothing to do with document polish:

1. **Two open action items could break a Sabbath service, and neither is a documentation task.** Epic 16 moved layout ownership into the Artifact Registry. The seeder inserts *missing* template IDs only, so the production database still holds the **old rows** for `welcome`, `verse-reading`, `special-song`, `family-youth`, and `bible-verse-contemplation`. The companion item — inspect a generated deck and the projector before the next service — is also unperformed. So **nobody has confirmed what the projector will actually show**, on a system whose own architecture states that a failure during a service cannot be retried.

2. **The delivery tracker cannot be planned from.** Four stories are `done` with no story file and therefore no acceptance criteria. One Phase-1 requirement (FR-11b) is absent from the epics entirely. A whole shipped subsystem (Epic 16) has no requirement ancestry. The PRD's own phase gate — which governs whether Phases 2–6 should exist at all — was never recorded as passed, waived, or skipped, yet all five shipped.

### Findings

**38 findings across 5 categories.** Severity is impact on the next increment, not effort to fix.

| Category | Findings | Critical |
| --- | --- | --- |
| Pre-existing defects carried in | 5 | 1 |
| PRD analysis | 4 | 2 |
| Epic coverage | 7 | 2 |
| UX alignment | 7 | 2 |
| Epic & story quality | 15 | 5 |

Fixed during this assessment rather than merely reported: the misplaced epic-16 spine and its stale Stack table; six undocumented architecture invariants the code already enforced; both UX spines' shape, coverage and protagonists; `project-context.md` pointing every agent at a deleted `middleware.ts`; the missing architecture and UX rows in the `AGENTS.md` authority map; and the PII.

### Critical Issues Requiring Immediate Action

1. **Production template rows are stale and the projector is unverified** (F3-6). Highest consequence in the set. Operational, not documentation.
2. **Real congregation PII was public** (F4-2). Working tree and git history are remediated and force-pushed; the guard now blocks all three names. **Residual:** GitHub may still serve the old objects by direct SHA until garbage collection — only a GitHub Support purge request settles that, and only the account owner can file it.
3. **Four stories `done` with no acceptance criteria** (C5-5) — in the epic that rebuilt how every slide is produced.
4. **FR-11b is untracked** (Step 3, Critical) — a Phase-1 requirement, the documented fallback for a Telegram outage, implemented in code and absent from the epics.
5. **The phase gate was never closed** (Step 2). SM-3 made it measurable: 13 weeks, leading gate at week 4. All five contingent phases shipped with no record of the decision.
6. **Three of five Phase-1 go/no-go spikes are unrecorded** (M5-1) — font-on-a-clean-machine, church fidelity sign-off, and the 5–10 Rundown corpus. Two are human judgments the repository cannot infer.
7. **Story 5.2 has no acceptance criteria** (C5-4) and cites a non-existent FR-10a — on the operation that deletes members' photos and prayer requests.

### Recommended Next Steps

Ordered by consequence. Steps 1 and 2 are not BMad work and should not wait for it.

1. **Before the next service:** reset the five template rows on the production database, then generate a deck and look at it on the projector. Close both Epic 16 action items. No artifact can substitute for looking.
2. **Finish the PII remediation:** file the GitHub Support purge request; confirm whether any clone or fork exists; delete the pre-rewrite backup bundle from the scratchpad once satisfied — it still contains the old history with the real names.
3. **Run `bmad-correct-course`.** This is the correct BMad instrument for reconciling a tracker that diverged from delivery, and it is what `AGENTS.md` rule 3 prescribes. Bring in: FR-11b into the inventory and coverage map; a decision on 16.2–16.5 (author the story files retrospectively, or retire the keys and let `spec-16-2-artifact-pipeline-completion.md` carry the contract explicitly); Epic 14's `in-progress`-with-all-stories-`done` contradiction; a refresh of the FR Coverage Map, which is dated 2026-07-19 and predates Epics 14–16; and an explicit record of the phase-gate decision.
4. **Close or waive the three unrecorded spikes** (M5-1). Two are the church's call, not the developer's — particularly fidelity sign-off, which the pressure test rated an *adoption* risk rather than a technical one.
5. **Number the PRD's NFRs** and set `status` away from `draft`. Until NFRs have stable ids, no story or test can cite one, and NFR coverage stays at 57% because there is nothing to trace.
6. **Then the product defects, via stories** — not inline. In order: measure `muted-foreground` contrast with a real checker; decide dark mode (mount a provider or delete the dead `.dark` block — keeping both is the worst option); the one-line `metadata` fix; a dirty-state guard for the canvas editor; and in-route authorization for the nine routes that rely on the proxy gate alone.
7. **Give Epic 16 requirement ancestry** — either an FR in the PRD or an explicit, recorded decision that the Artifact Registry is an architecture-level capability governed by SPEC rather than by the PRD. Right now it is governed by neither, in a repository whose epics state that *"PRD FR numbers are authoritative."*

### What is genuinely strong

Stated because an assessment that only lists faults misrepresents the thing it assessed:

- **Requirement quality.** Every FR carries testable consequences. Vocabulary is anchored in a Glossary and used verbatim. Phase assignment is explicit per FR. This is better than most PRDs.
- **The FR Coverage Map exists and does not lie.** It says *"All epics done means story keys, not zero remaining FR Partials"* and marks two FRs Partial rather than rounding up. That honesty is why this assessment could find anything at all.
- **The pressure-test discipline.** An adversarial pre-mortem was run, each finding traced to a specific FR or slide, and every one carries a recorded maintainer decision. Two of its deferred watch-list items later came true exactly as described — which is the pressure test working, not failing.
- **Code-level documentation.** `src/proxy.ts` explains *why* the `middleware` → `proxy` rename is load-bearing and why `no-store` is required behind a Cloudflare Tunnel. Six architecture invariants were recoverable from the code precisely because it was commented that well.

### Final Note

This assessment identified **38 issues across 5 categories**, of which 12 are critical or high. Several were repaired during the assessment itself, through the skill that owns each artifact rather than by ad-hoc edit; the rest are listed above with an owner and an order.

The most important finding is not a document defect. Epic 16 changed who owns slide layout, the production database was never migrated to match, and no one has looked at the projector since. Everything else on this list can wait a week. That cannot.

---

**Assessed:** 2026-07-29 · `bmad-check-implementation-readiness` (Claude Opus 5)
**Steps completed:** 1–6 · **Status:** NEEDS WORK
