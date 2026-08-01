---
title: BIC Worship Presentation Automation
status: final
created: 2026-07-10
updated: 2026-07-30
---

# PRD: BIC Worship Presentation Automation
*Working title — confirm.*

## 0. Document Purpose

This PRD is for the solo developer/maintainer (kodesh87) who will build and run all three layers of this system, and for any downstream workflow (architecture, epics, stories) that needs a stable specification. It builds on — and does not duplicate — the existing **Product Brief** (`brief.md`), its **Addendum** (operational detail: workflows, actors, sample input), and the **source PPTX structural digest** (`source-pptx-structure.md`, the anatomy of the current 68-slide deck). Those live in `_bmad-output/planning-artifacts/briefs/brief-bic-pptx-workflow-2026-07-10/` and remain authoritative for the *why*; this PRD is authoritative for *what must be true*. This PRD's own **`addendum.md`** (same folder as this file) holds the user-authored annotated 68-slide operational map — the authoritative deck blueprint feeding UX and architecture.

Three conventions bind the rest of the document. Vocabulary is anchored in the **Glossary** (§3, extended in §13) and used verbatim — a synonym is a discipline violation. Inferred decisions carry `[ASSUMPTION: ...]` inline and are indexed in §12. Implementation mechanism — transport shapes, the PPTX library, API contracts — is deliberately excluded and belongs to the architecture spine and `addendum.md`.

**Delivery status lives in §6 and nowhere else.** This paragraph used to assert that Phase 1 was the only committed phase; Phases 2–6 shipped anyway and FR-21 was committed on 2026-07-30, so a second place to look was a second place to be wrong.

## 1. Vision

BIC (Bandung International Community, a Seventh-day Adventist church) presents a ~68-slide deck every Sabbath. Today one volunteer rebuilds it by hand each week, duplicating last week's PowerPoint and swapping in the new songs, participants, posters, and announcements — roughly an hour of a skilled person's time, ~52 hours a year, that only one person knows how to do and that resists last-minute change.

This product turns that weekly rebuild into a **generated artifact**. The events department sends the week's rundown to a Telegram chat, exactly as they already coordinate. An agent (picoclaw) reads it and hands the structured inputs to the app's API; the app validates hymn numbers against the SDA Hymnal database, resolves the lyrics, and assembles the presentation from BIC's fixed template skeleton and the week's variable content. Each dated **Service** appears in a password-protected web hub for Friday review, quick edit-and-regenerate when something is wrong or changes late, and an offline PPTX download that keeps the Sabbath independent of venue internet.

The bet is deliberately modest — and deliberately narrow. Phase 1 ships the smallest thing that is immediately usable: rundown in, correct offline deck out, editable, behind a login. Everything else (Web Slideshow, Telegram corrections, retention cleanup, Presenter Mode, Scripture Display) is specified but contingent: built only after Phase 1 has proven its value in real weekly use. If it sticks, it saves a skilled volunteer ~52 hours a year, widens the pool of people who can run a service from one person to the whole rotation, and becomes the first wedge in a broader aim: automating the church's mechanical work so its people can spend their energy on reaching others.

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
  Sari coordinates the week's program. On Wednesday she types the rundown into the events Telegram chat as she always has — sections, timings, roles by name, songs as `SDAH #159`, "Special Song: -" when there's none — and attaches the finished poster images. She never opens presentation software. picoclaw reads the messages and calls the API; the app validates each hymn number against the Song Book, resolves the lyrics, applies her announcement instructions to the persistent announcement list, and assembles the deck. Minutes later a new dated **Service** exists in the web hub. **Edge case:** if a song number isn't valid in the Song Book, the Service is still created but that Song Block is flagged as incomplete, and picoclaw can tell Sari which number failed.

- **UJ-2. Bimo reviews Friday and fixes a wrong song in the web app.** *(Phase 1)*
  Bimo, who used to spend an hour building the deck, now opens the web hub on Friday, signs in with his account, and picks this Sabbath's Service. In under ten minutes he checks the Run-Sheet and the Service's data — participants, songs, posters — against what events sent, and downloads the PPTX for a spot-check. He spots that the closing song is wrong. He edits the song number in the web form, clicks regenerate, and the deck rebuilds in place. He downloads the fresh offline PPTX to the presentation laptop ahead of Sabbath. **Resolution:** the Service is correct; the offline artifact is on the machine that will present it.

