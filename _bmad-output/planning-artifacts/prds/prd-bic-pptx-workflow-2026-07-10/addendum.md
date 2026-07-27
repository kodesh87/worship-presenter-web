---
title: "Addendum: BIC Worship Presentation Automation PRD"
status: draft
created: 2026-07-11
updated: 2026-07-19
note: "User-contributed depth that feeds downstream documents (UX, architecture, epics) but would bloat the PRD. The slide map below is authoritative for the Deck Blueprint (PRD §4.2)."
---

# Addendum — Deck Blueprint & Operational Detail

## 1. Annotated 68-slide operational map (user-authored, 2026-07-11)

Reference deck: `260704 - BIC Worship Presentation.pptx`. Slide counts for song blocks reflect that week; actual counts vary per FR-5's readability rules. **PAYLOAD** marks payload-changeable slides; everything else is fixed Template Skeleton unless noted.

### PART A — BIBLE TALK (Sabbath School), slides 1–24

| # | Slide | Shown when | Data |
|---|---|---|---|
| 1 | Welcome | Worship not started yet (pre-service) | fixed |
| 2 | Bible Talk Sequence agenda | Worship about to start | fixed |
| 3 | Prayer Partners divider | MC at podium asks congregation to divide into partner groups to pray | fixed |
| 4 | Opening Song divider | Transition to the song-title slide; gets congregation's attention | fixed |
| 5 | **Song 1 title** | Shown a while so congregation knows title + SDAH number | **PAYLOAD** |
| 6–11 | **Song 1 lyrics** | During singing | **PAYLOAD** (see lyric rules §2) |
| 12 | **Verse Reading** (e.g., Acts 18:9,10) | After the song; MC reads and asks congregation to read together | **PAYLOAD** (reference + text) |
| 13 | Opening Prayer divider | After reading the verse, MC prays | fixed |
| 14 | Bible Talk divider | MC announces sabbath-school group discussion | fixed |
| 15 | Closing Song divider | Transition; attention | fixed |
| 16 | **Song 2 title** | Title + number shown a while | **PAYLOAD** |
| 17–22 | **Song 2 lyrics** | During singing | **PAYLOAD** |
| 23 | Closing Prayer divider | After the song; a participant prays | fixed |
| 24 | Break Time + offering | After prayer; announces break + offering info | fixed |

### PART B — DIVINE SERVICE, slides 25–53

