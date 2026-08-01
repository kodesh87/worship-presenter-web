# Reviewer Gate — version / reality-check lens

**Run:** `bmad-architecture` Update, 2026-08-01 (corpus + locale; AD-25, AD-26, AD-27)
**Lens:** *"Verify every committed decision was web-researched or reality-checked rather than asserted from training data: current versions, that each named technology still exists and fits."*
**Verdict:** clean on this run's own additions. No technology was named, no Stack row moved, and every line citation introduced was re-resolved after the edits landed. Two pre-existing items re-confirmed as still open, and one sibling-artifact claim checked before it was written rather than after.

---

## Stack

**No new technology, so nothing to research.** This run adds no dependency and touches no Stack row. The registries, the reconcile and the canonical book identity are all SQLite plus `better-sqlite3`, already pinned and already governed by AD-9. That is worth stating rather than leaving blank: a data-model change is exactly where an ORM or a migration framework normally arrives by the back door, and AD-25 explicitly declines to be a reason for one — *"a table whose entire content is derived from a committed file has no values of its own to migrate."*

The four currency items this file already carries (Node 22 maintenance, TypeScript `^5`, better-sqlite3 12, fabric 6, ESLint `^9`) and the pinned `next@16.2.10` security bullet are **untouched and still open**. This run had no reason to move them and did not.

---

## Citations introduced by this run

Every one re-resolved against the working tree **after** the spine edits, not before — this repository has paid for the other order twice.

| Citation | Resolves to | ✓ |
| --- | --- | --- |
| `src/lib/db/index.ts:65-83` | `function upsertHymns(…)` through its closing brace | ✓ |
| `src/lib/db/index.ts:91-139` | `function seedBibleCorpus(…)` through its closing brace | ✓ |
| `src/lib/db/index.ts:99-105` | the `insertBook` prepare, incl. `ON CONFLICT(id) DO UPDATE SET name` | ✓ |
| `src/lib/corpus.ts:91` / `:176` | the declared-code refusal, bible and song book | ✓ |
| `src/lib/corpus.ts:106` | `const id = Number(r.id)` — the file supplies the book id | ✓ |
| `src/lib/corpus.ts:64-79` | `readCorpusFile`, the missing/unparseable throw | ✓ |
| `src/lib/scripture.ts:65` | `const BOOK_ALIASES` | ✓ |
| `scripts/verify-corpora.mjs:133-138` | the `book.attribution` and `book.licence` assertions | ✓ |
| `tests/corpus.test.mjs:77-104` | the licence/provenance and attribution tests | ✓ |
| `src/app/api/admin/settings/route.ts:17,29` | both `requireAdminSession` calls | ✓ |

The last row is **inherited rather than new** — it is repeated from the existing *Deferred* entry at the per-account-tier bullet — and was re-checked precisely because repeating a citation is how a stale one gets a second life.

---

## Claims about the world, checked rather than asserted

- **`Song of Songs`, not `Song of Solomon`.** The defect recorded under AD-27 rests on the shipped corpus naming book 22 `Song of Songs`. Read out of `data/bible/kjv.json` directly. The alias map's three entries for that book target a name the corpus does not hold.
- **The parser's two-word cap.** Not read off the regex — `parseScriptureRef` was imported and probed against ten inputs. `Song of Songs 2:1` and `Song of Solomon 2:1` are rejected; `Song 2:1`, `ps 23:1`, `psalm 23:1` and `Kejadian 1:1` parse; `Kisah Para Rasul 1:8` is rejected. The claim in the spine is the measurement, not an inference from it.
- **Single writer.** `INSERT`/`UPDATE`/`DELETE` against `hymns`, `bible_verses`, `bible_books` grepped across `src/` and `scripts/`: zero outside `src/lib/db/index.ts`. This is the load-bearing premise of AD-25 and it is a measurement with a shelf life — which is why the run also filed a *Deferred* entry saying so and proposing an anchored guard.
- **~258 ms / 31,102 rows** for the first KJV seed: taken from Story 21.1's shipped record, not re-measured here. Attributed rather than presented as this run's own number.

## Sibling-artifact claims — the failure mode this lens exists for

The 2026-08-01 gate-repair run recorded that its worst findings were **claims about sibling artifacts that had since been repaired**. Two candidates in this run were checked *before* being written:

1. **Story 23.2's documentation sweep.** The epic records eight tracked files naming `import:kjv`, `import:hymnal` or `data/hymns.json`. Re-grepped across tracked files excluding `_bmad-output/`: **zero**. The spine therefore says nothing about Story 23.2's status — the temptation was to record the sweep as done, and whether it is done is Epic 23's to state, not this file's.
2. **`docs/architecture.md`**, a declared source of this spine. Checked for stale corpus paths and importer references: clean. No source-input update is owed by this run.

---

## Verdict

No finding. The run's factual surface is small, entirely local to this repository, and measured this session. The one thing a future reader should distrust first is the single-writer premise, and the spine now says so in its own voice.
