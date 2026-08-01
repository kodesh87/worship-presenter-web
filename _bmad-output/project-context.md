---
project_name: 'worship-presenter-web'
user_name: 'kodesh87'
date: '2026-07-29'
legacy_frozen_repo: 'bic-pptx-workflow'
sections_completed:
  [
    'technology_stack',
    'language_rules',
    'framework_rules',
    'testing_rules',
    'code_quality_rules',
    'workflow_rules',
    'dont_miss_rules',
  ]
status: 'complete'
rule_count: 36
optimized_for_llm: true
existing_patterns_found: 12
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that LLMs need to be reminded of._

---

## Technology Stack & Versions

- Node.js 20+, Next.js 16.2.10 (App Router, `output: "standalone"`), React 19.2.4, TypeScript ^5 strict, Tailwind ^4
- Data/render: better-sqlite3 ^12 (native addon; `DB_PATH`, WAL), pptxgenjs ^4, jszip ^3
- UI: shadcn/ui (base-nova) + `@base-ui/react` + lucide; next-themes, sonner
- Lint/tests: ESLint 9 + eslint-config-next 16.2.10; Node `node:test` + `--experimental-strip-types` under `tests/*.mjs` (not Jest/Vitest)
- Deploy: Docker standalone on LiveServer with durable `DB_PATH`, PPTX cache, `UPLOADS_DIR`

**Version authority:** Prefer `package.json` over architecture docs when versions disagree. Next 16 has breaking differences from common training data — read `node_modules/next/dist/docs/` before Next/React API changes.

**Paradigm (one line):** Monolith Web Hub + JSON APIs; offline PPTX is the primary Sabbath path; webhook intake is skill-documented JSON, not an in-process agent runtime.

## Critical Implementation Rules

### Language-Specific Rules

- TypeScript `strict` stays on; prefer `unknown` + narrow/coerce at boundaries over `any`
- Import app code via `@/...` (`tsconfig` paths); keep domain logic in `src/lib/*` as named exports
- API JSON errors use `{ error: string }` with explicit HTTP status; log server details with `console.error`, do not leak stacks to clients
- Validate/coerce external input with existing helpers (`parseServiceId`, `coerceImageUrls`, `coerceStructuredFields`, webhook/auth asserts) before DB or PPTX work
- Next.js route `context.params` is a `Promise` — always `await context.params` before reading dynamic segments
- better-sqlite3 APIs are synchronous; call them only on the server (Route Handlers / server modules), never from client components

### Framework-Specific Rules

- Follow Next.js App Router layout: routes/UI under `src/app`, domain under `src/lib`, shared UI under `src/components` (shadcn in `components/ui`)
- Default to Server Components; add `'use client'` only when hooks, browser APIs, or event handlers require it
- The request gate is `src/proxy.ts`, **not** `middleware.ts` (Next 16 deprecates that convention, and the rename is load-bearing: a Proxy file always runs on Node, which is what lets the gate open SQLite per request — never add a `runtime` export, Next throws). Its `config.matcher` regex **is** the authorization boundary: anything unmatched is served with no session check, so a new exclusion ships with its assertion in `tests/proxy-matcher.test.mjs` in the same change set. `/api/webhook` is secret-gated only; session cookie auth covers the rest; `/api/admin` and `/admin` require `admin` role (re-check via `requireAdminSession`, not cookie role alone). Gated responses carry `Cache-Control: private, no-store` + `Vary: Cookie` — the Cloudflare Tunnel could otherwise serve a cached private page without the origin running. See architecture AD-5.
- Keep `buildSlidePlan` as the single slide-order source for PPTX, slideshow, and presenter — do not diverge ordering/content per surface
- Presenter↔projector sync uses `BroadcastChannel` (`@/lib/present-channel`); do not introduce a server realtime channel unless product direction changes
- Prefer existing shadcn/Base UI controls; avoid new global state libraries

### Testing Rules

- Use Node's built-in runner only: `node:test` + `node:assert/strict` in `tests/*.test.mjs`
- Import implementation via `pathToFileURL` into `src/**/*.ts` with `--import ./tests/register-ts-resolve.mjs` / `--experimental-strip-types` — do not add Jest or Vitest
- When adding a test file, also append it to the explicit file list in the `package.json` `"test"` script
- For DB-touching tests, set a temp `DB_PATH` (and needed bootstrap env) before importing `getDb`; do not use the developer/production database file
- Reset process.env mutations in the same test (or after each case) so order-dependent flakes do not appear
- Prefer focused unit tests for parser, auth/webhook gates, SSRF/upload URL rules, slide-plan, and concurrency helpers over browser e2e unless explicitly requested

### Code Quality & Style Rules

