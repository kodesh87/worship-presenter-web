---
id: SPEC-worship-web-input
companions:
  - form-fields.md
  - edit-page-chrome.md
sources:
  - ../../brainstorming/brainstorm-worship-web-input-2026-07-19/brainstorm-intent.md
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability only — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Worship Web Input

## Why

**A pain to solve.** Operators currently depend entirely on the Telegram → PicoClaw → webhook pipeline to create worship service records. When that pipeline is not configured, unavailable, or when the operator has the rundown information from a planning meeting, there is no way to enter worship details into the system. The Telegram channel remains in-scope but is not yet active. An operator-facing web creation form inside the Web Hub removes this single-channel dependency, allowing operators to create or edit a worship service directly via the web. Operator testing of `/services/[id]` found the route still behaves as a show/run-sheet that diverges from create, lacks a clear create-parity edit form, keeps redundant Order of Service chrome, and jumps header/content width versus dashboard — those must be corrected so the web channel stays trustworthy day-to-day.

## Capabilities

- **CAP-1**
  - **intent:** Operator can create a new worship service by providing the **Raw Rundown Text** and clicking **[Parse]** to extract data into optional **Structured Fields** via a creation form at `/services/new`.
  - **success:** The operator pastes the text, clicks Parse, and the system extracts the Date, Hymns, Sections, and Roles into the structured overlays. The operator can then manually adjust the overlays before saving. The service is visible in the dashboard and can generate a PPTX.

- **CAP-2**
  - **intent:** Operator can edit an existing service's raw rundown text and/or structured fields on `/services/[id]` via a working edit form (required), saving through the existing PUT path with optimistic concurrency.
  - **success:** The operator changes raw and/or structured fields and saves; `parsed_data` and `raw_payload` update in the database and `updated_at` advances. Stale `updated_at` returns 409. A show-only run-sheet without this edit form is not acceptable.

- **CAP-3**
  - **intent:** The system extracts the Service Date, Hymns (by SDAH Number), and participant roles from the **Raw Rundown Text** when the operator clicks Parse. Hymn fields use autocomplete dropdowns searching the hymnal index.
  - **success:** Parsing extracts data from the raw text into the structured overlays. Valid hymn lyrics are resolved from the `hymns` table and can be searched via autocomplete. Invalid hymn numbers do not block creation but are marked as incomplete.

- **CAP-4**
  - **intent:** System warns the operator when creating a service for a date that already has a service record, and offers to navigate to that existing service for editing instead.
  - **success:** Selecting a date that matches an existing `services.date` value displays a warning with a link to the existing service. The operator can choose to proceed (creating a second record) or navigate away. No silent duplicate.

- **CAP-5**
  - **intent:** Operator can preview how the worship service will appear on the projector before saving.
  - **success:** A preview panel renders the current form state through the same `buildSlidePlan` logic used by the presenter and PPTX generator. The preview updates as form fields change.

- **CAP-6**
  - **intent:** Operator can enter scripture reference for the verse reading, with optional inline text resolution from the KJV database.
  - **success:** Typing a valid reference (e.g., "Acts 18:9,10") into the scripture reference field and clicking Resolve KJV triggers a lookup via `GET /api/scripture?ref=` and displays the resolved KJV text. The reference and text are stored as `ParsedScripture` in `parsed_data`. When the KJV corpus is not imported, the API returns an actionable error (not a silent generic miss). Ops load data with `npm run import:kjv`.

- **CAP-7**
  - **intent:** The `/services/[id]` surface must present the same worship form field set, section grouping, labels, and controls as create (`/services/new`), plus a working edit form; the route may add only service-scoped chrome listed in `edit-page-chrome.md`.
  - **success:** Side-by-side comparison of create and `/services/[id]` form bodies shows identical overlay sections and field labels in this order: Bible Talk → Divine Worship (songs + Special Song) → **Sermon** (own Card: speaker, closing prayer, sermon graphic) → Family of the Week → Youth of the Week → Announcement Flyers, plus Parse placement. Sermon is not nested inside Divine Worship. Differences are limited to save/concurrency behavior and the kept chrome actions.

