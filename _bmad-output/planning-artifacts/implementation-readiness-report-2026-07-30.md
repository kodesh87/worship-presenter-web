---
name: 'Implementation Readiness Assessment — 2026-07-30'
type: readiness-report
purpose: report
status: final
verdict: NEEDS WORK
findings: 29
created: '2026-07-30'
updated: '2026-07-30'
stepsCompleted:
  [
    'step-01-document-discovery',
    'step-02-prd-analysis',
    'step-03-epic-coverage-validation',
    'step-04-ux-alignment',
    'step-05-epic-quality-review',
    'step-06-final-assessment',
  ]
inputDocuments:
  [
    '_bmad-output/planning-artifacts/prds/prd-bic-pptx-workflow-2026-07-10/prd.md',
    '_bmad-output/planning-artifacts/prds/prd-bic-pptx-workflow-2026-07-10/addendum.md',
    '_bmad-output/planning-artifacts/prds/prd-bic-pptx-workflow-2026-07-10/pressure-test-findings.md',
    '_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md',
    '_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md',
    '_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md',
    '_bmad-output/planning-artifacts/epics.md',
    '_bmad-output/planning-artifacts/epics-parallel-delivery-analysis.md',
    '_bmad-output/implementation-artifacts/sprint-status.yaml',
    '_bmad-output/implementation-artifacts/stories/*.md',
    '_bmad-output/specs/*/SPEC.md',
    '_bmad-output/project-context.md',
  ]
---

# Implementation Readiness Assessment Report

**Date:** 2026-07-30
**Project:** worship-presenter-web

---

## Step 1 — Document Inventory

No sharded documents exist anywhere under `planning_artifacts` (a repo-wide search for
`index.md` under that path returns nothing), so there are **no whole-vs-sharded duplicates to
resolve**. Every required document type was found.

### PRD

| File | Size | Last modified |
| --- | --- | --- |
| `prds/prd-bic-pptx-workflow-2026-07-10/prd.md` | 65 KB | 2026-07-30 18:16 |
| `prds/prd-bic-pptx-workflow-2026-07-10/addendum.md` | 8.8 KB | 2026-07-19 |
| `prds/prd-bic-pptx-workflow-2026-07-10/pressure-test-findings.md` | 25 KB | 2026-07-29 |
| `prds/prd-bic-pptx-workflow-2026-07-10/.memlog.md` | 14 KB | run record |

### Architecture

| File | Size | Last modified |
| --- | --- | --- |
| `architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md` | 74 KB | 2026-07-30 20:07 |
| `architecture/architecture-bic-pptx-workflow-2026-07-10/reviews/` | 24 files | through 2026-07-30 |
| `architecture/architecture-bic-pptx-workflow-2026-07-10/.memlog.md` | 54 KB | run record |

**Archived during this run.** `architecture/architecture-epic-16/` was moved to
`architecture/archived/architecture-epic-16/` on 2026-07-30 at the owner's request, so nothing sits
beside the project spine looking like a peer spine. The folder name is unchanged, so citations
written before the move still name the folder they meant. Live pointers were repaired in the same
change set — four in `ARCHITECTURE-SPINE.md` (two `companions` entries, the *one spine per project*
note, the *where AD-11..AD-19 were decided* note), one in the archived folder's own `SUPERSEDED.md`
(now `../../` to reach the spine), and one narrative path in `sprint-status.yaml:304`.

Remaining occurrences of the old path sit only in append-only memlogs, dated review reports, the
2026-07-29 readiness report, and the 2026-07-29 sprint change proposal — contemporaneous run
records that the spine's own policy (`ARCHITECTURE-SPINE.md:42`) deliberately does not rewrite.

### Epics & Stories

| File | Size | Last modified |
| --- | --- | --- |
| `epics.md` | 38 KB | 2026-07-30 18:16 |
| `epics-parallel-delivery-analysis.md` | 36 KB | 2026-07-29 |
| `_bmad-output/implementation-artifacts/stories/` | 40 story files (Epic 1 → 17) | through 2026-07-30 |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | 35 KB | 2026-07-30 |
| `_bmad-output/specs/` | 4 SPEC kernels + companions | through 2026-07-30 |

### UX Design

| File | Size | Last modified |
| --- | --- | --- |
| `ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md` | 39 KB | 2026-07-30 20:57 |
| `ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md` | 16.5 KB | 2026-07-30 20:56 |
| `ux-designs/ux-bic-pptx-workflow-2026-07-10/review-rubric.md` | 9.3 KB | 2026-07-29 |
| `ux-designs/ux-bic-pptx-workflow-2026-07-10/validation-report.md` | 8 KB | 2026-07-29 |

### Discovery observations carried into the assessment

1. **Authority for structure is the spine, not `docs/architecture.md`.** `docs/architecture.md`
   (5.2 KB, modified 2026-07-30 20:28) lives in `project_knowledge`, describes the same system in
   prose, and is a candidate drift source. It is read as descriptive context; divergence from the
   spine is reported as a finding, not treated as authority.
2. **Stale BMad config.** `_bmad/bmm/config.yaml` still carries `project_name: bic-pptx-workflow`,
   the name of the **frozen** legacy repository. The active project is `worship-presenter-web`
   (`_bmad-output/project-context.md`). This report uses the active name.
3. **This is a re-assessment against moved artifacts.** A readiness report was produced on
   2026-07-29, but `prd.md`, `epics.md`, `ARCHITECTURE-SPINE.md`, `DESIGN.md` and `EXPERIENCE.md`
   were all modified on 2026-07-30 after it. The 2026-07-29 report is therefore evidence of prior
   state, not a current verdict.
4. **One already-stale citation, predating this run.**
   `epics-parallel-delivery-analysis.md:11` lists
   `architecture/architecture-epic-16/ARCHITECTURE-SPINE.md` in `inputDocuments`; that filename
   stopped existing at the 2026-07-30 fold-in, before the archive move. Left as a dated input
   record and carried forward as a finding.
5. **`SUPERSEDED.md:34` overstates its own repair.** It claims every live citation in the repository
   was repaired in the fold-in change set; `ARCHITECTURE-SPINE.md:42` corrects that as too strong
   and names the residue. Carried forward as a finding.

---

## Step 2 — PRD Analysis

**Read in full:** `prd.md` (572 lines), `addendum.md` (110 lines, authoritative Deck Blueprint),
`pressure-test-findings.md` (201 lines, advisory + resolution log). No sharded parts exist.

### Functional Requirements

Numbering is global `FR-N` with three letter-suffixed sub-requirements (`FR-10b`, `FR-11b`,
`FR-13b`). Phase per §6. "Cons." = count of testable consequences stated in the PRD.

