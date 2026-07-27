---
title: 'Audit code↔docs, epic/story truth, BMAD flow hygiene'
type: 'chore'
created: '2026-07-19'
status: 'done'
baseline_revision: 'fc8804ef7c889e6cfab456bc94be2912489c1471'
final_revision: 'fba093be0e4e899b58d08daed168a93282ea1920'
review_loop_iteration: 0
followup_review_recommended: true
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/implementation-artifacts/sprint-status.yaml'
  - '{project-root}/_bmad-output/implementation-artifacts/deferred-work.md'
warnings:
  - multiple-goals
  - oversized
---

<intent-contract>

## Intent

**Problem:** After Jules and rapid Cursor delivery, tracking and planning artifacts disagree with shipped code and with each other — so “all epics done” cannot be trusted, and BMAD flow looks broken even though `_bmad/` installer is intact.

**Approach:** Produce a durable audit report, then repair only documentation/tracking hygiene so FR maps, deferred work, backlog boards, architecture/UX notes, and the missing story `1-1` file tell the truth. Do not ship product features in this run; catalog real code gaps as explicit open items.

## Boundaries & Constraints

**Always:**
- Prefer evidence (paths, sprint keys, story Status) over narrative.
- Keep `_bmad/` and installed skill packages untouched.
- Distinguish three layers in every artifact touched: (1) BMAD installer health, (2) tracking truth, (3) product FR completeness.
- Document product gaps without “fixing” them in `src/` unless a task explicitly says so (none do).

**Block If:**
- A tracked product file must change to satisfy an AC (escalate; this chore is docs/tracking only).
- Working tree gains unrelated dirty tracked changes that would mix into this chore.

