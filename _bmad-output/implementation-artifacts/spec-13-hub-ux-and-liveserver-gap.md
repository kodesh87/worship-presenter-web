---
title: '13 Hub UX + LiveServer deploy gap (acad206..458aa01)'
type: 'feature'
created: '2026-07-19'
status: 'done'
baseline_revision: 'acad206'
final_revision: '458aa01'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/README-deployment.md'
  - '{project-root}/docs/deploy.md'
  - '{project-root}/docs/liveserver-implementation-plan.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-devops-local-pc-production.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-6-1-persistent-announcement-list.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-6-7-image-url-allowlist-ssrf.md'
warnings:
  - 'Retrospective BMAD capture of vibe-coded commits after Epic 12; not a greenfield PRD story.'
---

<intent-contract>

## Intent

**Problem:** After BMAD-tracked work through `acad206`, commits `acad206..458aa01` shipped LiveServer Docker deploy plus hub UX (shared Header, dashboard search, local announcement uploads, profile/change-password) without BMAD specs. Operators and later agents could not tell what was intentional vs undocumented drift. Local upload refs (`/api/uploads/...`) also mismatched Story 6.1/6.7 “http(s) only” rules until aligned.

**Approach:** Retrospectively document the gap as Epic 13 (done): (1) LiveServer Docker/standalone/tunnel topology already described in operator docs; (2) hub shell UX; (3) hub-local upload paths as a first-class exception beside remote http(s), with PPTX reading files from `UPLOADS_DIR`. Amend 6.1/6.7 change logs so SSRF rules stay for remote URLs only.

## Boundaries & Constraints

**Always:**
- Remote announcement URLs remain http(s) + `IMAGE_URL_ALLOWLIST` / private-host block (Story 6.7).
- Local uploads only as `/api/uploads/<32-hex>.(jpg|jpeg|png|gif|webp)`; path traversal rejected; PPTX resolves via filesystem under `UPLOADS_DIR`.
- Durable host paths for `data.db`, PPTX cache, and `uploads/` (not only container layers).
- Session required for hub APIs including `POST /api/upload` (existing middleware).

**Block If:**
- None (documentation + already-shipped code alignment).

**Never:**
- Treat arbitrary relative paths as safe image URLs.
- Bypass SSRF hardening for remote http(s) hosts.
- Require rewriting historical Epic 6 story ACs; amend via Spec Change Log instead.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Remote URL | `https://cdn.example.com/a.jpg` | Accepted; PPTX embeds via URL | Reject private/non-http(s) |
| Local upload | POST file → `/api/uploads/<hex>.png` | Stored; announcement accepts; PPTX reads disk | 400 bad type/ext |
| Traversal | `/api/uploads/../secret.png` | Rejected by `isSafeImageUrl` / GET 404 | No file escape |
| Dashboard search | Client query on loaded services | Filters date/speaker/title | Empty state message |
| Change password | Session + new password ≥8 | `updateAccount` succeeds | 401 / 400 |

</intent-contract>

## Code Map

- `Dockerfile`, `docker-compose.yml`, `next.config.ts` -- standalone LiveServer image + volumes
- `docs/cloudflare-tunnel.md`, `README-deployment.md`, `docs/deploy.md` -- operator topology + `UPLOADS_DIR`
- `src/components/Header.tsx` -- shared nav, active route, profile dropdown, change-password modal
- `src/app/api/auth/change-password/route.ts` -- session-gated password update
- `src/app/ServicesList.tsx` -- client-side dashboard search
- `src/app/login/page.tsx` -- login polish
- `src/lib/uploads.ts` -- local upload ref + filesystem helpers
- `src/app/api/upload/route.ts`, `src/app/api/uploads/[filename]/route.ts` -- store/serve
- `src/lib/images.ts`, `src/lib/announcements.ts`, `src/lib/pptx.ts` -- accept + resolve local refs
- `src/app/announcements/AnnouncementsManager.tsx` -- file upload UI

## Tasks & Acceptance

**Execution:**
- [x] LiveServer Docker standalone + compose prod/dev + tunnel docs -- gap deploy half
- [x] Shared Header / Settings label / login polish / profile change-password -- gap UX half
- [x] Dashboard client search (`ServicesList`) -- operator findability
- [x] Local upload API + Announcements integration -- hub images without public CDN
- [x] Align `isSafeImageUrl` / announcement assert / PPTX disk resolve for `/api/uploads/...` -- close 6.1/6.7 mismatch
- [x] Operator docs (`deploy.md`, `README-deployment`, `.env.example`) -- living SSOT
- [x] BMAD Epic 13 stories + this spec + sprint-status + 6.1/6.7 change logs -- tracking

**Acceptance Criteria:**
- Given range `acad206..458aa01`, when reading Epic 13 artifacts, then deploy + hub UX + uploads are listed as done with code map.
- Given `/api/uploads/<32-hex>.png`, when asserting announcement URL, then it is accepted; when generating PPTX, then the file is read from `UPLOADS_DIR` if present.
- Given a remote private IP URL, when asserting, then it is still rejected (6.7 unchanged for remote).
- Given LiveServer layout docs, when comparing to compose volumes, then `uploads/` is documented beside `data.db` and PPTX cache.

## Spec Change Log

### 2026-07-19 — Retrospective BMAD capture
- Documented vibe-coded gap as Epic 13.
- Local upload path contract added; 6.1/6.7 amended via their Spec Change Logs.

## Review Triage Log

### 2026-07-19 — Checkpoint / doc align
- intent_gap: 0
- bad_spec: 0
- patch: 1 (local upload vs http(s)-only mismatch fixed in code + docs)
- defer: 0
- reject: 0
- addressed_findings:
  - `[high]` `[patch]` Upload returned relative `/api/uploads/...` rejected by 6.1/6.7 rules → allow safe local refs + PPTX filesystem resolve

## Design Notes

Epic 13 is a **retroactive** BMAD envelope for work that already landed on `main` between `acad206` and `458aa01`, plus the upload-alignment fix. Living operator docs remain SSOT for deploy steps; this spec is the BMAD contract so future agents do not treat the gap as undocumented drift.

Change-password requires an authenticated session but not the current password (accepted for single-operator hub; revisit if multi-user threat model tightens).

## Verification

**Commands:**
- `npm test` -- includes `announcements-url` + `images-ssrf` local-upload cases
- `npm run build` -- optional compile check

## Auto Run Result

Status: done

**Summary:** Gap `acad206..458aa01` captured as Epic 13 (LiveServer deploy, hub shell UX, local announcement uploads). Local `/api/uploads/...` refs aligned with image safety + PPTX disk resolve. Operator docs and BMAD tracking updated.

**Files changed (alignment pass):**
- `src/lib/uploads.ts` (new)
- `src/lib/images.ts`, `src/lib/announcements.ts`, `src/lib/pptx.ts`
- `src/app/api/upload/route.ts`, `src/app/api/uploads/[filename]/route.ts`
- `docs/deploy.md`, `README-deployment.md`, `.env.example`
- `tests/announcements-url.test.mjs`, `tests/images-ssrf.test.mjs`
- BMAD: this spec, stories 13-1..13-3, sprint-status, Spec Change Logs on 6.1/6.7

**Residual risks:** Uploaded files require durable volume; SVG rejected; change-password without current-password check.
