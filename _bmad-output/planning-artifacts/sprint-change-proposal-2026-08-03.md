---
title: Sprint Change Proposal — Epic 23 Tracks Work That Is Actually Active
date: 2026-08-03
run: Correct Course after `bmad-help` detected contradictory Epic 23 state
trigger: artifact audit; Story 23.2 is marked in-progress without a story file or active implementation
scope_classification: Moderate
status: approved
approval_mode: incremental
approved_by: kodesh87
approved_date: 2026-08-03
---

# Sprint Change Proposal — Epic 23 Tracks Work That Is Actually Active

## 1. Issue Summary

`bmad-help` found that Epic 23 and Story 23.2 are marked `in-progress` in
`sprint-status.yaml`, while the authority artifacts and repository state describe
work that has not started:

- `epics.md` marks Epic 23, Story 23.1, and Story 23.2 as `backlog`.
- No Story 23.1 or Story 23.2 file exists under
  `_bmad-output/implementation-artifacts/stories/`.
- The working tree is clean and recent history contains no Epic 23 implementation.
- `package.json` has no `seed:demo` script, so Story 23.2's end-to-end path cannot run.
- Story 23.2 requires Story 23.1's demo seed.
- Its FR-24 amendment also requires Story 22.3 to move the song-book corpus from
  `data/song-book/` to `data/<locale>/song-book/`. Story 22.3 remains backlog and
  is itself gated on Story 20.7.

Some work attributed to Story 23.2 did ship: `tests/corpus.test.mjs` rejects the
retired import commands, `data/hymns.json`, and `data/bible/` in reader-facing
tracked files. That is partial evidence, not an active delivery state. The final
FR-24 documentation criterion is not yet true because `data/song-book/` is still
the current shipped path.

This is a process-state defect, not a product requirement change and not a failed
implementation.

## 2. Impact Analysis

### Epic impact

Epic 23 remains valid as planned. Neither its goal nor either story needs to be
replaced. Its internal sequence needs to be stated explicitly:

1. Story 20.7 unblocks Story 22.3.
2. Story 22.3 performs the final FR-24 corpus-path move.
3. Story 23.1 supplies the opt-in synthetic demo seed.
4. Story 23.2 verifies the complete fresh-clone path and final documentation rule.

Stories 22.3 and 23.1 are independent once their own prerequisites are met; both
must be complete before Story 23.2 can satisfy its full contract.

No other epic is invalidated, added, removed, or reprioritized.

### Story impact

- **Story 23.1:** remains `backlog`; it is the next Epic 23 story to create.
- **Story 23.2:** returns from `in-progress` to `backlog`. Its partial documentation
  guards remain credited in tracking comments.
- **Story 22.3:** unchanged, but becomes an explicit prerequisite of Story 23.2.
- **Story 20.7:** unchanged; its existing gate on Story 22.3 remains authoritative.

No story file is created by this Correct Course. Story creation remains the job
of `bmad-create-story` after this proposal is applied.

### Artifact conflicts

| Artifact | Finding | Disposition |
| --- | --- | --- |
| PRD | No conflict. Epic 23 adds verification/reachability and owns no FR directly. | No change. |
| `epics.md` | Scope is correct, but the post-FR-24 dependency chain is implicit. | Add one sequencing paragraph. |
| `sprint-status.yaml` | Epic 23 and Story 23.2 claim active work despite absent story files, absent implementation, and open prerequisites. Its top-level `last_updated` entries also disagree about Story 17.2. | Return Epic 23 and Story 23.2 to `backlog`, retain partial-work evidence, and replace stale update metadata. |
| Architecture spine | No invariant, data model, API, storage target, or integration changes. | No change. |
| UX (`DESIGN.md`, `EXPERIENCE.md`) | No surface, flow, token, component, or accessibility change. | No change. |
| Specs and project docs | No product contract changes. Current quickstart accurately describes the shipped path; `seed:demo` is still absent. | No change. |
| Code and tests | No code rollback or new implementation is needed for reconciliation. | No change. |

### Technical and delivery impact

No runtime behavior changes. No routes, schemas, APIs, tests, corpus files, or
deployment artifacts change. The correction prevents `bmad-dev-story` from being
routed to a phantom active story and restores the required Epic → Story → Dev
sequence.

## 3. Recommended Approach

### Selected path: Direct Adjustment

Correct the two planning/tracking artifacts and preserve the work already
delivered as partial evidence.