**Never:**
- Reinstall or rewrite BMAD core.
- Mark FR/product gaps as done to silence the audit.
- Expand UX into a full redesign; only as-built honesty notes.
- Commit or push.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Audit report | Current `main` @ HEAD | New markdown report with CRITICAL/MAJOR/MINOR + FR bucket table | If a claimed path missing, list as CRITICAL with path |
| Stale backlog board | `phase1-remaining-backlog.md` still “do Epic 6” | Archived/superseded banner pointing at sprint + audit | Do not delete history; supersede |
| FR map honesty | `epics.md` FR-1/3 stale Partial/Open | Map updated to match code evidence + known gaps (#671/#684, empty Part C title, KJV data not committed) | Prefer Partial over Done when gap proven |
| Missing story 1-1 | sprint key done, no file | Historical story stub created Status done | Do not invent false ACs; mark as retrospective stub |
| Deferred list | Items already fixed in code | Closed/superseded; only true leftovers remain | Move fixed items under “Resolved” section |

</intent-contract>

## Code Map

- `_bmad-output/implementation-artifacts/sprint-status.yaml` -- canonical epic/story status board
- `_bmad-output/planning-artifacts/epics.md` -- FR Coverage Map + epic narrative (stale rows)
- `_bmad-output/implementation-artifacts/deferred-work.md` -- stale open items vs fixed code
- `_bmad-output/implementation-artifacts/phase1-remaining-backlog.md` -- superseded operator board
- `_bmad-output/implementation-artifacts/stories/` -- story coverage; missing `1-1-*`
- `_bmad-output/planning-artifacts/architecture/.../ARCHITECTURE-SPINE.md` -- Deferred section outdated
- `_bmad-output/planning-artifacts/ux-designs/.../DESIGN.md` -- Basic Auth era notes
- `_bmad-output/planning-artifacts/ux-designs/.../EXPERIENCE.md` -- empty draft stub
- `_bmad-output/planning-artifacts/prds/.../prd.md` + `addendum.md` -- FR source of truth
- `src/lib/slide-plan.ts` -- Part C Announcements title; Intercessory divider only (no #671/#684)
- `src/lib/images.ts` -- SSRF allowlist (deferred item fixed)
- `tests/*.test.mjs` + `package.json` `test` -- automated tests present
- `.claude/skills/picoclaw-webhook/SKILL.md` -- FR-1 skill exists (story 6.5 note stale)
- `_bmad/` tree -- installer untouched (hash stable vs pre-Jules)

## Tasks & Acceptance

**Execution:**
- [x] `_bmad-output/implementation-artifacts/audit-code-doc-epic-bmad-flow-2026-07-19.md` -- write full audit (layers A/B/C, CRITICAL/MAJOR/MINOR, FR shipped/partial/missing, BMAD flow P0–P2) -- durable record of this run
- [x] `_bmad-output/implementation-artifacts/phase1-remaining-backlog.md` -- add superseded banner at top pointing to sprint-status + this audit; leave historical table intact below -- kill false “do Epic 6 next”
- [x] `_bmad-output/planning-artifacts/epics.md` -- refresh FR Coverage Map + any Epic 6 “still open” narrative to match evidence; keep known Partials honest -- restore epic/PRD honesty
- [x] `_bmad-output/implementation-artifacts/deferred-work.md` -- split Resolved vs Still open; remove false opens (tests/SSRF/WAL/sections already shipped) -- stop ghost debt
- [x] `_bmad-output/implementation-artifacts/stories/1-1-next-js-foundation-and-monorepo-setup.md` -- create historical stub Status done matching sprint key -- close coverage hole
- [x] `_bmad-output/implementation-artifacts/stories/6-5-picoclaw-intake-readback.md` -- fix stale “skill missing” note to point at `.claude/skills/picoclaw-webhook/` -- story truth
- [x] `_bmad-output/planning-artifacts/architecture/.../ARCHITECTURE-SPINE.md` -- update Deferred to current leftovers only (or mark shipped) -- arch honesty
- [x] `_bmad-output/planning-artifacts/ux-designs/.../DESIGN.md` + `EXPERIENCE.md` -- mark as-built / deferred-complete notes for shipped hub/slideshow/presenter; do not invent full UX -- UX honesty without redesign
- [x] `_bmad-output/implementation-artifacts/sprint-status.yaml` -- bump `last_updated` comment that audit hygiene landed; do not flip story statuses without evidence -- tracking meta only

**Acceptance Criteria:**
- Given HEAD on `main`, when the audit file is read, then it states BMAD installer `_bmad/` was not damaged, lists CRITICAL mismatches including missing `1-1` (resolved by stub in this run) and FR-4 standing-hymn gap `#671`/`#684`, and separates tracking drift from product gaps.
- Given `phase1-remaining-backlog.md`, when opened, then the first content block states it is superseded and must not be used as the active backlog.
- Given `epics.md` FR Coverage Map, when compared to code evidence, then no FR row claims Open/Partial for work that is fully shipped without naming the remaining gap; FR-1 is not “picoclaw missing”; FR-3 is not Open.
- Given `deferred-work.md`, when scanned, then items fixed by Epic 6+ (tests, SSRF allowlist, DB harden, section mapping, We Have This Hope lyrics path) appear under Resolved, not as open blockers.
- Given sprint key `1-1-next-js-foundation-and-monorepo-setup`, when listing `stories/`, then a matching story file exists with Status done.
- Given this chore completes, when `git status` is considered, then only intended artifact/doc files changed — no `_bmad/` or product `src/` edits.

## Spec Change Log

## Review Triage Log

### 2026-07-19 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 10: (high 2, medium 6, low 2)
- defer: 0
- reject: 4: (medium 2, low 2)
- addressed_findings:
  - `[high]` `[patch]` Moved extensionless/MIME video URL gap back to Still open (was falsely Resolved)
  - `[high]` `[patch]` Split FR-4/FR-6 Resolved row so Intercessory residual is not implied closed
  - `[medium]` `[patch]` Renamed backlog H1 to ARCHIVE + stronger supersede framing
  - `[medium]` `[patch]` Removed binding GWT ACs from story 1-1 stub (non-binding retrospective notes)
  - `[medium]` `[patch]` Fixed EXPERIENCE.md false “hub search UI” claim
  - `[medium]` `[patch]` Reconciled audit vs spine on `agent/` path; tagged FR-3 on deferred empty-list item
  - `[medium]` `[patch]` Softened ARCHITECTURE picoclaw “calls via skill” wording; Epic 6 narrative lists all Partials
  - `[low]` `[patch]` Aligned audit FR vocabulary to Done/Partial; moved 1-1 CRITICAL under tracking
  - `[low]` `[patch]` Frontmatter audit path clarified for planning-artifacts readers

## Auto Run Result

**Summary:** Docs/tracking hygiene audit for code↔doc match, epic/story truth, and BMAD flow after skipped planning. Installer `_bmad/` intact; tracking drift repaired; product Partials (#671/#684, empty Announcements title, KJV ops) kept visible.

**Files changed:**
- `audit-code-doc-epic-bmad-flow-2026-07-19.md` — durable three-layer audit
- `phase1-remaining-backlog.md` — SUPERSEDED / ARCHIVE
- `epics.md` — honest FR map + narrative
- `deferred-work.md` — Resolved vs Still open (post-review corrections)
- `stories/1-1-…md` — historical tracking stub
- `stories/6-5-…md` — picoclaw skill path
- `ARCHITECTURE-SPINE.md` — Deferred + Structural Seed + picoclaw wording
- `DESIGN.md` / `EXPERIENCE.md` — as-built honesty
- `sprint-status.yaml` — last_updated meta only
- `spec-audit-code-doc-epic-bmad-flow.md` — this run

**Review:** 10 patches applied; 0 deferred; 4 rejected (intentional FR-19 Partial ops bar; live Telegram proof out of scope; sprint timestamp noise; fuller Intercessory understatement already tracked).

**Follow-up review recommendation:** true (multi-file honesty corrections after first review pass).

**Verification:** `_bmad/` hash == `fe759cf`; `1-1` stub exists; SUPERSEDED at backlog top; no `src/` or `_bmad/` edits.

**Residual risks:** Story keys “done” still ≠ zero FR Partials; product gaps need separate feature work; party-mode untracked folder ignored.

## Design Notes

Three-layer model (must survive in the audit report):

1. **Installer** — `_bmad/` + core skills. Evidence: tree hash unchanged vs `fe759cf` for `_bmad/`; `.claude` only gained `picoclaw-webhook`.
2. **Tracking** — sprint/stories/epics/deferred/backlog. Drift is the main “gak karuan” feeling.
3. **Product** — real gaps after “all done”: Intercessory `#671`/`#684` absent; Part C may emit Announcements title when list empty; KJV corpus not in `data/` (import from `.work/`); UX EXPERIENCE stub.

Do not conflate (2) repairs with (3) feature work.

## Verification

**Commands:**
- `git rev-parse HEAD:_bmad` vs `git rev-parse fe759cf:_bmad` -- expected: identical hashes
- `Test-Path _bmad-output/implementation-artifacts/stories/1-1-next-js-foundation-and-monorepo-setup.md` -- expected: True
- `rg -n "SUPERSEDED|superseded" _bmad-output/implementation-artifacts/phase1-remaining-backlog.md` -- expected: match at top
- `rg -n "picoclaw skill missing" _bmad-output/planning-artifacts/epics.md` -- expected: no match (or reframed)
- `git diff --name-only` -- expected: no paths under `_bmad/` or `src/`

**Manual checks:**
- Open audit report: CRITICAL/MAJOR/MINOR sections present; FR table present; BMAD P0–P2 list present.
- Spot-check `deferred-work.md` Resolved section lists tests + SSRF + WAL.
