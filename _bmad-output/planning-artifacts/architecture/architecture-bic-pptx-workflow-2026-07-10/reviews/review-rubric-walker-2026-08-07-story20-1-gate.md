# Rubric walker — 2026-08-07, Story 20.1 Gate discharge

**Lens:** the good-spine checklist, against `ARCHITECTURE-SPINE.md` after this run's edits.
**Run:** sequential inline (this host forbids the Agent tool unless the user asks — the seventh
consecutive run with that posture).
**Verdict:** PASS with three findings, none blocking. Two are against this run's own text.

## Checklist walk

| Criterion | Verdict |
| --- | --- |
| Fixes the real divergence points for the level below | Pass — no `AD` added; the four flips narrow what a story may assume, they do not widen it |
| Every Rule enforceable and prevents its stated divergence | Pass, with **R1** on AD-20 |
| Nothing under Deferred lets two units diverge | **FAIL → see the adversarial review; one real hole found in the new AD-17 entry** |
| Named tech verified-current | N/A — this run names no technology it did not inherit |
| Ratifies rather than contradicts the codebase | Pass — this is the whole job of the run; every flip was read off `src/` |
| Covers the driving spec's capabilities | Pass — CAP-1 and CAP-2 rows updated with the two new partial states |
| Every dimension the altitude owns is decided/deferred/open | Pass — no dimension newly silent; the operational envelope is unchanged and still deferred |

## Findings

### R1 — `[ADOPTED, partial]` is now the second-largest tag class, and the census sentence still says "shipped" (MEDIUM, against this run's own text)

`:70` reads *"everything else is shipped, AD-25 in one of its two families."* After this run
"everything else" covers **six** `[ADOPTED, partial]` decisions, two of them created by this run.
A reader who trusts that sentence reads AD-17 and AD-20 as shipped and never reaches either gap —
which is the exact failure the tag table at `:65` exists to prevent (*"the gap is recorded in
Deferred, never left for a reader to discover"*). The sentence was already loose before this run
with five partials; this run makes it looser and therefore owns fixing it.

**Disposition: autofix.** Name the partial count in the census sentence.

### R2 — AD-20's gap cites three of five handlers and calls the rest "the two closing counterparts" (LOW, against this run's own text)

A reader has to grep for two of the five sites the gap is *defined by*. This file's own standard is
to cite, and its recurring failure is a citation that cannot be checked.

**Disposition: autofix** — cite all five, or state the one reason not to.

### R3 — the liturgical-songs entry now ends in a recommendation, not an owner (LOW, accepted)

The rewritten entry says the honest next step is `bmad-correct-course` or an Epic 20 story that gives
NFR-3 an owner. That is weaker than every other closed entry in this file, which names a story key.

**Disposition: accept and keep.** An architecture Update run cannot register a story in `epics.md`
or `sprint-status.yaml` — those are another workflow's artifacts — and inventing a key here would be
the *stronger-than-verified* claim this file has been bitten by six times. Naming it as unowned and
pointing at the skill that can own it is the accurate record. Reported to the owner instead.
