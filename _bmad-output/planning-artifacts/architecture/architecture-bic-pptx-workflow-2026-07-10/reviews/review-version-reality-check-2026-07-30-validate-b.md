---
review: version / reality-check
lens: 'Was every committed decision web-researched or reality-checked, or asserted from training data?'
target: '_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md'
date: '2026-07-30'
pass: validate-b
verdict: 'PASS WITH FINDINGS — no named technology is hallucinated and no version is fictional, but the Node.js floor is end-of-life, two mechanism claims are stated as unqualified fact and are not, and one load-bearing file location is wrong'
counts: { critical: 0, high: 5, medium: 8, low: 4 }
---

# Version / reality-check review — ARCHITECTURE-SPINE.md

## Scope and method

I re-derived everything. I did not read this `reviews/` directory or either `.memlog.md`.

What I checked against, in order of authority:

1. `package.json` and `package-lock.json` (lockfileVersion 3) in the repo root — every Stack row, both the declared range and the resolved version.
2. Installed package metadata under `node_modules/**/package.json` — `engines`, `exports`, real package identity.
3. The Next.js docs **shipped in this repo**, `node_modules/next/dist/docs/`, as `AGENTS.md` instructs — these are the docs for 16.2.10 specifically, not whatever nextjs.org is serving.
4. The **actual production build output** — `.next/standalone/.next/server/functions-config-manifest.json` — which is the only artifact that can settle "does the gate really run on Node, and does the matcher really compile the way AD-5 assumes."
5. The npm registry (`registry.npmjs.org` `dist-tags` and `/latest` endpoints) for what is current **today, 2026-07-30**.
6. The web, for Node.js release/EOL status and for whether "shadcn base-nova" is a real thing.
7. The repo's own source, for every mechanism the spine names as shipped.

---

## 1. Stack table — full row-by-row verification

The spine asserts, immediately under the table:

> `package.json` is the version authority; this table is a seed, re-verified row by row against it on 2026-07-30 with no drift found.

**That claim is narrowly true and broadly misleading.** For the ten *package* rows there is genuinely zero drift between the table and `package.json` — I confirmed each one. But the sentence is doing more work than it can carry: one row (Node.js) is not in `package.json` at all, one row's parenthetical (`shadcn base-nova`) is authored in `components.json`, and "no drift against package.json" says nothing about whether the pinned versions are current — which is the question this lens exists to ask. Three rows are a full major version behind current stable, and one is two majors behind.

| Spine row | Spine value | `package.json` | Lockfile resolved | Web-current (2026-07-30) | Verdict |
| --- | --- | --- | --- | --- | --- |
| Node.js | `v20+` | **absent — no `engines` field at all** | n/a | **Node 20 reached EOL 2026-04-30**; supported lines are 22 / 24 / 26. `node_modules/next/package.json` `engines: {node: ">=20.9.0"}` | **FAIL** — see H-1 |
| Next.js | `16.2.10 (App Router, output: "standalone")` | `"next": "16.2.10"` (exact, line 27) | `16.2.10`, `registry.npmjs.org/next/-/next-16.2.10.tgz` | latest `16.2.12` | PASS, 2 patches behind (M-1) |
| React / React DOM | `19.2.4` | `"react": "19.2.4"`, `"react-dom": "19.2.4"` (exact, lines 30–31) | `19.2.4` / `19.2.4` | latest `19.2.8`; `19.2.4` verified published | PASS, 4 patches behind (M-1) |
| TypeScript | `^5 (strict)` | `"typescript": "^5"` (line 47) | `5.9.3` | latest **`7.0.2`**; `rc 7.0.1-rc`, `beta 6.0.0-beta` | PASS-with-drift, **two majors** (M-2) |
| Tailwind CSS | `^4` | `"tailwindcss": "^4"` (46), `"@tailwindcss/postcss": "^4"` (38) | `4.3.3` / `4.3.3` | latest `4.3.3` | **PASS — current** |
| better-sqlite3 (SQLite, WAL) | `^12.11.1` | `"better-sqlite3": "^12.11.1"` (21) | `12.11.1`, `engines: 20.x‖22.x‖23.x‖24.x‖25.x‖26.x` | latest **`13.0.2`**, `engines: node >=22` | PASS-with-drift, one major (M-3) |
| pptxgenjs | `^4.0.1` | `"pptxgenjs": "^4.0.1"` (29) | `4.0.1` | latest `4.0.1` | **PASS — current** |
| jszip | `^3.10.1` | `"jszip": "^3.10.1"` (25) | `3.10.1` | latest `3.10.1` | **PASS — current** |
| fabric | `^6.6.1 (canvas editor)` | `"fabric": "^6.6.1"` (24) | `6.6.1`, `engines: node >=16.20.0` | latest **`7.4.0`**; `beta 7.0.0-rc1`; no `6.x` dist-tag | PASS-with-drift, one major (M-4) |
| @base-ui/react (shadcn base-nova) | `^1.6.0` | `"@base-ui/react": "^1.6.0"` (20) | `1.6.0`, MUI's Base UI (`github.com/mui/base-ui`, `base-ui.com`) | `latest` dist-tag = `1.6.0` | **PASS — current**; naming caveat L-3 |
| ESLint / eslint-config-next | `^9 / 16.2.10` | `"eslint": "^9"` (43), `"eslint-config-next": "16.2.10"` (44) | `9.39.5` / `16.2.10` | eslint latest `10.8.0` — **`9.39.5` is the `maintenance` dist-tag**; eslint-config-next latest `16.2.12` | PASS-with-drift (M-5) |