- **UJ-3. A last-minute song swap comes in Saturday morning via Telegram.** *(Phase 3)*
  Saturday, 08:40. The song leader messages the events chat: the divine-service opening song is changing. picoclaw proposes the nearest upcoming Sabbath as the target Service, asks for confirmation (an explicit date also works), then updates the Song Block. The reviewer regenerates and re-downloads the PPTX in under five minutes. *(Until Phase 3 ships, the same fix takes one Operator a couple of minutes in the web form — UJ-2's path.)*

- **UJ-4. Elen, new to the rotation, presents on Sabbath offline.** *(Phase 1; richer in Phases 2 & 5)*
  Elen has never built a deck. She's scheduled on the presentation computer today. The venue internet is unreliable, but the PPTX was downloaded Friday, so nothing depends on it. In **Phase 1** she presents from the offline PPTX — full-screen on the projector, captured by OBS — with the web Run-Sheet open on her phone or laptop for the order of service. Once **Phase 2** ships she can alternatively present from the browser full-screen; once **Phase 5** ships she gets dual-screen **Presenter Mode**: projector clean, her screen showing current/next slide, the Run-Sheet, and the participant list. Either way she advances a linear deck with a single elegant fade. **Resolution:** the service runs start to finish without her needing to know how the deck was built.

- **UJ-5. Bimo creates a new service directly in the web app.** *(Phase 1)*
  When the Telegram channel is not yet configured or when there is an outage, Bimo can open the web hub, click "+ New Service", paste the raw rundown text, add sermon and family/youth details directly in the form, and click "Create". The system parses the raw text, resolves hymns, checks for date collision, and creates the Service in the library. **Resolution:** the Service is successfully created from the web interface.

## 3. Glossary

*Downstream workflows and readers use these terms exactly. FRs, UJs, and SMs use Glossary terms verbatim; introducing a synonym is a discipline violation. When §4 introduces a new domain noun, it is defined in the same pass.*

*This section holds the nouns §4 uses throughout. **Nouns scoped to one feature or one phase live in §13** — the Artifact Registry vocabulary, Web Slideshow and Presenter Mode, the Verse Database, Announcement Asset, and Retention Policy. Each noun is defined in exactly one of the two places; nothing is repeated between them.*

- **Service** — One dated weekly worship event, and the unit the system manages. Each Service owns one Weekly Data Payload, one generated Deck, one Run-Sheet, and its uploaded images. Listed by date in the Web Hub.
- **Rundown** — The semi-structured plain text the Events Department sends to Telegram describing one Service's full order of service (sections, timings, roles by name, songs by number, announcement instructions). The raw input picoclaw parses.
- **Order of Service** — The full ordered sequence of program steps for a Service (every role, name, song with number, and timing). Rendered to operators as the Run-Sheet; a subset of it drives the Deck.
- **Weekly Data Payload** — The structured variable content for one Service after interpretation: date/week identifier; the four main Hymns (SDAH Number, validated and resolved by the app); Verse Reading reference + text; sermon speaker + sermon graphic / flyer; closing-prayer person (derived from the sermon speaker); Special Song presence/performer (or none); family/youth-of-the-week family photo + family prayer request text + youth photo + youth prayer request text; announcement instructions against the Announcement List (recurring vs one-off); and the full participant/role/timing data for the Run-Sheet. Distinct from the fixed Template Skeleton.
- **Template Skeleton** — The fixed portion of BIC's deck, identical week to week: welcome frames, agenda/Sequence slides, dividers, intercessory-prayer liturgy and response songs, standing closing response and reflection, offering/bank info, midweek-meeting slide, fellowship etiquette, closing/contact frames.
- **Deck Blueprint** — The mapping of every slide position in BIC's established deck to fixed-vs-payload status and its Slide Type (§4.2; full annotated map in this PRD's `addendum.md`). It is authoritative for **what the deck was and what the Registry ships as its starting point** — and it is what FR-4 and FR-6 are tested against. It is not a standing prohibition on change: once FR-21 lands, an Admin may deliberately author a structure that departs from it, and that departure is a decision the product permits rather than a defect. What the Blueprint stops being is a *silent* authority; a divergence is chosen, not drifted into.
- **Slide Type** — A templated slide category the generator can emit: welcome, agenda/Sequence, divider, song-title, lyric, scripture, sermon, offering, family/youth, announcement-image, closing. This is a **semantic** vocabulary — what a slide *is* in the service — and it is what the Deck Blueprint is written in. It is **not** the same axis as Slide Kind below, and the two are not synonyms: a Slide Type says what a slide means to the congregation, a Slide Kind says what an Admin is allowed to author on it.
- **Song Block** — One song rendered as 1 song-title slide + K lyric slides. Each verse starts a new slide and each Reff starts a new slide; text too long for one slide splits across additional slides for readability. K = f(verse count, Reff availability, readability splits). Some songs have no Reff. **"Reff" is BIC's own label for the refrain, as printed on the deck** — the two words name the same structure, and *Reff* is used wherever the deck's own label is meant.
- **Hymn** — A song identified by its number within a Song Book — SDAH by default — whose lyrics come from that Song Book.
- **SDAH Number** — SDA Hymnal number (e.g., `SDAH #159` or bare `#671`), the key used to validate and resolve a Hymn **within the SDA Hymnal Song Book**. Since FR-23 (§4.11) a Hymn is keyed by number *within a named Song Book*; the term is kept because SDAH numbering is what every rundown this product reads actually cites.
- **Song Book** *(renamed from **Hymnal Database** on 2026-08-01, when FR-23 made it one of several)* — A lyrics data source (title + structured verses/refrain, keyed by number within that book), provided by the developer and shipped as committed seed data at `data/song-book/<code>.json`. **The SDA Hymnal (SDAH) is the default.** An input dependency, not built in this project. *Point-in-time records that predate the rename — `.memlog.md`, `pressure-test-findings.md`, the readiness reports — keep the old term deliberately: rewriting a record makes it lie about what was said.*
- **Announcement List** — The persistent, ordered list of Announcement Assets the app maintains across weeks: recurring items stay until replaced or removed; one-off items are added for a single Service. Managed via the API (picoclaw) and the Web Hub.
- **Deck** — The generated slide presentation for a Service, exported as an offline-capable PPTX file.
- **Run-Sheet** — The web view of the full Order of Service for a Service, for operators to follow during the service.
- **Web Hub** — The password-protected web application: dated Service list (with search), shared Header (Announcements / Settings), review, edit, regenerate, download, delete, slideshow, and presenter.
- **picoclaw** — The agent (openclaw-type) that reads the Rundown from Telegram, uploads images, and calls the app's API to create or update a Service. It does **not** resolve lyrics itself.
- **Role** — An access level in the Web Hub. v1 defines two: **Admin** and **Operator**.
- **Admin** — The Role that manages accounts, Roles, (Phase 4) retention configuration, the slide transition, and the Artifact Registry; full access. Like **Operator**, the Role name doubles as the noun for the person holding it — *"an Admin can…"*. The long form *Administrator* is deliberately not used anywhere else in this document; it was collapsed into **Admin** on 2026-07-30 because two words for one actor is the synonym this section's own rule forbids.
- **Events Department** — The contributor group that sends each week's Rundown and images via Telegram. Members needing app access receive **Operator** accounts in v1 (no separate Role yet). Not the Multimedia Team.
- **Multimedia Team / Operators** — The end-user group (Operator Role) that reviews Services on Friday and presents them on Sabbath (two per rotation: one on the presentation computer, one on sound). Not software developers.
- **Reviewer** — An Operator performing the Friday review of a Service.

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
The app's Service-input API validates each submitted SDAH Number against the Song Book and resolves the Hymn's title and structured lyrics server-side, reporting validity back to the caller. Realizes UJ-1.

**Consequences (testable):**
- A valid SDAH Number yields a stored title and lyrics split into verse/refrain blocks from the Song Book, in the same input call — no separate resolution step for picoclaw.
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

