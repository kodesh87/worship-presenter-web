# LiveServer + Docker Implementation Plan

**Status:** Ready for implementation handover  
**Date:** 2026-07-19  
**Owner design:** Cursor coaching session (kodesh87)  
**Operator guide (decisions summary):** [`README-deployment.md`](../README-deployment.md)  
**Env reference:** [`docs/deploy.md`](./deploy.md)

This document is the **authoritative implementation plan**. An implementing agent should execute against this file end-to-end without re-litigating product architecture. Do not invent Prisma, VPS Docker hosting, staging, or formal backup systems unless the human explicitly changes scope.

---

## 1. Goal

Ship a repeatable **Dev (optional Docker)** and **Prod (Docker on home Windows PC)** path for `bic-pptx-workflow` such that:

1. Production runs 24/7 on the home PC under Docker Desktop (WSL2).
2. SQLite lives on the Windows host at a fixed path and survives image rebuilds / container recreation.
3. Public HTTPS is via **Cloudflare Tunnel** to `presenter.example.church` (not VPS nginx for this app).
4. Documentation tells a solo operator exactly how to first-boot, update, and recover after power loss.
5. Optional CI runs tests only (no auto-deploy required in this phase).

### Non-goals (explicit)

- Deploying this app on the Ubuntu VPS (2 vCPU / 4 GB; already hosts nginx/WordPress/picoclaw).
- Introducing Prisma / Drizzle / Knex.
- Staging environment.
- Automated backups / HA / multi-instance SQLite.
- Changing product features (parser, PPTX, auth UX, etc.) except as required for container boot.
- Opening inbound router ports when Tunnel is available.

---

## 2. Locked topology

```text
Internet → Cloudflare (HTTPS, presenter.example.church)
         → Cloudflare Tunnel (cloudflared Windows service on home PC)
         → http://127.0.0.1:3000  (Next.js in Docker)
         → SQLite file on host: D:\LiveServer\presenter.example.church\data.db
```

| Tree | Path | Role |
|------|------|------|
| Developer | `D:\Developer\bic\bic-pptx-workflow` | Daily git / optional native `npm run dev` |
| LiveServer | `D:\LiveServer\presenter.example.church\` | Production code checkout + data + secrets + compose |

### LiveServer layout (must match)

```text
D:\LiveServer\presenter.example.church\
  app\                 # git working copy of this repository
  data.db              # DB_PATH (host file)
  cache\pptx\          # PPTX_CACHE_DIR
  .env                 # production secrets (never commit)
  docker-compose.yml   # OPTIONAL live override; prefer in-repo compose if possible
```

**Convention for this plan:** keep `Dockerfile`, `docker-compose.yml`, and `.dockerignore` **in the git repo root** so Dev and Live use the same files. Live checkout is `D:\LiveServer\presenter.example.church\app`. Operator `.env` stays **outside** git at `D:\LiveServer\presenter.example.church\.env` and is passed with `--env-file ..\.env` from `app\`, **or** copied/symlinked carefully — document one method and use it consistently. Preferred:

```powershell
cd D:\LiveServer\presenter.example.church\app
docker compose --env-file ..\.env -f docker-compose.yml --profile prod up -d --build
```

Compose must read `DB_PATH` / `PPTX_CACHE_DIR` from that env file as **Windows host paths** and bind-mount them into the container at stable Linux paths (see §4).

---

## 3. Work packages (implement in order)

### WP0 — Preconditions (docs only / human)

Document (do not automate Windows installers in-repo unless trivial scripts):

- Docker Desktop + WSL2 enabled; “Start when you sign in”.
- Windows sleep/hibernate off for server mode.
- Folders created under `D:\LiveServer\presenter.example.church\`.
- Cloudflare account already has domain; Tunnel to be configured in WP5.

### WP1 — Next.js container-friendly build

**Files likely touched:** `next.config.ts`, `package.json` (scripts only if needed), maybe `Dockerfile`.

1. Enable Next.js `output: 'standalone'` in `next.config.ts` if not already set (required for slim production image). Read Next 16 docs under `node_modules/next/dist/docs/` before changing — this repo uses a Next version that may differ from training data.
2. Ensure standalone build copies/uses `data/song-book/sdah.json` and `data/bible/kjv.json` (and any runtime assets under `public/`, `data/`) so both seeds work inside the container. Bake the whole of `data/` except `data/local/` and `data/uploads/` into the image; **never** bake `data.db`.
3. Confirm `better-sqlite3` native build works in the Docker build stage (Debian/bookworm or node:22-bookworm with build tools). Multi-stage: deps → builder → runner with production node_modules including native addon OR copy standalone + native binding correctly.
4. App must honor:
   - `DB_PATH` (absolute path **inside container**, e.g. `/data/data.db`)
   - `PPTX_CACHE_DIR` (e.g. `/data/cache/pptx`)
   - `PORT` (default 3000)
   - Existing auth/webhook env vars from `.env.example`

**Acceptance**

- `docker build` succeeds on Windows Docker Desktop.
- Container starts; tables created on first boot at mounted DB file.
- Hitting `/login` returns the login page (or redirect) without crash.

### WP2 — Repository Docker assets

**Create:**

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage production image; Node 22 LTS (or 20+) bookworm; build `better-sqlite3`; run `node server.js` from standalone |
| `.dockerignore` | Exclude `node_modules`, `.next`, `.git`, `.work`, `*.db*`, `.cache`, `_bmad-output/party-mode`, etc. |
| `docker-compose.yml` | Profiles `dev` and `prod` (see §4) |
| `docker-compose.override.example.yml` | Optional local path overrides — do not commit secrets |

**Do not** commit real `.env` or LiveServer paths that contain secrets. Use compose variable substitution with defaults documented for LiveServer.

### WP3 — Compose profiles

#### Profile `prod` (required)

- Build from `Dockerfile`.
- `restart: unless-stopped`
- Ports: `127.0.0.1:3000:3000` only (not `0.0.0.0` on LAN unless human asks).
- `env_file` or environment from host `.env`.
- Volumes:
  - Host `D:\LiveServer\presenter.example.church\data.db` → container `/data/data.db`  
    (If binding a single file is painful on Windows, bind host directory `D:\LiveServer\presenter.example.church` data dir — then prefer host layout tweak to `D:\LiveServer\presenter.example.church\data\data.db` **only if file bind fails**; if changing path, update `README-deployment.md` to match. Prefer keeping operator’s chosen path `...\data.db`.)
  - Host `D:\LiveServer\presenter.example.church\cache\pptx` → `/data/cache/pptx`
- Inside container set:
  - `DB_PATH=/data/data.db`
  - `PPTX_CACHE_DIR=/data/cache/pptx`
- Healthcheck: HTTP GET `http://127.0.0.1:3000/` or `/login` (accept 200/302/401 as appropriate).