**No row in the table is a dependency that no longer exists.** All ten package rows resolve, all ten tarballs come from `registry.npmjs.org`, none is a hallucinated name.

### Rows missing from the table

| Missing dependency | Declared | Resolved | Load-bearing? |
| --- | --- | --- | --- |
| `fast-xml-parser` | `^5.10.1` (dev) | `5.10.1` | **Yes** — it is the XML parser inside `scripts/extract-pptx-assets.mjs`, the generator `AGENTS.md` names as the *enforced privacy filter* (`evidenceFor`, asserted by `tests/asset-map-evidence.test.mjs`). See M-6. |
| `shadcn` (CLI) | `^4.13.0` | `4.13.0` | Partly — it is the tool that materializes the `base-nova` row the table already claims |
| `lucide-react` | `^1.25.0` | `1.25.0` | Named as `iconLibrary` in `components.json`; arguably `DESIGN.md`'s row, not the spine's |
| `next-themes` | `^0.4.6` | `0.4.6` | Light/dark; `DESIGN.md`'s row |
| `sonner` | `^2.0.7` | `2.0.7` | Toasts; `src/components/ui/sonner.tsx` |
| `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css` | — | — | shadcn substrate; not spine-altitude |
| `@types/node` | `^20` | `20.19.43` | **Yes** — types an EOL runtime while Docker and CI both run Node 22. See M-7. |
| `@types/better-sqlite3` | `^7.6.13` | — | No |

---

## 2. Web verification of the named releases

| Named thing | Exists? | Current? | Evidence |
| --- | --- | --- | --- |
| Next.js `16.2.10` | Yes | No — `16.2.12` is latest | `github.com/vercel/next.js/releases/tag/v16.2.10` (a publish-only maintenance release for `@next/swc-wasm-web`); `registry.npmjs.org/next/latest` → `16.2.12` |
| React `19.2.4` | Yes | No — `19.2.8` is latest | `registry.npmjs.org/react/19.2.4` returns `version: "19.2.4"` with a real tarball; `registry.npmjs.org/-/package/react/dist-tags` → `latest: 19.2.8` |
| better-sqlite3 `^12.11.1` | Yes | No — `13.0.2` is latest | `registry.npmjs.org/-/package/better-sqlite3/dist-tags` → `latest: 13.0.2`; `registry.npmjs.org/better-sqlite3/latest` → `engines: node >=22` |
| pptxgenjs `^4.0.1` | Yes | **Yes** | `registry.npmjs.org/pptxgenjs/latest` → `4.0.1`, "Create JavaScript PowerPoint Presentations" |
| fabric `^6.6.1` | Yes | No — `7.4.0` is latest | `registry.npmjs.org/-/package/fabric/dist-tags` → `{beta: 7.0.0-rc1, latest: 7.4.0}`; `fabricjs.com/docs/upgrading/upgrading-to-fabric-70/` exists as a migration guide |
| `@base-ui/react` `^1.6.0` | **Yes — real package, not hallucinated** | **Yes** | `registry.npmjs.org/@base-ui/react` `latest` dist-tag = `1.6.0`; `node_modules/@base-ui/react/package.json` → MUI's Base UI, repo `github.com/mui/base-ui` (`packages/react`), homepage `base-ui.com` |
| "shadcn base-nova" | **Yes — real, not a hallucinated product name** | Yes | `components.json` line 3: `"style": "base-nova"`, `$schema: https://ui.shadcn.com/schema.json`. Web-confirmed: shadcn's `style` field takes `{library}-{style}`, so `base-nova` = Base UI primitives + Nova style. Sources: `ui.shadcn.com/docs/theming`, `shadcnblocks.com/blog/shadcn-component-styles-vega-nova-maia-lyra-mira`, `shadcnblocks.com/blog/introducing-base-ui-and-component-styles` |
| eslint-config-next `16.2.10` | Yes | No — `16.2.12` is latest | `registry.npmjs.org/eslint-config-next/latest` → `16.2.12`, peers `eslint >=9.0.0`, `typescript >=3.3.1` (optional) |
| Node `v20+` | Exists | **No — Node 20 is end-of-life** | Node 20 reached EOL **2026-04-30**, three months before today. Sources: `nodejs.org/en/about/eol`, `herodevs.com/blog-posts/node-js-end-of-life-dates-you-should-be-aware-of` (July 2026), `endoflife.ai/article-nodejs-eol` |