**Deck Blueprint (fixed vs payload).** The full annotated 68-slide map — including *when* each slide is shown during the service — is in this PRD's `addendum.md`; downstream workflows treat it as authoritative for what this deck is and for what FR-4 and FR-6 are tested against. **FR-21 changes its standing, not its content:** once the Registry owns structure, the Blueprint is what the Registry ships as its starting point and the record of the deck it came from — an Admin may then depart from it deliberately (see the Glossary entry). Summary:

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
The generator applies one configured transition across the text/graphic slides of the Deck. An Admin chooses it from a small set of restrained styles — none, cut, fade, dissolve or push — and the choice applies uniformly to the whole Deck. Fade is the default. Realizes UJ-4.

**Consequences (testable):**
- Text/graphic slides carry the configured transition; a single transition style is used throughout (no mixed or elaborate transitions within one Deck).
- The offered styles are limited to those PowerPoint renders natively, so a Deck never opens with a transition silently missing.
- Slides that opt out of transitions (announcement flyer images) carry none, whatever the configured style.
- With nothing configured, the Deck carries the fade it has always carried.

**Feature-specific NFRs:**
- Fonts follow **NFR-7**, which is the one statement of that requirement. What this feature adds and NFR-7 does not: the visual result **closely resembles the current deck but need not be pixel-perfect**. The church sign-off that would have validated that resemblance was waived by the owner on 2026-07-29, so "closely resembles" is now judged by one person at the pre-launch projector inspection rather than agreed with the congregation (§6).

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

**Description:** An on-demand verse display for moments when the speaker asks for a passage that isn't in the week's Deck: the operator looks it up and shows it live, **from within Presenter Mode** — not a separate app screen (realizes a distinct in-service need, not UJ-1). Backed by the developer-provided Verse Database. Decoupled from the PPTX assembly workflow; it never modifies a Deck. **Extended by FR-22 (§4.11), committed 2026-08-01:** the *KJV-only* clause is superseded — several translations, with KJV the shipped default. FR-19's text below is left as the record of what Phase 6 shipped; what changed is recorded once in §4.11 rather than as inline caveats, the same way §4.10 records FR-21's changes to FR-20.

**Functional Requirements:**

#### FR-19: Look up and display a scripture passage on demand within Presenter Mode
An Operator in Presenter Mode can search the Verse Database by reference and push the passage to the projector output, then return to the Deck. Realizes the ad-hoc verse-display need. Depends on FR-16.

**Consequences (testable):**
- A reference (e.g., "John 4:23") returns and displays the KJV passage text full-screen on the projector output.
- Dismissing the passage returns the projector to the current Deck slide; the Deck and Weekly Data Payload are unmodified.
- Requires Presenter Mode (available from Phase 5); Scripture Display itself ships in Phase 6.

### 4.10 Artifact Registry & Template Authoring *(FR-20 delivered 2026-07-26, specified 2026-07-29; FR-21 committed 2026-07-30)*

**Description:** Slide layout — and, with FR-21, slide **order** — is owned by the Artifact Registry rather than by code. An Admin edits an Artifact Template's positioned elements in a constrained canvas editor, and the change applies to both renderers, PPTX and Web Slideshow alike, without a deploy.

**The two halves sit at opposite ends of their code, and that gap is the difference in their risk.** FR-20 **shipped before it was specified** — written retrospectively by Correct Course 2026-07-29 (`../../sprint-change-proposal-2026-07-29.md`), because the subsystem had no requirement here while `epics.md` declared *"PRD FR numbers are authoritative."* FR-21 is the reverse: **specified before any of its code exists.** Architecture: `AD-11`..`AD-15` govern FR-20 and are adopted, `AD-16`..`AD-22` govern FR-21 and are all `[TARGET]`. Contracts: `../../../specs/spec-slide-artifact-model/` and `../../../specs/spec-artifact-registry-authoring/`.

**Functional Requirements:**

#### FR-20: Author slide layouts at runtime through an Artifact Registry
*Stated as it now stands. What FR-21 changed is recorded once, after the consequences — Stories 16.1–16.5 cite the original wording and need the trail.*

An Admin can change how any Slide Type is laid out — element position, size, and content binding — through a registry-backed canvas editor, and the change takes effect on the next generated Deck and on the Web Slideshow without a code change. Realizes a maintainability need (§9: one maintainer, few moving parts), not a user journey.

**Consequences (testable):**
- Layouts live in a SQLite-backed registry seeded from validated JSON; editing an Artifact Template changes both PPTX and Web Slideshow output with no code deploy.
- `buildSlidePlan` emits `ArtifactInstance[]` with placeholders resolved from the Weekly Data Payload; PPTX and Web Slideshow render from the same positioned elements — no per-surface layout branch.
- An Admin can edit an existing template on a constrained canvas, and can add or delete text boxes and shapes they authored themselves.
- Seeded element ids and any element marked `required` are immutable: the save API rejects their removal or rename with 400. An entry whose kind does not permit free composition exposes no element add/delete affordance.
- An entry that came from the shipped defaults can be restored to that definition. One an Admin created has nothing to restore and offers no restore at all, so two entries side by side in one list will offer different actions — and the authoring surface has to be honest about why.
- **Boundary — this is not per-church configurability** (§5 non-goal). The registry is one global template set for BIC's single established deck, editable by an Admin. It changes *who owns layout*, not how many workflows the product supports.
- **FR-4, FR-5 and FR-6 obligations are unchanged.** NFR-3 readability remains the binding constraint on lyric slides; moving layout into data does not relax it. A registry edit that produces an unreadable lyric slide violates NFR-3 exactly as a code change would.

**What FR-21 changed in FR-20** — recorded once, because five inline caveats made the requirement unreadable while Stories 16.1–16.5 still need the trail:

| FR-20 originally promised | As FR-21 makes it |
| --- | --- |
| An edit changes every Service | An edit reaches the **live** Registry; a Service created earlier keeps its Snapshot until Sync Artifact |
| Free canvas composition on any editable template | Free canvas belongs to the **General** kind alone |
| `FullScreenImage`, `SongSet`, `Announcement` are the read-only categories | `FullScreenImage` ceases to exist — it becomes an **Announcement** entry; a **SongSet** entry gains a bounded configuration surface (backgrounds, font style and size), which is not element authoring |
| Any template can be restored to its seed | Only entries that came from the shipped defaults have one to restore |
| *(feature NFR)* Seeding inserts missing template ids; a changed default is migrated by hand | **NFR-9** — authored structure is what survives; the old statement described behavior FR-21 removes |

