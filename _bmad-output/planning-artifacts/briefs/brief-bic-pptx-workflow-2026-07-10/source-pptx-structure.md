---
title: "Source Extract: 260704 - BIC Worship Presentation.pptx"
type: source-extract
created: 2026-07-10
note: "Relevance-filtered structural digest of the current master deck, produced by extraction subagent. Feeds Solution/Scope of the brief and the downstream PRD/architecture. Not user-authored."
---

# BIC Worship Presentation — Structure & Order-of-Service Digest

**Source:** `260704 - BIC Worship Presentation.pptx` (Bandung International Community — a Seventh-day Adventist church; "SDAH" = SDA Hymnal). Filename stem `260704` = service date 2026-07-04; **no date appears on any slide.**

## Deck-level facts (for automation)
- **68 slides**, **16:9** widescreen, **20" × 11.25"** (large widescreen preset).
- **Every slide uses the same "Blank" layout** (`slideLayout7`). **Zero PowerPoint placeholders anywhere** — all text is in **free-floating text boxes** at absolute coordinates. A generator must place text boxes by geometry, not fill named placeholders.
- **Backgrounds** per-slide: mix of solid color fill and full-bleed images (as slide `<p:bg>` blipFill and as picture-filled shapes).
- **Fonts:** Montserrat (Bold/Light/Regular) for headings/body, **Cooper BT Light** (commercial) for song titles. Theme is default Office (Calibri); fonts set per-run. 18 fonts embedded (Windows `.fntdata`) — licensing/headless-regeneration risk.
- **Transitions:** `fade` on essentially all text/graphic slides; media/announcement slides (59–65) none.
- **Media payload:** ~97 MB file — 65 media files (54 images + **8 embedded MP4 videos ~50 MB**) on announcement slides.
- **Metadata smell:** document title still **"BIC PPT - May 31.pptx"** → strong evidence the current workflow is "duplicate last week's file and swap content in place."

## Order of service (3 macro-sections, each opened by an agenda "Sequence" slide)

**PART A — BIBLE TALK (Sabbath School), slides 1–24:** Welcome (1) · Bible Talk Sequence agenda (2) · dividers (Prayer Partners, Opening Song) · **Song 1** title (5) + 6 lyric slides (6–11) · Verse Reading Acts 18:9,10 (12) · dividers (Opening Prayer, Bible Talk, Closing Song) · **Song 2** title (16) + 6 lyric slides (17–22) · Closing Prayer divider (23) · Break Time + offering (24).

**PART B — DIVINE SERVICE, slides 25–53:** Divine Service Sequence agenda (25) · theme verse John 4:23 (26) · Opening Song divider · **Song 3** title (28) + 6 lyric slides (29–34) · Intercessory Prayer dividers + prayer liturgy (35–38) · Special Song divider (39) · **Sermon title + speaker name** (40) + sermon graphic (41) · Closing Song divider · **Song 4** title (43) + 6 lyric slides (44–49) · **Closing Prayer + person name** (50) · closing response "We Have This Hope" (51–52) · reflection (53).

**PART C — ANNOUNCEMENTS & CLOSING, slides 54–68:** Welcome repeat (54) · Offering & Tithe (Bank Mandiri + QR, 55) · Family & Youth of the Week (names/members/prayer requests, 56) · Midweek Prayer Meeting (57) · **8 announcement flyer/video slides, image/video only, no text** (58–65) · Fellowship etiquette (66) · Welcome/closing (67) · Contact + WhatsApp QR (68).

## Fixed skeleton vs. variable weekly

**FIXED:** agenda "Sequence" slides (2, 25); all dividers; standing liturgy (prayer text 36, "Hear Our Prayer O Lord" 38, "We Have This Hope" 51–52, reflection 53, fellowship etiquette 66); offering/bank info (24, 55); Midweek meeting (57); welcome/closing/contact frames (1, 54, 67, 68). Theme verse (26) probably fixed, could rotate.

**VARIABLE weekly:**
- **Songs (biggest variable):** ~4 hymns. Each = 1 title slide (title + "SDAH #nnn") + N lyric slides. Data: title, hymn number, full lyrics split into verse/refrain blocks. Refrain repeats after each verse (3-verse hymn = 6 lyric slides). K genuinely varies per song.
- **Scripture:** Verse Reading (12) quote + reference; theme verse (26) if rotated.
- **Sermon:** speaker name (40) + sermon-title graphic image (41).
- **Closing Prayer person:** name (50).
- **Announcements:** offering, Family-of-Week + Youth-of-Week (names, members, prayer-request bullets, 56), and a **variable-count set of image/video flyer slides** (8 this week).
- **Participant names actually PRINTED on slides:** only Sermon speaker (40), Closing Prayer person (50), Family/Youth of the Week (56). **No worship leader, MC, musician, or prayer-partner names appear on slides** — the "participant roster" is thinner than assumed. (Open question: does the church want more roles printed?)

## Repeating patterns (variable count per week)
- **Song block** = 1 title slide + K lyric slides (labeled `n/total` for verses, `Reff` for refrain).
- **Divider** = 1 slide per program step (title + optional instruction e.g. "Congregation, please stand").
- **Announcement** = 1 slide per flyer (full-bleed image or video, dropped in finished).

## Reusable template assets (the deck's real "skeleton" — design lives in recurring background images, not layouts)
- `image6.jpeg` — lyric-slide background (all 24 lyric slides).
- `image5.jpeg` — song-title background (all 4 title slides).
- frame set (`image17/18/19/20` + `image16/25`) — prayer/response liturgy slides.
- divider/offering/welcome backgrounds each reused on 2+ slides.
- 51 images used on exactly one slide = genuinely per-week unique assets (flyers, sermon graphic, family/youth photos).

## Messy / automation-hostile things
- **No structured placeholders** — free text boxes at absolute XY on a Blank layout. No semantic slot to target. Recommendation: build a proper `.potx`/master with real placeholders & custom layouts rather than cloning this file.
- **Lyric layout varies** within the deck (verse marker sometimes above, sometimes last line).
- **Backgrounds inconsistent in mechanism** (solid `<p:bg>` / image `<p:bg>` blipFill / image-in-shape) — replacement code must handle all three.
- **Announcements are pre-rendered images/videos, not data** — app can only accept uploaded flyers/MP4s and insert a variable number of slides; can't "generate" them from fields. The 8 MP4s cause the ~97 MB bloat (storage/perf → ties to the per-week cleanup requirement).
- **Font risk:** Cooper BT Light (commercial) + Montserrat; embedded via Windows `.fntdata` — won't regenerate cleanly headless (python-pptx / LibreOffice). Ship fonts with generator & re-embed, or accept substitution.
- **Duplicated slides** (Welcome 3×, Intercessory divider 2×) — generator should treat as templated repeats.
- **Stale metadata** confirms copy-paste-last-week workflow. **No date printed on any slide** → week identifier is a brand-new field to introduce.

## Net modeling recommendation
Model the deck as a fixed **skeleton of templated slide types** (title, agenda, divider, song-title, lyric, scripture, sermon, offering, family/youth, announcement-image, closing) driven by a weekly **data payload**: date/week id · hymns (title + number + structured verses/refrain) · scripture refs · sermon speaker + graphic · family/youth-of-week text · ordered list of announcement image/video assets. Rebuild on a real templated master with named layouts rather than the current blank-layout, absolute-positioned file.
