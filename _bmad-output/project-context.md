---
project_name: 'worship-presenter-web'
user_name: 'kodesh87'
date: '2026-08-01'
previous_revision: '2026-07-29'
baseline_commit: '3ea5361'
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
rule_count: 65
optimized_for_llm: true
existing_patterns_found: 12
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that LLMs need to be reminded of._

---

## Technology Stack & Versions

- **Node.js 22.x (`>=22.12`)** — Dockerfile and CI both run 22; Node 20 reached EOL 2026-04-30. There is no `engines` field to enforce it, and `@types/node` is still pinned `^20` — the one Node-20 commitment that is machine-enforced
- Next.js 16.2.10 (App Router, `output: "standalone"`), React/React DOM 19.2.4, TypeScript ^5 strict, Tailwind ^4
- Data/render: better-sqlite3 ^12.11.1 (native addon; `DB_PATH`, WAL), pptxgenjs ^4.0.1, jszip ^3.10.1, **fabric ^6.6.1** (canvas editor)
- UI: **shadcn ^4.13.0 is a runtime dependency, not just a generator** — `globals.css:3` does `@import "shadcn/tailwind.css"` — over `@base-ui/react` ^1.6.0 (base-nova) + lucide-react ^1.25.0; next-themes ^0.4.6, sonner ^2.0.7
- Lint/tests: ESLint ^9 + eslint-config-next 16.2.10; Node `node:test` + `--experimental-strip-types` under `tests/*.test.mjs` (never Jest/Vitest)
- Dev-only: fast-xml-parser ^5.10.1 — the parser inside the enforced privacy filter (`scripts/extract-pptx-assets.mjs`)
- Deploy: Docker standalone on LiveServer behind Cloudflare Tunnel, with durable `DB_PATH`, PPTX cache, and `UPLOADS_DIR`

**Version authority:** Prefer `package.json` over architecture prose when they disagree. Next 16 differs from common training data — read `node_modules/next/dist/docs/` before changing any Next/React API usage.

**CI order is load-bearing:** `npm ci` → `npm run build` → `npm test`. `tests/auth-http.test.mjs` spawns the built server, so it throws unless `.next` exists — it passed only on machines that had already built.

**Paradigm (one line):** Monolith Web Hub + JSON APIs; offline PPTX is the primary Sabbath path; webhook intake is skill-documented JSON, not an in-process agent runtime. Within it: data-driven rendering from a JSON layout AST, with a decoupled canvas editor and two dumb renderers (React web, PptxGenJS).

## Critical Implementation Rules

### Language-Specific Rules

- TypeScript `strict` stays on; prefer `unknown` + narrow/coerce at boundaries over `any`
- Import app code via `@/...` (`tsconfig` paths); keep domain logic in `src/lib/*` as named exports
- API JSON errors use `{ error: string }` with explicit HTTP status; log server details with `console.error`, do not leak stacks to clients
- Validate/coerce external input with existing helpers (`parseServiceId`, `coerceImageUrls`, `coerceStructuredFields`, webhook/auth asserts) before DB or PPTX work
- Next.js route `context.params` is a `Promise` — always `await context.params` before reading dynamic segments
- better-sqlite3 APIs are synchronous; call them only on the server (Route Handlers / server modules), never from client components
- **Logic worth testing lives in a `.ts` module, never inside a `.tsx` component.** The precedent is `src/lib/theme-cycle.ts`: `nextTheme` is where an off-by-one would live, and a modulo inside a component can only be checked by a regex over its own source — which is to say, not checked. As a plain module the `node:test` harness calls it directly
- **Anything read back from browser storage is untrusted input** and coerces to a known default — `asThemeChoice` maps a hand-edited `localStorage` value to `system` rather than trusting it

### Framework-Specific Rules

