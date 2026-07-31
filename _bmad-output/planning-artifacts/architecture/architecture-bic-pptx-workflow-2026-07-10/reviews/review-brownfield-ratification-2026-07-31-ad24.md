# Brownfield Ratification Review — AD-24

**Target:** `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md`
**Under review:** `### AD-24 — Operator Chrome State Is Browser-Local, and the Room-Facing Surface Is Closed to It [ADOPTED]` (spine lines 207–214), plus the amendment's non-AD edits (Design Paradigm line 34, Consistency Conventions *Client state* row line 223, Stack `next-themes` row line 241, Structural Seed lines 271–272 and 302/308/313, Deferred lines 377/383/384).
**Lens:** Brownfield ratification — an `[ADOPTED]` tag is a claim that the Rule describes `src/` as it is. The prior gate on this file found two `[ADOPTED]` rules false about shipped code. This pass tries to falsify the new one.
**Date:** 2026-07-31
**Method:** clause-by-clause verification against `src/`, `tests/`, `package.json`, `globals.css`, `node_modules/next-themes`; full `npm test` run.

**Test suite:** `npm test` — exit 0, `tests 365 / pass 364 / fail 0 / skipped 1`. `tests/theme-chrome.test.mjs` is registered in `package.json` `scripts.test` and runs. Nothing below is a red test; every finding is a place where a green suite and a true-sounding sentence diverge.

---

## Verdict

`[ADOPTED]` is **defensible for Clause 1 (three tiers) and Clause 2 (root client boundary)** — every factual assertion in both checks out, including the ones easiest to get wrong. It is **not fully defensible for Clause 3 (room-facing closure)**: the token half is true and well-enforced, but the **shell-neutralisation half is stated absolutely and is false for two shipped room-facing surfaces** — the `buildSlidePlan`-failure branches of the two route shells, which are `fixed inset-0` at the projected URLs and call no reset, on a mechanism the spine itself says makes the leak *variable and live mid-service*. The enforcement gate's `FULL_SCREEN` set excludes exactly those two files, so nothing detects it. That is the same defect class the previous gate caught twice: an absolute present-tense sentence under `[ADOPTED]` that `src/` does not honour.

Recommendation: keep `[ADOPTED]` on Clauses 1 and 2 and on the token/PPTX mechanisms, and either narrow Clause 3's shell sentence to the client surfaces it is true of (recording the Server-Component shell gap in *Deferred*, the way AD-6 and AD-10 already name theirs), or re-tag AD-24 `[ADOPTED, partial]`. As written, the sentence claims more than the code does.

---

## Clause 1 — three storage tiers

### 1.1 `slide_transition` lives in `settings` in SQLite — **TRUE**

- `src/lib/settings.ts:13` — `const SLIDE_TRANSITION_KEY = 'slide_transition';`
- `src/lib/settings.ts:60-81` — `getSlideTransition` / `setSlideTransition` read and write it through `getSetting` / `setSetting`, which are `SELECT value FROM settings WHERE key = ?` and an upsert (`:15-29`).
- DDL: `src/lib/db/index.ts:151` — `CREATE TABLE IF NOT EXISTS settings` on the `getDb` startup path, in the same block as every other table, so it lands on the durable `DB_PATH` per AD-4. Consistent with AD-9.
- Server-side read at the render boundary: both projected route shells call `getSlideTransition()` (`slideshow/page.tsx`, `present/projector/page.tsx`), and `src/lib/pptx.ts:14` imports it. AD-23's "reaches each surface directly from `settings`, never through the plan" holds.

### 1.2 The theme lives in browser `localStorage` and nowhere else — **TRUE**

- Repo-wide grep over `src/` for `localStorage|sessionStorage|document.cookie|indexedDB|matchMedia|caches.|navigator.storage` returns **exactly one hit, and it is a comment** (`src/components/ThemeToggle.tsx:24`). No application code touches web storage directly; the only writer is `next-themes` inside `ThemeProvider`.
- Nothing writes a theme to SQLite: no `theme`-shaped key exists in `src/lib/db/index.ts` or `src/lib/settings.ts` (the only `settings` keys are `pptx_retention_days`, `slide_transition`, and the AD-17/AD-21 seed marker). Grep for `theme` across `src/lib/` returns only `themeVerse` (rundown data — an unrelated homonym, worth knowing before anyone greps to confirm) and the comments in `use-projected-shell.ts`.
- Key name: `next-themes@0.4.6` defaults `storageKey` to `"theme"` (`node_modules/next-themes/dist/index.mjs`, `storageKey:m="theme"`), and `ThemeProvider.tsx:22` passes no `storageKey` — so the Structural Seed's `localStorage.theme` node label is literally correct.

