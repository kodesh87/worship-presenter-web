---
review: version / reality-check lens
gate: bmad-architecture Reviewer Gate
target: _bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md
run: 2026-07-31 Update — AD-24 ratification
date: '2026-07-31'
verdict: RATIFY WITH FINDINGS
findings: 3 HIGH, 6 MEDIUM, 8 LOW, 0 CRITICAL
---

# Reviewer Gate — version / reality-check lens

**Mandate.** Verify every committed decision was web-researched or reality-checked rather than
asserted from training data: current library/framework versions, that each named technology still
exists and fits, and that every code citation resolves. Flag anything that could be out of date and
was not confirmed against the web, the existing project, or the current release.

**Verdict: RATIFY WITH FINDINGS.** Every one of today's nine AD-24 code-fact claims verified
against the repository, several of them to the exact integer and line number — this is the most
reality-checked change set this gate has seen on this file. The findings are almost entirely in the
**inherited** prose: one refutable justification the spine itself would reject under its own AD-5
precedent, one stale contradiction in a declared source that has since been repaired, one web claim
that is simply not what Next.js says, and five prose citations that point at the wrong line.

Nothing found here blocks the AD-24 ratification. HIGH-1 should be corrected before Story 17.7 is
implemented, because it constrains that story's mechanism set incorrectly.

---

## Part 1 — Today's AD-24 code-fact claims, verified directly against the repository

All nine were checked against `src/`, `tests/` and a re-execution of the walk the test performs.
**Nine of nine confirmed.** Two carry a precision note, recorded as LOW findings in Part 4.

| # | Claim | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | `src/lib/projected-shell.ts` exports `claimProjectedShell`, reference-counted; only the first claim snapshots, only the last release restores | **CONFIRMED** | `src/lib/projected-shell.ts:74` exports it; `:66` `let claims = 0`; `:75` `if (claims === 0)` guards the snapshot; `:95` `if (claims === 0 && restore)` guards the restore. The `released` latch at `:90-93` makes a double release idempotent |
| 2 | `src/lib/use-projected-shell.ts` is a thin React binding over it — the spine says "nineteen-line" | **CONFIRMED, exact** | `wc -l` = **19**. Body is one `useEffect(() => claimProjectedShell(document), [])` at `src/lib/use-projected-shell.ts:18` |
| 3 | `grep -c componentImports tests/theme-chrome.test.mjs` is 0, and the walk function is `moduleImports` at line 384 | **CONFIRMED, exact** | `grep -c componentImports` → **0**. `tests/theme-chrome.test.mjs:384` is literally `function moduleImports(file) {`. This closes the round-3 blocking item recorded at `sprint-status.yaml:148`, which named `ARCHITECTURE-SPINE.md:392` as still citing the removed function |
| 4a | The closure walk enqueues `.tsx` only, around line 432 | **CONFIRMED, exact** | `tests/theme-chrome.test.mjs:432` is `if (resolved.endsWith('.tsx') && !seen.has(resolved)) {` |
| 4b | So a `.ts` module's own imports are never reached, leaving **fourteen** modules reachable from the projected tree unwalked, `projected-shell.ts` among them | **CONFIRMED, exact — 14** | Re-implemented `moduleImports` verbatim and ran the closure both ways from the six `PROJECTED` roots. As shipped: 16 modules reached. With `.ts` also enqueued: 30. Difference = **14**, and `src/lib/projected-shell.ts` is in it. Full set: `artifacts/hydrate.ts`, `artifacts/registry-snapshot.ts`, `auth/password.ts`, `hymn-sections.ts`, `images.ts`, `lyrics.ts`, `parser.ts`, `projected-shell.ts`, `registry/asset-safety.ts`, `registry/seed.ts`, `registry/store.ts`, `registry/types.ts`, `registry/validate.ts`, `uploads.ts`. Twelve `.ts` modules are scanned-then-read-as-leaf, which is the boundary that produces the fourteen |
| 5 | `moduleImports` misses `export … from`, and that spelling is live at `src/lib/parsed-fields.ts:432` | **CONFIRMED, exact** | `src/lib/parsed-fields.ts:432` is `export { songNumbersFromParsed } from './worship-form-fields';` — the **only** `export … from` in `src/`. Executed `moduleImports('src/lib/parsed-fields.ts')`: returns `["./parser","./hymn-sections"]` only. `'./worship-form-fields'` is **not** returned. The regex at `:386` requires a literal `import` token and is lazily bounded to the nearest `from`, so it cannot reach an `export … from` |
| 6 | `SlideView` and `ArtifactSlide` take no `className` at all | **CONFIRMED** | `src/components/SlideView.tsx:18` — `export default function SlideView({ slide }: { slide: SlidePlanItem })`. `src/components/artifacts/ArtifactSlide.tsx:229-233` — `export default function ArtifactSlide({ instance }: { instance: ArtifactInstance })`. Neither accepts one; both legitimately set `className` on their own elements. Pinned by the `exportedProps` assertion at `tests/theme-chrome.test.mjs:486-500` |
| 7 | `src/lib/projected-shell.ts` lines 34-36 claim "a Server-Component layout can reach it without a hook" — and the spine now calls that claim FALSE | **SPINE'S VERDICT CONFIRMED CORRECT** | See Part 2 for the full RSC analysis. A Server Component cannot execute a browser DOM mutation. Next's own glossary, in-repo: "Server Components render on the server… **They cannot use state or browser APIs**" (`node_modules/next/dist/docs/01-app/04-glossary.md:222`). The sentence is false as written and the spine is right to say so. Line-span precision noted as LOW-4 |
| 8 | `tests/theme-chrome.test.mjs` currently has 43 tests and passes | **CONFIRMED, exact** | Ran `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/theme-chrome.test.mjs` → `1..43 / # tests 43 / # pass 43 / # fail 0 / # cancelled 0 / # skipped 0 / # todo 0 / # duration_ms 208.86` |
| 9 | The spine's `PROJECTED` and `FULL_SCREEN` set descriptions match the real sets | **CONFIRMED** | `PROJECTED` (`tests/theme-chrome.test.mjs:260-271`) = the 6 files the spine implies: `SlideView.tsx`, `artifacts/ArtifactSlide.tsx`, `ProjectorClient.tsx`, `SlideshowClient.tsx`, `projector/page.tsx`, `slideshow/page.tsx`. It drives the edge guard (`:326`), the token guard (`:341`) and the closure walk (`:418`) — exactly the spine's "token, edge and closure guards". `FULL_SCREEN` (`:506-509`) = the two Clients only, matching "`FULL_SCREEN` lists only the two Clients so nothing catches it". Minor incompleteness at LOW-3 |

