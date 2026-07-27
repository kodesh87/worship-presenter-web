# Quickstart

From nothing to a running hub with a service on screen. Fifteen minutes.

## 1. Install

Node.js 20 or newer is the only prerequisite.

```bash
git clone https://github.com/kodesh87/worship-presenter-web.git
cd worship-presenter-web
npm install
npm run setup
```

`npm run setup` generates `.env` with fresh secrets, creates the SQLite
database, seeds the 28 slide templates, and prints the admin password it
generated. Write that password down — it is also in `.env`, which is
git-ignored.

Re-running setup is safe: it never overwrites an existing `.env` or database.

## 2. Start it

```bash
npm run dev
```

Open <http://localhost:3000> and sign in as `admin`.

## 3. Create a service

**Services → New.** Paste a rundown into the raw text box. The shape it expects
looks like this:

```
SABBATH, MARCH 14, 2026

BIBLE TALK (09.30-10.50 /80 min)
》welcome remarks: Mrs. Wulan
Song Leader : Ms. Ayu
[  ] Opening song : SDAH #159 The Old Rugged Cross
Memory Verse & Opening Prayer : Mr. Bagas
Closing Prayer : Mr. Damar (1m)

DIVINE SERVICE (10.50- 12.05/ 75 min)
Song Leader : Ms. Kirana
[  ] Opening Song : SDAH #83 O Worship the King
Intercessory Prayer: Mr. Farid (5m)
Sermon : Pdt. Timotius Wicaksana "Working Out" (45m)
[  ] Closing Song : SDAH #249 Praise Him! Praise Him!
```

Press **Parse**. Roles, timings and hymn numbers are pulled out into the form;
hymns are resolved to titles from the corpus. Anything the parser could not
place is listed rather than dropped, so you can see what it missed.

Fill in the sermon flyer and family/youth photographs if you have them, then
save.

## 4. Present it

From the service page:

- **Download PPTX** — the offline deck. This is the one that runs the service if
  the network, the laptop or the hub lets you down.
- **Present** — the operator console. Current and next slide, a filmstrip, a
  slide list, and **All slides** to jump anywhere.
- **Open projector** — a separate window to drag onto the second screen. Arrow
  keys advance both. `B` blanks the projector and restores it.

## 5. Make it your congregation's

**`/admin/artifacts`** — every slide template on an editable canvas. Move and
resize elements, change text and colours, add your own text boxes and shapes,
and reset any template to its shipped state.

Start with the standing slides, which carry the example congregation's
placeholder details: `offering-tithe`, `midweek-prayer`, `contact`.

If you would rather keep your registry out of git entirely, see
[PRIVATE-DATA.md](PRIVATE-DATA.md).

**`/admin`** — accounts, deck retention, and the slide transition used by both
the deck and the browser.

## 6. Optional extras

**Scripture lookup.** Presenter mode can put a KJV passage on the projector. The
corpus is not shipped; supply one and run `npm run import:kjv`.

**Chat intake.** `POST /api/webhook` with an `x-webhook-secret` header accepts a
rundown as JSON, so a bot can create or correct a service. The secret is in
`.env`; the endpoint is gated by it alone and never by a session.

## Troubleshooting

**`Missing hymnal corpus`** — `data/hymns.json` is absent. Run
`npm run import:hymnal`, or supply your own corpus in the same shape.

**Locked out** — `npm run auth:set-password -- admin` sets a new password from an
interactive prompt. `npm run auth:unlock -- --list` shows and clears sign-in
throttling.

**Deck missing images** — remote images must pass the URL safety rules. Uploading
to the hub instead always works.
