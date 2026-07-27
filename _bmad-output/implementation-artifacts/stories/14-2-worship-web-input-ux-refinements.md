---
baseline_commit: dab8445b09ea9a162285ceb68a4990795001ff4c
---

# Story 14.2: Worship Web Input UX Refinements

Status: in-progress

## Story

As an operator,
I want a unified raw text input with a manual parse trigger and autocomplete hymn dropdowns,
so that I can extract structured overlays from one rundown paste, pick hymns quickly, and work in clearly grouped UI sections.

## Acceptance Criteria

1. **Parse (server hydrate):** Given non-empty Raw Rundown Text, when the operator clicks **[Parse]**, the client calls a **server** path (`POST /api/services/preview` extended, or a dedicated `POST /api/services/parse`). The response includes a hydrate DTO that maps into existing `FormFields` plus `date` and `failedHymnNumbers`. Client components **must not** import `parseRundown` / `getDb`.
2. **Overlay field map only:** Parse populates **only** companion overlay fields: `song1–4`, `verseReference` / `verseText`, `sermonSpeaker`, `closingPrayerPerson`, `specialSong`, `familyPrayerRequest` / `youthPrayerRequest` (split from `familyYouth` when split fields empty — same semantics as `fieldsFromParsed`). Extra roles (Song Leader, Prayer Partners, etc.) and section markers remain in `parsed.items` at save-time via `parseRundown`; **do not** add new role/section form controls. Date is a **detected badge** from parse (no new editable date control on this story unless already present for CAP-4).
3. **Re-Parse vs manual edits:** Clicking Parse again **overwrites** overlay fields from the latest raw text. Between Parse clicks, operator edits to overlays win on save and on CAP-5 preview via existing `applyStructuredFields` / `buildFieldsPayload`. Empty song overlays do **not** remove hymns from raw parse; empty sermon / closing / null fields follow current `buildFieldsPayload` + `applyStructuredFields` null semantics.
4. **CAP-5 live preview stays:** Debounced live preview remains. Parse is an explicit one-shot hydrate (and may refresh preview once). Do not remove live preview; do not refill overlays on every preview tick.
5. **Hymn autocomplete:** Song 1–4 inputs use client-side autocomplete over the existing `hymnIndex` prop (number or title). Selecting a result sets that song field’s number. Remove the separate **Hymn Reference Helper** sidebar once per-field autocomplete ships. Prefer existing `Popover` + input; do not add cmdk/`Command` unless required.
6. **UI grouping:** Structured overlays are grouped into Cards: **Bible Talk** (songs 1–2 + verse), **Divine Worship** (songs 3–4 + special song — label only; parser section remains DIVINE SERVICE), **Sermon** (speaker, graphic URL, closing prayer), **Family Prayer**, **Youth Prayer**. Announcement/image API contracts unchanged.
7. **Single raw input:** Remove the separate **Raw Participant List** textarea from Create and Edit. Stop sending `participantsRaw` on create/edit so existing `participants_payload` is preserved (omit the key — do **not** send `null` unless product later decides to clear). Update edit summary / copy that still says “Participants (raw)”. `raw_payload` remains the single raw text source (SPEC).
8. **No `ParsedRundown` break:** Downstream PPTX / presenter / projector still consume the same shape via `parseRundown` + `normalizeParsedRundown` + `applyStructuredFields` + `buildSlidePlan`.

## Tasks / Subtasks

- [x] Server hydrate contract (AC: 1, 2, 3)
  - [x] Extend preview response (or add parse route) with hydrate object reusable by Create + Edit
  - [x] Move `fieldsFromParsed` / `songNumbersFromParsed` mapping into shared `src/lib` (or keep single source both forms import)
  - [x] Wire **[Parse]** button; never import `parser.ts` into client components
- [x] Forms UX (AC: 4, 5, 6, 7)
  - [x] Update `CreateForm.tsx` and `EditForm.tsx`: Parse button, Card groupings, remove participantsRaw UI + request key, remove Hymn Reference Helper, per-song autocomplete from existing `hymnQuery` filter logic
  - [x] Keep preview debounce / abort / `previewSeqRef` patterns
  - [x] Preserve announcement + photo state across Parse
- [x] Tests (AC: 1–3, 7, 8)
  - [x] Hydrate-from-`ParsedRundown` unit coverage (reuse sample rundown patterns from `tests/parser.test.mjs`)
  - [x] Document / assert empty-song vs empty-sermon overlay semantics
  - [x] Create/edit paths omit `participantsRaw` without clearing stored participants when key absent
  - [x] Append any new test files to `package.json` `"test"` script list

### Review Findings

- [x] [Review][Patch] UI Flicker on Parse — `handleParse` sets `slidePlan` with a payload that lacks photos/announcements, causing a visual flicker before the live preview debounce restores them. [src/app/services/new/CreateForm.tsx] (fixed: Parse preview body includes current image URLs + announcements; still omits `fields` for raw hydrate)
- [x] [Review][Defer] `failedHymnNumbers` wiped on preview error — deferred, pre-existing [src/app/services/new/CreateForm.tsx]

