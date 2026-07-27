---
title: '15.1 Lyric Formatting and Service Flow Skips'
type: 'feature'
created: '2026-07-20'
status: 'done'
baseline_revision: '7295394cd1e5e165ba8d4125fecffa754dedf0b8'
final_revision: '55e0adc1d79ac3e8ca798f2b9cd96ba282c1e13b'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-15-context.md'
  - '{project-root}/_bmad-output/specs/spec-lyrics-and-flow/SPEC.md'
  - '{project-root}/_bmad-output/implementation-artifacts/stories/15-1-lyric-formatting-and-flow-skips.md'
warnings: []
---

<intent-contract>

## Intent

**Problem:** Lyric slides still render line-broken verse text, chorus is only auto-repeated for a narrow trailing-refrain shape, and Part B prayer-flow song-title slides interrupt worship pacing for standing response songs.

**Approach:** Join each verse/refrain into continuous prose with punctuation-aware separators, always emit Verse→Chorus after every verse when a refrain exists, and omit song-title slides for the three standing Part B songs while still emitting their lyric slides.

## Boundaries & Constraints

**Always:**
- Keep `LyricSlide` `{ label, text }` and `buildSlidePlan` as the single order source for PPTX + preview.
- Prefer 1 verse = 1 slide; split only when continuous text exceeds the readability character budget.
- Skip titles only for intercessory-671, intercessory-684, and hope Song Blocks; other hymns keep title + lyrics.
- Prefer SDAH / `idPrefix` gates over fragile title-string equality (corpus titles differ in casing/punctuation).

**Block If:**
- Changing continuous-join punctuation set beyond `. , ! ? ; :` would be required to pass hymnal corpus checks.
- Character budget for multi-slide split cannot be chosen without inventing a new product rule beyond “readable / not cramped.”

**Never:**
- Change `ParsedRundown`, worship create/edit form UX, or hymnal DB storage format.
- Drop lyric slides for the three skipped-title songs.
- Skip song titles for BT/DS opening/middle/closing hymns.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Continuous join with terminal punctuation | Line ends with `. , ! ? ; :` then next line | Join with single space `" "` | No error expected |
| Continuous join without punctuation | Line does not end with that set | Join with `"; "` | No error expected |
| Short verse | Continuous verse fits budget | Exactly one lyric slide for that verse | No error expected |
| Long verse | Continuous verse exceeds budget | ≥2 lyric slides, same verse label, prefer break at `"; "` / sentence boundary | No error expected |
| Chorus present (trailing or interleaved) | ≥1 verse + ≥1 Chorus/Reff/Refrain | Sequence `V1, Chorus, V2, Chorus, …` using first non-empty refrain text | No error expected |
| No chorus | Verses only | Verses only; no injected refrain | No error expected |
| Skip titles Part B | Standing #671, #684, Hope (#214) | No `song-title` for those blocks; lyric slides still present | Missing hymnal still throws as today for standing pair |

</intent-contract>

## Code Map

- `src/lib/lyrics.ts` -- `chunkLines` / join helper, `expandTrailingRefrain`, `splitLyricsLabeled` (CAP-1, CAP-2)
- `src/lib/slide-plan.ts` -- `pushSong` + call sites `intercessory-671`, `intercessory-684`, `hope` (CAP-3)
- `tests/slide-plan.test.mjs` -- Intercessory order/title assertions need lyric-id + zero-title updates
- `tests/lyrics.test.mjs` -- new unit coverage for join, long-split, Verse→Chorus (add to `package.json` test script)
- `_bmad-output/specs/spec-lyrics-and-flow/SPEC.md` -- product CAP authority (no ParsedRundown change)

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/lyrics.ts` -- Replace newline joins with punctuation-aware continuous text (` ` vs `"; `); keep 1-section-1-slide when under budget; character-budget split for long continuous strings (prefer `; ` / sentence breaks) -- CAP-1 readability
- [x] `src/lib/lyrics.ts` -- Rewrite `expandTrailingRefrain` so any song with a Chorus/Reff always yields Verse→Chorus after every verse (use first non-empty refrain) -- CAP-2
- [x] `src/lib/slide-plan.ts` -- Add optional skip-title on `pushSong`; enable for `intercessory-671`, `intercessory-684`, and `hope` only -- CAP-3
- [x] `tests/lyrics.test.mjs` + `package.json` -- Unit-test I/O matrix join, long-split, chorus loop -- verify CAP-1/2
- [x] `tests/slide-plan.test.mjs` -- Assert no song-title for 671/684/hope; lyric slides + divider order remain -- verify CAP-3