| FR | Phase | Requirement (as stated) | Cons. | Realizes |
| --- | --- | --- | --- | --- |
| **FR-1** | 1 | Ingest a Rundown from Telegram into a structured Weekly Data Payload — picoclaw can read the week's Telegram messages and submit a structured Weekly Data Payload the API accepts. | 8 | UJ-1 |
| **FR-2** | 1 | Validate and resolve Hymns by SDAH Number in the app API — the Service-input API validates each submitted SDAH Number against the Hymnal Database and resolves title + structured lyrics server-side, reporting validity back to the caller. | 4 | UJ-1 |
| **FR-3** | 1 | Manage the persistent Announcement List — ordered, persistent across weeks; picoclaw and Operators can instruct stay / replace / remove / add one-off / order. | 7 | UJ-1 |
| **FR-4** | 1 | Assemble a Deck from Template Skeleton + Weekly Data Payload per the Deck Blueprint. | 4 | UJ-1 |
| **FR-5** | 1 | Render Song Blocks with readable lyric slides — song-title slide + K lyric slides, breaks governed by structure **and readability**. | 5 | UJ-1, UJ-4 |
| **FR-6** | 1 | Render the variable non-song content into its Slide Types — Verse Reading, sermon speaker, family/youth, Announcement List. | 6 | UJ-1 |
| **FR-7** | 1 | Apply one selectable, elegant slide transition — administrator chooses from none / cut / fade / dissolve / push; applies uniformly; fade is default. | 4 | UJ-4 |
| **FR-8** | 1 | List Services by date — authenticated user sees a dated list and opens any one; a list/detail API is queryable by text. | 3 | UJ-2 |
| **FR-9** | 2 | Preview an assembled Service slide-by-slide in the browser without downloading the PPTX. | 3 | UJ-2 (ext.) |
| **FR-10** | 1 | Delete a Service manually (full cleanup) — Deck, payload, participant text, uploaded images. | 3 | weekly loop |
| **FR-10b** | 4 | Auto-delete generated Decks by Retention Policy — **only** generated PPTX past an Admin-configured window (default 2 months). | 4 | — |
| **FR-11** | 1 | Edit a Service's inputs via the web form — participants, songs, Verse Reading, sermon speaker/graphic, family/youth, Announcement List entries and order. | 2 | UJ-2 |
| **FR-11b** | 1 | Create a Service via Web Form — paste Raw Rundown Text, optional structured fields and image URLs; date-collision warning. | 3 | UJ-5 |
| **FR-12** | 3 | Submit a correction via Telegram — picoclaw identifies the target Service and updates the affected part of the existing payload. | 3 | UJ-3 |
| **FR-13** | 1 | Regenerate a Service in place from its current Weekly Data Payload. | 3 | UJ-2, UJ-3 |
| **FR-13b** | 3 | Resolve concurrent edits first-save-wins — later conflicting save rejected with an error. | 2 | — |
| **FR-14** | 1 | Download an offline-capable PPTX that presents fully offline. | 4 | UJ-4 |
| **FR-15** | 2 | Present a Service as a full-screen Web Slideshow (single screen), same configured transition as the Deck. | 4 | UJ-4 |
| **FR-16** | 5 | Provide dual-screen Presenter Mode in the browser — clean projector output + operator view (current, next, Run-Sheet, participant list), with blank-to-black. | 5 | UJ-4 |
| **FR-17** | 1 | Display the full Order of Service as a Run-Sheet — roles, names, songs with numbers, timings. | 3 | UJ-2, UJ-4 |
| **FR-18** | 1 | Authenticate users with per-person accounts and two Roles (Admin, Operator); unauthenticated visitors reach nothing. | 5 | UJ-2, UJ-4 |
| **FR-19** | 6 | Look up and display a scripture passage on demand **within Presenter Mode**; KJV-only; never modifies a Deck. Depends on FR-16. | 3 | ad-hoc verse need |
| **FR-20** | — (delivered 2026-07-26, spec'd 2026-07-29) | Author slide layouts at runtime through an Artifact Registry — Administrator changes element position, size, and content binding via a registry-backed canvas editor; effective on next Deck and Web Slideshow with no code change. | 7 | maintainability (§9), not a UJ |

**Total FRs: 23** (FR-1 … FR-20 plus FR-10b, FR-11b, FR-13b).
**By phase:** Phase 1 = 14 (FR-1…FR-8, FR-10, FR-11, FR-11b, FR-13, FR-14, FR-17, FR-18) ·
Phase 2 = 2 (FR-9, FR-15) · Phase 3 = 2 (FR-12, FR-13b) · Phase 4 = 1 (FR-10b) ·
Phase 5 = 1 (FR-16) · Phase 6 = 1 (FR-19) · unphased = 1 (FR-20).

### Non-Functional Requirements

Cross-cutting, §10. Stable ids `NFR-1 … NFR-7` were added 2026-07-29 by Correct Course; before
that they were unnumbered prose, so story 6.6 cited an `NFR-4` that resolved to nothing.

| NFR | Requirement (as stated) |
| --- | --- |
| **NFR-1** | **Offline reliability (load-bearing).** A downloaded PPTX must present a full Service — all slides, images, fonts — with zero network access. The Phase-2 Web Slideshow is best-effort offline after initial online load, scoped to one Service. |
| **NFR-2** | **Generation performance.** Assembling/regenerating a full ~68-slide Service must fit within the ≤ 5-minute late-change window (SM-5), including PPTX export. |
| **NFR-3** | **Readability.** Lyric slides must never be over-full; FR-5 splitting rules exist so the congregation can read every slide from the pews. Binding on FR-20 registry edits too. |
| **NFR-4** | **Headless-safe rendering.** Generation runs without a human-driven PowerPoint; fonts and backgrounds render correctly headless. All supported background paths (solid fill, full-bleed image) must render. |
| **NFR-5** | **Robust parsing.** Rundown parsing tolerates the real semi-structured format (honorifics, first-name-only names, `》` / `[ ]` markers, `"-"` empties, `"The Speaker"` references, variable song counts) and **fails visibly, not silently** — a general "unmapped input" channel plus unresolvable/missing images surfaced to the Reviewer, not hymn-only. |
| **NFR-6** | **Access control.** All Service data and actions require authentication and are gated by Role (FR-18); no public endpoint exposes member PII or Services. |
| **NFR-7** | **Font licensing and availability.** Freely-licensed, headless-safe fonts; **embed** in the PPTX where feasible, otherwise a **standardized** font documented and installed on the presentation machine(s). Verified on a *clean* machine. |

**Total cross-cutting NFRs: 7.**

**Feature-specific NFRs (stated in §4, and three of the four carry no id):**

| Location | Requirement | Id? |
| --- | --- | --- |
| §4.2 (FR-7) | Fonts freely-licensed and headless-safe; embed when feasible, else standardized + installed; visual result closely resembles the current deck but need not be pixel-perfect. | consolidated into **NFR-7** |
| §4.5 (FR-14) | PPTX generation completes for a full ~68-slide Service within an acceptable regeneration budget. | folds into **NFR-2** |
| §4.10 (FR-20) | The seeded registry is a correctness surface: every declared placeholder must bind to exactly one element and every planner template id must be present. Conformance test tracked as an open action item in `sprint-status.yaml`. | **none** |
| §4.10 (FR-20) | Seeding inserts **missing** template ids only, so an existing deployment keeps old rows when a seeded template changes — the migration is an operational step, not an automatic one. | **none** |

### Additional Requirements & Constraints

**Non-Goals (§5) — 10, each a testable boundary:** not a general worship-presentation product (no
per-church configurability) · not a song search engine (no free-text/web lyric search, no
contemporary songs) · **no video handling** of any kind · no guest/performer decks · not a
flyer/graphic generator · not a live presentation controller · not a full participant-roster-on-slides
system · not a public website · not a document archive (Decks are expendable) · Scripture Display is
not a study platform. FR-20 restates the first of these explicitly as its own boundary.

**Constraints & Guardrails (§9):**
- **Privacy** — family/youth slides and the Run-Sheet carry member PII (names, photos, prayer
  requests); access restricted by Role, never public; manual delete is the purge mechanism.
- **Cost** — solo developer, hobby budget. Production topology is a **target, not yet deployed**
  (corrected 2026-07-29 by the owner): home-PC LiveServer + Docker Desktop + Cloudflare Tunnel.
  Every "production" reference in the artifact set is to be read against this — no live database,
  no live projector, no Sabbath currently depending on the system.
- **Maintainability** — one maintainer owns all three layers; changes flow picoclaw skill → API →
  app. The hand-editable master template is kept as an explicit **break-glass fallback**.

**Dependencies (§11) — 6:** Hymnal Database (input, not built here) · Verse Database (KJV-only,
input) · picoclaw agent (customized skill required) · Telegram (intake channel) · OBS (must be able
to capture the projector output) · Fonts (freely-licensed, headless-safe; embed-or-install decision).

**Phase-1 pre-requisite spikes (§6) — 5 go/no-go gates, current state:**

| Gate | State |
| --- | --- |
| Hymnal Database acquired + structure validated | run |
| picoclaw customizable to intake/readback/image-binding spec | run |
| **Font proven on a clean machine** | **OPEN** — technical, belongs to the maintainer |
| Church fidelity sign-off on a sample rebuilt slide set | **WAIVED** by owner 2026-07-29 (compensating control: pre-launch projector inspection, tracked in `sprint-status.yaml`) |
| 5–10 historical Rundown corpus before locking parse rules | **WAIVED** by owner 2026-07-29 (carried risk: parser is fit to one sample, `tests/fixtures/sample-rundown.txt`) |

**Phase-gate waiver (§6, recorded 2026-07-29):** the SM-3 build-order gate is waived retroactively
for Phases 2–6, which were all built and shipped (Epics 8–12) without the gate being evaluated. SM-3
remains a live product metric; the counter-metrics SM-C1/C2/C3 still bind; the five spikes above are
**not** covered by that waiver.

**Success metrics:** SM-1 … SM-7 primary/secondary, plus counter-metrics SM-C1 (don't trade fidelity
for speed), SM-C2 (don't over-delete), SM-C3 (don't re-centralize on one person).

**Assumptions Index (§12) — 4,** of which two are marked **Decided** (font strategy; no formal
consent/retention regime beyond role-access + manual delete), one is the Telegram image-sequence +
textual-description binding assumption (FR-1), one is the best-effort-offline scope of FR-15.

**Deferred by choice (§8) — 3:** finer Events-Department permissions (a third Role) · Scripture
Display trigger/dismiss UX · retention granularity (per-Service vs one global default).

### PRD Completeness Assessment

The PRD is unusually strong on the axis that matters most here: **every FR carries explicitly
testable consequences**, vocabulary is anchored in a Glossary and used verbatim, phases are assigned
per FR, and — since the 2026-07-29 Correct Course — NFRs carry stable citable ids. Requirement
extraction hit no ambiguity that would block coverage validation. Six defects are worth carrying
into the coverage step.

1. **Two feature-specific NFRs under FR-20 have no ids** (registry-as-correctness-surface;
   seed-inserts-missing-ids-only). This is exactly the defect Correct Course fixed for §10 on
   2026-07-29 — an unnumbered requirement cannot be cited by a story or a test, so its coverage
   cannot be traced. One of the two even names its own missing test as an open action item.
2. **The font gate is open, and it is load-bearing.** §6 calls the five spikes go/no-go gates. Two
   were waived by decision; three were run; the font-on-a-clean-machine proof is neither — it is
   simply open, and both FR-14 and NFR-7 make it an acceptance condition. The PRD's own failure
   story for this (pressure-test C2) is a live font substitution on the projector.
3. **FR-7 specifies an administrator choice without specifying the surface.** "An administrator
   chooses it from a small set" is a settings capability, but no FR says where that setting lives or
   who may reach it. The build does have one — `src/app/admin/page.tsx` renders `TransitionSettings`
   backed by `/api/admin/settings` — so this is a documentation-side gap, not a missing capability.
   Whether the IA records that surface is checked in Step 4.
4. **FR-16 contains a forward dependency on Phase 6 inside a Phase 5 requirement** — its blank-screen
   consequence requires not disturbing "a scripture overlay underneath," which only exists once
   FR-19 ships. The obligation is real but its precondition arrives a phase later.
5. **Capability shipped without an FR.** §6 records Epic 13 and Epic 15 as delivered outside the
   phase plan, and the PRD itself flags that Epic 15's chorus-after-every-verse behavior "was decided
   in a SPEC rather than here." Epic 13's shared header / profile / dashboard search has no FR at
   all — only its hub-local upload half is covered, by an FR-3 consequence. Epic 17 (dark mode) has a
   story but no FR mentions theming anywhere. Carried into Step 3 as a coverage question, in the
   direction the PRD's own authority rule makes it: `epics.md` declares FR numbers authoritative.
6. **`FR-10b`, `FR-11b`, `FR-13b` are letter-suffixed sub-requirements.** Traceability still works,
   but any downstream count of "FR-1 through FR-20" silently omits three requirements — one of which
   (FR-13b) is a concurrency guard.

---

## Step 3 — Epic Coverage Validation

**Read in full:** `epics.md` (402 lines) and `sprint-status.yaml` epic/story keys. `epics.md` carries
its own *FR Coverage Map (honest)* and declares **"PRD FR numbers are authoritative."** That
declaration is the standard this step holds it to.

### Coverage Matrix

| FR | Requirement (short) | Epic coverage | Status |
| --- | --- | --- | --- |
| FR-1 | Ingest Rundown → Weekly Data Payload | Epic 2 + Epic 6 | ✓ Covered — Done |
| FR-2 | Validate/resolve Hymns by SDAH Number | Epic 2 | ✓ Covered — Done |
| FR-3 | Persistent Announcement List | Epic 6 (+ Epic 13 for hub-local uploads) | ✓ Covered — Done |
| FR-4 | Assemble Deck from skeleton + payload | Epic 3 + Epic 6 + Epic 7 | ✓ Covered — Done |
| FR-5 | Song Blocks with readable lyric slides | Epic 3 (+ Epic 15 refinement) | ✓ Covered — Done |
| FR-6 | Render variable non-song Slide Types | Epic 3 + Epic 6 + Epic 7 | ✓ Covered — Done |
| FR-7 | One selectable slide transition | Epic 3 + `spec-transitions-and-blank-screen` | ✓ Covered — Done (admin surface verified in code: `/admin` → `TransitionSettings`; `AD-23`) |
| FR-8 | List Services by date + list/detail API | Epic 4 + Epic 6 + Epic 7 | ✓ Covered — Done |
| FR-9 | Slide-by-slide browser preview | Epic 8 | ✓ Covered — Done |
| FR-10 | Manual delete Service | Epic 5 | ✓ Covered — Done |
| FR-10b | Auto-delete Decks by Retention Policy | Epic 10 | ✓ Covered — Done |
| FR-11 | Edit Service inputs via web form | Epic 5 + Epic 14 | ✓ Covered — Done (dual-path Partial closed by 14.4 / 14.6) |
| FR-11b | Create a Service via Web Form | Epic 14 (14-1, 14-4) | ✓ Covered — Done (added to this document only on 2026-07-29) |
| FR-12 | Telegram correction path | Epic 9 | ✓ Covered — Done |
| FR-13 | Regenerate a Service in place | Epic 5 | ✓ Covered — Done |
| FR-13b | First-save-wins concurrency | Epic 9 | ✓ Covered — Done (`AD-6`, marked *partial* in the spine) |
| FR-14 | Download offline-capable PPTX | Epic 3 + Epic 7 | ✓ Covered — Done (font condition unproven — see F3-6) |
| FR-15 | Full-screen Web Slideshow | Epic 8 | ✓ Covered — Done |
| FR-16 | Dual-screen Presenter Mode | Epic 11 | ✓ Covered — Done (projector-liveness gap tracked as Story 17.5) |
| FR-17 | Full Order of Service Run-Sheet | Epic 4 + Epic 7 | ✓ Covered — Done |
| FR-18 | Per-person accounts + two Roles | Epic 1 + Epic 6 (+ Epic 18 hardening) | ✓ Covered — Done |
| FR-19 | On-demand KJV Scripture Display | Epic 12 | ⚠️ Covered — **Partial** (verified today: `data/` holds `asset-map.json`, `default-registry.json`, `hymns.json` only; no KJV corpus, `import:kjv` remains an ops step) |
| FR-20 | Runtime-editable Artifact Registry | Epic 16 | ⚠️ Covered — Done **as written**, but its scope is overtaken by Epic 20 (see F3-1, F3-2) |

**No FR appears in `epics.md` that is absent from the PRD.** The inventory is 1:1 with §4, including
the three letter-suffixed sub-FRs.

### NFR coverage

| NFR | Epic representation | Status |
| --- | --- | --- |
| NFR-1 Offline reliability | Epic 3 + Epic 7 (FR-14) | ✓ Covered |
| NFR-2 Generation performance | Epic 3 + Epic 5 (FR-13) | ✓ Covered |
| NFR-3 Readability | **none** | ❌ **No owner** — stated by `epics.md` itself |
| NFR-4 Headless-safe rendering | Epic 3 + Epic 6 (Story 6.3) | ✓ Covered |
| NFR-5 Robust parsing / fail visibly | Epic 5 (5.1) + Epic 6 (6.6) | ⚠️ **Partial** — the general unmapped-input channel has no UX surface |
| NFR-6 Access control | Epic 1 + Epic 6 (6.2, 6.7) + Epic 18 | ✓ Covered |
| NFR-7 Font licensing and availability | Epic 7 (Story 7-4) | ⚠️ **Covered but contradicted** — see F3-6 |

### Missing Requirements & Coverage Defects

**F3-1 — CRITICAL: Epic 20 delivers eight stories of capability with no FR ancestry.**
Epic 20 ("The registry becomes where the deck is authored", 8 stories, all `backlog`) is contracted
by `specs/spec-artifact-registry-authoring/SPEC.md` and cites no FR. FR-20 does not describe what
Epic 20 delivers: FR-20 covers *editing an existing template's layout*, while Epic 20 adds **slide
ordering**, **create/delete of registry entries**, a **three-kind vocabulary**, a **Placeholder
Catalog**, **SongSet slots**, and a **service-bound snapshot with a Sync action**. The last of these
is operator-visible behavior — live registry edits stop reaching an existing service.
*Impact:* this is the Epic 16 defect repeating in a document that declares FR numbers authoritative.
Epic 16 shipped without FR ancestry and needed a retrospective FR-20 written by Correct Course
2026-07-29; Epic 20 is still `backlog`, so the fix is available **before** code this time.
*Recommendation:* amend §4.10 / add `FR-21` covering ordered authoring + service snapshot + Sync
before Story 20.1 is implemented. `sprint-status.yaml` already records the inverse-drift diagnosis
("docs ran ahead of code and nothing recorded that it was waiting") — the FR is the missing half.

**F3-2 — CRITICAL: a live PRD consequence becomes false when Story 20.2 ships.**
FR-20's fourth consequence names the read-only base types as `FullScreenImage`, `SongSet`,
`Announcement`. Epic 20's *Constraints* retire `FullScreenImage` (along with the three placeholder
kinds) by name. A shipped Story 20.2 therefore leaves the PRD asserting a vocabulary the code no
longer has. *Recommendation:* the `base_type` collapse and the FR-20 consequence rewrite belong in
one change set, per the `AGENTS.md` same-change-set rule.