## Dev Notes

### Guardrails (do not violate)

- `parseRundown` is **server-only** (SQLite via `lookupHymn` / `getDb`). Client = HTTP only.
- Do not invent `GET /api/hymns` — hymn search is client `hymnIndex` (Story 14.1 decision 5a). Full-index HTML payload optimization is deferred debt, out of scope.
- Do not change announcement sync / `clearMaster` / CAP-4 `allowSecond` / optimistic `updated_at` 409 behavior.
- Prefer shadcn `Card` + `Popover`; keep route handlers thin; domain logic in `src/lib/*`.
- Avoid `setState` in effects that cause infinite re-renders; Parse should be an explicit event handler.

### Current code to extend (do not reinvent)

| Reuse | Path |
|--------|------|
| `parseRundown` | `src/lib/parser.ts` (server) |
| `applyStructuredFields`, `coerceStructuredFields`, `normalizeParsedRundown`, `songNumbersFromParsed` | `src/lib/parsed-fields.ts` |
| `bucketHymnsBySection` | `src/lib/hymn-sections.ts` |
| `fieldsFromParsed`, `buildFieldsPayload`, `resolveScripture`, sermon↔closing sync | `CreateForm.tsx` / `EditForm.tsx` (extract shared) |
| `POST /api/services/preview` + abort/sequence | both forms + `src/app/api/services/preview/route.ts` |
| `hymnIndex` loaders | `src/app/services/new/page.tsx`, `src/app/services/[id]/page.tsx` |
| Existing hymn filter (`hymnQuery` / `hymnResults` `useMemo`) | both forms — relocate onto song inputs |
| `Card`, `Popover` | `@/components/ui/card`, `@/components/ui/popover` |
| `buildSlidePlan` | `src/lib/slide-plan.ts` (preview only; no fork) |

### Previous story intelligence (14.1)

- Web create/edit, CAP-4/5/6, announcement non-wipe, client hymn preload already shipped (`ec1e605`).
- Edit already hydrates overlays via `fieldsFromParsed` + `songNumbersFromParsed` — Create Parse must share that path.
- Deferred: fat `api/services*` handlers; optional `hymnIndex` payload shrink — not this story.
- Process: do not vibe-implement beyond AC; keep SPEC/`form-fields.md` aligned if behavior wording drifts.

### Project structure notes

- Touch: `CreateForm.tsx`, `EditForm.tsx`, `src/lib/parsed-fields.ts` (and/or new small hydrate helper under `src/lib/`), preview (or parse) route. Touch `parser.ts` **only** if a real server bug blocks hydrate — do not add redundant role regex churn (roles already parse into `items`).
- Label “Divine Worship” is UI copy; keep section detection / BT–DS bucketing as today.

### Testing standards

- Node `node:test` + `node:assert/strict` in `tests/*.test.mjs`; register via existing `--import` / strip-types setup.
- Prefer focused unit tests for hydrate mapping and API omit-`participantsRaw` behavior over browser e2e.

### References

- [Source: `_bmad-output/specs/spec-worship-web-input/SPEC.md`] CAP-1…6, Constraints, Assumptions
- [Source: `_bmad-output/specs/spec-worship-web-input/form-fields.md`] field table, Parse, overlay grouping
- [Source: `_bmad-output/planning-artifacts/sprint-change-proposal-14-2-ux.md`] Correct Course handoff
- [Source: `_bmad-output/implementation-artifacts/stories/14-1-worship-web-input-boundary.md`] prior AC + review decisions
- [Source: `_bmad-output/project-context.md`] BMad gate, thin handlers, Next 16 params, test runner

## Dev Agent Record

### Agent Model Used

Cursor Grok 4.5 (bmad-dev-story)

### Debug Log References

### Completion Notes List

- Extended `POST /api/services/preview` with `fields` hydrate DTO via client-safe `fieldsFromParsed`.
- Shared helpers in `src/lib/worship-form-fields.ts`; `songNumbersFromParsed` re-exported from `parsed-fields.ts`.
- Create/Edit: Parse button (raw-only preview), Card groupings, HymnNumberAutocomplete, removed Raw Participant List + Hymn Helper; omit `participantsRaw` on save (PUT preserves existing when key absent).
- Tests: `tests/worship-form-fields.test.mjs` — full suite 46/46 pass.

### File List

- `src/lib/worship-form-fields.ts` (new)
- `src/components/HymnNumberAutocomplete.tsx` (new)
- `src/lib/parsed-fields.ts`
- `src/app/api/services/preview/route.ts`
- `src/app/services/new/CreateForm.tsx`
- `src/app/services/[id]/EditForm.tsx`
- `tests/worship-form-fields.test.mjs` (new)
- `package.json`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/stories/14-2-worship-web-input-ux-refinements.md`

### Change Log

- 2026-07-19: Implemented Story 14.2 UX refinements (Parse hydrate, autocomplete, unified raw input, grouped cards).
