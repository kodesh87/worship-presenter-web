---
name: picoclaw-webhook
description: Post Telegram rundowns to BIC PPTX /api/webhook with WEBHOOK_SECRET and read back resolvedHymns / failedHymnNumbers for chat confirmation.
---

# picoclaw webhook intake

## When to use

Events Department pasted a Sabbath rundown in Telegram. Create/update the Service and confirm hymn titles in chat.

## Steps

1. Ensure `WEBHOOK_SECRET` matches the app env.
2. `POST /api/webhook` with JSON body `{ "text": "<rundown>" }` and header `x-webhook-secret: <secret>` (or `Authorization: Bearer <secret>`).
3. On **201/200**, read:
   - `resolvedHymns`: `[{ number, title }, ...]` — use for Telegram readback
   - `failedHymnNumbers`: numbers that did not resolve in the hymnal — report these clearly
4. On **401**, secret mismatch. On **503**, `WEBHOOK_SECRET` not configured on the server.

## Example

```bash
curl -sS -X POST "$BASE_URL/api/webhook" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: $WEBHOOK_SECRET" \
  -d '{"text":"SABBATH, JULY 11, 2026\n\nBIBLE TALK\n[  ] Opening song : SDAH #159\n"}'
```

Full docs + payload shapes: `docs/picoclaw-webhook.md`.
