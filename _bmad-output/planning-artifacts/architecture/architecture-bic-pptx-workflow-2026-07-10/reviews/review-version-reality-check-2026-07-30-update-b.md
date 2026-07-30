# Reviewer Gate — Version / Reality-Check Lens

**Target:** `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md`
**Intent:** Update (post-amendment verification)
**Date:** 2026-07-30
**Lens:** Verify every committed decision was web-researched or reality-checked rather than asserted from training data — current library/framework versions, that each named technology still exists and fits, and the live defaults of anything the project leans on.
**Independence:** No file under `reviews/` and no `.memlog.md` was read. All verdicts derive from primary sources: `package.json`, `package-lock.json`, `node_modules/**`, the npm registry (`npm view … dist-tags`), the shipped Next docs in `node_modules/next/dist/docs/`, repo source, and the live web.

**Verdict: CHANGES REQUESTED** — 2 CRITICAL, 4 HIGH, 3 MEDIUM, 2 LOW (11 findings).

The table's self-claims are, to the spine's considerable credit, mostly *true and clearly checked*: `better-sqlite3` 13's `node >=22` engine, ESLint's `maintenance` dist-tag, fabric's two v6 workarounds, the `base-nova` shadcn style, Node 20's EOL date, and Next's `>=20.9.0` engines constraint were each verified exactly as written. AD-23 is the best-grounded decision in the file. Two things defeat the gate anyway: an `[ADOPTED]` mechanism (AD-10's plan identity) that does not exist in `src/` at all, and a currency certification dated nine days *after* a nine-CVE Next.js security release that the pinned version predates.

---

## 1. Stack verification table

Legend: **web-current** = npm `latest` dist-tag resolved 2026-07-30, or the authoritative release schedule for Node.

| Spine value | package.json | lockfile (resolved) | web-current | Verdict |
| --- | --- | --- | --- | --- |
| Node.js **22.x LTS (`>=22.12`)** | *no `engines` field* | n/a | 22 = **Maintenance LTS** (EOL 2027-04-30); **24 = Active LTS** (EOL 2028-04-30); 26 = Current | **HIGH** — all four sub-claims true, but "22.x LTS" omits *maintenance*; see F4 |
| Next.js 16.2.10 | `16.2.10` (exact) | 16.2.10 | **16.2.12** (16.2.11 = 20 Jul 2026 security release) | **CRITICAL** — see F2 |
| React / React DOM 19.2.4 | `19.2.4` (exact) | 19.2.4 | **19.2.8** (published 2026-07-21) | **CRITICAL** — see F2 |
| TypeScript ^5 (strict) | `^5` | 5.9.3 | **7.0.2** (GA 2026-07-08) | **MEDIUM** — two majors, not one; see F8 |
| Tailwind CSS ^4 | `^4` | 4.3.3 | 4.3.3 | ✅ current, zero drift |
| better-sqlite3 ^12.11.1 | `^12.11.1` | 12.11.1 (`engines: 20.x‖22.x‖…‖26.x`) | **13.0.2** (`engines: node >=22`) | ✅ mirror exact; the `>=22` claim in *Deferred* is **confirmed** |
| pptxgenjs ^4.0.1 | `^4.0.1` | 4.0.1 | 4.0.1 | ✅ current, zero drift |
| jszip ^3.10.1 | `^3.10.1` | 3.10.1 | 3.10.1 | ✅ current, zero drift |
| fabric ^6.6.1 | `^6.6.1` | 6.6.1 | **7.4.0** | ✅ mirror exact; "two explicit v6 workarounds" **confirmed** (`ArtifactEditor.tsx:160`, `:293`) |
| @base-ui/react ^1.6.0 (shadcn base-nova) | `^1.6.0` | 1.6.0 | 1.6.0 | ✅ current; **`base-nova` naming is real** — `components.json` → `"style": "base-nova"` |
| ESLint ^9 / eslint-config-next 16.2.10 | `^9` / `16.2.10` | 9.39.5 / 16.2.10 | eslint **10.8.0**; `maintenance` tag = **9.39.5** | ✅ mirror exact; the "*maintenance* tag" claim is **confirmed to the patch** |
| fast-xml-parser ^5.10.1 (dev) | `^5.10.1` (devDep) | 5.10.1 (dev) | 5.10.1 | ✅ current; dev ✔; `XMLParser` at `scripts/extract-pptx-assets.mjs:39`, `evidenceFor` at `:503` — row's description **confirmed** |
| Test runner `node:test` + `--experimental-strip-types` | `scripts.test` matches verbatim; no vitest/jest | n/a | type stripping **stable & default since Node 22.18.0 / 24.3.0** | **MEDIUM** — see F7 |

