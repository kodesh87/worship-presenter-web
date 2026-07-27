---
baseline_commit: 0cfb77f2e7e7c71c10d49a9c1459ca68f2fccccb
---

# Story 14.4: Service Page Create-Parity & Shell Stability

Status: done

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As an operator,
I want `/services/[id]` to present the same worship form as create (with a working edit/save path) plus the useful service actions, without Order of Service chrome and without header/width jumps,
so that opening an existing service feels like editing create — not a separate show/run-sheet.

## Acceptance Criteria

1. **Given** an existing service at `/services/[id]`, **When** the page loads, **Then** the primary surface is an immediately editable create-parity worship form — no “Service Payload” read-only card, no “Edit Payload” toggle, and no `isEditing` mode that snaps back to show after save.
2. **Given** the edit form, **When** compared side-by-side with `/services/new` CreateForm, **Then** layout and overlays match CreateForm:
   - Root `space-y-6` (no wrapping “Edit Payload” Card); grid `lg:col-span-7` / `lg:col-span-5`
   - Raw Rundown Text always visible (`h-72`); Parse bottom-right with **detected date** on the left when available (`detectedDate` from preview `data.date`, cleared when payload empty)
   - Sections in order: Bible Talk → Divine Worship (**Special Song inside Divine Worship, before nested Sermon**) → Family of the Week → Youth of the Week → Announcement Flyers **Card**
   - Matching Card classes/titles/descriptions, field label casing, and upload button labels (“Upload Sermon Image” / “Upload Family Photo” / “Upload Youth Photo”)
   - Live Slide Preview: renders `slide.body`, uses `max-h-[600px]`, and runs on load whenever payload is non-empty (**not** gated on `isEditing`)
3. **Given** edits on `/services/[id]`, **When** the operator saves, **Then** `PUT /api/services/${id}` with `updated_at` updates `raw_payload` / `parsed_data` / images / announcements; stale write returns 409 + refresh without leaving the form. Cancel calls `resetFromProps()` only (does not navigate away or toggle a mode). After success: `router.refresh()` + local `updatedAt` update; **stay on the editable form**.
4. **Given** `/services/[id]` chrome, **When** the page renders, **Then** these remain: Preview, Present, Delete Service, Download PPTX, Announcement flyers read-only strip + Manage list, Service Highlights, Unmapped Content, corrupt-parsed warning, Back to Dashboard, run-sheet title/date/id. **Only** the Order of Service card (`page.tsx` ~Card listing `parsedData.items`) is removed. Announcement strip is not redesigned.
5. **Given** navigation among `/`, `/services/new`, and `/services/[id]`, **When** the operator switches routes, **Then** header alignment and main content column **width** do not perceptibly jump (CAP-8). Page height may still differ because edit keeps chrome above the form — that is OK. Prefer `scrollbar-gutter: stable` on `html` in `@layer base` plus matching 7/5 form columns; keep shared `max-w-5xl` shell (do not invent a different `max-w-*` per route).
6. **Given** existing create/edit save and preview contracts, **When** this story ships, **Then** no change to payload shape, `parseRundown` / `normalizeParsedRundown` / `applyStructuredFields`, `buildSlidePlan` as sole planner, CAP-4 `allowSecond` (create-only — do not port collision UX onto edit), announcement `clearMaster` semantics, or client imports of server-only parser/DB. Edit save stays `PUT /api/services/${id}`; Parse/hydrate stays `POST /api/services/preview` **without** `fields`. Never send `participantsRaw` on PUT (prop may remain unused for compat).

## Tasks / Subtasks

