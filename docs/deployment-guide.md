# Deployment Guide

This document describes the deployment architecture, configuration steps, and operational guidelines for running the `bic-pptx-workflow` project in production.

## System Architecture

The application is architected for **single-node deployment**. Because it uses a file-based SQLite database (`data.db`) configured in WAL mode, **do not run multiple application container instances** against the same database file to prevent database locking and data corruption.

```
                  ┌──────────────────────┐
                  │   Cloudflare Edge    │
                  └──────────┬───────────┘
                             │
                  (Secure Cloudflare Tunnel)
                             │
                             ▼
┌────────────────────────────────────────────────────────┐
│               Host machine (Docker)                        │
│                                                        │
│   ┌────────────────────────────────────────────────┐   │
│   │               cloudflared Service              │   │
│   └───────────────────────┬────────────────────────┘   │
│                           │                            │
│                  (localhost:3000)                      │
│                           │                            │
│                           ▼                            │
│   ┌────────────────────────────────────────────────┐   │
│   │          Docker Container (runner)             │   │
│   │            Next.js App Server                  │   │
│   └───────────────────────┬────────────────────────┘   │
│                           │                            │
│                (Host Volume Bind Mounts)               │
│                           │                            │
│                           ▼                            │
│   ┌────────────────────────────────────────────────┐   │
│   │  C:\WorshipPresenter\presenter.example.org\            │   │
│   │  ├── data.db (SQLite)                          │   │
│   │  ├── cache\pptx\ (Cached Slides)               │   │
│   │  └── uploads\ (Announcement Images)            │   │
│   └────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

---

## Infrastructure Requirements

### 1. Production Host Machine
- **Operating System:** Windows PC configured for 24/7 "Always On" server mode (Sleep and hibernation disabled).
- **Container Runtime:** Docker Desktop configured with the **WSL2 (Windows Subsystem for Linux) backend**.
- **Startup Config:** "Start Docker Desktop when you sign in" must be enabled.

### 2. External Network & Tunneling
- **Cloudflare Tunnel (`cloudflared`):** Installed as a Windows Service. This maps the public domain `presenter.example.org` to the local loopback port of the container (`http://127.0.0.1:3000`), avoiding public port forwarding on the home router.

### 3. Telegram Integration (VPS)
- A separate VPS hosts **picoclaw** and chat bots. When a rundown is received in Telegram, picoclaw routes the payload via POST request to `https://presenter.example.org/api/webhook` secured with the `WEBHOOK_SECRET`.

---

## Environment Configuration

Secrets and local folder mapping paths are defined in `C:\WorshipPresenter\presenter.example.org\.env` on the host:

| Variable | Type | Value / Purpose |
|---|---|---|
| `AUTH_SECRET` | Required | Secure cryptographic signature secret for session cookie verification. |
| `WEBHOOK_SECRET` | Required | Webhook token checked against headers on webhook entries. |
| `DB_PATH` | Required | Target database path inside the container: `/data/data.db`. |
| `PPTX_CACHE_DIR` | Required | Cache storage target inside the container: `/data/cache/pptx`. |
| `AUTH_BOOTSTRAP_USER` | Optional | Username to seed the first administrator. |
| `AUTH_BOOTSTRAP_PASSWORD` | Optional | Password to seed the first administrator. |
| `PPTX_RETENTION_DAYS` | Optional | Number of days to keep cached pptx (default: `60`). |
| `IMAGE_URL_ALLOWLIST` | Optional | Hostname list to restrict remote image loading SSRF vulnerability. |

---

## Deployment Setup Steps

### Step 1: Directory Setup
Create the required storage directory tree on the host:
```powershell
New-Item -ItemType Directory -Force -Path "C:\WorshipPresenter\presenter.example.org\app"
New-Item -ItemType Directory -Force -Path "C:\WorshipPresenter\presenter.example.org\cache\pptx"
New-Item -ItemType Directory -Force -Path "C:\WorshipPresenter\presenter.example.org\uploads"
```

### Step 2: Clone Codebase
Clone the git repository into the app folder:
```powershell
git clone <repository-url> C:\WorshipPresenter\presenter.example.org\app
```

### Step 3: Configure Environment
Create the `.env` file under `C:\WorshipPresenter\presenter.example.org\.env` with all necessary environment values.

### Step 4: Run the Stack
Start the production docker profile:
```powershell
cd C:\WorshipPresenter\presenter.example.org\app
docker compose --profile prod --env-file ..\.env up -d --build
```
This builds the production Docker target `runner` and runs it with restart policies (`restart: unless-stopped`).

---

## Code Update & Deployment Process

Whenever updates are pushed to the remote git branch, redeploy using the provided powershell script:
```powershell
cd C:\WorshipPresenter\presenter.example.org\app
.\scripts\docker compose pull && docker compose up -d
```
This executes:
1. `git pull` to fetch the latest changes.
2. Re-runs `docker compose --profile prod --env-file ..\.env up -d --build` to build the new image layers and replace the container.
*Note: SQLite database and uploaded media assets are untouched as they reside securely on the host.*

---

## Recovery After Power Loss

If the host PC loses power, downtime is accepted. Once power is restored:
1. The PC must reboot.
2. Docker Desktop will auto-launch (via startup configuration).
3. The Compose stack will auto-restart since the containers are marked `restart: unless-stopped`.
4. The Cloudflare Tunnel (`cloudflared` Windows Service) will start automatically.
5. Verify access by loading `https://presenter.example.org/login`.
