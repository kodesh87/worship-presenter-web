# Project Documentation Index

Welcome to the documentation index for `worship-presenter-web`. This page acts as a directory to navigate the system's architecture, API contracts, data schemas, and setup manuals.

> This index was generated while the project still lived in `bic-pptx-workflow`, and until 2026-08-01 it said so — naming the frozen legacy repository and linking three entry points to absolute paths inside it. `worship-presenter-web` is the only active root; see `AGENTS.md`.

---

## Project Overview

- **Repository Type:** Monolith (Single cohesive codebase)
- **Primary Language:** TypeScript / JavaScript (ES Modules)
- **Architecture Style:** Layered App Router Architecture (Next.js)

### Quick Reference

- **Tech Stack:** Next.js 16, React 19, SQLite (`better-sqlite3`), Tailwind CSS v4, PptxGenJS, JSZip, Fabric.js (canvas editor)
- **Application Entry Points:**
  - Standard Browser UI Layout: [src/app/layout.tsx](../src/app/layout.tsx)
  - Bot Webhook Entry Point: [src/app/api/webhook/route.ts](../src/app/api/webhook/route.ts)
  - Session Interceptor: [src/proxy.ts](../src/proxy.ts) (Next 16 renamed the `middleware` convention to `proxy`; the proxy runs on the Node.js runtime and re-checks each session against SQLite)
- **Primary Database File:** `data.db` (SQLite, WAL mode active). In production the path comes from `DB_PATH` and points at a durable host directory, never a container layer — see [Durable Server Deployment](./deploy.md)

---

## Generated Documentation

- **[Project Overview](./project-overview.md):** High-level feature sets, technical layers, and overall objectives.
- **[System Architecture](./architecture.md):** Core execution flow diagrams, design patterns, and security/SSRF hardening.
- **[Source Tree Analysis](./source-tree-analysis.md):** Comprehensive file directory index, folder responsibilities, and code files breakdown.
- **[Component Inventory](./component-inventory-monolith.md):** UI React views and layout primitives catalog, detailing synchronization channels.
- **[Development Guide](./development-guide-monolith.md):** Developer onboarding, databases seeding instructions, test suite executing, and database evolution.
- **[Deployment Guide](./deployment-guide.md):** Production Docker Desktop, host volume configuration, environment variables, and Cloudflare Tunnel configs.
- **[API Contracts](./api-contracts-monolith.md):** Complete specifications of REST endpoints, session cookie parameters, and webhook triggers.
- **[Data Models](./data-models-monolith.md):** Database schema ER diagram, table constraints, columns documentation, and seeding properties.

---

## Pre-existing Project Documentation

- **[Quickstart](./QUICKSTART.md):** Shortest path from a fresh clone to a running hub.
- **[Private Data](./PRIVATE-DATA.md):** Where a congregation's own data lives, and why none of it belongs in this repository. **Read before committing anything** — this repository is public.
- **[Cloudflare Tunnel Setup](./cloudflare-tunnel.md):** Configurations to expose the local Windows server container to public domains.
- **[Durable Server Deployment](./deploy.md):** Guidelines for standard deployments, WAL configurations, and server font dependencies.
- **[Picoclaw Webhook Specifications](./picoclaw-webhook.md):** Request body contract for the bot webhook receiver.
- **[LiveServer Implementation Plan](./liveserver-implementation-plan.md):** The WP1–WP8 design record behind the Docker / Cloudflare Tunnel deployment. Delivered under Story 13.1 — a historical plan, not operator instructions; use the two guides above for that.

---

## Getting Started (Quick commands)

Run these commands in the root of the project to boot local development:

```powershell
# 1. Install dependencies
npm install

# 2. Check the shipped corpora (they seed themselves on first boot)
npm run corpus:verify

# 3. Booting local Next.js dev server
npm run dev

# 4. Running the full test suite
npm test
```