**F3-3 — HIGH: NFR-3 has no owner, and Epic 20 removes the mechanism that implements it.**
`epics.md` states plainly that no epic and no UX artifact owns "is this readable from the pews?"
NFR-3 is the binding constraint on FR-5 and — by FR-20's own text — on registry edits too. Story
20.1's seed makes this sharper: per the spine's *Deferred*, one General row per lyric page means
those lyrics "stop passing the FR-5 splitter and stop tracking `data/hymns.json`". So the mechanism
that enforces readability is scheduled for removal while the requirement it enforces has no owner.
*Recommendation:* give NFR-3 an owner **in Story 20.1's AC**, not after — either the splitter keeps
running over seeded General lyric pages, or the story states what replaces it.

**F3-4 — HIGH: FR-19 remains Partial for the third consecutive assessment.**
The KJV corpus is still not under `data/`; the Presenter lookup exists but the data path is an ops
step (`npm run import:kjv`). Re-verified against the filesystem today, not carried from the previous
report. *Impact:* FR-19 is the only PRD FR that cannot be demonstrated end to end.
*Recommendation:* either document `import:kjv` as the accepted permanent delivery mechanism (closing
FR-19 as Done-by-ops) or open a story. It has been carried as "Partial" since 2026-07-19 without
either.

**F3-5 — MEDIUM: NFR-5's unmapped-input channel is specified but has no surface.**
NFR-5 requires surfacing *every* line or image the parser could not confidently map — a general
channel, not the hymn-only flag. Epic 5/Epic 6 cover parsing robustness and tests; nothing owns the
Reviewer-facing surface. The PRD makes this load-bearing precisely because Phase 1 has no slide
preview. *Recommendation:* assign to a story under Epic 17 (operator surface) with an explicit AC.