### The table's three claims about itself

| Claim | Verdict |
| --- | --- |
| *"`package.json` pins every library row and this table mirrors it — last mirrored 2026-07-30, zero drift"* | **TRUE for all 12 library rows** — verified string-by-string. But the mirror is one-way and **incomplete in the other direction**: `shadcn ^4.13.0` and `@types/node ^20` are pinned libraries absent from the table (F5, F6). |
| *"the Node.js row has no `engines` field to mirror from"* | **TRUE** — `package.json` has no `engines` key. Honestly stated. |
| *"four rows now sit a major behind current stable"* | **TRUE for the four named**, but undercounts: TypeScript is **two** majors behind, and Node is an unlisted fifth row behind its Active LTS line (F8). |

---

## 2. Mechanism-claims table

| # | Spine claim | Checked against | Verdict |
| --- | --- | --- | --- |
| M1 | App Router with `output: "standalone"` | `next.config.ts` | ✅ CONFIRMED |
| M2 | A `proxy.ts` entry **always** runs on Node | `proxy.md:223`; `version-16.md:629` ("The `proxy` runtime is `nodejs`, and it cannot be configured") | ✅ CONFIRMED |
| M3 | Exporting `runtime` from a Proxy file throws | `proxy.md:223` ("Setting the `runtime` config option in Proxy will throw an error") | ✅ CONFIRMED |
| M4 | A `middleware.ts` entry is Edge **unless** it exports `runtime = 'nodejs'` | `proxy.md:775`; `version-16.md:629`; `authentication.md:1124` | ⚠️ **MEDIUM** — true of Next 15.5+, undated, and sourced to a reference page that no longer ships with 16 (F9) |
| M5 | Node-runtime middleware stable since Next **15.5.0** | `proxy.md:775` version-history row: `v15.5.0 — Middleware can now use the Node.js runtime (stable)` | ✅ CONFIRMED to the exact version |
| M6 | Next's docs advise never relying on Proxy alone for authorization (`proxy.md:217-219`) | `proxy.md:219` | ⚠️ **LOW** — line-accurate but the sentence is Server-Function-scoped (F10) |
| M7 | *(unstated)* AD-5's per-request SQLite re-check on every gated request | `authentication.md:1031` — "**avoid database checks to prevent performance issues**" | 🔴 **HIGH** — unrecorded deviation from upstream guidance (F3) |
| M8 | `BroadcastChannel` sync via the single `@/lib/present-channel` module | `src/lib/present-channel.ts:79-88` — one channel name `bic-present-${serviceId}` | ✅ CONFIRMED |
| M9 | **"Every message carries a plan identity"** — a fingerprint of the snapshot and resolved announcement set | `present-channel.ts:19-38`; `grep -rniE "fingerprint\|planIdentity\|planHash\|snapshotId" src` | 🔴 **CRITICAL — FALSE** (F1) |
| M10 | Fabric uncontrolled wrapper; save is `serializeCanvas` over `canvas.getObjects()`, **not** `toJSON()` | `ArtifactEditor.tsx:257`, `:271`, `:532`; no `toJSON` in editor/registry/artifacts | ✅ CONFIRMED, including the negative |
| M11 | better-sqlite3 synchronous and server-only | native binding; lockfile `engines` are Node-only | ✅ accurate |
| M12 | `node:test` + `--experimental-strip-types`, via a loader, over an explicit file list | `tests/register-ts-resolve.mjs` exists; `scripts.test` enumerates 35 suites; no vitest/jest anywhere | ✅ CONFIRMED (flag currency separately — F7) |
| M13 | **AD-23** — one app-wide `settings` value `slide_transition`, described exactly once in `src/lib/transitions.ts`, neither renderer holding either half | `settings.ts:13` (`SLIDE_TRANSITION_KEY`); `transitions.ts` (table + `DEFAULT_SLIDE_TRANSITION`); imports at `pptx.ts:20`, `SlideshowClient.tsx:7`, `ProjectorClient.tsx:12`, `PresenterOperator.tsx:43`; **zero** hardcoded `'fade'`/`crossfade` in those four files | ✅ **CONFIRMED in full** |
| M14 | AD-23's citations: `prd.md:305` makes it FR-7; `docs/architecture.md:61` contradicts by hardcoding a crossfade | both lines read directly | ✅ **both citations exact** |
| M15 | Only styles surviving a plain `<p:transition>` child without the `p14` namespace qualify | `transitions.ts` header, lines 9-16 | ✅ CONFIRMED — "ratifies a convention the code already states in its own header" is literally true |
| M16 | `Dockerfile` and CI already run 22 | `Dockerfile:1` `node:22-bookworm-slim`; `.github/workflows/test.yml:19` `node-version: '22'` | ✅ CONFIRMED (floating tags, so ≥22.18 in practice) |
| M17 | Next 16.2.10 requires `>=20.9.0` | `node_modules/next/package.json:133-135` | ✅ CONFIRMED verbatim |
| M18 | Node 20 reached EOL 2026-04-30 | nodejs release schedule / endoflife.date | ✅ CONFIRMED |

