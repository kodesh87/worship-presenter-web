---
baseline_commit: 32eb0e5a6b62f7514fb2c23e0d893cea97ec36bd
---

# Story 14.6: Worship Form UX Polish (Highlights, Hymn Labels, Announcement Help)

Status: done

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As an operator,
I want Service Highlights removed, hymn inputs that show number and title together, and clear Announcement Flyers usage guidance,
so that create/edit forms stay focused on Raw Rundown Text and I can pick hymns and manage flyers without confusion.

## Acceptance Criteria

1. **Given** `/services/[id]` with parsed data, **When** the page renders, **Then** the **Service Highlights** card is not shown. Operators rely on **Raw Rundown Text** (and Live Slide Preview) for overview. **Unmapped Content** remains if present. The read-only Announcement flyers strip above the form is unchanged.

2. **Given** Bible Talk / Divine Worship hymn autocomplete fields on create (`/services/new`) and edit (`/services/[id]`), **When** a hymn is selected or a known number is hydrated (Parse / initial load), **Then** the input **displays** number and title together (e.g. `159 - O Worship the King`). Autocomplete dropdown may still show number + title; search by number or title still works. **Payload / overlay storage stays number-only** (`song1Number`…`song4Number` as digit strings) — do not change `buildFieldsPayload` contract or `applyStructuredFields` hymn overlay semantics.

3. **Given** the Announcement Flyers Card on create and edit, **When** the operator views the section, **Then** a clear helper/instruction block at the **bottom** of the section explains Master (recurring / global) vs one-off (this service only), without changing announcement sync / `clearMaster` / `is_recurring` behavior.

4. **Given** CAP-7 lockstep, **When** this story ships, **Then** CreateForm and EditForm stay in sync for hymn display and announcement helper copy. Special Song remains a plain performer/name text input (not hymn autocomplete). No API/schema/`buildSlidePlan` changes.

## Tasks / Subtasks

- [x] Remove Service Highlights chrome from `src/app/services/[id]/page.tsx` (AC: #1)
  - [x] Delete the conditional Service Highlights Card; keep Announcement flyers strip + Unmapped Content
  - [x] Clean unused locals only if they become dead after removal
- [x] Hymn number + title display in autocomplete (AC: #2)
  - [x] Add shared helpers in `src/lib/worship-form-fields.ts` (`formatHymnFieldDisplay`, query normalize for filter)
  - [x] Update `filterHymnIndex` so queries like `159 - Title` still match
  - [x] Update `HymnNumberAutocomplete` to show `N - Title` when value is a known number; on select still `onChange(String(number))`
  - [x] Extend `tests/worship-form-fields.test.mjs` for helpers / filter behavior
- [x] Announcement Flyers bottom helper text on Create + Edit (AC: #3, #4)
  - [x] Identical elegant helper copy at bottom of Announcement Flyers `CardContent` in `CreateForm.tsx` and `EditForm.tsx`
  - [x] Keep existing Master list checkbox behavior; optional short CardDescription may remain if not redundant
- [x] Validate create/edit parity + run `npm test` (AC: #4)

### Review Findings

- [x] [Review][Patch] Restore failedHymnNumbers display as a conditional error/warning section [src/app/services/[id]/page.tsx]
- [x] [Review][Patch] HymnNumberAutocomplete fallback allows non-digits [src/components/HymnNumberAutocomplete.tsx:112]
- [x] [Review][Patch] Fix duplicated "Missing hymns" warning by passing initial state to EditForm and removing static card in page.tsx [src/app/services/[id]/EditForm.tsx, src/app/services/[id]/page.tsx]

## Dev Notes

### Spec authority (binding)

- [Source: `_bmad-output/specs/spec-worship-web-input/edit-page-chrome.md` — Remove **Service Highlights**]
- [Source: `_bmad-output/specs/spec-worship-web-input/form-fields.md` — Hymns: display title alongside number in text field/autocomplete; Announcements UX helper at bottom of section]
- [Source: `_bmad-output/specs/spec-worship-web-input/SPEC.md` — Assumptions: Service Highlights removed; CAP-7 create/edit lockstep]
- [Source: `_bmad-output/specs/spec-worship-web-input/.memlog.md` — decisions: remove Highlights; number+title in hymn inputs; Announcement Flyers UX explanation]

### Implementation guidance

1. **Highlights:** Remove only the Service Highlights Card block. Do not remove Unmapped Content or the read-only Announcement flyers strip (SPEC non-goal).
2. **Hymn display:** Prefer display-layer in `HymnNumberAutocomplete` + pure helpers in `worship-form-fields.ts`. Parent form state and API payload remain digit strings (`'159'`).
3. **Announcement helper:** Place muted helper text after the list / add-URL controls (bottom of section).
4. **Parity:** Touch Create and Edit together for any Announcement copy change. Hymn behavior is shared via `HymnNumberAutocomplete`.
5. **Out of scope:** PPTX/slide-plan, announcement sync APIs, Special Song as hymn picker, redesign of read-only announcement strip, new npm dependencies.

### References

- Spec: `_bmad-output/specs/spec-worship-web-input/SPEC.md`
- Companions: `form-fields.md`, `edit-page-chrome.md`
- Project context: `_bmad-output/project-context.md`
- Prior stories: `14-5-sermon-section-kjv-resolve.md`, `14-3-worship-web-input-ui-tweaks.md`, `14-4-service-page-create-parity-shell.md`

## Dev Agent Record

### Agent Model Used

Cursor Grok 4.5

### Debug Log References

### Completion Notes List

- Story 14.6 created from SPEC companion revisions (no prior backlog); epic + sprint entry added.
- Removed Service Highlights card from `/services/[id]` chrome; kept Announcement flyers strip + Unmapped Content.
- Hymn autocomplete displays `N - Title` via shared helpers; parent/API still number-only; filter accepts display-formatted queries.
- Identical Announcement Flyers bottom helper on CreateForm + EditForm (Master vs one-off).
- `npm test`: 51/51 pass.
- ✅ Resolved review finding: restored conditional Missing hymns warning from `failedHymnNumbers` on `/services/[id]`.
- ✅ Resolved review finding: `commitDraft` no longer calls `onChange(trimmed)` for non-numeric ambiguous input — reverts to prior number or clears.
- Unified chrome warning into one **Input issues** card (failed hymns + unmapped lines); only renders when either is non-empty.
- ✅ Resolved review finding: dedupe Missing hymns — EditForm hydrates `failedHymnNumbers` from `initialParsed`; page Input issues card is unmapped-only.

### File List

- `src/app/services/[id]/page.tsx`
- `src/components/HymnNumberAutocomplete.tsx`
- `src/lib/worship-form-fields.ts`
- `src/app/services/new/CreateForm.tsx`
- `src/app/services/[id]/EditForm.tsx`
- `tests/worship-form-fields.test.mjs`
- `_bmad-output/planning-artifacts/epics.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/stories/14-6-worship-form-ux-polish.md`

### Change Log

- 2026-07-20: Story 14.6 implemented — remove Service Highlights, hymn number+title display, Announcement Flyers helper UX; status → review
- 2026-07-20: Addressed code review findings — 2 items resolved (failedHymnNumbers warning + number-only commitDraft)
- 2026-07-20: Input issues chrome — single warning card for missing hymns + unmapped content
- 2026-07-20: Dedupe Missing hymns — EditForm initial state + page card unmapped-only
