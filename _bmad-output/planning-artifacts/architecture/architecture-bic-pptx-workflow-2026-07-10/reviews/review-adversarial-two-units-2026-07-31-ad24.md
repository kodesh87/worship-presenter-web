# Reviewer Gate — Adversarial Two-Units Lens (Update, AD-24)

**Target:** `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md`
**Date:** 2026-07-31 · **Intent:** Update (report only; the spine was not edited)
**Lens:** Construct two units one level down — two stories, two developers, two surfaces — that each obey **every** AD to the letter and still build incompatibly. Every pair is a hole to close.
**Independence:** the run folder's `reviews/` and `.memlog.md` were not read for content. Every attack below was constructed from the spine text plus `src/`, `tests/theme-chrome.test.mjs`, `epics.md` and Story 17.1, and each was verified against the code before it was written down. Attacks the code already forecloses are listed as forecloses, not as findings.

**Verdict.** AD-24 is well-argued and closes the specific leak Story 17.1 shipped, but as an *invariant* it is a colour-shaped rule guarding a problem that is not only about colour, and its enforcement clause delegates to a test whose closure premise is false in the shipped tree. Three things are decidable-sounding and not decidable: which tier a value belongs to when the answer is "this operator, wherever they sit"; whether a `@/lib` hook is part of a room-facing surface; and whether a Server Component that covers the projected screen is bound by the shell clause. The last one is not hypothetical — **the leak AD-24 was written to close is still live on both room-facing failure branches**, and AD-24's own wording is what makes leaving it there defensible.

**Counts:** 3 CRITICAL · 4 HIGH · 4 MEDIUM · 1 LOW · 5 attacks foreclosed by the code

**Units used.** Shipped: Story 17.1's two full-screen clients and their two route shells; `PresenterOperator`; the admin settings surface. Backlog, real, and named in `epics.md`: **17.2** (`muted-foreground`), **17.4** (unsaved canvas work), **17.5** (projector-gone detection), **17.6** (toast channel decision), **20.4** (canvas authoring), **20.7** (SongSet bounded config). Unowned decisions used as units: `DESIGN.md` Open Item 6 (non-text contrast — raising `--border` on both themes).

---

## P1 — CRITICAL — A Server Component cannot call the one shared hook, so AD-24's shell clause has no compliant implementation for the two room-facing surfaces that ship one

**Units.** *Story 17.1 remediation, half A* — the two full-screen **clients** (`SlideshowClient`, `ProjectorClient`). *Story 17.1 remediation, half B* — the two **route shells** that render at the same projected URL (`slideshow/page.tsx`, `projector/page.tsx`).

**Exact AD text each unit reads.** AD-24, clause 3:

> a full-screen room-facing surface **neutralises the app shell it inherits** — `html`/`body` background and `scrollbar-gutter` — through the one shared hook `src/lib/use-projected-shell.ts` and never its own copy

**The incompatible legal choice.**
- **Half A** reads *"a full-screen room-facing surface neutralises the app shell"* and calls `useProjectedShell()`. Verified: `SlideshowClient.tsx:33`, `ProjectorClient.tsx:96`.
- **Half B** reads the same sentence and cannot comply. `slideshow/page.tsx:76` and `projector/page.tsx:71` each render `className="fixed inset-0 … bg-black"` — the identical full-screen pattern, at the identical room-facing URL — and both are **Server Components** (`export const dynamic = 'force-dynamic'`, `async function`, `getDb()` at module body). A React hook cannot be called there. The clause's second half — *"and never its own copy"* — forbids the only mechanism a Server Component has (an inline style or a `<style>` on the wrapper). So Half B's compliant move is to conclude the clause does not reach a page shell, because a page shell is not "a surface".

**Concrete symptom — verified, live in the working tree, not a projection.** `globals.css:124-130` sets `body { @apply bg-background }` and `html { scrollbar-gutter: stable }`. The reserved gutter is why `fixed inset-0` sizes to the viewport *minus* the gutter, which Story 17.1's own remediation reproduced in the browser (`body` computed `lab(100 0 0)` light / `lab(2.75 0 0)` dark, gutter `stable`). On the failure branch nothing resets either property, so the strip is back — and it is back **in colour**, following the operator's theme live, because next-themes syncs across same-origin windows on the `storage` event and the projector window is same-origin. The branch fires exactly when `buildSlidePlan` throws: a corrupt registry row, an `ArtifactHydrationError`, a missing template. That is 08:40 on a Sabbath, on the projector, in front of the congregation — the same sentence Story 17.1 quoted when it fixed the client half.

