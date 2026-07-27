---
title: "Product Brief: BIC Worship Presentation Automation"
status: draft
created: 2026-07-10
updated: 2026-07-10
---

# Product Brief: BIC Worship Presentation Automation

## Executive Summary

BIC (Bandung International Community, a Seventh-day Adventist church) presents a ~68-slide deck every Sabbath. Today one volunteer rebuilds it by hand each week — duplicating last week's PowerPoint and swapping in the new songs, participants, posters, and announcements. It eats about an hour, keeps a skilled person in a data-entry role, resists last-minute changes, and can only be done by the one person who knows how. Off-the-shelf worship software (the church tried FreeWorship) doesn't fit: it is desktop, install-heavy, and ends up understood by a single operator — the very failure this should remove.

This is a web application that generates the weekly service automatically. The events department sends the week's rundown to Telegram; an agent (picoclaw) reads it, pulls hymn lyrics from the SDA Hymnal by number, and hands participants, posters, and announcements to the app's API; the app assembles the presentation from BIC's fixed template and the week's variable content. A password-protected web hub lists each dated service for Friday review and quick regeneration when things change late, doubles as an on-screen run-sheet for the operators, and produces a downloadable, offline-capable presentation (PPTX preferred) so the Sabbath — projector, OBS live stream, presenter view — never depends on venue internet.

The bet is modest and honest: it saves a skilled volunteer ~52 hours a year, widens the pool of people who can run a service from one to the whole team, and — unlike the tool it replaces — is built to actually stick. It is also the first step toward a broader aim: automating the church's mechanical work so its people can focus on reaching others.

## The Problem

Every week, one volunteer (currently Bimo) rebuilds the ~68-slide Sabbath worship deck by hand — in practice by duplicating last week's PowerPoint file and swapping content in place. It takes about an hour. An hour sounds small, but it is roughly **52 hours a year** of a skilled volunteer's time spent on mechanical assembly instead of ministry — and it keeps a capable person in a "data-entry" role rather than a higher-leverage one.

The work is also fragile in specific ways:

- **Lyrics are the time sink and the error surface.** Each week ~4 hymns become ~24 hand-typed lyric slides (title + SDA Hymnal number + verses/refrain). Typos have reached the screen in front of the congregation.
- **Late changes are nearly impossible.** Under the copy-paste flow, a last-minute song swap is painful enough that it effectively doesn't happen. There is no easy way to revise once the deck is built.
- **Copy-paste leaves residue.** Because each deck starts from last week's file (its metadata still reads "BIC PPT - May 31"), leftover content from the previous week occasionally slips through — rare, but real, and visible when it does.
- **Continuity rests on one person.** Today only Bimo can produce the deck. The history shows how brittle this is: the job keeps changing hands and restarting on a different tool — Yosef in PowerPoint, Galih on the FreeWorship app, Bimo back to PowerPoint. A new operator's first attempt takes considerably longer, and each handoff loses the prior person's setup.

Net: the status quo works, but it costs a skilled volunteer ~52 hours a year, confines them to data entry, can't absorb last-minute changes, and breaks down whenever the person changes.

## The Solution

A web application that turns BIC's weekly deck from a manual rebuild into a generated artifact — with the inputs collected where the team already talks.

**The weekly loop:**

1. **Collect (Telegram).** The events department sends the week's inputs to a Telegram chat — participants and roles, the hymns to sing (by SDA Hymnal number), posters/flyers, and announcements — as plain messages, no special software.
2. **Interpret (picoclaw → API).** picoclaw reads those messages and calls the app's API: it fills in the participant/role data, looks up each hymn's lyrics by its SDAH number from the church's hymnal database (never a free-text web search), and uploads the poster/announcement images.
3. **Assemble (app).** The app builds the presentation from BIC's fixed template skeleton — agenda, dividers, standing liturgy, offering, closing — and drops the variable content into the templated slide types: song title + lyric slides, scripture, sermon speaker + graphic, family/youth of the week, and the ordered announcement images. Each week is a dated entry.
4. **Review (web, Friday).** A scheduled reviewer opens the web app, sees the assembled service, and confirms it matches what was sent — participants, songs, posters. If something is off, or a song changes late, the inputs are edited and the presentation is regenerated in place.
5. **Present (Sabbath).** The on-duty operators present the service. The presentation is available as a **downloadable, offline-capable artifact — a PPTX is strongly preferred** — so the live moment (projector, mics, handycam, live stream) never depends on venue internet; the file is downloaded ahead of time, tethering briefly if needed. The team presents on a dual-monitor rig — a clean full-screen slide on the projector (captured by OBS for the live stream) and a presenter view on the laptop (current/next slide + run-sheet). PowerPoint gives this natively; a web-based render must reproduce this dual-screen presenter mode, not just a single full-screen window.
6. **Clean up.** Each week is a self-contained asset (the presentation, the inputs that were sent, the images) that can be **deleted per week**, keeping storage from growing without bound.

Beyond the slides, the web app doubles as the operators' **run-sheet**: it shows the full weekly order of service — every role, name, song, and timing — so the on-duty team can follow along at a glance instead of digging through WhatsApp during the service.

The web app is the hub — password-protected (not public), a dated list of services, previewable and regenerable. A reliable in-browser slideshow is acceptable as the render; the offline download is what protects the Sabbath.