**F3-6 — MEDIUM: the only font artifact contradicts NFR-7.**
NFR-7 requires **freely-licensed** fonts, embedded where feasible, otherwise a standardized font
documented and installed, verified on a clean machine. The sole delivered artifact is Story 7.4,
whose AC is *"Arial / Phase 1 font guidance is documented in `docs/deploy.md`"* — Arial is not
freely licensed. Combined with the still-open clean-machine spike (§6), FR-14's offline-font
consequence has neither a compliant font decision nor a proof.
*Recommendation:* one story that picks the freely-licensed face, records the embed-vs-install
decision, and runs the clean-machine check. This is the last unwaived Phase-1 pre-requisite.

**F3-7 — LOW: two stale tracking notes.**
(a) `epics.md:327` still labels Story 19.1 *(backlog)* while both the epic heading and
`sprint-status.yaml` record it as `retired`. (b) The Epic 20 comment block in `sprint-status.yaml`
still instructs that "Story 20.8 must not ship before the **epic-16** architecture spine carries a
new AD-n superseding AD-14" — `AD-16` landed 2026-07-30 and the epic-16 child spine no longer exists.
`epics.md:373` records both facts correctly; the tracker was not updated with it.

### Coverage Statistics

- **Total PRD FRs: 23** · with a named primary epic: **23 (100%)** · Done: **22** · Partial: **1**
  (FR-19)