**Feature-specific NFRs** now carry ids in §10: **NFR-8** (the Registry is a correctness surface) and **NFR-9** (authored structure is durable).

#### FR-21: Author the Deck's ordered structure in the Artifact Registry
An Admin can define **which slides the Deck contains and in what order** by editing the Artifact Registry, and a Service holds its own copy of that structure from the moment it is created. Extends FR-20 from *how a slide is laid out* to *which slides exist and in what sequence*. Realizes the same maintainability need as FR-20 (§9) plus a reviewer-protection need that FR-20 did not have: a Service already reviewed must not change underneath its Reviewer.

**Consequences (testable):**
- The ordered Registry is the source of which slides exist and in what order. A liturgical change — which songs are announced with a title slide, which fixed responses appear, where a divider sits — is a Registry edit, not a code change and not a deploy.
- An Admin can add, delete, rename and reorder entries. Changes take effect on an explicit Save; there is no autosave. **A deleted entry stays deleted** — no restart, redeploy, or default-content update brings it back.
- Every entry is exactly one of three **Slide Kinds**, and the kind fixes what may be authored on it: **General** — compose freely (background, inserted images, text and text areas, drag and resize, font colour, size and style); **SongSet** — a bounded configuration surface only (a background for the title layout, a background for the lyric layout, font style and size), never a free canvas; **Announcement** — nothing to author, its content is the Announcement List.
- Every entry is presented as `[kind] label`, and no surface widens the authority its kind allows.
- Placeholders come from the **Placeholder Catalog** and the authoring UI cannot invent one; adding a catalog entry is a development change. The same catalog entry may appear on several General slides with different styling, and each is filled from the Service's Weekly Data Payload.
- **The Registry holds structure, never the week's content.** Weekly values reach a slide only through the Weekly Data Payload (FR-1, FR-11) and announcement images only through the Announcement List (FR-3). Typing a family's name or a prayer request directly onto a canvas is outside what this capability is for, and the constraint is deliberate: content entered as layout would sit in the Registry for every future week instead of in the Service that owns it.
- The four **SongSet Slots** — Bible Talk opening/closing, Divine Service opening/closing — each receive one SDAH Number from the Service's own data. A Slot's identity is fixed by the system and is not editable; reordering entries changes the presented sequence without rebinding any hymn. A fifth slot is a development change, not an Admin's. **A hymn in the week's data that no Slot claims is surfaced to the Reviewer, never silently dropped and never fatal** (NFR-5).
- One **Announcement** entry expands to one full-bleed slide per image in the Announcement List, in list order. Which images those are stays FR-3's business, not the Registry's, so this week's flyers can still change after the structure is fixed.
- **Creating a Service fixes its structure.** The Service takes a Service Registry Snapshot and renders from it; a later Registry edit does not reach it. An Admin brings it up to date with **Sync Artifact**, which replaces the structure and leaves every value the operator entered untouched. An Operator can see that their Service is behind and ask for a sync; performing one is an Admin action. *(What the Operator sees is a UX decision this document does not make — `EXPERIENCE.md` owns it and records that "deliberately nothing" is one of the permitted answers. The requirement here is the constraint on that decision: whatever it chooses, an Operator must never be offered a control they will be refused.)*
- **A Service that predates this capability keeps working.** It has no Snapshot, so it renders from its stored data plus the current live Registry until someone Syncs it once, which is what gives it one. This is a one-way path *into* the model, not a second mode inside it: every Service created afterwards has a Snapshot from the start.
- A Service is not required to reproduce an older Deck after a structural change. What is preserved is the Service's entered data — the durable record §5 already names — not the ability to re-render last month's layout.
- **Boundary — this is authoring-time ordering, not live presentation control.** §5's non-goal stands unchanged: the Deck is still linear and advanced normally, with no re-ordering or slide-jumping during a service, and no layout editing from the presentation surface while a service is running.
- **Boundary — still not per-church configurability** (§5). Ordering and creating entries widens what an Admin owns; it does not widen how many church workflows the product serves.
- **FR-4, FR-5, FR-6 and NFR-3 continue to bind.** The shipped starting Registry produces the Deck the Blueprint describes (NFR-8), and a Registry edit that makes a lyric slide unreadable fails NFR-3 exactly as a code change would.
- **The three fixed liturgical songs are authored entirely by hand, and their readability is the Admin's own judgement** *(decided by the owner, 2026-07-30)*. The two intercessory standing responses and the closing *"We Have This Hope"* become General entries whose lyric text, page count, and line breaks are all set manually. They do **not** pass FR-5's verse/Reff splitting, and the authoring surface carries **no** automated readability check — deliberately, on both counts. NFR-3 is met by the Admin reading the pages they just authored, on the surface that will project them. Two consequences are accepted rather than mitigated: a later correction to the hymnal corpus does not reach these three songs, and a future edit to one of these pages has the same human check and nothing else standing behind it.

### 4.11 Several Translations, Several Song Books *(FR-22 and FR-23 committed 2026-08-01)*

**Description:** The two reference corpora this product reads — the Verse Database (§4.9) and the Song Book (§4.1, FR-2) — were each specified as exactly one: KJV, and the SDA Hymnal. Both become *one of several*, with the original as the shipped default. Which slides a Deck contains does not change; this is about which book a lookup reads from.

**Why this is a requirement rather than an assumption.** Both corpora become committed seed data under Epics 21–22 (`data/bible/kjv.json`, `data/song-book/sdah.json`), and that directory shape is only defensible if a second corpus is a decision the product has taken. It also carries a schema consequence that is cheap now and expensive later: hymn numbers are globally unique today, so a second Song Book cannot be stored at all.

**Functional Requirements:**

#### FR-22: Read scripture from a configurable translation, KJV by default
An Admin sets the default Bible translation; an Operator may choose a different one at the moment of lookup in Presenter Mode. KJV ships as the default corpus.

