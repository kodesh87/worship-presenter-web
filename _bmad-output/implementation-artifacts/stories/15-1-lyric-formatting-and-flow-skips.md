---
baseline_commit: HEAD
---

# Story 15.1: Lyric Formatting and Service Flow Skips (Cursor Handover)

Status: done

## Context
This story introduces refinements to the PPTX presentation generator's rules based on operator feedback. The changes involve modifying how lyrics are formatted (continuous text instead of multiple lines), enforcing a strict Chorus repetition after every verse, and skipping specific song title slides during the intercessory prayer flow.

## Instructions for Cursor (Amelia / Dev Agent)

Please implement the following changes in the core parser and slide plan generator (`src/lib/lyrics.ts` and `src/lib/slide-plan.ts`):

### 1. Continuous Text Lyric Formatting
- **Goal**: Merge verse lines into a continuous paragraph per verse, rather than rendering them on separate lines, to save space and improve readability.
- **Rule**:
  - If a lyric line ends with punctuation (e.g., `.`, `,`, `!`, `?`, `;`, `:`), join it to the next line with a space (` `).
  - If it does NOT end with punctuation, join it to the next line with a semicolon and a space (`; `).
- **Condition**: Maintain the "1 verse = 1 slide" rule where possible, but if the continuous string becomes too long for a single slide, allow it to split into >1 slide as needed.
- **Location**: Update the `splitLyricsLabeled` logic or the initial chunking phase in `src/lib/lyrics.ts`.

### 2. Automatic Chorus Injection
- **Goal**: Chorus must always follow each Verse sequentially.
- **Rule**: For any song that contains a Chorus (or Reff), the generated sequence must be: `Verse 1 -> Chorus -> Verse 2 -> Chorus -> Verse 3 -> Chorus` etc.
- **Condition**: This applies universally to all songs. Ensure the `expandTrailingRefrain` or equivalent logic correctly inserts the Chorus slide after every mapped Verse.

### 3. Service Flow Skips (Part B)
- **Goal**: Remove unnecessary transitional song title slides during the Intercessory Prayer block and other parts.
- **Rules**:
  1. After the Intercessory Prayer section, skip the title slide for the next song and jump straight to its lyrics. Do **NOT** generate the song title slide "Now Dear Lord As We Pray" (or whatever song immediately precedes/follows).
  2. Do **NOT** generate the song title slide "Hear Our Prayer, O Lord" after the prayer.
  3. Do **NOT** generate the song title slide "We Have This Hope". (The lyrics for this song should still be displayed as usual).
- **Location**: Add filter conditions in `src/lib/slide-plan.ts` (specifically around the `part-b` generation logic and `pushSong` calls) to drop `kind: 'song-title'` for these specific titles/positions.

## Guardrails
- **Do not** change the structure of `ParsedRundown` or the web form UX.
- Ensure the live slide preview accurately reflects these skips and formatting changes.
- Ensure automated tests (`npm test`) pass, and update any broken test snapshots if the slide plan output changes.

## Tasks / Subtasks

- [x] Implement punctuation-aware `\n` to `; ` replacement in `lyrics.ts`
- [x] Ensure long continuous verses properly chunk into >1 slide if they exceed character/line density limits
- [x] Implement explicit `Verse -> Chorus` loop in `parseSections` / `expandTrailingRefrain`
- [x] Add explicit song title skip rules in `slide-plan.ts` for "Now Dear Lord As We Pray", "Hear Our Prayer, O Lord", and "We Have This Hope"
- [x] Verify changes locally and run test suites

## Dev Agent Record

### Agent Model Used
Cursor Grok 4.5 (bmad-dev-auto)

### Completion Notes List
- Continuous lyric join with terminal punct → space, else `"; "`; optional closing quote/bracket after punct.
- Char budget 320 with soft breaks at `"; "` / sentence endings; whitespace before hard slice.
- `expandTrailingRefrain` always Verse→Chorus when a non-empty refrain exists.
- `pushSong(..., { skipTitle: true })` for intercessory-671, intercessory-684, hope only.
- Spec: `_bmad-output/implementation-artifacts/spec-15-1-lyric-formatting-and-flow-skips.md`
- `npm test`: 59 pass / 0 fail

### File List
- `src/lib/lyrics.ts`
- `src/lib/slide-plan.ts`
- `tests/lyrics.test.mjs`
- `tests/slide-plan.test.mjs`
- `package.json`
- `_bmad-output/implementation-artifacts/spec-15-1-lyric-formatting-and-flow-skips.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log
- 2026-07-20: Implemented Story 15.1 via bmad-dev-auto; review patches for punct+quote, soft/hard breaks, empty refrain guard.