- Follow Next.js App Router layout: routes/UI under `src/app`, domain under `src/lib`, shared UI under `src/components` (shadcn in `components/ui`)
- Default to Server Components; add `'use client'` only when hooks, browser APIs, or event handlers require it
- The request gate is `src/proxy.ts`, **not** `middleware.ts` (Next 16 deprecates that convention, and the rename is load-bearing: a Proxy file always runs on Node, which is what lets the gate open SQLite per request — never add a `runtime` export, Next throws). Its `config.matcher` regex **is** the authorization boundary: anything unmatched is served with no session check, so a new exclusion ships with its assertion in `tests/proxy-matcher.test.mjs` in the same change set. `/api/webhook` is secret-gated only; session cookie auth covers the rest; `/api/admin` and `/admin` require `admin` role (re-check via `requireAdminSession`, not cookie role alone). Gated responses carry `Cache-Control: private, no-store` + `Vary: Cookie` — the Cloudflare Tunnel could otherwise serve a cached private page without the origin running. See architecture AD-5.
- Keep `buildSlidePlan` as the single slide-order source for PPTX, slideshow, and presenter — do not diverge ordering/content per surface
- Presenter↔projector sync uses `BroadcastChannel` (`@/lib/present-channel`); do not introduce a server realtime channel unless product direction changes
- Prefer existing shadcn/Base UI controls; avoid new global state libraries
- **Application state has exactly three homes, and *who must agree on it* picks one (AD-24).** **Persisted-shared** → SQLite on `DB_PATH`, an app-wide value in `settings`. **Persisted-local** → that browser's `localStorage`, view preference only, **not backed up**. **Ephemeral-shared** → AD-10's `BroadcastChannel`. A value the deck, another operator, or another surface depends on is never persisted-local, and no domain data or unsaved editor draft goes there at all — `localStorage` sits outside AD-15's validation, AD-6's precondition and AD-21's counter. The AD-5 session cookie is credential transport, **not a fourth home**: it is the one browser-persisted place the *server* can read, so putting chrome state there would hand a room-facing render access to it
- **The client boundary mounts at the narrowest layout covering its consumers, and never on `layout.tsx` itself.** `src/app/layout.tsx` stays a Server Component and reaches the client through one child, `src/components/ThemeProvider.tsx`, only because theming's consumers are every route. **Passing `children` through a client provider does not make them client components** — they arrive already server-rendered. To add a provider, enumerate its consumers and mount at the narrowest layout containing all of them; "simpler at the root" is not that enumeration. `'use client'` on `layout.tsx` converts the whole app — never do it. `<html suppressHydrationWarning>` is part of this boundary, not incidental markup
- **Room-facing surfaces are closed to operator chrome (AD-24).** Projector, web slideshow and PPTX never read it, under any setting. The projected tree paints **literal** colours (`#FFFFFF`, `#000000`, `transparent`), never a theme token. A full-screen room-facing *client* surface neutralises the app shell it inherits (`html`/`body` background, `overflow`, `scrollbar-gutter`) through **one shared implementation, never its own copy** — `src/lib/projected-shell.ts` (`claimProjectedShell`, **reference-counted**: only the first claim snapshots, only the last release restores) via `src/lib/use-projected-shell.ts`. Known open gap (Story 17.7): the two Server-Component route shells still leak the server's *first* paint — no `useEffect`/`useLayoutEffect` reaches it
- **Transition style is one value, described once (AD-23).** `slide_transition` in `settings`; every style is defined **exactly once** in `src/lib/transitions.ts`, carrying both its PowerPoint element and its browser animation parameters. `pptx.ts` and the browser surfaces all import that table and **no surface keeps a default of its own**. The value reaches each surface from `settings` directly, never through the plan
- **Transition rules that survive the style choice (AD-23 companions).** The per-slide opt-out `SlidePlanItem.fade === false` (flyer images) means *no* transition on that slide whatever style is configured. An invalid stored value falls back to fade, logged rather than thrown — **transition handling never breaks deck generation**. The PPTX transition XML stays inside the existing single JSZip post-processing pass with its own `try/catch`, so a failure degrades to a deck with no transitions, never to no deck. Only styles expressible as a plain `<p:transition>` child qualify; anything needing the `p14` namespace (morph, ripple, glitter, vortex) would silently degrade to nothing when the deck is opened elsewhere
- **`request-sync` must answer with the *full* surface state, blank included.** A projector that missed a message otherwise stays stuck. Blanking is projector-only: the deck position must not move, the scripture overlay must survive blank→unblank, the blank state must survive a projector reload, and none of it may depend on the Presenter window staying open
- **Nothing paints outside its own element box, in either renderer.** Text that needs more room than its declared box **shrinks to fit** rather than overflowing across its neighbours
- **Hymn bucketing is section-aware.** `bucketHymnsBySection` (`src/lib/hymn-sections.ts`) walks the BIBLE TALK / DIVINE SERVICE markers; the positional `slice(0,2)` / `slice(2)` split survives **only** as the fallback when markers are absent. Do not reintroduce the positional split as the primary path — atypical hymn counts mis-slot under it
- **Module boundaries inside `src/lib` are load-bearing.** `registry/*` = storage + validation · `artifacts/*` = hydration + the runtime contract (AD-12 Fat Payload) · `services/*` = service mutation paths carrying AD-6's precondition. Stale writes are signalled **two different ways** — `registry/store.ts` throws `RegistryStaleError`, the services layer returns a result — so a new write path adopts the shape of the layer it lives in. **A third enforcement site must not appear**

