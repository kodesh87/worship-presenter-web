---
baseline_commit: a66de81e3762b8cd0d33e8b589245fdf4f7a926d
---

# Story 22.1: The Song Book Ships as One of Several, and Says Whose It Is

Status: done — **two acceptance criteria superseded 2026-08-01, see below**

> ## ⚠ AC-1's corpus path and AC-2's column name are superseded
>
> **Superseded 2026-08-01** by **FR-24** (PRD §4.12), hours after this story
> closed, by the second Correct Course of that day:
> `_bmad-output/planning-artifacts/sprint-change-proposal-2026-08-01-locale.md`.
>
> | Asserted by this story | Superseded by FR-24 |
> | --- | --- |
> | `data/song-book/sdah.json` (AC-1) | **`data/en/song-book/sdah.json`** |
> | `book_code` (AC-2, AC-3) | **`song_book_code`** |
>
> The corpus gained a **Data Locale**, and the column this story introduced is
> renamed to match the vocabulary FR-24 fixes: *song-book* is the container term.
> **The `hymns` table itself keeps its name**, and so do `/api/hymns` and the
> `resolvedHymns` / `failedHymnNumbers` webhook fields — *hymn* remains the entry
> term, and that last pair is an external contract an outside Telegram bot
> consumes.
>
> **AC-1, AC-2 and AC-3 are left standing unedited**, deliberately: they are the
> record of what actually shipped on 2026-08-01, and a `done` story's criteria are
> superseded in writing rather than rewritten to match a decision taken after it
> closed.
>
> **What is unaffected:** the `UNIQUE(…, number)` key itself (AC-2's substance —
> only the column *name* moves), the one-time rebuild preserving every row (AC-3),
> the attribution and takedown statement travelling inside the corpus (AC-4), the
> retired `import:hymnal` (AC-5) and the 695-hymn verification (AC-6). **Story
> 22.3 performs both the move and the rename** — not a retroactive edit here.

## Story

As a maintainer,
I want the corpus at `data/song-book/sdah.json`, carrying its own book code and its attribution,
so that the last undocumented corpus stops being unreproducible, unattributed and unable to have a sibling.

## Acceptance Criteria

1. **Given** the corpus, **When** the app loads it, **Then** it reads `data/song-book/sdah.json` and `data/hymns.json` no longer exists.
2. **Given** the `hymns` table, **When** its schema is inspected, **Then** it carries `book_code TEXT NOT NULL DEFAULT 'SDAH'` and is keyed `UNIQUE(book_code, number)` — never by `number` alone, because every song book has a #1.
3. **Given** a database created before this change, **When** the app boots, **Then** the table is rebuilt once, existing rows are recorded as `SDAH`, and **no row is lost** — including rows for numbers the corpus does not contain.
4. **Given** the corpus file, **When** it is read, **Then** it carries `book.attribution` naming the copyright holder and `book.licence` stating the takedown offer, so the statement travels with the corpus and not only with `ATTRIBUTIONS.md`.
5. **Given** `npm run import:hymnal`, **When** the change ships, **Then** it no longer exists in `package.json` — its source `.work/lirik-lagu.json` is gone, so the committed corpus is the source of record. No `package.json` script points at a deleted file.
6. **Given** the corpus, **When** `npm run corpus:verify` runs, **Then** it asserts 695 hymns numbered 1–695 with no gaps.

## Tasks / Subtasks

- [x] Move the corpus to `data/song-book/sdah.json` with a `{ book, counts, hymns }` envelope
- [x] Write `book.attribution` and `book.licence` (owner's 2026-08-01 accepted-risk decision, with the takedown offer)
- [x] Add `loadSongBookCorpus()` to `src/lib/corpus.ts`
- [x] Add `book_code` + `UNIQUE(book_code, number)` to the `hymns` DDL
- [x] Add `migrateHymnsForSongBooks()` — one-time table rebuild for pre-existing databases
- [x] Repoint `upsertHymns` to the new corpus and conflict target
- [x] Retire `scripts/import-hymnal.mjs` and its `package.json` entry; add `corpus:verify`
- [x] Repoint `scripts/setup.mjs` corpus report at both corpora
- [x] Update `ATTRIBUTIONS.md`, `README.md`, `docs/data-models-monolith.md` schema tables

## Dev Notes

- **The licence position is an accepted risk, not a review** — the owner's standing decision of 2026-08-01. Attribution ships, the takedown offer ships, no permission was sought and none is claimed. This closes the spine's `Deferred` bullet at `:363`; clearing the bullet itself belongs to the routed `bmad-architecture` run.
- **Why the column lands with the file move.** The table is touched once. This is the spine's own argument for the Epic 20 `base_type` collapse — cheap only while no production system exists, and none does (confirmed 2026-07-29, unchanged).
- SQLite cannot add or drop a table constraint in place, so the migration is create-copy-drop-rename. No foreign key references `hymns`, which is what makes the drop safe. Verified against a synthetic legacy database: both rows survived, including an orphan #999 the corpus does not contain, and the unique key came out as `UNIQUE(book_code, number)`.
- **Seven read sites still query `hymns` with no book qualifier** (`api/hymns/route.ts` ×4, `services/[id]/page.tsx`, `lyrics.ts` ×2, `parser.ts`). They remain correct while one book exists and become ambiguous the moment a second does. Qualifying them is **Story 22.3's**, gated on Story 20.7 — deliberately not done here.

## Dev Agent Record

### Agent Model Used

Claude Opus 5 (1M context)

### Completion Notes List

- Legacy-schema migration exercised end-to-end on a synthetic old-shape database.
- `npm test` green (398 assertions); `npm run build` green.

### File List

- `data/song-book/sdah.json` (new)
- `data/hymns.json` (deleted)
- `src/lib/corpus.ts` (new)
- `src/lib/db/index.ts`
- `scripts/setup.mjs`
- `scripts/verify-corpora.mjs` (new)
- `scripts/import-hymnal.mjs` (deleted)
- `tests/corpus.test.mjs` (new)
- `ATTRIBUTIONS.md`, `README.md`, `docs/data-models-monolith.md`, `package.json`
