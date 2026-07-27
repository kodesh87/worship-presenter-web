# Story 3.1: Core Presentation Generation (PPTX)

Status: done

## Story

As an operator,
I want the system to generate a PPTX file from the parsed structured data,
So that I can download an offline-capable presentation.

## Acceptance Criteria

1. **Given** a parsed service with valid hymns and roles, **When** the generation function runs, **Then** a PPTX file is generated using `pptxgenjs`, **And** lyrics are split appropriately across slides to avoid overflow.

## Tasks / Subtasks

- [x] Implement Lyric Splitting (AC: 1)
  - [x] Implement a utility in `src/lib/lyrics.ts` to split long lyrics into manageable chunks per slide.
- [x] Implement PPTX Generator function (AC: 1)
  - [x] Implement `src/lib/pptx.ts` using `pptxgenjs`.
  - [x] Read `parsed_data` and map it into PPTX slides.
- [x] Implement Download API endpoint
  - [x] Create `src/app/api/services/[id]/pptx/route.ts` to serve the generated PPTX file over HTTP.

## Dev Notes

### Developer Context Section
This is Epic 3. It focuses entirely on creating a reproducible slide deck (`pptx` format) from the `parsed_data` we captured in Epic 2. The core challenge here is robustly generating a PPTX file headlessly, ensuring it falls back gracefully if we don't have all data, and appropriately wrapping/chunking hymn lyrics to fit the aspect ratio (16:9 is assumed).

### Technical Requirements
- Utilize `pptxgenjs` (already in `package.json`).
- Ensure no native deps are required that fail in a serverless function, `pptxgenjs` fits this.
- `lyrics.ts` should split on double-newlines (stanzas) or single newlines if a stanza is too long.

### Architecture Compliance
- Web-First Presentation with PPTX Export Fallback (AD-1) is satisfied by producing this offline artifact.

### References
- Epic 3 / Story 3.1 definition: `_bmad-output/planning-artifacts/epics.md`

## Dev Agent Record

### Agent Model Used
Claude-3.5-Sonnet (via Jules)

### File List
- `src/lib/lyrics.ts` (to create)
- `src/lib/pptx.ts` (to create)
- `src/app/api/services/[id]/pptx/route.ts` (to create)
