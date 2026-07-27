# picoclaw → BIC PPTX webhook

picoclaw posts the Telegram rundown text to create/update a Service and reads back resolved hymn titles for chat confirmation (FR-1).

## Endpoint

`POST /api/webhook`

Auth: `WEBHOOK_SECRET` via header (either form):

- `x-webhook-secret: <secret>`
- `Authorization: Bearer <secret>`

If `WEBHOOK_SECRET` is unset → **503**. Wrong/missing secret → **401**.

## Example request

```http
POST /api/webhook HTTP/1.1
Host: pptx.example.local
Content-Type: application/json
x-webhook-secret: replace-with-WEBHOOK_SECRET

{
  "text": "SABBATH, JULY 11, 2026\n\nBIBLE TALK (09.30-10.50 /80 min)\n[  ] Opening song : SDAH #159 The Old Rugged Cross\n[  ] Closing Song : SDAH #163 At The Cross\n\nDIVINE SERVICE (10.50- 12.05/ 75 min)\n[  ] Opening Song : SDAH #83 O Worship the King\nSpecial Song : -\nSermon : Timotius Wicaksana \"Working Out\" (45m)\n[  ] Closing Song : SDAH #249 Praise Him ! Praise Him !\nClosing Prayer: The Speaker(1m)\n"
}
```

Optional fields:

- `images`: string[] of http(s) image URLs (legacy flyer list on the service)
- `announcements`: string[] of http(s) image URLs — replaces one-off announcement rows for that service date

Telegram-shaped body is also accepted: `{ "message": { "text": "..." } }`.

## Example success response (201 create / 200 update)

```json
{
  "message": "Webhook received and processed successfully",
  "id": 12,
  "date": "2026-07-11",
  "resolvedHymns": [
    { "number": 159, "title": "The Old Rugged Cross" },
    { "number": 163, "title": "At The Cross" },
    { "number": 83, "title": "O Worship the King" },
    { "number": 249, "title": "Praise Him! Praise Him!" }
  ],
  "failedHymnNumbers": [],
  "imagesCount": 0,
  "announcementsAdded": 0,
  "updated": false,
  "parsedData": { "...": "full parsed rundown" }
}
```

## Chat readback (picoclaw)

1. Post rundown with `WEBHOOK_SECRET`.
2. If `failedHymnNumbers` is non-empty, tell the events chat which SDAH numbers failed.
3. Otherwise (or in addition), read back titles from `resolvedHymns` — e.g. `#159 The Old Rugged Cross`.

Do **not** resolve hymn titles via web search; the app is the source of truth.

## Agent skill

See `.claude/skills/picoclaw-webhook/SKILL.md` for a short agent-oriented package.