- **Total PRD NFRs: 7** · covered: **5** · Partial: **1** (NFR-5) · no owner: **1** (NFR-3) · of the
  five covered, **1 is contradicted by its own delivered artifact** (NFR-7)
- **Unnumbered feature-specific NFRs under FR-20: 2** — not traceable at all (Step 2, item 1)
- **Epic-side capability with no FR ancestry: 1 epic, 8 stories** (Epic 20)
- **Epic status:** Epics 1–16 `done` · Epic 17 `in-progress` (1 of 5 stories `ready-for-dev`) ·
  Epic 18 `backlog` · Epic 19 `retired` · Epic 20 `backlog`

FR coverage is **not** where this plan is weak — it is complete and honestly annotated. The exposure
is on the NFR side and at the front edge of Epic 20, where the largest remaining body of work has no
requirement ancestry and one PRD consequence it will falsify.

---

## Step 4 — UX Alignment

### UX Document Status

**Found.** The BMad two-file set, both `status: final`, both updated 2026-07-30 — the two most
recently touched artifacts in the whole planning corpus:

- [`EXPERIENCE.md`](_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md)
  (295 lines) — IA, flows, states, behavior
- [`DESIGN.md`](_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md)
  (186 lines) — visual identity, tokens, components

No `ux.md` and no sharded index exists; that is the two-file split, not a missing document. Both
carry explicit honesty notes, ratify against `src/**`, and mark unbuilt states **⚠ designed, not
shipped** with a named owning story. Read in full for this step, together with the 366-line
architecture spine.

### UX ↔ PRD Alignment

Strong, and traceable in both directions.

- **All ten IA surfaces map to a PRD FR or an AD**: `/login`→AD-5 · `/`→FR-8 · `/services/new`→FR-11b
  · `/services/[id]`→FR-11/FR-17 · `/slideshow`→FR-9/FR-15 · `/present`→FR-16/FR-19 ·
  `/present/projector`→AD-10 · `/announcements`→FR-3 · `/admin`→FR-18 + AD-23 ·
  `/admin/artifacts`→FR-20.
- **Every PRD user journey has a flow** except UJ-1, which is excluded by a stated reason (Sari never
  opens the hub). UJ-2→Flow 1, UJ-5→Flow 2, UJ-4→Flow 3, UJ-3→Flow 4.
- **PRD NFRs land as UX states**, not as prose: NFR-5 → the *Unmapped input* cross-cutting state plus
  Flow 1 Branch 1b · NFR-2 → *Deck generation in progress* (verified in code:
  `src/app/services/[id]/EditForm.tsx:1022-1026` disables both controls and relabels while saving, so
  the stated consequence "prevented from firing a second generation over the first" holds) · NFR-6 →
  the four gate states · NFR-1 → Foundation's offline primacy and Flow 3 step 1.
- **Step 2's item 3 is resolved here.** The PRD leaves FR-7's administrator surface unspecified;
  `EXPERIENCE.md` records it twice — as the `/admin` IA row and as a named sub-surface with its
  shipped status and component (`admin/TransitionSettings.tsx` → `PUT /api/admin/settings`), landed on
  by Flow 8.
- **NFR-3 is confirmed, not closed.** `DESIGN.md` → *Who owns the deck the congregation sees* owns
  *stating* that nobody owns "is this readable from the pews?", names the only control (the
  pre-launch projector inspection that replaced the waived fidelity sign-off), and declines to invent
  a floor: *"A readability standard is a product decision."* That is the correct posture for a UX
  document and it leaves F3-3 open on the owner's desk.

### UX ↔ Architecture Alignment

The tightest pair in the set. Every behavioral claim in `EXPERIENCE.md` cites an `AD-n` rather than
restating it, and the **⚠ designed, not shipped** markers line up item for item with the spine's
`[TARGET]` tags: AD-16 → stale snapshot, Sync Artifact, Flow 5 steps 4–5 and Branch 5b · AD-19 → the
four `songset-*` hymnal bindings · AD-22 → the bounded SongSet configuration surface · AD-17 →
delete-stays-deleted and the two Reset faces · AD-10 → *Lost sync* and the missing plan identity.
Nothing in the UX set claims a `[TARGET]` decision as shipped — which is precisely what the
2026-07-29 version of this file got wrong for four states.

### Alignment Issues

**F4-1 — HIGH: FR-13b is claimed Done, and the architecture spine says its agent-path guard does not
ship.** `epics.md:87` records *"FR-13b | Epic 9 | Done (`updated_at` / 409)"*. The spine's *Deferred*
says the opposite in the same breath as FR-12: *"the correction path ships; **its concurrency guard,
FR-13b, does not**"*, and AD-6 names four bypass paths — the webhook correction and intake writes,
`DELETE /api/services/[id]`, and `PATCH`/`DELETE /api/announcements/[id]`, whose table has no
`updated_at` column at all. FR-13b's own PRD consequence is about *"the same Service edited from the
web form and from Telegram near-simultaneously"* — the Telegram half is exactly the unguarded half.
*Impact:* the coverage map claims a requirement met that its governing decision records as unmet, for
the scenario the requirement was written for. *Recommendation:* downgrade FR-13b to Partial in
`epics.md` and give AD-6's closing story a key — the spine says *"the decision is not in question —
only which story lands it."*

**F4-2 — MEDIUM: the PRD's UJ-4 puts the run sheet on a phone; the UX declares the phone out of
scope.** `prd.md:54` (Phase 1, committed): Elen presents from the PPTX *"with the web Run-Sheet open
on her phone or laptop for the order of service."* `EXPERIENCE.md` → *Responsive & Platform*:
*"Phone — **Out of scope.** No flow in this product is designed to be completed on a phone,"* and
*"This is a commitment, not an aspiration."* Layouts assume ≥1024px. Flow 3 (which realizes UJ-4)
silently drops the phone. *Impact:* a Phase-1 journey element in the committed MVP is contradicted by
a UX commitment, and neither document cites the other. *Recommendation:* one of the two moves — either
UJ-4 drops the phone (a PRD edit) or the run sheet gets a stated small-screen commitment. This is a
product call, not a documentation cleanup.

**F4-3 — MEDIUM: three cross-document "still outstanding" claims were resolved after they were
written, on the same day.**

| Claim | Where | Actual state |
| --- | --- | --- |
| The stale-snapshot and Reset-reverts-a-rename affordances *"have not been received"* in `EXPERIENCE.md` | spine *Deferred* (written 20:07) | Received — `EXPERIENCE.md` Open Items 5 and 6 (20:57), which say so explicitly |
| `docs/architecture.md:61` *"already contradicts \[AD-23] by hardcoding a crossfade"* | spine AD-23 (20:07) | Corrected — that line (20:28) now states the transition is resolved through `transitions.ts` and cites AD-23 |
| Story 20.8 blocked on the `EXPERIENCE.md` reconciliation, *"still outstanding"* | `epics.md:374`, `:400` | Done — `EXPERIENCE.md:180` states both halves, cites AD-16, and repairs the prior `AD-4` miscitation |

