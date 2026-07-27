---
title: '6.1 Persistent Announcement List (FR-3)'
type: 'feature'
created: '2026-07-18'
status: 'done'
baseline_revision: 'd2cc518'
final_revision: 'c049431'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-6-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/stories/6-1-persistent-announcement-list.md'
warnings: []
---

<intent-contract>

## Intent

**Problem:** Announcements are only per-service `images_payload` arrays. FR-3 needs a persistent ordered Announcement List (recurring across weeks + one-offs per Service).

**Approach:** Add SQLite `announcement_items`, hub + API CRUD (add/replace/remove/reorder), resolve URLs for PPTX Part C from the list (recurring ∪ one-offs for that service). Do not import KJV/bible data.

## Boundaries & Constraints

**Always:**
- Image refs via `isSafeImageUrl` / `coerceImageUrls`: remote http(s) **or** hub-local `/api/uploads/<32-hex>.(jpg|jpeg|png|gif|webp)` (Epic 13.3).
- Reject video/MP4 URLs.
- Empty resolved list ⇒ zero announcement flyer slides.
- Recurring items (`service_id` NULL) persist across Services; one-offs tie to `service_id` and cascade on Service delete.
- Keep `.work/tp_bible_*` unused by the app.

**Block If:**
- None for this MVP (picoclaw-shaped announcement ops can be a thin JSON field on webhook later).

**Never:**
- Import KJV / bible books/verses into SQLite.
- Implement Admin/Operator accounts (Story 6.2).
- Full SSRF allowlist domains (Story 6.7) beyond http(s) filter.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Empty list | No rows | PPTX Part C has no flyer slides | No error |
| Recurring only | 2 recurring URLs | Both appear every Service PPTX in sort order | Skip unsafe URLs |
| One-off | one_off for service 5 | Appears only when generating service 5 | Cascade delete with service |
| Replace | PUT new ordered list | PPTX uses new order | 400 on invalid body |
| Video URL | `.mp4` URL | Rejected / not stored | 400 |

</intent-contract>

## Code Map

- `src/lib/db/index.ts` -- create `announcement_items` table
- `src/lib/announcements.ts` -- resolve URLs for a service; CRUD helpers
- `src/app/api/announcements/route.ts` -- GET list, POST add, PUT replace-all
- `src/app/api/announcements/[id]/route.ts` -- PATCH/DELETE item
- `src/app/api/services/[id]/pptx/route.ts` -- use resolved announcement URLs
- `src/app/api/webhook/route.ts` -- optional `announcements` array to replace one-offs for new/updated service
- `src/app/announcements/page.tsx` -- hub UI manage list
- `src/app/page.tsx` -- link to Announcements
- `src/app/services/[id]/page.tsx` -- show resolved flyers for service
- sprint-status + story 6-1 → done when shipped

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/db/index.ts` -- create `announcement_items` schema -- FR-3 persistence
- [x] `src/lib/announcements.ts` -- helpers resolve/list/replace/delete -- single place for rules
- [x] `src/app/api/announcements/route.ts` + `[id]/route.ts` -- CRUD API -- hub + agents
- [x] `src/app/api/services/[id]/pptx/route.ts` -- Part C from resolved list (fallback `images_payload` if list empty) -- backward compat
- [x] `src/app/api/webhook/route.ts` -- accept optional announcements for one-offs -- FR-1 bridge
- [x] `src/app/announcements/page.tsx` + hub link -- operator manage UI
- [x] `src/app/services/[id]/page.tsx` -- show resolved announcement URLs -- visibility
- [x] sprint + story 6.1 status -- tracking
- [x] `npm run build` -- verify compile
- [x] unit smoke: empty list / add recurring / PPTX count -- I/O matrix

**Acceptance Criteria:**
- Given empty Announcement List, when PPTX generated, then no flyer slides from announcements.
- Given ordered recurring items, when any Service PPTX is generated, then flyers appear in that order.
- Given operator DELETE/PUT replace, when next PPTX runs, then Deck matches the updated list.
- Given `.mp4` URL, when POST announcement, then 400 and not stored.
- Given this change, when inspecting schema/code, then no bible/kjv tables or imports exist.

## Spec Change Log

### 2026-07-19 — Epic 13.3 local uploads
- **Always** updated: announcement `image_url` may be a hub-local `/api/uploads/...` path in addition to remote http(s).
- See `spec-13-hub-ux-and-liveserver-gap.md` / story `13-3-local-announcement-uploads.md`.
- PPTX resolves local refs from `UPLOADS_DIR` on disk.

## Review Triage Log

### 2026-07-18 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 8: (high 0, medium 5, low 3)
- defer: 3: (high 0, medium 2, low 1)
- reject: 6
- addressed_findings:
  - `[medium]` `[patch]` Webhook retry duplicated one-offs → replace one-offs for service (idempotent)
  - `[medium]` `[patch]` Service upsert + announcements not atomic → single DB transaction
  - `[medium]` `[patch]` `isVideoUrl` false-positive on `?v=clip.mp4` → pathname-only check
  - `[medium]` `[patch]` `announcements: null` silently ignored → 400
  - `[medium]` `[patch]` Replace-all UI forced `service_id: null` → preserve scope when URL matches prior row
  - `[low]` `[patch]` Malformed JSON → 400 instead of 500
  - `[low]` `[patch]` Non-integer `sort_order` / junk `service_id` silently coerced → strict validate
  - `[low]` `[patch]` UI list stale after `router.refresh` → sync `initialItems` via `useEffect`

## Design Notes

Resolved URLs for service S = recurring items ∪ one_off where `service_id = S`, ordered by `sort_order`, `id`. Fallback to legacy `images_payload` only when resolved list is empty so old Services keep working. Webhook `announcements` replaces (not appends) one-offs for that service so retries stay idempotent.

## Verification

**Commands:**
- `npm run build` -- success
- `node scripts/smoke-announcements.mjs` -- success (empty / recurring / one-off / cascade / reject mp4 / no bible tables)

## Auto Run Result

Status: done

**Summary:** Persistent Announcement List (FR-3) with SQLite `announcement_items`, hub CRUD UI, API, PPTX Part C resolution (legacy `images_payload` fallback when list empty), and webhook one-off replace. KJV/bible dumps remain unused — not imported into the database.

**Files changed:**
- `src/lib/db/index.ts` — `announcement_items` + `foreign_keys`
- `src/lib/announcements.ts` — resolve/CRUD/replace one-offs
- `src/app/api/announcements/*` — GET/POST/PUT/PATCH/DELETE
- `src/app/api/services/[id]/pptx/route.ts` — resolved images
- `src/app/api/webhook/route.ts` — optional `announcements`
- `src/app/announcements/*` — hub manager UI
- `src/app/page.tsx` / `src/app/services/[id]/page.tsx` — links + flyer preview
- `scripts/smoke-announcements.mjs` — smoke checks
- tracking: sprint-status, story 6-1, epic-6-context, this spec

**Review:** 8 patches applied; 3 deferred; 6 rejected (noise / intentional Design Notes / out of MVP). Follow-up review recommended: false.

**Residual risks:** Dual path (list vs legacy EditForm) until operators migrate; video detection is extension-based only.