## What Makes This Different

The point isn't that it generates slides — FreeWorship, OpenLP, and ProPresenter already do that well, with song databases and quick edits. The difference is *how people reach it*. Those tools are precisely why the job keeps collapsing back onto one person:

- **Zero install, runs in a browser.** No desktop setup on each operator's machine — the concrete reason BIC abandoned FreeWorship. Anyone on the team opens a link and uses it.
- **Input through Telegram, where the team already coordinates.** The events department sends the week's participants and songs to a Telegram chat and never opens presentation software. Contributing stops being a specialist skill.
- **No single gatekeeper.** With nothing to install or configure per person, the "only one person understands it" failure mode goes away — the knowledge lives in the workflow, not in one operator's laptop.
- **Purpose-built to BIC's exact deck.** Output follows BIC's established template and order of service, rather than bending the service to a generic tool's structure.
- **Fast revisions, including late ones.** Edit the inputs and regenerate — directly answering the "last-minute song change is impossible" pain.

Stated plainly: a real motivation is also **ownership and learning** — full control of the template, and a foundation the solo developer can extend into other church automations later. That is a legitimate reason to build, named honestly rather than dressed up as a technical moat.

## Who This Serves

**Primary — the multimedia team (the operators), and Bimo most of all.** This is the team that reviews the deck on Friday and runs it live on Sabbath (two people on a scheduled rotation per service — one on the presentation computer, one on sound, jointly running projector, mics, handycam, and live stream). They are short on operators, and today operating first requires *learning how to build the 68-slide deck* — a barrier that shrinks the rotation to whoever has that skill. Bimo, who currently builds every deck, feels the biggest relief: the weekly hour disappears. For the rest of the team, the win is that taking a Sabbath shift no longer requires learning PowerPoint deck-building at all — widening the pool of people who can serve.

**Secondary — the events department (the contributors).** A separate group that supplies each week's inputs: participants, songs, posters, announcements. Their experience should be as light as sending a Telegram message — they never open presentation software or the web app's internals.

**Beneficiary — the congregation.** They never touch the tool, but they feel it: fewer typos and stale-content slips on screen, and a service that can absorb a last-minute change.

The solo developer builds and maintains all three layers (picoclaw skill, API, app). Not an end user, but the person whose need for maintainability the design must respect.

## Success Criteria

**Headline signals** — if these three hold, the project was worth it:

1. **Build effort collapses.** The weekly ~1 hour of manual assembly drops to near zero; Friday review takes ≤ 10 minutes.
2. **The operator pool widens.** Producing and presenting a service no longer requires knowing how to build a deck — the number of people who can run a Sabbath service grows from one (Bimo) to any scheduled multimedia team member.
3. **It sticks.** The church uses it every week for a sustained run — at least a full quarter (~13 consecutive weeks) — unlike the FreeWorship attempt that was abandoned.

**Supporting signals:**

- **Errors approach zero:** no leftover-content-from-last-week incidents, and lyric typos disappear (lyrics come from the hymnal database, not hand-typing).
- **Late changes become routine:** a last-minute song swap can be regenerated in ≤ 5 minutes — effectively impossible today.
- **The Sabbath runs offline without incident:** the presentation plays reliably regardless of venue internet.

## Scope

**In (v1) — automate BIC's current single workflow, end to end:**

- Telegram intake from the events department → picoclaw → the app's API.
- Hymn lyrics pulled from the SDA Hymnal by SDAH number (the church's hymnal database); no free-text lyric search.
- Generate the templated deck: song title + lyric slides, scripture, sermon speaker + graphic, family/youth of the week, and a variable-count set of pre-made announcement images/videos inserted as-is. Only the names already printed in today's deck go on slides.
- A **password-protected** web hub: a dated list of services; preview; Friday review; edit-and-regenerate for revisions (including late song changes); a downloadable offline presentation (PPTX preferred); per-week delete for cleanup.
- A web **run-sheet** showing the full weekly order of service (roles, names, songs, timings) for operators during the service.
- **Dual-screen presentation:** a clean full-screen output on the projector (captured by OBS for the live stream) plus a **presenter view** on the laptop (current/next slide + run-sheet). PowerPoint provides this natively; a web-based render must replicate it.
- A single elegant fade transition.

**Out (v1) — deferred, some of it to the vision:**

- Multiple churches / configurable per-church workflows.
- Contemporary or non-hymnal songs.
- Generating announcement flyers from data (flyers/videos are uploaded finished, not generated).
- Printing participant roles the deck doesn't already show (they live on the web run-sheet, not on slides).
- Multiple or elaborate slide transitions.
- Live presentation control (ProPresenter-style re-ordering); the app produces a linear deck the operator advances normally.

**Dependency (an input, not built here):** the SDA Hymnal lyrics database, provided by the developer.

## Vision

Beyond BIC's slides, the aim is a growing set of automations that take mechanical, repeatable work off the church's hands — so its people can spend their energy on what matters most: reaching others. This first app is the wedge. Its skeleton — inputs collected where people already talk (Telegram), interpreted by an agent, assembled by an app, delivered on the web with an offline fallback — generalizes. Other churches run different services, so the natural next step is configurable per-church workflows, with BIC as the proven first template. If it works here, it becomes a pattern the developer can extend to the next mechanical burden, and the one after that.