---

## 3. Findings

### F1 — CRITICAL — AD-10's "plan identity" does not exist in `src/`, yet AD-10 is tagged `[ADOPTED]`

`ARCHITECTURE-SPINE.md:124` (AD-10) states, in the indicative present:

> **Every message carries a plan identity** — a fingerprint of the snapshot and resolved announcement set that produced the deck — and a receiver whose own identity differs **refuses to follow the index** and says so on the room-facing screen…

Checked against `src/lib/present-channel.ts:19-38`. The `PresentMessage` union has six variants. The only one carrying deck position is:

```ts
| { type: 'sync'; index: number; blank: boolean; transition: SlideTransition }
```

There is no identity, fingerprint, hash, or version field on any variant. A repo-wide grep for `fingerprint|planIdentity|plan_identity|planHash|deckId|snapshotId` across `src/` and `tests/` returns **only** unrelated hits in `tests/public-repo-guard.test.mjs` and `tests/asset-map-evidence.test.mjs` (the private-literal hashing guard). Nothing implements the refusal behaviour, and there is no room-facing message for it.

Three things make this a gate failure rather than a documentation nit:

1. **The tag is load-bearing and wrong.** The spine's own Invariants table (`:68`) defines `[ADOPTED]` as "Decided **and** ratified against shipped code. The Rule describes `src/` as it is." `:73` then says "AD-16..AD-22 land with Epic 20; **everything else is shipped**," which affirmatively places AD-10 in the shipped set. A builder reading AD-10 will look for the identity field, not add it.
2. **The clause is self-blocked.** The identity is defined as "a fingerprint of **the snapshot**" — but the per-service snapshot is AD-16, tagged `[TARGET]`, and the spine says plainly at `:260-261` that "today there is no per-service snapshot." An `[ADOPTED]` rule cannot be satisfied by a fingerprint of an artifact a `[TARGET]` decision says does not exist yet.
3. **The graph repeats it as current.** `:256` labels the edge `AD-10 BroadcastChannel + plan identity`, and the graph's own escape hatch at `:260` scopes the "Epic 20 target" caveat to **AD-16..AD-22** — which does not include AD-10. So the caveat does not cover this edge.

The *reasoning* in the rest of the clause is sound and worth keeping (two independent `force-dynamic` renders each calling `buildSlidePlan` at its own moment genuinely do make a bare `index` ambiguous). The defect is the tag and tense, not the decision.

