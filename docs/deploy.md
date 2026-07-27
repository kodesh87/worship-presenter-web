# Deploy (single-node Node + SQLite)

BIC PPTX Workflow is designed for **one persistent Node process** with a **durable volume** for SQLite. Do not run multiple app instances against the same `data.db`.

For a worked container deployment, see [`deployment-guide.md`](./deployment-guide.md).

## Requirements

- Node.js 20+ (24 OK)
- Built app: `npm ci` → `npm run import:hymnal` (once) → `npm run build`
- Durable disk path for the database file

## Environment

| Variable | Required | Notes |
|----------|----------|--------|
| `DB_PATH` | Recommended | Absolute path on a durable volume, e.g. `/var/lib/bic-pptx/data.db`. Default: `./data.db` under cwd. **In Docker**, this should be `/data/data.db` mapped to a host file. |
| `AUTH_SECRET` | Yes (prod) | Session HMAC secret (≥32 bytes recommended). |
| `AUTH_BOOTSTRAP_USER` / `AUTH_BOOTSTRAP_PASSWORD` | First boot | Seeds the first admin when `accounts` is empty; remove after. |
| `WEBHOOK_SECRET` | Yes for picoclaw | Required for `POST /api/webhook`. |
| `IMAGE_URL_ALLOWLIST` | Optional | Comma-separated hostnames for remote announcement/PPTX images. When unset, http(s) URLs are allowed except localhost/private/metadata hosts. Does **not** apply to hub-local upload paths (`/api/uploads/...`). |
| `UPLOADS_DIR` | Optional | Absolute directory for announcement file uploads (default: `./data/uploads` under cwd). In Docker, bind-mount a durable host folder here (compose maps host `uploads/` → `/app/data/uploads`). |
| `PPTX_RETENTION_DAYS` | Optional | Days to keep cached generated PPTX under `.cache/pptx/` (default 60). `0` = keep forever. Overridable in Admin settings. |
| `PPTX_CACHE_DIR` | Optional | Override cache directory (default `.cache/pptx` under cwd). |
| `PORT` | Optional | Default Next listen port. |

### Announcement image refs

Announcements accept either:

1. **Remote** `http(s)` image URLs (SSRF-hardened via `IMAGE_URL_ALLOWLIST` / private-host block), or
2. **Hub-local uploads** stored as `/api/uploads/<32-hex>.(jpg|jpeg|png|gif|webp)` after `POST /api/upload` (session required). PPTX generation reads these from disk under `UPLOADS_DIR`; the browser loads them via `GET /api/uploads/...` while logged in.

Do not paste bare relative paths other than the `/api/uploads/...` form above.

## Fonts (FR-14)

Phase 1 decks use **Arial** (system font face in PPTX). On the presentation host, ensure Arial (or a close substitute mapped by PowerPoint/LibreOffice) is installed. Embedding custom fonts is out of scope for Phase 1; if a venue machine lacks Arial, install the font pack or accept the host’s default sans-serif substitution.

## SQLite hardening (built-in)

On open, the app sets:

- `journal_mode = WAL` — better concurrent read during writes
- `busy_timeout = 5000` — wait on lock contention instead of failing immediately
- `foreign_keys = ON`
- Creates the parent directory of `DB_PATH` if missing

Keep the WAL sidecar files (`*-wal`, `*-shm`) on the **same volume** as `DB_PATH`.

## Run

```bash
export DB_PATH=/var/lib/bic-pptx/data.db
export AUTH_SECRET=...
export WEBHOOK_SECRET=...
npm run build
npm run start
```

Process manager example (systemd): one `ExecStart=npm run start` (or `node node_modules/next/dist/bin/next start`), `Restart=on-failure`, and a mount for `/var/lib/bic-pptx`.

## PPTX cache retention (FR-10b)

Generated PPTX files may be written under `.cache/pptx/` on download. Retention deletes **only those cache files** older than the policy window — Service rows, rundown text, and announcement images are never auto-deleted. Configure via `PPTX_RETENTION_DAYS` or Admin → Retention. Cleanup runs when a PPTX is generated and when Admin saves the retention setting.

## KJV scripture (Phase 6 / FR-19)

For Presenter Mode on-demand lookup only (never for deck theme/verse slides):

```bash
npm run import:kjv
```

Reads the latest `.work/tp_bible_book_translations_*.json` and `.work/tp_bible_verses_*.json` into `bible_books` / `bible_verses`.

## Backup

Stop writes (or briefly stop the process), copy `data.db` plus `-wal`/`-shm` if present, or use `sqlite3 "$DB_PATH" ".backup backup.db"`.

## picoclaw

See [picoclaw-webhook.md](./picoclaw-webhook.md).