---

## 3. Named-technology fit — mechanism by mechanism

### 3a. `src/proxy.ts` is real, and AD-5's runtime claim is build-verified — CONFIRMED

This is the claim the mandate singled out, and it holds. Not from memory: from the docs shipped with 16.2.10 and from the compiled output.

- **Proxy replacing `middleware.ts` is real in Next 16.** `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` opens with "the `middleware` file convention is deprecated and has been renamed to `proxy`" and its Version history table carries the row `v16.0.0 | Middleware is deprecated and renamed to Proxy. Proxy defaults to the Node.js runtime`. `01-app/01-getting-started/16-proxy.md:15` says the same. `01-app/02-guides/upgrading/version-16.md:625–638` gives the rename procedure and the codemod `middleware-to-proxy`.
- **File location is right.** proxy.md:23 — "Create a `proxy.ts` (or `.js`) file in the project root, or inside `src` if applicable". The repo has `src/proxy.ts` and no `src/middleware.ts`.
- **Exporting `runtime` really does throw.** proxy.md:221–223, verbatim: "Proxy defaults to using the Node.js runtime. The `runtime` config option is not available in Proxy files. Setting the `runtime` config option in Proxy will throw an error." Corroborated by `version-16.md:629`: "The `proxy` runtime is `nodejs`, and it cannot be configured." AD-5's parenthetical "(Next throws)" is accurate.
- **`config.matcher` semantics hold.** Full regex including negative lookahead: proxy.md:88–99 and 602–619. Static-constant requirement: proxy.md:136 — "The `matcher` values need to be constants so they can be statically analyzed at build-time." Both are exactly what `src/proxy.ts:100–124` relies on.
- **The gate genuinely runs on Node in the standalone build.** `.next/standalone/.next/server/functions-config-manifest.json` contains `"/_middleware": { "runtime": "nodejs", "matchers": [...] }` and the compiled regexp is the repo's matcher, verbatim in `originalSource`. This is the strongest available evidence that AD-5's premise — a per-request synchronous SQLite check inside the request gate — actually ships under `output: "standalone"`, and it is evidence the spine does not cite.
- **`output: "standalone"` is still current.** `01-app/03-api-reference/05-config/01-next-config-js/output.md:30`; `next.config.ts` sets it; proxy.md's Platform support table (728–733) lists Node.js server **Yes** and Docker container **Yes**.
- **Next injects `_next/data` coverage into the matcher regardless of exclusions** (proxy.md:661–672), and the compiled regexp proves it: it begins `^(?:\/(_next\/data\/[^/]{1,}))?` and ends with `(\.json|\.rsc|\.segments\/.+\.segment\.rsc)?`. AD-5's "the regex **is** the authorization boundary" is therefore slightly *conservative* in this one direction — Next widens coverage, it does not narrow it. Fine as written; worth knowing.

### 3b. AD-5's stated reason for banning `middleware.ts` is not true as written — **HIGH (H-2)**

AD-5 says:

> do not reintroduce `middleware.ts`: it compiles for the Edge runtime and loses the per-request SQLite re-check.

Unqualified, that is false. `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md:775–776` records `v15.5.0 | Middleware can now use the Node.js runtime (stable)`. `version-16.md:629` says "If you want to continue using the `edge` runtime, keep using `middleware`" — i.e. in Next 16 `middleware` still supports *both*, with Edge as its default. So a `middleware.ts` exporting `runtime = 'nodejs'` would keep the SQLite re-check, and a reader who knows that can correctly refute the spine's stated reason — and then discard the rule that reason was defending.

The repo's own `src/proxy.ts:5–11` states it *correctly*: "a `middleware.ts` entry is still compiled for the Edge runtime **unless it exports `runtime = 'nodejs'`**". The spine dropped the qualifier the code kept. The durable reason is simpler and unassailable: `middleware` is deprecated in Next 16, and Proxy's Node runtime is not configurable, so it cannot regress.

**Fix.** Replace the clause with: *"and do not reintroduce `middleware.ts`: Next 16 deprecates that convention (`proxy.md` Version history, `v16.0.0`), and it defaults to the Edge runtime — Node is opt-in there and can be lost by an edit, while Proxy's Node runtime is not configurable and therefore cannot regress."*

### 3c. Next's own docs contradict AD-5's design premise, and the spine does not acknowledge it — **HIGH (H-3)**

Three statements in the shipped docs bear directly on AD-5 and on the Deferred item "*nine routes rely on the AD-5 proxy gate as their only enforcement layer*":

1. `proxy.md:217–219`: "Server Functions are not separate routes in this chain. They are handled as POST requests to the route where they are used, so a Proxy matcher that excludes a path will also skip Proxy coverage on that path. … **Always verify authentication and authorization inside each Server Function rather than relying on Proxy alone.**"
2. `01-app/01-getting-started/16-proxy.md:29`: "Proxy is _not_ intended for slow data fetching. While Proxy can be helpful for optimistic checks … **it should not be used as a full session management or authorization solution.**"
3. `proxy.md:19`: "Proxy is meant to be invoked separately of your render code and in optimized cases deployed to your CDN … **you should not attempt relying on shared modules or globals.**" AD-5's gate imports `@/lib/auth/session`, `@/lib/auth/require` and holds a shared SQLite handle.

