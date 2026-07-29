# Review — Version / Reality Check

**Spine:** `ARCHITECTURE-SPINE.md` (initiative altitude)
**Lens:** `finalize_reviewers[0]` — "verify every committed decision was web-researched or reality-checked rather than asserted from training data"
**Date:** 2026-07-29
**Verdict:** PASS ON VERSIONS — every pin verified against installed reality, not training data. **One HIGH finding outside the spine:** the persistent-facts file every agent loads points at a deleted file.

## Method

For a brownfield repo the strongest reality check is the repo itself, not the web: `node_modules/<pkg>/package.json` is what actually runs. Verified installed versions:

| Name | Spine claims | `package.json` | Installed | Verdict |
| --- | --- | --- | --- | --- |
| Next.js | 16.2.10 | 16.2.10 | **16.2.10** | ✅ |
| React / React DOM | 19.2.4 | 19.2.4 | **19.2.4** | ✅ |
| pptxgenjs | ^4.0.1 | ^4.0.1 | **4.0.1** | ✅ |
| better-sqlite3 | ^12.11.1 | ^12.11.1 | **12.11.1** | ✅ |
| fabric | ^6.6.1 | ^6.6.1 | **6.6.1** | ✅ |
| TypeScript / Tailwind / ESLint | ^5 / ^4 / ^9 | same | (range pins) | ✅ range, see F3 |

The pre-update table claimed **Next v14+ / React v18+ / pptxgenjs v3+** — all three were training-data-era assertions, wrong by two major versions on Next and one on React and pptxgenjs. That is exactly this lens's failure mode, and it is now closed.

## Findings

### F1 (HIGH, outside the spine) — `project-context.md` names a file that no longer exists

`_bmad-output/project-context.md` (Framework-Specific Rules) instructs: *"Respect `middleware.ts` matcher: `/api/webhook` is secret-gated only…"*.

**Reality:** there is no `middleware.ts` and no `src/middleware.ts`. The gate is `src/proxy.ts` — Next 16 deprecates the `middleware` convention, and the rename is load-bearing (Proxy always runs on Node, which is what permits per-request SQLite revocation checks; a `middleware.ts` entry would compile for Edge unless it exported `runtime = 'nodejs'`, and Next throws if a Proxy file exports `runtime`).

This matters more than a stale doc line: `project-context.md` is the default `persistent_facts` entry for `bmad-architecture`, `bmad-ux`, and this readiness workflow — **every agent loads it every run** and will look for a file that was deleted.

`deferred-work.md:170` already knows two `docs/` files carry the same stale prose (`docs/architecture.md:79`, `docs/development-guide-monolith.md:86`); `docs/index.md` and `docs/source-tree-analysis.md` were corrected. `project-context.md` was missed.

**Owner:** not this spine. `project-context.md` is owned by `bmad-generate-project-context`; the `docs/` prose is tracked in `deferred-work.md`. Routed there, not silently patched here.

### F2 (LOW) — `presenter.example.church` is correctly sanitized

AD-4 names a host. Verified it is the `example.church` placeholder form, not the production hostname — correct for a public repository.

### F3 (LOW) — Three Stack rows carry ranges, not pins

`Node.js v20+`, `TypeScript ^5`, `Tailwind ^4`. `lint_spine.py` accepts them (a version string is present). Acceptable: the spine states `package.json` is the version authority, and the table is explicitly a seed. No action.

### F4 (LOW) — `fabric` is pinned in the initiative Stack but only used by Epic 16

Not an error (the initiative stack is the union of what ships), and the row is annotated "canvas editor, Epic 16". No action.

## Not asserted from training data

No claim in the spine now rests on model memory: every version came from `node_modules`, every path from a filesystem check, and the authorization behavior from reading `src/proxy.ts` and `src/lib/auth/require.ts` directly.