### Supporting AD-24 claims also checked and confirmed

| Claim | Verdict | Evidence |
| --- | --- | --- |
| `src/app/layout.tsx` stays a Server Component and reaches the client through one child | **CONFIRMED** | No `'use client'` in `src/app/layout.tsx`; the only client reach is `<ThemeProvider>` wrapping `{children}` in `<body>`. `src/components/ThemeProvider.tsx:1` carries the `'use client'` |
| `<html>`'s `suppressHydrationWarning` is part of that boundary | **CONFIRMED** | `src/app/layout.tsx` sets it on `<html>` with an inline comment giving next-themes' pre-hydration class write as the reason |
| `globals.css:5`'s `@custom-variant dark (&:is(.dark *))` | **CONFIRMED, exact** | `src/app/globals.css:5` is exactly that line |
| `globals.css:3` does `@import "shadcn/tailwind.css"`, making `shadcn` a runtime dependency | **CONFIRMED** | `src/app/globals.css:3` is exactly that. The specifier resolves through `node_modules/shadcn/package.json` `exports["./tailwind.css"] → ./dist/tailwind.css`, which exists. It is **not** a plain file at `node_modules/shadcn/tailwind.css` — the export map is doing the work, which is worth knowing before anyone "fixes" the path |
| Story 17.7 is registered in `epics.md` and `sprint-status.yaml` (ratification paragraph) | **CONFIRMED** | `epics.md:319` — "Story 17.7: The Room-Facing Shell Belongs to the Route, Not to the App *(backlog)*"; `sprint-status.yaml:173` — `17-7-projected-shell-route-group: backlog`. `epics.md:335` independently states "This story is what takes AD-24 from `[ADOPTED, partial]` to `[ADOPTED]`" |
| The four holes are the four round 2 found | **CONFIRMED** | `sprint-status.yaml:148` enumerates them identically: first paint on every projected load, the two Server-Component error branches, `notFound()` at six reachable sites with no `not-found.tsx`, and `PROJECTED` never closed upward |
| The route-group layout is the owner's 2026-07-31 choice | **CONFIRMED** | `sprint-status.yaml:148` — "they close with ONE route-group layout owning every room-facing URL, which is the scope of new Story 17.7" |
| No `not-found.tsx`, `error.tsx` or `global-error.tsx` anywhere under `src/` | **CONFIRMED** | `find src -name "not-found.tsx" -o -name "error.tsx" -o -name "global-error.tsx"` → empty |
| `settings` writes are all `requireAdminSession` at `src/app/api/admin/settings/route.ts:17,29` | **CONFIRMED, exact** | Line 17 (GET) and line 29 (PUT) are both `const session = await requireAdminSession(request);` |
| `<Toaster />` mounted nowhere, `toast(` called nowhere in `src/` | **CONFIRMED** | The only hits are the definition and re-export in `src/components/ui/sonner.tsx`. Independently corroborated at `epics.md:313` |
| `skipTitle` ships at five sites: `slide-plan.ts:140`, `:148`, `:438`, `:460`, `:550` | **CONFIRMED, all five exact** | `grep -n skipTitle src/lib/slide-plan.ts` returns exactly those five lines |
| `slide-plan.ts:464-466` renders unbounded middle Divine Service songs | **CONFIRMED** | `:464-466` is the `dsMiddle.forEach((hymn, idx) => { pushSongGroup(...) })` loop |
| `worship-form-fields.ts:6-9`, `parsed-fields.ts:418-421`, `types.ts:83`, `validate.ts:449-450`, `store.ts:74-92`, `store.ts:35-38`, `registry-snapshot.ts:41-64`, `registry-snapshot.ts:85-90`, `seed.ts:39`, `registry/store.ts:226`, `ArtifactEditor.tsx:104`, `deferred-work.md:116`, `docs/deploy.md:79`, `epics.md:52`, `epics.md:56`, `src/proxy.ts:5-11` | **ALL CONFIRMED** | Every one resolves to content that supports the claim made of it. Machine-checked: 0 line citations out of range across the whole file |