**Why no test catches it.** `tests/theme-chrome.test.mjs:284-303` gates `useProjectedShell()` over `FULL_SCREEN`, which lists **only the two client components**. The two page shells *are* in `PROJECTED` (added by the remediation, so the token and edge guards scan them) but not in `FULL_SCREEN` — and they cannot be, because the assertion is `/useProjectedShell\(\)/` and a Server Component would fail it forever. The test's structure encodes Half B's reading. AD-24 then cites that test as the mechanism that keeps the surface closed.

**Sentence to add** (AD-24, clause 3):
> A room-facing surface that is server-rendered reaches the shell reset through a minimal client child that calls `useProjectedShell()` and renders nothing else; the reset is never re-implemented inline, and every file matching `fixed inset-0` under a room-facing route — client **or** server — is covered by the shell assertion, the server ones by asserting that child is rendered.

---

## P2 — CRITICAL — The closure gate AD-24 leans on is closed over components and explicitly open to `@/lib`, and `@/lib` hooks already paint the projected screen

**Units.** *A new operator-chrome value that reaches a projected surface, built as a component* versus *the same value built as a hook.* Live instances of both shapes already exist.

**Exact AD text each unit reads.** AD-24, clause 3: *"`tests/theme-chrome.test.mjs` is the gate, so a new room-facing **surface** joins its `PROJECTED` set in the same change set, exactly as AD-5 requires of a new matcher exclusion."* And the *Structural Seed* file map, which files `use-projected-shell.ts` under `src/lib/` as *"the ONE app-shell reset."*

**The incompatible legal choice.** The gate's closure test (`theme-chrome.test.mjs:225-257`) enumerates a projected file's imports and then filters:

```js
.filter((s) => s.startsWith('.') || s.startsWith('@/'))
.filter((s) => !s.startsWith('@/lib/'))
```

with the stated premise — `theme-chrome.test.mjs:224` — that *"`@/lib/*` is data, helpers and hooks — not markup."* **That premise is false in the shipped tree, twice over.** `@/lib/use-slide-transition` returns the timing that `transitionLayerStyle` turns into the inline `style` on the projected layers (`ProjectorClient.tsx:111,119`; `SlideshowClient.tsx:76,84`), and `@/lib/use-projected-shell` writes five properties **directly onto `document.documentElement` and `document.body`**. Both are `@/lib`. Both determine what the congregation sees. Neither is scanned by the token guard, the edge guard or the closure test.

So: Builder A implements an operator preference that reaches a projected surface by adding a component — the component must join `PROJECTED`, the token and edge guards fire, and a theme token or a themed edge is caught. Builder B implements the same preference as `src/lib/use-operator-display.ts`, returns a `CSSProperties`, and the projected client spreads it onto its wrapper. B adds **no** file to `PROJECTED` — correctly, because a hook is not a surface — and **nothing in the repository reads B's file at all**. Both builders obeyed AD-24's enforcement clause to the letter.

**Concrete symptom.** The hook reads `localStorage.getItem('bic.slide-fit')` and returns `{ transform: 'scale(0.96)' }` so an operator with an overscanning projector can inset the image. Persisted-local, operator chrome, no colour, no token, shell hook still called, `PROJECTED` unchanged, 28 tests green. Two operators, two browsers, one projector: the deck the congregation sees now depends on which laptop is plugged in, and the PPTX matches neither. AD-24's *Prevents* names this exactly — *"a client-persisted value that **paints** becoming a third structural channel to the congregation's screen"* — and its enforcement cannot see it.

**Sentence to add** (AD-24, clause 3):
> The gate is closed over **every module a room-facing file reaches**, `@/lib` included: the `@/lib` exemption is limited to modules that neither return a style, a class name or a dimension nor write to `document`. A `@/lib` module that does any of those is a room-facing module and joins the guarded set. No module reachable from a room-facing surface reads browser-persisted state.

---

## P3 — CRITICAL — Persisted-local admits registry payloads, and AD-24's exclusion clause is scoped so that it does not catch them

**Units.** *Story 17.4* — "Unsaved Canvas Work Is Not Lost Silently" (`epics.md:289`) versus *Story 20.4* — canvas authoring under AD-22/AD-15.