*Impact:* a reader following the spine or the tracker either redoes finished work or believes a
cleared blocker. Each claim was true when written; none is now. *Recommendation:* the receiving-edit
convention needs its reciprocal — when a document answers another's open handoff, the same change set
retires the claim in the document that raised it. The spine's bullets are `bmad-architecture`'s to
retire; `epics.md:374`/`:400` belong to the tracker.

**F4-4 — MEDIUM: three architecture gaps that are live today have no story owner.** All three are the
spine's own words, in *Deferred*: **AD-10's plan identity** — *"does not exist yet, and the hazard it
closes is live now"*; presenter and projector each build their own plan and messages carry a bare
index, so any structural change while a projector window is open offsets the two screens with nothing
to signal it. **AD-21's version counter** — *"no story owns introducing it."* **AD-6's four bypass
paths** — *"need a closing story."* Each is marked *sequencing, not an open question*, which is
exactly the state in which work goes missing: decided, unassigned, and not visible in
`sprint-status.yaml`. Story 17.5 covers projector *liveness*, which is a different failure from plan
*identity*. *Recommendation:* three story keys, or one explicit deferral per item in the tracker.

**F4-5 — LOW: four UX open items have no owner, and three say why.** Accessibility scoping
(`EXPERIENCE.md` Open Item 2), session revocation mid-edit (Open Item 4), amber-as-an-undesigned-hue
(`DESIGN.md` Open Item 4), and the dead `chart-*`/`sidebar-*` tokens (Open Item 5, deliberately
unowned). Each of the first three states that a product or scoping decision must precede a story,
which is a defensible position — but all four are the owner's to answer, and none is in
`sprint-status.yaml`.

### Warnings

- **No accessibility pass has ever been run**, stated plainly by `EXPERIENCE.md`. The sharpest risk
  is the Fabric canvas editor: pointer-first, with no known keyboard equivalent. Unverified and
  load-bearing: focus order on the run sheet edit form, screen-reader labelling throughout.
- **The dark palette's contrast has never been measured on any pair** — and it renders *today* in the
  presenter and slide-grid surfaces, i.e. the two surfaces an operator uses while a service is
  running. Story 17.1 carries the measurement.
- **`muted-foreground` fails WCAG AA on `muted`** — 4.35:1 measured against the running app where
  4.5:1 is required, on the token that carries all secondary text. Story 17.2, `backlog`.
- **A second hue ships with no token:** six warning affordances across five files use Tailwind amber
  at five different shades, none contrast-measured, two of them in the presenter. `DESIGN.md`'s own
  *Avoid* list says the palette has no color to spare for encoding state.
- **The browser tab still reads *Create Next App*** (`src/app/layout.tsx:16-17`, re-confirmed
  2026-07-30). Story 17.3, `backlog`.
- **`docs/architecture.md` is not authority and should not be cited as such.** It sits in
  `project_knowledge`, not `planning_artifacts`, yet the spine lists it as a declared source. It was
  wrong about the transition until today. The authority map in `AGENTS.md` gives structure to the
  spine — this file is descriptive prose that must follow it.

---

## Step 5 — Epic Quality Review

Validated against the `create-epics-and-stories` standards: user value, epic independence, forward
dependencies, story sizing, AC quality, and database-creation timing. Read for this step: all 20
epics in `epics.md`, the full `sprint-status.yaml` key set, Story 17.1 (the only `ready-for-dev`
story), Story 7.4, and `deferred-work.md`'s section index.

### Compliance summary

| Epic group | User value | Independent | Story files | Verdict |
| --- | --- | --- | --- | --- |
| 1–5 (shipped slice) | ❌ technical titles | ❌ FRs completed by Epic 6 | thin / one stub | Historical, honestly annotated |
| 6 (Phase 1 Gap Closure) | ❌ process milestone | ✓ | 8 files | Historical |
| 7–12 (phase residuals) | mixed | ✓ | 6 files, 335–664 B each | Historical, minimal AC |
| 13–15 (retrospective) | ✓ | ✓ | 10 files | Closed by Correct Course |
| 16 (Artifact Model) | ❌ "Refactoring" | ✓ | 1 of 5 | Closed; 4 keys retired, not backfilled |
| **17** (operator surface) | ✓ | ✓ | **1 of 5** | 17.1 is the current standard |
| **18** (member data gated) | ✓ | ✓ | **0 of 1** | Backlog |
| 19 (liturgical rules) | ✓ | — | 0 | `retired`, method superseded by AD-20 |
| **20** (registry authoring) | ✓ | ✓ within epic | **0 of 8** | Carries every breaking change |

### 🔴 Critical Violations

**F5-1 — Story 20.2 cannot be implemented as specified: its prerequisite has no owning story.**
The seven-`base_type`-to-three-kind collapse ships as a **total replacement** folding into *"production
data version 1"* (AD-18 + AD-21). AD-21's version counter **does not exist**, and the spine states
plainly that *"no story owns introducing it."* AD-21 also fixes the `getDb` order — startup DDL → data
migrations → first-boot bootstrap — and spells out the consequence of getting it wrong: the collapse,
whose mapping table is keyed on the seven retired values, would run over freshly seeded `songset-*`
rows and *"either refuse to boot — at 08:40 on a Sabbath — or fall through to a default that rewrites
all four slots to `general`"*, destroying AD-19's one-row-per-slot uniqueness and dropping three songs
from the deck. *Impact:* the single most destructive story in the plan depends on an unassigned
mechanism and an ordering assertion that no test yet enforces. *Recommendation:* give the counter,
the compaction into version 1, and the `getDb` order-assertion test a story key **before** Story 20.1
starts — it is upstream of the whole epic, not a detail of 20.2.

**F5-2 — Story 20.1 is epic-sized and sits on the critical path of all seven stories after it.**
As written it must: add an ordering column to `artifact_templates` (none exists); make the ordered
snapshot the sequence source `buildSlidePlan` consumes; delete the `skipTitle` mechanism at **five**
sites (AD-20); author the three fixed liturgical songs as General entries at **one row per lyric
page**; retire the read-time gap-fill at `registry-snapshot.ts:85-90`; **invert** rather than delete
`tests/registry-reseed.test.mjs`; and resolve whether committed lyric text duplicates
`data/hymns.json` — which touches the open SDAH licence item. *Recommendation:* split into three —
(a) ordering + plan-reads-order, (b) the liturgical seed authoring and `skipTitle` removal, (c)
retiring the resurrection path with its inverted test. Each is independently completable and (c) has
value on its own: it stops a deleted slide re-materialising into the deck on every plan build.

### 🟠 Major Issues

**F5-3 — Exactly one story in the forward plan is implementable today: 1 of 14.**
Epic 17 has 5 stories and 1 file (17.1, `ready-for-dev`). Epic 18 has 1 story and no file. Epic 20
has 8 stories and no files. This is correctly *labelled* — the tracker's own vocabulary defines
`backlog` as *"Story only exists in epic file"* — so it is a state, not a mislabeling. As a readiness
statement it is the central fact of this assessment: the eight stories carrying every breaking change
have no acceptance criteria.