- Follow ESLint (`eslint-config-next` vitals + TypeScript); avoid repo-wide Prettier reformats or blanket `eslint-disable`
- Naming: kebab-case files/dirs, PascalCase React components, camelCase functions/variables
- Keep route handlers thin; put parsing, PPTX, auth, images, announcements, and DB access in `src/lib/*`
- API/storage timestamps use ISO 8601 UTC; JSON success/error envelopes stay simple (`{ error }` / domain fields) — no ad-hoc envelope framework
- Document only non-obvious contracts (security gates, coerce helpers); do not add markdown docs unless asked
- Treat `.claude/skills/picoclaw-webhook/` as agent integration docs, not an executable service to import from app code

### Development Workflow Rules

- **BMad on-course:** Non-trivial coding must follow BMad artifacts (story AC / SPEC / sprint status). Do not jump from PRD/Spec to large app code. See process gate in `AGENTS.md` (synced to `.agents/AGENTS.md`, `.cursorrules`). Antigravity/Google AI Pro: assume jump-to-code bias and stop for process first.
- Prefer concise commits with type prefixes seen in history (`feat:`, `fix:`, `ui:`, `docs:`, `config:`); only commit/push/PR when the user asks
- Track implementation status in `_bmad-output/implementation-artifacts/sprint-status.yaml`; keep planning docs aligned when behavior changes, but treat `package.json` as version truth
- Production is Docker on the home-PC LiveServer behind Cloudflare Tunnel — do not assume VPS Docker deploy; keep SQLite/uploads/PPTX cache on durable host paths (`DB_PATH`, `UPLOADS_DIR`, PPTX cache), never only inside ephemeral container layers
- Never commit secrets (`.env`); document operator deploy details in `README-deployment.md` / `docs/deploy.md` only when those files are intentionally updated
- Schema changes go through app startup DDL / `getDb` path — do not introduce Prisma (or another migration framework) without an explicit product decision (architecture AD-9)
- Changing stored **values** (not shape) is a different, sanctioned thing: an explicit **versioned data migration** on that same startup path. All persisted data shares **one monotonic version counter** in `settings` — one for the whole database, never one per table — and a change that must reach already-persisted rows is declared *while it is being coded* as the transition version *n* → *n+1*, never inferred at deploy. Unreleased transitions are **compacted into one** before release and developer databases are **reset** to the compacted version rather than migrated through the steps it replaces; a version that has reached production is frozen. This is a counter and a convention, not a migration framework, and does not license one (architecture AD-18 + **AD-21**, which supersedes the older per-change boolean-marker shape `artifact_seed_hash_backfilled`). Boot-time re-seeding is **not** a value-change channel — the seeder initialises from zero only and runs once (AD-17)
- **Default corpora are committed seed data — a rule, not a permission** (owner decision 2026-08-01): `data/bible/kjv.json` is the default Bible seeder and `data/song-book/sdah.json` the default song-book seeder, both committed under `data/`. This line previously said the KJV corpus *"may not be committed under `data/`"*; that is **reversed**, and it forbade exactly what Story 21.1 must do. **The current tree has neither yet** — the hymnal still sits at `data/hymns.json` (seeded by `upsertHymns` at `src/lib/db/index.ts:262`, an every-boot upsert) and `bible_verses` has no writer outside the git-ignored `.work/` export, so a fresh clone has no scripture at all. Epics 21–22 move and commit both. Unchanged, and not to be confused with the above: congregation PII, `data/uploads/`, `data/local/`, decks and local DBs still never enter the repository

### Critical Don't-Miss Rules

- Gate `/api/webhook` with `WEBHOOK_SECRET` only (503 if unset, 401 if wrong/missing) — never session cookies
- Never bypass image URL safety (`isSafeImageUrl` / announcement asserts): block SSRF targets; allow only allowlisted http(s) and well-formed `/api/uploads/<32-hex>.(jpg|jpeg|png|gif|webp)`
- Service edits require client `updated_at` optimistic concurrency — do not drop the stale-write 409 behavior
- Do not trust cookie `role` alone after demotion; use `requireSession` / `requireAdminSession` DB re-check for privileged API routes
- Open redirects: only `safeNextPath` for post-login `next` targets
- Offline PPTX remains the reliability path for Sabbath; do not make venue success depend on live hub connectivity
- **Public repository:** never commit congregation PII, live payment details, `data/local/`, `data/uploads/`, `slides*/`, `*.pptx`/`*.potx`, local DBs, or `.env`. Prefer `data/local/default-registry.json` for private seed overrides. Enforcement: `.constitution/public-repository.md`, `AGENTS.md`, `.gitignore`, `tests/public-repo-guard.test.mjs` — do not weaken the guard.
- **Frozen legacy:** do not continue product work in `bic-pptx-workflow`; this repo is the only active root.

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge

**For Humans:**

- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review periodically for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-07-29
