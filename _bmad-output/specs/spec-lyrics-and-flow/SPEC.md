---
companions: []
sources: []
---

# SPEC: Lyric Formatting and Flow Rules

## Why
Operators need lyrics to be more readable on screen (consolidated into continuous text rather than short line breaks) and require automated chorus repetition to prevent manual slide sequencing errors. Additionally, specific transitional song title slides during the intercessory prayer disrupt the worship flow and must be skipped.

## Capabilities

- **CAP-1: Continuous Lyric Formatting**
  - **Intent**: Consolidate vertical space and improve readability of lyrics.
  - **Success**: Lyrics like `Verse 1\nLine 1\nLine 2` become `Line 1; Line 2` (or `Line 1. Line 2` if punctuation exists).

- **CAP-2: Automatic Chorus Injection**
  - **Intent**: Automate chorus repetition so operators don't have to manually ensure the chorus is sung after every verse.
  - **Success**: The slide plan sequence for any song with a Chorus becomes `Verse 1 -> Chorus -> Verse 2 -> Chorus` etc.

- **CAP-3: Transitional Slide Skips**
  - **Intent**: Remove unnecessary transitional slides that disrupt the flow of the worship service.
  - **Success**: Song title slides for "Now Dear Lord As We Pray", "Hear Our Prayer, O Lord", and "We Have This Hope" are explicitly filtered out from the slide plan.

- **CAP-4: Fixed Formatting for We Have This Hope**
  - **Intent**: Maintain traditional poetic stanza pacing for the closing prayer song (We Have This Hope, SDAH #214 fallback).
  - **Success**: The "We Have This Hope" fallback lyrics are split into exactly 2 fixed slides with their original manual line breaks fully preserved, exempting them from CAP-1 continuous prose joining.

## Constraints
- Long continuous verses should still split across multiple slides if they exceed optimal character limits, maintaining a readable presentation.
- The skip rules apply only to the generated slide plan (PPTX and Preview), not to the parsed rundown data structure.
- "We Have This Hope" must be explicitly exempt from continuous line formatting to preserve its intended 2-slide manual layout.

## Non-goals
- Redesigning the parsing structure for other parts of the rundown.
- Modifying the underlying database storage format of the lyrics.

## Success Signal
Automated tests pass, the live preview renders lyrics as continuous text correctly chunked, choruses repeat after every verse, the specified title slides are absent from the intercessory prayer flow, and "We Have This Hope" generates exactly 2 lyric slides with its original line breaks intact.
