---
title: Sprint Change Proposal — Tracker / Requirements Realignment
date: '2026-07-29'
project_name: 'worship-presenter-web'
user_name: 'kodesh87'
trigger: 'implementation-readiness-report-2026-07-29.md — status NEEDS WORK, 38 findings, Recommended Next Step #3'
mode: batch
scope_classification: Moderate
status: applied
approved_by: kodesh87
approved_on: '2026-07-29'
applied_on: '2026-07-29'
supersedes_nothing: true
prior_correct_course:
  - sprint-change-proposal-2026-07-19.md
  - sprint-change-proposal-14-2-ux.md
---

# Sprint Change Proposal — Tracker / Requirements Realignment

## Section 1: Issue Summary

### Problem statement

**The delivery tracker and the epic/requirements inventory no longer describe what shipped.** Sixteen epics are closed, every story key is `done`, and the product is in weekly use — but the artifacts that are supposed to make that state plannable have diverged from it in six specific ways. A reader cannot use `epics.md` + `sprint-status.yaml` to answer "what is true, and what is left."

This is not a code defect. Every item below is an artifact that fell behind delivery.

### How it was discovered

Not from a single story. `bmad-check-implementation-readiness` was run on 2026-07-29 and returned **NEEDS WORK** with 38 findings, 12 of them critical or high. Its Recommended Next Step #3 names this instrument explicitly:

> *"Run `bmad-correct-course`. This is the correct BMad instrument for reconciling a tracker that diverged from delivery, and it is what `AGENTS.md` rule 3 prescribes."*

Report: [`implementation-readiness-report-2026-07-29.md`](implementation-readiness-report-2026-07-29.md).

### Issue category

**Process erosion producing artifact drift** — specifically the reverse-direction drift that `AGENTS.md` was hardened against: implementation and SPECs ran ahead of the requirements document and the tracker, rather than behind them.

### Evidence

| # | Finding | Evidence (verified, not inferred) |
|---|---|---|
| E1 | Four stories `done` with no story file | `sprint-status.yaml:126-129` marks `16-2`…`16-5` `done`; only `stories/16-1-artifact-registry-canvas-editor-foundation.md` exists on disk. The same file defines `ready-for-dev` as *"Story file created in stories folder"* — a state these four never passed through. |
| E2 | Epic 14 status contradicts its own stories | `sprint-status.yaml:109` = `epic-14: in-progress`; lines 110-115 = all six stories `done`. Same file: *"done: All stories in epic completed."* `epics.md:107` still reads *"(in-progress — Story 14.6)"*. |
| E3 | FR-11b is in the PRD but absent from the epics | `prd.md:397` assigns **FR-11b** to Phase 1 (*"Web-form create"*). `grep 11b epics.md` → nothing: not in the Requirements Inventory, not in the FR Coverage Map. The capability ships (`src/app/services/new/`). |
| E4 | The FR Coverage Map predates a third of delivery | `epics.md:4` `last_realigned: '2026-07-19'`; every status labelled *"(2026-07-19 audit)"*. Epic 14 ran to 2026-07-20; Epics 15 and 16 closed 2026-07-26. FR-11 is still **Partial** after six Epic-14 stories on that exact surface. |
| E5 | The PRD phase gate was never recorded | `prd.md:377` — *"Phases 2–6 are nice-to-have … built in order only if Phase 1 proves genuinely useful."* SM-3 (`prd.md:438`) makes it measurable: 13 consecutive weeks, leading gate at week 4. All five contingent phases shipped (Epics 8–12). No artifact records the gate as passed, waived, or skipped. |
| E6 | The largest subsystem has no requirement ancestry | Epic 16 (Artifact Registry + canvas editor, `/admin/artifacts`, two SPEC packages, its own architecture spine) traces to **no FR**. `epics.md:12` declares *"PRD FR numbers are authoritative."* Nine capability ids (CAP-1…CAP-9) live only in SPEC files. |
| E7 | NFRs have no stable identifiers | `prd.md:475-482` presents seven cross-cutting NFRs as prose bullets. No story or test can cite one; `epics.md:42` lists only four as "themes" and mis-cites them to §9 (Constraints) instead of §10. Story 6.6 cites `NFR-4`, which resolves to nothing. |

---

## Section 2: Impact Analysis

### Epic Impact