**Fix:** either retag AD-10 `[ADOPTED, partial]` with the identity clause named in *Deferred* as the gap, or split the identity requirement into its own `[TARGET]` decision sequenced behind AD-16 (since it depends on the snapshot). Also amend the graph label or extend the `:260-261` caveat to name AD-10.

---

### F2 — CRITICAL — the pinned Next.js predates a 9-CVE security release, and the spine certifies currency nine days after it

The Stack table pins `Next.js 16.2.10` and the *Deferred* list characterizes the gap as:

> Next/React/eslint-config-next are a few patches behind and move as a set.

Registry publish timestamps:

| Version | Published |
| --- | --- |
| 16.2.10 (**pinned**) | 2026-07-01 |
| **16.2.11** | **2026-07-21** |
| 16.2.12 (latest) | 2026-07-25 |

`16.2.11` is the **July 2026 Next.js security release** — 9 CVEs, 4 high and 5 medium. React `19.2.8` shipped the same day (2026-07-21); the repo pins `19.2.4` (2026-01-26), four patches back.

Two of the three publicly summarized CVEs are **App Router + Server Actions** (CPU-exhaustion DoS) and **App Router + Turbopack + a single `config.i18n.locales` entry** (a *proxy/middleware bypass that skips authentication and security checks*). I checked this repo's exposure directly and report it honestly: `grep -rln "use server" src` returns nothing, and `next.config.ts` configures no `i18n`, so **those two specific CVEs appear not to apply**. The third (cache reuse across requests with invalid-UTF-8 bodies) and the six unenumerated ones are unassessed — by me and, more to the point, by the spine.

Why this is CRITICAL and not routine patch lag:

- The table asserts "**last mirrored 2026-07-30, zero drift**." The mirror is against `package.json`, which is true — but the sentence sits directly above a *Deferred* item whose whole job is currency-vs-upstream, and that item downgrades a crossed security boundary to "a few patches." A reader is told, on 2026-07-30, that the only currency debt is four majors and some patches.
- One of the fixed CVEs is a **proxy bypass that skips authentication**. AD-5's entire premise (`:98`) is that "`src/proxy.ts` is the one request gate, and its `config.matcher` regex **is** the authorization boundary." A class of bug that bypasses Proxy is the one class AD-5 cannot survive, and the spine already records nine routes with no in-route `requireSession` as a standing deviation. The pin and the gate interact, and nothing in the file notes it.
- Both `next` and `react` are **exact pins** (no caret), so neither moves on its own — the spine's own observation that pins freeze rows applies here too, and it is only made about the four major-behind rows.

**Fix:** bump to `next@16.2.12` / `react`+`react-dom@19.2.8` / `eslint-config-next@16.2.12`, or, if the bump is deferred, replace the "a few patches behind" phrasing with the security-release fact plus the exposure assessment above, and date it. Currency claims about a framework that gates authorization need a CVE check, not a patch-count.

---

### F3 — HIGH — AD-5's per-request SQLite re-check is a second, unrecorded deviation from Next's own guidance

AD-5 (`:98`) carefully records one deviation from upstream:

> **Recorded deviation:** Next's own docs advise never relying on Proxy alone for authorization (`proxy.md:217-219`), so the nine non-admin routes that carry no in-route `requireSession` are a standing deviation from upstream guidance…

That discipline is good. But the shipped Next 16.2.10 authentication guide contains a second, sharper statement that cuts the *other* way, and the spine does not mention it. `node_modules/next/dist/docs/01-app/02-guides/authentication.md:1031`:

> However, since Proxy runs on every route, including [prefetched] routes, it's important to only read the session from the cookie (optimistic checks), and **avoid database checks to prevent performance issues**.

The guide's whole Proxy section is titled "**Optimistic** checks with Proxy (Optional)" (`:1024`), and `:1022` lists Proxy as an optional optimistic layer.

AD-5 mandates the opposite as its central mechanism: "The gate re-checks **every** session against SQLite (deleted account, role demotion, stale `token_version`, revoked `sid`) and **fails closed** if that lookup throws." The spine even names this as the *reason* the `proxy.ts` rename is load-bearing — "which is what guarantees the per-request SQLite re-check."