---

## Part 2 — The RSC semantics question, and where the spine over-corrected

**The question put to this lens:** can a Server Component execute a browser DOM mutation? **No.**
The spine's verdict on `src/lib/projected-shell.ts:34-36` is correct, and the correction it makes
to its own earlier reasoning is also correct — "a React hook cannot run in a Server Component" was
indeed the wrong reason, because `claimProjectedShell` is React-free. The right reason is the one
the spine now gives: a Server Component never executes in the browser and has no `document`.

Confirmed in-repo against Next 16 docs:

- `node_modules/next/dist/docs/01-app/04-glossary.md:222` — "Server Components render on the
  server, can fetch data directly, and don't add to the client JavaScript bundle. **They cannot use
  state or browser APIs.**"
- `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md:6` — `'use client'`
  is what declares an entry point for code needing "access to browser APIs".

So AD-24's diagnosis holds and the module header sentence is false. **But the spine's corollary
overshoots**, and that is HIGH-1 below.

---

## Part 3 — HIGH findings

### HIGH-1 — AD-24's mechanism constraint is refutable, and Next ships the refutation in this repo

**Where:** `ARCHITECTURE-SPINE.md:216` — "**no browser-side mechanism closes this gap — hook,
direct DOM call, or `useLayoutEffect` alike**" and "the closing candidates below are CSS or a
server-emitted class". Restated at `:218` — "the closure has to be CSS or a server-emitted class" —
and at `:393` — "a route-group layout is itself a Server Component, so it closes first paint only by
emitting CSS or a class".

**The refutation.** Next.js documents a third mechanism for precisely this problem class, and the
guide is sitting in `node_modules` in this repository:

> `node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md:15` — "Using an
> **inline script** that runs synchronously as the browser parses the HTML, you can update the DOM
> **before the first paint**."

The guide's own framing at `:9-11` enumerates and rejects exactly the three approaches the spine
considered — a Client Component that re-renders (hydration error), deferring to `useEffect` (visible
flash), server-only rendering (gives up client state) — and then prescribes the inline `<script>`
via `dangerouslySetInnerHTML`, placed after the element, with `suppressHydrationWarning` on it. Its
listed topics are "dates, themes, and persisted UI state" — this project's exact case.

Three consequences the spine has not accounted for:

1. **An inline script is browser-side, and it is neither CSS nor a class.** It runs during HTML
   parsing, before first paint, which is the one property the spine says nothing browser-side has.
   The sentence "no browser-side mechanism closes this gap" is therefore false as written.
2. **A Server Component can emit one.** A route-group layout — the owner's chosen mount — can render
   the `<script>` directly. So "a route-group layout is itself a Server Component, so it closes
   first paint only by emitting CSS or a class" is too narrow by exactly one mechanism, and the one
   it omits is the framework's documented answer.
3. **This is how `next-themes` already works** — the package AD-24 rests on for two contracts. Its
   no-flash behaviour is an injected pre-hydration script, which is why `<html>` needs
   `suppressHydrationWarning` at all (`src/app/layout.tsx`). AD-24 cites that attribute as "part of
   this boundary rather than incidental markup" without noticing that the mechanism producing it is
   the mechanism the gap needs.

**Why this is HIGH and not MEDIUM.** The spine names this failure mode as a precedent in its own
text, twice: "a rule defended by a refutable reason is a rule that gets reverted (the AD-5
precedent)" at `:216`, and the round-3 pattern at `:392` — "a finding that a rule was applied too
narrowly has been closed by widening the list rather than by encoding the rule". The corollary here
is the same defect one level in: the spine correctly refuted the *hook* reason and then substituted a
second refutable reason in its place. And it is load-bearing rather than academic — `:218` carries an
explicit "Note for whoever implements it", so Story 17.7's implementer is handed a mechanism set that
excludes the answer Next.js prescribes.

**Aggravating:** `AGENTS.md` mandates "Read the relevant guide in `node_modules/next/dist/docs/`
before writing any code" and the spine cites that directory elsewhere (`proxy.md`,
`authentication.md`). This guide was not consulted. Nothing in the spine cites it.

**Recommendation.** Do not narrow AD-24 and do not change the owner's chosen mount — the route-group
layout is still the right call for the reason given (it catches a future shell nobody remembers to
annotate). Correct the *mechanism* sentences to a three-way set — CSS, a server-emitted class, or a
pre-paint inline script — cite
`node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md`, and drop the
absolute "no browser-side mechanism". Note in passing that the inline-script route is the only
candidate that could genuinely let a Server-Component layout reach `claimProjectedShell`'s logic,
which means `projected-shell.ts:34-36` is better rewritten than deleted.

### HIGH-2 — "Next has stated that earlier minors are not back-patched" is not what Next says