### 1.3 AD-23's live presenter override is ephemeral and travels over AD-10's channel — **TRUE**

- `src/lib/present-channel.ts:28-32` — `{ type: 'transition'; transition: SlideTransition }`, documented as "Nothing stores it."
- `PresenterOperator.tsx:337-343` — `setTransitionAndSync` writes a `useRef` and a `useState`, then `broadcast({ type: 'transition', transition: next })`. No fetch, no `setSetting`, no storage write.
- `ProjectorClient.tsx:33-35, 70-71` — seeded from the server-rendered configured style, then updated from `liveTransitionOf(msg)` into component state only.
- Single channel: `openPresentChannel` / `presentChannelName` in the shared module; both surfaces use it. AD-10's single-channel clause is intact.

### 1.4 `next-themes` owns the `theme` key and the `attribute="class"` contract; `globals.css:5` — **TRUE**

- `src/app/globals.css:5` is verbatim `@custom-variant dark (&:is(.dark *));`. The line number in the spine is correct.
- `src/components/ThemeProvider.tsx:22` — `attribute="class" defaultTheme="system" enableSystem`.
- The palette is keyed on `.dark` (`globals.css:86`) against `:root` (`:51`), exposed through `@theme inline` `--color-*` names (`:7-49`) — which is also the source `tests/theme-chrome.test.mjs` parses its token list out of, so the token guard cannot fall behind the palette.
- Stack row (`spine:241`) claims `^0.4.6` resolved `0.4.6`: confirmed in both `package-lock.json:8185` and `node_modules/next-themes/package.json:3`. No drift.

### 1.5 Is there other browser-persisted state the clause fails to account for?

**Two, one of them worth recording.**