**Consequences (testable):**
- A lookup returns the passage in the chosen translation; with no choice made, in the configured default.
- Wherever a resolved passage is persisted, the translation it was resolved from is persisted with it — a passage saved under one default does not silently re-render under another.
- A translation whose corpus is absent is reported absent *for that translation*; the others keep working.
- **What FR-22 changes in FR-19, recorded once** — the pattern §4.10 uses for FR-21's changes to FR-20, so the shipped requirement stays readable: §4.9's *"developer-provided **KJV-only** Verse Database"* and FR-19's *"the KJV passage text"* become translation-parameterised. FR-19 is otherwise unchanged — same trigger, same dismissal, same guarantee that the Deck and Weekly Data Payload are unmodified.

#### FR-23: Resolve hymns from a configurable Song Book, SDAH by default
An Admin sets the default Song Book; a song in a week's data may name a different one. The SDA Hymnal ships as the default corpus.

**Consequences (testable):**
- A number resolves against the default Song Book unless that song names another, and the resolved title in the FR-2 readback names the book it came from.
- The chosen book is persisted **beside the number, in the same single home** — never as a second copy of the same weekly value.
- Two Song Books may use the same number without collision.
- **What FR-23 changes in FR-2, recorded once:** *"by SDAH Number"* becomes *by number within a named Song Book*, SDAH being the default. Validation, the unmapped-input surfacing (NFR-5) and the readback obligation are unchanged.

**Boundaries.** §5's non-goals stand as amended there: still not a song search engine, still no contemporary or non-hymnal song support, still not a study or reading platform. Adding a corpus is a development change — a shipped file and its attribution — never an Admin upload.

## 5. Non-Goals (Explicit)

- Not a general worship-presentation product — v1 serves BIC's single established workflow, not configurable per-church workflows.
- Not a song search engine — lyrics come only from a shipped Song Book by number (SDAH by default; **FR-23** allows several, §4.11); no free-text or web lyric search; no contemporary/non-hymnal song support in v1; and no Admin-uploaded Song Book — adding one is a development change.
- **No video handling** — announcement uploads are images only; no MP4/video upload, storage, or embedded video slides. (The occasional video-bearing weeks of the old manual deck are consciously dropped from scope.)
- **No guest/performer decks** — a Special Song performer's own PPTX and a speaker's own sermon PPTX are presented outside this system; the app only provides the surrounding slides.
- Not a flyer/graphic generator — Announcement Assets are uploaded finished; the app never generates flyer or announcement artwork from data.
- Not a live presentation controller — the app produces a linear Deck advanced normally; no ProPresenter-style live re-ordering or slide-jumping.
- Not a full participant-roster-on-slides system — only the names the current deck already prints go on slides; extra roles live on the Run-Sheet (and, in Phase 5, the Presenter Mode participant list).
- Not a public website — the Web Hub is closed and per-person authenticated.
- Not a document archive — generated Decks are expendable (Phase 4 auto-expires them); the durable record is the Service's data, which regenerates the Deck on demand.
- Scripture Display (§4.9) is not a study/reading platform — it is an on-demand passage display inside Presenter Mode, nothing more. **FR-22** widens which translation it reads, not what it is.

## 6. Delivery Phases

*Scope was sequenced for immediate usable value: Phase 1 is the MVP that replaces the weekly manual rebuild end to end, and Phases 2–6 were specified as increments contingent on it proving useful. **All six have since shipped, and FR-21 was committed outside the plan** — the decisions that changed this are in the decision record at the end of this section. All FRs are specified in §4; this section assigns them to phases.*

### Phase 1 pre-requisites (go/no-go spikes, before build)

Five go/no-go gates on the load-bearing dependencies, each with its state:

- **Song Book** (the SDA Hymnal) — acquire it and validate structure (title + clean verse/refrain blocks), coverage, and numbering; FR-5 readability splitting depends on it (§11). **Run.**
- **picoclaw** — confirm the openclaw-type agent can be customized to the intake/readback/image-binding spec (FR-1, §11). **Run.**
- **Font strategy** — prove the chosen freely-licensed font either embeds cleanly headless or renders on a clean machine with the standardized font installed (FR-14, NFR-7). **Still open, and the only one** — technical, and the maintainer's.
- **Fidelity sign-off** — generate a sample rebuilt slide set and get explicit sign-off from the church that the look is acceptable (§4.2). **Waived** 2026-07-29.
- **Rundown corpus** — gather 5–10 historical Rundowns to measure real format variance before locking parse rules (§4.1, NFR-5). **Waived** 2026-07-29.

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

### Explicitly out of the phased plan (deferred to the vision)
- Multiple churches / configurable per-church workflows.
- Contemporary or non-hymnal songs.
- Video/MP4 handling of any kind.
- Generating announcement flyers from data (uploaded finished only).
- Printing participant roles the deck doesn't already show. `[NOTE FOR PM]` Revisit if the church later wants more roles on slides.
- Multiple or elaborate slide transitions.
- Live presentation control / re-ordering.

### Decision record

*Four entries govern what this section says above. They sit here rather than interleaved with the phases, because a reader asking "what are the phases?" should not read 800 words of rationale to find 400 words of scope. `.memlog.md` is the canonical audit trail; what follows is only the part that still binds.*

**The two church-dependent spikes are waived** *(owner, 2026-07-29)*. Fidelity sign-off and the Rundown corpus are dropped and will not be sought. Two carried risks follow, recorded rather than argued:

- **Fidelity is unvalidated by the people who will see it.** A deck can be entirely correct and still read as "not our deck" on the worship screen; nothing in this repository can detect that. The compensating control is one person at the pre-launch projector inspection instead of the church signing off.
- **The parser is fit to a single sample** (`tests/fixtures/sample-rundown.txt`). NFR-5's "real variance" is therefore unmeasured, and the first unfamiliar rundown is where it gets measured. NFR-5's unmapped-input surface is what limits the cost of that.

**The SM-3 build-order gate is waived retroactively for Phases 2–6** *(owner, 2026-07-29)*. Those phases were contingent on Phase 1 proving useful, and **SM-3** made that measurable — a full quarter of weekly use, with a continue/stop gate at ~week 4. All five shipped as Epics 8–12 without the gate being evaluated, and no artifact recorded whether it had been passed, waived or skipped. Rationale as given: shipping the full feature set beats holding working capability behind a 13-week window on a solo-maintainer project where the need was already evident. **Not covered:**

