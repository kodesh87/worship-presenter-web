---
name: 'Epic 16 — Slide Artifact Model (folded in)'
type: architecture-spine
purpose: report
altitude: epic
status: final
created: '2026-07-23'
updated: '2026-07-30'
companions: ['CASE-STUDY.md', '.memlog.md']
---

# Folded into the project spine on 2026-07-30

BMad's default is **one architecture spine per project**, at the altitude above epics; a per-epic
spine is an opt-in for structurally large epics. This project had opted in for Epic 16, and the
owner decided on 2026-07-30 to enforce the default instead. Every decision that lived here now
lives in the project spine:

**`../../architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md`**

**This folder was moved under `architecture/archived/` on 2026-07-30**, so that nothing sits beside
the project spine looking like a peer spine. Its own name is unchanged, so citations written before
the move still name the folder they meant.

Nothing was discarded. This folder remains the run record — `.memlog.md` (append-only, the
authority on what was decided and why, and the decision-of-record for what are now `AD-11`..`AD-19`),
`CASE-STUDY.md`, and `reviews/`.

**This file is not a spine and is not resumable.** It was renamed out of `ARCHITECTURE-SPINE.md` on
2026-07-30 for that reason: `bmad-architecture` scans the architecture output path for that filename
to offer resuming a prior run, and a run resumed from here would amend a document nothing reads.
Amend the project spine instead.

## AD map

The project spine numbered its own decisions from 1, so folding these in required renumbering.
`AGENTS.md`'s standing *never renumber* rule was waived once, by the owner, for this merge only,
and every live citation in the repository was repaired in the same change set.

| Was, in this file | Now, in the project spine | Decision |
| --- | --- | --- |
| `AD-1` / `epic-16 AD-1` | **AD-11** | Artifact Registry Storage |
| `AD-2` / `epic-16 AD-2` | **AD-12** | Slide Plan Data Flow (Fat Payload) |
| `AD-3` / `epic-16 AD-3` | **AD-13** | Canvas State Boundary |
| `AD-4` / `epic-16 AD-4` | **AD-14** | Global Template Administration |
| `AD-5` / `epic-16 AD-5` | **AD-15** | Stable Layout Identity |
| `AD-6` / `epic-16 AD-6` | **AD-16** | Service-Bound Registry Snapshot *(Epic 20)* |
| `AD-7` / `epic-16 AD-7` | **AD-17** | The Seed Is a Bootstrap *(Epic 20)* |
| `AD-8` / `epic-16 AD-8` | **AD-18** | Vocabulary and Value Changes *(Epic 20)* |
| `AD-9` / `epic-16 AD-9` | **AD-19** | Cross-Boundary Binding Keys *(Epic 20)* |

`INIT AD-n`, the citation form this file used for the parent's decisions, is retired: those are
now plain `AD-1`..`AD-10` in the one spine, with their numbers unchanged.

The fold-in also removed a live hazard. While two spines existed, `AD-6` meant optimistic
concurrency in one document and the service snapshot in the other, and `AD-9` meant startup DDL in
one and cross-boundary keys in the other. One file, one meaning per number.

## What was folded in rather than copied

This file also held an *Inherited Invariants* table recording how each parent decision bound the
registry. Those notes were not dropped — each was folded into the rule of the decision it
qualified (for example, the registry's place in `DB_PATH` now sits in AD-4's rule, and the
`/admin/artifacts` matcher note in AD-14's). Two of its rows were **escalations** rather than
bindings — the *State* convention's mislocated freeze, and the AD-9 / AD-18 split of the bootstrap
path. Both were **settled on 2026-07-30** in the project spine: the *State* convention was rewritten
around historical entered data, and AD-9's rule now states the schema/value division with AD-18
positively. Neither is outstanding.