- **Effort:** Low.
- **Technical risk:** Low.
- **Schedule impact:** None to implementation; the real prerequisite chain becomes
  visible rather than changing.
- **Scope classification:** Moderate under the Correct Course taxonomy because it
  reorganizes backlog state and routes follow-up work to Product Owner / Developer,
  even though the edits themselves are small.

### Alternatives considered

**Rollback — not viable or useful.** The documentation guards are correct and
should remain. Reverting them would create the stale-reader path they prevent.

**PRD/MVP review — not needed.** The product goal, MVP, and committed requirements
remain achievable. The defect is only in tracking state and sequencing.

**Create Story 23.2 retroactively and keep it in progress — rejected.** No one is
implementing it, `seed:demo` does not exist, its final path criterion is blocked
by Story 22.3, and writing acceptance criteria around partial code after the fact
would legitimize the drift instead of correcting it.

## 4. Detailed Change Proposals

All three edits were reviewed and approved individually in Incremental mode.

### 4.1 `epics.md` — make Epic 23 sequencing explicit

**OLD:**

```md
**Owner decision, 2026-08-01: demo data is opt-in.** `npm run seed:demo`
never runs by itself. A seeder that ran automatically would put synthetic
worship data into a real congregation's install — the failure AD-17 exists
to prevent in the registry, arriving through a different door.

#### Story 23.1: A Fresh Clone Can Show a Finished Deck *(backlog)*
```

**NEW:**

```md
**Owner decision, 2026-08-01: demo data is opt-in.** `npm run seed:demo`
never runs by itself. A seeder that ran automatically would put synthetic
worship data into a real congregation's install — the failure AD-17 exists
to prevent in the registry, arriving through a different door.

**Sequencing.** Story 23.1 precedes Story 23.2 because the verification path
requires the demo seed it creates. Story 23.2 also follows Story 22.3 because
its FR-24 documentation criterion cannot become true until the song-book
corpus moves from `data/song-book/` to `data/<locale>/song-book/`. Story 22.3
remains gated on Story 20.7. The already-delivered documentation guards are
credited as partial work; they do not place Story 23.2 in progress without
its remaining prerequisites or a story file.

#### Story 23.1: A Fresh Clone Can Show a Finished Deck *(backlog)*
```

**Rationale:** The locale amendment widened Story 23.2 after its original
sequence was written. This records the resulting transitive dependency and
prevents partial work from being mistaken for active delivery.

### 4.2 `sprint-status.yaml` — reconcile Epic 23 status

**OLD:**

```yaml
  # --- Epic 23: A fresh clone runs ---
  # Neither corpus family owns this; kept separate so scripts/, tests/ and docs/
  # are not under two epics at once. Sequenced after 21.1 and 22.1.
  epic-23: in-progress
  23-1-opt-in-demo-seed: backlog
  # partial 2026-08-01: the documentation criterion is delivered and enforced by
  # tests/corpus.test.mjs — nothing under README.md, ATTRIBUTIONS.md, docs/, src/,
  # scripts/ or package.json names a retired import command or data/hymns.json,
  # asserted as the criterion rather than as the eight-file line list, which is
  # the same rule Story 17.8 enforces. _bmad-output/ is deliberately out of that
  # scope: plans and records describe the gap, they do not instruct a reader.
  # STILL OPEN: the `npm install -> npm run setup -> npm run seed:demo` end-to-end
  # assertion, which needs Story 23.1's demo seed to exist first.
  23-2-fresh-clone-verified: in-progress
```

**NEW:**

```yaml
  # --- Epic 23: A fresh clone runs ---
  # Neither corpus family owns this; kept separate so scripts/, tests/ and docs/
  # are not under two epics at once.
  #
  # Sequence: 23.1 first. Story 23.2 then waits on both 23.1's demo seed and
  # Story 22.3's move from data/song-book/ to data/<locale>/song-book/. Story
  # 22.3 remains gated on Story 20.7.
  epic-23: backlog
  23-1-opt-in-demo-seed: backlog
  # Partial work delivered 2026-08-01: tests/corpus.test.mjs rejects retired
  # import commands, data/hymns.json, and data/bible/ in reader-facing tracked
  # files. The FR-24 data/song-book/ criterion remains open until Story 22.3
  # performs that path move. The fresh-clone end-to-end assertion also remains
  # open until Story 23.1 supplies npm run seed:demo. No Story 23.2 file exists,
  # and no implementation is active.
  23-2-fresh-clone-verified: backlog
```