I am not saying the decision is wrong. Doing the DB re-check in the gate is a defensible trade for a single-congregation hub on one home PC, and it buys real security (privilege that dies on demotion). The finding is that AD-5 goes out of its way to record a deviation from upstream guidance on a *secondary* point while its *primary* mechanism silently contradicts a more explicit piece of the same doc set — and the spine's justification for recording the first ("a rule defended by a refutable reason is a rule that gets reverted") applies with more force to this one. The stated cost is also concrete and unassessed: prefetch traffic multiplies the per-request SQLite hits, and no performance budget exists anywhere in the file (*Deferred* concedes "Performance envelope: no budget at this altitude").

**Fix:** add a second recorded deviation to AD-5 citing `authentication.md:1031`, with the trade written down (prefetch amplification accepted; SQLite is local and synchronous; hub serves one congregation).

---

### F4 — HIGH — the rewritten Node row picks a Maintenance-LTS line and never says so; its own EOL logic points at Node 24

Every one of the row's four factual sub-claims verifies:

| Sub-claim | Source | Verdict |
| --- | --- | --- |
| Next 16.2.10 requires `>=20.9.0` | `node_modules/next/package.json:133-135` | ✅ |
| Node 20 reached EOL 2026-04-30 | release schedule / endoflife.date | ✅ |
| `Dockerfile` runs 22 | `Dockerfile:1` — `node:22-bookworm-slim` | ✅ |
| CI runs 22 | `.github/workflows/test.yml:19` — `node-version: '22'` | ✅ |

What is missing is the state of the line it selects. As of 2026-07-30:

- **Node 22 is Maintenance LTS**, EOL **2027-04-30** — nine months out.
- **Node 24 is Active LTS**, EOL 2028-04-30.
- Node 26 is Current, promoting to Active LTS in October 2026.

The row says "**22.x LTS**" without the qualifier. That reads as *the* LTS to anyone who does not already know the schedule — which is precisely the reader the row was rewritten for. And the row's stated reasoning is an EOL argument: Node 20 died, therefore move. Applied consistently one line further, that argument selects 24, not the line whose own EOL is inside the horizon of the *"revisit before first deploy"* milestone AD-4 now dates.

Two things sharpen it:

- `better-sqlite3` 13 requires `node >=22` (verified: `npm view better-sqlite3@13.0.2 engines` → `{"node":">=22"}`). The spine treats the Node floor as the *blocker* for that upgrade. Moving to 24 clears it with more runway.
- `Dockerfile` and CI both use **floating** major tags (`node:22-bookworm-slim`, `node-version: '22'`), so neither enforces `>=22.12`, and both would follow a `22` → `24` change with a one-character edit.

**Fix:** state "Node 22.x **Maintenance** LTS (EOL 2027-04-30)" and either justify staying on 22 or record 24 as the target with the milestone. Also state *why* the floor is `>=22.12` specifically — the number is load-bearing and currently unexplained (see F7).

---

### F5 — HIGH — `@types/node: ^20` pins the type surface to the EOL'd major the Node row just moved off

`package.json` devDependencies: `"@types/node": "^20"` → lockfile resolves **20.19.43**. npm `latest` is **26.1.2**.

The spine's *Deferred* item at `:354` scopes the Node-row cleanup as:

> Adding `"engines": {"node": ">=22.12.0"}` and correcting the five docs that still say "Node 20" … is a code change, not a spine change.

It enumerates only *prose*. The most consequential "still says Node 20" in the repo is not prose — it is a manifest pin that determines the Node API surface `tsc --strict` checks the entire codebase against. The build currently typechecks against Node 20 typings while `Dockerfile` and CI execute on Node 22 (in practice ≥22.18). That is a real, silent mismatch: Node 22-only APIs are invisible to the compiler, and Node 20 APIs removed since are still assumed present.

It also undercuts the table's headline claim in a way the omission list does not cover. "`package.json` pins every library row and this table mirrors it — zero drift" is true of the rows shown, but `@types/node` is a pinned library that *directly contradicts the row immediately above it*, and it appears nowhere.