- **CAP-8**
  - **intent:** The app shell header and main content column width remain visually stable when the operator navigates among `/`, `/services/new`, and `/services/[id]`; create and `/services/[id]` share the same shell.
  - **success:** Switching among those three routes does not cause a perceptible jump in header alignment or content column width (including when page content height toggles the vertical scrollbar).

## Constraints

- Web-created services require a non-empty **Raw Rundown Text** to be saved in the `services.raw_payload` column. This raw text acts as the single source for both the rundown and the participant list.
- Downstream consumers `generatePptx`, `PresenterOperator`, and `ProjectorClient` must not gain a separate slide-order source. `buildSlidePlan` remains the single planner; the web-input feature may extend it only for Slide 56 (combined Family & Youth: prayer texts + family/youth photos). The web form's `ParsedRundown` output must remain compatible with what `parseRundown()` + `normalizeParsedRundown()` produce.
- Create-date collision (CAP-4): warn with `existingId`; proceed means insert a **second** service row for the same date (`allowSecond`), never blind overwrite. Edit saves keep optimistic concurrency via `updated_at` (409 on stale write) on `PUT /api/services/[id]`.
- Auth uses existing session cookie mechanism. Both `operator` and `admin` roles can create and edit services. No new role or permission model.
- No new database tables. The `services` table schema is sufficient. A `POST` handler is added to `/api/services` (currently only GET exists there; creation is in `/api/webhook`).
- Create form and `/services/[id]` form body must stay in lockstep (labels, section grouping, Parse placement); drift is a defect. Section order is Bible Talk → Divine Worship → Sermon (separate Card) → Family of the Week → Youth of the Week → Announcement Flyers. A working edit form on `/services/[id]` is required.
- Edit-page chrome keep/remove rules in `edit-page-chrome.md` are binding: Order of Service read-only card is removed; Preview, Present, Delete Service, Download PPTX, and Announcement flyers **Manage list** remain. The read-only Announcement flyers strip above the form stays unchanged this pass.

## Non-goals

- Changes to the Telegram/PicoClaw webhook channel. That channel is deferred and out of scope.
- Collaborative real-time editing (multiple operators editing the same service simultaneously with live sync).
- Draft or staging workflow (a `worship_drafts` table or similar). Services are saved directly.
- Mobile-specific UI beyond responsive design. No dedicated mobile layout or PWA features.
- Video uploads or editing flyer image files themselves. The form manages the ordered list of image URLs/paths and flags their scope (modifying the master list vs week-specific one-off).
- Copy-from-previous-service functionality (identified in brainstorm but deferred to a follow-up).
- Restoring a separate read-only **Order of Service** list on `/services/[id]` as an operator surface (raw rundown + Live Slide Preview already represent order).
- Redesigning or removing the read-only Announcement flyers strip above the `/services/[id]` form in this pass.

## Success signal

An operator who attends a worship planning meeting can open the web app on their laptop, create next Sabbath's service record in under 3 minutes with all hymns, scripture reading, sermon speaker, family/youth slides, and roles filled in, see a slide preview that matches what will display on the projector, and save it — without anyone sending anything to the Telegram bot. Returning later to `/services/[id]` shows the same form as create (plus the kept service actions), with a working edit/save path, without Order of Service chrome, and without header/width jumps versus dashboard or create.

## Assumptions

- The `hymns` table is fully populated with 695 SDAH entries and does not require import as part of this feature.
- Structured mode is the default form view, with the raw text editor placed in a collapsible section.
- `parseRundown()` output and the structured-form-produced `ParsedRundown` are consumed identically by `buildSlidePlan` — no format variations exist beyond what `normalizeParsedRundown()` already handles.
- Hymn searching/autocomplete in the form is performed client-side using a preloaded index of the 695 SDAH entries.
- One-off flyer URLs added to the form are assumed to be already uploaded via the separate upload endpoints; the form does not handle file syncing.
- Service Highlights and Order of Service cards on `/services/[id]` are removed. Unmapped Content remains unless later directed.
- `EditForm` (or equivalent) may already exist in the codebase, but the operator-facing `/services/[id]` surface still reads as a show/run-sheet; the contract requires a create-parity form with working edit regardless of current implementation state.
