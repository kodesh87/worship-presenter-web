---
name: 'BIC Worship Presentation Automation'
type: architecture-spine
purpose: build-substrate
altitude: initiative
paradigm: 'monolith-with-separated-presentation'
scope: 'bic-pptx-workflow system covering agent integration, data API, and presentation rendering'
status: final
created: '2026-07-10'
updated: '2026-07-19'
binds: []
sources: ['_bmad-output/planning-artifacts/briefs/brief-bic-pptx-workflow-2026-07-10/brief.md', '_bmad-output/planning-artifacts/prds/prd-bic-pptx-workflow-2026-07-10/prd.md']
companions: []
---

# Architecture Spine — BIC Worship Presentation Automation

## Design Paradigm

**Monolithic Next.js app (App Router UI + API routes)**
One deployable unit serves the operator Web Hub, JSON APIs (webhook/services), hymnal lookups, PPTX generation, web slideshow, and presenter mode. Operators/agents follow `.claude/skills/picoclaw-webhook/` to POST the webhook JSON API (skill docs, not an in-process runtime). **Offline PPTX remains the primary Sabbath path**; in-browser slideshow / presenter are also shipped (FR-15 / FR-16).

## Invariants & Rules

### AD-1 — Web Hub + Offline PPTX (Phase sequencing)
- **Binds:** Presentation rendering, Operator experience
- **Prevents:** Dependency on venue internet during Sabbath services
- **Rule:** Operators use a zero-install **Web Hub** for review/run-sheet. **Phase 1** presents on Sabbath from a downloadable offline **PPTX**. In-browser Web Slideshow / Presenter Mode are **shipped** (FR-15 / FR-16) but are **not** the hard offline Sabbath guarantee; PPTX download remains primary for venue reliability.

### AD-2 — Single Repository Monolith
- **Binds:** Code organization, deployment
- **Prevents:** Operational complexity and synchronization issues for a solo developer
- **Rule:** The picoclaw skill integration logic, API backend, and Web SPA must reside in a single repository and be deployable as a cohesive unit.

### AD-3 — Decoupled Ingestion and Presentation
- **Binds:** Data boundaries, external integrations
- **Prevents:** Tightly coupled integrations that would make replacing the Telegram/Agent ingestion difficult
- **Rule:** The API must expose a standard JSON interface for service generation that is agnostic to the input mechanism (Telegram/picoclaw). The presentation layer consumes this same API.

### AD-4 — LiveServer durable paths (home PC production)
- **Binds:** Deployment, SQLite, announcement uploads
- **Prevents:** Ephemeral container-only data loss
- **Rule:** Production runs as one Docker/standalone unit on the home-PC LiveServer (`presenter.example.church` via Cloudflare Tunnel). Host-durable paths for `DB_PATH`, PPTX cache, and `UPLOADS_DIR` (compose bind-mounts). Operator details: `README-deployment.md` / `docs/deploy.md`. Announcement image refs are remote http(s) (SSRF-hardened) **or** hub-local `/api/uploads/<32-hex>.(jpg|jpeg|png|gif|webp)` resolved from disk for PPTX.

## Consistency Conventions

| Concern | Convention |
| --- | --- |
| Naming (entities, files) | kebab-case for directories/files, PascalCase for components, camelCase for variables/functions. |
| Data & formats | API responses use standard JSON envelopes. Dates stored and transmitted in ISO 8601 UTC. |
| State | Services are immutable once presented, but can be regenerated and overwritten during the review period (Friday). |

## Stack

| Name | Version |
| --- | --- |
| Node.js | v20+ |
| Next.js | v14+ |
| React | v18+ |
| SQLite | 3+ (for simple standalone data storage) |
| pptxgenjs | v3+ (for PPTX generation) |

## Structural Seed

```mermaid
graph TD
    Telegram[Telegram Channel] -->|Text| Picoclaw[picoclaw Agent]
    Picoclaw -->|JSON Payload| API[Backend API]
    API --> DB[(SQLite DB)]
    Hymnal[(Hymnal DB)] --> API
    API -->|Review Data| WebApp[Web SPA]
    WebApp -->|Download| PPTX[PPTX File]
    PPTX -->|Phase 1 Sabbath| Projector[Projector / OBS]
    WebApp -.->|Shipped FR-15/16 (optional path)| WebShow[Web Slideshow / Presenter]
```

```text
bic-pptx-workflow/
  src/app/           # Next.js App Router UI + API routes (hub, webhook, services, slideshow, presenter)
  src/lib/           # parser, pptx, slide-plan, lyrics, db, images, uploads, scripture
  src/components/    # Header (shared nav/profile) + ui/ Shadcn
  data/              # Normalized hymnal corpus (hymns.json); SQLite path via DB_PATH
  data/uploads/      # default UPLOADS_DIR (durable host volume in LiveServer prod)
  Dockerfile / docker-compose.yml  # LiveServer prod/dev profiles (standalone)
  scripts/           # import-hymnal, import:kjv, liveserver helpers
  .claude/skills/picoclaw-webhook/  # agent skill docs for webhook intake/readback (FR-1); not a runtime server
```

## Deferred

**Shipped (no longer deferred):** Per-person Admin/Operator auth (FR-18 / Story 6.2); Web Slideshow (FR-9/15); Telegram corrections + concurrency (FR-12/13b); PPTX retention (FR-10b); Presenter Mode (FR-16); KJV scripture display path (FR-19 UI/import — corpus commit still open below).

**Still deferred / open leftovers:**

- **FR-19 corpus ops:** KJV text not committed under `data/`; import from `.work/` / `import:kjv` remains an ops step.
- **Auth hardening:** Login rate-limit/lockout; session revoke on logout/password reset.
- **Multi-Church Configuration:** BIC-only until v1 is proven; multi-tenant deferred.
- **SDAH lyric license/attribution:** Document church copyright status for `data/hymns.json`.
