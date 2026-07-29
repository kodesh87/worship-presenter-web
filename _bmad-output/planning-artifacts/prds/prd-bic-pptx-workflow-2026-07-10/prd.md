---
title: BIC Worship Presentation Automation
status: active
created: 2026-07-10
updated: 2026-07-29
---

# PRD: BIC Worship Presentation Automation
*Working title — confirm.*

## 0. Document Purpose

This PRD is for the solo developer/maintainer (kodesh87) who will build and run all three layers of this system, and for any downstream workflow (architecture, epics, stories) that needs a stable specification. It builds on — and does not duplicate — the existing **Product Brief** (`brief.md`), its **Addendum** (operational detail: workflows, actors, sample input), and the **source PPTX structural digest** (`source-pptx-structure.md`, the anatomy of the current 68-slide deck). Those live in `_bmad-output/planning-artifacts/briefs/brief-bic-pptx-workflow-2026-07-10/` and remain authoritative for the *why*; this PRD is authoritative for *what must be true*. This PRD's own **`addendum.md`** (same folder as this file) holds the user-authored annotated 68-slide operational map — the authoritative deck blueprint feeding UX and architecture.

Structure: vocabulary is anchored in the **Glossary** (§3) and used verbatim throughout. Features (§4) are grouped, each with nested globally-numbered Functional Requirements (FR-N) carrying testable consequences. Scope is sequenced into **Delivery Phases** (§6): **Phase 1 is the MVP and the only committed phase**; Phases 2–6 are specified increments built only if Phase 1 proves valuable. Cross-cutting non-functional requirements, constraints, and dependencies have their own sections (§9–§11). Inferred decisions are tagged inline `[ASSUMPTION: ...]` and indexed in §12. Implementation mechanism (transport shapes, PPTX-generation library, API contracts) is intentionally excluded — it belongs in the architecture document and the addendum.

## 1. Vision

BIC (Bandung International Community, a Seventh-day Adventist church) presents a ~68-slide deck every Sabbath. Today one volunteer rebuilds it by hand each week, duplicating last week's PowerPoint and swapping in the new songs, participants, posters, and announcements — roughly an hour of a skilled person's time, ~52 hours a year, that only one person knows how to do and that resists last-minute change.

This product turns that weekly rebuild into a **generated artifact**. The events department sends the week's rundown to a Telegram chat, exactly as they already coordinate. An agent (picoclaw) reads it and hands the structured inputs to the app's API; the app validates hymn numbers against the SDA Hymnal database, resolves the lyrics, and assembles the presentation from BIC's fixed template skeleton and the week's variable content. Each dated **Service** appears in a password-protected web hub for Friday review, quick edit-and-regenerate when something is wrong or changes late, and an offline PPTX download that keeps the Sabbath independent of venue internet.

The bet is deliberately modest — and deliberately narrow. Phase 1 ships the smallest thing that is immediately usable: rundown in, correct offline deck out, editable, behind a login. Everything else (web slideshow, Telegram corrections, retention cleanup, presenter mode, scripture display) is specified but contingent: built only after Phase 1 has proven its value in real weekly use. If it sticks, it saves a skilled volunteer ~52 hours a year, widens the pool of people who can run a service from one person to the whole rotation, and becomes the first wedge in a broader aim: automating the church's mechanical work so its people can spend their energy on reaching others.

## 2. Target User

### 2.1 Jobs To Be Done

- **Operators / Multimedia Team** — "Let me run a Sabbath service without first having to learn how to build a 68-slide deck." (functional + social: serving without a specialist barrier)
- **Operators (as Reviewer)** — "Let me confirm on Friday that this week's service is correct, and fix it fast if it isn't — including a late song swap on Saturday morning." (functional + emotional: confidence, not anxiety)
- **Bimo (current builder)** — "Give me back the weekly hour and get me out of the data-entry role; let me serve at a higher leverage." (emotional + functional)
- **Events Department (contributors)** — "Let me hand off the week's participants, songs, posters, and announcements as easily as sending a chat message." (functional: zero specialist tooling)
- **Admin (the maintainer)** — "Let me manage who can access what without babysitting the system weekly." (functional: low-touch operation)
- **Solo developer/maintainer** — "Let me fully own the template and build a foundation I can extend to the church's next mechanical burden." (functional + personal: ownership and learning, named honestly)

### 2.2 Non-Users (v1)

- **The congregation** — never touches the tool; a beneficiary (fewer typos, fewer stale-content slips, services that absorb late changes), not a user.
- **Other churches** — v1 automates BIC's single workflow only; per-church configurability is deferred to the vision.
- **Software collaborators** — none in v1; the developer is the only builder/maintainer.

### 2.3 Key User Journeys

- **UJ-1. Sari from the events department sends the week's rundown and the service assembles itself.** *(Phase 1)*
  Sari coordinates the week's program. On Wednesday she types the rundown into the events Telegram chat as she always has — sections, timings, roles by name, songs as `SDAH #159`, "Special Song: -" when there's none — and attaches the finished poster images. She never opens presentation software. picoclaw reads the messages and calls the API; the app validates each hymn number against the Hymnal Database, resolves the lyrics, applies her announcement instructions to the persistent announcement list, and assembles the deck. Minutes later a new dated **Service** exists in the web hub. **Edge case:** if a song number isn't valid in the Hymnal Database, the Service is still created but that Song Block is flagged as incomplete, and picoclaw can tell Sari which number failed.

- **UJ-2. Bimo reviews Friday and fixes a wrong song in the web app.** *(Phase 1)*
  Bimo, who used to spend an hour building the deck, now opens the web hub on Friday, signs in with his account, and picks this Sabbath's Service. In under ten minutes he checks the Run-Sheet and the Service's data — participants, songs, posters — against what events sent, and downloads the PPTX for a spot-check. He spots that the closing song is wrong. He edits the song number in the web form, clicks regenerate, and the deck rebuilds in place. He downloads the fresh offline PPTX to the presentation laptop ahead of Sabbath. **Resolution:** the Service is correct; the offline artifact is on the machine that will present it.