### Testing Rules

- Use Node's built-in runner only: `node:test` + `node:assert/strict` in `tests/*.test.mjs`
- Import implementation via `pathToFileURL` into `src/**/*.ts` with `--import ./tests/register-ts-resolve.mjs` / `--experimental-strip-types` — do not add Jest or Vitest, and no second runner without a decision recorded in the spine
- For DB-touching tests, set a temp `DB_PATH` (and needed bootstrap env) before importing `getDb`; do not use the developer/production database file
- Reset `process.env` mutations in the same test (or after each case) so order-dependent flakes do not appear
- Prefer focused unit tests for parser, auth/webhook gates, SSRF/upload URL rules, slide-plan, and concurrency helpers over browser e2e unless explicitly requested
- **A new suite is registered in the explicit `package.json` `scripts.test` file list in the same change set.** An unregistered test file **never runs** — not locally, not in CI — and **nothing detects the omission**. This is the single highest-cost omission in the suite
- **`tests/theme-chrome.test.mjs` carries four hardcoded lists that must all be maintained:** `PROJECTED` (token, edge and closure guards), `ROUTE_SHELLS` (scroll guard), `FULL_SCREEN` (shell reset), and an inline pair for the `className` props guard. A new room-facing surface joins **every list that applies, in the same change set**. Unlike `tests/proxy-matcher.test.mjs` — which reads the real `config.matcher`, so an unlisted route is *detectable* — these four lists have no structural anchor, and an unregistered surface is simply invisible to them
- **When you write or change a guard, prove it reacts:** inject the defect it claims to catch and confirm the suite goes red. A guard that passes on broken code is worse than no guard, and this repo has repeatedly shipped guards that read the wrong branch or exempted the very directory they were written for
- **Never hand-edit `package-lock.json`.** `tests/lockfile-integrity.test.mjs` exists because a 2026-07-29 text-level name redaction rewrote a substring inside one base64 `sha512` integrity value and broke `npm ci` **repo-wide** for two days. A search-and-replace across tracked files must exclude the lockfile

### Code Quality & Style Rules

