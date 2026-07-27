---
title: "Addendum: BIC Worship Presentation Automation"
status: draft
created: 2026-07-10
updated: 2026-07-10
note: "Downstream detail (PRD/architecture inputs) that would bloat the 1-2 page brief. Captured verbatim-ish from Discovery."
---

# Addendum — Operational Detail

## Current-state workflow (manual, owned by Bimo)

1. Bimo gathers, for the upcoming service: the list of participants, the songs to be sung, posters, and announcements to be created.
2. On Thursday/Friday, Bimo edits the master PPTX (fills the changing placeholders) and uploads it to Google Drive / OneDrive.
3. On Sabbath, a laptop is opened, the PPTX is downloaded, and it is presented.

Notes:
- A single master PPTX with "pakem utama" (main established structure). The large skeleton is the same every week; only certain placeholders change.
- No fancy mandatory slide transitions required — one elegant, standard transition is enough.

## Target-state workflow (automated)

1. Each week, the participant list + songs to be sung are sent to a **Telegram** channel/bot.
2. **picoclaw** (an openclaw-type agent) reads that data and calls the **app's API**: filling in participant data, finding song lyrics, and sending posters to the API.
3. The **app** adjusts the PPTX / presentation from those inputs. There is a list by day/date; each entry produces a ready presentation. Final output need not be a PPTX — could be a web slideshow. **Downloadable is preferable, but a good online slideshow is acceptable.**
4. On **Friday**, someone checks that the slideshow is valid and can see the participants, posters, and songs (matching what the user provided in step 1). This becomes the **weekly asset**: the presentation (web or file), the participant list the user sent (can be plain chat text), images, etc.
5. On **Sabbath**, the schedule is simply played/presented.

## Actors & access

- **Builder/maintainer:** kodesh87, a **solo developer**. Owns and maintains all three layers (picoclaw skill, API, app). No other developers involved.
- **"Tim IT" = church multimedia team (end-users/operators), NOT software developers.** They do not touch application code. They: review the presentation on Friday, and present it on Sabbath (2 on a scheduled rotation — one on the presentation computer, one on sound; both run projector, mics, handycam, live stream). **The app is password-based (NOT publicly accessible)** — this supersedes the initial "publicly accessible" note. Within it they view previews, weekly assets/run-sheet, and present.
- **Events department (dept acara)** = a SEPARATE group (not the multimedia team). They send the weekly inputs via Telegram.
- **picoclaw skill:** needs to be customized to call the app's API. (Solo dev expects to need: the picoclaw skill + the API it calls.)

## Change-management (how future changes flow)

Any change follows the same three-layer path:
1. Adjust the picoclaw skill if needed
2. Adjust the API if needed
3. Adjust the app if needed

## Housekeeping / constraints noted

- Need a **per-week delete** capability to enable automatic cleanup — storage grows large if everything is kept.
- Long-term ambition: workflows differ per church; eventually support configurable per-church workflows. **v1 focus = automate BIC's current single workflow.**

## Slides vs. web run-sheet (what goes where)

- **On the PPTX/slides:** only what the current deck already prints — sermon speaker, closing-prayer person, family/youth of the week, song titles+lyrics, scripture, announcement images/videos. Extra participant roles are NOT added to slides.
- **On the web app (run-sheet):** the FULL weekly order of service — every role, name, song (with number), and timing — shown as an at-a-glance reference so on-duty operators don't have to dig through WhatsApp during the service. This full rundown is also the raw input the events dept sends and picoclaw parses.

## Sample weekly input (real — Sabbath, July 11, 2026)

This is the kind of semi-structured text the events department sends to Telegram and picoclaw must parse. Note markers `》` (spoken/announcement item), `[ ]` (song checkbox), timings in parentheses, songs as `SDAH #nnn` or bare `#nnn`, and "The Speaker" meaning "same as sermon speaker".

```
SABBATH, JULY 11, 2026

BIBLE TALK (09.30-10.50 /80 min)
》welcome remarks: Mrs. Wulan
》Prayer Partners : Mrs. Wulan (5m)
Song Leader  : Mrs. Wulan
[  ] Opening song : SDAH #159 The Old Rugged Cross
Memory Text & Opening Prayer : Bagas
Bible Talk :  (40m)
[  ] Closing Song : SDAH #163 At The Cross
Closing Prayer  : Mr. Damar (1m)
》announcement of break : Mr. Damar

Break (5m)

DIVINE SERVICE (10.50- 12.05/ 75 min)
Song Leader : Mrs. Ayu
[  ] Opening Song : SDAH #83 O Worship the King
Intercessory Prayer: Ms.Kirana (5m)
[  ] Before int. prayer : #671 now dear Lord as we pray
[  ] After int. prayer : #684 hear our prayer o Lord
Special Song : -
Sermon : Timotius Wicaksana "Working Out" (45m)
[  ] Closing Song : SDAH #249 Praise Him ! Praise Him !
Closing Prayer: The Speaker(1m)
》Closing Remarks & Announcements : Mr. Tirta (5m)
Prayer for Food : Mr. Tirta (2m)
```

Observations for parsing/design:
- Songs here total 5 (2 in Bible Talk, 3 in Divine Service incl. 2 short prayer-response numbers `#671`/`#684`) — song count is genuinely variable week to week.
- "Special Song : -" → an optional item that may be empty; the generator must handle "none".
- Names carry honorifics (Mrs./Mr./Ms.) and some are first-name only ("Bagas"); "The Speaker" is a reference, not a literal name.
- Timings and section headers (BIBLE TALK / DIVINE SERVICE) mirror the two agenda "Sequence" slides in the deck.
