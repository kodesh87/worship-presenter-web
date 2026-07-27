---
title: 'Post-merge: realign tracking docs + Phase 1 backlog'
type: 'chore'
created: '2026-07-18'
status: 'done'
baseline_revision: '47a9442'
final_revision: '815da06'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/planning-artifacts/prds/prd-bic-pptx-workflow-2026-07-10/prd.md'
warnings:
  - multiple-goals
  - oversized
---

<intent-contract>

## Intent

**Problem:** After merging Jules + Phase 1 finish to `main`, sprint/epics/architecture docs are out of sync with the PRD and with code. Operators cannot see what is truly done vs backlog.

**Approach:** Realign tracking artifacts to PRD FR IDs, mark shipped epic stories honestly, document remaining Phase 1 gaps as backlog stories, refresh architecture/UX stubs and deferred-work. Do not implement product features (FR-3/18/picoclaw) in this pass.

## Boundaries & Constraints

**Always:**
- PRD (`prd.md`) is source of truth for FR numbers and phase assignment.
- Distinguish “story AC done” from “Phase 1 FR complete.”
- Keep KJV / FR-19 as Phase 6 backlog only.
- Produce English documents (project `document_output_language`).

**Block If:**
- None (pure documentation/tracking; no product behavior change).

**Never:**
- Change runtime application code (`src/**`) in this pass.
- Import KJV into the app.
- Mark FR-3 or FR-18 as done.
- Invent new PRD phases.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| FR map | Current wrong epics inventory | epics.md FR list matches PRD Phase labels | N/A |
| Sprint | epic-3/5 in-progress with all stories done | epic-3/5 → done; backlog keys for new stories | N/A |
| Stale defer | deferred-work says FR-4 not implemented | Note updated: skeleton landed; fidelity gaps remain | N/A |

</intent-contract>

## Code Map

- `_bmad-output/planning-artifacts/epics.md` -- FR inventory + coverage + backlog stories
- `_bmad-output/implementation-artifacts/sprint-status.yaml` -- epic/story statuses + backlog
- `_bmad-output/implementation-artifacts/deferred-work.md` -- stale FR-4 note
- `_bmad-output/planning-artifacts/architecture/.../ARCHITECTURE-SPINE.md` -- structure vs `src/`
- `_bmad-output/planning-artifacts/ux-designs/.../DESIGN.md` -- minimal as-built note
- `_bmad-output/implementation-artifacts/phase1-remaining-backlog.md` -- human-readable gap board
- Story stubs under `_bmad-output/implementation-artifacts/stories/` for new backlog items

## Tasks & Acceptance

**Execution:**
- [x] `_bmad-output/planning-artifacts/epics.md` -- rewrite FR inventory + coverage map to PRD IDs; list Epic 1–5 as shipped stories; add Epic 6 (Phase 1 gaps) backlog stories -- rationale: stop wrong FR routing
- [x] `_bmad-output/implementation-artifacts/sprint-status.yaml` -- set epic-3/5 done; add backlog story keys `ready-for-dev` for Phase 1 gaps -- rationale: honest sprint board
- [x] `_bmad-output/implementation-artifacts/stories/6-1-persistent-announcement-list.md` through key gap stories -- create stub story files Status ready-for-dev -- rationale: next CS/DS can pick them up
- [x] `_bmad-output/implementation-artifacts/deferred-work.md` -- correct FR-4 skeleton note -- rationale: stop stale debt
- [x] `_bmad-output/planning-artifacts/architecture/.../ARCHITECTURE-SPINE.md` -- update Structural Seed to `src/` monolith; note PPTX-first Phase 1 + Basic Auth v1 -- rationale: match code
- [x] `_bmad-output/planning-artifacts/ux-designs/.../DESIGN.md` -- short as-built UX note pointing at Shadcn hub -- rationale: end empty draft
- [x] `_bmad-output/implementation-artifacts/phase1-remaining-backlog.md` -- summary board of remaining work -- rationale: single operator-facing checklist

**Acceptance Criteria:**
- Given PRD FR-8 means list Services, when reading epics.md inventory, then FR-8 is not labeled dual-screen presenter.
- Given all epic-5 stories are done, when reading sprint-status, then `epic-5: done`.
- Given FR-3 is incomplete, when reading sprint-status, then a backlog story for Announcement List exists as `ready-for-dev` (not done).
- Given architecture spine, when reading Structural Seed, then it references `src/app` / `src/lib` / `data/` not the obsolete `agent/api/web` tree alone.
- Given this pass completes, when inspecting `src/`, then no application source files changed.

## Spec Change Log

## Review Triage Log

### 2026-07-18 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 7: (high 0, medium 5, low 2)
- defer: 0
- reject: 3
- addressed_findings:
  - `[medium]` `[patch]` epic-6 status → backlog (not falsely in-progress)
  - `[medium]` `[patch]` FR-8 marked Partial (missing list API)
  - `[medium]` `[patch]` Architecture paradigm/mermaid Phase 1 PPTX vs dual-screen
  - `[medium]` `[patch]` Remove invented PRD NFR IDs; fix Story 6.6 wording
  - `[medium]` `[patch]` FR-11 structured edit folded into Story 6.3 AC
  - `[low]` `[patch]` deferred-work cross-links to 6.x stories
  - `[low]` `[patch]` Note missing story 1-1 file + FR-8 API → 6.5

## Auto Run Result

**Status:** done  
**Summary:** Post-merge tracking realign on `main` — PRD-aligned epics, Epic 6 backlog stories 6.1–6.8, sprint/architecture/UX/deferred updates. No `src/` changes.  
**Primary board:** `_bmad-output/implementation-artifacts/phase1-remaining-backlog.md`  
**Next coding step:** `[CS]`/`[DS]` on Story 6.1 (or highest priority from Epic 6).

## Design Notes

Epic numbering: keep Epics 1–5 as historical shipped slices. Add **Epic 6 — Phase 1 Gap Closure** for remaining PRD Phase 1 work so we do not reopen falsely “done” epics.

Backlog story IDs (minimum):
- 6-1 Persistent Announcement List (FR-3)
- 6-2 Per-person Admin/Operator auth (FR-18)
- 6-3 Deck blueprint fidelity (FR-4/FR-6)
- 6-4 Section-aware hymn mapping
- 6-5 picoclaw intake + title readback (FR-1)
- 6-6 Automated tests (parser/middleware/webhook)
- 6-7 Image URL allowlist / SSRF harden
- 6-8 Deploy/SQLite production hardening

## Verification

**Commands:**
- `git diff --name-only` -- expected: no `src/` paths
- Manual: open sprint-status + epics FR-8 line matches PRD meaning