| # | Slide | Shown when | Data |
|---|---|---|---|
| 25 | Divine Service Sequence agenda | Worship about to start | fixed |
| 26 | Theme verse (John 4:23) | MC at podium to lead opening song | fixed (mandatory template slide) |
| 27 | Opening Song divider | Transition; attention | fixed |
| 28 | **Song 3 title** | Title + number | **PAYLOAD** |
| 29–34 | **Song 3 lyrics** | During singing | **PAYLOAD** |
| 35 | Intercessory Prayer divider | Announces intercessory prayer; participant to podium | fixed |
| 36 | Response song (before prayer, e.g., #671 "Now Dear Lord As We Pray") | Congregation sings | fixed *(standing pair — not marked payload-changeable)* |
| 37 | Intercessory Prayer divider | While participant prays | fixed |
| 38 | Response song (after prayer, e.g., #684 "Hear Our Prayer O Lord") | Congregation sings | fixed *(standing pair)* |
| 39 | Special Song divider | Only when a Special Song exists; calls performer. Performer may bring own PPTX → **out of scope** | conditional |
| 40 | **Sermon speaker name** | Calls speaker to podium | **PAYLOAD** |
| 41 | **Sermon graphic / flyer** | Shown a while once speaker is at podium. Speaker may then use own PPTX → **out of scope** | **PAYLOAD** |
| 42 | Closing Song divider | Transition; attention | fixed |
| 43 | **Song 4 title** | Title + number | **PAYLOAD** |
| 44–49 | **Song 4 lyrics** | During singing | **PAYLOAD** |
| 50 | **Closing Prayer** | Calls the speaker to pray — resolved to the sermon speaker's name (slide 40) | fixed (derived from Slide 40) |
| 51–52 | Closing response "We Have This Hope" | Regular response song | fixed |
| 53 | Reflection | Ends worship; calls congregation to pray | fixed |

### PART C — ANNOUNCEMENTS & CLOSING, slides 54–68

| # | Slide | Shown when | Data |
|---|---|---|---|
| 54 | Welcome repeat | Usually mandatory | fixed |
| 55 | Offering & Tithe (Bank Mandiri + QR) | Usually mandatory | fixed |
| 56 | **Family & Youth of the Week** | Weekly | PAYLOAD — family photo, family prayer request text, youth photo, youth prayer request text (one combined slide) |
| 57 | Midweek Prayer Meeting | Usually mandatory | fixed |
| 58–65 | Announcement flyer slides | **Not common — one-off, special report/event only** (this sample week: a mission-trip report). Many weeks: none | **PAYLOAD** via Announcement List (0..N images, either modifying master list or week-specific one-off) |
| 66 | Fellowship etiquette | Usually mandatory | fixed |
| 67 | Welcome/closing | Usually mandatory | fixed |
| 68 | Contact + WhatsApp QR | Usually mandatory | fixed |

## 2. Lyric slide construction rules (FR-5 source)

- Each **verse** starts on a new slide. If one verse is too much for one slide, it divides across more than one slide.
- Each **Reff** (refrain) starts on a new slide. If one Reff is too much for one slide, it divides across more than one slide.
- Slide count per song depends on: verse count, availability of a Reff (some songs have none), and readability of verses/Reff that may split across slides.
- Labels: `n/total` for verses, `Reff` for refrain; when a Reff exists it repeats after each verse.

## 3. Announcement List mechanics (FR-3 source)

- Announcements are **images only**; MP4/video upload is out of scope entirely.
- Some announcements **recur** week to week; the app keeps a persistent ordered Announcement List.
- picoclaw (or an Operator in the Web Hub) instructs per week: which items **stay**, which are **replaced**, which are **removed**, which **one-off** items are added for that Service only, and the **order**.
- **Image binding & order** come from the sender's **textual description** accompanying the images (sent in sequence): picoclaw reads the description to assign each image to its role (sermon graphic, family/youth photo, announcement flyers) and to order the list. Unresolvable or missing images are flagged for the Reviewer, not silently dropped or rendered as a broken placeholder (a broken family-photo placeholder is visible on source slide 56).
- Flyer bursts (e.g., slides 58–65 mission-trip report) are the exception, not the weekly rule — an empty list is a normal week.

## 4. API surface implied by the PRD (architecture input, not contract)

- **Service input API** — accepts the Weekly Data Payload; **validates SDAH Numbers against the Hymnal Database and resolves lyrics server-side in the same call**; returns per-item validity so picoclaw can inform the sender (FR-2). picoclaw never resolves lyrics itself.
- **Service list/detail API, queryable by text** — lets picoclaw find and confirm a target Service for corrections (FR-8, used by FR-12 in Phase 3; default proposal = nearest upcoming Sabbath, explicit date honored, always confirm before applying).
- **Announcement List API** — keep/replace/remove/add-one-off + ordering (FR-3).
- **Image upload** — posters, sermon graphic, family/youth photo (FR-3/FR-6). Telegram path: images arrive as an ordered sequence plus the sender's textual description; picoclaw binds each image to its role and order from that description. Hub path: Operators may also `POST /api/upload`; stored refs are `/api/uploads/<32-hex>.<ext>` under `UPLOADS_DIR`. The save response echoes what was stored — including resolved Hymn titles — for sender verification (FR-1/FR-2).

## 5. Retention & regeneration notes (FR-10b source)

- Auto-cleanup deletes **only generated PPTX** files past the Admin-configured window. Worship rows, participant text, posters, and all other data persist — manual delete only.
- Post-cleanup regeneration rebuilds from stored payload + assets; the output need **not** be byte-identical to the originally generated file.

## 6. Web Slideshow offline scope (FR-15 source)

- Online required for initial load; afterwards the loaded show runs without connection.
- Cache depth: **one Sabbath worship — one Service's deck** (not a library).
- Offline data operations may surface a connection error; the PPTX remains the hard offline guarantee.

## 7. Scripture Display placement (FR-19 source)

- KJV-only Verse Database (developer-provided).
- Invoked **inside Presenter Mode**, not a separate app screen: look up by reference, push to projector output, dismiss to return to the Deck. Never touches the Deck or payload.

## 8. Phase rationale (user directive, 2026-07-11)

Phase 1 is the only chased target: deliverables must be immediately usable — narrow scope so value lands at once. Phases 2–6 (slideshow, Telegram corrections, retention, presenter mode, scripture display) are nice-to-have and are built **only if Phase 1 proves useful** in real weekly service.