- SM-3 remains a live product metric — the waiver removes it as a gate on build order, not as a signal.
- The counter-metrics SM-C1/C2/C3 still bind on every shipped phase.
- The pre-requisite spikes above are a separate matter this waiver does not reach.

**FR-21 / Epic 20 is committed** *(owner, 2026-07-30)*. `specs/spec-artifact-registry-authoring/SPEC.md` was adopted whole as the reference for development and eight story keys already sit in `sprint-status.yaml`, so recording it as *specified but contingent* would have put this document at odds with the tracker — the direction that caused the 2026-07-29 Correct Course. Not a numbered phase, for the same reason FR-20 is not: it changes who owns the Deck's structure rather than giving an operator a new weekly increment. **Not covered:**

- The font gate stays open. Committing FR-21 does not close a Phase-1 pre-requisite.
- Who checks a hand-authored lyric page was settled *separately* the same day (§8), and is recorded as its own decision because it is one.
- FR-21's vocabulary change is a cheap total replacement **only until first deploy** (§9 records that no production data exists as of 2026-07-30). After that, the same change must migrate live data.

**FR-22 / FR-23 are committed** *(owner, 2026-08-01)*. The two reference corpora become several, each with one configurable default: KJV for scripture, the SDA Hymnal for songs (§4.11). Recorded here on the day the decision was taken, per this section's own practice. **Not a numbered phase**, for the same reason FR-20 and FR-21 are not — it changes which book a lookup reads from rather than giving an Operator a new weekly increment. Delivered as **Epic 21** (scripture) and **Epic 22** (Song Book), cut per corpus family so the two can be built in parallel without touching the same table. **Not covered:**

- **The hymn-numbering schema change is cheap only until first deploy**, exactly as recorded for FR-21's vocabulary change above. Hymn numbers are globally unique today, so a per-book key must land while no production data exists (§9 still records none as of 2026-08-01); afterwards the same change needs a migration over live rows.
- **FR-23's per-song override is gated on FR-21's SongSet Slot work.** The override hangs off the same binding the four Slot identities own (§4.10), and those identities replace the current positional fields rather than aliasing them — so building the override first ships fields FR-21's delivery then deletes.
- **Correcting the shipped song titles is a separate blocker of its own kind.** It changes values already persisted in every existing install; the mechanism for that is an architecture concern, tracked in `sprint-status.yaml` rather than here.
- The font gate stays open. This commitment does not close a Phase-1 pre-requisite.

**This is the practice, not just the record.** Any future phase or major capability writes its go/no-go here **when the decision is taken**, never reconstructed afterwards. The first two entries above had to be reconstructed a day late by a readiness assessment; the third was written on the day. That difference is why this heading exists.

**Delivered outside the plan**, recorded for traceability: **FR-20** (§4.10), shipped 2026-07-26 as Epic 16 and specified retrospectively; **Epic 13** (LiveServer Docker/tunnel deploy, shared header/profile/dashboard search, hub-local announcement uploads), whose planning drift was reconciled by Correct Course 2026-07-19; and **Epic 15** (lyric formatting as continuous text, chorus after every verse, song-title skips in prayer flow), best read as an FR-5 refinement — with the caveat that FR-5 says a Reff *"repeats after each verse"* and Epic 15 implemented exactly that, but the behavior was decided in a SPEC rather than here.

## 7. Success Metrics

*Each SM cross-references the FR(s) it validates. Counter-metrics counterbalance specific primary metrics.*

**Primary**
- **SM-1: Build effort collapses.** *(Phase 1)* The weekly ~1 hour of manual assembly drops to near zero; Friday review of a correct Service takes ≤ 10 minutes. Validates FR-1…FR-8, FR-11, FR-13, FR-17; FR-9 extends the review surface (Phase 2).
- **SM-2: The operator pool widens.** *(Phase 1)* The number of people who can produce and present a Sabbath service grows from one (Bimo) to any scheduled Multimedia Team member — presenting no longer requires knowing how to build a deck. Validates FR-14, FR-17, FR-18.
- **SM-3: It sticks.** The church uses the system every week for a sustained run — at least a full quarter (~13 consecutive weeks). Validates the product as a whole, and is the gate for building Phases 2–6. **Leading gate (~week 4)** — an early continue/stop signal, not a wait-until-week-13 verdict: Friday review observed at ≤ 10 minutes, at least two distinct Operators have each run a Sabbath service unaided, and zero weeks required the manual break-glass fallback (§9). Failing the early gate triggers diagnosis, not silent continuation.

**Secondary**
- **SM-4: Errors approach zero.** No leftover-content-from-last-week incidents; lyric typos disappear (lyrics come from the Song Book). Validates FR-2, FR-4, FR-5.
- **SM-5: Late changes become routine.** A last-minute song swap is edited, regenerated, and re-downloaded in ≤ 5 minutes. Validates FR-11, FR-13 *(Phase 1)*; FR-12 extends it to Telegram *(Phase 3)*.
- **SM-6: The Sabbath runs offline without incident.** The presentation plays reliably regardless of venue internet. Validates FR-14 *(Phase 1)*; FR-15/FR-16 in later phases.
- **SM-7: Storage stays bounded.** *(Phase 4)* Retention auto-cleanup keeps stored generated-PPTX volume within budget over a sustained run. Validates FR-10b.
- **SM-8: Layout and structure change without a deploy.** An Admin can change a slide's appearance — and, once FR-21 lands, which slides the Deck contains and in what order — and the change reaches the next Sabbath's Deck with no code change, no release, and no developer involved. Validates FR-20 *(shipped)* and FR-21. Added 2026-07-30: both requirements claim to move ownership of the Deck away from code, and until now nothing in this section measured whether that actually happened. The counter-metric is SM-C1 — a structure an Admin can change is also one they can break, and the fidelity bar does not move because authoring got easier.

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
- **Readability of the three hand-authored liturgical lyric pages** *(decided 2026-07-30)* = the Admin's own eye, at authoring time. Those three songs are input manually and completely — text, page count, line breaks — and neither FR-5's splitter nor any automated check applies to them. Raised as a blocker when FR-21 was written, because NFR-3 kept binding while its mechanism did not; resolved the same day by choosing the manual path deliberately rather than by omission (FR-21, NFR-3).