#### Profile `dev` (required)

- Either:
  - **A:** Dockerfile.dev / target `dev` with `npm run dev`, bind-mount repo source, or
  - **B:** document that daily Dev is native `npm run dev` and compose `dev` is optional parity check.
- Prefer implementing a working `dev` profile that:
  - Mounts source for hot reload.
  - Uses a **separate** DB file default, e.g. host `D:\LiveServer\presenter.example.church\data.dev.db` → `/data/data.db`, so prod data is not corrupted by experiments.
  - Publishes `127.0.0.1:3000:3000` or `3001` if prod occupies 3000 — **document the port**.

**Acceptance**

- `docker compose --profile prod up -d --build` with a sample env brings stack up.
- Deleting/recreating container leaves `data.db` intact on host.
- `docker compose --profile prod down` (without `-v`) does not delete host DB.
- Never document `down -v` as normal deploy step.

### WP4 — Scripts & DX

Add npm or PowerShell helpers **in-repo** (small, reviewed):

| Artifact | Behavior |
|----------|----------|
| `scripts/liveserver-up.ps1` | From LiveServer `app`, `compose --profile prod --env-file ..\.env up -d --build` |
| `scripts/liveserver-pull-deploy.ps1` | `git pull` + up script |
| Optional `Makefile` | Skip if PowerShell is clearer on Windows |

Update `.env.example` with commented LiveServer-oriented examples (Windows host paths for native run; note container paths differ).

### WP5 — Cloudflare Tunnel documentation (ops, not Cloudflare API automation)

Add [`docs/cloudflare-tunnel.md`](./cloudflare-tunnel.md):

1. Install `cloudflared` on Windows.
2. `cloudflared tunnel login` / create tunnel (human clicks Cloudflare UI as needed).
3. Ingress rule: hostname `presenter.example.church` → `http://127.0.0.1:3000`.
4. Install as **Windows service** so it survives reboot and does not depend on an open terminal.
5. DNS CNAME/route in Cloudflare dashboard.
6. Verify: `https://presenter.example.church` reaches login.
7. Picoclaw (on VPS) should call `https://presenter.example.church/api/webhook` — cross-link [`picoclaw-webhook.md`](./picoclaw-webhook.md).

