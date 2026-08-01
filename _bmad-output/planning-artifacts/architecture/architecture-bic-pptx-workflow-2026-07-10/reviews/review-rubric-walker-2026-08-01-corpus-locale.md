# Reviewer Gate — rubric walker

**Run:** `bmad-architecture` Update, 2026-08-01 (corpus + locale; AD-25, AD-26, AD-27)
**Lens:** the good-spine checklist.
**Verdict:** three findings, all fixed. The strongest is R1 — the new decision does, word for word, what an existing decision's unqualified sentence forbids, and the draft relied on a `Binds` list to disambiguate them.

---

## Checklist walk

**Fixes the real divergence points, misses none** — after the adversarial and data-integrity lenses, yes. Those two found six between them; this lens found one more the others could not, because it comes from reading the *existing* decisions rather than attacking the new ones.

### R1 — HIGH. AD-25 does what AD-17's unqualified sentence forbids, and only a `Binds` list said otherwise

AD-17 reads: *"A gap in a database that already holds data travels as a versioned data migration (AD-18, AD-21), never as a re-seed."* No qualifier. AD-25 reconciles a populated table from a committed file on boot — the forbidden thing, exactly.

It is not an actual conflict: AD-17's `Binds` scopes it to the registry, and every clause in it is about rows an administrator owns. But the disambiguation lived only in a `Binds` list, three screens above, while the prohibition is written as a general principle in the voice of a rule. A reader reaching AD-25 first concludes the spine contradicts itself; a reader reaching AD-17 first concludes AD-25 is non-compliant. Both are wrong, and neither can tell without a close read.

**Disposition — fixed.** AD-25 opens with an explicit **Supersedes nothing** line stating the scope, that AD-17 is untouched, and *why the line exists* — it is defending against a specific misreading, not performing diligence. The house style has the precedent (AD-16's *"Supersedes: the 'global across services' clause of AD-14, and nothing else in it"*), and the negative case had never been written down before.

### R2 — MEDIUM. "A committed data file with a locale in its path" is about to describe something that is not a corpus

AD-25 defines a shipped reference corpus and never says what is *not* one. Within weeks, Epic 24 ships FR-25's UI string catalogue — a committed data file, per-locale, sitting next to two corpora that are per-locale committed data files. A builder generalising AD-25 persists the interface strings into a table and reconciles them at boot, which gives the same string two homes and asks a redeploy to behave like a migration.

**Disposition — fixed.** AD-25 states the boundary and the test: a corpus is *lookup data a service resolves against* — a verse by reference, a hymn by number — not a file shape. The string catalogue is read at render and versioned with its code.

### R3 — MEDIUM. AD-26's never-filter rule is called structural and is checked by nothing

*"No key contains a locale, so no read path can need one"* is a genuinely strong argument and the best clause in AD-26 — it makes the product rule fall out of the schema instead of resting on discipline. It is still not a guarantee: nothing stops a picker endpoint being written with `WHERE locale = ?`, and PRD §4.12 says in as many words that it must never be.

**Disposition — fixed as an addition to the guard already filed for AD-25's closure**, rather than as a new bullet — one scan over the corpus read paths answers both, so they are one piece of work.

---

**Every `AD`'s Rule enforceable, and prevents its stated divergence** — with R3 and the AD-25 closure ceiling both now recorded, the two unenforced clauses are named in the spine's own voice instead of reading as guarantees. That is the standard AD-24 set and it is met.

**Nothing under Deferred lets two units diverge** — the deferred schema shapes (names table vs payload column; canon as table vs constant; whether the corpus code is a real FK) are all bounded by an `AD` that fixes the property. The precedent is explicit and cited: AD-19's slot identity, deferred the same way two entries above.

**Named tech verified-current** — no technology named, no Stack row moved. See the version lens.

**Ratifies rather than contradicts the codebase** — AD-25 ratifies `upsertHymns` in part and **explicitly declines to ratify** `seedBibleCorpus`'s early return, saying so in a named gap rather than describing a code path that does not exist. The `[ADOPTED, partial]` tag matches: one family rides the channel, neither half is complete.

**Covers the driving spec's capabilities** — no SPEC drove Epics 21–24; PRD §4.11–§4.12 is the contract, and it now has its own block in the Capability → Architecture Map. FR-25's row deliberately records *no new decision* with the reason, because the map's stated purpose is that a capability with no governing decision looks like a hole.

**No inherited spine** — one spine per project.

**Every dimension decided, deferred, or open** — the operational envelope is untouched by this run and its existing entries stand. Data ownership, which is what this run is about, gained a *Reference data* row in Consistency Conventions so a builder finds it where they look rather than only inside three `AD`s.

---

## Note on the pattern this file tracks

The spine carries a standing instruction: *treat the next list-widening as a signal to encode the criterion instead.* This run had one live instance and took the encoding — AD-25's `Binds` was drafted as three table names and is now stated as a property (*every table whose content is derived from a committed corpus file*), with the one exception named. Recorded because the instruction has more often been cited than satisfied, and because the enumeration was drafted, caught in-gate, and replaced rather than shipped.