**Exact AD text each unit reads.** AD-24, clause 1: *"Persisted state reaches exactly one of three homes, and **who must agree on it** decides which… **Persisted-local** lives in that browser's `localStorage` and nowhere else."* And the *Client state* convention: *"A value the deck, another operator, or another browser depends on is never persisted-local."* Story 17.4 also reads AD-13: *"Fabric.js owns the canvas state exclusively; React reads it **only on save**."*

**The incompatible legal choice.** The canonical fix for "unsaved work is lost silently" is a draft in `localStorage` — every editor on the web does it. Builder A applies AD-24's question honestly: who must agree on an unsaved draft? **Nobody.** Not the deck (an unsaved draft renders nothing), not another operator (it is not in the registry yet), not another browser (that is the point). Every clause of the exclusion sentence is satisfied, so persisted-local is not merely permitted — it is the tier AD-24's own test selects. Builder B keeps the dirty flag in memory and warns on navigation, citing AD-13's *"React reads it only on save"* and refusing to serialise canvas state at any other moment. Both are compliant. They are not compatible: A's editor restores work across a crash, B's does not, and a third builder inherits whichever shipped.

**Concrete symptom of A.** The draft is `serializeCanvas` output — an `ArtifactLayout`, the same payload the registry stores — and it now sits in a store that:
- **AD-4** does not cover (not on `DB_PATH`, not bind-mounted, explicitly "not backed up" by AD-24 itself);
- **AD-15** does not cover (*"**Every** write into the registry is untrusted and must pass the same structural and image-reference validation before persistence"* — a `localStorage` write is not a write into the registry, so an unvalidated layout, including an image ref AD-8 would refuse, is persisted and later replayed into the editor);
- **AD-6** cannot reach (`expectedUpdatedAt` / `RegistryStaleError` live in `src/lib/registry/store.ts`; a draft restored three days later either carries a stale precondition and 409s — the good case — or is restored into the form and re-saved against a freshly read `updated_at`, which is last-write-wins over the other administrator's Thursday fix, AD-6's *Prevents* verbatim);
- **AD-18/AD-21** cannot reach at all. AD-21's counter is *"one monotonic version number in `settings`"* — a database counter. A transition that raises `schemaVersion` (AD-21 explicitly permits this) cannot touch a payload sitting in an administrator's browser, and no deploy can. AD-21's *Prevents* — two builders keying the same change incompatibly — reappears one storage tier down, where the spine has no counter at all.

AD-24 names this hazard in the abstract (*"a value the deck depends on in `localStorage` sits outside every durability, concurrency and migration rule this spine has"*) and then scopes the operative sentence to values the deck **depends on**. An unsaved draft does not. That is the gap.

**Sentence to add** (AD-24, clause 1):
> Persisted-local holds **operator chrome only**: a preference about how this browser presents the app. It never holds domain data, and it never holds a value that will later be written into SQLite — a draft, a queued mutation, a cached row. Data on its way into the registry or a service stays in memory until it is written through the path AD-6 and AD-15 govern.

---

## P4 — HIGH — There are three tiers and four kinds of agreement; the missing one is "this operator, on any browser", and the product has accounts

**Units.** *Story 17.2* extended the obvious way ("remember that I need the larger/darker palette") versus *the shipped admin settings surface* as the place a preference is configured.

**Exact AD text each unit reads.** AD-24, clause 1: *"the theme is in `localStorage` because nothing but this operator's own eyes depends on it"*, and *"a preference in `settings` makes one operator's choice everyone's."*

**The incompatible legal choice.** AD-24's question is *who must agree on it*, and it offers three answers: everybody (`settings`), this browser (`localStorage`), this live session (BroadcastChannel). The product's actual identity unit is **the account** — per-person Admin/Operator auth shipped with FR-18 / Story 6.2, the `accounts` table exists (`src/lib/db/index.ts:120`), AD-5 re-checks the role from SQLite on every request. "This operator, wherever they sign in" is a fourth answer and has no home. Builder A concludes the nearest admitted tier is `settings` and adds an app-wide row — landing precisely in the hazard AD-24's *Prevents* names. Builder B stays in `localStorage` and accepts that the preference is a property of the machine. Both cite clause 1.