**F5-4 — Unrecorded cross-epic collision: Story 17.4 against Story 20.4.**
17.4 adds a dirty indicator and navigation guard to the canvas editor. 20.4 rewrites canvas authoring
as *General-only* under AD-22, and the same release loosens `READ_ONLY_BASE_TYPES`
(`registry/types.ts`, refusing every administrator edit to a `song-set` or `announcement` row today).
Whichever ships first, the other reworks it. Neither story mentions the other.
*Recommendation:* either sequence 17.4 after 20.4, or scope 17.4 to the editor shell that survives
the rewrite and say so in its AC.

**F5-5 — Story 20.5's actual work is not in the story.**
The story reads *"insert predefined placeholders onto General slides … with weekly worship fields
filling the bindings."* AD-19 requires the catalog to be **one server-side module holding both the
admitted key and its resolver**, because today the planner supplies values as hardcoded literals at
**ten** call sites in `slide-plan.ts`, *"spelled differently from `placeholder-catalog.md`"*, and a
catalog that fixes only the write side *"admits a key nothing can fill, and `hydrate.ts` fails closed
on a required binding — on a Sabbath."* That reconciliation is the bulk of the story and appears
nowhere in it.

**F5-6 — The shipped epics were not independent, and Epic 6 exists because of it.**
Epic 1's Story 1.2 delivered *shared* Basic Auth with full FR-18 landing in Story **6.2**; Epic 3's
FR-4/FR-6 fidelity landed in **6.3/6.4**; Epic 5's FR-3 persistent list landed in **6.1**. Three epics
each depended on a **later** epic to satisfy the FR they claimed. `epics.md` records this honestly —
every "done" is scoped to its own story ACs and each successor is named — which is the right treatment
for shipped history. It is recorded here because this is the pattern that produced Epic 6 ("Phase 1
Gap Closure") and the retrospective route through Epics 13, 14 and 16, not to reopen closed work.

**F5-7 — A 23 KB parking lot holds work no epic tracks.**
`deferred-work.md` carries 12 sections of deferrals from seven specs and four code reviews. Some items
graduated (the nine proxy-only routes became Epic 18). Others sit in prose with no key — element
rotation and layout-background opacity, `updated_at`'s second-granularity, and the literal
`[placeholder]` string in `midweek-prayer` that `EXPERIENCE.md` warns *"will be projected verbatim
until someone supplies real values."* That last one reaches a worship screen.
*Recommendation:* one pass that promotes each open item to a story key or marks it explicitly
declined. A parking lot nobody empties is where a projected placeholder waits.

### 🟡 Minor Concerns

**F5-8 — Epics 1–6 and 16 are technical or process milestones by title and goal.** "System Foundation
& Authentication", "Data Ingestion & Processing", "MVP Completion & Bug Fixes", "Phase 1 Gap Closure",
"Slide Artifact Model Refactoring". `epics.md:268` records that the user-value standard applies **from
Epic 17 forward**, as the C5-1 remediation, and Epics 17–20 comply. The violation is historical and
bounded by a recorded decision rather than left as drift.

**F5-9 — Story 18.1's persona is a PRD-declared non-user.** *"As a church member whose name and prayer
request live in this system…"* — PRD §2.2 lists the congregation as a beneficiary and explicitly
**not** a user. It is arguably the right framing for a privacy story, since it names whose interest is
protected; it is noted because it is the one story in the set whose *"As a…"* cannot review or accept
it.

**F5-10 — Story 20.2's forward reference to 20.8 is declared and handled correctly.** *"…only
meaningful once 20.8 exists, so until then the story's own AC must say what 'afterward' means."* Kept
as the pattern to follow, not a defect.

**F5-11 — AC quality is inconsistent across generations, and the current standard is high.** Story
17.1 carries 7 Given/When/Then criteria with file-and-line evidence, a verified starting-state table,
tasks mapped per AC, an explicit out-of-scope list, and a same-change-set `DESIGN.md` obligation —
including the instruction *not* to re-fix something another run already fixed. Against that, Stories
7.1–7.4 carry a single AC each (335–611 bytes), Story 1.1 is a retrospective stub, and Stories
16.2–16.5 have no file at all — their four `done` keys were retired rather than backfilled with AC
written to match already-shipped code, which was the honest call. Epic 20's eight stories should be
written to the 17.1 standard; otherwise the epic's breaking changes ship on epic-file prose.

### Dependency Analysis

**Within Epic 20:** strict order 20.1 → 20.2 → (20.3, 20.4, 20.5, 20.6, 20.7) → 20.8, and 20.8 is
last by its own statement (*"every story above defines what gets cloned"*). One declared forward
reference (20.2 → 20.8), handled. **Upstream of all of them sits the unassigned AD-21 work (F5-1).**

**Cross-epic:** 20.3 depends on Epic 18's in-route `requireAdminSession` pattern and says so, but
Epic 18 has no scheduled position relative to Epic 20. 17.4 collides with 20.4 and says nothing
(F5-4). Epic 19 was retired into Story 20.1 rather than delivered twice — `epics.md` and
`sprint-status.yaml` both record `retired`, and the one path was chosen instead of leaving *"deliver
inside 20.1 or retire — not both"* open.

**Database/entity creation timing:** compliant. AD-9 puts schema evolution on the startup DDL path
and each story adds the DDL it needs when first needed — 20.1 the ordering column, 20.8 the snapshot's
physical home (deliberately left as that story's design call). There is no "create all tables upfront"
story. AD-21 adds the one hard constraint: DDL → data migrations → bootstrap, asserted by a test that
does not exist yet (F5-1).

### Special Implementation Checks

- **Starter template:** the architecture specifies none, so no Epic-1 template story is required. The
  project was scaffolded with `create-next-app` and the un-customized artifact is still shipping —
  `layout.tsx` exports `title: "Create Next App"` (Story 17.3, `backlog`).
- **Greenfield vs brownfield:** this is brownfield work against shipped code, and the artifacts treat
  it that way. Epics 13–16 were retrospective BMad over already-merged commits; Epic 20 carries an
  explicit migration story (20.2) whose total-replacement licence **expires at first deploy**
  (AD-18) — a correctly dated compatibility boundary rather than an open-ended one.

---

## Summary and Recommendations

### Overall Readiness Status

## ⚠️ NEEDS WORK

Not because the artifacts are thin — they are the most rigorously cross-referenced set this project
has held, and three of the five were reconciled against `src/**` today. **Needs work** because the
one body of work that is actually next (Epic 20, eight stories, every breaking change in the plan)
has no requirement ancestry, no story files, and an unassigned prerequisite sitting upstream of its
first story.

Per delivery track, which is more useful than one label:

| Track | Status | Why |
| --- | --- | --- |
| **Story 17.1** — reachable dark mode | ✅ **READY** | 7 evidence-backed AC, verified starting state, out-of-scope list, same-change-set doc obligation. Implementable today. |
| **Epic 17** — remaining 4 stories | ⚠️ NEEDS WORK | Scope is clear and evidenced in `epics.md`; no story files. 17.4 collides with 20.4 (F5-4). |
| **Epic 18** — in-route authorization | ⚠️ NEEDS WORK | Scope precise (nine named routes), no story file, no scheduled position relative to Epic 20. |
| **Epic 20** — registry authoring | 🔴 **NOT READY** | No FR ancestry (F3-1), a PRD consequence it will falsify (F3-2), an unowned prerequisite (F5-1), an epic-sized first story (F5-2), 0 of 8 story files. |
| **Phase 1 close-out** | ⚠️ NEEDS WORK | The font gate is the last unwaived pre-requisite, and the only font artifact contradicts NFR-7 (F3-6). FR-19 has been Partial since 2026-07-19 (F3-4). |

### Critical Issues Requiring Immediate Action

1. **Epic 20 has no FR ancestry, in a document that declares FR numbers authoritative (F3-1).**
   FR-20 covers editing a template's layout. Epic 20 adds ordering, create/delete, a three-kind
   vocabulary, a Placeholder Catalog, SongSet slots, and a service-bound snapshot with Sync — the last
   of which changes operator-visible behavior. This is the Epic 16 defect repeating; the difference is
   that Epic 20 is still `backlog`, so it can be fixed **before** code rather than retrospectively.

2. **Story 20.2 will falsify a live PRD consequence (F3-2).** FR-20 names `FullScreenImage` as a
   read-only base type; Epic 20 retires it. The `base_type` collapse and the FR-20 rewrite belong in
   one change set.

3. **AD-21's version counter has no owning story, and Story 20.2 cannot ship without it (F5-1).**
   The spine says so in its own words. It also states what the wrong `getDb` ordering does: refuse to
   boot, or rewrite all four SongSet slots to `general` and drop three songs from the deck. The
   ordering is fixed by a decision and asserted by a test that does not exist.

4. **FR-13b is claimed Done and the spine records its agent-path guard as unshipped (F4-1).** The
   coverage map says *Done (`updated_at` / 409)*; AD-6 names four bypass paths including the webhook
   correction — which is the exact scenario FR-13b was written for.

5. **The font gate is open, and the only font artifact contradicts the requirement it serves (F3-6).**
   NFR-7 requires freely-licensed; Story 7.4 documents **Arial**. Two of the five Phase-1 spikes were
   waived by decision; this one is simply unrun, and FR-14's offline-font consequence depends on it.

6. **NFR-3 has no owner, and Story 20.1 removes the mechanism that implements it (F3-3).** Hand-authored
   General lyric pages stop passing the FR-5 splitter. `epics.md`, `EXPERIENCE.md` and `DESIGN.md` all
   record that nobody owns *"is this readable from the pews?"* — which makes it the owner's decision,
   not a documentation gap.

7. **Outside the artifact set but inside the same milestone: the pinned `next@16.2.10` predates a
   security release.** The spine's *Deferred* records 16.2.11 (2026-07-21) patching **nine CVEs, four
   High**, two of which touch AD-8's SSRF containment and AD-5's gate, with earlier minors not
   back-patched. It carries no story key. AD-4 publishes this hub to the open internet through a
   tunnel, so this belongs before first deploy.

### Recommended Next Steps

**Before any Epic 20 code:**

1. Run `bmad-prd` Update — amend §4.10 / add `FR-21` for ordered authoring, create/delete, the
   three-kind vocabulary, the Placeholder Catalog, SongSet slots, and the service snapshot + Sync.
   Rewrite FR-20's `FullScreenImage` consequence in the same pass. *(Closes F3-1, F3-2.)*
2. Open a story for AD-21's version counter, the compaction into production data version 1, and the
   `getDb` order-assertion test. Place it **before** Story 20.1. *(Closes F5-1.)*
3. Split Story 20.1 into three (ordering + plan-reads-order · liturgical seed and `skipTitle` removal ·
   retiring the read-time resurrection with its inverted test), and give NFR-3 an owner inside the
   seed story's AC. *(Closes F5-2, F3-3.)*
4. Run `bmad-create-story` for the eight Epic 20 stories to Story 17.1's standard, adding the
   dependencies the epic text leaves out: Story 20.5's ten hardcoded placeholder call sites (F5-5),
   and 20.4-before-17.4 sequencing (F5-4).

**Independent of Epic 20, can start now:**

5. Ship **Story 17.1** — it is ready and nothing above blocks it.
6. One story for the font decision: pick the freely-licensed face, record embed-vs-install, run the
   clean-machine check, and correct Story 7.4's Arial note. *(Closes F3-6 and the last unwaived
   Phase-1 spike.)*
7. One story for AD-6's four bypass paths, and downgrade FR-13b to Partial in `epics.md` until it
   lands. *(Closes F4-1.)*
8. Decide FR-19: either document `import:kjv` as the accepted permanent delivery path and close it, or
   open a story. It has been Partial through three assessments. *(Closes F3-4.)*
9. Bump `next` / `eslint-config-next` off 16.2.10 before first deploy, with React 19.2.8 riding along.

**Cheap documentation repairs (one pass, no decisions needed):**

10. Retire the three cross-document claims that were resolved after they were written — the spine's
    *"have not been received"* bullet and its `docs/architecture.md` crossfade claim (owner:
    `bmad-architecture`), and `epics.md:374`/`:400`'s Story 20.8 blocker. *(Closes F4-3, F4-4.)*
11. Fix `_bmad/bmm/config.yaml`'s `project_name` — it still names the **frozen** legacy repo.
12. Give ids to FR-20's two unnumbered feature-specific NFRs; fix Story 19.1's stale *(backlog)* label
    in `epics.md`; repair `epics-parallel-delivery-analysis.md:11`'s dangling `inputDocuments` path;
    and soften `SUPERSEDED.md:34`, which overstates its own repair where the spine already corrects it.
13. Empty the `deferred-work.md` parking lot — promote or explicitly decline each open item. The
    `[placeholder]` string in `midweek-prayer` reaches a worship screen. *(Closes F5-7.)*

### Final Note

This assessment identified **29 findings across 5 categories** — 6 PRD completeness defects, 7 epic
coverage defects, 5 UX/architecture alignment issues, 11 epic-quality violations, and 5 document-set
observations from discovery. Six are blocking for Epic 20; one (Story 17.1) is ready to build today.

Two things deserve saying plainly, because a findings list flattens them. First, **FR coverage is
complete and honestly annotated** — 23 of 23 FRs have a named primary epic, the coverage map calls its
own Partials and gaps by name, and no epic claims an FR it does not own. That is rare and it is what
made the real gaps findable. Second, **the failure mode has changed direction.** On 2026-07-29 code had
run ahead of documentation; today documentation has run ahead of code — a canonical SPEC adopted whole,
eight architecture decisions written in the present tense under `[TARGET]`, and one story file to build
from. That is the safer of the two failures, and it is only safe while the requirement ancestry gets
written before the code does.

**Assessor:** `bmad-check-implementation-readiness`, run by kodesh87 on 2026-07-30.
**Documents assessed:** PRD (+ addendum, pressure-test findings) · `ARCHITECTURE-SPINE.md` ·
`EXPERIENCE.md` · `DESIGN.md` · `epics.md` · `sprint-status.yaml` · 40 story files · 4 SPEC kernels ·
`project-context.md`, with targeted verification against `src/**`, `data/` and `package.json`.