**Deferred by choice (revisit when real usage informs them — not needed for Phase 1):**
1. **Finer Events-Department permissions** — a possible third Role once weekly usage shows what it should cover (FR-18).
2. **Scripture Display trigger/dismiss UX** — the exact in-service invoke/dismiss interaction inside Presenter Mode; a Phase-6 design detail (FR-19/FR-16).
3. **Retention granularity** — whether the window ever needs to be per-Service rather than one global default (FR-10b).

## 9. Constraints and Guardrails

**Privacy.** Family/Youth-of-the-Week slides and the Run-Sheet carry church-member PII — names, photos, prayer requests. Access is restricted to authenticated users by Role (FR-18); the Web Hub is never public. Manual deletion (FR-10) removes PII-bearing data when the church chooses. [ASSUMPTION: no formal data-retention/consent regime is required beyond restrict-access-by-Role + manual delete; confirm if the church has stricter expectations.]

**Cost.** Built and run by a solo developer on a modest budget. With video out of scope, storage pressure drops sharply — images plus generated PPTX files are the main footprint, and Phase 4's Retention Policy on generated PPTX (FR-10b) plus manual delete (FR-10) keep it bounded. Hosting and compute should stay within a hobby/small-church budget. Production topology (**target, not yet deployed** — corrected 2026-07-29 by the owner; the deployment tooling exists and is configured, nothing is running): home-PC LiveServer + Docker Desktop + Cloudflare Tunnel (`presenter.example.church`) — see `README-deployment.md`. Read every "production" reference in the artifact set against this: there is no live database, no live projector, and no Sabbath currently depending on this system.

**Maintainability.** A single maintainer owns all three layers. Any change flows through the same path: adjust the picoclaw skill if needed → adjust the API if needed → adjust the app if needed. Design choices must respect one-person maintainability (few moving parts, a clean rebuildable template over cloned artifacts). Phasing itself is a maintainability guardrail: Phase 1 must stand alone and deliver value before any later phase exists. The maintainer accepts the concentration of all three layers on one person as a deliberate trade for the time a stable system saves. As cheap, no-maintenance insurance against the hard weekly deadline, the hand-editable master template is kept as an explicit **break-glass fallback**: if the app is unavailable before a Sabbath, that week's deck can be produced by editing the master (or the last generated PPTX) by hand.

## 10. Cross-Cutting NFRs

*Ids were retrofitted — **NFR-1…NFR-7** on 2026-07-29, **NFR-8…NFR-9** on 2026-07-30 — both times because unnumbered prose cannot be cited by a story or a test, and story 6.6 once cited an `NFR-4` that resolved to nothing. Wording was preserved in every case except **NFR-9**, which is a rewrite: the statement it replaced described seeding behavior FR-21 removes. `.memlog.md` holds the full record.*