**Concrete symptom.** One laptop lives on the sound desk. Two operators use it on alternating Sabbaths. Under B, each inherits the other's chrome and neither can have a preference; under A, the operator who needs larger, higher-contrast text sets it and every other operator's hub changes with it. Neither is what anybody wanted, and the spine picked neither.

**Second half of the same hole: the shared tier is not operator-writable.** Every existing write path into `settings` is admin-only — `PUT /api/admin/settings` calls `requireAdminSession` (verified), which is what AD-14 requires of registry management and AD-5 of privileged routes. So routing an *operator* preference to persisted-shared implies either a **new non-admin write path into the same table that holds AD-21's data-version counter and AD-23's `slide_transition`** (and `setSetting(key, value)` is an unrestricted upsert with no key vocabulary — verified `src/lib/settings.ts:22-29`), or accepting that operators cannot change it. AD-24 does not say which, and the first option is a privilege surface, not a styling choice.

**Sentence to add** (AD-24, clause 1):
> A preference whose scope is **one account rather than one browser** is persisted-shared but **row-scoped to the account**, never an app-wide `settings` key; an app-wide `settings` key is by definition a value the whole congregation shares. `settings` remains admin-write-only: an operator-writable preference is either account-scoped or persisted-local, and no path writes `settings` outside `requireAdminSession`.

---

## P5 — HIGH — "Room-facing surfaces read none of it" is false for two of the three tiers it was written under, and a builder who obeys it breaks AD-23

**Unit pair.** Two builders adding the next room-facing surface — *Story 17.5*'s projected "lost sync" state, or an Epic-20 confidence monitor.

**Exact text.** The new *Consistency Conventions* row: *"Three homes… **persisted-shared** → SQLite on `DB_PATH`, app-wide values in `settings`; **persisted-local** → …; **ephemeral-shared** → AD-10's `BroadcastChannel`. A value the deck, another operator, or another browser depends on is never persisted-local. **Room-facing surfaces read none of it.**"*

**The incompatible legal choice.** The antecedent of *"it"* is either the three-tier client state just enumerated, or AD-24's narrower *operator chrome state*. Under the literal reading the sentence is **false about shipped code that other ADs mandate**: `slideshow/page.tsx:105` and `projector/page.tsx:92` both call `getSlideTransition()` — persisted-shared, tier 1 — and `ProjectorClient.tsx:56-88` subscribes to the BroadcastChannel — ephemeral-shared, tier 3. Two of three tiers are read by room-facing surfaces today, by design.

Builder A reads the row literally, so the new surface reads neither `settings` nor the channel and holds its own transition default. That is a direct hit on AD-23: *"no surface keeps a default of its own — that, not immutability, is the invariant."* Builder B reads *"it"* as operator chrome and wires the surface exactly like the projector. A conventions table is precisely where a builder looks for a one-line answer, and it gave the wrong one.