None of this makes AD-5 unworkable on a self-hosted Node server behind a tunnel — the build manifest proves it runs, and the design is a defensible fit for one congregation on one box. But the spine presents "single request gate" as settled good practice with no upstream tension, and treats the nine unguarded routes as a scheduling matter ("revisit when a route becomes reachable outside the matcher"). Upstream calls it a hazard, unconditionally. A reader trusting the spine would not know a decision was made *against* framework guidance.

**Fix.** Add one sentence to AD-5 and reframe the Deferred item: *"Next documents Proxy as an optimistic check and advises verifying authorization inside each route and Server Function rather than relying on Proxy alone (`proxy.md` Execution order; `getting-started/proxy` §Proxy). This spine accepts that deviation deliberately — single-box self-hosted deployment, Node runtime, no CDN in front of the origin — and it is why the defence-in-depth item below is open rather than closed."* Also note explicitly that Server Function POSTs inherit their route's matcher outcome.

### 3d. AD-13's `canvas.toJSON()` is not the mechanism that ships — **HIGH (H-4)**

AD-13: "React only reads state via `canvas.toJSON()` when the save button is clicked." The second Mermaid diagram repeats it as an edge label: `"canvas.toJSON() on save (AD-13)"`.

- The API is real. I verified against the installed build, not from memory: `require('fabric/node')` → `version 6.6.1`, `StaticCanvas.prototype.toJSON` is a `function` with arity `0` (v6 moved `propertiesToInclude` to `toObject`).
- **But `toJSON` appears nowhere in `src/`.** The editor serializes with `canvas.getObjects()` — `src/components/admin/ArtifactEditor.tsx:271`, inside `serializeCanvas(canvas, layout, added)` at :257, plus a second `.getObjects()` at :532.

Read as a description of the system, the sentence is false. Read as a rule, `serializeCanvas` violates it. Either way it is an unverified library-capability assertion — and a version-sensitive one, since `toJSON`'s signature changed in Fabric v6 and `toObject`/`toJSON` diverge again in v7. The *invariant* the decision exists to protect (Fabric owns canvas state; React reads only on save) is intact and the code honours it — which is why this is HIGH and not CRITICAL.

**Fix.** State the boundary, not the method: *"React reads canvas state only on save, by walking `canvas.getObjects()` — see `serializeCanvas` in `src/components/admin/ArtifactEditor.tsx`. No two-way binding, no per-drag React state."* Update the Mermaid edge label to match.

### 3e. `BroadcastChannel` — CONFIRMED

`src/lib/present-channel.ts:84–88`: one name helper `presentChannelName()` → `bic-present-${serviceId}`, one opener `openPresentChannel()` guarded by `typeof BroadcastChannel === 'undefined'` (correct for SSR). The only other reference is `src/app/services/[id]/present/PresenterOperator.tsx:253` consuming it. AD-10's "no surface opens its own channel name or message shape" is true today. `BroadcastChannel` is a stable web platform API; no version risk.

### 3f. better-sqlite3 synchronous / server-only, WAL — CONFIRMED

`src/lib/db/index.ts:88` — `db.pragma('journal_mode = WAL')`. better-sqlite3 is synchronous by design; the `(SQLite, WAL)` annotation in the table matches the code. Note the coupling in M-3: the next major requires Node ≥22, which the spine's own "v20+" floor would forbid.

### 3g. AD-6's shipped shape — CONFIRMED

`src/lib/registry/store.ts:20` declares `class RegistryStaleError`; `:207` takes `expectedUpdatedAt`; `:223–224` compares and throws; `:272` throws again on the ordered path; `:286`/`:291` thread it through reset. AD-6's "the shipped shape is `expectedUpdatedAt` / `RegistryStaleError` in `src/lib/registry/store.ts`" is accurate.

### 3h. Docker + Cloudflare Tunnel — CONFIRMED, with a hostname mismatch

`Dockerfile` is a real multi-stage standalone build (`FROM node:22-bookworm-slim`, `CMD ["node","server.js"]`), `docker-compose.yml` bind-mounts `DB_PATH`, `PPTX_CACHE_DIR` and `/app/data/uploads`. Cloudflare Tunnel is documented in `docs/cloudflare-tunnel.md` and `docs/deployment-guide.md` (cloudflared as a Windows service onto `127.0.0.1:3000`). AD-5's cache-poisoning rationale for `Cache-Control: private, no-store` + `Vary: Cookie` is therefore grounded in a real topology, and `src/proxy.ts:33–37` implements it. Hostname mismatch at L-1.

---

## 4. Findings

### HIGH