- [x] Remove Order of Service card from `src/app/services/[id]/page.tsx` only (the Card that lists `parsedData.items` ~302–369). Keep Announcement flyers strip (~192–231), Service Highlights, Unmapped Content, action header. (AC: #4)
- [x] Restructure `EditForm.tsx` to create-parity primary surface (AC: #1, #2, #3, #6)
  - [x] **Delete `isEditing` state machine entirely:** remove `isEditing`, `rawExpanded`, read-only branch (~468–609 “Service Payload”), and every `setIsEditing(...)` (including post-save / reset). Dead code: read-only-only helpers such as `summaryFamily` / `summaryYouth` if unused after removal.
  - [x] **Ungate preview:** debounced preview `useEffect` must run when `payload.trim()` is non-empty on load — remove `!isEditing` early return.
  - [x] **Flatten shell:** copy CreateForm root `space-y-6` + per-section Card structure; remove outer “Edit Payload” wrapping Card / `ring-primary/30`.
  - [x] **Match CreateForm markup order/classes** (preferred approach: copy CreateForm section order/classes, adapt footer to PUT). Include: 7/5 grid; raw `h-72` always visible; `detectedDate` state wired from preview `data.date`; Parse row with date left / Parse right; Divine Worship contains Special Song then nested Sermon; Announcements as Card; label/upload copy parity; preview `slide.body` + `max-h-[600px]` + create-equivalent CardDescription.
  - [x] **Preserve edit save semantics:** `PUT /api/services/${id}` with `updated_at`; 409 → alert + refresh, stay on form; success → refresh + update `updatedAt`, stay on form; Cancel → `resetFromProps()` only; announcement `clearMaster` confirm; omit `participantsRaw` from PUT body; preview debounce/seq/abort; Parse hydrate via preview without `fields` (no client `parseRundown`); do not port create date-collision / `allowSecond` UI.
- [x] Shell stability (AC: #5)
  - [x] Add `scrollbar-gutter: stable` on `html` in `src/app/globals.css` (`@layer base`)
  - [x] Confirm `/`, `/services/new`, `/services/[id]` still share `max-w-5xl` + same Header shell; ensure edit form column split matches create (7/5)
- [x] Optional anti-drift: extract shared form body/sections used by Create + Edit — only if it reduces duplication without delaying AC. If skipped, document in Completion Notes that `CreateForm.tsx`, `EditForm.tsx`, and `form-fields.md` must stay in sync.
- [x] Manual verify (AC: #1–#6)
  - [x] Open `/services/[id]` — form editable immediately; no “Edit Payload” / Service Payload card
  - [x] Preview populated on load when payload present; includes `slide.body`
  - [x] Save stays on editable form; Cancel resets fields only
  - [x] Parse shows detected date when raw text contains a date
  - [x] Hymn autocomplete not clipped inside Cards (portal/fixed positioning intact — do not revert to absolute-inside-Card)
  - [x] Order of Service gone; Preview/Present/Delete/PPTX + announcement strip + Manage list remain
  - [x] Navigate `/` ↔ `/services/new` ↔ `/services/[id]` — no header/content **width** jump
  - [x] 409 stale save still alerts + refreshes without leaving the form
- [x] Run existing package test script; add unit tests only if shared helpers are extracted (register new files in `package.json` `"test"`)

## Dev Notes

### Spec contract (source of truth)

- [Source: `_bmad-output/specs/spec-worship-web-input/SPEC.md`] CAP-2, CAP-7, CAP-8; Constraints on form lockstep + chrome; Non-goals for Order of Service restore and announcement-strip redesign
- [Source: `_bmad-output/specs/spec-worship-web-input/edit-page-chrome.md`] Keep/Remove tables; form + shell parity
- [Source: `_bmad-output/specs/spec-worship-web-input/form-fields.md`] Field set + parity rule

### Current state (what is wrong today)

`EditForm` already exists and can save via PUT, but `/services/[id]` still *reads* as a show/run-sheet:

1. **`isEditing` defaults false** → “Service Payload” card + “Edit Payload” toggle; `handleSave` / `reset` call `setIsEditing(false)` so successful save returns to show mode.
2. **Preview gated on `isEditing`** → blank preview until toggle; also omits `slide.body` and uses `max-h-[480px]`.
3. **Form drift vs CreateForm:** collapsible raw (`h-48`); no `detectedDate`; grid `8/4` vs `7/5`; nested “Edit Payload” Card; weaker CardDescriptions / `bg-background/20` vs create `shadow-md bg-card/60 backdrop-blur-md`; Announcements not a Card; label casing (“Sermon speaker” vs “Sermon Speaker”); upload labels “Upload Image” vs specific create labels; empty/announcement/failed-hymn copy drift.
4. **page.tsx** still renders **Order of Service** card (`parsedData.items` list ~302–369) — remove that card only.
5. **Width jump:** taller `[id]` page toggles scrollbar; no `scrollbar-gutter` yet; edit 8/4 grid worsens perceived width vs create. Height parity is **not** required.

### Chrome rules (binding)

| Keep | Remove this story |
|------|-------------------|
| Preview, Present, Delete Service, Download PPTX | **Order of Service** card only (`parsedData.items` list) |
| Announcement flyers strip + Manage list (unchanged) | — |
| Service Highlights, Unmapped Content, corrupt-parsed warning | — |
| Back to Dashboard, run-sheet title/date/id | — |

### Must NOT change

- `PUT /api/services/[id]` contract / optimistic concurrency
- `POST /api/services` create + CAP-4 `allowSecond` (create-only UX — do not add to edit)
- `POST /api/services/preview` hydrate (Parse omits `fields`; preview includes photos/announcements)
- `buildSlidePlan` / PPTX / presenter / projector slide order
- Announcement master non-wipe + `clearMaster`
- No new DB tables, roles, or Telegram/webhook work
- Do not send `participantsRaw` on PUT (including `null`); page may still pass `initialParticipantsRaw` for compat — leave unused or delete prop only if clean
- Do not import `parseRundown` / `getDb` into client components
- Do not revert `HymnNumberAutocomplete` away from portal + fixed positioning

### File list (expected touch)

| File | Change |
|------|--------|
| `src/app/services/[id]/page.tsx` | Remove Order of Service block only; keep strip + actions + Highlights + Unmapped |
| `src/app/services/[id]/EditForm.tsx` | Primary: delete `isEditing` machine; create-parity form surface |
| `src/app/services/new/CreateForm.tsx` | Reference implementation to copy from; touch only if extracting shared pieces |
| `src/app/globals.css` | `scrollbar-gutter: stable` on `html` in `@layer base` |
| Optional new shared component under `src/components/` or `src/app/services/` | Only if extracting shared form body |

Likely **do not** touch: `DeleteButton.tsx`, API routes, `worship-form-fields.ts`, `parsed-fields.ts`, slideshow/present clients — unless a bug blocks AC.

### Architecture / stack guardrails

- Next.js App Router, React 19, Tailwind 4, shadcn/`Card`/`Button` — match existing Hub aesthetics
- `Card` has `overflow-hidden` — keep `HymnNumberAutocomplete` portal/fixed positioning (14.3 fix)
- Server Components for pages; forms stay `'use client'`
- [Source: `_bmad-output/project-context.md`] thin routes, `@/` imports, node:test only, no Jest/Vitest

### Previous story intelligence (14.1–14.3)

- Shared mapping: `src/lib/worship-form-fields.ts`; autocomplete: `HymnNumberAutocomplete` (portal required inside Cards).
- CreateForm + EditForm historically duplicated — **both must stay in sync** or extract shared body this story.
- Parse via preview hydrate only; preview body must include current photos/announcements (avoid slide-plan flicker).
- Do not regress: CAP-4 `allowSecond`, announcement `clearMaster`, omit `participantsRaw`, preview abort/seq, portal autocomplete.
- Deferred debt (out of scope unless blocking): extract fat `api/services*` handlers; shrink `hymnIndex` HTML payload.
- Recent commits: `0cfb77f` Story 14.3 UI tweaks; `f2ae246` Story 14.2 UX; process gate against vibe-coding without Spec/Story.

### Implementation approach (recommended)

1. Use CreateForm as the visual/markup reference; reshape EditForm to match, keeping PUT footer + concurrency.
2. Delete show-mode code paths first (`isEditing` / read-only JSX) so preview and save cannot regress to show.
3. Then remove Order of Service from `page.tsx` and add `scrollbar-gutter`.
4. Manual AC checklist before marking review.

### Testing requirements

- Manual AC checklist in Tasks is the primary verification for this UI story.
- Package test script must still pass.
- New unit tests only if shared helpers are extracted; use `node:test` + temp `DB_PATH` for DB tests; register files in `package.json` `"test"`.

### Project Structure Notes

- Routes under `src/app/services/{new,[id]}/`; shared UI under `src/components/`; domain under `src/lib/`.
- Story artifacts under `_bmad-output/implementation-artifacts/stories/`.
- Do not invent a second slide-order UI; Live Slide Preview + raw text replace Order of Service.

### References

- [Source: `_bmad-output/specs/spec-worship-web-input/SPEC.md`]
- [Source: `_bmad-output/specs/spec-worship-web-input/edit-page-chrome.md`]
- [Source: `_bmad-output/specs/spec-worship-web-input/form-fields.md`]
- [Source: `_bmad-output/implementation-artifacts/stories/14-3-worship-web-input-ui-tweaks.md`]
- [Source: `_bmad-output/implementation-artifacts/stories/14-2-worship-web-input-ux-refinements.md`]
- [Source: `_bmad-output/project-context.md`]

## Dev Agent Record

### Agent Model Used

Cursor Grok 4.5

### Debug Log References

- Package tests: 46 pass, 0 fail (`npm test`)
- Confirmed shared `max-w-5xl` on `/`, `/services/new`, `/services/[id]`
- No `isEditing` / Service Payload / Edit Payload remaining in EditForm

### Completion Notes List

- Removed Order of Service card from `[id]/page.tsx`; kept announcement strip, Highlights, Unmapped, action header.
- Rewrote EditForm as create-parity primary surface: deleted `isEditing`/`rawExpanded`/read-only branch; ungated preview; 7/5 grid; raw `h-72` + `detectedDate`; Special Song inside Divine Worship; Announcements Card; upload label parity; preview `slide.body` + `max-h-[600px]`.
- Preserved PUT + `updated_at` concurrency, 409 alert+refresh, Cancel=`resetFromProps()` only, `clearMaster` confirm, Parse hydrate without `fields`, no `participantsRaw` on PUT, no CAP-4 collision UX.
- Added `scrollbar-gutter: stable` on `html` in `@layer base`.
- Skipped shared form extraction to keep AC delivery tight — `CreateForm.tsx`, `EditForm.tsx`, and `form-fields.md` must stay in sync for future tweaks.
- No new unit tests (no shared helpers extracted); existing suite green.

### File List

- `src/app/services/[id]/page.tsx`
- `src/app/services/[id]/EditForm.tsx`
- `src/app/globals.css`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/stories/14-4-service-page-create-parity-shell.md`

### Change Log

- 2026-07-20: Implemented Story 14.4 create-parity edit surface + shell stability; status → review