| Epic | Current state | Impact | Change needed |
|---|---|---|---|
| **Epic 14** | `in-progress`, all 6 stories `done` | Tracker unusable as a source of "what's open" | Close it (`done`) |
| **Epic 16** | `done`, 4 of 5 story keys have no file | No acceptance criteria exist for the work that rebuilt how every slide is produced | Retire the four keys; name the SPEC as the contract; give the epic FR ancestry |
| **Epics 1–13, 15** | `done` | No status change | Coverage-map refresh only |
| **Epic 17 (does not exist)** | — | With all 16 epics closed, the tracker has **no forward backlog**. The readiness report's product defects (Rec #6) have nowhere to live. | Out of scope here — routed to `bmad-create-epics-and-stories` |

No epic is removed, deferred, or redefined. No resequencing. **Two open Epic 16 action items outrank every item in this proposal** and are not documentation work (see *Ordering* below).

### Story Impact

| Story | Impact | Change |
|---|---|---|
| `16-2` … `16-5` | Keys exist, files do not | Keys retired from tracking; `spec-16-2-artifact-pipeline-completion.md` (28.4 KB) named as the delivery contract |
| `6-6` | Cites `NFR-4`, an id the PRD never defined; by the new numbering the story's actual subjects are NFR-5 (parsing) and NFR-6 (access control) | Citation corrected in the story file and in `epics.md` |
| `5-2` | No Acceptance Criteria section at all, and cites `FR-10a` which does not exist (PRD has FR-10 and FR-10b) | Citation corrected; a recorded note that it shipped without AC. **No retroactive AC** — see *rejected alternatives* |
| `1-2` | `done`, but instructs a future implementer to create `src/middleware.ts` (deleted), target Next 14+ (project runs 16.2.10), implement shared Basic Auth (superseded by 6.2), and follow an architecture "complex RBAC is deferred" note that no longer exists | Superseded-guidance banner added. `bmad-dev-story` reads prior stories as *Previous Story Intelligence*, so this is live context a future agent will act on — not inert history |
| All others | None | — |

### Artifact Conflicts