**H-1 — The Stack table's Node.js floor is end-of-life, has no authority in `package.json`, and disagrees with what actually runs.**
*Checked against:* the absence of any `engines` field in `package.json` (verified: `require('./package.json').engines === undefined`); `node_modules/next/package.json` → `engines: {node: ">=20.9.0"}`; `Dockerfile:1` → `FROM node:22-bookworm-slim`; `.github/workflows/test.yml:19` → `node-version: '22'`; `README.md:36`, `README.md:67`, `docs/QUICKSTART.md:7`, `docs/deploy.md:9`, `docs/development-guide-monolith.md:8` all repeating "Node 20"; `nodejs.org/en/about/eol` and `herodevs.com` (July 2026) for EOL **2026-04-30**.
*Four distinct problems in one row:*
1. Node 20 went EOL three months ago. "v20+" as a supported floor now names an unpatched runtime — a CVE disclosed after 2026-04-30 will never be fixed for it. For a deployment whose whole reliability story is "Sabbath must not fail" (AD-1) and which is published to the public internet through a tunnel (AD-4), that is a real posture claim, not pedantry.
2. `package.json` has **no `engines` field**, so the sentence "package.json is the version authority" is vacuous for this row. Nothing in the manifest enforces or records it.
3. "v20+" is imprecise even for Node 20: Next 16.2.10 requires `>=20.9.0`, so 20.0–20.8 satisfies the spine and fails the framework.
4. Reality already moved: Docker and CI both run Node 22. The table is behind its own repo.
*Fix.* Change the row to `Node.js | 22.x LTS (>=22.12); Next requires >=20.9.0 — Node 20 reached EOL 2026-04-30`, add `"engines": {"node": ">=22.12.0"}` to `package.json` so the row has the authority the spine claims for it, and file the README / QUICKSTART / `docs/deploy.md` / `docs/development-guide-monolith.md` corrections as the same change set. If a Node 20 floor is genuinely still required, say *why* in the row.

**H-2 — AD-5's stated reason for banning `middleware.ts` is false as written.** See §3b. Node-runtime middleware has been stable since 15.5.0 (`proxy.md:776`), so "it compiles for the Edge runtime" is only a default, not a property. The repo's own `src/proxy.ts:5–11` states it correctly; the spine dropped the qualifier. A rule defended by a refutable reason is a rule that gets reverted.
*Fix:* in §3b.

**H-3 — AD-5 deviates from Next's documented guidance on Proxy, and the spine records no such deviation.** See §3c. `proxy.md:217–219` ("Always verify authentication and authorization inside each Server Function rather than relying on Proxy alone"), `getting-started/16-proxy.md:29` ("should not be used as a full session management or authorization solution"), `proxy.md:19` ("you should not attempt relying on shared modules or globals"). The Deferred item on the nine unguarded routes reads as scheduling; upstream reads it as a hazard. Also unstated: a Server Function POST inherits its route's matcher outcome, so a future matcher exclusion silently removes coverage from Server Functions on that path.
*Fix:* in §3c.

**H-4 — AD-13 names `canvas.toJSON()` as the mechanism; the code uses `canvas.getObjects()`.** See §3d. `toJSON` exists in fabric 6.6.1 (verified at runtime, arity 0) but appears nowhere in `src/`; `src/components/admin/ArtifactEditor.tsx:271` uses `canvas.getObjects()`. Repeated in the second Mermaid diagram's edge label.
*Fix:* in §3d.

**H-5 — The canvas editor's file location is wrong in three places in the spine.**
*Checked against:* `ls -R src/components` → `src/components/artifacts/` contains **only** `ArtifactSlide.tsx` (a renderer); the editor is `src/components/admin/ArtifactEditor.tsx` (confirmed by `grep -rn READ_ONLY_BASE_TYPES src/`, which lands on `src/components/admin/ArtifactEditor.tsx:104` and `:775`).
*The three wrong citations:*
- Structural Seed: `src/components/    # Header (shared nav/profile) + artifacts/ + ui/ shadcn` — omits `admin/` entirely, and implies the editor lives in `artifacts/`.
- Capability map, CAP-3: "Lives in `src/components/artifacts/`, canvas editor".
- Epic 16 map: "Canvas editor boundary | `src/components/artifacts/`".
The Deferred section's `ArtifactEditor.tsx:104` line number is **correct** (`READ_ONLY_BASE_TYPES.has(template.baseType)`), and so is `registry/store.ts:226` (`!options?.allowReadOnly && READ_ONLY_BASE_TYPES.has(existing.baseType)`) — the line numbers were checked, the directory was not. That is exactly the failure mode this lens looks for: a plausible path asserted rather than opened.
*Fix.* `src/components/admin/ArtifactEditor.tsx` in all three places; add `admin/` to the Structural Seed line; keep `artifacts/` where the reference is to `ArtifactSlide.tsx`.

### MEDIUM

