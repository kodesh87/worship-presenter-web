# Reviewer Gate — Adversarial Two-Units Lens (Update, AD-24 ratification)

**Target:** `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md`
**Date:** 2026-07-31 · **Intent:** Update — ratification of the two inline `bmad-dev-story` paragraphs (`AD-24`'s Story 17.7 owner paragraph, and the *Deferred* shell-gap entry) plus the amended shell / gap / tier clauses. Report only; the spine was not edited.
**Lens:** construct two units one level down — two stories, two surfaces, two developers — that each obey **every** `AD` to the letter and still build incompatibly. Every pair is a hole to close with a new or tightened `AD`.
**Independence:** this run's four lenses were launched blind. `reviews/review-adversarial-two-units-2026-07-31-ad24.md` (the pre-amendment run) *was* read afterwards, deliberately, so that this report does not re-file what the amendment already answered and does not re-derive its foreclosed list. Where an attack below descends from one of that run's findings it says so and states what is new. Every claim was verified against `src/`, `tests/`, `epics.md`, `sprint-status.yaml`, `deferred-work.md` and `node_modules/next/dist/docs/` before it was written down.

**Baseline measured at this run:** `tests/theme-chrome.test.mjs` **43/43 pass**. `grep -c componentImports tests/theme-chrome.test.mjs` → **0** (the `@/lib` directory exemption really is gone). No `not-found.tsx`, `error.tsx`, `global-error.tsx` or `template.tsx` anywhere under `src/`. No `matchMedia`, `useMediaQuery`, `prefers-reduced-motion` or `prefers-color-scheme` in `src/`. No `requestFullscreen` in `src/`. `resetProjectedShellForTest` has exactly four call sites, all in the test file.

---

## Verdict

The amendments are a real improvement and two of them close prior findings outright: the `@/lib` directory exemption is gone, and the first-paint gap is now named, owned (Story 17.7 / `17-7-projected-shell-route-group`) and defended by a reason that survives the refutation the earlier one did not.

But the ratified text now **mandates a second mechanism for the same hazard while still saying there is one implementation**, and the two mechanisms are not interchangeable in the one respect the amendment calls an invariant. `claimProjectedShell` is reference-counted because the reset must be **released** when the last surface leaves; a CSS or server-emitted-class closure has no release, and Next's own documentation states that the stylesheet mechanism *does not remove stylesheets as you navigate between routes*. So the sentence *"one shared implementation, never its own copy"* is about to govern a pair of implementations that share a property list and cannot share a lifetime — and nothing in AD-24 says which one owns `html`/`body`, or what the other one does when both are live. That is the ratification's central hole, and it is reachable by two builders who each quote the spine correctly.

Three further holes are structural rather than editorial: the mechanism the gap clause now requires (CSS) is the one file class its own gate cannot read at all; *"a server-emitted class"* has exactly one reachable encoding in App Router and it runs through `src/proxy.ts` or the root layout, which couples AD-24's paint closure to AD-5's authorization regex; and the shared implementation's queued third consumer (`PresenterOperator`, per `deferred-work.md:206`) is an **operator** surface by AD-24's own last clause, so the literal `#000000` the guard pins is the wrong colour for it — and the obvious fix (a colour parameter) reopens the leak past a guard that only reads the default.

**Counts:** 3 CRITICAL · 4 HIGH · 5 MEDIUM · 6 attacks the code forecloses (recorded, not dropped)

**Units used.** Shipped: Story 17.1's two full-screen clients, their two Server-Component route shells, `PresenterOperator`, `SlideGridDialog`, the admin settings surface. Registered and real: **17.2** `muted-foreground`, **17.4** canvas dirty-state, **17.5** projector liveness, **17.6** toast decision, **17.7** projected-shell route group, **20.7** SongSet bounded config. Queued-with-evidence: `deferred-work.md:206` (the presenter shell), `deferred-work.md:216-218` (the second document), the *Deferred* `notFound()` entry.

---

## A1 — CRITICAL — The shared implementation is reference-counted so it can *release*; the mandated CSS closure cannot release, and Next documents that it will not be removed on navigation

**The two units.**
- **Unit A — Story 17.7** (`17-7-projected-shell-route-group`), implementing the owner's chosen shape: one route-group layout owning every room-facing URL, closing first paint with CSS.
- **Unit B — any later full-screen room-facing client surface** (a stage display / confidence monitor is the obvious next one; `epics.md`'s Epic 17 preamble already speaks of "the projected output" generically), which reads clause 3 and calls `useProjectedShell()`.

**The exact `AD` text each obeys.**
- Unit B obeys AD-24 clause 3 verbatim: *"a full-screen room-facing **client** surface **neutralises the app shell it inherits** — `html`/`body` background, `overflow`, and `scrollbar-gutter` — through **one shared implementation, never its own copy**"*, and joins `FULL_SCREEN`, which asserts `/useProjectedShell\(\)/` on the file.
- Unit A obeys the ratified gap clause verbatim: *"**no browser-side mechanism closes this gap — hook, direct DOM call, or `useLayoutEffect` alike.** The paint that leaks is the **server's own first paint**, which is why the closing candidates below are CSS or a server-emitted class"*, and *Deferred*: *"a route-group layout is itself a Server Component, so it closes first paint only by emitting CSS or a class."*

**The divergence.** The reset is not one property list — it is a property list **plus a lifetime**, and the amendment names only the list. `src/lib/projected-shell.ts:56-64` claims five properties; `:74-100` is the lifetime, and AD-24 says of it: *"The reference counting in that shared implementation is **an invariant of it, not an optimisation**"* — because *"a snapshot/restore pair written for one consumer hands the second surface's black back to the operator's whole app shell permanently."* A CSS closure has **no** snapshot and **no** restore. It is not a stricter or looser implementation of the same thing; it is an implementation of half of it.

Verified from Next's own documentation, `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md:294`:

> Global styles can be imported into any layout, page, or component inside the `app` directory. However, since Next.js uses React's built-in support for stylesheets to integrate with Suspense, this currently does not remove stylesheets as you navigate between routes which can lead to conflicts.

So Unit A's compliant closure, once loaded, **stays loaded** for the rest of the SPA session. Its rule set is exactly the one `claimProjectedShell` writes — `html`/`body` background `#000000`, `overflow: hidden`, `scrollbar-gutter: auto`. The operator opens `/services/3/slideshow`, presses Exit (`SlideshowClient.tsx:70` is a client `<Link>`, so this is a client-side navigation, not a document load), and lands on the run sheet with the hub's `html`/`body` pinned black and unable to scroll — in light theme, with no error, until they hard-reload. That is the *inverse* of the leak AD-24 exists to close, produced by the mechanism AD-24 now mandates, and produced *because* the mechanism cannot release.

And the two mechanisms interfere in the other direction too. `claimProjectedShell` writes **inline** styles, which out-specify any stylesheet rule; its release writes back the snapshotted value, which is `''` (both callers run under a shell that sets these in CSS, never inline). `''` means "fall through to the cascade" — correct while Unit A's CSS is still in the document, wrong the instant it is not. So the DOM claim's restore path — the half AD-24 calls an invariant, and the only half `tests/theme-chrome.test.mjs:573-635` exercises as behaviour — becomes a **no-op whose correctness depends on a stylesheet the module knows nothing about.**

Two builders therefore diverge on the plainest possible question, and both quote the spine:
- Builder A concludes 17.7's CSS *is* now "the one shared implementation" and deletes the two `useProjectedShell()` calls. `FULL_SCREEN`'s two assertions fail, so either the guard is edited (deleting the only behavioural coverage of the restore path) or the deletion is reverted.
- Builder B keeps both, on the ground that clause 3 names the hook for client surfaces and the gap clause names CSS for the server paint. Now two mechanisms own five properties, the CSS list and `CLAIMED` drift the first time a sixth property is added (prior run's P6 named `fontSize`, `filter`, `zoom`, `colorScheme` as the plausible sixth), and no test compares them.

**Does the code foreclose it today?** No — and it cannot, because Unit A does not exist yet. This is the single highest-value thing to decide *before* 17.7 is written rather than after. Today's tree has exactly one mechanism and the guard covers it.

**The `AD` change that closes it.** AD-24 clause 3 must stop describing "one implementation" and start describing **one owner of the property list and one owner of the lifetime**:

> The room-facing shell reset is **one list of properties with one owner per document**. The route-group layout owns the reset for every room-facing URL; a client surface inside it does not claim the shell at all. If the closure is expressed in CSS it must be scoped so that it cannot survive a client-side navigation out of the room-facing route group — Next does not remove stylesheets on navigation, so a global stylesheet is not that scoping — and the property list lives in one module that both the CSS and any DOM fallback are generated from, asserted equal by the closure gate.

**Severity: CRITICAL.** It converts the ratified sentence into a rule two builders read incompatibly, and the losing reading strands the operator's whole hub.

---

## A2 — CRITICAL — The gap clause mandates CSS, and CSS is the one file class the closure gate structurally cannot read

**The two units.**
- **Unit A — Story 17.7**, whose closure is a CSS rule set containing only literals.
- **Unit B — any later room-facing CSS**: a projector safe-area inset, an announcement full-bleed rule, a `@media (prefers-color-scheme: dark)` block added because "the projected surface should look right on both", or 20.7's SongSet background styling reaching for a stylesheet now that a stylesheet is the sanctioned room-facing mechanism.

**The exact `AD` text each obeys.** Both obey the gap clause's *"the closing candidates below are CSS or a server-emitted class"* and *Deferred*'s *"the closure has to be CSS or a server-emitted class."* Neither violates clause 3's token rule, because clause 3's mechanisms are stated over the **render tree** (*"the projected render tree paints in literal colours, carrying no theme token"*) and enforced over TypeScript source.

**The divergence.** `tests/theme-chrome.test.mjs` reads exactly one CSS file, `src/app/globals.css`, and reads it **only to harvest `--color-*` names** for the token alternation (`:181-190`). No CSS file is ever token-scanned. Worse, the walk cannot even *see* a stylesheet import: `moduleImports` (`:384-401`) resolves a specifier by trying `.tsx`, `.ts`, `/index.tsx`, `/index.ts` and returns nothing otherwise, so `import './projected.css'` from a projected file resolves to `null` and is **silently dropped** — no offender, no warning, no count. I reproduced the walk against the shipped `PROJECTED` set: 12 modules scanned, zero unresolved specifiers today, and a `.css` specifier added to any of the six would leave that number at zero.

So Unit B writes `background: var(--background)` — or, more likely, a `@media (prefers-color-scheme: dark)` block, which is a theme dependency with no token name in it at all — into the room-facing stylesheet, and 43/43 stays green. AD-24's *Deferred* entry already lists *"a theme token arriving through a CSS file rather than a utility class"* as one of five things the gate structurally cannot see. That disclaimer was written when **no CSS was expected anywhere near the projected path.** The same amendment that keeps the disclaimer makes CSS the primary closure mechanism, which promotes a known blind spot into the load-bearing one.

**Does the code foreclose it today?** Yes, by absence only — there is no room-facing CSS, and `globals.css` is imported solely by `src/app/layout.tsx`. **Forecloses-today-but-unenforced**, and the absence ends the day 17.7 lands.

**The `AD` change that closes it.**

> The room-facing closure is **one named stylesheet**, and it is inside the closure gate: the gate scans it for `--color-*` references, for `@media (prefers-color-scheme…)` and for `.dark`-keyed selectors, and it fails if any CSS reachable from a room-facing route contains one. A CSS or asset specifier that the gate's resolver cannot resolve is a **failure**, never a silent skip.

**Severity: CRITICAL.** The gate is what AD-24 cites as the thing that keeps the surface closed; the amendment routes the closure around it.

---

## A3 — CRITICAL — *"A server-emitted class"* has one reachable encoding, and it runs through the root layout or `src/proxy.ts` — so two units close one hazard with two blast radii, one of them keyed on AD-5's authorization regex

**The two units.**
- **Unit A — Story 17.7**, closing first paint for the two projected routes from the route-group layout.
- **Unit B — the `notFound()` closure**, which the spine files as a *separate* `Deferred` item: *"No `not-found.tsx`, `error.tsx` or `global-error.tsx` exists anywhere under `src/`, so the framework's own page paints full-viewport in the operator's theme at the same room-facing URLs… worth landing with that gap rather than separately."* "Worth landing with" is not "must land with", and `notFound()` is reachable at six sites (verified: `projector/page.tsx:37,49,55` and `slideshow/page.tsx:38,50,56`).

**The exact `AD` text each obeys.** Both obey *"the closure has to be CSS or a server-emitted class."*

**The divergence.** *"A server-emitted class"* sounds like one mechanism and is not, because of a framework constraint the spine does not state. Verified from `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/layout.md:140` — *"The root layout **must** define `<html>` and `<body>` tags"* — and `01-getting-started/03-layouts-and-pages.md:89`. A nested layout, including a route-group layout, **cannot render `<html>` or `<body>`**, so it cannot put a class on them. The reachable encodings are therefore:

1. A stylesheet or `<style>` from the group layout — A1 and A2 above.
2. A class on `<html>` from **`src/app/layout.tsx`**, the only file that renders it. But the root layout receives no pathname, so knowing *which* route is rendering requires `headers()` (or `cookies()`), which makes the root layout dynamic for **every route in the app**, and requires something upstream to set that header — and the only thing upstream is `src/proxy.ts`.

Unit B's compliant move is (2), because a `not-found.tsx` placed beside the projected routes does not cover a `notFound()` thrown anywhere else, and the *root* 404 is rendered inside the root layout with no group layout above it. Unit A's compliant move is (1). Now:

- One hazard has two closures with different reach, and each builder can point at the spine.
- Closure (2) makes AD-24's paint rule a **consumer of AD-5's `config.matcher`**. AD-5 states that regex *"is the authorization boundary"* and that *"a new exclusion ships together with its assertion in `tests/proxy-matcher.test.mjs` in the same change set."* A future exclusion — added for an authorization reason, reviewed as an authorization change, asserted by an authorization test — would then also silently remove the room-facing paint closure from that path. AD-5's own *Prevents* is about privilege; nothing in that change set would mention the projector.
- Closure (2) also costs static rendering app-wide, which no `AD` prices, and it puts operator-adjacent request state into the root Server Component — the exact move AD-24's cookie clause refuses for chrome preferences (*"a cookie is the one browser-persisted home the **server** can read, so moving a chrome preference there… would hand a room-facing server render access to operator chrome"*). Reading a *proxy-set path marker* is not reading a preference, so the cookie clause does not forbid it, and the resemblance is close enough that two builders will disagree about whether it does.

**Does the code foreclose it today?** Partly. `src/app/layout.tsx` reads no headers and renders `<html>`/`<body>` unconditionally; `src/proxy.ts` sets only `Cache-Control` and `Vary` (`:32-36`). Nothing forecloses either encoding from being chosen. **Unenforced.**

**The `AD` change that closes it.**

> Of the two closure encodings, **only the route-scoped stylesheet is permitted**; a class on `<html>` is refused, because the only file that can render `<html>` is the root layout and the only way it can know the route is a request header set by `src/proxy.ts` — which would make the room-facing paint rule a second consumer of the authorization matcher. The `notFound()` / `error` boundaries for room-facing URLs land **inside the room-facing route group**, in the same change set as the closure, and join `FULL_SCREEN`.

**Severity: CRITICAL.** One of the two mandated encodings quietly couples a paint invariant to the authorization boundary, and the spine offers them as equals.

---

## A4 — HIGH — The closure walk stops at the first `.ts` hop, and today's amendment created exactly one new `.ts` hop

**The two units.** Two builders adding projected-surface logic on the same day: **Unit A** writes `src/lib/projected-tone.tsx` (a JSX helper); **Unit B** writes `src/lib/projected-style.ts` returning a `CSSProperties` that a projected client spreads onto its wrapper.

**The exact `AD` text each obeys.** *Deferred*: *"**No directory is exempt by name any more** … a `@/lib` module now has its own tokens scanned like any other."* Both units' own files are scanned. Both are compliant.

**The divergence.** The walk enqueues `.tsx` only (`theme-chrome.test.mjs:432`), so a `.ts` module is scanned **as a leaf** and its own imports are never followed. Unit A's helper is walked, so a token in anything *it* imports is caught. Unit B's module is scanned once, and a token in `src/lib/palette-map.ts` that it imports is invisible. Same rule, opposite enforcement, decided by a file extension.

I reproduced the walk and then re-ran it with `.ts` enqueued. Shipped walk: **12 modules scanned.** With `.ts` enqueued: **26.** The 14 reachable-but-never-scanned modules are:

```
src/lib/artifacts/hydrate.ts        src/lib/parser.ts
src/lib/artifacts/registry-snapshot.ts  src/lib/projected-shell.ts
src/lib/auth/password.ts            src/lib/registry/asset-safety.ts
src/lib/hymn-sections.ts            src/lib/registry/seed.ts
src/lib/images.ts                   src/lib/registry/store.ts
src/lib/lyrics.ts                   src/lib/registry/types.ts
src/lib/uploads.ts                  src/lib/registry/validate.ts
```

and the leaf `.ts` modules whose children are dropped are `announcements.ts`, `db/index.ts`, `parsed-fields.ts`, `slide-plan.ts` and — **this is the new part** — `use-projected-shell.ts`, whose single child is `projected-shell.ts`.

That edge is the one **today's amendment created.** Splitting the reset into a hook plus a DOM module produced a `.ts` module reached from a `.ts` module, i.e. the first hop past the walk's boundary, and the thing on the far side of it is the module that writes directly to `document.documentElement` and `document.body`. It is covered — but by a **bespoke by-name assertion** (`:547-557`), not by the walk. So the coverage is a list entry, and the next module added under the hook (17.7's shared property list, per A1's proposed fix, or a `projected-shell-css.ts`) inherits neither.

Two further shapes belong with this and are already named in *Deferred*: `moduleImports` matches `import … from` and `import(…)` but not `export … from` (live at `src/lib/parsed-fields.ts:432`), and the walk goes downward only.

**Does the code foreclose it today?** Yes — none of the 14 carries a theme token. **Forecloses-today-but-unenforced**, and it is the third round in which "a rule applied too narrowly" was closed by widening a list; *Deferred* says so itself and asks for the criterion to be encoded. This is that ask, with the new evidence that the amendment moved a load-bearing module to the far side of the boundary.

**The `AD` change that closes it.**

> The closure gate is closed over **every module reachable from a room-facing file, at every hop, whatever the extension**, and over every re-export form. A specifier the gate cannot resolve fails the gate. The criterion — *reachable from a room-facing surface* — is what the gate encodes; a file list is a cache of that criterion, never its definition.

**Severity: HIGH** (structurally MEDIUM today because nothing leaks; HIGH because AD-24 names this gate as its enforcement and the amendment widened what it must cover).

---

## A5 — HIGH — *"One shared implementation"* now has a queued **operator-facing** consumer, and the guard pins the room-facing colour

**The two units.**
- **Unit A — Story 17.7's route-group layout**, room-facing. AD-24 requires literal colours and `theme-chrome.test.mjs:550` pins `/'backgroundColor',\s*'#000000'/` in the shared module.
- **Unit B — the presenter shell fix**, filed at `deferred-work.md:206-207` and named in Story 17.7's own entry as *"a third consumer… already waiting"*: `PresenterOperator` pins `.dark` on its wrapper but not on the shell, so a light-theme operator gets a white canvas and a white gutter strip framing the dark presenter.

**The exact `AD` text each obeys.** Unit A obeys clause 3 (*"one shared implementation, never its own copy"*, literal colours). Unit B obeys the same sentence — the whole point of extracting the module was that the mechanism is identical — **and** AD-24's final clause, which classifies its surface: *"The two surfaces that pin `.dark` on their own wrapper are **operator surfaces, not room-facing.**"*

**The divergence.** The shared implementation hard-codes `#000000` for a **room-facing** reason (`projected-shell.ts:21-23`: *"The colour is the literal `#000000` these surfaces already paint themselves, never a theme token"*). Unit B's surface is not room-facing and `#000000` is not its colour: `PresenterOperator` renders on the `.dark` palette, whose `--background` is `oklch(0.145 0 0)` (`globals.css:87`) — a dark grey, not black. So Unit B has three moves and each is compliant:

1. Call the shared module and accept a literal-black frame around a `oklch(0.145)` presenter — a visible seam on the surface whose rationale is *"used in a dim sanctuary"*.
2. Parameterise it: `claimProjectedShell(doc, '#000000')`. The guard still passes — it matches the literal in the `CLAIMED` table, which remains the default. A room-facing caller may now pass anything, including a value read from `getComputedStyle(document.documentElement)`, and **no test in the file fires**: the token scan reads source text and a computed value has no token in it.
3. Write its own two-line reset — forbidden by *"never its own copy"*, which is precisely why (2) is the attractive answer.

So the amendment's *"never its own copy"* pressure, applied to a consumer AD-24 itself classifies as non-room-facing, pushes toward the one change that reopens the leak past the guard.

**Does the code foreclose it today?** Yes — the module takes no colour and the guard pins the literal. **Forecloses-today-but-unenforced**, with a queued consumer that makes the parameter the natural next commit.

**The `AD` change that closes it.**

> The shell reset is **room-facing only and literal-valued**: it takes no colour, no parameter, and no consumer outside the room-facing route group. An operator surface that needs the shell behind it to match its own pinned palette does so by a separate, named mechanism, and that mechanism is not in the room-facing closure's module or property list.

**Severity: HIGH.**

---

## A6 — HIGH — Three tiers describe *stored* state, and the room-facing window already reads an unstored one: the machine

**The two units.**
- **Unit A** honours `prefers-reduced-motion` in `src/lib/use-slide-transition.ts`, so an operator who has set that OS preference gets cuts instead of fades.
- **Unit B** adds a motion preference as an app-wide `settings` row beside `slide_transition`.

**The exact `AD` text each obeys.** AD-24 clause 1 is scoped to storage: *"**Application** state — anything the product decides to remember — reaches one of three homes"* — persisted-shared, persisted-local, ephemeral-shared. Unit A remembers **nothing**, so no tier applies and no tier is violated. AD-23 is satisfied too: no new style is added, `src/lib/transitions.ts` still describes each style exactly once, and *"no surface keeps a default of its own"* is untouched — Unit A does not hold a default, it declines to animate. Unit B obeys clause 1's persisted-shared branch and AD-23's *"one app-wide value in `settings`."*

**The divergence.** Unit A makes the **projected animation a function of the machine the projected window is running on**, while the PPTX keeps the fade it was generated with. That is AD-23's *Prevents* verbatim — *"a deck that fades in PowerPoint and cuts on the projector"* — reached without touching the transition table, without a second default, and without storing anything. And it is invisible to AD-24's closure clause, because that clause forbids reading *operator chrome state* and its three tiers are three **storage** mechanisms; a media query is a fourth source that the decision never names.

This is not hypothetical drift from a real seam: `src/components/ThemeProvider.tsx` ships `defaultTheme="system"` with `enableSystem`, so the resolved theme class on the room-facing window's `<html>` is **already** a function of `prefers-color-scheme` on the machine that loaded the URL. AD-24 tolerates that because literals paint everything — the prior run recorded the same observation about `color-scheme: dark` reaching the room-facing window — but the *rule* offers a builder no reason not to read a media query directly on a projected surface, and `prefers-contrast`, `forced-colors` and `prefers-reduced-transparency` are all one line away from doing something visible. `forced-colors: active` in particular overrides author colours including literals, which is the one appearance signal that defeats AD-24's whole first mechanism.

**Does the code foreclose it today?** Yes — verified: no `matchMedia`, `useMediaQuery`, `prefers-reduced-motion` or `prefers-color-scheme` anywhere in `src/`. **Forecloses-today-but-unenforced**, and Story 17.2 (contrast) plus `DESIGN.md` Open Item 6 (non-text contrast, no owner) are exactly the stories that reach for `prefers-contrast`.

**The `AD` change that closes it.**

> The closure clause is about **any value that varies with the operator's machine, browser or user agent — stored or not.** A room-facing surface reads no appearance, motion or contrast media query; what the congregation sees is a function of the plan (AD-7/AD-12) and of `settings` (AD-23), and of nothing else on the machine that happens to render it. If a room-facing surface must respond to `forced-colors`, that is a product decision recorded here, not a CSS default inherited from the hub.

**Severity: HIGH.**

---

## A7 — HIGH — An operator-chrome *filter* is not an order recomputation, and AD-10's bare index turns it into two different screens

**The two units.**
- **Unit A** adds an operator preference — "hide announcement slides in my presenter strip", or "collapse the blank/title rows" — persisted-local. The presenter's slide strip is dense (`PresenterOperator.tsx` renders a grid, a row view and a dialog over the same array), so this is an ordinary chrome request, and Story 17.4-shaped work on the operator surface is where it would land.
- **Unit B** adds "resume at the slide I was on" as persisted-local (the prior run's P11 established that all three tiers are defensible for the index; this unit takes the tier AD-24's theme precedent endorses).

**The exact `AD` text each obeys.**
- AD-7: *"`buildSlidePlan` is the single source of slide order and content for every surface. No surface recomputes order from service fields or keeps its own ordering logic."* Neither unit recomputes order or reads a service field — Unit A **filters a rendered list**, Unit B **remembers a position**. The plan is untouched.
- AD-24 clause 1: a view preference, in `localStorage`, that nothing but this operator's own eyes depends on. Clause 3: no room-facing surface reads it — literally true, the projector never sees the key.
- AD-10: no second channel, no new message shape.

**The divergence.** Verified in the code: the presenter posts a **bare array index into its own array** — `PresenterOperator.tsx:296-304` sets `indexRef.current = clamped` and broadcasts `index: clamped`, where `clamped = clampSlideIndex(next, slides.length)` over the presenter's own `slides` prop; the projector is an independent `force-dynamic` render (`projector/page.tsx:28`) indexing its own array. Filter three announcement slides out of the presenter's list and every index after them refers to a different slide on the two screens. The operator advances to what their screen calls slide 14; the congregation sees slide 17.

AD-10's *unbuilt* plan identity does not close this and would not have: the identity fingerprints *"the snapshot and resolved announcement set that produced the deck"*, and both ends built the **same** plan. The divergence is in what each end is *indexing*, which no fingerprint of the plan can see. So AD-24's own *Prevents* — *"a client-persisted value that **paints** becoming a third structural channel to the congregation's screen, alongside `buildSlidePlan` (AD-7) and the BroadcastChannel (AD-10)"* — is reached by a value that never paints anything on the room-facing screen at all. It paints by **changing what the index means**.

Unit B is the same defect at one remove: a resumed index restored from `localStorage` and broadcast on mount puts the projector wherever this browser was last time, including on a different service.

**Does the code foreclose it today?** Yes — no filter and no persisted index exist; `clampSlideIndex` clamps to the presenter's own `slides.length`, which is the unfiltered plan. **Forecloses-today-but-unenforced.**

**The `AD` change that closes it.** AD-7, extended (this belongs in AD-7, not AD-24, because it is an order/identity rule):

> The index on AD-10's channel is an index **into the plan as `buildSlidePlan` returned it**. No surface presents, navigates or broadcasts a filtered, reordered or resumed derivative of that sequence; an operator view that hides entries maps back to the plan index before anything leaves the window. A persisted position is never restored onto the channel.

**Severity: HIGH.**

---

## A8 — MEDIUM — The new cross-window clause either forbids the theme or licenses operator chrome onto AD-10's channel, and its identity requirement cannot be satisfied today

**The two units.** **Unit A** adds a second browser-persisted chrome preference (presenter font size, run-sheet density) as persisted-local, citing the theme as precedent. **Unit B** reads the new clause literally and puts a cross-window chrome value on AD-10's channel instead.

**The exact `AD` text each obeys.** The amended clause: *"Writing a key fires a `storage` event in every other same-origin window… **Presenter↔projector coordination — anything one surface writes so that *another surface* will act on it — travels over AD-10's channel and carries its plan identity.** Persisted-local is for state a browser keeps for **itself**; that it happens to reach a sibling window is a property to contain, never a transport to use."*

**The divergence.** The clause's test is *"anything one surface writes so that another surface will act on it"*, and the **theme key already meets it**. `src/lib/projected-shell.ts:16-19` states the mechanism as fact: *"Story 17.1 gives the operator a theme, and next-themes syncs across same-origin windows on the `storage` event, so without this the strip would follow the operator's choice live, mid-service."* The projector window *acts on* a key the operator's window wrote. So:

- Unit A's precedent is a key that, read strictly, the same paragraph reclassifies as AD-10 traffic — while clause 1 simultaneously says *"`next-themes` owns the `theme` key"* and *"a second browser-persisted preference **extends that mechanism**."* Extend the mechanism and you extend the cross-window write.
- Unit B's literal compliance is worse than A's non-compliance: it puts **operator chrome onto the wire the room-facing surface reads**. The *Client state* convention row says room-facing surfaces *"do read `settings` (AD-23's `slide_transition`) and the channel"*, so B has just built the channel-shaped version of the leak AD-24 exists to close, in obedience to AD-24.
- And *"carries its plan identity"* is **unsatisfiable today**: AD-10's own gap says `PresentMessage` has no identity field and the fingerprint is partly defined over AD-16's unbuilt snapshot. A rule whose only compliant path does not exist yet is a rule that gets routed around, and the routing-around is B's or A's — never nothing.

**Does the code foreclose it today?** Partly — no second persisted preference exists, and `present-channel.ts` is the only opener of a `BroadcastChannel`. **Unenforced.**

**The `AD` change that closes it.**

> The `theme` key is a **named, bounded exception**: it is the one cross-window persisted-local value in this system, it is tolerated because the room-facing surface is closed to its effect rather than because the write is acceptable, and no second key inherits that tolerance. **Operator chrome never travels on AD-10's channel**, in either direction. Until AD-10's plan identity ships, this clause binds the *channel* requirement and not the *identity* requirement; the identity becomes binding with AD-10's own gap.

**Severity: MEDIUM.**

---

## A9 — MEDIUM — Reference counting is declared an invariant without the two properties that make it one

**The two units.** **Unit A — Story 17.7**, which per `deferred-work.md:216-218` owns the decision about whether the claim's contract is per-document or single-document, and which will plausibly want a recovery path for a shell that got stuck (a dev-mode hot-reload guard, a "reset chrome" escape hatch). **Unit B — any surface holding a claim** while A's recovery path runs.

**The exact `AD` text each obeys.** AD-24 clause 3: *"**The reference counting in that shared implementation is an invariant of it, not an optimisation** … Only the first claim snapshots and only the last release restores."* Both units obey exactly that sentence.

**The divergence.** The stated invariant is *first snapshots, last restores*. Two properties it does not state, both live in the shipped module:

1. **No floor.** `claims -= 1; if (claims === 0 && restore) restore()` (`:93-98`). The per-claim `released` flag stops a *double* release of the same claim, not a decrement from zero. `resetProjectedShellForTest` (`:103-106`) is an **unguarded public export** — no `NODE_ENV` check, no barrier but its name — with four call sites, all in the test file. Unit A calls it; Unit B's later release drives `claims` to `-1`; and from then on **every** claim takes the short path, because `claims === 0` is false, so the next room-facing surface gets no reset, no snapshot and a release closure that restores nothing. Silently, with the theme strip live on the projector.
2. **One document.** `claimProjectedShell` ignores its `doc` argument after the first claim — already named in *Deferred* and in `deferred-work.md:216-218`, deferred to 17.7. Cited, not re-derived. The new observation is only that it and (1) are the *same* omission: the declared invariant is about ordering, and both defects are about state the ordering rule does not mention.

`sprint-status.yaml:148` records round 3 finding "the shell claim counter has no floor and the exported test seam can drive it to -1" as a Story 17.1 patch item, so the code half has an owner. What has no owner is the `AD` sentence: AD-24 elevates reference counting to an invariant and then states less than the code needs.

**Does the code foreclose it today?** Yes — `resetProjectedShellForTest` has no production caller and both callers pass the same `document`. **Forecloses-today-but-unenforced.**

**The `AD` change that closes it.**

> The claim counter is **monotonic and never negative**, the shared module exposes **no production path** to zero or bypass it, and its contract is stated per document — either per-document state, or a single-document contract asserted by the gate. An invariant that names only an ordering is not an invariant.

**Severity: MEDIUM.**

---

## A10 — MEDIUM — `FULL_SCREEN` membership is a class-string spelling, so *"joins whichever of them applies"* has two honest answers

**The two units.** **Unit A** adds a room-facing surface spelled `fixed inset-0`. **Unit B** adds one that covers the viewport another way: `absolute inset-0` inside an `h-dvh` wrapper, `style={{ position: 'fixed', inset: 0 }}`, or the Fullscreen API on a normal-flow element.

**The exact `AD` text each obeys.** Clause 3: *"`tests/theme-chrome.test.mjs` is the gate, with **two** sets that must both be maintained — `PROJECTED` for the token, edge and closure guards, `FULL_SCREEN` for the shell reset — so a new room-facing surface joins **whichever of them applies** in the same change set."*

**The divergence.** *"Whichever applies"* is decided by the guard's own precondition: `assert.match(read(file), /\bfixed inset-0\b/, 'this is a full-screen surface')` (`:513`). Unit B's file does not match, so adding it to `FULL_SCREEN` makes the suite fail on a *precondition*, not on the invariant — which tells the author, in the test's own voice, that the set does not apply to them. And Unit B is not simply wrong: a Fullscreen-API surface genuinely does not need the reset, because the UA paints a black `::backdrop` and the reserved gutter is out of the picture. So the two spellings differ **in fact** as well as in enforcement, which is exactly what makes the wrong conclusion defensible for the spellings where they do not differ (`absolute inset-0` in an `h-dvh` shell leaks the gutter just as well as `fixed inset-0` does).

**Does the code foreclose it today?** Yes — verified: no `requestFullscreen` in `src/`, and both full-screen room-facing clients use `fixed inset-0`. **Forecloses-today-but-unenforced.**

**The `AD` change that closes it.** This one is also A1's fix in disguise, which is an argument for taking A1's route-group answer:

> Membership is keyed on **route**, not on a class string: every file rendered at a room-facing URL is in the guarded set, and the set is derived from the room-facing route group rather than enumerated. A surface that covers the viewport by any mechanism is a full-screen room-facing surface.

**Severity: MEDIUM.**

---

## A11 — MEDIUM — A per-**device** value that paints has no tier, and the only durable tier is admin-write-only

**The two units.** Two builders adding the same real thing: a projector output calibration — overscan inset, safe-area margin, or a per-output brightness/gamma nudge for a washed-out sanctuary projector. This is ordinary AV work and it reaches the room-facing render by definition.

**The exact `AD` text each obeys.** AD-24 clause 1's *who must agree* question, answered two defensible ways:
- **Unit A**: the deck's appearance depends on it, therefore persisted-shared → `settings` on the durable `DB_PATH` (AD-4), *"as AD-23 already does for `slide_transition`."*
- **Unit B**: nothing but this machine's own optics depends on it, therefore persisted-local → `localStorage`.

**The divergence.** Both fail, and the tier list is why.
- Unit A cannot ship: every write path into `settings` is `requireAdminSession` (the spine's own *Deferred* records `src/app/api/admin/settings/route.ts:17,29`), so the operator who is standing at the projector cannot set it. And `settings` is app-wide by AD-23's design, so one calibration would apply to every output.
- Unit B ships a value the room-facing render depends on into the tier AD-24 says never holds one — *"a value the deck depends on in `localStorage` sits outside every durability, concurrency and migration rule this spine has"* — and into a store the *Client state* row says room-facing surfaces read **never**.

The missing tier is **per-device**. *Deferred* names the missing per-**account** tier (*"a preference should follow an operator to a different machine"*), which is a different axis: per-account is about a value travelling *with a person*, per-device is about a value staying *with a machine* — and per-device is the one that paints on the congregation's screen. Two builders, one legitimate requirement, no compliant home, and the *who must agree* question returns two answers because the honest answer is *this projector, and every operator who uses it*.

**Does the code foreclose it today?** Yes — no such value exists, and `settings` holds two keys (`pptx_retention_days`, `slide_transition`). **Forecloses-today-but-unenforced.**

**The `AD` change that closes it.**

> The tier question has a fourth answer and it is named rather than left to be discovered: a value that belongs to **one output device** is persisted-shared, keyed by device in `settings`, with a non-admin write path — never persisted-local, because it reaches the room-facing render. Until that home exists, **no room-facing geometry, scale or colour correction is machine-local**, and a story that needs one amends this decision first.

**Severity: MEDIUM.**

---

## A12 — MEDIUM — *"No browser-side mechanism"* is refutable by the very library AD-24 rests on, and this file's own AD-5 precedent says that gets reverted

**The two units.** **Unit A — Story 17.7**, taking the sentence at face value and emitting CSS. **Unit B — a builder who has read `next-themes`' source**, who closes first paint with a blocking inline `<script>` in the document head that sets `html.style.backgroundColor = '#000'` before the first paint, and argues — correctly — that this is a *browser-side* mechanism that runs *before* the server's paint is composited.

**The exact `AD` text each obeys.** The ratified gap clause: *"**The reason that word is there is not "a React hook cannot run in a Server Component"** — that reading is true, refutable in the wrong direction, and was the earlier text here… **no browser-side mechanism closes this gap — hook, direct DOM call, or `useLayoutEffect` alike.**"* And, three clauses earlier, the spine's own statement of the counter-example: *"`<html>`'s `suppressHydrationWarning` is part of this boundary rather than incidental markup: **next-themes writes the class before React hydrates**, so the attribute mismatch is expected by design."*

**The divergence.** The paragraph replaced one refutable reason with another. next-themes closes exactly this class of problem with a **blocking script**, and AD-24 cites that fact twice (clause 2's `suppressHydrationWarning`, and `theme-chrome.test.mjs:905-916`'s note that *"next-themes seeds `theme` from localStorage inside `useState`"*). A builder who knows this reads *"no browser-side mechanism"*, finds a browser-side mechanism that demonstrably runs first, and concludes the sentence is wrong — which by this file's own stated precedent is how a rule gets reverted: *"A rule defended by a refutable reason is a rule that gets reverted (the AD-5 precedent)."*

The **conclusion** is right and should stand; only the **reason** is falsifiable. And there is a better reason available, which is also why Unit B should be refused: a blocking script would be a **second paint authority racing next-themes' own** on the same element, on the same tick, with no defined order between them — and it is script, so it is disabled or delayed under exactly the conditions (a slow first load on the sanctuary laptop) where the leak is most visible.

**Does the code foreclose it today?** No mechanism of either kind exists. **Unenforced.**

**The `AD` change that closes it.**

> The closure **must not depend on script execution order.** A blocking inline script would run before first paint and is nonetheless refused: it is a second authority over `<html>` racing next-themes' own on the same tick, and it fails exactly when the page is slow — which is when the leak is most visible. That, not the impossibility of running code in the browser, is why the closure is CSS emitted by the route.

**Severity: MEDIUM.** No leak follows from it; a reverted invariant does.

---

## Attacks the code forecloses — recorded so they are not re-derived as findings

1. **A caller styling the projected wrapper from outside.** Genuinely closed, and closed *better* than the prior run asked: `ArtifactSlide` no longer accepts `className` at all (`ArtifactSlide.tsx:220-233` — the omission is documented as load-bearing), `SlideView` does not forward one, and `theme-chrome.test.mjs:486-502` asserts the absence on the **props** of both, so a `{...props}` spread, a `createElement`, a renamed import and a `.ts` call site are compile errors rather than scan misses. The prior run's P12 is closed.
2. **The `@/lib` directory exemption.** Gone — `grep -c componentImports` → 0, and the walk now scans `@/lib` modules' own tokens. The prior run's P2 is closed for the *scanning* half; what survives is the **extension** boundary, which is A4 above and is a different shape.
3. **A theme token reaching the projected tree through a component import.** Closed. 43/43 at this run, comment stripping is a scanner not a regex, the token/edge/shorthand/CSS-var/`dark:` families are all covered, and the suite's own record is 18 injected defects each confirmed to make it react.
4. **The second document (`claimProjectedShell` ignoring `doc` after the first claim).** Real, unreachable today (both callers pass the same `document`; the projector is `window.open`ed so it has its own module realm — verified at `PresenterOperator.tsx:277`), already recorded in *Deferred* and `deferred-work.md:216-218`, already owned by Story 17.7. Cited in A9 as one half of the same omission, not filed again.
5. **The counter floor and the exported test seam.** Already a Story 17.1 patch item from round 3 (`sprint-status.yaml:148`). Filed here only as the `AD`-level half — A9 — because AD-24 calls the reference counting an invariant and states less than the code needs.
6. **`color-scheme: dark` and root `font-size` reaching the room-facing window.** Both already reach it and neither paints: the artifact tree emits `%` geometry and `cqh` font size (so no artifact dimension is `rem`-relative), the shell claim sets `overflow: hidden` so no UA scrollbar renders, and every background is a literal. Recorded by the prior run; unchanged by the amendment. What is *not* foreclosed is the media-query axis — A6 — which is a different mechanism and no `AD` names it.

---

## Summary — what each amendment needs before it is safe to call `[ADOPTED]`

| # | Sev | `AD` to amend | The sentence that has to decide something |
| --- | --- | --- | --- |
| A1 | CRITICAL | AD-24 c3 + gap clause | One owner of the property list **and of the lifetime**; a CSS closure that cannot survive navigation out of the group (Next does not remove stylesheets); the DOM claim subordinate or deleted |
| A2 | CRITICAL | AD-24 c3 (gate) | The room-facing stylesheet is **inside** the closure gate; an unresolvable specifier fails rather than being skipped |
| A3 | CRITICAL | AD-24 gap clause | Only the route-scoped stylesheet is permitted; a class on `<html>` is refused because its only encoding runs through the root layout or `src/proxy.ts` |
| A4 | HIGH | AD-24 c3 (gate) | The gate encodes *reachable from a room-facing surface* — every hop, every extension, every re-export form |
| A5 | HIGH | AD-24 c3 | The shell reset is room-facing-only and literal-valued, and takes no colour parameter |
| A6 | HIGH | AD-24 c3 / AD-23 | The closure covers any value that varies with the machine or agent, **stored or not** — no appearance/motion/contrast media query on a room-facing surface |
| A7 | HIGH | **AD-7** | The channel index is an index into the plan as built; no filtered, reordered or resumed derivative leaves a window |
| A8 | MEDIUM | AD-24 c1 / AD-10 | `theme` is the one named cross-window exception; operator chrome never travels on AD-10's channel; the identity requirement binds when AD-10's identity ships |
| A9 | MEDIUM | AD-24 c3 | The counter is monotonic, non-negative, has no production reset, and its document contract is stated |
| A10 | MEDIUM | AD-24 c3 | Guarded-set membership is keyed on route, not on `fixed inset-0` |
| A11 | MEDIUM | AD-24 c1 | The per-**device** tier, or an outright ban on machine-local room-facing geometry |
| A12 | MEDIUM | AD-24 gap clause | Replace *"no browser-side mechanism"* with *"the closure must not depend on script execution order"*, and record the blocking-script candidate as declined |

**One structural observation for whoever amends.** The prior run's closing note was that AD-24 is written about **colour** while the hazard is **any operator-derived value that paints**. That reframing is still owed, and today's amendment adds a second one of the same kind: AD-24 is written about **mechanisms** — a hook, a module, a set in a test file, three storage APIs — while the hazard is a **relation**: *this value came from the operator's side, and it reached the room-facing render.* Every CRITICAL above is a new mechanism arriving (a stylesheet, a server class, a route-group layout) and slipping between clauses that enumerate the old ones. A1, A2, A3 and A10 all close together under a single sentence naming the room-facing **route group** as the unit the decision is stated over — which is, not coincidentally, the shape the owner already chose for Story 17.7. Stating AD-24 over that unit instead of over a list of files is the amendment that would stop the next mechanism from needing its own clause.
