# Adversarial two-units — 2026-08-07, Story 20.1 Gate discharge

**Lens (configured `finalize_reviewers`, never cherry-picked):** construct two units one level down
that each obey every `AD` to the letter and still build incompatibly.
**Verdict:** ONE REAL HOLE, in text this run wrote. Applied before close.

## A1 — AD-17's per-row seed origin has TWO sound encodings, and one of them already ships (HIGH)

**The units.** Story 20.3 (the create verb — the story AD-17's new gap is filed against) and any
later story that needs the same answer: Reset exposure, a future re-seed, or Story 20.4's
*"a rejected Save names the property"*.

**Each obeys the spine to the letter.** AD-17 says *"the registry records, per row, whether it
originated from the bootstrap or from an administrator"*, and this run's Deferred entry says the
column's **shape** is the story's schema call, on the stated precedent of AD-19's slot identity and
AD-16's snapshot location. So a builder may pick any shape.

**Where they diverge.** There are two, and this run's text presents the fact as *unbuilt* when one
encoding is already sitting in the schema:

1. An explicit `origin` / `authored_by` column — the reading the phrase "records, per row" invites.
2. **`seed_hash IS NULL`** — already shipped, and **sound today**, which is what makes this
   dangerous rather than merely ambiguous. Verified at this run: `insertArtifactTemplateIfMissing`
   stamps `seed_hash` on every bootstrap row (`store.ts:323`); `resetArtifactTemplate` re-stamps it
   (`:289`); and — the load-bearing half — a **normal administrator save preserves it**, because
   `updateArtifactTemplate`'s non-`markAsSeeded` branch omits `seed_hash` from its `UPDATE` list
   entirely (`store.ts:263-268`). So a bootstrap row keeps a hash through every edit, an authored
   row can never acquire one (it has no seed to Reset from), and `NULL` means exactly
   *administrator-authored*.

**The incompatibility.** If 20.3 ships `seed_hash IS NULL` and a later story adds an `origin`
column — or the reverse — the registry holds **two sources of truth for one fact**, which is
precisely the hazard AD-18's second bullet was written to forbid one level up (*"a value persisted
in more than one place has exactly one authoritative copy"*). Nothing in the spine currently forces
them to be the same fact, because the spine does not acknowledge that encoding 2 exists.

**Second-order finding, and the reason a `NULL` check is not simply the right answer:** the
equivalence holds **only because every pre-counter row is wiped**. `repairPreCounterArtifactRegistry`
deletes rows from a database with no `data_version` (`db/index.ts:300-318`), and the `ALTER TABLE`
that added `seed_hash` (`:484`) leaves it `NULL` on rows that predate it. Without that wipe, `NULL`
would mean *administrator-authored* **or** *predates the column*, and the encoding would be silently
wrong on exactly the oldest rows. So encoding 2 is sound **as a consequence of AD-21's repair**, and
that dependency is invisible where it needs to be read.

**Disposition: autofix.** The Deferred entry must name encoding 2, state that it is sound and why,
state what it depends on, and require **one** answer rather than leaving the shape fully open. The
shape stays the story's call; *how many answers there are* is not.

## A2 — checked and clear: AD-20's two halves cannot be relied on interchangeably

Two units: a story that relies on registry `position` being the deck sequence, and one that assumes
the *song assignment* is likewise registry data. The first is correct today; the second finds five
hardcoded ids in a lookup table. This run's AD-20 gap bullet and its Deferred entry both state the
split explicitly and in the same words, so the two units cannot read it differently. **No hole.**

## A3 — checked and clear: AD-21 `[ADOPTED]` does not license skipping a transition

Two units both adding a value change after this run. AD-21 unchanged in text: both declare `n → n+1`
while coding, both compact before release. `CURRENT_DATA_VERSION = 1` is a constant, not a registry
of transitions, so there is no list to disagree about yet. The asserted step order
(`registry-reseed.test.mjs:304`, `:319`, `:363`, `:386`) pins migrations before bootstrap in both
directions. **No hole** — and no framework arrived, so AD-9 holds.