- **UJ-3. A last-minute song swap comes in Saturday morning via Telegram.** *(Phase 3)*
  Saturday, 08:40. The song leader messages the events chat: the divine-service opening song is changing. picoclaw proposes the nearest upcoming Sabbath as the target Service, asks for confirmation (an explicit date also works), then updates the Song Block. The reviewer regenerates and re-downloads the PPTX in under five minutes. *(Until Phase 3 ships, the same fix takes one Operator a couple of minutes in the web form — UJ-2's path.)*

- **UJ-4. Elen, new to the rotation, presents on Sabbath offline.** *(Phase 1; richer in Phases 2 & 5)*
  Elen has never built a deck. She's scheduled on the presentation computer today. The venue internet is unreliable, but the PPTX was downloaded Friday, so nothing depends on it. In **Phase 1** she presents from the offline PPTX — full-screen on the projector, captured by OBS — with the web Run-Sheet open on her phone or laptop for the order of service. Once **Phase 2** ships she can alternatively present from the browser full-screen; once **Phase 5** ships she gets dual-screen **Presenter Mode**: projector clean, her screen showing current/next slide, the Run-Sheet, and the participant list. Either way she advances a linear deck with a single elegant fade. **Resolution:** the service runs start to finish without her needing to know how the deck was built.

- **UJ-5. Bimo creates a new service directly in the web app.** *(Phase 1)*
  When the Telegram channel is not yet configured or when there is an outage, Bimo can open the web hub, click "+ New Service", paste the raw rundown text, add sermon and family/youth details directly in the form, and click "Create". The system parses the raw text, resolves hymns, checks for date collision, and creates the Service in the library. **Resolution:** the Service is successfully created from the web interface.

## 3. Glossary

*Downstream workflows and readers use these terms exactly. FRs, UJs, and SMs use Glossary terms verbatim; introducing a synonym is a discipline violation. When §4 introduces a new domain noun, it is added here in the same pass.*

- **Service** — One dated weekly worship event, and the unit the system manages. Each Service owns one Weekly Data Payload, one generated Deck, one Run-Sheet, and its uploaded images. Listed by date in the Web Hub.
- **Rundown** — The semi-structured plain text the Events Department sends to Telegram describing one Service's full order of service (sections, timings, roles by name, songs by number, announcement instructions). The raw input picoclaw parses.
- **Order of Service** — The full ordered sequence of program steps for a Service (every role, name, song with number, and timing). Rendered to operators as the Run-Sheet; a subset of it drives the Deck.
- **Weekly Data Payload** — The structured variable content for one Service after interpretation: date/week identifier; the four main Hymns (SDAH Number, validated and resolved by the app); Verse Reading reference + text; sermon speaker + sermon graphic / flyer; closing-prayer person (derived from the sermon speaker); Special Song presence/performer (or none); family/youth-of-the-week family photo + family prayer request text + youth photo + youth prayer request text; announcement instructions against the Announcement List (recurring vs one-off); and the full participant/role/timing data for the Run-Sheet. Distinct from the fixed Template Skeleton.
- **Template Skeleton** — The fixed portion of BIC's deck, identical week to week: welcome frames, agenda/Sequence slides, dividers, intercessory-prayer liturgy and response songs, standing closing response and reflection, offering/bank info, midweek-meeting slide, fellowship etiquette, closing/contact frames.
- **Deck Blueprint** — The authoritative mapping of every slide position in BIC's deck to fixed-vs-payload status and its Slide Type (§4.2; full annotated map in this PRD's `addendum.md`).
- **Slide Type** — A templated slide category the generator can emit: welcome, agenda/Sequence, divider, song-title, lyric, scripture, sermon, offering, family/youth, announcement-image, closing.
- **Song Block** — One song rendered as 1 song-title slide + K lyric slides. Each verse starts a new slide and each Reff starts a new slide; text too long for one slide splits across additional slides for readability. K = f(verse count, Reff availability, readability splits). Some songs have no Reff.
- **Hymn** — A song identified by its SDAH Number, whose lyrics come from the Hymnal Database.
- **SDAH Number** — SDA Hymnal number (e.g., `SDAH #159` or bare `#671`), the key used to validate and resolve a Hymn.
- **Hymnal Database** — The SDA Hymnal lyrics data source (title + structured verses/refrain, keyed by SDAH Number), provided by the developer. An input dependency, not built in this project.
- **Verse Database** — A developer-provided **KJV-only** scripture data source powering the Scripture Display feature (§4.9). Independent of the Hymnal Database and never used for Deck slides.
- **Announcement List** — The persistent, ordered list of Announcement Assets the app maintains across weeks: recurring items stay until replaced or removed; one-off items are added for a single Service. Managed via the API (picoclaw) and the Web Hub.
- **Announcement Asset** — A pre-rendered poster/flyer **image** (video is out of scope), uploaded finished (Telegram/picoclaw **or** Web Hub local upload) and inserted into the Deck as-is on its own slide. Occasional, not weekly: many weeks have none beyond recurring items.
- **Deck** — The generated slide presentation for a Service, exported as an offline-capable PPTX file.
- **Web Slideshow** *(Phase 2)* — The in-browser full-screen rendering of a Service's Deck; single screen, no presenter view until Phase 5.
- **Presenter Mode** *(Phase 5)* — Dual-screen presentation: a clean full-screen output (projector, OBS-captured) plus an operator view (current slide, next slide, Run-Sheet, participant list). Provided natively by PowerPoint and replicated by the Web Slideshow in Phase 5.
- **Run-Sheet** — The web view of the full Order of Service for a Service, for operators to follow during the service.
- **Web Hub** — The password-protected web application: dated Service list (with search), shared Header (Announcements / Settings), review, edit, regenerate, download, delete, slideshow, and presenter.
- **picoclaw** — The agent (openclaw-type) that reads the Rundown from Telegram, uploads images, and calls the app's API to create or update a Service. It does **not** resolve lyrics itself.
- **Role** — An access level in the Web Hub. v1 defines two: **Admin** and **Operator**.
- **Admin** — The Role that manages accounts, Roles, and (Phase 4) retention configuration; full access.
- **Events Department** — The contributor group that sends each week's Rundown and images via Telegram. Members needing app access receive **Operator** accounts in v1 (no separate Role yet). Not the Multimedia Team.
- **Multimedia Team / Operators** — The end-user group (Operator Role) that reviews Services on Friday and presents them on Sabbath (two per rotation: one on the presentation computer, one on sound). Not software developers.
- **Reviewer** — An Operator performing the Friday review of a Service.
- **Retention Policy** *(Phase 4)* — An Admin-configured rule (default 2 months) that automatically deletes **only generated Decks (PPTX)** past the retention window. Services, participant text, posters, and all other data persist and are manual-delete only.

## 4. Features

*Each subsection is a coherent feature: behavioral description first, FRs nested, optional feature-specific NFRs/notes. FRs are numbered globally (FR-1…FR-N) for stable downstream reference; Delivery Phase per FR is assigned in §6. User Journeys referenced by ID inline.*

### 4.1 Telegram Intake & Agent Interpretation *(Phase 1)*

**Description:** The Events Department sends the week's Rundown and poster images to a Telegram chat as ordinary messages (realizes UJ-1). picoclaw reads them, parses the semi-structured text (section headers, timings, roles by name, songs as `SDAH #nnn` or bare `#nnn`, markers like `》` for spoken items and `[ ]` for song checkboxes, `"Special Song: -"` for an empty optional, `"The Speaker"` as a reference to the sermon speaker), uploads the images, and calls the app's API to create a Service with its Weekly Data Payload. picoclaw is an interpreter and courier — **hymn validation and lyric resolution happen inside the app** (FR-2), never in picoclaw and never via free-text web search. [ASSUMPTION: the Events Department sends the Rundown as text and attaches poster images to the same Telegram chat; picoclaw has access to both.]

**Functional Requirements:**

#### FR-1: Ingest a Rundown from Telegram into a structured Weekly Data Payload
picoclaw can read the week's Telegram messages and submit a structured Weekly Data Payload the API accepts. Realizes UJ-1.

