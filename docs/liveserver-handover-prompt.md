# Handover prompt (paste into Antigravity / implementer agent)

Copy everything inside the block below.

---

```text
You are implementing LiveServer + Docker for the bic-pptx-workflow repo.

## Authority (read first, in this order)
1. docs/liveserver-implementation-plan.md  ← FULL PLAN — follow all WPs; do not re-design topology
2. README-deployment.md                   ← operator decisions already locked
3. docs/deploy.md                         ← env vars / SQLite notes
4. docs/picoclaw-webhook.md               ← webhook contract (for smoke test)
5. .env.example
6. node_modules/next/dist/docs/           ← before changing Next config (Next 16 in this repo)

## Locked decisions (do not revisit)
- Prod = home Windows PC 24/7, Docker Desktop (WSL2), NOT the thin Ubuntu VPS
- Public URL = https://presenter.example.church via Cloudflare Tunnel → http://127.0.0.1:3000
- DB on host: D:\LiveServer\presenter.example.church\data.db (survive rebuilds; never only in container layer)
- Live code checkout: D:\LiveServer\presenter.example.church\app
- Secrets: D:\LiveServer\presenter.example.church\.env (never commit)
- No Prisma; keep better-sqlite3 + existing CREATE TABLE IF NOT EXISTS
- No staging; no formal backup system; no VPS Docker for this app
- Power loss = downtime OK; document auto-start recovery

## Your job
Execute work packages WP1→WP8 in docs/liveserver-implementation-plan.md:
1. Enable Next standalone (if needed) + Dockerfile multi-stage with better-sqlite3 (bookworm, not Alpine)
2. .dockerignore + docker-compose.yml with profiles `dev` and `prod`
3. Prod: restart unless-stopped, bind 127.0.0.1:3000, mount DB + pptx cache; container DB_PATH=/data/data.db
4. Dev profile: separate DB default (data.dev.db); hot reload via mount OR document native npm run dev as primary
5. PowerShell helpers for LiveServer pull/deploy
6. Write docs/cloudflare-tunnel.md (Windows service cloudflared → 127.0.0.1:3000)
7. Optional: .github/workflows/test.yml (npm test only, no deploy)
8. Sync README-deployment.md, docs/deploy.md, README.md, .env.example with REAL commands
9. Run verification checklist; write _bmad-output/implementation-artifacts/liveserver-docker-verify-notes.md

## Constraints
- Do not modify _bmad/ or BMAD skills
- Do not add Prisma / change product features unless required for container boot
- Do not recommend `docker compose down -v` as normal deploy
- Prefer D:/ forward-slash paths in compose for Windows
- If single-file DB mount fails on Docker Desktop, use directory mount and UPDATE docs to match — note the change in verify notes
- Speak/implement documentation in English (project document language); keep operator paths Windows-exact

## Done when
Definition of Done in docs/liveserver-implementation-plan.md §7 is fully checked, verify notes exist, and README-deployment.md no longer lists Dockerfile/compose/tunnel as unimplemented follow-ups.
```

---