**Fix:** name `@types/node` in the *Deferred* item alongside `engines`, and either add it to the Stack table or say explicitly that `@types/*` rows are out of the table's scope.

---

### F6 — HIGH — `shadcn ^4.13.0` is a pinned runtime dependency the table does not mirror, and the row it hides behind is a naming gloss

The Stack table's row is `@base-ui/react (shadcn base-nova) | ^1.6.0`. Both halves check out:

- `@base-ui/react` exists, `package.json` `^1.6.0`, lockfile 1.6.0, npm `latest` **1.6.0** — current, zero drift. ✅
- **`base-nova` is real and verifiable in-repo**: `components.json` → `"style": "base-nova"`. ✅ Good call including it.

But `shadcn` is not only a style name here — it is a **separate pinned runtime dependency**: `"shadcn": "^4.13.0"` in `dependencies` (not devDependencies), lockfile 4.13.0, npm `latest` **4.16.0**. The parenthetical gloss makes a reader scanning for "shadcn" believe the table covers it. It does not, and the package is behind.

That it sits in `dependencies` rather than `devDependencies` is itself worth a look — the shadcn CLI is a build/scaffold tool, and shipping it as a runtime dependency inflates the `standalone` output that AD-4 deploys.

**Fix:** either add a `shadcn` row or move the naming gloss into prose so it cannot be mistaken for coverage. Separately (implementation, not spine): confirm whether `shadcn` belongs in `dependencies`.

---

### F7 — MEDIUM — `--experimental-strip-types` is no longer experimental, and the `>=22.12` floor sits below the version where that became true

Both the Stack table's *Test runner* row and the *Testing* convention (`:214`) name `--experimental-strip-types`. Verified against `scripts.test`: the flag is used verbatim across all 35 suites, the loader `tests/register-ts-resolve.mjs` exists, and there is no vitest/jest anywhere. The convention is accurately described. ✅

The currency claim is what is stale. Node type stripping became **stable and enabled by default in Node 22.18.0 and 24.3.0** — `node file.ts` runs without any flag, and the feature is no longer experimental. The flag is still accepted, so nothing is broken; but the row describes an experimental opt-in for a shipped default, which is exactly the shape of a fact carried from training data rather than re-checked.

This intersects with the Node floor in a way worth deciding deliberately. The row says `>=22.12` and gives no reason for that number. If the basis is type stripping, the correct floor is **22.18.0** — on 22.12 through 22.17 the flag is required *and* experimental. If the basis is something else (`require(esm)` unflagging landed in 22.12), the row should say so, because `>=22.12` is now cited by *Deferred* as the exact `engines` string to add.

**Fix:** state the basis for `>=22.12`, or raise it to `>=22.18.0` and note that the flag is retained for explicitness rather than necessity.

---

### F8 — MEDIUM — the "four rows a major behind" summary undercounts TypeScript and omits Node

The claim at `:234`/`:355` is accurate for the four rows it names, and two of its supporting details are verified to the patch (ESLint's `maintenance` tag = 9.39.5; better-sqlite3 13's `node >=22`). Two corrections:

- **TypeScript is two majors behind, not one.** Pinned `^5` → resolved 5.9.3; npm `latest` is **7.0.2** (GA 2026-07-08, shipped under `latest`, the Go-native compiler). The *Deferred* text is right that "`^5` can never resolve 6 or 7" — but the summary sentence "four rows now sit a major behind" flattens a two-major, cross-compiler gap into the same bucket as fabric 6→7. TypeScript 6.x existed as the transition release; skipping straight from 5.9 to 7.0 is a different size of migration than the sentence implies.
- **Node is an unlisted fifth.** Per F4, the Node row is a full LTS line behind Active LTS and two majors behind Current. The sentence exists so that *"no drift against `package.json`" is never mistaken for "current"* — and Node is the one row where `package.json` cannot be the authority at all, which makes its omission from the currency list the more surprising of the two.

**Fix:** say "five rows" and mark TypeScript's distance as two majors.

---

### F9 — MEDIUM — the `middleware.ts`-is-Edge claim is true of Next 15.5+, undated, and cites a page that no longer ships