**Consequences (testable):**
- Given the July 11, 2026 sample Rundown, the payload contains both sections (Bible Talk, Divine Service), all named roles and timings, the four main Hymns' SDAH Numbers, and the sermon speaker name.
- `"Special Song: -"` produces an explicit "none" — the Special Song divider is omitted, not rendered empty.
- The divine-service closing prayer resolves to the sermon speaker's name (Slide 40).
- Honorifics (Mrs./Mr./Ms.) and first-name-only names (e.g., "Aro") are preserved as given.
- A song written as `SDAH #159 The Old Rugged Cross` and one written as bare `#671 now dear Lord as we pray` are both recognized as SDAH Numbers.
- The intercessory prayer-response numbers (e.g., `#671`/`#684`) are recognized but map to the fixed Template Skeleton response-song slides — a standing pair, not payload, per the Deck Blueprint — not to additional Song Blocks.
- Verse Reading reference + text arrive as sender-supplied text; the theme verse slide (Slide 26) is fixed to John 4:23.
- Images (posters, sermon graphic / flyer, family photo, youth photo) are sent as a **sequence accompanied by the sender's textual description**; picoclaw uses that description to bind each image to its role and to order the Announcement List. An image whose role cannot be resolved, or a referenced-but-missing image, is **flagged for the Reviewer** — never silently dropped or left as a broken placeholder on a slide.
- After saving, picoclaw **reports the stored result back to the sender** — including each resolved Hymn title — so mistakes (including a valid-but-wrong SDAH Number, per FR-2) surface at submit time.
- A Service is keyed by its **date**: re-sending the Rundown for the same date **updates** that Service's Weekly Data Payload rather than creating a duplicate. (Phase 1 has no web-vs-Telegram concurrency guard — that is FR-13b, Phase 3 — so a re-send overwrites the current payload, including any prior web-form edits.)

#### FR-2: Validate and resolve Hymns by SDAH Number in the app API
The app's Service-input API validates each submitted SDAH Number against the Hymnal Database and resolves the Hymn's title and structured lyrics server-side, reporting validity back to the caller. Realizes UJ-1.

**Consequences (testable):**
- A valid SDAH Number yields a stored title and lyrics split into verse/refrain blocks from the Hymnal Database, in the same input call — no separate resolution step for picoclaw.
- An invalid/unknown SDAH Number does **not** block creation of the Service: the Service is created, that Song Block is marked incomplete, and the API response identifies the failing number so picoclaw can inform the sender.
- The API response echoes the **resolved Hymn title** for every song. A *valid-but-wrong* number (a mistyped number that resolves to a different real Hymn) is therefore catchable when picoclaw reports the saved result back to the sender (FR-1): the number is not treated as self-verifying, the resolved title is shown for human confirmation.
- No lyric text is ever sourced from a free-text web search, by picoclaw or by the app.

#### FR-3: Manage the persistent Announcement List
The app maintains an ordered, persistent Announcement List across weeks; picoclaw (and Operators via the Web Hub) can instruct which items stay, which are replaced or removed, which one-off items are added for a single Service, and in what order. Realizes UJ-1.

**Consequences (testable):**
- A recurring Announcement Asset appears in next week's Deck without being re-sent.
- A replace instruction swaps an existing item's image; a remove instruction drops it; an add instruction inserts a one-off item for the target Service only.
- The Deck renders announcement slides in the Announcement List's order.
- Only images are accepted; video/MP4 upload is rejected (out of scope — §5).
- Announcement Asset refs may be remote `http(s)` URLs (SSRF-hardened / optional host allowlist) **or** hub-local paths `/api/uploads/<id>.<ext>` after Operator upload via the Web Hub (`UPLOADS_DIR`); PPTX embeds local uploads from disk.
- The Announcement List can be directly managed (reordered, toggled recurring/one-off, added, or removed) from the Service edit and creation forms, reflecting changes live in the database `announcement_items` table.
- An empty Announcement List produces zero announcement slides (a normal week, not an error).

**Notes:** The picoclaw skill is customized to call the app's API. `[NOTE FOR PM]` The Telegram message shape is semi-structured and evolves; parser robustness is an ongoing concern, not a one-time spec.

### 4.2 Deck Generator (Presentation Assembly) *(Phase 1)*

**Description:** The generator assembles a Service's Deck from the fixed Template Skeleton plus the Weekly Data Payload, emitting the templated Slide Types in BIC's established order (realizes UJ-1, UJ-4). It rebuilds on a clean master template with real layouts rather than cloning last week's file. Only names already printed in the current deck go on slides; the full roster lives on the Run-Sheet (§4.7).

**Deck Blueprint (fixed vs payload).** The full annotated 68-slide map — including *when* each slide is shown during the service — is in this PRD's `addendum.md`; downstream workflows treat it as authoritative. Summary:

