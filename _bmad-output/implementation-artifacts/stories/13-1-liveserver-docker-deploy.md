# Story 13.1: LiveServer Docker deploy (presenter.example.org)

Status: done

## Story

As the operator,
I want the hub runnable on the home-PC LiveServer via Docker Desktop + Cloudflare Tunnel,
So that `https://presenter.example.org` stays up with durable SQLite/cache/uploads on the host.

## Acceptance Criteria

1. **Given** Next `output: 'standalone'` and the multi-stage `Dockerfile`, **When** `docker compose --profile prod` builds, **Then** the runner serves the app (`node server.js`) with host-bound `data.db`, PPTX cache, and `uploads/`.
2. **Given** compose `dev` profile, **When** started, **Then** it uses a separate default DB (`data.dev.db`) and does not wipe prod data on `down` without `-v`.
3. **Given** operator docs (`README-deployment.md`, `docs/cloudflare-tunnel.md`, `docs/liveserver-implementation-plan.md`), **When** following them, **Then** the LiveServer layout matches compose volume expectations.

## References

- Spec: `spec-13-hub-ux-and-liveserver-gap.md`
- Related: `spec-devops-local-pc-production.md`, Story 6.8
- Range: `acad206..458aa01` (deploy/docs commits)
