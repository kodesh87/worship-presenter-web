# Story 6.3: Deck Blueprint Fidelity

Status: done

## Story

As an operator,
I want the PPTX to follow BIC Part A/B/C payload rules more closely,
So that FR-4 / FR-6 approach Sabbath-ready fidelity.

## Acceptance Criteria

1. **Given** theme verse / verse reading / sermon / family-youth in the payload, **When** PPTX is generated, **Then** each maps to its Slide Type (or standing default when absent).
2. **Given** standing liturgy songs (e.g. We Have This Hope), **When** generated, **Then** lyrics are resolved from the hymnal when a number is known.
3. **Given** no Special Song, **When** generated, **Then** no Special Song divider appears (already partially met).
4. **Given** structured payload fields (songs/sermon/etc.), **When** an operator edits via the web form (FR-11), **Then** they can edit those fields without rewriting the entire raw Telegram text (extends current raw-only editor).

## Tasks / Subtasks

- [x] Extend `ParsedRundown` + parser for theme / verse reading / family-youth
- [x] Map fields in `pptx.ts` + resolve We Have This Hope lyrics from hymnal
- [x] Structured EditForm fields + service PUT overlay (keep raw editor)
- [x] Smoke script + sprint/story status
- [x] `npm run build` + `node scripts/smoke-deck-fidelity.mjs`

## References

- PRD FR-4, FR-6, FR-11; `source-pptx-structure.md`
- Spec: `_bmad-output/implementation-artifacts/spec-6-3-deck-blueprint-fidelity.md`

## Dev Agent Record

### Completion Notes

Extended rundown parser for theme verse, verse reading, and family/youth; mapped them into Part A/B/C slides (standing John 4:23 default when theme absent; omit verse/family when absent). Resolved “We Have This Hope” via hymnal title fuzzy match (SDAH #214 fallback + embedded lyrics constant). Structured EditForm fields overlay `parsed_data` without requiring a full Telegram rewrite; raw editor retained. Section-aware hymn mapping left for 6.4. No bible/KJV imports.

### File List

- `src/lib/parser.ts`
- `src/lib/lyrics.ts`
- `src/lib/pptx.ts`
- `src/lib/parsed-fields.ts`
- `src/app/services/[id]/EditForm.tsx`
- `src/app/services/[id]/page.tsx`
- `src/app/api/services/[id]/route.ts`
- `src/app/api/services/[id]/pptx/route.ts`
- `scripts/smoke-deck-fidelity.mjs`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/spec-6-3-deck-blueprint-fidelity.md`
- `_bmad-output/implementation-artifacts/stories/6-3-deck-blueprint-fidelity.md`

### Change Log

- 2026-07-18: Implemented Story 6.3 deck blueprint fidelity; build + smoke passed.