Do not put tunnel credentials in git. Document where Cloudflare stores credentials on Windows (`%USERPROFILE%\.cloudflared\`).

### WP6 — CI (optional but in scope if time)

Add `.github/workflows/test.yml`:

- Trigger: push/PR to `main`
- Node 22
- `npm ci`
- `npm test`
- No deploy job in this phase

### WP7 — Documentation sync (mandatory)

Update these files so they agree with what was implemented (paths, compose commands, ports):

| File | Updates |
|------|---------|
| `README-deployment.md` | Replace “open follow-ups” with real commands; exact compose invocations; link new docs |
| `docs/deploy.md` | Note container `DB_PATH=/data/data.db` vs host path; keep single-node warning |
| `docs/cloudflare-tunnel.md` | New (WP5) |
| `README.md` | Short pointer: local get-started + link `README-deployment.md` (replace create-next-app boilerplate if still present — at least add Deployment section) |
| `.env.example` | Document vars used by compose |

### WP8 — Verification checklist (implementer must run)

On the implementer’s machine (or instruct human if Docker unavailable in agent environment):

1. `npm test` — all pass.
2. `docker build -t bic-pptx:local .` — success.
3. Compose prod with temp host dir mimicking LiveServer layout — success.
4. Webhook smoke: POST sample rundown with `WEBHOOK_SECRET` — 200/201.
5. Login with bootstrap user — session works.
6. PPTX download once — file generated; cache dir on host receives files if caching enabled.
7. `docker compose ... down` then `up` — same service row still in DB.

Record results in a short `_bmad-output/implementation-artifacts/liveserver-docker-verify-notes.md` (commands + pass/fail).

---

## 4. Suggested compose shape (design intent — implementer may adjust)

Illustrative only; implementer writes final YAML.

```yaml
# Conceptual — not copy-paste gospel
services:
  web:
    profiles: ["prod"]
    build: .
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      DB_PATH: /data/data.db
      PPTX_CACHE_DIR: /data/cache/pptx
      # AUTH_* and WEBHOOK_* from env_file
    env_file:
      - ${ENV_FILE:-../.env}
    volumes:
      - ${HOST_DB_FILE:-D:/LiveServer/presenter.example.church/data.db}:/data/data.db
      - ${HOST_PPTX_CACHE:-D:/LiveServer/presenter.example.church/cache/pptx}:/data/cache/pptx
```

**Windows path note:** Docker Desktop accepts `D:/LiveServer/...` or `D:\LiveServer\...` depending on version; prefer forward slashes in compose. Ensure the host file `data.db` exists or that the app creates it — `better-sqlite3` / app already creates parent dirs; for **file** mounts, create an empty file on host first if Docker requires the file to exist.

Dev profile: separate service or same service with different `target` / command `npm run dev`, source mount, `HOST_DB_FILE` defaulting to `data.dev.db`.

---

## 5. Dockerfile design constraints

1. **Multi-stage** to keep final image smaller.
2. Install build toolchain only in builder (`python3`, `make`, `g++`) for `better-sqlite3`.
3. Production CMD runs standalone server; `HOSTNAME=0.0.0.0` so the process listens inside the container.
4. Run as non-root user if feasible without breaking volume permissions on Windows mounts (if permissions fight you, document running as root in v1 and ticket hardening).
5. No corpus import step exists any more — both corpora are committed and seed themselves on first boot. What the image build must guarantee is that `data/bible/kjv.json` and `data/song-book/sdah.json` are *present*; `npm run corpus:verify` in the builder stage fails the build if either is truncated.
6. Song book and bible both seed at runtime from `data/` (already app behavior); ensure the JSON is in the image.

---

## 6. Risk register

| Risk | Mitigation |
|------|------------|
| `better-sqlite3` fails in Alpine | Use bookworm (glibc), not Alpine |
| Windows file bind for single `data.db` flaky | Switch to directory mount + update docs path |
| Docker Desktop not running after reboot | Document sign-in + Start Docker on login; compose restart policy |
| Tunnel down after power loss | Windows service for cloudflared; checklist in README |
| Accidental `compose down -v` | Never attach anonymous volumes for DB; warn in docs |
| Dev profile corrupts prod DB | Default dev to `data.dev.db` |
| Next standalone missing files | `npm run corpus:verify` in the image + check public assets |

---

## 7. Definition of Done

- [ ] `Dockerfile`, `.dockerignore`, `docker-compose.yml` with `dev` + `prod` profiles committed
- [ ] `next.config` supports standalone production image
- [ ] `docs/cloudflare-tunnel.md` written
- [ ] `README-deployment.md` updated with exact commands (no “TBD follow-ups” for WP1–WP5)
- [ ] `docs/deploy.md` + `.env.example` + root `README.md` pointer updated
- [ ] Optional `.github/workflows/test.yml`
- [ ] Helper scripts for LiveServer pull/deploy
- [ ] Verify notes artifact with test/build/compose results
- [ ] No Prisma; no VPS docker deploy instructions presented as primary path

---

## 8. Out-of-order / do-not-touch

- `_bmad/` installer and skill packages
- Product FR work (Intercessory, announcements, etc.) unless a Docker bug forces a one-line fix
- Rewriting PRD / epics for this ops work (optional one-line link from README only)

---

## 9. Handover prompt

Removed 2026-08-01. The prompt this section pointed at was written to hand WP1–WP8 to an
implementer agent; all of them shipped with Story 13.1, so it survived only as an instruction
to redo finished work — while still naming the frozen `bic-pptx-workflow` repo and a
`README-deployment.md` that has never existed in this repository.

The delivered state is the authority now: `Dockerfile`, `docker-compose.yml`, `.dockerignore`,
`docs/cloudflare-tunnel.md`, `docs/deploy.md`, and `.github/workflows/test.yml`.