**Acceptance Criteria:**
- Given a multi-line verse, when lyrics are split, then lines join with `" "` after terminal punctuation else `"; "`, with no raw mid-verse `\n` in a single-slide body.
- Given a song with Chorus/Reff, when slides are labeled, then every verse is immediately followed by that chorus (labels `n/total` then `Chorus`/`Reff`).
- Given a continuous verse longer than the readability budget, when split, then multiple slides share the verse label and each chunk stays under the budget.
- Given Part B standing songs #671, #684, and Hope, when `buildSlidePlan` runs, then their `song-title` slides are absent and their `song-lyric` slides remain.
- Given BT/DS payload hymns, when planned, then song-title slides still appear as before.
- Given `npm test`, when run, then the suite passes including updated slide-plan assertions.

## Spec Change Log

## Review Triage Log

### 2026-07-20 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 4: (high 0, medium 2, low 2)
- defer: 0
- reject: 15
- addressed_findings:
  - `[medium]` `[patch]` Terminal punct before closing quote/bracket now treated as punctuated (`TERMINAL_PUNCTUATION` optional quote/bracket)
  - `[medium]` `[patch]` Soft-break search extended to `! ` / `? ` / `: `; hard-slice prefers last whitespace to avoid mid-word cuts
  - `[low]` `[patch]` `expandTrailingRefrain` returns unchanged when no non-empty refrain template exists
  - `[low]` `[patch]` Slide-plan test asserts both `bt-opening-title` and `ds-opening-title`; added quote-join unit test

## Design Notes

**Continuous join:** Within a section, reduce lines left-to-right. Terminal punctuation set: `.`, `,`, `!`, `?`, `;`, `:`. Example: `Hope in the coming of the Lord.` + `We have this faith…` → space join; `Shall awake and shout and sing` + `Hallelujah! Christ is King!` → `"; "` join.

**Long-split budget:** After join, if length ≤ ~320 characters, emit one slide (preserves 1 verse = 1 slide for typical SDAH verses). If longer, split near `"; "` or `. ` boundaries without exceeding budget; fall back to hard slice only if no soft break exists. Keep `maxLinesPerSlide` parameter for API compatibility but apply it to post-join chunking semantics (character budget is the real gate for continuous prose).

**Chorus expand:** Do not early-return on interleaved shapes. Collect verses + first non-empty chorus/reff template; emit `[verse, refrainCopy]` per verse; append `body` sections last.

**Title skip:** Prefer `pushSong(..., idPrefix, { skipTitle: true })` at the three standing call sites rather than filtering by display title strings.

## Verification

**Commands:**
- `npm test` -- expected: all tests pass (lyrics + slide-plan updated/added)

## Auto Run Result

**Summary:** Story 15.1 delivers continuous punctuation-aware lyric prose, Verse→Chorus after every verse when a refrain exists, and Part B song-title skips for standing #671, #684, and Hope while keeping lyric slides.

**Files changed:**
- `src/lib/lyrics.ts` — continuous join, 320-char chunking, universal Verse→Chorus expand
- `src/lib/slide-plan.ts` — `pushSong(..., { skipTitle })` for intercessory-671/684 and hope
- `tests/lyrics.test.mjs` — CAP-1/2 unit coverage
- `tests/slide-plan.test.mjs` — CAP-3 title-skip assertions
- `package.json` — register lyrics tests
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story status
- `_bmad-output/implementation-artifacts/stories/15-1-lyric-formatting-and-flow-skips.md` — completion record

**Review:** 4 patches applied (punct+quote, soft/hard break, empty refrain guard, tighter BT/DS title assert). 0 deferred. Remaining adversarial notes rejected as by-design or out of story scope.

**Follow-up review recommended:** false

**Verification:** `npm test` — 59 pass / 0 fail

**Residual risks:** `CONTINUOUS_CHAR_BUDGET=320` is a soft readability heuristic; very dense verses may still feel tight on PPTX at fontSize 28 until operator feedback adjusts the budget.