AD-5 (`:98`) and `src/proxy.ts:5-11` both state that a `middleware.ts` entry "is compiled for the Edge runtime **unless it exports `runtime = 'nodejs'`**." I verified the spine's claim that `src/proxy.ts:5-11` "states it correctly" — it does, verbatim. ✅ And "Node-runtime middleware has been stable since Next 15.5.0" is confirmed exactly by `proxy.md:775`. ✅

The imprecision is that the claim describes the **Next 15** convention while the project runs **Next 16.2.10**, where the picture has moved:

- `middleware` is deprecated and renamed (`proxy.md:11`, `version-16.md:627`).
- **No middleware reference page ships with Next 16 at all** — `node_modules/next/dist/docs/**` contains no `middleware*` file. `authentication.md:1124` links out to the **`v15.5.6`-tagged** `middleware.mdx` on GitHub, which is direct evidence the page was removed.
- `version-16.md:629` reframes middleware's remaining purpose as the *edge* escape hatch: "The `edge` runtime is **NOT** supported in `proxy`. The `proxy` runtime is `nodejs`, and it cannot be configured. **If you want to continue using the `edge` runtime, keep using `middleware`.** We will follow up on a minor release with further `edge` runtime instructions."

So on Next 16 the accurate statement is stronger and simpler than the one in the spine: `middleware` is retained *as the Edge path*, and whether `runtime = 'nodejs'` still works inside a Next-16 `middleware.ts` is not documented anywhere in the shipped docs. The spine's parenthetical is defensible but is 15.x-era knowledge presented undated, and the rule it defends ("do not reintroduce `middleware.ts`") is *better* supported by `version-16.md:629` than by the claim actually made.

**Fix:** cite `version-16.md:629` and date the claim ("as of Next 15.5–16.x"). The conclusion does not change; the citation gets stronger and stops depending on a page that no longer ships.

---

### F10 — LOW — the `proxy.md:217-219` paraphrase is broader than the sentence cited

AD-5 paraphrases the citation as "Next's own docs advise never relying on Proxy alone for authorization." The cited lines are line-accurate — `proxy.md:219` reads "Always verify authentication and authorization inside each Server Function rather than relying on Proxy alone" — but the sentence is scoped to **Server Functions**, and its surrounding note is about matcher changes silently removing Server Function coverage. The spine uses it to justify a deviation about **nine ordinary route handlers**.

The general-purpose statement the paraphrase actually wants is one file over, at `authentication.md:1119`: "While Proxy can be useful for initial checks, it should not be your only line of defense in protecting your data. The majority of security checks should be performed as close as possible to your data source."

Worth fixing only because AD-5 already leans on the Server-Function reading correctly elsewhere ("A Server Function POST inherits its route's matcher outcome"), so the two uses of one citation are doing different work.

**Fix:** cite `authentication.md:1119` for the general claim; keep `proxy.md:217-219` for the Server Function point.

---

### F11 — LOW — "the five docs that still say Node 20" is five *sites* across four files

The enumeration at `:354` names `README.md`, `docs/QUICKSTART.md`, `docs/deploy.md`, `docs/development-guide-monolith.md`, "and `README.md`'s prerequisites" — listing README.md twice to reach five. I verified all four files exist and swept them:

| Site | Text |
| --- | --- |
| `README.md:36` | "Node.js 20 or newer…" (the prerequisites line) |
| `README.md:67` | "It runs anywhere Node 20 runs…" |
| `docs/QUICKSTART.md:7` | "Node.js 20 or newer is the only prerequisite." |
| `docs/deploy.md:9` | "Node.js 20+ (24 OK)" |
| `docs/development-guide-monolith.md:8` | "**Node.js:** Version 20.x or higher (Tested up to version 24)" |

**Substantively correct** — five sites, and the double-listing of README.md is deliberate rather than an error. Only the word "docs" is off (five sites, four files). Note also that two of the five already acknowledge Node 24, which is mild independent support for F4.

---

## 4. Verified clean — do not re-litigate

Recorded so the next pass does not redo this work:

- **Every library row mirrors `package.json` exactly.** All 12 rows verified string-by-string. The "zero drift" claim is true as stated.
- **Five rows are fully current** against npm `latest`: Tailwind 4.3.3, pptxgenjs 4.0.1, jszip 3.10.1, @base-ui/react 1.6.0, fast-xml-parser 5.10.1.
- **Every named technology exists and is real.** `@base-ui/react`, the `base-nova` shadcn style (`components.json`), `fast-xml-parser`'s role in the privacy filter (`extract-pptx-assets.mjs:39`, `evidenceFor` at `:503`) all verified.
- **Three currency details were checked to the patch and are right:** better-sqlite3 13's `engines.node >= 22`; ESLint's `maintenance` dist-tag = 9.39.5; fabric's two explicit v6 workarounds at `ArtifactEditor.tsx:160` and `:293`.
- **All four Node-row sub-claims verify** (F4 is about what the row omits, not what it asserts).
- **AD-23 is confirmed in full** — the `settings` key, the single description site, all four importers, zero local defaults, the `p14` rationale, and both citations (`prd.md:305`, `docs/architecture.md:61`) are exact. This is the standard the rest of the file should be held to.
- **AD-13's mechanism is confirmed including its negative** — `serializeCanvas` over `getObjects()` at `:257`/`:271`, and `toJSON()` appears nowhere in the editor, registry, or artifacts modules.
- **The testing convention is confirmed** — loader present, 35 suites enumerated, no second runner.
- **React2Shell (CVE-2025-55182 / CVE-2025-66478) is already patched here**: React 19.2.4 > 19.2.1 and Next 16.2.10 > 16.0.7. The F2 gap is the *July 2026* release, not this one.

**Informational (no finding raised):** `.github/workflows/test.yml` uses `actions/checkout@v4` and `actions/setup-node@v4`, both a major behind v5. The spine makes no claim about CI action versions, so this is out of scope for the gate — noted only because I was in the file verifying "CI already runs 22" (it does).

---

## 5. Sources

Local primary sources: `package.json`, `package-lock.json` (lockfileVersion 3), `node_modules/next/package.json`, `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`, `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`, `node_modules/next/dist/docs/01-app/02-guides/authentication.md`, `next.config.ts`, `components.json`, `tsconfig.json`, `Dockerfile`, `.github/workflows/test.yml`, `src/proxy.ts`, `src/lib/present-channel.ts`, `src/lib/transitions.ts`, `src/lib/settings.ts`, `src/components/admin/ArtifactEditor.tsx`, `scripts/extract-pptx-assets.mjs`, `docs/architecture.md`, `prd.md`, plus `npm view <pkg> dist-tags|engines|time` for 15 packages.

Web:

- [Node.js | endoflife.date](https://endoflife.date/nodejs)
- [nodejs/Release — Release Working Group](https://github.com/nodejs/Release)
- [Node.js Version Support: EOL Dates and Latest Releases (July 2026) — HeroDevs](https://www.herodevs.com/blog-posts/node-js-end-of-life-dates-you-should-be-aware-of)
- [Node.js 22.18.0 (LTS) release notes](https://nodejs.org/en/blog/release/v22.18.0)
- [Modules: TypeScript — Node.js Documentation](https://nodejs.org/api/typescript.html)
- [July 2026 Security Release | Next.js](https://nextjs.org/blog/july-2026-security-release)
- [Next.js: 9 Vulnerabilities Fixed in July 2026](https://teramont.net/blog/nextjs-9-vulnerabilities-july-2026-16-2-11-15-5-21)
- [Security Advisory: CVE-2025-66478 | Next.js](https://nextjs.org/blog/CVE-2025-66478)
- [TypeScript 7.0 Is GA: The 10x Compiler Migration Playbook](https://www.digitalapplied.com/blog/typescript-7-0-ga-native-compiler-migration-playbook-2026)
- [TypeScript 7 Now Stable — TechTimes](https://www.techtimes.com/articles/320049/20260710/typescript-7-now-stable-10-faster-builds-not-vue-svelte-yet.htm)