- **Part A — Bible Talk:** welcome, agenda, prayer-partners divider, opening-song divider *(fixed)* · **Song Block 1** *(payload)* · **Verse Reading** *(payload: reference + text)* · opening-prayer, bible-talk, closing-song dividers *(fixed)* · **Song Block 2** *(payload)* · closing-prayer divider, break + offering *(fixed)*.
- **Part B — Divine Service:** agenda *(fixed)* · **theme verse** *(fixed template slide: John 4:23)* · opening-song divider *(fixed)* · **Song Block 3** *(payload)* · intercessory-prayer dividers + standing response songs *(fixed — standing pair)* · Special Song divider *(conditional: only when the payload has a Special Song)* · **sermon speaker name** and **sermon graphic / flyer** *(payload)* · closing-song divider *(fixed)* · **Song Block 4** *(payload)* · **closing prayer** *(fixed, derived from sermon speaker's name)* · closing response "We Have This Hope", reflection *(fixed)*.
- **Part C — Announcements & Closing:** welcome repeat, offering & tithe, midweek prayer meeting, fellowship etiquette, welcome/closing, contact + WhatsApp QR *(all fixed/mandatory)* · **Family & Youth of the Week** *(payload: family photo, family prayer request text, youth photo, youth prayer request text)* · **announcement flyer slides** *(payload via Announcement List; 0..N, occasional)*.

**Functional Requirements:**

#### FR-4: Assemble a Deck from Template Skeleton + Weekly Data Payload
The generator can produce a complete Deck for a Service by combining the fixed Template Skeleton with the variable Weekly Data Payload, per the Deck Blueprint. Realizes UJ-1.

**Consequences (testable):**
- The Deck reproduces BIC's three macro-sections (Bible Talk, Divine Service, Announcements & Closing), each opened by its agenda/Sequence slide, in the established order.
- Fixed elements appear without requiring weekly input; payload-changeable slides render the Service's own data.
- Conditional slides behave per the Blueprint: no Special Song → no Special Song divider; empty Announcement List → no announcement slides.
- The generated file carries the Service's own date/week identifier as metadata; no stale prior-week metadata (e.g., "BIC PPT - May 31") is present.

#### FR-5: Render Song Blocks with readable lyric slides
The generator can render each Hymn as a Song Block: a song-title slide (title + "SDAH #nnn") followed by K lyric slides, where slide breaks are governed by structure **and readability**. Realizes UJ-1, UJ-4.

**Consequences (testable):**
- Each verse starts a new slide; each Reff starts a new slide.
- A verse or Reff too long to read comfortably on one slide splits across multiple slides — no over-full, cramped lyric slides.
- Songs without a Reff render verses only; when a Reff exists it repeats after each verse.
- Lyric slides are labeled `n/total` for verses and `Reff` for the refrain.
- K adjusts per song to verse count, Reff availability, and readability splits; the number of Song Blocks matches the payload and varies freely week to week.

#### FR-6: Render the variable non-song content into its Slide Types
The generator can render the Verse Reading, sermon speaker name, family/youth-of-the-week details, and Announcement List into their respective Slide Types. Realizes UJ-1.

**Consequences (testable):**
- The theme verse slide (Slide 26) is fixed and always shows the mandatory text for John 4:23.
- The Verse Reading slide shows the payload's reference and text (e.g., "Acts 18:9,10").
- Sermon speaker name renders on the sermon slide; the sermon graphic / flyer renders on its own slide.
- The closing-prayer slide shows the name of the speaker (derived from Slide 40).
- Family & Youth of the Week details (family photo, family prayer request text, youth photo, youth prayer request text) render on Slide 56.
- Each Announcement List item produces one announcement slide, image only, no added text, in list order.

#### FR-7: Apply one selectable, elegant slide transition
The generator applies one configured transition across the text/graphic slides of the Deck. An administrator chooses it from a small set of restrained styles — none, cut, fade, dissolve or push — and the choice applies uniformly to the whole Deck. Fade is the default. Realizes UJ-4.

**Consequences (testable):**
- Text/graphic slides carry the configured transition; a single transition style is used throughout (no mixed or elaborate transitions within one Deck).
- The offered styles are limited to those PowerPoint renders natively, so a Deck never opens with a transition silently missing.
- Slides that opt out of transitions (announcement flyer images) carry none, whatever the configured style.
- With nothing configured, the Deck carries the fade it has always carried.

**Feature-specific NFRs:**
- Fonts are **freely-licensed** and headless-safe (Montserrat is already open-licensed; the commercial Cooper BT Light song-title face is replaced with a freely-licensed look-alike). The generator **embeds** its fonts in the PPTX when headless embedding is feasible; otherwise it uses a **standardized** font that is documented and installed on the presentation machine(s) (§11). The visual result closely resembles the current deck but need not be pixel-perfect. (Decision — see §11. Church sign-off on a sample rebuilt slide set is a Phase-1 pre-requisite, §6.)

### 4.3 Web Hub & Service Library

**Description:** The password-protected Web Hub lists each dated Service (per-worship table list) and is the operators' single entry point: review the data, edit, regenerate, download, and delete (realizes UJ-2). Slide-level visual preview arrives with the Web Slideshow in Phase 2; in Phase 1 the Friday review works from the Run-Sheet, the editable Service data, and a downloaded PPTX spot-check — a deliberate MVP scoping, not an MVP gate.

**Functional Requirements:**

#### FR-8: List Services by date
An authenticated user can see a dated list of Services and open any one. Realizes UJ-2.

**Consequences (testable):**
- Each Service appears as a dated entry (per-worship row).
- Opening a Service shows its data, Run-Sheet, and available actions (per the user's Role).
- A list/detail API exposes Services queryable by text so picoclaw can identify a target Service (supports FR-12 in Phase 3).

#### FR-9: Preview an assembled Service slide-by-slide *(Phase 2)*
A Reviewer can visually preview the assembled Service's slides in the browser — songs, names, posters in place — without downloading the PPTX. Extends UJ-2's Friday review (Phase 2).

**Consequences (testable):**
- The preview shows the Deck's slides in order, reflecting the latest regeneration.
- Any incomplete Song Block (invalid SDAH Number, per FR-2) is visibly flagged.
- Friday review of a correct Service is achievable in ≤ 10 minutes (see SM-1) — in Phase 1 via Run-Sheet + data + downloaded PPTX; from Phase 2 also via this preview.

#### FR-10: Delete a Service manually (full cleanup)
An authenticated user with the right Role can delete an entire Service and all its assets. Realizes the cleanup step of the weekly loop.

**Consequences (testable):**
- Deleting a Service removes its Deck, Weekly Data Payload, participant text, and uploaded images (one-off announcement items included; recurring Announcement List items persist).
- After deletion the Service no longer appears in the dated list.
- Manual deletion is the only way to remove Services, participant text, and posters (these are never auto-deleted — see FR-10b).

#### FR-10b: Auto-delete generated Decks by Retention Policy *(Phase 4)*
The system can automatically delete **only generated Decks (PPTX)** past an Admin-configured Retention Policy window.

**Consequences (testable):**
- A Service older than the retention window has its generated PPTX removed automatically.
- The Service row, Weekly Data Payload, participant text, posters, and all images are preserved after auto-cleanup.
- A Service whose PPTX was auto-deleted can be regenerated on demand from its stored payload and assets; the regenerated file need not be byte-identical to the original.
- The retention window is configurable by an Admin; the default is 2 months.

### 4.4 Review, Edit & Regenerate

**Description:** When the Friday review finds an error, or a song changes late, a Reviewer corrects the inputs and regenerates the Service in place. **Phase 1** delivers the web-form path (realizes UJ-2); **Phase 3** adds the Telegram-correction path (realizes UJ-3) and first-save-wins conflict handling. Both paths converge on the same regenerate operation.

**Functional Requirements:**

#### FR-11: Edit a Service's inputs via the web form *(Phase 1)*
A Reviewer can edit a Service's Weekly Data Payload fields (participants, songs, Verse Reading, sermon speaker/graphic, family/youth, Announcement List entries and order) in the Web Hub. Realizes UJ-2.

**Consequences (testable):**
- Editing a song number and saving updates the Weekly Data Payload for that Service (the new number is validated per FR-2).
- Edited fields persist and are reflected on the next regeneration.

#### FR-11b: Create a Service via Web Form *(Phase 1)*
An Operator can create a new Service directly from the Web Hub by pasting the Raw Rundown Text and optionally filling out structured fields and image URLs.

**Consequences (testable):**
- Pasting a valid rundown text and submitting parses the rundown, extracts the date, validates hymns, and inserts a new Service.
- If a Service for the parsed date already exists, the web form displays a collision warning and prevents duplicate creation unless an explicit override is confirmed.
- The operator can manage (reorder, toggle recurring/one-off, add/remove) announcement flyers directly within the creation form, syncing live to the database.

#### FR-12: Submit a correction via Telegram *(Phase 3)*
The Events Department or an Operator can send a correction to Telegram; picoclaw identifies the target Service and updates the affected part of the existing Service's Weekly Data Payload. Realizes UJ-3.

**Consequences (testable):**
- picoclaw proposes a target Service — defaulting to the nearest upcoming Sabbath — and applies the correction only after the sender confirms; an explicit date in the message is honored the same way.
- A confirmed correction updates the existing Service (e.g., one Song Block), not a new Service.
- When the target remains ambiguous, picoclaw keeps asking rather than guessing.

#### FR-13: Regenerate a Service in place *(Phase 1)*
A Reviewer can regenerate a Service's Deck from its current Weekly Data Payload without creating a new Service. Realizes UJ-2, UJ-3.

**Consequences (testable):**
- Regeneration rebuilds the Deck reflecting the latest edits.
- A late single-song swap can be edited, regenerated, and re-downloaded in ≤ 5 minutes end to end (see SM-5).
- Regeneration overwrites the Service's prior artifacts (the Service remains one dated entry).

#### FR-13b: Resolve concurrent edits first-save-wins *(Phase 3)*
When the same Service is edited from the web form and from Telegram near-simultaneously, the first save to commit wins; a later conflicting save is rejected with an error.

**Consequences (testable):**
- Given two edits to the same Service based on the same prior state, the first to save succeeds; the second fails with a conflict error instead of silently overwriting.
- The rejected editor is told the Service changed and can re-load and re-apply.

### 4.5 Offline PPTX Export *(Phase 1)*

**Description:** Every Service produces a downloadable, offline-capable PPTX so the Sabbath — projector, OBS live stream, presenter view — never depends on venue internet (realizes UJ-4). The file is downloaded ahead of time; brief tethering to download is acceptable, presenting is not. In Phase 1 this file **is** the presentation path.

**Functional Requirements:**

#### FR-14: Download an offline-capable PPTX
An authenticated user can download a Service's Deck as a PPTX file that presents fully offline. Realizes UJ-4.

**Consequences (testable):**
- Once downloaded, the PPTX opens and presents in PowerPoint with all slides, images, and fonts intact, with no network access.
- Fonts render correctly offline: either **embedded** in the file, or supplied by the **standardized** font pre-installed on the presentation machine (§11). Acceptance is verified on a *clean* machine — embedded fonts must render where the fonts were never installed; when relying on install, the standardized font is documented and installed on the presentation machine(s) before Sabbath.
- PowerPoint's native dual-screen presenter view works with the file as with any normal deck.
- The downloaded file's metadata reflects the correct Service date.

**Feature-specific NFRs:**
- PPTX generation completes for a full ~68-slide Service within an acceptable regeneration budget (supports the ≤ 5-minute late-change signal). See §10.

### 4.6 Web Slideshow & Presenter Mode

**Description:** The Service renders as an in-browser **Web Slideshow**. **Phase 2** delivers a single-screen full-screen show (no presenter view) — also serving as the slide-level preview (FR-9). **Phase 5** adds dual-screen **Presenter Mode** — a clean full-screen output on the projector (OBS-captured for the live stream) plus an operator view with the current slide, next slide, the Run-Sheet, and the participant list (realizes UJ-4). The operator advances a linear deck; no live re-ordering.

**Functional Requirements:**

#### FR-15: Present a Service as a full-screen Web Slideshow *(Phase 2)*
An authenticated user can present a Service from the browser as a single-screen full-screen slideshow using the same configured transition as the Deck. Realizes UJ-4.

**Consequences (testable):**
- The Web Slideshow shows the same slides, in the same order, as the PPTX Deck.
- The operator advances slides linearly (next/previous); there is no live re-ordering.
- The browser transition matches the Deck's configured transition style (FR-7); the two are chosen once and never diverge.
- The slideshow requires connectivity for its initial load; once one Service's slideshow is loaded, it can run through without a live connection. The offline cache covers exactly **one Sabbath worship — one Service's deck**. Data operations while offline may surface a connection error. [ASSUMPTION: the PPTX remains the hard offline guarantee; the Web Slideshow is best-effort offline after load.]

#### FR-16: Provide dual-screen Presenter Mode in the browser *(Phase 5)*
The Web Slideshow can drive two screens: a clean full-screen output on one (projector) and an operator view on the other (current slide, next slide, Run-Sheet, participant list). Realizes UJ-4.

**Consequences (testable):**
- The projector output shows only the current slide full-screen (no operator chrome), suitable for OBS capture of the live stream.
- The operator view shows the current slide, next slide, the Run-Sheet, and the participant list simultaneously.
- Advancing on the operator view advances the projector output in lockstep.
- The operator can blank the projector to black at any time and restore it, without moving the Deck position, losing the projector window, or disturbing a scripture overlay underneath. The operator view keeps showing the current and next slide while blanked, and indicates that the projector is blanked.
- A projector opened or reloaded while blanked comes up blank.

### 4.7 Web Run-Sheet *(Phase 1)*

**Description:** The Web Hub doubles as the operators' Run-Sheet: the full Order of Service — every role, name, song (with number), and timing — shown at a glance so the on-duty team follows along without digging through WhatsApp during the service (realizes UJ-2, UJ-4). This is the full rundown; the Deck prints only the subset of names the current deck already shows. In Phase 5 the Run-Sheet and participant list also surface inside Presenter Mode (FR-16).

**Functional Requirements:**

#### FR-17: Display the full Order of Service as a Run-Sheet
An authenticated user can view a Service's full Order of Service — roles, names, songs with numbers, and timings — as a Run-Sheet. Realizes UJ-2, UJ-4.

**Consequences (testable):**
- The Run-Sheet shows every role and name from the Rundown, including roles not printed on any slide (e.g., song leader, MC, prayer partners).
- Songs appear with their SDAH Numbers and their position in the order.
- Section timings from the Rundown are shown.

### 4.8 Authentication & Roles *(Phase 1)*

**Description:** The Web Hub is not publicly accessible. Each user signs in with an individual account and holds one of **two Roles: Admin or Operator** (realizes UJ-2, UJ-4). Events Department members who need app access receive Operator accounts in v1; a finer-grained split is deferred until real usage shows what it should be. This protects church-member PII (names, photos, prayer requests) on family/youth slides and the Run-Sheet.

**Functional Requirements:**

#### FR-18: Authenticate users with per-person accounts and two Roles
Each user can sign in to the Web Hub with an individual account; unauthenticated visitors cannot access any Service. Access is governed by the **Admin** and **Operator** Roles. Realizes UJ-2, UJ-4.

**Consequences (testable):**
- An unauthenticated request to any Service view, download, or action is denied.
- Each user has distinct credentials (not a single shared password).
- **Admin** can manage accounts and Roles (and, from Phase 4, the Retention Policy).
- **Operator** can review, edit, regenerate, download, and delete Services (and present, from Phase 2).
- Events Department members are provisioned as Operators; no third Role exists in v1.

### 4.9 Scripture Display *(Phase 6)*

**Description:** An on-demand verse display for moments when the speaker asks for a passage that isn't in the week's Deck: the operator looks it up and shows it live, **from within Presenter Mode** — not a separate app screen (realizes a distinct in-service need, not UJ-1). Backed by the developer-provided **KJV-only** Verse Database. Decoupled from the PPTX assembly workflow; it never modifies a Deck.

**Functional Requirements:**

#### FR-19: Look up and display a scripture passage on demand within Presenter Mode
An Operator in Presenter Mode can search the Verse Database by reference and push the passage to the projector output, then return to the Deck. Realizes the ad-hoc verse-display need. Depends on FR-16.

**Consequences (testable):**
- A reference (e.g., "John 4:23") returns and displays the KJV passage text full-screen on the projector output.
- Dismissing the passage returns the projector to the current Deck slide; the Deck and Weekly Data Payload are unmodified.
- Requires Presenter Mode (available from Phase 5); Scripture Display itself ships in Phase 6.

### 4.10 Artifact Registry & Template Authoring *(delivered 2026-07-26; retrospectively specified 2026-07-29)*

**Description:** Slide layout is owned by a registry of Artifact templates rather than by code. An Administrator edits a template's positioned elements in a constrained canvas editor, and the change applies to every downstream surface — PPTX and Web Slideshow alike — without a deploy. This section was written **after** the capability shipped, by Correct Course 2026-07-29 (`../../sprint-change-proposal-2026-07-29.md`): the subsystem had no requirement in this document while `epics.md` declared *"PRD FR numbers are authoritative."* Structural invariants were already recorded in `architecture/architecture-epic-16/ARCHITECTURE-SPINE.md`; the contract is in `../../../specs/spec-slide-artifact-model/` and `../../../implementation-artifacts/spec-16-2-artifact-pipeline-completion.md`.

**Functional Requirements:**

#### FR-20: Author slide layouts at runtime through an Artifact Registry
An Administrator can change how any Slide Type is laid out — element position, size, and content binding — through a registry-backed canvas editor, and the change takes effect on the next generated Deck and on the Web Slideshow without a code change. Realizes a maintainability need (§9: one maintainer, few moving parts), not a user journey.

**Consequences (testable):**
- Layouts live in a SQLite-backed registry seeded from validated JSON; editing a template changes both PPTX and Web Slideshow output with no code deploy.
- `buildSlidePlan` emits `ArtifactInstance[]` with placeholders resolved from the Weekly Data Payload; PPTX and Web Slideshow render from the same positioned elements — no per-surface layout branch.
- An Administrator can edit an existing template on a constrained canvas, and can add or delete text boxes and shapes they authored themselves.
- Seeded element ids and any element marked `required` are immutable: the save API rejects their removal or rename with 400, and read-only base types (`FullScreenImage`, `SongSet`, `Announcement`) expose no add/delete affordance at all.
- A template can be restored to its seeded definition.
- **Boundary — this is not per-church configurability** (§5 non-goal). The registry is one global template set for BIC's single established deck, editable by an Admin. It changes *who owns layout*, not how many workflows the product supports.
- **FR-4, FR-5 and FR-6 obligations are unchanged.** NFR-3 readability remains the binding constraint on lyric slides; moving layout into data does not relax it. A registry edit that produces an unreadable lyric slide violates NFR-3 exactly as a code change would.

**Feature-specific NFRs:**
- Because layout is now data, the seeded registry is a correctness surface: every declared placeholder must bind to exactly one element and every planner template id must be present. A conformance test for this is tracked as an open action item in `sprint-status.yaml`.
- Seeding inserts **missing** template ids only. An existing deployment therefore keeps its old rows when a seeded template changes — the migration is an operational step, not an automatic one.

## 5. Non-Goals (Explicit)

- Not a general worship-presentation product — v1 serves BIC's single established workflow, not configurable per-church workflows.
- Not a song search engine — lyrics come only from the Hymnal Database by SDAH Number; no free-text or web lyric search; no contemporary/non-hymnal song support in v1.
- **No video handling** — announcement uploads are images only; no MP4/video upload, storage, or embedded video slides. (The occasional video-bearing weeks of the old manual deck are consciously dropped from scope.)
- **No guest/performer decks** — a Special Song performer's own PPTX and a speaker's own sermon PPTX are presented outside this system; the app only provides the surrounding slides.
- Not a flyer/graphic generator — Announcement Assets are uploaded finished; the app never generates flyer or announcement artwork from data.
- Not a live presentation controller — the app produces a linear Deck advanced normally; no ProPresenter-style live re-ordering or slide-jumping.
- Not a full participant-roster-on-slides system — only the names the current deck already prints go on slides; extra roles live on the Run-Sheet (and, in Phase 5, the Presenter Mode participant list).
- Not a public website — the Web Hub is closed and per-person authenticated.
- Not a document archive — generated Decks are expendable (Phase 4 auto-expires them); the durable record is the Service's data, which regenerates the Deck on demand.
- Scripture Display (§4.9) is not a study/reading platform — it is an on-demand KJV passage display inside Presenter Mode, nothing more.

## 6. Delivery Phases

*Scope is sequenced for immediate usable value. **Phase 1 is the MVP and the only committed phase** — the smallest slice that replaces the weekly manual rebuild end to end and is worth using on its own. **Phases 2–6 are nice-to-have**: specified now, built in order only if Phase 1 proves genuinely useful in weekly service. All FRs are specified in §4; this section assigns them to phases.*

### Phase 1 pre-requisites (go/no-go spikes, before build)

These validate the load-bearing dependencies and assumptions before any generator work; each is a go/no-go gate:
- **Hymnal Database** — acquire it and validate structure (title + clean verse/refrain blocks), coverage, and numbering; FR-5 readability splitting depends on it (§11).
- **picoclaw** — confirm the openclaw-type agent can be customized to the intake/readback/image-binding spec (FR-1, §11).
- **Font strategy** — prove the chosen freely-licensed font either embeds cleanly headless or renders on a clean machine with the standardized font installed (FR-14, §11).
- **Fidelity sign-off** — generate a sample rebuilt slide set (song title, lyric, sermon, family/youth) and get explicit sign-off from the church/Bimo that the look is acceptable (§4.2).
- **Rundown corpus** — gather 5–10 historical Rundowns and decks to measure real format variance before locking parse rules, so the parser is not fit to a single sample (§4.1, §10).

### Phase 1 — Generate, Edit & Download *(MVP — the target)*
Rundown in via Telegram → correct offline deck out, editable, behind a login. No correction-via-Telegram workflow yet; fixes happen in the web form (a full re-send of the Rundown for the same date also updates the Service — FR-1).
- Telegram intake → picoclaw → API: **FR-1**
- Hymn validation + resolution in the input API: **FR-2**
- Persistent Announcement List: **FR-3**
- Deck generator (all Slide Types, readability-aware Song Blocks, fade): **FR-4, FR-5, FR-6, FR-7**
- Per-worship table list + list/detail API: **FR-8**
- Manual full delete: **FR-10**
- Web-form edit: **FR-11**
- Web-form create: **FR-11b**
- Regenerate in place: **FR-13**
- Offline PPTX download: **FR-14**
- Web Run-Sheet: **FR-17**
- Auth with Roles (Admin/Operator): **FR-18**

**Phase 1 done when:** an Events Department Telegram rundown produces a correct, dated Service whose PPTX presents offline on Sabbath; a Reviewer can check it Friday (Run-Sheet + data + downloaded file), fix any field in the web form, and regenerate — all behind per-person login.

### Phase 2 — Web Slideshow *(nice-to-have)*
- Single-screen full-screen Web Slideshow (no presenter view): **FR-15**
- Slide-level preview in the browser: **FR-9**

### Phase 3 — Telegram Corrections *(nice-to-have)*
- Telegram correction with Service targeting (confirm; default nearest upcoming Sabbath): **FR-12**
- First-save-wins concurrency: **FR-13b**

### Phase 4 — Retention Cleanup *(nice-to-have)*
- Auto-delete generated PPTX by Retention Policy (data, posters, rows persist): **FR-10b**

### Phase 5 — Presenter Mode *(nice-to-have)*
- Dual-screen Presenter Mode (projector + operator view with current/next slide, Run-Sheet, participant list): **FR-16**

### Phase 6 — Scripture Display *(nice-to-have)*
- On-demand KJV scripture lookup/display inside Presenter Mode: **FR-19**

### Phase-gate decision (recorded 2026-07-29)

This section makes Phases 2–6 contingent — *"built in order only if Phase 1 proves genuinely useful in weekly service"* — and **SM-3** (§7) makes that contingency measurable: at least a full quarter of consecutive weekly use, with a leading continue/stop gate at ~week 4. Phases 2–6 were nonetheless all built and shipped (Epics 8–12) without that gate being evaluated, and no artifact recorded whether it had been passed, waived, or skipped. The gap was found by the 2026-07-29 implementation-readiness assessment.

**Decision (owner, 2026-07-29): the SM-3 build-order gate is waived retroactively for Phases 2–6.** Rationale as given by the owner: shipping with the full feature set is preferred to holding specified, working capability behind a 13-week observation window on a solo-maintainer project where the need was already evident in weekly use.

**What this waiver does not cover:**

- **SM-3 remains a live product metric.** Sustained weekly use is still the measure of whether this system works. The waiver removes it as a *gate on build order*, not as a signal.
- **The counter-metrics still bind.** SM-C1 (don't trade fidelity for speed), SM-C2 (don't over-delete), SM-C3 (don't re-centralize on one person) apply to all shipped phases.
- **The five Phase-1 pre-requisite spikes above are a separate matter and are not waived here.** Three remain unrecorded: font proven on a clean machine, church fidelity sign-off on a sample rebuilt slide set, and the 5–10 historical Rundown corpus. Two of those are the church's judgment, not the developer's.
- **Future capability records its own decision, at the time it is taken.** Any new phase or major capability writes its go/no-go here when decided, rather than being reconstructed afterwards. That is the practice this entry exists to establish.

### Delivered outside the original phase plan

Capability that shipped without a phase assignment in this section, recorded here for traceability:

- **FR-20 — Artifact Registry & template authoring** (§4.10), delivered 2026-07-26 as Epic 16 and retrospectively specified 2026-07-29. It is not a phase because it is not a user-facing increment; it changes who owns slide layout.
- **Epic 13** (LiveServer Docker/tunnel deploy, shared header/profile/dashboard search, hub-local announcement uploads) and **Epic 15** (lyric formatting as continuous text, chorus after every verse, song-title skips in prayer flow). Epic 13's planning drift was reconciled by Correct Course 2026-07-19. Epic 15 is best read as an FR-5 refinement, with one caveat worth stating: FR-5 says a Reff *"repeats after each verse"* and Epic 15 implemented chorus injection after every verse — consistent, but the behavior was decided in a SPEC rather than here.

### Explicitly out of the phased plan (deferred to the vision)
- Multiple churches / configurable per-church workflows.
- Contemporary or non-hymnal songs.
- Video/MP4 handling of any kind.
- Generating announcement flyers from data (uploaded finished only).
- Printing participant roles the deck doesn't already show. `[NOTE FOR PM]` Revisit if the church later wants more roles on slides.
- Multiple or elaborate slide transitions.
- Live presentation control / re-ordering.

## 7. Success Metrics

*Each SM cross-references the FR(s) it validates. Counter-metrics counterbalance specific primary metrics.*

**Primary**
- **SM-1: Build effort collapses.** *(Phase 1)* The weekly ~1 hour of manual assembly drops to near zero; Friday review of a correct Service takes ≤ 10 minutes. Validates FR-1…FR-8, FR-11, FR-13, FR-17; FR-9 extends the review surface (Phase 2).
- **SM-2: The operator pool widens.** *(Phase 1)* The number of people who can produce and present a Sabbath service grows from one (Bimo) to any scheduled Multimedia Team member — presenting no longer requires knowing how to build a deck. Validates FR-14, FR-17, FR-18.
- **SM-3: It sticks.** The church uses the system every week for a sustained run — at least a full quarter (~13 consecutive weeks). Validates the product as a whole, and is the gate for building Phases 2–6. **Leading gate (~week 4)** — an early continue/stop signal, not a wait-until-week-13 verdict: Friday review observed at ≤ 10 minutes, at least two distinct Operators have each run a Sabbath service unaided, and zero weeks required the manual break-glass fallback (§9). Failing the early gate triggers diagnosis, not silent continuation.

**Secondary**
- **SM-4: Errors approach zero.** No leftover-content-from-last-week incidents; lyric typos disappear (lyrics come from the Hymnal Database). Validates FR-2, FR-4, FR-5.
- **SM-5: Late changes become routine.** A last-minute song swap is edited, regenerated, and re-downloaded in ≤ 5 minutes. Validates FR-11, FR-13 *(Phase 1)*; FR-12 extends it to Telegram *(Phase 3)*.
- **SM-6: The Sabbath runs offline without incident.** The presentation plays reliably regardless of venue internet. Validates FR-14 *(Phase 1)*; FR-15/FR-16 in later phases.
- **SM-7: Storage stays bounded.** *(Phase 4)* Retention auto-cleanup keeps stored generated-PPTX volume within budget over a sustained run. Validates FR-10b.

**Counter-metrics (do not optimize)**
- **SM-C1: Don't trade fidelity for speed.** Faster generation must not come at the cost of visible slide errors (wrong/garbled lyrics, cramped unreadable lyric slides, missing announcements, broken layout). Counterbalances SM-1/SM-5 — a fast deck that's wrong is worse than a slower correct one.
- **SM-C2: Don't over-delete.** Retention cleanup must never remove a Service's recoverable data (Weekly Data Payload, participant text, posters) — only the regenerable PPTX. Counterbalances SM-7.
- **SM-C3: Don't re-centralize on one person.** Ease-of-use tuning must not quietly reintroduce a single gatekeeper (e.g., only the developer can add accounts or fix a parse). Counterbalances SM-2 — the whole point is de-centralization.

## 8. Open Questions & Deferred Decisions

The revision rounds resolved every substantive question from the maintainer's direction; those resolutions are captured in the relevant FRs and repeated here for traceability. What remains is deferred *by choice* and does not block building Phase 1.

**Resolved (now decided; see referenced FRs):**
- **Retention default** = 2 months, Admin-configurable (FR-10b).
- **Intercessory response songs (slides 36/38)** = fixed standing pair, not payload — per the Deck Blueprint annotation (FR-1/FR-4).
- **Theme verse** = fixed template slide showing John 4:23 (Slide 26); **Verse Reading** = sender-supplied text, KJV Verse Database is never used for Deck slides (FR-1/FR-6).
- **Phase-1 review surface** = Run-Sheet + editable data + downloaded PPTX; slide-level visual preview is a Phase-2 addition, not an MVP gate (FR-9).
- **Roles** = Admin + Operator only; Events Department members are provisioned as Operators (FR-18).

**Deferred by choice (revisit when real usage informs them — not needed for Phase 1):**
1. **Finer Events-Department permissions** — a possible third Role once weekly usage shows what it should cover (FR-18).
2. **Scripture Display trigger/dismiss UX** — the exact in-service invoke/dismiss interaction inside Presenter Mode; a Phase-6 design detail (FR-19/FR-16).
3. **Retention granularity** — whether the window ever needs to be per-Service rather than one global default (FR-10b).

## 9. Constraints and Guardrails

**Privacy.** Family/Youth-of-the-Week slides and the Run-Sheet carry church-member PII — names, photos, prayer requests. Access is restricted to authenticated users by Role (FR-18); the Web Hub is never public. Manual deletion (FR-10) removes PII-bearing data when the church chooses. [ASSUMPTION: no formal data-retention/consent regime is required beyond restrict-access-by-Role + manual delete; confirm if the church has stricter expectations.]

**Cost.** Built and run by a solo developer on a modest budget. With video out of scope, storage pressure drops sharply — images plus generated PPTX files are the main footprint, and Phase 4's Retention Policy on generated PPTX (FR-10b) plus manual delete (FR-10) keep it bounded. Hosting and compute should stay within a hobby/small-church budget. Production topology (**target, not yet deployed** — corrected 2026-07-29 by the owner; the deployment tooling exists and is configured, nothing is running): home-PC LiveServer + Docker Desktop + Cloudflare Tunnel (`presenter.example.church`) — see `README-deployment.md`. Read every "production" reference in the artifact set against this: there is no live database, no live projector, and no Sabbath currently depending on this system.

**Maintainability.** A single maintainer owns all three layers. Any change flows through the same path: adjust the picoclaw skill if needed → adjust the API if needed → adjust the app if needed. Design choices must respect one-person maintainability (few moving parts, a clean rebuildable template over cloned artifacts). Phasing itself is a maintainability guardrail: Phase 1 must stand alone and deliver value before any later phase exists. The maintainer accepts the concentration of all three layers on one person as a deliberate trade for the time a stable system saves. As cheap, no-maintenance insurance against the hard weekly deadline, the hand-editable master template is kept as an explicit **break-glass fallback**: if the app is unavailable before a Sabbath, that week's deck can be produced by editing the master (or the last generated PPTX) by hand.

## 10. Cross-Cutting NFRs

*Stable ids **NFR-1 … NFR-7** were added 2026-07-29 by Correct Course. Until then these were unnumbered prose, so no story or test could cite one and NFR coverage could not be traced the way FR coverage can — story 6.6 cited an `NFR-4` that resolved to nothing. **No wording changed**: the ids follow the order the bullets already had. NFR-7 was lifted here from §4.2/§11, where the font requirement lived split across two sections, so all seven are citable from one place.*

- **NFR-1 — Offline reliability (load-bearing).** A downloaded PPTX must present a full Service — all slides, images, fonts — with zero network access. This is the guarantee that protects the Sabbath. The Phase-2 Web Slideshow is best-effort offline after its initial online load, scoped to one Service (FR-15).
- **NFR-2 — Generation performance.** Assembling/regenerating a full ~68-slide Service must fit within the ≤ 5-minute late-change window (SM-5), including PPTX export.
- **NFR-3 — Readability.** Lyric slides must never be over-full; splitting rules (FR-5) exist so the congregation can read every slide from the pews. *(Binding on FR-20 registry edits too — moving layout into data does not relax this.)*
- **NFR-4 — Headless-safe rendering.** Deck generation runs without a human-driven PowerPoint; fonts and backgrounds must render correctly headless (no reliance on a commercial font or on interactive PowerPoint). Backgrounds may arrive via multiple mechanisms (solid fill, full-bleed image) and all supported paths must render.
- **NFR-5 — Robust parsing.** picoclaw's Rundown parsing must tolerate the real semi-structured format (honorifics, first-name-only names, markers `》`/`[ ]`, `"-"` empties, `"The Speaker"` references, variable song counts) and **fail visibly, not silently**. Beyond the invalid-hymn flag (FR-2), picoclaw/the API surface **every line or input they could not confidently map**, and every image whose role could not be resolved or that is missing, to the Reviewer — a general "unmapped input" channel, not a hymn-only one. This matters more given Phase 1 has no in-browser slide preview: the visible-flag surface, the sender readback (FR-1), and the downloaded-PPTX spot-check are the safety net.
- **NFR-6 — Access control.** All Service data and actions require authentication and are gated by Role (FR-18); no public endpoints expose member PII or Services.
- **NFR-7 — Font licensing and availability.** Fonts are freely-licensed and headless-safe. The generator **embeds** its fonts in the PPTX when headless embedding is feasible; otherwise a **standardized** font is documented and installed on the presentation machine(s). Verified on a *clean* machine — one where the font is not already installed. (Stated in full at §4.2 and §11; consolidated here so it carries an id.)

## 11. Dependencies

- **Hymnal Database (input, not built here).** The SDA Hymnal lyrics data source, keyed by SDAH Number, provided by the developer. FR-2 depends on it. Its shape (title + structured verses/refrain) drives Song Block rendering.
- **Verse Database (input, not built here).** The **KJV-only** scripture data source for Scripture Display (§4.9). FR-19 depends on it. Independent of the Hymnal Database; never used for Deck slides.
- **picoclaw agent.** The openclaw-type agent that parses the Rundown and calls the API; a customized skill is required. Layer 1 of the three-layer system.
- **Telegram.** The intake channel where the Events Department already coordinates; the app does not replace it.
- **OBS (live stream).** The projector/full-screen output (PowerPoint in Phase 1; the Web Slideshow projector output in Phase 5, FR-16) must be capturable by OBS as the live-stream source.
- **Fonts.** Freely-licensed, headless-safe fonts (Montserrat is already open-licensed; the commercial Cooper BT Light song-title face is replaced with a freely-licensed look-alike), avoiding commercial-font licensing and headless-regeneration risk while closely resembling the current look. **Decision:** the generator **embeds** fonts in the PPTX when feasible; otherwise a **standardized** font is documented and installed on the presentation machine(s). Validated on a clean machine as a Phase-1 pre-requisite (§6).

## 12. Assumptions Index

*Every `[ASSUMPTION]` from the document, surfaced for explicit confirmation:*

- §4.1 — The Events Department sends the Rundown as text and the week's images (in sequence, with a textual description) to the same Telegram chat; picoclaw can access both and binds each image to its role/order from the description (FR-1).
- §4.2 / §11 — **Decided:** fonts are freely-licensed and embedded, or a standardized font installed on the presentation machine (no commercial-font dependency). The only residual is church **fidelity sign-off** on a sample rebuilt slide set — a Phase-1 pre-requisite (§6), not an open assumption.
- §4.6 / FR-15 — The PPTX remains the hard offline guarantee; the Web Slideshow is best-effort offline after its initial online load, scoped to one Service.
- §9 — **Decided (owner):** no formal data-retention/consent regime beyond restrict-access-by-Role + manual delete; PII-bearing payload (family/youth names, photos, prayer requests) persists until manually deleted. Risk accepted for v1.