| Artifact | Conflict | Owner / instrument |
|---|---|---|
| `prd.md` | `status: draft` while the product is in weekly use; NFRs unnumbered; §6 phase gate unclosed; no FR for the Artifact Registry | Amended here (precedent: Correct Course 2026-07-19) |
| `epics.md` | Missing FR-11b; coverage map 10 days stale; NFR themes incomplete and mis-cited to §9; Epic 14 heading stale; `inputDocuments` omits `EXPERIENCE.md` and the epic-16 spine | Amended here |
| `sprint-status.yaml` | E1, E2; action items need refreshing | Amended here (checklist item 6.4) |
| **Architecture spines** | **No conflict.** Epic-16 structural invariants are already captured in `architecture-epic-16/ARCHITECTURE-SPINE.md` (AD-2…AD-5) and every citation resolves. FR-20 documents the *requirement*; the spine already documents the *structure*. | No change — no `AD-n` added or renumbered |
| **UX spines** | **Real conflicts, deliberately not fixed here** — F4-1 (protagonists contradict the PRD's), F4-3 (UJ-3 has no flow), F4-4 (UJ-5 demoted to a branch), F4-5 (FR-16 blanking, NFR-5 unmapped-input channel, NFR-2 progress state have no UX owner), F4-6 (the congregation-facing deck has no UX document) | `AGENTS.md` authority map assigns these to `bmad-ux` **Update**. Routed, not patched. |

### Technical Impact

**No code changes in this proposal.** Two verification findings surfaced while checking the artifacts, and they replace the readiness report's open questions with facts:

- **FR-11b's date-collision consequence *is* tested** — `tests/services-lib.test.mjs:161`: *"create: date collision returns collision, allowSecond inserts a second row"*. The report listed this as needing verification; it does not.
- **FR-11b's in-form announcement ordering is not asserted.** `tests/services-create.test.mjs` exercises `syncWorshipAnnouncements` with `sort_order` fixtures, but no test asserts that the form preserves operator-chosen order. → one new action item (Low).

---

## Section 3: Recommended Approach

### Path evaluation

| Option | Verdict | Effort | Risk |
|---|---|---|---|
| **1. Direct Adjustment** — reconcile artifacts to delivered state | ✅ **Viable** | Low-Medium | Low |
| **2. Rollback** — revert recent work to simplify | ❌ Not viable | High | High |
| **3. PRD MVP Review** — reduce or redefine MVP | ⚠️ Partially applicable | Low | Low |

**Why not rollback (2):** every item shipped and is in weekly Sabbath use. There is nothing to simplify by reverting — the divergence is in documents, not behavior.

**Why (3) only partially:** the MVP is delivered, so there is no scope to reduce. But the PRD *does* need amendment on a different axis — the phase gate and the missing FR. That is a requirements-document amendment, not an MVP review.

### Selected: Hybrid — Direct Adjustment + PRD amendment

**Scope classification: MODERATE** — tracker/backlog reorganization plus a requirements-document amendment. Not Minor (the PRD is touched, and a new FR is introduced). Not Major (no replan, no scope change, no architecture change, no code change).

### Rationale

1. **The work is real and in production.** The honest correction is to make the documents describe it, which is what Correct Course is for.
2. **Nothing here invents product behavior.** Every change records something already decided or already shipped. The one genuinely new artifact — FR-20 — is written from what the code and SPECs already do.
3. **It restores plannability.** After this, `epics.md` + `sprint-status.yaml` can be read as truth, which is the precondition for the readiness report's Rec #6 (product defects via stories).

### Explicitly rejected alternatives

- **Backfilling AC for 16.2–16.5.** Rejected on the user's decision (2026-07-29) and on merit: AC written to match shipped code is not a verification instrument, which is finding m5-1 in the readiness report. Naming the SPEC as the contract is the truthful record. **Cost accepted:** the tracker loses four `done` rows. `epic-16: done` plus the `epics.md` narrative carry the delivery record instead.
- **Writing retroactive AC for story 5.2.** Same reasoning. The gap is recorded, not papered over.
- **Retitling Epics 1–16 to be user-value-shaped** (finding C5-1, 3 of 16 pass). Rejected: cosmetic rewriting of shipped history, and the FR Coverage Map already carries traceability. The standard applies to *new* epics from here.
- **Patching the UX spines here.** Rejected: `AGENTS.md` assigns `EXPERIENCE.md` / `DESIGN.md` to `bmad-ux`. Editing them from this workflow would repeat the process bypass this proposal exists to correct.

### Timeline impact

None on delivery. All changes are documentation and tracker edits.

### Ordering (this matters more than the proposal)

The readiness report's highest-consequence finding is **not** in this proposal and must not wait for it:

> Epic 16 moved layout ownership into the Artifact Registry. The seeder inserts *missing* template ids only, so the production database still holds the **old rows** for `welcome`, `verse-reading`, `special-song`, `family-youth`, and `bible-verse-contemplation`. The companion action item — inspect a generated deck and the projector before the next service — is also unperformed.

**Reset those five rows and look at the projector before the next Sabbath.** Both items are already open in `sprint-status.yaml`. No document in this proposal substitutes for looking.

---

## Section 4: Detailed Change Proposals

17 edits across 6 files. Grouped by artifact.

### 4.1 — `_bmad-output/implementation-artifacts/sprint-status.yaml`

#### Edit 1 — Close Epic 14 *(fixes E2)*

```
OLD:  epic-14: in-progress
NEW:  epic-14: done
```

**Rationale:** the file's own definition — *"done: All stories in epic completed."* All six stories `14-1`…`14-6` are `done`, and no outstanding work is identified in any artifact.

#### Edit 2 — Retire the four fileless story keys *(fixes E1)*

```
OLD:
  16-1-artifact-registry-canvas-editor-foundation: done
  16-2-build-slide-plan-artifact-hydration: done
  16-3-unified-pptx-web-artifact-rendering: done
  16-4-live-preview-semantic-artifact-badges: done
  16-5-canvas-element-authoring: done

NEW:
  16-1-artifact-registry-canvas-editor-foundation: done
  # Stories 16.2-16.5 shipped without story files, so no acceptance criteria were
  # ever authored. The keys are retired here rather than backfilled with AC written
  # to match already-shipped code. Delivery contract:
  #   ../implementation-artifacts/spec-16-2-artifact-pipeline-completion.md
  # Scope narrative stays in epics.md "Epic 16". Decision:
  #   ../planning-artifacts/sprint-change-proposal-2026-07-29.md
```

**Rationale:** user decision, 2026-07-29. A `done` story key with no file and no AC is a false record of a verifiable delivery unit. `epic-16: done` remains as the delivery record.

#### Edit 3 — Refresh header and action items

`last_updated: 2026-07-26` → `2026-07-29 # Correct Course: Epic 14 closed, 16.2-16.5 keys retired, FR-11b/FR-20 tracked`

Existing action items are **all retained** — including the two unresolved pre-service safety gates, which this proposal escalates rather than closes. New items appended:

| Epic / scope | Action | Owner | Status |
|---|---|---|---|
| 14 | Assert operator-chosen announcement ordering is preserved by the create/edit form (FR-11b). Date-collision override is already covered by `tests/services-lib.test.mjs:161` | Developer | open |
| 16 | *(unchanged, escalated)* Reset the five stale template rows on the production DB, then inspect a generated deck on the projector — **before the next service** | kodesh87 | open |
| — | Route UX findings F4-1, F4-3, F4-4, F4-5, F4-6 through `bmad-ux` Update | kodesh87 | open |
| — | Close or waive the three unrecorded Phase-1 spikes: font on a clean machine, church fidelity sign-off, 5–10 Rundown corpus. Two are the church's call | kodesh87 | open |
| — | Create Epic 17 for the readiness report's product defects (`muted-foreground` contrast, dark-mode decision, `layout.tsx` metadata, canvas dirty-state guard, in-route auth for nine routes) via `bmad-create-epics-and-stories` | kodesh87 | open |
| — | File the GitHub Support purge request for the pre-rewrite PII objects; delete the scratchpad backup bundle once satisfied (F4-2 residual) | kodesh87 | open |

### 4.2 — `_bmad-output/planning-artifacts/epics.md`

#### Edit 4 — Frontmatter *(fixes E4, F4-7)*

- `stepsCompleted` += `step-06-correct-course-2026-07-29`
- `inputDocuments` += `ux-designs/.../EXPERIENCE.md` and `architecture/architecture-epic-16/ARCHITECTURE-SPINE.md`
- `last_realigned: '2026-07-19'` → `'2026-07-29'`
- `note` rewritten to state what this realignment did

**Rationale:** F4-7 — the epics were built with `DESIGN.md` but never with the experience contract, so no epic was informed by IA, states, or flows. Listing it does not retroactively fix that, but it stops the next epic from repeating it.

#### Edit 5 — Requirements Inventory: add FR-11b and FR-20 *(fixes E3, E6)*

Inserted after the FR-11 row:

```
| FR-11b | Create a Service via Web Form (Raw Rundown paste + structured fields; date-collision warning with explicit override; in-form Announcement List) | 1 |
```

Appended after FR-19:

```
| FR-20 | Runtime-editable Artifact Registry + canvas template authoring (Admin) | post-Phase-1 (delivered 2026-07-26) |
```

#### Edit 6 — Replace "Non-functional themes" with numbered NFRs *(fixes E7)*

```
OLD:
### Non-functional themes (from PRD §9 — not separately numbered in PRD)

- Presentation offline reliability
- Generation performance (≤ 5 min)
- Headless-safe rendering
- Robust parsing (no silent failures)
```

Replaced by a seven-row table (NFR-1…NFR-7, matching the PRD §10 numbering introduced by Edit 12) with an epic-representation column. Three NFRs previously had no epic representation at all: **NFR-3 Readability**, **NFR-6 Access control**, **NFR-7 Font licensing**. Two of those are in fact satisfied (NFR-6 via FR-18/Epic 6; NFR-7 partly via story 7-4) and are now recorded as such; NFR-3 remains genuinely unowned and is recorded as such rather than rounded up.

**Also fixed:** the citation `from PRD §9` → `PRD §10`. §9 is Constraints and Guardrails; the NFRs are §10.

#### Edit 7 — Refresh the FR Coverage Map *(fixes E4)*

- Column header `Status (2026-07-19 audit)` → `Status (2026-07-29 correct course)`
- **FR-11: Partial → Done.** Was *"Partial (raw text + images edit; dual-path with Announcement List)"*. Epic 14 spent six stories on exactly that surface; `/services/[id]` now presents the same worship form as create with a working save path (story 14-4), and 14-6 closed the Announcement Flyers UX. New: `Done (Epic 14 create/edit parity + Announcement List in-form)`.
- **FR-11b added** → `Epic 14 (14-1, 14-4)` · `Done (/services/new; collision override tested — services-lib.test.mjs:161)`
- **FR-20 added** → `Epic 16` · `Done (registry + canvas editor; contract in spec-slide-artifact-model/ + spec-16-2)`
- **FR-19 stays Partial.** Verified, not assumed: `data/` contains `hymns.json` but no KJV corpus, so `import:kjv` remains an ops step. Rounding this up would be exactly the dishonesty this map has so far avoided.

#### Edit 8 — Epic 14 heading and note *(fixes E2)*

```
OLD:  ### Epic 14: Worship Web Input Boundary *(in-progress — Story 14.6)*
NEW:  ### Epic 14: Worship Web Input Boundary *(done — closed 2026-07-29 by Correct Course)*
```

Plus a closing line recording that all six stories are `done` and FR-11 / FR-11b are the FRs it realizes.

#### Edit 9 — Epic 16: state the story-file truth *(fixes E1)*

The four `*(delivered)*` markers on Stories 16.2–16.5 become `*(delivered — no story file; contract: spec-16-2-artifact-pipeline-completion.md)*`, and the epic preamble says so plainly.

**The user-story narratives stay.** They describe real scope and are the only human-readable record of what each slice did. What changes is the removal of the implication that a tracked, AC-bearing delivery unit existed.

#### Edit 10 — Story 6.6 NFR citation *(fixes E7 / F3-5)*

```
OLD:  So that NFR-4 and story testing notes are covered.
NEW:  So that NFR-5 (robust parsing) and NFR-6 (access control) are covered.
```

**Rationale:** the PRD never defined `NFR-4` (nothing was numbered). Under the numbering introduced by Edit 12, NFR-4 is *headless-safe rendering* — not what story 6.6 does. Story 6.6 tests auth, webhook, and parser: NFR-6 and NFR-5.

### 4.3 — `.../prds/prd-bic-pptx-workflow-2026-07-10/prd.md`

#### Edit 11 — Frontmatter

```
OLD:  status: draft        NEW:  status: active
      updated: 2026-07-19        updated: 2026-07-29
```

**`active`, not `final`** — the document is authoritative and in force, but it is still amended (twice by Correct Course now). `final` would claim a stability it does not have.

#### Edit 12 — §10: number the NFRs *(fixes E7)*

Each of the six §10 bullets gains a stable id, in the order they already appear, and a seventh is added:

| id | Requirement | Source |
|---|---|---|
| NFR-1 | Offline reliability (load-bearing) | §10 bullet 1 |
| NFR-2 | Generation performance (≤ 5 min) | §10 bullet 2 |
| NFR-3 | Readability | §10 bullet 3 |
| NFR-4 | Headless-safe rendering | §10 bullet 4 |
| NFR-5 | Robust parsing / fail visibly | §10 bullet 5 |
| NFR-6 | Access control | §10 bullet 6 |
| **NFR-7** | **Font licensing and availability** — **new to §10**, consolidating the requirement that today lives split across §4.2 and §11 | §4.2, §11 |

No wording is changed. Ids are added, and NFR-7 is lifted into §10 so all seven are citable from one place.

#### Edit 13 — §6: record the phase-gate decision *(fixes E5)*

A new subsection is added after the Phase 6 list:

> **### Phase-gate decision (recorded 2026-07-29)**
>
> §6 makes Phases 2–6 contingent on Phase 1 proving itself, and SM-3 makes that measurable (~13 consecutive weeks, leading gate at ~week 4). Phases 2–6 were nonetheless all built and shipped (Epics 8–12) without that gate being evaluated or recorded.
>
> **Decision (owner, 2026-07-29): the SM-3 gate is waived retroactively for Phases 2–6.** Rationale as given: shipping with the full feature set is preferred to holding contingent phases behind a 13-week observation window on a solo-maintainer project where the need was already evident.
>
> **What this does not waive:** SM-3 remains a live *product* metric — sustained weekly use is still the measure of whether this system works, and SM-C1/C2/C3 still apply. The waiver covers only the build-order gate. Any *future* phase or major capability records its own go/no-go decision here, at the time it is taken, rather than after.

**Rationale:** the finding was never "the wrong choice was made" — it was that no artifact records which choice was made. This closes that, in the owner's words, with the boundary stated so the waiver does not silently generalize.

#### Edit 14 — New §4.10 and FR-20 *(fixes E6)*

A new feature section is added after §4.9:

> **### 4.10 Artifact Registry & Template Authoring** *(delivered 2026-07-26; retrospectively specified)*
>
> **FR-20: Author slide layouts at runtime through an Artifact Registry**
>
> Slide layout is owned by a registry of Artifact templates rather than by code. An Administrator can edit a template's positioned elements in a constrained canvas editor, and the change applies to every downstream surface without a deploy.

**Consequences (testable), written from what shipped — not aspirational:**

1. Layouts live in a SQLite-backed registry seeded from validated JSON; editing a template changes both PPTX and Web Slideshow output with no code deploy.
2. `buildSlidePlan` emits `ArtifactInstance[]` with placeholders resolved from the Weekly Data Payload; PPTX and Web Slideshow render from the same positioned elements — no per-surface layout branch.
3. An Administrator can edit an existing template on a constrained canvas, and can add or delete their own text boxes and shapes.
4. Seeded element ids and any element marked `required` are immutable: the save API rejects removal or rename with 400, and read-only base types (`FullScreenImage`, `SongSet`, `Announcement`) expose no add/delete affordance.
5. A template can be restored to its seeded definition.
6. **Boundary — this is not per-church configurability** (§5 non-goal): the registry is one global template set for BIC's single deck, editable by an Admin. It changes *who owns layout*, not *how many workflows are supported*.
7. **FR-4, FR-5, FR-6 obligations are unchanged.** NFR-3 readability remains the binding constraint on lyric slides; the registry moves where layout is defined, not whether it must be readable.

**Also:** §6 records FR-20 as delivered outside the original phase plan, alongside the phase-gate decision, and §12 gains no new assumption (nothing here is inferred).

**Rationale:** `epics.md` declares *"PRD FR numbers are authoritative."* A subsystem that changes how every slide is produced, governed by two SPEC packages and its own architecture spine, cannot have no requirement in that document. The alternative the readiness report offered — record a decision that the registry is architecture-governed rather than PRD-governed — was rejected because it would leave the product's most invasive capability outside the artifact the epics call authoritative.

### 4.4 — Story files

#### Edit 15 — `stories/6-6-automated-tests-parser-auth-webhook.md`

`NFR-4` → `NFR-5 (robust parsing) and NFR-6 (access control)`, matching Edit 10 and the new numbering.

#### Edit 16 — `stories/5-2-delete-service.md` *(finding C5-4)*

- `FR-10a` → `FR-10` (the PRD defines FR-10 and FR-10b; FR-10a never existed).
- A recorded note that this story shipped with **no Acceptance Criteria section**, that this is a known gap, and that the FR-10 consequences in the PRD are the verification reference in the absence of story AC.

**No retroactive AC.** Writing criteria now, against code that shipped weeks ago, would produce a verification instrument that cannot fail — the m5-1 weakness. The honest record is that the gap exists, on the operation that deletes members' photos and prayer requests.

#### Edit 17 — `stories/1-2-basic-authentication-and-roles.md` *(finding M5-2)*

A superseded-guidance banner at the top of the technical notes, stating that four instructions in this `done` story no longer hold:

| Story says | Current truth |
|---|---|
| create `src/middleware.ts` | deleted — the gate is `src/proxy.ts` (Next 16; the rename is load-bearing) |
| target Next.js App Router v14+ | project runs 16.2.10 |
| shared password / Basic Auth | superseded by per-person accounts, story 6.2 |
| architecture "complex RBAC is deferred" | RBAC shipped; that text no longer exists in the spine |

**Rationale — this is the one story edit that prevents future drift rather than recording past drift.** `bmad-dev-story` reads prior stories as *Previous Story Intelligence*. Left alone, a `done` story actively instructs the next agent to build a file that Next 16 no longer honors.

---

## Section 5: Implementation Handoff

### Scope classification: MODERATE

Tracker reorganization plus a requirements-document amendment. No code, no architecture change, no product-scope change.

### Routing

| Recipient | Deliverable | Items |
|---|---|---|
| **Developer (this session)** | Apply all 17 edits | §4.1 – §4.4 |
| **kodesh87 (owner)** | Operational, cannot be delegated to an artifact | Reset the five production template rows + inspect the projector **before the next service**; GitHub Support PII purge; close or waive the three Phase-1 spikes (two are the church's call) |
| **`bmad-ux` Update** | UX spine reconciliation | F4-1 protagonists (PRD names are authoritative), F4-3 UJ-3 flow, F4-4 UJ-5 promotion, F4-5 FR-16 blanking + NFR-5 unmapped-input channel + NFR-2 progress state, F4-6 who owns the congregation-facing deck |
| **`bmad-create-epics-and-stories`** | Epic 17 | The readiness report's product defects (Rec #6) — contrast, dark mode, `metadata`, canvas dirty-state guard, in-route auth for nine routes |
| **Developer (later, via stories)** | Test debt | Announcement-ordering assertion; the four open Epic 16 test/tooling action items |

### Success criteria

This proposal has succeeded when all five hold:

1. `sprint-status.yaml` contains no `done` key without either a story file or a named SPEC contract.
2. Every FR in `prd.md` appears in the `epics.md` Requirements Inventory and FR Coverage Map, and every FR-numbered capability in the code traces to an FR.
3. Every NFR has a stable id, and every id cited by a story resolves.
4. `epics.md` `last_realigned` matches the newest delivered epic.
5. The PRD's phase-gate decision is recorded as a decision, not inferable from silence.

### Deliberately still open after this proposal

Named so they are not mistaken for closed:

- **NFR-3 Readability has no epic and no UX owner.** Nobody owns *"is this readable from the pews?"* — a cross-cutting PRD requirement (F4-6). Recorded, not solved.
- **Four epics forward-depend on later epics** (C5-2). Structural in shipped history; the FR Coverage Map is the compensating control.
- **Three of sixteen epics are user-value-shaped** (C5-1). The standard applies to new epics from here.
- **Two pressure-test watch-list items came true and remain unaddressed** — L4 (hand-rolled auth surface → nine routes with no in-route authorization) and L1 (regeneration overwrites last-good with no versioning/undo).

---

## Application Record

**Approved in full by kodesh87 on 2026-07-29; all 17 edits applied the same day.**

| Verification | Result |
|---|---|
| `tests/public-repo-guard.test.mjs` | ✅ 4/4 pass — no congregation directory, no deck, images only under `public/`, no private literal or real name |
| `sprint-status.yaml` parses as YAML | ✅ `epic-14: done`; only `16-1` remains under `16-*`; 15 action items, 11 open |
| `epics.md` | ✅ FR-11b ×4, FR-20 ×4, NFR-1…NFR-7 present; no stale `in-progress`; no unresolvable NFR citation |
| `prd.md` | ✅ `status: active`, `updated: 2026-07-29`, §4.10 + FR-20 at line 362, phase-gate decision at line 444, NFR-1…NFR-7 in §10 |

**Three deviations from the proposal as written, all corrections rather than changes of intent:**

1. **Edit 15 was an upgrade, not a fix.** The `NFR-4` misattribution existed only in `epics.md`; the story `6-6` file already read *"robust-parsing expectations"* with no id. The story now cites NFR-5 and NFR-6 explicitly.
2. **Edit 15 gained a second part.** Story `6-6`'s title and AC-2 say *middleware*, which Next 16 replaced with `src/proxy.ts`. That is the same hazard class as Edit 17 — a `done` story feeding a stale filename to a future agent through *Previous Story Intelligence* — so a superseded-terminology note was added on the same rationale the approved Edit 17 rests on.
3. **A citation in Edit 16 was corrected during application.** FR-10 is specified in PRD **§4.3** (Web Hub & Service Library), not §4.4; story `5-2` cites §4.3.

**Not committed.** All changes are in the working tree. `AGENTS.md` requires the guard to be green before any commit or push — it is — but committing was not requested.

---

**Prepared:** 2026-07-29 · `bmad-correct-course` · Batch mode
**Trigger:** `implementation-readiness-report-2026-07-29.md` (NEEDS WORK, 38 findings)
**Owner decisions incorporated:** story 16.2–16.5 keys retired in favor of the SPEC contract; SM-3 phase gate waived retroactively in favor of shipping the full feature set
