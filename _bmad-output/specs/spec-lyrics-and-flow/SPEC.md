---
id: SPEC-lyrics-and-flow
companions: []
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability only.

# Lyric Formatting and Flow Rules

## Why
Operators need lyrics to be more readable on screen (consolidated into continuous text rather than short line breaks) and require automated chorus repetition to prevent manual slide sequencing errors. A third force originally drove this spec — transitional song title slides during the intercessory prayer disrupt the worship flow — and it is no longer answered here: those three songs become hand-authored General canvas slides, so nothing generates a title to suppress. See *Retired capabilities*.

## Capabilities

- **CAP-1: Continuous Lyric Formatting**
  - **intent:** Consolidate vertical space and improve readability of lyrics.
  - **success:** Lyrics like `Verse 1\nLine 1\nLine 2` become `Line 1; Line 2` (or `Line 1. Line 2` if punctuation exists).

- **CAP-2: Automatic Chorus Injection**
  - **intent:** Automate chorus repetition so operators don't have to manually ensure the chorus is sung after every verse.
  - **success:** The slide plan sequence for any song with a Chorus becomes `Verse 1 -> Chorus -> Verse 2 -> Chorus` etc.

## Retired capabilities

**CAP-3 and CAP-4 are retired — because the three songs they govern will be set manually as General registry entries on free canvas.** On a General slide the title display, the number of slides, the line breaks and the text position are all authored by hand on the canvas. So there is no generated title left to filter, and no fixed 2-slide splitting rule left to enforce. Neither capability is reimplemented anywhere; both dissolve into canvas authoring.

The songs are SDAH **671** "Now, Dear Lord, as we pray", **684** "Hear our prayer, O Lord", and **214** "We have this hope".

**Effective on delivery of Story `20-1`, not today.** As of 2026-07-30 the behavior below is still what ships: `skipTitle` at `src/lib/slide-plan.ts:438` (671), `:460` (684), `:550` (214), plus `weHaveThisHopeFixed` at `:165` via `src/lib/lyrics.ts:429` (`splitWeHaveThisHopeSlides`), asserted by two tests named `CAP-4:` in `tests/lyrics.test.mjs`. The entries are kept verbatim below because they are the record of what Story 20.1's General seed must reproduce on canvas — `epics.md:332` states this is the only record of those sites and their liturgical reasons.

IDs `CAP-3` and `CAP-4` are burned: never reused, never renumbered. The next new capability here takes `CAP-5`.

- **CAP-3: Transitional Slide Skips** — *retired*
  - **intent:** Remove unnecessary transitional slides that disrupt the flow of the worship service.
  - **success:** Song title slides for "Now Dear Lord As We Pray", "Hear Our Prayer, O Lord", and "We Have This Hope" are explicitly filtered out from the slide plan.

- **CAP-4: Fixed Formatting for We Have This Hope** — *retired*
  - **intent:** Maintain traditional poetic stanza pacing for the closing prayer song (We Have This Hope, SDAH #214 fallback).
  - **success:** The "We Have This Hope" fallback lyrics are split into exactly 2 fixed slides with their original manual line breaks fully preserved, exempting them from CAP-1 continuous prose joining.

Retired with them, because they served nothing else: *"the skip rules apply only to the generated slide plan, not the parsed rundown data structure"* and *"We Have This Hope must be explicitly exempt from continuous line formatting."*

## Constraints
- Long continuous verses should still split across multiple slides if they exceed optimal character limits, maintaining a readable presentation.

## Non-goals
- Redesigning the parsing structure for other parts of the rundown.
- Modifying the underlying database storage format of the lyrics.

## Success signal
Automated tests pass, the live preview renders lyrics as continuous text correctly chunked, and choruses repeat after every verse. The two clauses this signal used to carry — the specified title slides being absent, and "We Have This Hope" generating exactly 2 lyric slides — moved to *Retired capabilities*; after Story `20-1` those outcomes are a property of how the General canvas was drawn, not something this spec can be tested against.