**Where:** `ARCHITECTURE-SPINE.md:383`.

**Verdict: REFUTED on the web.** Web-verified 2026-07-31 against
<https://nextjs.org/blog/july-2026-security-release>, <https://nextjs.org/blog/next-security-release-program>
and <https://nextjs.org/support-policy>:

- No such statement exists in any of the three.
- The support policy says close to the opposite: "In rare circumstances, depending on the severity
  of the underlying bug, we will patch versions of Next.js that are outside of our LTS policy."
- The July 2026 release itself contradicts the claim in practice: **two** lines were patched the same
  day — 16.2.11 (Active LTS) **and** 15.5.21 (Maintenance LTS).

What *is* true, and is what the sentence should say: fixes land on the **tip of each supported
line**, not on older minors within a line. That still supports the spine's operative conclusion —
`16.2.10` will not receive the patch, you must move to the tip — so the **action is right and the
justification is wrong**. Same defect class as HIGH-1.

**Everything else in that bullet verified exactly**, which makes the one wrong clause stand out:

| Claim at `:383` | Verdict | Source |
| --- | --- | --- |
| 16.2.11 shipped 2026-07-21 | **CONFIRMED** | npm publish `2026-07-21T16:00:01Z`; GitHub release `v16.2.11` `2026-07-21T16:58:28Z` |
| Nine CVEs, four High | **CONFIRMED, exact** | CVE-2026-64641…64649 = 9. High: 64641, 64642, 64645, 64649. Medium: the other five |
| CVE-2026-64645 — SSRF via request-controlled rewrite/redirect destination, CVSS 8.3 | **CONFIRMED** | MITRE: "SSRF in rewrites via attacker-controlled destination hostname", CVSS **v4.0** 8.3 HIGH |
| CVE-2026-64642 — middleware bypass, CVSS 8.3, precondition Turbopack + single-locale i18n | **CONFIRMED, verbatim** | MITRE: App Router "built with Turbopack and a single entry in `config.i18n.locales`". The spine's hedge — "it appears not to apply, and 'appears' is doing real work" — is the correct posture |
| "16.2.12 was current when this was written" | **CONFIRMED, still current** | `dist-tags.latest` = **16.2.12**, published 2026-07-25. No 16.2.13. Its notes are backport/docs plus TypeScript 7 support — **not** a security release, so 16.2.11 remains the security floor and 16.2.12 the tip |
| "React 19.2.4 → 19.2.8 rides along" | **CONFIRMED** | `react`/`react-dom` `latest` = 19.2.8 |

**Also newly verified and worth adding:** `next@16.2.12` still declares
`engines.node: ">=20.9.0"` — the framework itself continues to permit an EOL runtime, so the Stack
row's Node floor is doing work the framework does not.

**Live exposure note.** The repository is still pinned at `next@16.2.10` / `eslint-config-next@16.2.10`
(`package.json:27,44`, confirmed resolved in `package-lock.json`). Ten days after a release patching
four High CVEs — one of them the SSRF class AD-8 exists to contain — the bump has not landed. The
spine records this correctly and calls it "not a deferred nicety"; the finding is that it remains
unactioned, not that the spine is wrong.

### HIGH-3 — AD-23 asserts a live contradiction in a declared source that has already been repaired

**Where:** `ARCHITECTURE-SPINE.md:205` — "`docs/architecture.md:61` — a declared source of this
spine — already contradicts it by hardcoding a crossfade."

**Verdict: FALSE as of today.** `docs/architecture.md:61` currently reads:

> "…updates its view using the **configured** transition style — whatever `settings.slide_transition`
> currently holds, resolved through the single table in `src/lib/transitions.ts` (AD-23). **It is not
> fixed to a crossfade**; `fade` is only the default an operator gets when nothing has been
> configured, and the presenter may override the style for the live session."

The document was brought into agreement with AD-23 — it now cites AD-23 by name. Grepping the whole
file for `crossfade`/`fade` returns only that line. So the spine records as a live defect something
that has been closed, and AD-23's stated reason for existing ("it is recorded here because … already
contradicts it") no longer holds on its second leg. The first leg — FR-7 makes it a requirement — is
intact and is enough to justify the AD.

This is the drift class `AGENTS.md` names: a spine claim about a companion document that the
companion has moved past. Left alone, the next reader either edits `docs/architecture.md` to
introduce a contradiction that is not there, or concludes the spine is stale in ways they cannot
bound.

---

## Part 4 — MEDIUM findings

### MEDIUM-1 — Five prose citations resolve to the wrong line

Machine-checked every `path:line` in the file: **0 out of range**, so nothing dangles. Five point at
content that does not support the claim. All are inherited, none is in today's AD-24 text.

