# Story 14.1: Worship Web Input Forms & API

Status: done

## Description
As an operator,
I want to create and edit service inputs via a web form,
So that I can customize worship details (family/youth photos, announcements) directly in the hub.

## Context
This story was retroactively created to track the work done in commit `b679ff7`, which implemented the Worship Web Input Boundary. The previous execution bypassed the Epic and Story creation phase, jumping directly from PRD updates to Spec creation and then massive coding (`CreateForm.tsx`, `EditForm.tsx`, and API routes).

Code-review patches from `e2ed0ce..f049d32` were applied 2026-07-19 to align implementation with SPEC/`form-fields` and product decisions (CAP-4 second record, Slide 56 combined, announcement master non-wipe, client hymn preload).

## Acceptance Criteria
- [x] Web create/edit forms collect SPEC companion fields: raw rundown, song overlays, verse reading, sermon speaker, special song, closing prayer, split family/youth prayer + photos, participantsRaw, announcements (master + one-off).
- [x] Announcement sync preserves master when unchanged; one-offs can be interleaved; master editable from worship form without leaving the page.
- [x] `POST /api/services` creates a new row; date collision returns 409 + `existingId`; proceed uses `allowSecond` (second record, no overwrite).
- [x] `PUT /api/services/[id]` updates with `updated_at` concurrency; returns `failedHymnNumbers`.
- [x] CAP-5 preview uses `buildSlidePlan` on create and edit; Slide 56 combines family+youth.
- [x] Hymn helper uses client-side preloaded SDAH index (page `hymnIndex`).
- [x] Unit tests cover structured overlays, announcement non-wipe, and `participants_payload` (`tests/services-create.test.mjs`).

## Retrospective Note
The BMad workflow was restored by `bmad-correct-course` on 2026-07-19. This story closes the gap between the implemented codebase and the planning artifacts.

### Review Findings

_Code review `e2ed0ce..f049d32` (2026-07-19) — Blind Hunter + Edge Case Hunter + Acceptance Auditor._

#### Decision-needed (resolved 2026-07-19)
- [x] [Review][Decision] Source of truth → **1a** code follows SPEC/`form-fields` @ `f049d32`
- [x] [Review][Decision] CAP-4 collision → **2a** proceed = insert second record; remove blind overwrite
- [x] [Review][Decision] Youth photo / `buildSlidePlan` → **3c** combine family+youth on Slide 56; amend SPEC constraint for this planner change
- [x] [Review][Decision] Announcements → **product rule:** default inherit master unchanged; worship form may edit master in-place and insert one-offs; persist via `announcement_items`
- [x] [Review][Decision] Hymn search → **5a** client preload 695; forms use `hymnIndex` prop

#### Patch (applied 2026-07-19)
- [x] [Review][Patch] Align CreateForm/EditForm/API to SPEC companion fields
- [x] [Review][Patch] CAP-4: remove overwrite; allowSecond INSERT; fix `rows`→`services`
- [x] [Review][Patch] Slide 56 combined family+youth; amend SPEC constraint
- [x] [Review][Patch] Announcement save must not wipe master when unchanged (`syncWorshipAnnouncements`)
- [x] [Review][Patch] Worship UX + amend `form-fields.md` to `announcement_items`
- [x] [Review][Patch] Hymn autocomplete: client preload via `hymnIndex`
- [x] [Review][Patch] Announcement writes use `assertAnnouncementImageUrl`
- [x] [Review][Patch] Unsafe image URL → 400
- [x] [Review][Patch] Missing date → 400 (no UTC today)
- [x] [Review][Patch] Surface `failedHymnNumbers` on create/preview + UI
- [x] [Review][Patch] Preview abort/sequence guard
- [x] [Review][Patch] Edit path CAP-5 slide preview
- [x] [Review][Patch] Preview flyer source matches persist path (`announcements[]`)
- [x] [Review][Patch] Tests cover non-wipe + second-record DB insert
- [x] [Review][Patch] Fix addendum PART C table markdown
- [x] [Review][Patch] Edit 409: sync form from refreshed props
- [x] [Review][Patch] Concurrent conflict after delete → 404
- [x] [Review][Patch] Remove dead `isSafeImageUrl` import
- [x] [Review][Patch] Update Story 14.1 AC to match SPEC

#### Deferred
- [x] [Review][Defer] Duplicate-date race without UNIQUE(`services.date`) — deferred; 2a allows multiple rows same date by design
- [x] [Review][Defer] PUT edit date collision warn — deferred; create CAP-4 is primary
- [x] [Review][Defer] Fat route handlers / `any` — deferred, style debt follow-up

### Review Findings (re-run uncommitted vs `f049d32`, 2026-07-19)

_Prior criticals (master wipe-on-every-save, `collData.rows`, overwrite, docs≠code) verified fixed. New residual findings below._

#### Decision-needed (resolved)
- [x] [Review][Decision] Empty master wipe → **1b** refuse wiping global master to empty unless `clearMaster: true`

#### Patch (applied 2026-07-19 re-run)
- [x] [Review][Patch] `syncWorshipAnnouncements` + `clearMaster` guard + form confirm UX
- [x] [Review][Patch] PUT applies structured overlays after re-parse even when raw changes
- [x] [Review][Patch] Clear stale `familyYouth` when split prayer fields saved; Slide 56 fallback fixed
- [x] [Review][Patch] `allowSecond` strict boolean `true`
- [x] [Review][Patch] Hydrate song1–4 from parsed hymn buckets on edit
- [x] [Review][Patch] Clear create collision warning when date missing/changes
- [x] [Review][Patch] Prune `failedHymnNumbers` on song overlay replace
- [x] [Review][Patch] Song overlay inserts into correct BT/DS section
- [x] [Review][Patch] `participantsRaw` non-string → 400
- [x] [Review][Patch] Photo URLs require image extension
- [x] [Review][Patch] Preview error clears stale plan/collision
- [x] [Review][Patch] Edit raw textarea collapsible
- [x] [Review][Patch] PUT success path 404 if row missing
- [x] [Review][Patch] Tests: clearMaster + Slide 56 combined plan

#### Deferred (re-run)
- [x] [Review][Defer] Concurrent POST date TOCTOU without UNIQUE — deferred, pre-existing / by CAP-4 design
- [x] [Review][Defer] Full `hymnIndex` embedded in page HTML (~695) — deferred, follows decision 5a; optimize later if needed
