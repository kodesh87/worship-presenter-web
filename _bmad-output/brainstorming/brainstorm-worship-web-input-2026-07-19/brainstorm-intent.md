# Brainstorm Intent: Worship Web Input Boundary

**Source:** Brainstorm Party session 2026-07-19
**Topic:** Web boundary for creating and editing worship service records — second channel alongside deferred Telegram/PicoClaw

---

## Core Intent

Build a web-based input channel that allows operators to create and edit worship service details directly through the existing Next.js web application, independent of the Telegram/PicoClaw webhook channel.

## Key Design Decisions

### Data Architecture
- Web form produces `ParsedRundown` JSON directly — writes to `parsed_data` column without generating synthetic `raw_payload`
- `raw_payload` for web-created services is set to an honest marker string (e.g., `"[Created via web form]"`) for traceability
- Downstream consumers (slide-plan, PPTX generator, presenter) remain untouched — they already read `ParsedRundown`

### Routes & UI
- **Create:** New route at `/services/new` with `WorshipForm` component
- **Edit:** Enhanced existing `/services/[id]` EditForm with toggle between raw textarea mode and structured field mode
- Both routes produce identical `ParsedRundown` shape as webhook output

### Form Fields (WorshipForm)
- Date picker (with existing-service collision check)
- Dynamic hymn list (add/remove) with autocomplete from `hymns` table — search by SDAH number or title
- Theme verse (`themeVerse`) — scripture reference with optional inline KJV resolution
- Verse reading (`verseReading`) — same pattern
- Sermon — speaker name + title
- Special song (`specialSong`)
- Closing prayer person (`closingPrayerPerson`)
- Family/Youth moment (`familyYouth`)

### Backend Integration
- `POST /api/services` — extend to accept structured JSON body with `source: "web"` field
- `PUT /api/services/[id]` — already supports field patches via `coerceStructuredFields` + `applyStructuredFields`
- Hymn search API — new endpoint or extend existing, query `hymns` table by number or title substring
- Date collision check — on create, check for existing service with same date; surface warning to operator

### Validation & Concurrency
- Real-time field-level validation
- Honor existing optimistic locking (`updated_at` column, 409 on stale write)
- Web form fetches `updated_at` on load, sends it back on save

### Auth
- Existing session auth (operator + admin roles) — no new role needed

### Preview
- Reuse slide-plan rendering for live preview — operator sees what the projector will show before saving

## Scope Boundaries
- Telegram/PicoClaw channel is deferred — no changes to webhook path
- Announcements attachment is a separate step (link to existing AnnouncementsManager)
- No collaborative editing or draft staging table in first version
- No mobile-specific UI in first version (responsive design sufficient)

## Reuse Surface
- `coerceStructuredFields()` + `applyStructuredFields()` — field patch logic
- `POST /api/services` + `PUT /api/services/[id]` — existing API routes
- `hymns` table (695 entries) — autocomplete source
- `updated_at` optimistic concurrency — existing pattern
- Service detail preview component — reuse for create form preview
- EditForm textarea + parse preview pattern — extend with structured mode toggle