| Spine | Claim | Cited | Actually at | Content at the cited line |
| --- | --- | --- | --- | --- |
| `:93` (AD-4) | "As of 2026-07-30 no deployment exists" | `prd.md:540` | **`prd.md:552`** | `:540` is "**Roles** = Admin + Operator only…". `:552` is the real statement — "(**target, not yet deployed** — corrected 2026-07-29 by the owner; the deployment tooling exists and is configured, nothing is running)". The spine's date and substance are right; only the line is wrong. This matters more than a typo because AD-4 flags the date as load-bearing for AD-18's total-replacement licence and AD-21's released-version freeze |
| `:205` (AD-23) | "FR-7 makes it a requirement" | `prd.md:305` | **`prd.md:179`** (definition), `:304` (cross-surface clause) | `:305` is about slideshow connectivity. `:304` — one line up — is "The browser transition matches the Deck's configured transition style (FR-7); the two are chosen once and never diverge", which is the better citation for AD-23 specifically |
| `:387` | "`prd.md:550` binds NFR-3 on FR-20 registry edits too" | `prd.md:550` | **`prd.md:563`** | `:550` is the Privacy/PII paragraph. `:563` is NFR-3 with the parenthetical "*(Binding on FR-20 and FR-21 registry edits too…)*" — an exact match for the claim |
| `:42` | "That repair is owned by `bmad-ux` and is tracked at `epics.md:374`" | `epics.md:374` | **`epics.md:403`** | `:374` is a **blank line**; `:368-380` is `skipTitle`/Epic 20 material. `:403` is the tracking — "`EXPERIENCE.md` → *Venue & Projection Constraints* states the global-and-immediate rule… **Still outstanding** — this is what remains of Story 20.8's block" |
| `:98`, `:364` (AD-5) | See MEDIUM-2 | `proxy.md:217-219` | scope mismatch | — |

The `epics.md:374` case is the one to fix first: a blank line is the only citation in this file that
gives a reader nothing at all to correct from, and the paragraph containing it is the AD-map warning
that already exists because citations went stale.

### MEDIUM-2 — `proxy.md:217-219` is cited for two claims and supports only one

**Where:** `ARCHITECTURE-SPINE.md:98` (AD-5) and `:364` (Deferred) — "Next's docs advise never
relying on Proxy alone for authorization (`proxy.md:217-219`)" / "`proxy.md:217-219` says never to
rely on Proxy alone for authorization".

