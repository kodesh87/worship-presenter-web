# Review — Version / Reality Check

**Spine:** `ARCHITECTURE-SPINE.md` (epic altitude, Epic 16)
**Lens:** `finalize_reviewers[0]` — reality-checked vs asserted from training data
**Date:** 2026-07-29
**Verdict:** ONE HIGH (a named platform that does not exist in this system), otherwise clean.

## Named technologies, checked against the repo

| Named in spine | Reality | Verdict |
| --- | --- | --- |
| SQLite (registry storage) | `better-sqlite3` 12.11.1 installed, WAL, `DB_PATH` | ✅ |
| Fabric.js (canvas editor) | `fabric` 6.6.1 installed | ✅ |
| PptxGenJS (renderer) | `pptxgenjs` 4.0.1 installed | ✅ |
| BroadcastChannel (inherited sync) | `src/lib/present-channel.ts` exists | ✅ |
| `data/default-registry.json` (seed) | file exists | ✅ but incomplete — see rubric E2 |
| **Vercel** | **not a target of this system** | ❌ see F1 |
| `docs/architecture.md` (a `sources:` entry) | file exists | ✅ but see F2 |

## Findings

### F1 (HIGH) — "Vercel" is a training-data artifact, not a project fact

AD-1's *Prevents* names Vercel. Nothing in this repository deploys to Vercel, and nothing could: production is a Docker/standalone unit on the home-PC LiveServer behind a Cloudflare Tunnel (INIT AD-4), and `better-sqlite3` is a native addon needing a durable host path. This is the signature of a platform assumed from model priors rather than checked — exactly what this lens exists to catch. Same finding as rubric E1; fixed there.

### F2 (MEDIUM, inherited from the parent's finding) — `docs/architecture.md` is a stale source

`sources:` lists `docs/architecture.md`. That file still describes the request gate as "middleware" (`deferred-work.md:170`), and `src/middleware.ts` was deleted in favour of `src/proxy.ts` under Next 16. The reference is not broken and the staleness does not touch Epic 16's own subject matter, so it stays as a traceability source — but a builder following it for auth behavior would be misled.

**Owner:** tracked in `deferred-work.md`; not patched from this spine.

### F3 (LOW) — Fabric's uncontrolled-wrapper rationale is version-sensitive

AD-3 fixes the Uncontrolled Wrapper pattern to avoid two-way-binding lag. Verified against fabric 6.6.1 (the installed major). The rule is sound for v6; a future fabric major with a React-first API would warrant revisiting. Logged as a revisit condition rather than a change.