- Follow ESLint (`eslint-config-next` vitals + TypeScript); avoid repo-wide Prettier reformats or blanket `eslint-disable`
- Naming: kebab-case files/dirs, PascalCase React components, camelCase functions/variables
- Keep route handlers thin; put parsing, PPTX, auth, images, announcements, and DB access in `src/lib/*`
- API/storage timestamps use ISO 8601 UTC; JSON success/error envelopes stay simple (`{ error }` / domain fields) — no ad-hoc envelope framework
- Document only non-obvious contracts (security gates, coerce helpers); do not add markdown docs unless asked
- Treat `.claude/skills/picoclaw-webhook/` as agent integration docs, not an executable service to import from app code
- **`npm run lint` is not expected to be zero.** The clean-checkout baseline was **31 problems on 2026-08-01**, all pre-existing. Compare your branch against HEAD rather than against zero, and do not opportunistically fix unrelated lint inside a scoped change. **A working copy with agent worktrees inflates this wildly** — `.claude/worktrees/` is untracked and locally excluded, and printed 14,528 of one run's 14,559 problems. A number in the thousands means you linted a worktree, not the repo
- **Before adding a raw colour utility, check whether a design token already carries that value.** The `red-600`/`red-400` pair shipped hand-rolled and turned out byte-identical to `--destructive` in both `:root` and `.dark` — a one-class `text-destructive` fix. A hand-rolled pair silently drifts from the theme the moment the token moves
- **A file:line citation you write in a doc is a claim, and it rots.** Verify it still resolves before committing. This repo has paid for it in both directions — a citation pointing at a blank line, and another at an unrelated note that made a *closed* item read as open. If you cite, check

### Development Workflow Rules

