---
baseline_commit: 2687e169e412e1caadee11979a05c64c73f7ac0e
---

# Story 14.3: Worship Web Input UI Tweaks (Cursor Handover)

Status: done

## Context
This is a handover prompt for Cursor to execute UI layout refinements on the Worship Web Input form (`CreateForm.tsx` and `EditForm.tsx`). The feedback is based on the initial implementation of Story 14.2.

## Instructions for Cursor (Amelia / Dev Agent)

Please implement the following UI adjustments in `src/app/services/new/CreateForm.tsx` and `src/app/services/[id]/EditForm.tsx`. 

### 1. Label Adjustments (Hymns)
- **Bible Talk Section:** Change the label for Song 1 to **"Opening Song"** and Song 2 to **"Closing Song"**.
- **Divine Worship Section:** Change the label for Song 3 to **"Opening Song"** and Song 4 to **"Closing Song"**.

### 2. Autocomplete Functionality
- **Issue:** The song autocomplete/dropdown was reported as "belum jalan" (not working). 
- **Action:** Fix and ensure that the `HymnNumberAutocomplete` component correctly opens, filters based on user input, and sets the selected hymn number properly when clicked. (Check if `CommandGroup` or similar is missing logic, or if popover z-index/focus is breaking).

### 3. Section Grouping & Nesting
- **Sermon inside Divine Worship:** Move all Sermon-related fields (Sermon Speaker, Sermon Graphic URL, Closing Prayer) **INSIDE** the "Divine Worship" card. Do not use a separate card for the Sermon. You can use visual separators (like `<Separator />` or subheadings) inside the card to distinct the Sermon block.
- **Family of the Week:** Ensure "Family Photo URL" and "Family Prayer Request" are grouped together in a single section/card titled **"Family of the Week"**.
- **Youth of the Week:** Ensure "Youth Photo URL" and "Youth Prayer Request" are grouped together in a single section/card titled **"Youth of the Week"**.

### 4. Parse Button Placement
- **Current state:** The `[Parse]` button is positioned at the top-right of the Raw Rundown Text area.
- **New state:** Move the `[Parse]` button to the **bottom-right** of the Raw Rundown Text section/card.

## Guardrails
- **Do not** change the data payload structure or how `parseRundown` works.
- Maintain the Shadcn UI `Card` aesthetic. 
- Ensure that these layout changes are applied to **both** `CreateForm.tsx` and `EditForm.tsx` (or their shared sub-components if applicable).

## Tasks / Subtasks

- [x] Hymn labels → Opening Song / Closing Song (Bible Talk + Divine Worship) on Create + Edit
- [x] Fix HymnNumberAutocomplete (portal; Card `overflow-hidden` was clipping dropdown)
- [x] Nest Sermon block inside Divine Worship; Family/Youth of the Week cards with photo + prayer
- [x] Move Parse button to bottom-right of Raw Rundown section (Create + Edit)

## Dev Agent Record

### Agent Model Used
Cursor Grok 4.5 (bmad-dev-story / Amelia)

### Completion Notes List
- Root cause of broken autocomplete: shadcn `Card` uses `overflow-hidden`, clipping absolute dropdowns. Fixed via `createPortal` + fixed positioning.
- Layout tweaks applied to CreateForm and EditForm; no payload/parser changes.

### File List
- `src/components/HymnNumberAutocomplete.tsx`
- `src/app/services/new/CreateForm.tsx`
- `src/app/services/[id]/EditForm.tsx`
- `_bmad-output/implementation-artifacts/stories/14-3-worship-web-input-ui-tweaks.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log
- 2026-07-19: Implemented Story 14.3 UI tweaks; status → review.