- **NFR-1 — Offline reliability (load-bearing).** A downloaded PPTX must present a full Service — all slides, images, fonts — with zero network access. This is the guarantee that protects the Sabbath. The Phase-2 Web Slideshow is best-effort offline after its initial online load, scoped to one Service (FR-15).
- **NFR-2 — Generation performance.** Assembling/regenerating a full ~68-slide Service must fit within the ≤ 5-minute late-change window (SM-5), including PPTX export.
- **NFR-3 — Readability.** Lyric slides must never be over-full; splitting rules (FR-5) exist so the congregation can read every slide from the pews. *(Binding on FR-20 and FR-21 registry edits too — moving layout, and then structure, into data does not relax this. For the three liturgical pages FR-21 authors by hand, the splitter does not apply and the Admin's own eye is the named mechanism — decided 2026-07-30, §8.)*
- **NFR-4 — Headless-safe rendering.** Deck generation runs without a human-driven PowerPoint; fonts and backgrounds must render correctly headless (no reliance on a commercial font or on interactive PowerPoint). Backgrounds may arrive via multiple mechanisms (solid fill, full-bleed image) and all supported paths must render.
- **NFR-5 — Robust parsing.** picoclaw's Rundown parsing must tolerate the real semi-structured format (honorifics, first-name-only names, markers `》`/`[ ]`, `"-"` empties, `"The Speaker"` references, variable song counts) and **fail visibly, not silently**. Beyond the invalid-hymn flag (FR-2), picoclaw/the API surface **every line or input they could not confidently map**, and every image whose role could not be resolved or that is missing, to the Reviewer — a general "unmapped input" channel, not a hymn-only one. This matters more given Phase 1 has no in-browser slide preview: the visible-flag surface, the sender readback (FR-1), and the downloaded-PPTX spot-check are the safety net.
- **NFR-6 — Access control.** All Service data and actions require authentication and are gated by Role (FR-18); no public endpoints expose member PII or Services.
- **NFR-7 — Font licensing and availability.** Fonts are freely-licensed and headless-safe. The generator **embeds** its fonts in the PPTX when headless embedding is feasible; otherwise a **standardized** font is documented and installed on the presentation machine(s). Verified on a *clean* machine — one where the font is not already installed. (Stated in full at §4.2 and §11; consolidated here so it carries an id.)
- **NFR-8 — The Registry is a correctness surface.** Because layout and structure are data (FR-20, FR-21), a Registry that is internally wrong produces a broken Deck with no code change to blame for it. Two properties must hold, and they are testable without generating a Deck: **every declared placeholder binds to exactly one element**, at any authored state; and **the shipped starting Registry produces every slide the Deck Blueprint names** (§4.2). The second is a property of what the product ships, not a prohibition on the Admin — FR-21 lets them depart from the Blueprint on purpose, and NFR-8 must not be read to forbid the capability FR-21 grants.
- **NFR-9 — Authored structure is durable.** What an Admin authors — order, kinds, labels, layouts, and the values a bounded surface lets them configure — survives a restart, a redeploy, and any later change to the product's shipped defaults. Authored structure is the Service's own data, not shipped data kept in sync with it: a delete stays deleted, a rename stays renamed, and shipped content returns only when an Admin explicitly asks for it. *(Replaces the pre-2026-07-30 statement that seeding inserts missing template ids only and that a changed default is migrated by hand — behavior FR-21 removes.)*

## 11. Dependencies

*Defined in §3 and §13; listed here for what each one's absence costs.*

- **Song Book.** FR-2 depends on it, and its shape — title plus structured verses/refrain — is what makes FR-5's Song Block splitting possible at all. Flat lyric text would degrade FR-5 rather than break it. **Since 2026-08-01 the default corpus (SDAH) ships with the repository as committed seed data**, so this is a dependency the product carries rather than one an installer must satisfy — and since FR-23 it is one Song Book of several.
- **Verse Database.** FR-19 depends on it. **Since 2026-08-01 the default corpus (KJV) ships with the repository**, so *absent* stops being the state a fresh install is in — which it was, in every install, from Phase 6 until then. The survivable-absence behaviour still binds: for a translation whose corpus is not shipped (FR-22) and for a corpus file that will not parse, the Presenter says so rather than returning empty results.
- **picoclaw agent.** Layer 1 of the three-layer system. It requires a **customized skill** — off-the-shelf will not do, which is why its customizability was a Phase-1 go/no-go gate (§6).
- **Telegram.** The intake channel where the Events Department already coordinates; the app does not replace it.
- **OBS (live stream).** The projector/full-screen output (PowerPoint in Phase 1; the Web Slideshow projector output in Phase 5, FR-16) must be capturable by OBS as the live-stream source.
- **Fonts.** A dependency because the generator cannot ship the face the current deck uses: Montserrat is already open-licensed, the commercial Cooper BT Light song-title face is not, and it is replaced with a freely-licensed look-alike. The requirement itself is **NFR-7**, stated there and nowhere else. **Its clean-machine proof is the one Phase-1 gate still open** — the other four are run or waived (§6), and FR-14's offline-font consequence cannot be accepted until it closes.

## 12. Assumptions Index

*Every `[ASSUMPTION]` from the document, surfaced for explicit confirmation:*

- §4.1 — The Events Department sends the Rundown as text and the week's images (in sequence, with a textual description) to the same Telegram chat; picoclaw can access both and binds each image to its role/order from the description (FR-1).
- §4.2 / §11 — **Decided:** fonts are freely-licensed and embedded, or a standardized font installed on the presentation machine (no commercial-font dependency) — NFR-7. The residual is no longer the church fidelity sign-off, which the owner waived on 2026-07-29; it is the **clean-machine proof**, still open (§6).
- §4.6 / FR-15 — The PPTX remains the hard offline guarantee; the Web Slideshow is best-effort offline after its initial online load, scoped to one Service.
- §9 — **Decided (owner):** no formal data-retention/consent regime beyond restrict-access-by-Role + manual delete; PII-bearing payload (family/youth names, photos, prayer requests) persists until manually deleted. Risk accepted for v1.
- §4.10 / FR-21 — **Decided (owner, 2026-07-30):** the three fixed liturgical songs are input manually and completely when the Registry is edited — text, slide count, and line breaks all by hand — and their readability is the Admin's own judgement. No splitter, no automated check. Raised as a blocking question on 2026-07-30, when FR-21 was written, and closed the same day; recorded here because the *absence* of automation for three projected slides is a deliberate choice, not an oversight to be re-litigated later.

## 13. Extended Glossary

*Nouns scoped to one feature or one phase. §3 holds the vocabulary §4 uses throughout; these are defined here and not there, so no noun has two definitions.*

**Artifact Registry vocabulary** *(§4.10 — FR-20, FR-21)*

- **Artifact Template** — One entry in the Artifact Registry: the stored definition of a slide's layout — its positioned elements, their sizes, and what content each is bound to. The unit an Admin edits.
- **Artifact Registry** — The **ordered** set of Artifact Templates the Deck is built from. Runtime-editable by an Admin without a deploy, and the source of both *what slides exist* and *in what order* (FR-21). Distinct from the Template Skeleton, which is the *content* that repeats weekly; the Registry is *how every slide is laid out and sequenced*.
- **Slide Kind** — The authoring-authority category of an Artifact Registry entry. Exactly three: **General**, **SongSet**, **Announcement**. The kind fixes what may be authored on the entry and nothing widens it. One Slide Kind can produce several Slide Types — a General entry may be a divider, a sermon slide, or a lyric page — so the two vocabularies describe the same deck along different axes and are always named distinctly.
- **SongSet Slot** — One of four fixed positions a Song Block can occupy: Bible Talk opening/closing and Divine Service opening/closing. Each Slot receives one SDAH Number from the Service's own data. A Slot's identity is fixed by the system and is never an Admin's to edit or reorder into a different meaning.
- **Placeholder Catalog** — The closed set of weekly-content placeholders an Admin can insert onto a General entry (sermon speaker, verse reading, family prayer request, and the like). Closed means the authoring UI cannot invent a new one; extending the catalog is a development change.
- **Service Registry Snapshot** — The copy of the ordered Artifact Registry a Service takes when it is created, and renders from thereafter. It is why a template edit on Friday cannot change a Service that was already reviewed.
- **Sync Artifact** — The explicit Admin action that replaces a Service's Registry Snapshot with the current live Registry. The only way a later Registry edit reaches an existing Service.

**Presentation surfaces** *(§4.6)*

- **Web Slideshow** *(Phase 2)* — The in-browser full-screen rendering of a Service's Deck; single screen, no presenter view until Phase 5.
- **Presenter Mode** *(Phase 5)* — Dual-screen presentation: a clean full-screen output (projector, OBS-captured) plus an operator view (current slide, next slide, Run-Sheet, participant list). Provided natively by PowerPoint and replicated by the Web Slideshow in Phase 5.

**Feature-scoped nouns**

- **Announcement Asset** *(§4.1, §4.3)* — A pre-rendered poster/flyer **image** (video is out of scope), uploaded finished (Telegram/picoclaw **or** Web Hub local upload) and inserted into the Deck as-is on its own slide. Occasional, not weekly: many weeks have none beyond recurring items.
- **Verse Database** *(§4.9, §4.11)* — Developer-provided scripture data powering the Scripture Display feature, shipped as committed seed data at `data/bible/<code>.json`. **KJV is the default and, since FR-22, no longer the only translation.** Independent of the Song Book and never used for Deck slides.
- **Retention Policy** *(Phase 4, §4.3)* — An Admin-configured rule (default 2 months) that automatically deletes **only generated Decks (PPTX)** past the retention window. Services, participant text, posters, and all other data persist and are manual-delete only.