- **BMad on-course:** Non-trivial coding must follow BMad artifacts (story AC / SPEC / sprint status). Do not jump from PRD/Spec to large app code. See process gate in `AGENTS.md` (synced to `.agents/AGENTS.md`, `.cursorrules`). Antigravity/Google AI Pro: assume jump-to-code bias and stop for process first.
- Prefer concise commits with type prefixes seen in history (`feat:`, `fix:`, `ui:`, `docs:`, `config:`); only commit/push/PR when the user asks
- Track implementation status in `_bmad-output/implementation-artifacts/sprint-status.yaml`; keep planning docs aligned when behavior changes, but treat `package.json` as version truth
- Production is Docker on the home-PC LiveServer behind Cloudflare Tunnel — do not assume VPS Docker deploy; keep SQLite/uploads/PPTX cache on durable host paths (`DB_PATH`, `UPLOADS_DIR`, PPTX cache), never only inside ephemeral container layers. **SQLite here is single-writer by design** (WAL + `busy_timeout=5000`, `DB_PATH` parent created on `getDb()`): never run two instances against one database file, and never put it on a network share
- Never commit secrets (`.env`); document operator deploy details in **`docs/deploy.md` / `docs/deployment-guide.md`** only when those files are intentionally updated. ⚠️ **`README-deployment.md` does not exist and never has** — it is absent from the entire git history, yet 11 tracked files still cite it (including `prd.md` and this file's own previous revision). Do not create it to satisfy a citation; repair the citation
- Schema changes go through app startup DDL / `getDb` path — do not introduce Prisma (or another migration framework) without an explicit product decision (architecture AD-9)
- Changing stored **values** (not shape) is a different, sanctioned thing: an explicit **versioned data migration** on that same startup path. All persisted data shares **one monotonic version counter** in `settings` — one for the whole database, never one per table — and a change that must reach already-persisted rows is declared *while it is being coded* as the transition version *n* → *n+1*, never inferred at deploy. Unreleased transitions are **compacted into one** before release and developer databases are **reset** to the compacted version rather than migrated through the steps it replaces; a version that has reached production is frozen. This is a counter and a convention, not a migration framework, and does not license one (architecture AD-18 + **AD-21**, which supersedes the older per-change boolean-marker shape `artifact_seed_hash_backfilled`). Boot-time re-seeding is **not** a value-change channel — the seeder initialises from zero only and runs once (AD-17)
- **Default corpora are committed seed data — a rule, not a permission** (owner decision 2026-08-01): `data/bible/kjv.json` is the default Bible seeder and `data/song-book/sdah.json` the default song-book seeder, both committed under `data/`. The rule this replaces said the KJV corpus *"may not be committed under `data/`"* — **reversed**, because it forbade exactly what Story 21.1 must do. **Both now ship** (Stories 21.1 / 22.1, 2026-08-01): `data/bible/kjv.json` seeds `bible_books` / `bible_verses` **only when the translation is empty**, and `data/song-book/sdah.json` is upserted into `hymns` on `(book_code, number)` every boot — the channel that was already there, not a new one. `npm run corpus:verify` asserts both (66 books / 1,189 chapters / 31,102 verses; 695 hymns). `import:kjv` and `import:hymnal` are retired: their `.work/` source exports are gone, so the committed files are the source of record and there is nothing to regenerate them from. Unchanged, and not to be confused with the above: congregation PII, `data/uploads/`, `data/local/`, decks and local DBs still never enter the repository. **Paths amended 2026-08-01 (FR-24, same day, second Correct Course):** corpora move to `data/<locale>/bible-translation/<code>.json` and `data/<locale>/song-book/<code>.json` — e.g. `data/en/song-book/sdah.json`. `src/lib/corpus.ts` is the single owner of both paths (`bibleCorpusPath`, `songBookCorpusPath`); change them there and nowhere else. **`bible-translation` is the standard term, not `bible`.** Verified: no locale code collides with `data/local/`, `data/uploads/` or `data/*.db`, and `.gitignore` does not swallow `data/en/`. The move itself is Stories 21.2 / 22.3 — until they land, the shipped paths are still `data/bible/kjv.json` and `data/song-book/sdah.json`
- **UI string catalogue (FR-25, Story 24.1):** lives under `src/lib/i18n/` as versioned TypeScript tables — never in `data/`, never in SQLite. Only `ui_locale` is persisted-shared; resolve via `resolveString(key, locale)` from a `.ts` module. Missing keys render `[missing:i18n:<key>]` and log — no silent English fallback. UI locale vocabulary (`en`, `id`) is independent of data-locale / corpus locale. **`data_locale`** is the language of a *corpus*; **`ui_locale`** is the language of the *operator interface*. A `projection_locale` was proposed and **rejected**: whatever an Admin composes on the Artifact Registry canvas is what the congregation sees, so **no setting may reach a room-facing surface** — the same closure Epic 17 enforces, read in the other direction. Two rules follow and both are easy to break by accident. **(1) Filter in the UI, never in the query.** `default_data_locale` chooses what a picker shows *first*; **no `WHERE locale = <default>` may reach the database**, and every listing endpoint returns every installed corpus with its locale. The case that must keep working is an Indonesian service singing one English hymn. **(2) Reference display follows the chosen translation, not a setting** — book names ship inside each translation's corpus, input is generous (`Kejadian` or `Genesis` both resolve, across all installed translations, to one canonical book id) and output is exact (the chosen translation's own name). Settings keys are exactly four: `ui_locale`, `default_data_locale`, `default_song_book`, `default_bible_translation`. **`song-book` is the container term but `hymn` stays the entry term** — the `hymns` table, `/api/hymns` and the `resolvedHymns` / `failedHymnNumbers` webhook fields keep their names, the last being an external contract an outside Telegram bot consumes
- **Four artifact families drift unless named, so each is updated in the same change set as the code:** add/rename/remove a **route or surface** → the IA table in `EXPERIENCE.md`; override a **design token** or add a UI component with a visual delta → `DESIGN.md`; change a **structural invariant** (auth gate, storage target, slide-order source, sync channel, schema path) → amend the spine via a `bmad-architecture` Update run — **never renumber an existing `AD-n`, add the next one**; delivery unit / AC → the story file
- **There is exactly one architecture spine**, and the `INIT AD-n` / `epic-16 AD-n` citation forms are retired. The Epic 16 child spine was folded in on 2026-07-30 under a one-time owner waiver — a recorded exception, **not a precedent**. **Any `AD-n` citation in a document dated before 2026-07-30 must be read through the spine's AD map table first**: bare `AD-2..AD-5` in an epic-16 context now resolve to four entirely different decisions
- **The order on the `getDb` startup path is fixed and asserted by a test:** startup DDL (AD-9) → data migrations (AD-18/AD-21) → first-boot bootstrap (AD-17). A migration never observes rows the bootstrap wrote in the same boot. Reversing it is silently compliant and strictly worse — it would rewrite freshly seeded rows and drop songs from the deck
- **The commit/push audit is mandatory, not advisory.** Before **every** commit and **every** push: refuse to stage `.env*`, `data/local/`, `data/uploads/`, `data.db*`, `slides*/`, `*.pptx`/`*.potx`, or any real congregation/payment/production-host data, then run `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/public-repo-guard.test.mjs`. Fix content on failure — **never weaken the guard**
### Critical Don't-Miss Rules

