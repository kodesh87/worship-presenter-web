# Amendment verification — 2026-08-07, Story 20.1 Gate discharge

**Ad-hoc lens, earned rather than invented:** five consecutive runs on this file have had their
headline gate finding land against the *amending run's own text*. This lens reads only what this run
wrote, against the file and against `src/`.
**Verdict:** THREE findings, all against this run's own text, all applied before close. This is the
**sixth** consecutive run where the worst finding was self-inflicted, and the class has not changed:
a claim stronger than what was verified, reading better than the verified one.

## AV1 — a count where a property belonged, again (HIGH)

The draft AD-11 closure said the gap *"was invisible for the **fourteen days** this rule read
`[ADOPTED, partial]`"*. Measured: the gap was filed 2026-07-30 and closed 2026-08-07 — **eight**
days. The number was wrong, and worse, it was **load-bearing for nothing**: the point of the sentence
is that the prose already said "exclusively" while the read path contradicted it, which is true for
any duration.

**Applied:** the number is gone and the sentence now carries the property — *this rule carried the
word "exclusively" the whole time the read path was contradicting it, and what closed the gap was
naming the read path*. This is verbatim the correction the 2026-08-05 gate applied to that run
("carried a count where it should have carried a property"), which means the instruction did not
transfer and the *lens* is what caught it, not the memory of the lesson.

## AV2 — "this file has twice mistaken the second for the first" (HIGH)

The draft AD-21 closure claimed the file has **twice** confused a decision-with-no-owner with a
decision-with-no-answer. Searched: the memlog and the spine support **one** instance — the 2026-08-01
epic-22 action item that ran for a day expecting AD-25 to introduce the counter. There is no second.

A reader checking this would have found the file contradicting itself in the direction that costs it
credibility. **Applied:** replaced with the distinction itself (*the first needs a story, the second
needs a gate*) plus a pointer to the one recorded instance. Same class as AV1 and found in the same
pass, which is the argument for keeping this lens configured rather than ad-hoc.

## AV3 — an unowned consequence stated as a recommendation, checked and kept (LOW)

The rewritten liturgical-songs entry ends by pointing at `bmad-correct-course` rather than naming a
story key. Verified this is the *correct* weakness rather than a lazy one: an architecture Update run
cannot register a story in `epics.md` or `sprint-status.yaml` — another workflow owns both — and
inventing a key would be exactly AV1/AV2's failure one level up. **Kept, and reported to the owner**
as the run's one open item instead.

## Checked and clean

- **Every tag flip re-derived from `src/`, not from the story's completion notes.** AD-11, AD-17,
  AD-20, AD-21 — each clause opened at its cited range. The four `[TARGET]`s that stayed
  (AD-18, AD-19 for the vocabulary; AD-16, AD-22) were each confirmed *unshipped*: seven
  `base_type` values still in `types.ts:1-10`, no `songset-*` anywhere, no snapshot, no bounded
  surface.
- **No `AD` added, renumbered, retired, or reused.** Ids AD-1..AD-29 contiguous; `AGENTS.md`'s
  never-renumber rule held with no waiver.
- **The census sentence now agrees with the file it summarizes** — its six named partials
  (AD-6, AD-10, AD-17, AD-20, AD-24, AD-25) match a tag grep exactly, and its eight named targets
  likewise. This is the check R1 existed to force, and it passes only after that fix.
- **The story's Gate was over-satisfied rather than followed.** It named four statements; this run
  repaired six, the two extras being AD-11's own gap clause and the liturgical-songs entry. Both
  are the shape the adversarial lens predicts: an `AD` clause and a `Deferred` bullet tracking the
  same code, where the story fixed the one it happened to be reading.
- **`[ADOPTED, partial]` for AD-20 was ratified by the owner, not chosen here**, because the story's
  Gate and `src/` disagreed. Recorded because six runs of precedent say an inline tag decision on
  this file gets sent back.