**M-1 — Pinned-exact Next / React / eslint-config-next are behind current patch.** Next `16.2.10` → `16.2.12`; React & React DOM `19.2.4` → `19.2.8`; `eslint-config-next 16.2.10` → `16.2.12`. All three are pinned exact in `package.json`, so nothing drifts by accident — but nothing picks up a security patch by accident either. `16.2.11`/`16.2.12` were not audited here beyond confirming `16.2.10` itself was a publish-only maintenance release. *Fix:* bump the three pins together (they move as a set), or add a line to the table stating the patch-pin policy and who reviews it.

**M-2 — TypeScript `^5` is two majors behind current stable.** Latest is `7.0.2`; `6.0.0-beta` and `7.0.1-rc` also exist; resolved here is `5.9.3`. The `^5` range can never see 6 or 7, so this will not resolve itself. Not urgent — `eslint-config-next@16.2.12` peers `typescript >=3.3.1` — but "^5 (strict)" now reads as if 5 were current. *Fix:* annotate the row (`^5 — TS 7 is current; upgrade deferred`) or open a Deferred item.

**M-3 — better-sqlite3 is one major behind, and its next major is incompatible with the spine's own Node floor.** `12.11.1` installed (`engines: 20.x‖22.x‖…‖26.x`); latest `13.0.2` requires `node >=22`. Two spine rows are therefore in latent conflict: "Node.js v20+" and any future better-sqlite3 upgrade. Given H-1 the resolution is the same in both cases — raise the Node floor. Also relevant because better-sqlite3 is a native module compiled in the Docker `deps` stage (`python3 make g++`), so a major bump is a rebuild, not just a version bump. *Fix:* note the coupling on the row, and sequence the Node floor first.

**M-4 — fabric is one major behind, and the editor contains explicit v6 workarounds.** Latest `7.4.0` (`beta 7.0.0-rc1`); an official migration guide exists (`fabricjs.com/docs/upgrading/upgrading-to-fabric-70/`). `src/components/admin/ArtifactEditor.tsx` carries version-specific comments at :160 ("Fabric v6 assigns an explicit `undefined` straight over its own class…") and :293 ("Fabric v6's `Text.initDimensions()` overwrites `width`/`height`…"). So v7 is a real migration with known contact points, and the table's bare `^6.6.1` does not say that v6 is now the previous major. *Fix:* annotate the row `^6.6.1 (v6 line; v7 is current — see ArtifactEditor v6 notes)` or add a Deferred item.

**M-5 — ESLint `^9` is now the maintenance line.** `registry.npmjs.org/-/package/eslint/dist-tags` → `latest: 10.8.0`, `maintenance: 9.39.5` — and `9.39.5` is exactly what the lockfile resolved. `eslint-config-next@16.2.12` peers `eslint >=9.0.0`, so 10 is permitted. *Fix:* annotate or bump.

**M-6 — `fast-xml-parser ^5.10.1` is absent from the Stack table but is load-bearing for a hard repository gate.** *Checked against:* `scripts/extract-pptx-assets.mjs:39` (`import { XMLParser } from 'fast-xml-parser'`), the only consumer; `AGENTS.md` names that script's `evidenceFor` as the point where real deck material is filtered, asserted by `tests/asset-map-evidence.test.mjs`. `jszip` is in the table on weaker grounds (`src/lib/pptx.ts:5`, plus four tests and two scripts). A parser sitting on the path of the public-repo privacy filter deserves at least the same standing. *Fix:* add the row, or state the table's inclusion criterion so the omission is a decision rather than an oversight.

**M-7 — `@types/node ^20` types an EOL runtime the deployment does not run.** Resolved `20.19.43`; `@types/node` latest is `26.1.2`. Docker (`node:22-bookworm-slim`) and CI (`node-version: '22'`) both run 22, so the type surface understates the runtime — Node 22 APIs typecheck as missing. *Fix:* move to `^22` alongside H-1.

**M-8 — The "re-verified row by row … with no drift found" sentence overstates what it can verify.** True for the ten package rows (I re-derived all ten). Not true for the Node.js row (H-1) or for `base-nova` (L-3), and silent on currency, which is where four rows are now behind. *Fix:* split the sentence — *"`package.json` pins every library row; this table mirrors it (last mirrored 2026-07-30). Currency against upstream is a separate check, recorded in Deferred."*

### LOW

**L-1 — AD-4's hostname appears nowhere in the deployment configuration.** AD-4 says `presenter.example.church`; the repo consistently uses `presenter.example.org` — `docker-compose.yml:19–21` and `:47–49` default host paths, `.env.example:36,39`, `docs/cloudflare-tunnel.md:50`, `docs/deployment-guide.md:54`. Both are placeholders, so nothing breaks, but a reader grepping for the spine's hostname finds nothing. *Fix:* use one placeholder.