- Gate `/api/webhook` with `WEBHOOK_SECRET` only (503 if unset, 401 if wrong/missing) — never session cookies
- Never bypass image URL safety (`isSafeImageUrl` / announcement asserts): block SSRF targets; allow only allowlisted http(s) and well-formed `/api/uploads/<32-hex>.(jpg|jpeg|png|gif|webp)`
- **A remote image link is a source to fetch from, never a value to store.** The stored value is always a local upload reference (`/api/uploads/<32-hex>.<ext>`), written with a fresh random filename and an extension matching the actual content type. **Do not follow redirects on that fetch** — a redirect is exactly how an allowed URL becomes a blocked one *after* the check has already passed. There is **one** hardened fetch path and both callers import it: a duplicated SSRF gate is how the two drift and one ends up weaker. The fetch route stays behind the proxy gate and is never added to the exempt matcher
- **Never source slide backgrounds from `slides/`, `slides-new/` or `slides-all/`.** All three hold finished-slide screenshots with text baked into the pixels, and a hand-written slide→file map over them once put the wrong picture behind **16 of 17** templates. Backgrounds come from the source deck's `ppt/media/` **byte-for-byte** — no re-encode, resize or sharpen, because the deck's own pictures are the fidelity ceiling — and the template→slide→media table is script-generated and committed as data so the drift cannot silently return. Asset filenames name the **template that uses them**, not the picture's subject, so a mismatch is visible in review
- Service edits require client `updated_at` optimistic concurrency — do not drop the stale-write 409 behavior
- Do not trust cookie `role` alone after demotion; use `requireSession` / `requireAdminSession` DB re-check for privileged API routes
- Open redirects: only `safeNextPath` for post-login `next` targets
- Offline PPTX remains the reliability path for Sabbath; do not make venue success depend on live hub connectivity
- **Public repository:** never commit congregation PII, live payment details, `data/local/`, `data/uploads/`, `slides*/`, `*.pptx`/`*.potx`, local DBs, or `.env`. Prefer `data/local/default-registry.json` for private seed overrides. Enforcement: `.constitution/public-repository.md`, `AGENTS.md`, `.gitignore`, `tests/public-repo-guard.test.mjs` — do not weaken the guard.
- **Frozen legacy:** do not continue product work in `bic-pptx-workflow`; this repo is the only active root.
- **Deck text for a payload-bearing slide is that week's congregation data, not template copy.** Family/youth, sermon speaker, special song, verse reading and song lyrics are payload-bearing: their extracted text runs must never reach a tracked file. `data/asset-map.json` once committed a family's surname, three given names and their prayer request this way, and the sermon speaker's full name twice more. **Filter at the generator, not afterwards** — `evidenceFor` in `scripts/extract-pptx-assets.mjs`, asserted by `tests/asset-map-evidence.test.mjs`, which fails on the *shape* of the leak rather than on any identity. A fingerprint list only knows names someone already registered; it can never know the next family
- **Known open gap — do not widen it (Story 17.7).** The room-facing closure reaches the two full-screen *Client* surfaces but not the two Server-Component route shells, so the server's first paint on a projected load still carries the operator's theme. Related: `notFound()` is reachable at six sites with **no `not-found.tsx` anywhere in `src/`**, so a 404 on a projected URL renders Next's default page inside the themed shell — in front of the congregation. Adding a new room-facing route or a new `notFound()` call there ships another instance of this

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

Last Updated: 2026-08-01
