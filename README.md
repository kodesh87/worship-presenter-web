# worship-presenter-web

A self-hosted hub that turns a worship service rundown into slides — a downloadable PowerPoint deck for offline use, and a dual-screen presenter for the room.

Built for a Seventh-day Adventist congregation, but the slide templates are data rather than code, so any church running a similar order of service can adopt it by editing them.

## What problem it solves

Preparing worship slides by hand takes hours, most of it spent typing hymn lyrics that were already typed last month. A last-minute song change means redoing the deck. And the knowledge of how to build it lives with one volunteer.

This takes the rundown a service planner already writes — in a chat message or a form — and produces the finished slides.

```
rundown text  →  parsed service  →  slide plan  →  ┬→  PowerPoint deck (offline)
                                                   ├→  full-screen slideshow
                                                   └→  presenter + projector
```

Hymn lyrics come from a local corpus, looked up by number. Layouts come from a registry an administrator can edit in the browser. Nothing needs a network connection once the deck is downloaded — which matters, because the deck is what runs the service if anything else fails.

## Features

- **Rundown intake** — paste into the web form, or `POST` from a chat bot to a secret-gated webhook. Unrecognised lines are surfaced, never silently dropped.
- **Hymn resolution** — hymns referenced by number are expanded into title and lyric slides, split for readability, with the refrain repeated after each verse.
- **Editable slide templates** — 28 templates in a SQLite registry with a canvas editor: move and resize elements, change text and styling, add your own text boxes and shapes, reset any template to its shipped state.
- **One layout, four outputs** — the same hydrated slide drives the PowerPoint deck, the web slideshow, the projector and the live preview. No per-format layout code.
- **Presenter mode** — current and next slide, a thumbnail filmstrip, a slide list, a jump-to-any-slide grid, the run sheet, and a real second window you can drag onto the projector.
- **Blank screen** — black the projector out and restore it without losing your place.
- **Selectable transitions** — none, cut, fade, dissolve or push, applied identically to the deck and the browser.
- **Scripture lookup** — pull a KJV passage onto the projector during the service and clear it again.
- **Announcement flyers** — a persistent list, with images uploaded to the hub or pulled from an allow-listed URL.
- **Accounts and roles** — per-person admin and operator accounts, rate-limited sign-in, and sessions that can actually be revoked.

## Requirements

Node.js 20 or newer. Everything else installs with `npm install`. Storage is SQLite; there is no separate database server.

## Quickstart

```bash
git clone https://github.com/kodesh87/worship-presenter-web.git
cd worship-presenter-web
npm install
npm run setup
npm run dev
```

`npm run setup` generates `.env` with fresh secrets, creates the database, seeds the slide registry, and prints the admin password it generated for you. Then open <http://localhost:3000>.

See [docs/QUICKSTART.md](docs/QUICKSTART.md) for the longer walkthrough, and [docs/PRIVATE-DATA.md](docs/PRIVATE-DATA.md) before you put your own congregation's details in.

## Making it yours

The shipped registry is a worked example — a real order of service with placeholder contact and payment details. Two things to change:

1. **Slide templates.** Sign in as an administrator and open `/admin/artifacts`. Every template is editable on a canvas; the standing slides (offering, midweek prayer, contact) are where your own details go.
2. **Private overrides.** If you would rather keep your congregation's registry out of git entirely, drop it at `data/local/default-registry.json` and the app seeds from that instead. That path is git-ignored. See [docs/PRIVATE-DATA.md](docs/PRIVATE-DATA.md).

## Shipped corpora

Two default corpora are committed, so a clone resolves a hymn number and a scripture reference with no file handed to it and no network at boot:

| File | Seeds | On boot |
| --- | --- | --- |
| `data/song-book/sdah.json` | 695 hymns of the Seventh-day Adventist Hymnal | title and lyrics re-applied from the file |
| `data/en/bible-translation/kjv.json` | 66 books, 1,189 chapters, 31,102 KJV verses | reconciled from the committed file on every boot (~130–150 ms measured) |

`npm run corpus:verify` asserts both are whole. Neither has a generator: the exports they were converted from are gone, so these files are the source of record — restore from version control rather than rebuilding.

Please read [ATTRIBUTIONS.md](ATTRIBUTIONS.md) — it names the copyright holders, states the non-commercial congregational purpose, and gives a contact for removal requests. Each corpus also carries its own licence text inside the file.

If you are adapting this for a different hymnal, add your corpus at `data/song-book/<book-code>.json` in the same shape. Hymns are keyed by `(book_code, number)`, so a second book sits alongside the shipped one instead of replacing it.

## Deployment

It runs anywhere Node 20 runs, including a Docker container — see [docs/deployment-guide.md](docs/deployment-guide.md). SQLite, uploaded images and the deck cache all need durable paths; the deployment guide covers which.

## Project history

This project began as a private repository for one congregation. That history is not carried over here, because it contained real member names, photographs of identifiable people including minors, private message screenshots, and a live payment code — none of which belonged in a public repository, and none of which can be un-published once indexed.

This repository therefore starts from a single initial commit with a synthetic example congregation. The design documents under `_bmad-output/` came across and were sanitised; they are worth reading if you want to understand why the system is shaped the way it is.

Contributors: please read [docs/PRIVATE-DATA.md](docs/PRIVATE-DATA.md) before your first commit. There is a test that fails if congregation data reaches a tracked file, and it is there for a reason.

## Licence

[MIT](LICENSE) for the code. Third-party content is covered separately in [ATTRIBUTIONS.md](ATTRIBUTIONS.md).