**L-2 — Next's own `self-hosting.md` contradicts `proxy.md` about the Proxy runtime, and a future reader may cite the wrong page.** `node_modules/next/dist/docs/01-app/02-guides/self-hosting.md:33` still says "Proxy uses the Edge runtime … If you do not want this, you can use the full Node.js runtime" — stale prose carried over from the middleware era, contradicting `proxy.md:221–223` and `version-16.md:629`. The authoritative statements are the latter two plus `01-app/02-guides/authentication.md:1124` ("Proxy uses the Node.js runtime"), and the build manifest settles it empirically. *Fix:* when AD-5 cites its evidence (H-2), cite `proxy.md` §Runtime and `version-16.md`, and note that `self-hosting.md` is stale so nobody "corrects" the spine from it.

**L-3 — the `(shadcn base-nova)` parenthetical is real but its authority is outside `package.json`.** `base-nova` is web-confirmed as a genuine shadcn `style` value (`{library}-{style}` = Base UI + Nova) and is set in `components.json:3`. But the table's version `^1.6.0` belongs to `@base-ui/react`, not to the style; and the "package.json is the version authority" sentence does not reach `components.json`. *Fix:* `@base-ui/react ^1.6.0 (primitives; shadcn style base-nova per components.json)`.

**L-4 — AD-5 leans on a testing utility whose documented name does not exist in the installed build.** `proxy.md:700–711` documents `unstable_doesProxyMatch`; `next@16.2.10` exports only `unstable_doesMiddlewareMatch`. `tests/proxy-matcher.test.mjs:9–18` already found this and documents it in its header ("the doc is ahead of the code"), so the test works and AD-5's same-change-set requirement is enforceable. Recorded because it is a live example of shipped Next docs running ahead of the shipped code — the exact hazard this lens guards, caught by the repo rather than by the spine. *Fix:* none required; optionally cite the test's note from AD-5 so the discrepancy is not rediscovered.

---

## 5. What a reader currently has to take on trust

Enumerated per the mandate's item 4 — every factual assertion in the spine, and what I checked it against.

| Assertion | Checked against | Status |
| --- | --- | --- |
| All ten library versions | `package.json` lines 20–47, `package-lock.json` (lockfileVersion 3) resolved entries + npm dist-tags | Verified — no drift vs manifest; four behind current (M-1..M-5) |
| `Node.js v20+` | `package.json` (no `engines`), `Dockerfile:1`, `.github/workflows/test.yml:19`, `node_modules/next/package.json`, nodejs.org EOL | **Falsified** (H-1) |
| `src/proxy.ts` is the Next 16 convention | `node_modules/next/dist/docs/.../file-conventions/proxy.md` (header + Version history `v16.0.0`), `01-app/01-getting-started/16-proxy.md:15`, `version-16.md:625–638` | Verified |
| Next throws if Proxy exports `runtime` | `proxy.md:221–223`; `version-16.md:629` | Verified |
| `config.matcher` regex/negative-lookahead semantics | `proxy.md:88–99`, `:134–137`, `:602–619`; `.next/standalone/.next/server/functions-config-manifest.json` (compiled `originalSource`) | Verified, incl. `_next/data` widening |
| Proxy runs on Node, in the standalone build | `.next/standalone/.next/server/functions-config-manifest.json` → `"/_middleware": {"runtime": "nodejs"}` | Verified empirically |
| `middleware.ts` "compiles for the Edge runtime" | `proxy.md:775–776` (v15.5.0 Node stable); `version-16.md:629` | **False as written** (H-2) |
| Proxy is a sound single authorization gate | `proxy.md:19`, `:217–219`; `getting-started/16-proxy.md:29` | Deviation from upstream guidance, unrecorded (H-3) |
| `output: "standalone"` | `next.config.ts`; `config/01-next-config-js/output.md:30`; `proxy.md:728–733` | Verified |
| `canvas.toJSON()` on save | fabric 6.6.1 runtime (`toJSON` present, arity 0) vs `src/components/admin/ArtifactEditor.tsx:271` (`getObjects()`); `grep toJSON src/` → none | **Not the shipped mechanism** (H-4) |
| Fabric is load-bearing at all | `ArtifactEditor.tsx:49` (`typeof import('fabric')`), `:155` `FabricText`, `:171/179/188` `Rect` | Verified — genuinely used, dynamically imported |
| `BroadcastChannel` via `@/lib/present-channel` | `src/lib/present-channel.ts:84–88`; only other use `PresenterOperator.tsx:253` | Verified |
| better-sqlite3 synchronous, server-only, WAL | `src/lib/db/index.ts:88` (`journal_mode = WAL`) | Verified |
| `expectedUpdatedAt` / `RegistryStaleError` | `src/lib/registry/store.ts:20, 207, 223–224, 272, 286, 291` | Verified |
| `artifact_seed_hash_backfilled` still the shipped mechanism | `src/lib/db/index.ts:13` (`SEED_HASH_BACKFILL_KEY`) | Verified — Deferred item is accurate |
| `reseedArtifactTemplateIfUntouched`, `registry:doctor`, `tests/registry-reseed.test.mjs` | `src/lib/registry/store.ts:391`, `seed.ts:7,143`, `scripts/registry-doctor.mjs`, `tests/registry-reseed.test.mjs:32` | Verified — all three exist |
| `ArtifactEditor.tsx:104`, `registry/store.ts:226` | `src/components/admin/ArtifactEditor.tsx:104`; `src/lib/registry/store.ts:226` | Line numbers verified; **path wrong** (H-5) |
| `src/components/artifacts/` is the canvas editor | `ls -R src/components` | **Falsified** (H-5) |
| Docker + Cloudflare Tunnel topology | `Dockerfile`, `docker-compose.yml`, `docs/cloudflare-tunnel.md`, `docs/deployment-guide.md:54` | Verified; hostname mismatch (L-1) |
| "shadcn base-nova" is a real product name | `components.json:3`; `ui.shadcn.com/docs/theming`; shadcnblocks style/Base-UI posts | Verified real |
| `@base-ui/react` is a real package | `registry.npmjs.org/@base-ui/react` (`latest 1.6.0`); `node_modules/@base-ui/react/package.json` → MUI Base UI | Verified real |
| `UPLOADS_DIR` is a durable bind-mount | `.env.example:25,36,39`; `docker-compose.yml:21` (`→ /app/data/uploads`); `src/lib/uploads.ts:12` (defaults to `./data/uploads`) | Verified — the mount lands on the default path, so the env var is optional; AD-4 is satisfied |