**Rationale:** Status follows active work, not partial ancestry. The retained
comment preserves exactly what shipped and what remains open.

### 4.3 `sprint-status.yaml` — replace contradictory update metadata

**OLD:**

```yaml
# last_updated: 2026-08-03 (Story 17.2 reviewed and moved to done;
#   scope held to the light muted-foreground token and three measured surfaces)
...
last_updated: 2026-08-03 # Story 17.2 created and ready-for-dev; light muted-foreground only, with background/muted/ambient contrast gates and the unrelated hue sweep explicitly excluded.
```

**NEW:**

```yaml
# last_updated: 2026-08-03 (Correct Course reconciled Epic 23 tracking:
#   Epic 23 and Story 23.2 returned to backlog; partial documentation guards
#   retained; dependencies on Stories 23.1 and 22.3 made explicit)
...
last_updated: 2026-08-03 # Correct Course reconciled Epic 23 tracking; no product scope or implementation changed.
```

**Rationale:** The active metadata must describe the latest change and must not
carry two incompatible Story 17.2 states.

## 5. Implementation Handoff

### Classification and recipients

**Moderate — Product Owner / Developer coordination.**

| Recipient | Responsibility |
| --- | --- |
| Correct Course workflow | Apply the three approved planning/tracking edits after final proposal approval. |
| Product Owner / Developer | Keep Epic 23 in backlog until a story is genuinely activated; preserve the dependency chain. |
| `bmad-create-story` | Create Story 23.1 next, in a fresh context window. Do not create Story 23.2 first. |
| `bmad-dev-story` → `bmad-code-review` | Implement and review Story 23.1 after its story file is validated. |
| Future sequencing | Complete Story 22.3 and Story 23.1 before creating/activating Story 23.2. |

### Success criteria

- `epics.md` states the 23.1 and 22.3 prerequisites for Story 23.2.
- `sprint-status.yaml` marks Epic 23, Story 23.1, and Story 23.2 `backlog`.
- Partial documentation guards remain documented and are not reverted.
- No Story 23.x file, code, test, route, schema, PRD, architecture, or UX change is
  introduced by this reconciliation.
- The next Epic 23 workflow is `bmad-create-story` for Story 23.1 in a fresh
  context window.

## Appendix A — Change Navigation Checklist Record

### 1. Understand the Trigger and Context

- [x] 1.1 — Trigger identified: `bmad-help` artifact audit; Story 23.2 is the
  contradictory tracking entry.
- [x] 1.2 — Problem classified as process-state/artifact drift.
- [x] 1.3 — Evidence collected from epics, sprint status, story-file inventory,
  package scripts, tests, worktree state, and previous Correct Course records.

### 2. Epic Impact Assessment

- [x] 2.1 — Epic 23 remains completable as planned.
- [x] 2.2 — No scope redefinition; sequencing clarification only.
- [x] 2.3 — Remaining epics reviewed; Story 22.3 is the only additional dependency.
- [N/A] 2.4 — No epic is invalidated and no new epic is needed.
- [x] 2.5 — Epic order unchanged; internal story prerequisites made explicit.

### 3. Artifact Conflict and Impact Analysis

- [x] 3.1 — PRD has no conflict and needs no change.
- [x] 3.2 — Architecture has no conflict and needs no change.
- [x] 3.3 — UX has no conflict and needs no change.
- [x] 3.4 — Sprint tracking and Epic 23 sequencing are the only affected artifacts.

### 4. Path Forward Evaluation

- [x] 4.1 — Direct Adjustment viable; low effort, low risk.
- [N/A] 4.2 — Rollback rejected as unnecessary and harmful to correct guards.
- [N/A] 4.3 — PRD/MVP review rejected; product scope is unchanged.
- [x] 4.4 — Direct Adjustment selected.

### 5. Sprint Change Proposal Components

- [x] 5.1 — Issue summary complete.
- [x] 5.2 — Epic and artifact impact documented.
- [x] 5.3 — Recommended approach and alternatives documented.
- [x] 5.4 — MVP unaffected; action plan and sequence documented.
- [x] 5.5 — Product Owner / Developer handoff defined.

### 6. Final Review and Handoff

- [x] 6.1 — Applicable checklist sections addressed.
- [x] 6.2 — Proposal reviewed for internal consistency.
- [x] 6.3 — User approved the complete proposal on 2026-08-03.
- [x] 6.4 — Approved Epic 23 and sprint-status changes applied.
- [x] 6.5 — Handoff confirmed: create Story 23.1 next in a fresh context window.
