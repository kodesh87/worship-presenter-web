# Review — Rubric Walker (good-spine checklist)

**Spine:** `ARCHITECTURE-SPINE.md` (initiative altitude)
**Lens:** built-in good-spine checklist
**Date:** 2026-07-29
**Mode:** sequential (subagents not authorized this session)
**Verdict:** PASS WITH HIGH FINDINGS — the spine is coherent and ratifies the codebase, but four invariants the code enforces today are absent, and each is a live two-unit divergence point.

## Checklist walk

| Check | Result |
| --- | --- |
| Fixes the real divergence points for the level below | **FAIL** — see F1, F2, F3, F5, F6 |
| Every AD's Rule is enforceable and prevents its stated divergence | PASS (AD-1..AD-4) |
| Nothing under Deferred could let two units diverge | PARTIAL — see F7 |
| Named tech verified-current | PASS (see version lens) |
| Ratifies rather than contradicts the brownfield codebase | PARTIAL — see F4 |
| Spec capability coverage | N/A at this altitude |
| Inherited parent spine not weakened | N/A — this *is* the parent |
| Every dimension the altitude owns is decided / deferred / open | **FAIL** — authorization and schema-evolution dimensions are silent |

## Findings

### F1 (HIGH) — The request gate / authorization dimension is entirely silent

The spine has no AD covering the single most security-bearing boundary in the system.
Reality (`src/proxy.ts`, `src/lib/auth/require.ts`):

- `src/proxy.ts` is the one request gate; **its matcher regex *is* the authorization boundary** — anything it does not match is served with no session check at all.
- The `middleware.ts` → `proxy.ts` rename is **load-bearing**: a `middleware.ts` entry compiles for the Edge runtime unless it exports `runtime = 'nodejs'`, while `proxy.ts` always runs on Node — which is what lets the gate open SQLite and check revocation per request. Next throws if a Proxy file exports `runtime`.
- Session validity is re-checked against the DB every gated request (`validateSessionAgainstDb`: deleted account, demotion, stale `token_version`, revoked `sid`) and **fails closed** — an unreadable DB must not open the hub.
- Every gated response carries `Cache-Control: private, no-store` + `Vary: Cookie`, because the hub is published through a Cloudflare Tunnel where a "cache everything" rule would otherwise serve a rendered private page without the origin — and therefore without the gate — ever running.

None of this is derivable from a compliant unit in isolation, which is the definition of a spine invariant. **Evidence that the gap is already biting:** the epic-16 spine's AD-4 had to restate "re-check the current account role from SQLite" locally, because the parent never fixed it.

**Fix:** add `AD-5 [ADOPTED]`.

### F2 (HIGH) — Optimistic concurrency on service edits is unfixed

`project-context.md` carries it as a Critical Don't-Miss rule ("Service edits require client `updated_at` optimistic concurrency — do not drop the stale-write 409 behavior"), and the code enforces it, but the spine never states it. Worse, the *Consistency Conventions* "State" row ("can be regenerated and overwritten during the review period") reads as permission for last-write-wins.

**Fix:** add `AD-6 [ADOPTED]`; cross-reference it from the State row.

### F3 (MEDIUM→HIGH) — `buildSlidePlan` as the single slide-order source is unfixed

Three surfaces render slides (PPTX, web slideshow, presenter/projector). `project-context.md` fixes this ("Keep `buildSlidePlan` as the single slide-order source … do not diverge ordering/content per surface"); the spine does not. This is the textbook divergence for this system and the failure would land on a Sabbath.

**Fix:** add `AD-7 [ADOPTED]`.

### F4 (MEDIUM) — "Web SPA" contradicts the codebase

AD-2's Rule and the Design Paradigm both say "Web SPA". The app is Next.js App Router with **Server Components by default** (`project-context.md`: "add `'use client'` only when hooks, browser APIs, or event handlers require it"). A builder taking "SPA" literally would build client-heavy and contradict the actual convention. Terminology-level, but the spine is what a fresh agent reads first.

**Fix:** reword to App Router web UI (Server Components by default).

### F5 (MEDIUM) — One image-safety helper is not fixed as an invariant

INIT AD-4 states the announcement image rule (remote allowlisted http(s) **or** `/api/uploads/<32-hex>.(ext)`), but as a clause inside a *deployment* AD. Epic 16 then introduced a second class of image reference (registry `/assets/...` via `isRegistryImageRef`). Nothing forbids a third unit inventing its own resolver with laxer rules.

**Fix:** add `AD-8 [ADOPTED]` — every image reference passes a shared safety helper; no unit ships its own.

### F6 (MEDIUM) — Schema evolution is silent

`project-context.md`: "Schema changes go through app startup DDL / `getDb` path — do not introduce Prisma (or another migration framework) without an explicit product decision." Two units could legitimately choose differently.

**Fix:** add `AD-9 [ADOPTED]`.

### F7 (MEDIUM) — Deferred section is stale in two places

- "Auth hardening: Login rate-limit/lockout; session revoke on logout/password reset" is listed as deferred, but `spec-auth-hardening-rate-limit-and-revocation.md` (2026-07-27) specced it and `src/lib/auth/revocation.ts` + `login_attempts` exist. It shipped.
- The Epic 16 Artifact Registry / canvas editor is a shipped subsystem (`/admin/artifacts`, story 16.1 `done`) that appears nowhere in the initiative spine's own text — only via `child_spines`.

**Fix:** move auth hardening into "Shipped"; name the Artifact Registry in the paradigm/seed.

### F8 (LOW) — `binds: []` is empty at initiative altitude

Template expects the governed capability/unit ids. Cosmetic; fill with the FR set the spine governs.

### F9 (LOW) — Structural seed omits load-bearing files

`src/proxy.ts` (the gate), `tests/` (the guard suite incl. `proxy-matcher.test.mjs` and `public-repo-guard.test.mjs`), `.constitution/` are absent from the tree. Given F1, the gate's location belongs in the seed.

## Tail

Nothing further at medium/low beyond F8/F9.