1. **The auth session cookie.** `src/lib/auth/session.ts:174-180` — `sessionCookieOptions(maxAge = SESSION_TTL_SECONDS)`, set at `api/auth/login/route.ts:109`, `api/auth/change-password/route.ts:118`, `api/admin/accounts/[id]/route.ts:88`, cleared with `maxAge: 0` at `api/auth/logout/route.ts:39-41`. This is persisted browser state in a **fourth** home — a server-set, `maxAge`-bearing cookie whose authority is re-checked against SQLite by AD-5 on every gated request. AD-24's sentence *"Persisted state reaches exactly one of three homes"* is unqualified, and the Consistency Conventions *Client state* row (`spine:223`) repeats the absolute. See Finding 3.
2. **The OS colour-scheme signal.** `defaultTheme="system" enableSystem` means that on a browser with no `theme` key, the resolved theme comes from `matchMedia('(prefers-color-scheme: dark)')` inside next-themes — an input that is neither persisted nor shared. Not a defect: the clause is about *storage targets*, and the unpersisted system default has no home to pick. Recorded so a later reader does not mistake it for one. (It is also the whole reason `ThemeToggle`'s pre-mount placeholder exists, `ThemeToggle.tsx:22-28`.)

Nothing else: no `sessionStorage`, no `indexedDB`, no Cache Storage, no service worker, no `document.cookie` in client code.

---

## Clause 2 — one root client boundary

### 2.1 `layout.tsx` is a Server Component reaching the client through exactly one child — **TRUE**

- `src/app/layout.tsx` has no `'use client'`. Its only imports are `type Metadata`, two `next/font/google` families, `./globals.css`, and `@/components/ThemeProvider` (`:1-4`). `ThemeProvider` is the single client child (`:36`).
- `src/components/ThemeProvider.tsx:1` — `'use client';`, and it does nothing but wrap `NextThemesProvider`.

### 2.2 `<html>` carries `suppressHydrationWarning` — **TRUE**

`src/app/layout.tsx:30-34`, with the reason stated in a comment above it. Asserted by `tests/theme-chrome.test.mjs:369-374`, alongside a `doesNotMatch(/^\s*'use client'/m)` on the layout (`:375-379`) — so the "does not spread upward" half of the rule has a live guard, not just prose.

### 2.3 Is `ThemeProvider` really the only root-level client provider? — **TRUE, and stronger than the spine claims**

- `src/app/**/layout.tsx` resolves to **exactly one file**: `src/app/layout.tsx`. There is no route-group layout anywhere, so "wraps every route" has only one candidate position and nothing else occupies it.
- No `template.tsx`, `error.tsx`, `global-error.tsx` or `not-found.tsx` exists anywhere under `src/app` (see Finding 2 — their absence is load-bearing in the other direction).
- `<Toaster />` is defined in `src/components/ui/sonner.tsx:7` and **mounted nowhere**; `toast(` is called nowhere in `src/`. This matches the *Deferred* item at `spine:383` exactly — the second-provider question really is still open rather than quietly answered. `sonner.tsx:12` does call `useTheme()`, and `theme-chrome.test.mjs:391-412` pins that the provider sits above it and that sonner mounts no provider of its own.
- `Header.tsx` is a client component but is rendered per-page, not from the root layout — so it is not a root-level provider and does not test the rule.

---

## Clause 3 — the room-facing surface is closed to operator chrome

### 3.1 The projected render tree paints in literal colours, no theme token, no theme-coloured edge — **TRUE**

Verified by reading, not only by the green test:

- `ProjectorClient.tsx:102` `bg-black`, `:122` `bg-[#0B1220]`, `:123` `text-[#D4A574]`, `:139` `bg-black`; `text-white` throughout. No token, no `dark:` variant, no border/ring/outline width.
- `SlideshowClient.tsx:61` `bg-black text-white`, `:62` `text-white/70`. Same.
- `SlideView.tsx:18-19` renders `<ArtifactSlide instance={slide.artifact} />` and **takes no `className`** — the forwarding path was closed, and the file says why (`:11-16`).
- Both route shells' error branches use literals only (`projector/page.tsx:71`, `slideshow/page.tsx:76`: `bg-black`, `text-white`, `text-white/80`, `text-white/60`).
- Every `@/lib` specifier these files import is data/style-arithmetic with no colour in it: `transitions.ts`, `use-slide-transition.ts`, `render-model.ts` (whose only colour functions, `toCssColor`/`toPptxColor` at `:271-281`, transform a registry hex and invent nothing).

### 3.2 `ArtifactSlide` resolves colours from the registry via inline `style`, falling back to a literal `#FFFFFF` — **TRUE IN SUBSTANCE, UNDER-STATED AS WRITTEN**

`ArtifactSlide.tsx` has **three** literal fallbacks, not one:

| Line | Expression | Fallback |
| --- | --- | --- |
| `:128` | `color: toCssColor(style.fontColor) ?? '#FFFFFF'` | literal white |
| `:181` | `backgroundColor: toCssColor(element.style.fillColor) ?? 'transparent'` | `transparent` |
| `:251` | `backgroundColor: toCssColor(layout.backgroundColor) ?? '#000000'` | literal **black** |

All three are literals, so the invariant — no colour in the projected tree can fall through to the theme — holds completely. But the spine's parenthetical names only `#FFFFFF`, and the stage background (the largest painted area on the room-facing screen) falls back to `#000000`. See Finding 4.

### 3.3 `use-projected-shell.ts` is the ONE shared reset and both surfaces call it — **TRUE for the two client surfaces**

- `src/lib/use-projected-shell.ts:32-56` is the single implementation.
- `ProjectorClient.tsx:13` imports it, `:96` calls it. `SlideshowClient.tsx:8` imports it, `:33` calls it.
- Neither keeps a copy: grep for `scrollbarGutter` / `backgroundColor =` across `src/` returns the hook and nothing else in either client. The pre-2026-07-31 in-`ProjectorClient` effect is genuinely gone.
- Enforced by `theme-chrome.test.mjs:289-303` (`FULL_SCREEN` → must match `fixed inset-0` **and** `useProjectedShell()`) and `:305-315` (the hook itself paints `#000000`, sets `scrollbarGutter='auto'`, and carries no token).

**But the enumeration is incomplete and the set is incomplete.** The hook also pins `overflow: hidden` on both `html` and `body` (`:43-44`) — not just background and gutter (Finding 5). And `FULL_SCREEN` contains only the two Clients, while two further `fixed inset-0` room-facing surfaces exist (Finding 1).

### 3.4 `tests/theme-chrome.test.mjs` is registered, and `PROJECTED` covers the room-facing surfaces including both route shells — **TRUE**

- Registered: `package.json` `scripts.test` lists `tests/theme-chrome.test.mjs` (second-to-last entry, before `public-repo-guard`). It runs in the suite above.
- `PROJECTED` (`:127-138`) = `SlideView.tsx`, `artifacts/ArtifactSlide.tsx`, `ProjectorClient.tsx`, `SlideshowClient.tsx`, **`present/projector/page.tsx`**, **`slideshow/page.tsx`** — both route shells present, with the reason stated inline.
- Closure is enforced, not assumed: `:242-257` asserts every relative / `@/…` / `dynamic(import(…))` specifier a projected file pulls in is itself in `PROJECTED`, and `:259-280` scans **all** `.tsx` under `src/` for a `className` passed to `SlideView` or `ArtifactSlide`. `stripComments` (`:48-54`) is applied to every read, which is what makes the "four assertions were satisfiable by a comment" history non-repeatable.

One ceiling the spine's own enumeration of ceilings misses: `componentImports` (`:231-233`) drops **every** `@/lib/**` specifier on the stated ground that it is "data, helpers and hooks — not markup". Both clients render `transitionLayerStyle(...)` output as inline `style`, so a `var(--card)` added to `src/lib/transitions.ts` would reach the projected tree unguarded. True today (3.1), but see Finding 6.

### 3.5 `PresenterOperator.tsx` and `SlideGridDialog.tsx` still pin `.dark` on their own wrapper — **TRUE**

- `PresenterOperator.tsx:449` — `className="dark flex min-h-dvh flex-col bg-background text-foreground lg:h-dvh lg:overflow-hidden"`. The outermost classed element of the exported component; tokens inside it resolve dark because `:is(.dark *)` matches.
- `SlideGridDialog.tsx:176` — `className="dark flex max-h-[85dvh] …"`.
- Guarded as a class *token* on the outermost element (`theme-chrome.test.mjs:334-357`), which is the right shape — the previous `/className="dark[\s"]/` form would have passed on a stray `dark` anywhere and failed on `className="flex dark …"`.
- Both are operator surfaces, so the spine's carve-out is correctly scoped. (`PresenterOperator` renders `SlideView` inside that `.dark` subtree; inert, because 3.2 leaves nothing for `.dark` to reach.)

### 3.6 The PPTX path genuinely cannot read browser state — **TRUE**

`src/lib/pptx.ts:1-3` imports `crypto`, `fs`, `path`; `:14` imports `getSlideTransition` from `settings` (SQLite). It is a server module by construction — `better-sqlite3` and `node:fs` in the same import graph make a browser bundle impossible. The spine's characterisation of this as *structural* rather than *enforced* is exactly right, and its explanation of why the enforcement clause names only the browser surfaces is sound.

---

## The amendment's non-AD edits

| Edit | Status |
| --- | --- |
| Design Paradigm (`:34`) — "including at the root, where one client provider wraps every route for theming without making the tree it wraps client-side (AD-24)" | **TRUE.** Matches 2.1–2.3. |
| Consistency Conventions *Client state* row (`:223`) | **TRUE except for the same absolute as Clause 1** — see Finding 3. "Room-facing surfaces read none of it" inherits Finding 1. |
| Stack `next-themes` row (`:241`) | **TRUE.** `^0.4.6`, resolved `0.4.6`, latest release; `package.json` and lock agree. |
| Structural Seed `src/lib/` line (`:302`) — "use-projected-shell.ts -- the ONE app-shell reset **every** full-screen room-facing surface calls (AD-24)" | **FALSE as written** — see Finding 1. True of the one implementation; false of "every … calls". |
| Structural Seed `src/components/` line (`:308`) — "ThemeProvider.tsx -- the ONE root client boundary (AD-24) -- and ThemeToggle.tsx" | **TRUE.** Both files exist at those paths; 2.3 confirms "the ONE". |
| Structural Seed `tests/` line (`:313`) — "incl. proxy-matcher, public-repo-guard, asset-map-evidence, theme-chrome (enforced gates)" | **TRUE.** All four exist and all four are in `scripts.test`. |
| Mermaid edge `Operator -->|"AD-24: chrome preference, this browser only, not backed up"| Theme[("localStorage.theme")]` (`:271`) | **TRUE.** Key name verified in next-themes; "not backed up" follows from AD-4 naming only `DB_PATH`/uploads/PPTX cache. |
| Mermaid edge `Theme -.->|"AD-24: closed -- literal colours + one shared shell reset"| Projector` (`:272`) | **TRUE for the deck path; overstated for the URL** — the dotted negative edge is right about `SlideView`/`ArtifactSlide`, and inherits Finding 1 for the non-happy paths at the same URL. |
| Deferred `next-themes` velocity item (`:377`) | Consistent with 1.4. Not re-verified against upstream (out of lens). |
| Deferred toast item (`:383`) | **TRUE.** `sonner` installed, `sonner.tsx` calls `useTheme()`, `<Toaster />` mounted nowhere, `toast(` called nowhere. |
| Deferred gate-ceiling item (`:384`) | **TRUE on every mechanic it claims** (comment stripping, directional and arbitrary edge widths, relative/`@/app`/`dynamic` specifiers, the `className` guard on both components, "each spelling negative-tested"). Incomplete on one ceiling — Finding 6. |

---

## Findings

### Finding 1 — HIGH — Clause 3's shell-closure sentence is false for two shipped room-facing surfaces, and the gate excludes exactly those two files

**Spine (`:212`):** *"a full-screen room-facing surface **neutralises the app shell it inherits** — `html`/`body` background and `scrollbar-gutter` — through the one shared hook `src/lib/use-projected-shell.ts` and never its own copy"*. **Structural Seed (`:302`):** *"the ONE app-shell reset **every** full-screen room-facing surface calls"*.

**The code:** there are **four** `fixed inset-0` room-facing renders on the two projected URLs, not two:

- `src/app/services/[id]/present/projector/ProjectorClient.tsx:102` — calls the hook ✓
- `src/app/services/[id]/slideshow/SlideshowClient.tsx:61` — calls the hook ✓
- `src/app/services/[id]/present/projector/page.tsx:71` — `<div className="fixed inset-0 flex flex-col items-center justify-center bg-black px-12 text-center text-white">` — **no reset**
- `src/app/services/[id]/slideshow/page.tsx:76` — `<div className="fixed inset-0 flex flex-col … overflow-hidden bg-black …">` — **no reset**

The last two are the `buildSlidePlan`-failure branches. They render at the identical projected URL — the spine and the test both say so, and `theme-chrome.test.mjs:132-135` puts them in `PROJECTED` for precisely that reason ("Reached at the same projected URL whenever `buildSlidePlan` throws, which a registry failure is enough to cause"). But `FULL_SCREEN` (`:284-287`) contains only the two Clients, so the hook assertion never reaches them.

**Why this is a leak on the spine's own stated mechanism.** `globals.css:127-130` sets `scrollbar-gutter: stable` on `html`; `:124-126` sets `body { bg-background text-foreground }`, and `--background` is `oklch(1 0 0)` at `:root` and near-black under `.dark`. The hook's own docstring (`use-projected-shell.ts:12-16`) states the geometry: *"the reserved gutter means `fixed inset-0` sizes to the viewport minus that gutter, so the page underneath shows as a strip down the edge — on the projector, in front of the congregation."* Nothing on the error branches changes that geometry and nothing neutralises `body`. So the strip is present there and, since Story 17.1, it is **theme-coloured** — which is the exact escalation the spine's fourth bullet (`:213`) calls out as the reason the shell clause must be separate at all: *"Permanently white was wrong but not variable; the moment a theme existed that strip followed the operator's choice live, mid-service."*

Either the mechanism claim in bullet 4 is right and these two branches leak, or the mechanism claim is wrong and bullet 4's rationale is wrong. Either way an `[ADOPTED]` sentence does not describe `src/`.

**A structural fact the spine does not acknowledge, which makes this more than an oversight.** Both shells are **Server Components** — they cannot call a hook. The rule's prescribed mechanism (*"through the one shared hook … and never its own copy"*) is not available to this entire class of room-facing surface. The rule therefore does not merely go unfollowed here; as written it cannot be followed. Closing it needs a decision (a client shim around the failure branch, a route-scoped CSS class, a `[data-projected]` attribute) that the spine does not make and does not defer.

**Severity rationale:** the false clause is the one the previous verification pass already got wrong once (`:213` — "Story 17.1's first verification pass was thorough inside exactly that wrong boundary"), the enforcement the spine points to does not cover it, and the surface is the congregation's screen during a service.

**Suggested repair (reviewer, not applied):** narrow to *"a full-screen room-facing **client** surface neutralises the app shell … through the one shared hook"*, add a *Deferred* item naming the two Server-Component failure branches and the fact that the hook mechanism cannot reach them, and add those two files to `FULL_SCREEN` under whatever mechanism the story picks. Or re-tag AD-24 `[ADOPTED, partial]` with this as the named gap, in the shape AD-6 and AD-10 already use.

---

### Finding 2 — MEDIUM — `notFound()` on a projected URL renders un-neutralised themed chrome, and Clause 3's "in any form, under any setting" does not survive it

**Spine (`:212`):** *"The projector, the web slideshow and the PPTX never read operator chrome state, **in any form, under any setting**."*

**The code:** both shells call `notFound()` on a bad/absent service (`projector/page.tsx:56`, `slideshow/page.tsx:56` region). There is **no `not-found.tsx`, `error.tsx`, or `global-error.tsx` anywhere under `src/`** — verified by find. So `notFound()` renders Next's built-in 404 *inside the root layout*, i.e. inside `<body className="min-h-full flex flex-col">` carrying `bg-background text-foreground`. The full viewport at a room-facing URL then paints the operator's chosen theme — white in light, near-black in dark — and follows a mid-service change live, since next-themes syncs same-origin windows on the `storage` event.

The spine's own justification for pulling the route shells into `PROJECTED` is *"reached at the same projected URL"*. By that standard `notFound()` and an uncaught render error qualify too, and neither is closed by anything. The absolute *"in any form, under any setting"* is what makes this a finding rather than a scope question: a narrower sentence ("the rendered deck and its failure card") would be true.

**Suggested repair:** either scope the sentence to the surfaces the mechanisms actually cover, or record the not-found/error branches as a named gap. If the product wants them closed, a room-facing `not-found.tsx`/`error.tsx` under the two route segments is the smallest move, and it lands in the same place Finding 1's fix does.

---

### Finding 3 — MEDIUM — "Persisted state reaches exactly one of three homes" is falsifiable in ten seconds: the auth session cookie is a fourth

**Spine (`:210`):** *"Persisted state reaches exactly one of three homes, and *who must agree on it* decides which."* Repeated as an absolute in the Consistency Conventions *Client state* row (`:223`): *"Three homes, and who must agree on it picks one (AD-24)."*

**The code:** `src/lib/auth/session.ts:174-180` — `sessionCookieOptions(maxAge = SESSION_TTL_SECONDS)`, an `httpOnly` cookie with a lifetime, set at `api/auth/login/route.ts:109`, `api/auth/change-password/route.ts:118` and `api/admin/accounts/[id]/route.ts:88`, cleared at `api/auth/logout/route.ts:39-41`. That is persisted browser state in a home the taxonomy does not name: server-owned, browser-stored, and re-validated against SQLite on every gated request by AD-5 (`spine:98`) — which is precisely why it is *not* in any of the three tiers and *is* structurally significant.

AD-24's *Binds* line scopes the decision to *"the choice between `settings` and `localStorage` as a storage target"*, which is the reading that makes the rule true. The Rule sentence then drops that scope and generalises to all persisted state. A reader who checks the claim finds a counterexample immediately, and the cost of that is not pedantic: this is a rule whose whole force is that a builder trusts its taxonomy when picking a home for a new value.

**Suggested repair:** scope the sentence — *"Persisted state a UI surface chooses a home for reaches exactly one of three homes"* — and name the session cookie once as governed by AD-5, not by this decision. One clause in each of the two places.

---

### Finding 4 — LOW — "falling back to a literal `#FFFFFF`" names one of three literal fallbacks, and not the largest one

**Spine (`:212`):** *"`ArtifactSlide` resolves every colour from the registry through inline `style`, falling back to a literal `#FFFFFF`"*.

**The code:** `ArtifactSlide.tsx:128` `?? '#FFFFFF'` (text colour), `:181` `?? 'transparent'` (shape fill), `:251` `?? '#000000'` (**stage background** — the largest painted area on the room-facing screen). The invariant holds — all three are literals and none can fall through to a token — but the parenthetical reads as an exhaustive account of the fallback behaviour and is not one. A reader who verifies `:128` and stops will believe the stage background is registry-only, and a future edit to `:251` looks unremarkable against this text.

**Suggested repair:** *"falling back to literals — `#FFFFFF` for text, `#000000` for the stage, `transparent` for a shape fill — never to a token."* One line, and it makes the clause self-verifying.

---

### Finding 5 — LOW — the shell reset's enumeration omits `overflow`, and the rule's "never its own copy" makes the enumeration load-bearing

**Spine (`:212`):** *"neutralises the app shell it inherits — `html`/`body` background and `scrollbar-gutter` — through the one shared hook"*.

**The code:** `use-projected-shell.ts:43-47` sets **five** properties — `root.style.overflow`, `body.style.overflow`, `root.style.scrollbarGutter`, `root.style.backgroundColor`, `body.style.backgroundColor` — and restores all five on unmount (`:48-54`). The `overflow` pair is not theme-related at all; it is the "must never scroll" half of the hook's contract (`:9-10`).

This matters because the clause forbids a private copy. A future full-screen surface that needs only the scroll suppression, and reads this clause as a theme-closure mechanism, has textual licence to write its own two lines — which is how the projector/slideshow divergence happened the first time.

**Suggested repair:** *"— `html`/`body` background, `scrollbar-gutter`, and the scroll suppression these surfaces all need —"*.

---

### Finding 6 — LOW — the gate-ceiling item enumerates the blind spots and misses the one the projected files actually exercise

**Spine (`:384`)** lists what `theme-chrome.test.mjs` "structurally cannot see": a runtime-composed class name, and a theme token arriving through a CSS file rather than a utility class.

**A third:** `componentImports` (`theme-chrome.test.mjs:231-233`) filters out **every** `@/lib/**` specifier as "data, helpers and hooks — not markup". But `ProjectorClient.tsx:111,119` and `SlideshowClient.tsx:76,84` render `transitionLayerStyle(...)` — a `@/lib/transitions` return value — directly as inline `style`. A `var(--card)` or a token-derived colour added to that helper would reach the projected tree and no assertion would see it: `themeReferences` does catch `var(--token)`, but only over the six `PROJECTED` files, and `@/lib/transitions` is not one and cannot become one under the current filter.

Verified inert today: `transitions.ts`, `use-slide-transition.ts` and `render-model.ts` contain no colour except the registry-hex transforms at `render-model.ts:271-281`. So this is a ceiling, not a live hole — but it belongs in the list the spine wrote for exactly this purpose, and it is the only one of the three that the projected files exercise every render. The spine's own argument applies: *"the one thing this suite's own history argues against is trusting a guard nobody probed."*

**Suggested repair:** add to `:384` — *"and a colour reaching the tree through an inline-style helper under `@/lib`, which the import walk deliberately does not follow (`transitionLayerStyle` is the live instance; it carries no colour today)."*

---

## What was checked and found clean

Recorded so a later pass does not re-derive it:

- `slide_transition` storage target, DDL placement, and both read paths (server shells + `pptx.ts`).
- Absence of any theme write to SQLite; absence of any web-storage API call in application code.
- `localStorage` key name against `next-themes@0.4.6` source, not against its docs.
- Presenter override ephemerality: no persistence on either the presenter or the projector side.
- Single-`layout.tsx` fact — there is no route-group layout in the app, so "wraps every route" has one candidate position.
- `<Toaster />` genuinely unmounted, `toast(` genuinely uncalled — the `spine:383` *Deferred* item is accurate, not stale.
- `SlideView` genuinely no longer accepts `className`, and the all-`.tsx` caller scan that closes the `ArtifactSlide` side.
- Both `.dark` opt-outs present on the outermost classed element of their exported component.
- PPTX server-only by import graph.
- All four gates named on `spine:313` exist and are registered in `scripts.test`.
- Full suite green: 364/365 passing, 1 skipped, exit 0.

## Is `[ADOPTED]` defensible as tagged?

**Partly.** Clauses 1 and 2 are ratified without qualification — the storage tiers, the key ownership, the `globals.css:5` citation, the single client boundary, `suppressHydrationWarning`, and the absence of a second root provider all describe `src/` as it is, and two of them are pinned by tests that were themselves probed. Clause 3's token mechanism, its `PROJECTED` closure, the `.dark` carve-out and the PPTX structural argument are ratified too.

Clause 3's **shell-neutralisation** mechanism is not: it is stated as a property of "a full-screen room-facing surface", two shipped ones do not have it, the gate is blind to exactly those two, and the mechanism the rule prescribes is unavailable to them by construction. With Finding 2 alongside it, the honest tag for AD-24 today is **`[ADOPTED, partial]` with that gap named** — or `[ADOPTED]` with the sentence narrowed to the client surfaces it is true of. Choosing the second is a wording change, not a retreat: the decision itself is sound and the mechanisms it names are real. What is not yet true is the universal quantifier.