**Sentence to fix** (*Client state* row):
> Room-facing surfaces read no **persisted-local** state. They read persisted-shared values (AD-23's `slide_transition`) and ephemeral-shared messages (AD-10) as those decisions require.

---

## P6 — HIGH — Clause 2 licenses a root provider that paints, clause 3 only closes the surfaces *below* it, and the shell hook resets five named properties

**Units.** *A "dim the hub" or "larger text" operator-accessibility control* (the natural sequel to Story 17.2 and to `DESIGN.md` Open Item 6) versus *the projected surfaces as they are.*

**Exact AD text each unit reads.** Clause 2: *"A second root-level provider is admissible only if it genuinely must wrap **every** route."* Clause 3: *"The projector, the web slideshow and the PPTX never **read** operator chrome state"*, enforced by literal colours, the shell hook, and a token/edge scan.

**The incompatible legal choice.** A root-level provider genuinely must wrap every route — a global appearance control is the textbook case, and AD-24's own `ThemeProvider` is the precedent. But the projector and slideshow routes are **already inside that provider**: `layout.tsx:36` wraps `{children}`, and every route is a child. Verified in Story 17.1's own Debug Log — the projector window's `<html>` carries `class="dark"` and `color-scheme: dark` when the operator picks dark. Clause 3 closes the room-facing surface against *reading* chrome state; it says nothing about chrome state being **applied above** it. So:
- Builder A adds `AppearanceProvider` at the root: persisted-local, reads `localStorage`, and does what accessibility controls do — sets `document.documentElement.style.fontSize` or `filter` or `zoom`. Clause 2 admits it. Clause 3 is satisfied: no projected file reads anything.
- Builder B refuses, on the grounds that a provider above the projector *is* the projector reading it.

**Concrete symptom of A, verified against the code.** `useProjectedShell` resets exactly five properties — `overflow` ×2, `scrollbarGutter`, `backgroundColor` ×2. It does not reset `fontSize`, `filter`, `zoom`, `letterSpacing` or `colorScheme`. `filter: brightness(.85)` on `<html>` dims **everything in the window**, `fixed inset-0` included; there is no colour token, no themed edge, and no way for the token scan to see it. And `fontSize` on `<html>` resizes every `rem`-based utility in the projected tree — the projector's scripture overlay is `text-lg` / `text-3xl` (`ProjectorClient.tsx:123-125`), the slideshow HUD is `text-xs`, and both failure branches are `text-4xl` / `text-xl` / `text-lg`. All `rem`. All 28 tests green.

**Sentence to add** (AD-24, clause 2 or 3):
> No provider, at the root or elsewhere, applies an operator-chrome value to `<html>` or `<body>` other than the theme class next-themes owns. A room-facing surface's shell reset is authoritative for the whole root element, and any root-level property a chrome control writes is added to `use-projected-shell.ts` in the same change set — the hook resets a **list**, and the list is part of this decision, not an implementation detail.

---

## P7 — HIGH — `localStorage` + the `storage` event is a same-origin cross-window channel that AD-10 does not name and AD-24 cites only as a hazard

**Units.** *Story 17.5* — "The Presenter Knows When the Projector Is Gone" (`epics.md:294`), whose own constraint is *"AD-10 forbids a server realtime channel, so this is solved locally or not at all — a `closed` poll on the retained window handle, or an acknowledgement added to `present-channel.ts`."*

**Exact AD text each unit reads.** AD-10: *"presenter↔projector sync goes through the single `@/lib/present-channel` `BroadcastChannel` module; **no surface opens its own channel name or message shape.**"* AD-24: *"next-themes syncs across same-origin windows on the `storage` event and a projector window is same-origin"* — stated as the mechanism of a leak, never classified as a channel.

**The incompatible legal choice.**
- Builder A extends `PresentMessage` with a `pong`. AD-10-shaped, and AD-24's tier question agrees: a heartbeat is ephemeral-shared, so it goes on AD-10's channel.
- Builder B writes `localStorage['bic-projector-alive-<id>'] = Date.now()` from the projector and listens for `storage` in the presenter. B's compliance argument is airtight on the letter: no `BroadcastChannel` is opened, so no *channel name* and no *message shape* is invented — AD-10's two prohibitions are about a `BroadcastChannel`, and `present-channel.ts:83-88` is the only thing that opens one. And AD-24's exclusion sentence names *"the deck, another operator, or another browser"*; the projector window is **the same browser**, so persisted-local's own guard does not fire.

**Concrete symptom.** Presenter↔projector state now flows over two mechanisms, and the precedent is set on the cheapest possible increment. The next one is worse: a `localStorage` heartbeat is *persistent*, so a projector that crashed on Thursday leaves an "alive" timestamp behind that survives the browser restart; and once one piece of presenter↔projector state lives on a `storage` key, blank state and the slide index have a compliant path to follow it. That is exactly the split topology AD-10's *Prevents* describes — *"the projector follows one controller and ignores another"* — reached without ever opening a second `BroadcastChannel`. It also lands one storage tier below AD-10's unbuilt plan-identity clause, so the identity check would not cover it.

**Sentence to add** (AD-10, extended, or AD-24 clause 1):
> Any same-origin cross-window mechanism carrying presenter↔projector state is AD-10's single channel — `localStorage` and the `storage` event included. `localStorage` is a **persistence** tier, never a transport: a value written there to be observed by another window of the same browser is a second channel and is refused. The one admitted exception is the `theme` key next-themes owns, whose cross-window sync is why AD-24's closure clause exists.

---

## P8 — MEDIUM — *"genuinely must wrap every route"* is a rhetorical test, and *"exactly one child"* pushes the answer somewhere nobody wants

**Units.** *Story 17.6* (`<Toaster />`, if the decision is yes) versus a hypothetical-but-ordinary *query/cache provider*. The spine's own *Deferred* already calls 17.6 *"the first thing to test AD-24's must-wrap-every-route bar."*

**The incompatible legal choice.** The bar asks about **route coverage**. What actually decides where a provider mounts is **identity continuity across navigation**, and the two questions give opposite answers.
- `<Toaster />`: only `/services/**` and `/admin/**` fire actions today, so "must wrap every route" is **false** and the narrow mount is the compliant one. But a toast fired during a client-side navigation *out* of that subtree unmounts with the layout and is lost — the failure the channel exists to prevent. Builder A mounts at the root citing continuity; Builder B mounts at `services/layout.tsx` citing the literal bar. Both compliant, and B's product is broken in the one case that matters.
- A cache provider: same shape, worse. Mounted narrowly, the cache is destroyed and recreated on every navigation out and back — silently, with no error, just refetches. "Must wrap every route" is still false.

**And the letter of clause 2 forces a bad shape.** It says `layout.tsx` *"reaches the client through exactly **one** child, `src/components/ThemeProvider.tsx`."* `sonner.tsx:3` calls `useTheme()`, so `<Toaster />` must sit **inside** the theme provider. Builder A writes `<ThemeProvider><Toaster />{children}</ThemeProvider>` — now `layout.tsx` names two client components, breaking "exactly one child". Builder B satisfies the letter by mounting `<Toaster />` **inside `ThemeProvider.tsx`**, so a file named ThemeProvider owns a notification surface. The test (`theme-chrome.test.mjs:361-380`) passes for both. The clause counts children when what it means is that the boundary does not move to `layout.tsx` itself.

**Sentence to add** (AD-24, clause 2):
> The bar is not route coverage: a root-level provider is admissible when its value must **survive client-side navigation** — a singleton portal, a cache, a subscription — and inadmissible when a narrower mount would serve. Restate the boundary rule as *"`layout.tsx` carries no `'use client'` and renders no client component other than the root providers it declares"*, and name the providers rather than counting them.

---

## P9 — MEDIUM — The most AD-24-compliant way to add a high-contrast mode silently disarms 29 measured `dark:` overrides

**Units.** *`DESIGN.md` Open Item 6* — non-text contrast fails WCAG 1.4.11 in both themes (`--border` 1.29:1 dark, 1.26:1 light; light focus ring 2.58:1), filed with **no owner** because raising `--border` changes every surface. The natural landing is an opt-in high-contrast mode. Two builders build it.

**Exact AD text each reads.** Clause 1: *"`next-themes` owns the `theme` key and the `attribute="class"` contract that `globals.css:5`'s `@custom-variant dark (&:is(.dark *))` is keyed on; **a second browser-persisted preference extends that mechanism rather than standing one up beside it.**"*

**The incompatible legal choice.**
- Builder A takes *"extends that mechanism"* at its word: `themes={['light','dark','high-contrast']}`, a `.high-contrast { … }` block beside `.dark`, one key, one provider, nothing new stood up. Maximally compliant.
- Builder B adds an independent `.high-contrast` class that composes with `.dark` (`.dark.high-contrast`), which needs a **second** persisted key — the thing clause 1 appears to forbid.

**Concrete symptom of A, verified against the CSS.** `@custom-variant dark (&:is(.dark *))` (`globals.css:5`) is keyed on the class `dark`. next-themes sets **one** class at a time. In `high-contrast`, `.dark` is absent, so **every `dark:` utility in `src/` stops applying** — the 29 utilities at 18 sites in 8 files that Story 17.1's remediation reviewed and measured one by one, plus the badge and logout halves added to fix three sub-AA pairs, plus `ThemeToggle`'s `dark:bg-card/50` override, whose absence lets `ui/button.tsx`'s `dark:bg-input/30` back in. A high-contrast theme that is darker than white would therefore render the *light* chromatic shades — `text-indigo-600` at 2.54:1, `text-red-600` at 3.76:1 — the exact failures that story fixed. No test fires: `theme-chrome.test.mjs:534-552` asserts the `dark:` halves *exist in the source*, not that they resolve.

**Sentence to add** (AD-24, clause 1):
> *"Extends that mechanism"* means one storage key per preference and next-themes' own `attribute="class"` contract; it does **not** mean encoding a second preference as a third theme name. The palette's `dark` variant is keyed on the class `dark` and next-themes sets one class, so any additional appearance mode composes with `.dark` rather than replacing it, and ships with the variant definition that makes that true.

---

## P10 — MEDIUM — Browser-persisted state has no key vocabulary, no version, and no migration path, and AD-21 is scoped so that it never will

**Units.** Two builders adding the second and third browser-persisted preference (sidebar collapsed; run-sheet column widths; last-used hymnal tab).

**Exact AD text each reads.** AD-21: *"**All persisted data** shares one monotonic version number in `settings`… one counter for the whole database."* AD-24: persisted-local *"lives in that browser's `localStorage` and nowhere else: not in SQLite, not under `DB_PATH`, and therefore **not backed up**."*

**The incompatible legal choice.** Builder A uses one flat key per preference (`bic-sidebar-collapsed`). Builder B uses one namespaced JSON blob (`bic.chrome`). Both compliant; neither can read the other; and the third builder inherits both. AD-21's counter is explicitly a `settings` counter, so *"all persisted data"* silently means "all persisted **database** data" and the browser tier is versionless by construction. There is no key registry, no validator, and no way for a deploy to reach a stale value — Story 17.1 already met this and dismissed it as noise: *"a `localStorage.theme` value outside `ORDER` (e.g. hand-edited to `blue`) is reported as `system` and its stale class is never removed."* That is the versioning hole appearing at the smallest possible scale.

This also compounds the spine's own *Deferred* item on durability. That item says losing `DB_PATH` loses the whole ordered deck; AD-24 adds a second store that is not backed up, has no inventory, and — after P3 — may legally hold registry payloads.

**Sentence to add** (AD-24, clause 1):
> Browser-persisted state is one namespaced key per preference, listed in one module that owns the vocabulary, and every read validates against the current shape and falls back to the default on anything it does not recognise — the same fail-closed posture AD-5, AD-8 and AD-17 take. There is no migration channel to a value in an operator's browser, so an unrecognised value is discarded, never repaired.

---

## P11 — MEDIUM — Three tiers are each defensible for the presenter's live position, and AD-24's tie-breaker begs the question

**Units.** *Story 17.5* (the presenter must survive a projector dying) versus a hand-off story that does not exist yet but will (a second operator takes over mid-service).

**The incompatible legal choice.** "Last presented slide index":
- **Ephemeral-shared** — it is already on AD-10's wire (`PresentMessage.sync.index`), and a live session is what it describes. Compliant.
- **Persisted-local** — so an accidental reload of the presenter window resumes where the service is, rather than at slide 1. *"Nothing but this operator's own browser depends on it."* Compliant, and it is the wording AD-24 used to justify the theme.
- **Persisted-shared** — so a hand-off to a second laptop resumes correctly. *"Who must agree on it"* → both operators. Compliant.

AD-24's tie-breaker is *"a value the deck depends on is never persisted-local."* The deck's **content** does not depend on the index; the **presentation** does. Whether "the deck" means the artifact sequence or what is on the screen right now is the entire question, and the clause assumes it answered. The three outcomes are mutually exclusive and each fails differently: (1) loses position on reload, (2) diverges silently the moment two browsers are involved, (3) writes per-service state into a table AD-23 says has no per-service concept and AD-6's precondition does not reach.

**Sentence to add** (AD-24, clause 1):
> *"The deck"* in this decision means **anything the congregation sees or that determines it**, not only the artifact sequence — the current position, the blank state and the live transition included. A value in that set is never persisted-local, whichever window holds it.

---

## P12 — LOW — The `className` guard on the projected wrapper reads one spelling

`ArtifactSlide` still accepts and splices `className` (`ArtifactSlide.tsx:222-233`). The guard (`theme-chrome.test.mjs:259-280`) scans `.tsx` files for `/<(SlideView|ArtifactSlide)\b([^>]*)>/` and then `/\bclassName\s*=/`. It does not see `{...props}` spread, an alias (`const S = ArtifactSlide`), or `createElement(ArtifactSlide, { className })`. The spine's *Deferred* names the ceiling as *"a class name composed at runtime"* — a spread is not a composed class name and is not covered by that disclaimer. Two builders wrapping `ArtifactSlide` for a preview surface, one passing props explicitly and one spreading, get different enforcement. Cheap to close: keep `SlideView`'s posture and delete `ArtifactSlide`'s `className` prop, since only `SlideView` and the two presenter surfaces render it.

---

## Attacks the code forecloses — recorded so they are not re-derived as findings

1. **An operator root `font-size` resizing the *slides*.** Foreclosed for the artifact tree: `toCssGeometry` emits `%` for geometry and `cqh` for font size against the stage (`render-model.ts:148-156`), so no artifact dimension is `rem`-relative. It is **not** foreclosed for the projector's scripture overlay, the slideshow HUD, or either failure branch, which are all Tailwind `text-*` utilities — see P6.
2. **`color-scheme: dark` already reaching the room-facing window.** It does — next-themes writes it on `<html>` and the projector window is inside the provider — but it paints nothing there: no form control, no UA scrollbar (the shell hook sets `overflow: hidden`), and the background is pinned to a literal. Worth knowing that AD-24's *"never read operator chrome state, in any form, under any setting"* is already narrower in fact than in wording; the invariant that actually holds is *no theme-dependent value paints*.
3. **A theme token reaching the projected tree through a component import.** Genuinely closed. The closure test now follows relative, `@/app/…` and `dynamic(() => import(…))` specifiers, comments are stripped, and the edge guard was negative-tested on twelve spellings. The hole is `@/lib` (P2), not the component graph.
4. **Sidebar-collapsed and preview-zoom as tier disputes.** Both builders land on persisted-local and agree. Not divergences — say so rather than padding the list. The *canvas editor's* zoom/pan is the one exception worth a line: Fabric's `viewportTransform` is canvas state, AD-13 says React reads canvas state *only on save*, so persisting it at all requires reading it at another moment, and AD-24 clause 1 now offers a home AD-13 never contemplated. Small, but it is a seam.
5. **Moving AD-23's live transition override to `localStorage` under clause 1.** Blocked: AD-23 states the override travels on AD-10's channel and *"nothing stores it"*, and clause 1 routes ephemeral-shared to the same channel. The *adjacent* move is not blocked — persisting the presenter's **last chosen** live style as "the last position of a control in my browser", which is textbook operator chrome, and which brings a projector up on a style `settings` does not hold and the downloaded PPTX does not match. That is AD-23's *Prevents* reached through AD-24 clause 1, and it is covered by P11's proposed sentence.

---

## Summary of sentences to add

| # | Sev | AD to amend | What the new sentence must decide |
| --- | --- | --- | --- |
| P1 | CRITICAL | AD-24 c3 | How a **server-rendered** room-facing surface reaches the shell reset, and that the shell assertion covers it |
| P2 | CRITICAL | AD-24 c3 | That the closure gate is closed over `@/lib` modules that return styles or write to `document` |
| P3 | CRITICAL | AD-24 c1 | That persisted-local holds chrome only — never domain data or a pending write |
| P4 | HIGH | AD-24 c1 | The fourth tier (per-account), and that `settings` stays admin-write-only |
| P5 | HIGH | *Client state* row | That room-facing surfaces are closed to **persisted-local**, not to all three tiers |
| P6 | HIGH | AD-24 c2/c3 | That no chrome value is applied to `html`/`body` outside the theme class, and the hook's property list is part of the decision |
| P7 | HIGH | AD-10 / AD-24 c1 | That `localStorage` + `storage` is AD-10's channel, and is a persistence tier not a transport |
| P8 | MEDIUM | AD-24 c2 | Continuity-across-navigation as the real bar, and the boundary rule restated without counting children |
| P9 | MEDIUM | AD-24 c1 | That a second preference is not a third theme name |
| P10 | MEDIUM | AD-24 c1 | A key vocabulary, per-read validation, and that there is no migration channel into a browser |
| P11 | MEDIUM | AD-24 c1 | What *"the deck"* means in the tie-breaker |
| P12 | LOW | test only | Delete `ArtifactSlide`'s `className` prop |

**One structural observation for whoever amends.** Every CRITICAL above lands on the same fault line: AD-24 is written about **colour** (tokens, literals, palettes, `.dark`) while the hazard it names is **any operator-persisted value that paints or that escapes the write regime**. Two of the three enforcement mechanisms it cites are colour scanners, the third is a background reset, and the storage clause's exclusion sentence is scoped to the deck. A single re-framing — *operator-persisted state is closed out of the room-facing surface and out of every path into SQLite, of which colour is one instance* — would close P1, P2, P3, P6 and P7 together, where five separate clauses will not.
