---
baseline_commit: a66de81e3762b8cd0d33e8b589245fdf4f7a926d
---

# Story 21.1: The Verse Database Ships With the Repository

Status: done — **one acceptance criterion superseded 2026-08-01, see below**

> ## ⚠ AC-1's corpus path is superseded
>
> **Superseded 2026-08-01** by **FR-24** (PRD §4.12), hours after this story
> closed, by the second Correct Course of that day:
> `_bmad-output/planning-artifacts/sprint-change-proposal-2026-08-01-locale.md`.
>
> | Asserted by this story | Superseded by FR-24 |
> | --- | --- |
> | `data/bible/kjv.json` | **`data/en/bible-translation/kjv.json`** |
>
> The corpus gained a **Data Locale** and `bible-translation` became the standard
> term in place of `bible`. **AC-1 and the file list below are left standing
> unedited**, deliberately: they are the record of what actually shipped on
> 2026-08-01, and a `done` story's criteria are superseded in writing rather than
> rewritten to match a decision taken after it closed. Re-reading this story to
> understand the *current* state is the mistake this box exists to prevent.
>
> **Everything else this story asserts is unaffected** — AC-2 (66 books / 1,189
> chapters / 31,102 verses, counted not sampled), AC-3 (seed-from-zero, so AD-21
> does not reach it), AC-4 (licence and provenance), AC-5 (export deleted only
> after AC-2 was green) and AC-6 (byte-for-byte round-trip) all still hold at the
> new path. **Only the path changes**, and **Story 21.2 performs the move** — not
> a retroactive edit here.

## Story

As an operator who has just cloned this repository,
I want scripture lookup to work without being handed a file,
so that FR-19 is a feature of the product rather than of one maintainer's disk.

## Acceptance Criteria

1. **Given** a clone of this repository with no file handed to it and no network access, **When** the app boots for the first time, **Then** `bible_books` and `bible_verses` are filled from `data/bible/kjv.json` and `GET /api/scripture?ref=John+3:16` returns the passage.
2. **Given** the committed corpus, **When** it is counted rather than sampled, **Then** it holds exactly **66 books, 1,189 chapters and 31,102 verses**, and every chapter is dense from verse 1 with no gaps.
3. **Given** a database whose `bible_verses` already holds rows for a translation, **When** the app boots, **Then** those rows are **not** overwritten — the seed fills from zero only, so no persisted value changes at boot and AD-21 does not reach this path.
4. **Given** the corpus file, **When** it is read, **Then** it states its own licence — including the UK Crown copyright exception, stated rather than glossed — and its provenance.
5. **Given** the source export `.work/tp_bible_*.json`, **When** AC-2 is green **and not before**, **Then** the export is deleted, and no document instructs a reader to run `npm run import:kjv`.
6. **Given** the conversion, **When** each source verse is compared against the committed file, **Then** all 31,102 round-trip byte-for-byte after `@N` italic markers are stripped.

## Tasks / Subtasks

- [x] Convert the export to a normalised `data/bible/kjv.json` (nested `books[].chapters[][]`, dense positional encoding — verified safe: zero gaps, zero duplicates, all chapters start at verse 1)
- [x] Record licence + provenance inside the file's `translation` block
- [x] Add `src/lib/corpus.ts` — `loadBibleCorpus()` with structural validation on load
- [x] Add `seedBibleCorpus()` to `src/lib/db/index.ts`, seeding **from zero only**
- [x] Add `scripts/verify-corpora.mjs` (`npm run corpus:verify`) with counts held independently of the file
- [x] Add `tests/corpus.test.mjs` completeness assertions; register in `npm test`
- [x] Retire `scripts/import-kjv.mjs` and its `package.json` entry
- [x] Update the `/api/scripture` 503 message and `scripture.ts` comments so neither names a retired command
- [x] Full round-trip comparison against the export, then delete `.work/tp_bible_*.json`

## Dev Notes

- **Size.** 4.36 MB, against the ≈4.3 MB the Correct Course measurement predicted and 14.5 MB raw. Seeding 31,102 verses on first boot measured **258 ms**.
- **Encoding.** Chapters and verses are positional arrays, which is only lossless because the export was verified dense first: 1,189 chapters, no gaps, no duplicate verse numbers, every chapter starting at 1, book ids contiguous 1–66. Had any been sparse this shape would have silently renumbered scripture.
- **`@N` markers.** The export encoded translator-supplied words (italic in the KJV) as `@9was@7`. Stripped on conversion, exactly as the retired `stripVerseMarkup` did. 15,612 verses carried them. `corpus:verify` and `tests/corpus.test.mjs` both fail if one reappears.
- **Why the seed is from-zero.** `upsertHymns` overwrites persisted values on every boot; that channel is under architecture review. This path deliberately does not use it, so Epic 21 needed no architecture gate — which is what let it start immediately.
- **Deletion ordering was load-bearing and was honoured.** Assertion green → full 31,102-verse round-trip comparison → delete. The committed file is now the only copy, which is why completeness is asserted structurally on every test run.
- `lookupScripture()` still hard-codes `'KJV'`. That literal is **Story 21.2's**, deliberately not touched here.

## Dev Agent Record

### Agent Model Used

Claude Opus 5 (1M context)

### Completion Notes List

- Fresh-database smoke: 66 books, 31,102 verses, `John 3:16` / `Psalm 23:1` / `1 John 1:9` / `Genesis 1:1-3` all resolve.
- Round-trip comparison against the export: 31,102 verses and 66 book name/shortName pairs, zero mismatches, before deletion.
- `npm test` green; `npm run build` green.

### File List

- `data/bible/kjv.json` (new)
- `src/lib/corpus.ts` (new)
- `src/lib/db/index.ts`
- `src/lib/scripture.ts`
- `src/app/api/scripture/route.ts`
- `scripts/verify-corpora.mjs` (new)
- `scripts/import-kjv.mjs` (deleted)
- `tests/corpus.test.mjs` (new)
- `package.json`
