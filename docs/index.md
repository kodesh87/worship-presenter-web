# Project Documentation Index

Welcome to the documentation index for the `bic-pptx-workflow` project. This page acts as a directory to navigate the system's architecture, API contracts, data schemas, and setup manuals.

---

## Project Overview

- **Repository Type:** Monolith (Single cohesive codebase)
- **Primary Language:** TypeScript / JavaScript (ES Modules)
- **Architecture Style:** Layered App Router Architecture (Next.js)

### Quick Reference

- **Tech Stack:** Next.js 16, React 19, SQLite (`better-sqlite3`), Tailwind CSS v4, PptxGenJS, JSZip
- **Application Entry Points:**
  - Standard Browser UI Layout: [src/app/layout.tsx](file:///d:/Developer/bic/bic-pptx-workflow/src/app/layout.tsx)
  - Bot Webhook Entry Point: [src/app/api/webhook/route.ts](file:///d:/Developer/bic/bic-pptx-workflow/src/app/api/webhook/route.ts)
  - Session Interceptor: [src/proxy.ts](file:///d:/Developer/bic/bic-pptx-workflow/src/proxy.ts) (Next 16 renamed the `middleware` convention to `proxy`; the proxy runs on the Node.js runtime and re-checks each session against SQLite)
- **Primary Database File:** `data.db` (SQLite, WAL mode active)

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

- **[Cloudflare Tunnel Setup](./cloudflare-tunnel.md):** Configurations to expose the local Windows server container to public domains.
- **[Durable Server Deployment](./deploy.md):** Guidelines for standard deployments, WAL configurations, and server font dependencies.
- **[Picoclaw Webhook Specifications](./picoclaw-webhook.md):** Request body contract for the bot webhook receiver.

---

## Getting Started (Quick commands)

Run these commands in the root of the project to boot local development:

```powershell
# 1. Install dependencies
npm install

# 2. Seeding SQLite tables
npm run import:hymnal
npm run import:kjv

# 3. Booting local Next.js dev server
npm run dev

# 4. Running the full test suite
npm test
```