### Greenfield-starter check

The spine names no starter, so there is little to reality-check on that axis. The one starter-derived value it surfaces — `shadcn base-nova` — I verified against both `components.json` and the web (L-3). Two starter-era migrations are already correctly done and worth noting as *not* stale: `package.json:9` is `"lint": "eslint"` (Next 16 removed `next lint`, `version-16.md:82`), and there is no `middleware.ts` anywhere.

---

## 6. Verdict

**PASS WITH FINDINGS.** No named technology is hallucinated: `@base-ui/react` is MUI's Base UI at the current `1.6.0`, "shadcn base-nova" is a real style value, and every one of the ten library rows matches `package.json`, matches the lockfile, and resolves from `registry.npmjs.org`. The `src/proxy.ts` decision — the one the mandate flagged hardest — is not a training-data guess: Proxy is real in Next 16, `runtime` really throws, the matcher semantics hold, and the compiled `functions-config-manifest.json` proves the gate ships on the Node runtime under `output: "standalone"`. Three rows are current to the day (Tailwind, pptxgenjs, jszip).

What fails is the part of the table nobody re-derived. The Node.js row is end-of-life, has no `engines` field behind it, is looser than Next's own floor, and already disagrees with the Dockerfile — four falsifications in one cell of a table whose caption says it was re-verified row by row. Two mechanism claims are stated as unqualified fact and are not (`middleware.ts` is Edge-only; React reads via `canvas.toJSON()`), one design decision quietly departs from documented framework guidance without saying so, and the canvas editor's directory is wrong in three places while the line numbers beside it are right — the signature of citations checked by search rather than by opening the file.

No CRITICAL: nothing named is fictional, and no mechanism the spine depends on is broken. But H-1 through H-5 are all things a reader would have taken on trust and been wrong about.

## Sources

- [Release v16.2.10 · vercel/next.js](https://github.com/vercel/next.js/releases/tag/v16.2.10)
- [Next.js 16.2 blog](https://nextjs.org/blog/next-16-2)
- [Upgrading: Version 16 | Next.js](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Node.js — End-Of-Life](https://nodejs.org/en/about/eol)
- [HeroDevs — Node.js Version Support: EOL Dates and Latest Releases (July 2026)](https://www.herodevs.com/blog-posts/node-js-end-of-life-dates-you-should-be-aware-of)
- [Node.js End-of-Life Dates — Official EOL Schedule](https://endoflife.ai/article-nodejs-eol)
- [Upgrading to Fabric.js 7.0](https://fabricjs.com/docs/upgrading/upgrading-to-fabric-70/)
- [fabric on npm (versions)](https://www.npmjs.com/package/fabric?activeTab=versions)
- [Theming — shadcn/ui](https://ui.shadcn.com/docs/theming)
- [shadcn/ui Component Styles: Vega, Nova, Maia, Lyra, and Mira](https://www.shadcnblocks.com/blog/shadcn-component-styles-vega-nova-maia-lyra-mira)
- [Base UI Support for Shadcn Blocks](https://www.shadcnblocks.com/blog/introducing-base-ui-and-component-styles)
- [Base UI](https://base-ui.com) / [mui/base-ui](https://github.com/mui/base-ui)
- npm registry endpoints queried 2026-07-30: `registry.npmjs.org/next/latest`, `/react/latest`, `/react/19.2.4`, `/better-sqlite3/latest`, `/pptxgenjs/latest`, `/fabric/latest`, `/eslint-config-next/latest`, `/@base-ui/react`, and `/-/package/{react,fabric,better-sqlite3,typescript,tailwindcss,eslint,jszip,@types/node}/dist-tags`
