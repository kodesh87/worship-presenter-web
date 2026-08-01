# Reviewer Gate — data-integrity lens *(ad-hoc)*

**Run:** `bmad-architecture` Update, 2026-08-01 (corpus + locale; AD-25, AD-26, AD-27)
**Why this lens.** The gate reference offers a data-integrity lens *"for a heavy data model"*. This run adds two registries, a per-translation names table, a canonical identity, three renames and a channel that **deletes rows**. It earns one.
**Verdict:** two findings, both fixed. One clearance recorded as verified rather than assumed, because the whole delete-and-reinsert option depends on it.

---

## F5 — HIGH. AD-25's `Binds` was enumerated against a schema that is about to change

**Finding.** The draft bound AD-25 to *"`hymns`, `bible_books`, `bible_verses`"* — the tables that exist today. AD-26 and AD-27 add two registries and a per-translation names table in the same change set, and a rule enumerated as a list would not obviously reach them. The names table is the sharp case: it carries a translation code, so removing a translation must remove its names, and a `Binds` list written before that table existed is exactly how it would be missed.

This is the list-versus-criterion pattern this spine already promoted to its own altitude, arriving in a new decision on the day it was written.

**Disposition — fixed.** `Binds` is restated as a **property**: every table whose content is derived from a committed corpus file, including ones added later. `bible_books` is named as the single exception, with AD-27 giving the reason (application-fixed, not corpus-derived).

---

## F6 — MEDIUM. The canonical book list sits between two channels and the draft named neither

**Finding.** AD-27 says the canonical identity is *"fixed by the application"*. AD-25 says everything a corpus supplies is a projection reconciled from a file. A builder halfway through AD-25 reaches for the same mechanism for the canon — it comes from a corpus file today (`src/lib/corpus.ts:106`, the file supplies `r.id`) — and then uninstalling a translation reconciles the canon away and orphans every remaining translation's verses.

**Disposition — fixed.** AD-27 states it explicitly: the canonical list is **not** a corpus, does not travel through AD-25's channel, arrives by the route AD-9 already governs, and changing it once verses reference it is a code change plus an AD-18/AD-21 migration.

---

## Clearance — surrogate ids are not referenced, so rebuild is on the table

AD-25 leaves the reconcile mechanism to the story, and *delete-and-reinsert* is the obvious implementation. It is only safe if nothing holds a corpus row's surrogate id.

Checked: `hymns.id` and `bible_verses.id` are referenced **nowhere** in `src/` or `tests/`. A service persists a hymn **number** (`song1Number..song4Number`) and a passage a **reference** string, never a row id. `hymns` is keyed for lookup by `(book_code, number)` and verses by `(book_id, chapter, verse, translation)`.

Recorded in AD-25 in the spine's own voice, with the pointer that if it ever stops being true, that sentence is the one to return to. An unstated clearance is indistinguishable from an unexamined risk.

---

## Integrity properties now stated somewhere

| Property | Where |
| --- | --- |
| A content row's corpus always has a registry row | AD-25 — one transaction per corpus |
| A corpus's rows never outlive its file | AD-25 — complete reconcile |
| A reconcile never touches a sibling corpus | AD-25 — bounded by corpus code |
| No file, no deletion | AD-25 — missing/unparseable ≠ empty |
| One code, one corpus | AD-26 — boot refuses on a duplicate |
| A setting naming a removed corpus does not lose the choice | AD-26 — inert, not rewritten |
| A verse's book identity survives every translation change | AD-27 — canonical, application-fixed |
| Book names die with their translation | AD-25's restated `Binds` + AD-27 |

---

## Left open, deliberately

Physical shape — whether the names are their own table or a payload column, whether the canon is a seeded table or a module constant, whether the corpus code is a real foreign key. Left to Stories 21.2 / 21.4 / 22.3 on the precedent this file already set for AD-19's slot identity, and recorded in *Deferred* so the omission reads as a decision.

One residue worth flagging to whoever writes the reconcile: the boot cost. 31,102 rows in ~258 ms for one translation is fine; several translations reconciled unconditionally on every start is not, and AD-1 makes boot latency a Sabbath-morning property rather than a developer convenience. AD-25 names this as the thing the detection mechanism is chosen for.
