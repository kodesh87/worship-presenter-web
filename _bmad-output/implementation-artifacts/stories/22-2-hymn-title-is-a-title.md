---
baseline_commit: a66de81e3762b8cd0d33e8b589245fdf4f7a926d
---

# Story 22.2: A Hymn Title Is a Title

Status: done

## Story

As an operator confirming a hymn number before it enters the run sheet,
I want the readback to show the hymn's actual title,
so that FR-2's only defence against a valid-but-wrong number is checking something a human can recognise.

## Acceptance Criteria

1. **Given** the owner-supplied number→title index for all 695 hymns, **When** the corpus is built, **Then** every hymn carries its title from that index and no title is a first lyric line.
2. **Given** the corpus, **When** titles are measured, **Then** **no title exceeds 45 characters** (40 did before).
3. **Given** SDAH #83, #86, #159 and #522 — four hymns whose titles appear nowhere in their first line — **When** looked up, **Then** they read *O Worship the King*, *How Great Thou Art*, *The Old Rugged Cross* and *My Hope Is Built on Nothing Less*. If these regress, `deriveTitle()` has come back.
4. **Given** an existing database holding the old lyric-line titles, **When** the app boots, **Then** the corrected titles reach `hymns.title`.
5. **Given** the correction, **When** it is applied, **Then** it is applied **in the corpus**, not as 695 hand-patched rows.

## Tasks / Subtasks

- [x] Transcribe the owner-supplied index and validate it before use: 695 entries, contiguous 1–695, no duplicates, no malformed rows
- [x] Join it onto the corpus during the 22.1 file move, so the join happens once in the new file
- [x] Cross-check every title against its own lyrics to detect numbering misalignment
- [x] Assert titles in `tests/corpus.test.mjs` (length ceiling + the four known-hard cases)
- [x] Record the four entries the lyrics contradict as an owner decision rather than silently correcting them

## Dev Notes

- **Why this shipped without the architecture gate, stated so it is not mistaken for a bypass.** The gate asks whether a *shipped reference corpus* may ride a boot-time overwrite. This story **introduced no channel**: `upsertHymns` already overwrote `title` and `lyrics` from the corpus on every boot, so corrected titles propagate through the path that was already there, and nothing was added for them. The forward question — *should* that channel survive, or does AD-21's counter arrive here — is untouched and still open. If the answer is the counter, its migration target is `upsertHymns`, not this data. The action item was re-scoped rather than closed.
- **102 of 695 titles are not a prefix of their first lyric line.** Each was inspected: all are genuine hymnal titles drawn from a refrain or chorus (*He Lives*, *I Surrender All*, *Power in the Blood*, *Because He Lives*). No systematic off-by-one — a misaligned index would have shown as unrelated pairs throughout, not as 102 recognisable hymn titles.
- **Four entries the corpus lyrics contradict, left VERBATIM.** The owner index is authoritative, so these were not silently corrected; they are recorded as an open action item because each projects onto a slide as written:

  | # | Index says | Lyric beneath it |
  |---|---|---|
  | 81 | Thou I Speak With Tongues | "Though I speak with tongues…" |
  | 231 | Bless Be the King | "Bless be the King whose coming" — the lyric carries it too; the hymn is *Blest Be the King Whose Coming* |
  | 234 | Christ Is the Worlds Light | "Christ is the world's Light" |
  | 356 | All Who Love and Serve Youre City | "All who love and serve your city" |

  #231 appearing in both index and lyrics suggests one shared upstream source rather than a transcription slip.
- **Whitespace was collapsed**, matching the retired `cleanTitle`. Two entries carried a double space (#40, #107). Nothing else was altered.
- **Four consumer boundaries make the title payload rather than internal** — the song title slide (`slide-plan.ts:158`), the group label, the number+title autocomplete (Story 14.6) and picoclaw's `resolvedHymns` readback (Story 6.5). `tests/pptx-content.test.mjs` asserts title text and was expected to move; it did **not**, because the fixtures it asserts do not include a hymn whose title changed. Worth noting rather than celebrating: that suite would not have caught a bad join.
- One artefact already disagreed with the data in writing: `epics.md:382` gave the intended title slide as `"O Worship the King · SDAH #83"` while the corpus stored `"O worship the King, all-glorious above"`. The corpus now matches the artefact.

## Dev Agent Record

### Agent Model Used

Claude Opus 5 (1M context)

### Completion Notes List

- Index validated before use; the contiguity check is what would have caught a dropped line during transcription.
- Boot against a legacy database confirmed AC-4: #83 read back as *O Worship the King*.
- `npm test` green; `npm run build` green.

### File List

- `data/song-book/sdah.json`
- `tests/corpus.test.mjs`
- `_bmad-output/planning-artifacts/epics.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
