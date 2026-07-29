# Review — Rubric Walker (good-spine checklist)

**Spine:** `ARCHITECTURE-SPINE.md` (epic altitude, Epic 16 — Slide Artifact Model)
**Lens:** built-in good-spine checklist
**Date:** 2026-07-29
**Verdict:** PASS WITH ONE HIGH — the five ADs are tight and enforceable, but one AD contradicts an inherited invariant, and the Deferred section has gone stale now that story 16.1 is done.

## Checklist walk

| Check | Result |
| --- | --- |
| Fixes the real divergence points for its stories | PASS — registry storage, payload shape, canvas boundary, admin scope, layout identity all fixed |
| Every AD's Rule is enforceable and prevents its stated divergence | PASS |
| Nothing under Deferred could let two units diverge | **FAIL** — see E3 |
| Named tech verified-current | PASS (see version lens) |
| Ratifies rather than contradicts the brownfield codebase | **FAIL** — see E1 |
| Covers the driving spec's capabilities | PASS — `spec-slide-artifact-model` capabilities map to AD-1..AD-5 |
| No new AD weakens or contradicts an inherited one | **FAIL** — see E1 |
| Every dimension this altitude owns is decided / deferred / open | PARTIAL — see E2, E4 |

## Findings

### E1 (HIGH) — AD-1 contradicts inherited INIT AD-4 by naming Vercel

AD-1's *Prevents* reads "Ephemeral data loss in Docker/**Vercel** and file-lock concurrency issues."

Vercel is not a deployment target of this system and cannot be one: INIT AD-4 fixes production as a single Docker/standalone unit on the home-PC LiveServer with host-durable bind mounts, and `project-context.md` states outright "do not assume VPS Docker deploy". A serverless platform also cannot host `better-sqlite3` (native addon) against a durable `DB_PATH`.

Under the inheritance rule, a local AD that contradicts a parent invariant is **a conflict to surface, not an override**. Here it is not even a deliberate divergence — it is a stray platform name that arrived with the drafting model's assumptions.

**Fix:** replace with the platform-neutral risk it was reaching for ("ephemeral container filesystems"). The *rule* AD-1 states is unaffected; only the rationale text was wrong.

### E2 (MEDIUM) — AD-1 omits the seed-precedence rule, which is a privacy invariant

AD-1 names `data/default-registry.json` as the startup seed. The repository's actual seed contract has two layers: `data/local/default-registry.json` is git-ignored and **preferred by the seeder over the shipped example whenever present** (`AGENTS.md`, `docs/PRIVATE-DATA.md`).

A future builder implementing or refactoring the seed path from this AD alone would read the shipped synthetic example and ignore the local override — which is precisely the mechanism that keeps real congregation data out of a public repository. That makes it an invariant, not a detail.

**Fix:** state the two-layer precedence in AD-1's Rule.

### E3 (MEDIUM) — Deferred is stale; story 16.1 is done

Deferred says "Specific SQLite column names and internal module decomposition are deferred to **Story 16.1**". Story 16.1 is `status: done` — those names are now decided by shipped code, so the item defers to something already settled. A Deferred entry that has been resolved reads as an open decision and invites a second, divergent answer.

**Fix:** retire the item; point at the shipped module + the `registry-contract.md` companion that fixes observable behavior.

### E4 (MEDIUM) — No diagram, and the dependency direction *is* a rule

The spine carries no mermaid. The rubric expects a dependency-direction diagram, and here it is load-bearing rather than decorative: AD-2 makes both renderers "dumb consumers", and AD-4 requires planners/renderers to read the registry **through server-side modules rather than the management API**. That is a direction rule stated in prose across two ADs and drawn nowhere.

**Fix:** add a dependency-direction mermaid.

### E5 (LOW) — AD field order differs from the template and the parent

Blocks list **Rule → Binds → Prevents**; the template and the initiative spine use **Binds → Prevents → Rule**. `lint_spine.py` is order-agnostic, so this is readability only — but two sibling spines read differently.

**Fix:** reorder to match.

## Note (not a spine finding — routed to the readiness report)

`spec-16-2-artifact-pipeline-completion.md` (28.4 KB, 2026-07-27) specs substantial further Epic 16 work, but `stories/` contains only `16-1`. The spine's phrase "later Epic 16 stories" has no story files behind it. That is a delivery-tracking gap for the readiness assessment, not an architecture defect.