**What those lines actually say** (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md:217-219`):

> "Server Functions … are handled as POST requests to the route where they are used, so a Proxy
> matcher that excludes a path will also skip Server Function calls on that path. … Always verify
> authentication and authorization **inside each Server Function** rather than relying on Proxy
> alone. See the Data Security guide…"

The guidance is scoped to **Server Functions**, not to routes generally. It fully supports AD-5's
other claim from the same citation — "A Server Function POST inherits its route's matcher outcome" —
which is verbatim correct. It does **not** support the general proposition that Next advises never
relying on Proxy alone for *route* authorization, and that general reading is what the standing
deviation at `:364` rests on for its nine non-admin routes, **none of which is a Server Function**.

The generic guidance the spine wants exists — the doc points to the Data Security guide, and
`node_modules/next/dist/docs/01-app/02-guides/data-security.md` is in-repo — but the spine never
cites it. Two fixes, both small: cite the Data Security guide for the general claim, and keep
`proxy.md:217-219` for the Server Function clause it actually carries. Recording it precisely also
sharpens the deviation: the *documented* hazard is narrower than the spine states, which is worth
knowing before Epic 18 sizes the work.

### MEDIUM-3 — The proposed `engines` value is one patch below what this stack already requires

**Where:** `ARCHITECTURE-SPINE.md:381` — "Adding `"engines": {"node": ">=22.12.0"}`", and the Stack
row at `:238` — "22.x (`>=22.12`)".

Confirmed no `engines` field exists (`package.json` has none) and that Docker and CI both run 22
(`Dockerfile:1` `FROM node:22-bookworm-slim`; `.github/workflows/test.yml:19` `node-version: '22'`),
so the Stack row's "what Dockerfile and CI already run" is accurate.

**But `>=22.12.0` will not satisfy the ESLint major the same Deferred list says to move to.**
Web-verified: `eslint@10.8.0` declares `engines.node: "^20.19.0 || ^22.13.0 || >=24"`. A declared
floor of `22.12.0` is **one patch below** `22.13.0` and would make the two Deferred items — add
`engines`, move ESLint off the maintenance tag — silently incompatible. Node 22's latest is
**22.23.2** (2026-07-28), so nothing about the runtime forces the low number; it appears to be
`>=22.12` carried over from an inferred Next-era floor.

Recommend `>=22.13.0` at minimum. Better: state 24 (Active LTS, latest **24.18.1**), which satisfies
every constraint in the tree and pre-empts the "Node row will need this again" item at `:384` —
Node 22 entered Maintenance on 2025-10-21 and ends 2027-04-30.

### MEDIUM-4 — "Four Stack rows sit a major behind" — all four confirmed, one qualifier is now wrong

**Where:** `ARCHITECTURE-SPINE.md:382`.

All four claims **CONFIRMED on the web**, with more precision than the spine states:

| Row | Pinned / resolved | Current stable | Verdict |
| --- | --- | --- | --- |
| TypeScript `^5` | `5.9.3` | **7.0.2** (2026-07-08) | CONFIRMED — two majors behind, and `^5` can never resolve 6 or 7, exactly as stated. Sharp edge: 7.0.0 and 7.0.1 stable were **never published**; the line went `7.0.1-rc` → `7.0.2`. Last 6.x stable was 6.0.3 |
| better-sqlite3 `^12.11.1` | `12.11.1` | **13.0.2** (2026-07-29) | CONFIRMED, including the `engines` claim — 13.x declares `{"node": ">=22"}` against 12.x's `{"node": "20.x \|\| 22.x \|\| …"}`. Note 13.0.0 landed 2026-07-21; this is an **eight-day-old major** |
| fabric `^6.6.1` | `6.6.1` | **7.4.0** (2026-05-18) | CONFIRMED, and 7.x is genuinely stable, not pre-release: 7.0.0 shipped 2025-12-22. Trap for whoever checks: `fabric@beta` points at `7.0.0-rc1`, which is **older** than `latest` |
| ESLint `^9` | `9.39.5` | **10.8.0** (2026-07-24) | CONFIRMED, and stronger than stated — `9.39.5` is not merely maintenance-*ish*, it sits on a dist-tag literally named `maintenance` |

**The wrong qualifier:** "better-sqlite3 12 (13 current, and it requires `node >=22`, **so it is
gated behind the Node floor above**)". Nothing gates it. Docker and CI already run Node 22, so
`better-sqlite3@13`'s `>=22` is satisfied today; only the *absent* `engines` declaration is
outstanding, and an absent declaration blocks no install. As written a reader concludes the bump is
sequenced behind a runtime change it is not. The real reasons to wait are that it is eight days old
and that better-sqlite3 is a native module in the AD-4 storage path.

### MEDIUM-5 — Currency-vs-upstream is audited for the twelve rows in the table and for nothing else

**Where:** `ARCHITECTURE-SPINE.md:254` — "`package.json` pins every library row and this table
mirrors it — last mirrored 2026-07-30, zero drift", with the honest caveat that "drift-vs-`package.json`
says nothing about currency-vs-upstream".

**Mirror direction verified: zero drift, confirmed.** Every Stack row matches `package.json`
exactly, and every one matches its `package-lock.json` resolution: next 16.2.10, react/react-dom
19.2.4, next-themes 0.4.6, better-sqlite3 12.11.1, typescript 5.9.3, tailwindcss 4.3.3, fabric
6.6.1, @base-ui/react 1.6.0, pptxgenjs 4.0.1, jszip 3.10.1, eslint 9.39.5, eslint-config-next
16.2.10, shadcn 4.13.0, fast-xml-parser 5.10.1.

**The gap the caveat does not name:** the mirror runs table → `package.json` only, so eight
`package.json` dependencies have **no Stack row at all** and therefore cannot appear in any currency
statement made about the table. Checked all eight on the web:

| Unlisted dependency | Pinned / resolved | Current | Note |
| --- | --- | --- | --- |
| `lucide-react` | `^1.25.0` / 1.25.0 | 1.28.0 (2026-07-30) | minor behind; `^1` moves on install |
| `shadcn` (has a row) | `^4.13.0` / 4.13.0 | 4.16.0 (2026-07-27) | minor behind |
| `sonner` | `^2.0.7` / 2.0.7 | 2.0.7 | at head; subject of the `:391` Story 17.6 decision |
| `class-variance-authority` | `^0.7.1` / 0.7.1 | 0.7.1 | at head (~20 months quiet) |
| `clsx` | `^2.1.1` / 2.1.1 | 2.1.1 | at head (~27 months quiet) |
| `tailwind-merge` | `^3.6.0` / 3.6.0 | 3.6.0 | at head |
| `tw-animate-css` | `^1.4.0` / 1.4.0 | 1.4.0 | at head |
| `@tailwindcss/postcss` | `^4` / 4.3.3 | 4.3.3 | at head |
| `@types/react` | `^19` / 19.2.17 | — | fine |
| `@types/node` | `^20` / **20.19.43** | **26.1.2** | **six majors behind** — see below |

Nothing here is a defect: the unlisted set is at or near head across the board, which is itself worth
recording so a future auditor does not re-derive it. The exception is `@types/node`, which the spine
**does** name at `:381` and gets exactly right — "pinned `^20` and resolves `20.19.43`", confirmed
to the patch, and correctly identified as "the one Node-20 commitment that is machine-enforced
rather than prose". Its `latest` is 26.1.2; the 22.x tail is 22.20.1 and the 24.x tail is 24.13.3, so
whichever runtime the `engines` change picks, there is a matching types line to move to. Worth noting
in the same change set: `@types/node` publishes no major-line dist-tags, only `tsX.Y` compat tags,
so the bump has to name a range explicitly.

### MEDIUM-6 — CVSS scores are v4.0 and the spine does not say so

**Where:** `ARCHITECTURE-SPINE.md:383` — "CVE-2026-64645, CVSS 8.3" and "CVE-2026-64642, CVSS 8.3".

Both numbers are correct, and both are **CVSS v4.0**, not v3.1 — verified against the MITRE CVE
records. v4.0's vector and severity bands differ enough from v3.1 that an unlabelled 8.3 invites the
wrong comparison against any v3.1 score elsewhere in the artifact set. Add "v4.0".

Two related date facts worth carrying, both verified: the release blog's own `publishedAt` metadata
reads **July 20th 2026** while the npm and GitHub artifacts are **2026-07-21** — the security-release
program post carries the reconciliation ("originally targeted for July 20 … now expected on July 21,
2026"), so the spine's 2026-07-21 is the right date to have used. And all nine CVE records were
published to MITRE on **2026-07-27**, six days after the release, so a future citation must not
attribute a 2026-07-21 date to the CVE records themselves.

---

## Part 5 — LOW findings

- **LOW-1 — "six reachable sites" is right only under one reading.** `:218` and `:393` say
  `notFound()` sits "at six reachable sites". Repo-wide the count is **eleven**, across four files
  (`services/[id]/page.tsx:40,58`; `present/page.tsx:47,59,65`; `projector/page.tsx:37,49,55`;
  `slideshow/page.tsx:38,50,56`). Six is exactly the count on the **two room-facing routes**
  (3 + 3), which is plainly the intended scope. Add the qualifier — "six on the two projected
  routes" — or the next reader either miscounts or concludes the number is stale.
- **LOW-2 — `FULL_SCREEN` has two jobs, and the spine names one.** `:215` describes it as
  "`FULL_SCREEN` for the shell reset". It also drives the `text-white`-on-root assertion at
  `tests/theme-chrome.test.mjs:527-545`, which closes `body { @apply text-foreground }`. Since the
  spine's own rule is that a new room-facing surface "joins whichever of them applies in the same
  change set", a surface added to `FULL_SCREEN` inherits both obligations, and only one is named.
- **LOW-3 — the false sentence is at `:35-36`, not `:34-36`.** `projected-shell.ts:34` begins
  "React: it is a DOM mutation with a lifetime…", which is true; the false clause — "and a
  Server-Component layout can reach it without a hook" — spans `:35-36`. The span cited contains it,
  so nothing dangles; the narrower citation is what a correcting implementer wants.
- **LOW-4 — the Structural Seed omits the module AD-24 makes load-bearing.** The file tree at
  `:310` names only `use-projected-shell.ts` — "the ONE app-shell reset every full-screen
  room-facing surface calls (AD-24)". Since `:215` now designates `projected-shell.ts` as the DOM
  half and locates the reference-counting invariant there, the tree points at the 19-line binding and
  not at the file holding the invariant. One line to fix, in a section whose whole purpose is
  orientation.
- **LOW-5 — production hostname disagrees with the PRD.** AD-4 (`:93`) names
  `presenter.example.org`, and all of `docs/` agrees (`docs/cloudflare-tunnel.md:30,50,55,60`;
  `docs/deployment-guide.md:36,54,57,63,83-91`). `prd.md:552` — the paragraph AD-4 is citing —
  says `presenter.example.church`. The spine is on the majority side; the PRD is the outlier. Not
  the spine's to fix, but AD-4 cites that exact paragraph, so whoever repairs MEDIUM-1's line number
  will be looking straight at it.
- **LOW-6 — Node ecosystem facts all confirmed, with one addition.** Node 20 EOL **2026-04-30**
  CONFIRMED (codename Iron, ended at 20.20.2). Node 22 **Maintenance** since 2025-10-21, ends
  2027-04-30 CONFIRMED. Node 24 **Active** LTS since 2025-10-28, maintenance not until 2026-10-20
  CONFIRMED. Next 16 requiring `>=20.9.0` CONFIRMED, and unchanged in 16.2.12. Addition for `:384`:
  **Node 26 is already Current and becomes LTS on 2026-10-28** — the same week Node 24 enters
  maintenance, so the revisit the spine schedules has a date, not just a direction.
- **LOW-7 — the `next-themes` row is the most thoroughly reality-checked line in the file, and every
  claim holds.** `0.4.6` is `latest` CONFIRMED; published **2025-03-11** CONFIRMED (npm
  `2025-03-11T21:02:05Z`, GitHub release `21:03:39Z`); last push **2026-02-25** CONFIRMED
  (`pushed_at: 2026-02-25T05:25:42Z`); not archived, not deprecated CONFIRMED (`archived: false`,
  no `deprecated` field, 66 open issues). The spine's "~16 months without a release … the repository
  is not dormant … *unreleased activity* is the accurate reading" is exactly right. One trap for the
  next auditor: GitHub's `updated_at` on that repo is `2026-07-30`, five months after `pushed_at` —
  it is a metadata touch, not activity, and reading it as a commit date would make the row look
  fresher than it is. Worth one clause in the entry.
- **LOW-8 — package identity confirmed current.** `@base-ui/react` is the correct present-day
  name and `^1.6.0` is **at head** (1.6.0, 2026-06-18). The predecessor
  `@base-ui-components/react` is **deprecated** ("Package was renamed to @base-ui/react") and
  stalled at `1.0.0-rc.0`. Nothing in the spine cites the old name — this row is clean, recorded so
  the check is not repeated. `pptxgenjs` 4.0.1, `jszip` 3.10.1, `fast-xml-parser` 5.10.1 and
  `tailwindcss` 4.3.3 are all `latest`; none carries a deprecation.

---

## Part 6 — Stack table, row by row: web-confirmed or not

Every row states explicitly whether it was confirmed on the web today (2026-07-31).

| Stack row | Pinned | Resolved | Current upstream | Web-confirmed? |
| --- | --- | --- | --- | --- |
| Node.js 22.x (`>=22.12`) | *no `engines`* | Docker/CI 22 | 22.23.2 (Maint.) / 24.18.1 (Active) / 26.5.1 (Current) | **YES** — `nodejs/Release/schedule.json` + `nodejs.org/dist/index.json`. See MEDIUM-3 |
| Next.js 16.2.10 | exact | 16.2.10 | **16.2.12** (tip); 16.2.11 = security floor | **YES** — `registry.npmjs.org/next`; nextjs.org blog. See HIGH-2 |
| React / React DOM 19.2.4 | exact | 19.2.4 | **19.2.8** | **YES** — npm registry |
| TypeScript `^5` | `^5` | 5.9.3 | **7.0.2** | **YES** — npm dist-tags. Two majors |
| Tailwind CSS `^4` | `^4` | 4.3.3 | 4.3.3 | **YES** — at head |
| better-sqlite3 `^12.11.1` | `^12.11.1` | 12.11.1 | **13.0.2**, `engines >=22` | **YES** — npm `engines` inspected. See MEDIUM-4 |
| pptxgenjs `^4.0.1` | `^4.0.1` | 4.0.1 | 4.0.1 | **YES** — at head (~13 months quiet) |
| jszip `^3.10.1` | `^3.10.1` | 3.10.1 | 3.10.1 | **YES** — at head (~4 years quiet, not deprecated) |
| fabric `^6.6.1` | `^6.6.1` | 6.6.1 | **7.4.0** stable | **YES** — 7.x stable since 2025-12-22 |
| @base-ui/react `^1.6.0` | `^1.6.0` | 1.6.0 | 1.6.0 | **YES** — at head; old name deprecated |
| shadcn `^4.13.0` | `^4.13.0` | 4.13.0 | 4.16.0 | **YES** — minor behind. Runtime-dependency claim verified in-repo via the export map |
| next-themes `^0.4.6` | `^0.4.6` | 0.4.6 | 0.4.6 | **YES** — every claim in the row and in `:385` confirmed. See LOW-7 |
| ESLint `^9` / eslint-config-next 16.2.10 | `^9` / exact | 9.39.5 / 16.2.10 | **10.8.0** / 16.2.12 | **YES** — `maintenance` dist-tag confirmed literally |
| fast-xml-parser `^5.10.1` | `^5.10.1` | 5.10.1 | 5.10.1 | **YES** — at head |
| Test runner `node:test` + `--experimental-strip-types` | — | — | — | **N/A** — in-repo, verified by running the suite (43/43) |

**Rows that could not be verified on the web: none.** Every version claim in the Stack table and in
the `:381-385` Deferred entries was checked against a live fetch of `registry.npmjs.org`,
`nodejs.org`, `api.github.com` or `cveawg.mitre.org` today.

---

## Part 7 — Summary

**RATIFY WITH FINDINGS.** AD-24's ratification stands. The nine code-fact claims put to this lens
are nine for nine, several exact to the integer — the fourteen unwalked modules, the 43 tests, the
nineteen lines, `moduleImports` at 384, the `.tsx` enqueue at 432, the `export … from` at
`parsed-fields.ts:432`. That is reality-checking, not assertion, and it is a marked improvement over
the state the round-3 review found.

The findings cluster in one place worth naming. Three times in this file a *correct conclusion* is
carried by a *reason nobody checked*: HIGH-1 (a browser-side pre-paint mechanism exists, and Next
documents it in this repo), HIGH-2 (Next never said earlier minors are not back-patched), MEDIUM-2
(`proxy.md` scopes its warning to Server Functions). The spine already diagnoses this pattern twice
in its own prose and elevates it to invariant-level concern at `:392` — "a finding that a rule was
applied too narrowly gets closed by widening the list rather than encoding the rule." The
version-and-reality lens finds the same shape in the *justifications*: the list of mechanisms, the
list of what upstream said, the scope of a cited guide. Worth carrying up: **when a rule's reason is
about the outside world, cite the outside world.** Two of the three fixes are a one-line citation to
a file already sitting in `node_modules`.

Priority order:

1. **HIGH-1** — before Story 17.7 is implemented. It is the only finding that changes what someone
   builds.
2. **HIGH-2, HIGH-3** — same pass. Both are single-sentence corrections to claims about the outside
   world that the outside world does not support.
3. **MEDIUM-1** — the five line numbers, `epics.md:374` first.
4. **MEDIUM-3** — `>=22.13.0` or 24, before the `engines` change is written from the spine's text.
5. The rest are precision.

**Not in scope but flagged:** `next@16.2.10` is still pinned ten days after 16.2.11 patched four
High CVEs, including the SSRF class AD-8 exists to contain. The spine records this accurately and
calls it pre-first-deploy work; nothing has moved. `16.2.12` is the tip to move to, and
`eslint-config-next` moves with it as the spine says.
