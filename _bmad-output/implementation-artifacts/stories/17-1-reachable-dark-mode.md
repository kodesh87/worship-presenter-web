---
baseline_commit: acc8df04c4139fdd0f37a80b23030c15dbb124df
---

# Story 17.1: Reachable Dark Mode

Status: review

## Story

As an operator running a service in a dim sanctuary,
I want to choose a dark theme for the hub and have it remembered,
so that a full-brightness white screen in my hands does not light up the room, and the `.dark` palette the app already ships stops being reachable only where it was hardcoded.

## Correction to the finding this story came from

The readiness assessment recorded *"Dark mode is unreachable … the entire dark palette is dead code"*, and `DESIGN.md` repeated it. **Verified against the code on 2026-07-29: that is wrong.** Two surfaces already pin the class themselves, and they are the two used while a service is running:

- `src/app/services/[id]/present/PresenterOperator.tsx:449` — `className="dark flex min-h-dvh …"`
- `src/app/services/[id]/present/SlideGridDialog.tsx:176` — `className="dark flex max-h-[85dvh] …"`

`@custom-variant dark (&:is(.dark *))` (`src/app/globals.css:5`) matches any descendant of a `.dark` element, so both subtrees render the dark palette today with no provider involved. What is actually missing is a **choosable** theme for the rest of the hub.

This matters for scope: the job is not to introduce dark mode, it is to make it selectable **without disturbing two surfaces that deliberately opt out of the choice.**

**Update 2026-07-30 — `DESIGN.md` now carries this correction.** The `bmad-ux` Update run applied it at source: the frontmatter comment, the `Colors` note on `--sidebar-primary`, and Open Item 2 all state that the palette renders today and that what is missing is *operator choice*. AC-7 below is adjusted accordingly — correcting that claim is no longer your job. `EXPERIENCE.md` → *Accessibility Floor* additionally records that **the dark palette's contrast has never been measured on any pair**, which is what AC-6 exists to fix.

## Acceptance Criteria

1. **Given** an operator on any hub surface, **When** they use the theme control, **Then** the chrome switches between light and dark and the choice survives a reload and a new tab. `next-themes` is already a dependency; no new theming library.

2. **Given** a first visit with no stored preference, **When** the page loads, **Then** the theme follows the operating system, **And** no wrong-theme flash appears before hydration. `<html>` carries `suppressHydrationWarning` (`src/app/layout.tsx:32`), because next-themes writes the class before React hydrates and the attribute mismatch is expected.

3. **Given** the presenter operator view or the slide-grid dialog, **When** the operator's chosen theme is light, **Then** both still render dark — their local `.dark` wrapper wins for its own subtree. Neither file's wrapper is removed by this story.

4. **Given** any chosen theme, **When** a Service is presented, downloaded or projected, **Then** the **projected render tree** is byte-identical. This is the load-bearing constraint: the congregation never sees operator chrome. It holds today and must keep holding —
   - `ProjectorClient.tsx:110,130,131` uses literal `bg-black`, `bg-[#0B1220]`, `text-white`, `text-[#D4A574]`, never theme tokens;
   - `src/components/SlideView.tsx` contains no theme-token class at all, and accepts no `className`;
   - `ArtifactSlide.tsx` colours every element from inline `style` resolved out of the Artifact Registry.
   A regression here is a defect against FR-20 and the Deck Blueprint, not a styling preference.

   **Scoped on two axes, 2026-07-31, at the owner's direction after code-review round 2.** The AC as first written was broader than what this story delivers, and the gap was being covered by a dismissal in a review rather than by the contract. Both narrowings are deliberate and neither weakens the intent — the congregation never sees operator chrome:

   - **WHAT: the projected *tree*, not the *shell behind it*.** The guarantee is that the projected render tree paints in literal colours or registry-resolved inline styles, enforced by `PROJECTED` in `tests/theme-chrome.test.mjs`, plus the shared shell reset on the two full-screen *Clients* (`FULL_SCREEN`). The **shell** — the root layout, the server's first paint before any hook runs, the two Server-Component error branches, and a `notFound()` at a room-facing URL — is **Story 17.7's** contract. Four holes, one root: the shell belongs to the app, not to the route. `AD-24` is `[ADOPTED, partial]` until 17.7 closes it, and now names 17.7 as the key that will.
   - **WHERE: the projected output, not the operator's preview of it.** The word *previewed* is removed. `SlidePreviewList` — the Live Slide Preview in both forms — is hub chrome and follows the operator's theme **deliberately**, which is correct and desirable. It renders no `SlideView` and no `ArtifactSlide` (verified across all nine call sites of both), so there is no projected pixel there to leak. Round 1 settled this in a *Dismissed as noise* line; the reasoning was right and the AC's own sentence still said otherwise, so the sentence is amended rather than left for the next reader to reconcile against a dismissal.

   *(Amending an AC is outside `bmad-dev-story`'s normal edit surface — frontmatter, checkboxes, Dev Agent Record, File List, Change Log, Status. It is done here because the owner directed it explicitly in the two decision items below, and because leaving `:220`/`:266` contradicting `:89` was itself a recorded finding. Flagged rather than done quietly.)*

5. **Given** dark mode active, **When** toast notifications appear, **Then** they follow the theme. `src/components/ui/sonner.tsx:3` already calls `useTheme()`; today it resolves to nothing. Mounting the provider is what makes that call meaningful — no change to `sonner.tsx` should be needed, and needing one is a signal the provider is mounted in the wrong place.

6. **Given** the dark palette in use as chrome, **When** its load-bearing pairs are measured with a real contrast checker, **Then** each result is recorded in `DESIGN.md` as a measurement, not an estimate. The light palette's `muted-foreground` was measured at **4.35:1 on `muted` and fails WCAG AA**; the dark side has never been measured at all. If a dark pair also fails, record it as a known defect rather than silently shipping it — the fix belongs to Story 17.2, which owns that token.

7. **Given** this story ships, **When** the change set is reviewed, **Then** `DESIGN.md` is updated in the same change set — the theme control documented under *Components*, and the AC-6 measurements recorded in the contrast table. `AGENTS.md` requires it: a UI component with a visual delta updates `DESIGN.md`. **Do not** re-correct the "dead code" claim; `bmad-ux` did that on 2026-07-30. **Also** update `DESIGN.md` Open Item 2 to closed and `EXPERIENCE.md` → *Accessibility Floor*, whose second bullet says the dark palette has never been measured — AC-6 is what makes that statement obsolete.

## Tasks / Subtasks

- [x] Mount the provider (AC: #1, #2, #5)
  - [x] Wrap `children` in `src/app/layout.tsx` with next-themes' provider, `attribute="class"`, `defaultTheme="system"`, `enableSystem`
  - [x] Add `suppressHydrationWarning` to the `<html>` element (`layout.tsx:26`)
  - [x] Confirm no `'use client'` leaks into the layout beyond the provider boundary — keep the provider in its own client component
- [x] Theme control in the shared header (AC: #1)
  - [x] Add the control to `src/components/Header.tsx` (Epic 13.2's shared shell), beside the existing profile/logout affordances
  - [x] Keyboard reachable and labelled; use an existing shadcn/Base UI control, no new dependency
  - [x] Render nothing theme-dependent until mounted, so the button does not flip after hydration
- [x] Prove the projected output is untouched (AC: #3, #4)
  - [x] Verify `/services/[id]/present`, its projector window, `/services/[id]/slideshow` and the PPTX download are identical in both themes
  - [x] Confirm `PresenterOperator` and `SlideGridDialog` still render dark while the hub is light
  - [x] Consider a test asserting no theme-token class reaches `SlideView` / `ArtifactSlide` — cheaper than re-checking by eye later
- [x] Measure the dark palette (AC: #6)
  - [x] `foreground`/`background`, `primary-foreground`/`primary`, `muted-foreground`/`background`, `muted-foreground`/`muted`
  - [x] Use a real checker or canvas-resolved sRGB, as the light-side measurement did — not Oklab lightness estimates
- [x] Update `DESIGN.md` in the same change set (AC: #7)
- [x] `npm test` and the public-repo guard green before commit

### Review Findings

`bmad-code-review`, 2026-07-31, three parallel layers (Blind Hunter / Edge Case Hunter /
Acceptance Auditor) against the uncommitted working tree. Severity is this workflow's, not the
subagents' — each finding below was re-verified against the source before it was rated. **3
decision-needed (all resolved by the owner the same day → patch), 12 patch, 1 deferred, 3
dismissed as noise.**

The headline: **AC-4 is not met.** All three layers found the same path independently, and
`ProjectorClient.tsx:89-96` already documents the mechanism in prose.

> **Remediation status, 2026-07-31 (`bmad-dev-story`): 11 of 12 patch items closed; AC-4 is now
> met and browser-verified.** The one still open is **AD-24**, which `AGENTS.md` routes through a
> `bmad-architecture` Update run — not something this workflow may substitute for. Each item below
> carries its own resolution, including the two cases where re-verification contradicted the
> finding's own numbers.
>
> **Update, 2026-07-31 (`bmad-architecture` Update run): all 12 closed — AD-24 is in the spine.**
> That run's Reviewer Gate also opened **one new action item against this change set**, and it is
> filed with the AD-24 entry below: AC-4's shell fix reaches the two full-screen *Clients* and not
> the two room-facing *route shells*, which are Server Components and cannot call the hook. AC-4's
> token guarantee holds; its shell guarantee does not, on the branch a registry failure renders.
> **AD-24 is `[ADOPTED, partial]` for exactly that reason.** The item has no owner yet.

**Patch — resolved from `decision-needed` by the owner, 2026-07-31**

- [x] [Review][Patch] **19 previously-dead `dark:` overrides across 9 files go live, unreviewed and unmeasured** (medium) — No `.dark` ancestor existed outside `PresenterOperator`/`SlideGridDialog`, and neither of those files contains a single `dark:` utility, so **every `dark:` rule in `src/` was dead CSS until this change set.** Now live: `src/app/page.tsx:38,41`, `admin/page.tsx:36,39`, `announcements/page.tsx:29,32`, `login/page.tsx:106,109`, `services/new/page.tsx:40,42`, `services/[id]/page.tsx:150,152,211`, `HymnNumberAutocomplete.tsx:453`, `ui/button.tsx:7,13,17,19`. None is in the File List, the task list or the Debug Log. AC-6 measured four **token** pairs; none of these overrides is a token pair — `dark:opacity-100` takes a decorative grid from 40% to full, `dark:bg-primary/10` swaps a near-black ambient glow for a near-white one. Two amber affordances gain a dark shade *outside* the presenter (`services/[id]/page.tsx:211`, `HymnNumberAutocomplete.tsx:453`), which the rewritten Open Item 4 does not account for. **Owner's call (2026-07-31): in scope for 17.1** — review and measure the newly-live overrides before this story closes, rather than deferring them to their own story. The palette measurement AC-6 performed on four token pairs is what these overrides now sit beside unmeasured, so closing 17.1 without them would ship exactly the gap AC-6 exists to prevent. **RESOLVED 2026-07-31.** Counted exactly rather than approximately: **29 `dark:` utilities at 18 sites in 8 files**. The finding's own line list already enumerated 18 sites in 8 files, so *19 across 9* was its headline and not its evidence. All 29 reviewed, and every colour-bearing one measured in the browser by AC-6's method, recorded in `DESIGN.md` -> *The `dark:` overrides that went live with the theme control*: the 18 ambient-backdrop utilities are decorative and hold under text (`foreground` 15.79:1, `muted-foreground` 6.38:1 over the dark glow, 7.47:1 over a grid line); the two amber affordances pass at 8.40:1 and 11.49:1; the nine `button` variants pass on contrast (`text-destructive` on `dark:bg-destructive/20` is 4.64:1 on `card`, 5.31:1 on `background`) and failed on *consistency*, which is the `ThemeToggle` item below. Two failing pairs turned out not to be `dark:` overrides at all, but shades with no dark half in files that became dark-switchable underneath them - the preview badges and `LogoutButton`, both fixed here. The pass also found a defect this story does not own: the **light** ambient glow puts `muted-foreground` at **4.27:1**, worse than the 4.35:1 Story 17.2 was scoped from (`DESIGN.md` Open Item 1 now says so).
- [x] [Review][Patch] **AC-5 has no trigger, and the gap is filed only in a YAML comment** (medium) — `Toaster` is exported at `src/components/ui/sonner.tsx:49` and mounted nowhere; `toast(` is called nowhere in `src/`. The story discloses this accurately. But the follow-up lives only in `sprint-status.yaml`'s `last_updated` prose — no Open Item, no owning story key, in either spine. `DESIGN.md`'s own Open Items preamble: *"an open item with no key is how a finding becomes permanent."* **Owner's call (2026-07-31): do not mount `<Toaster />`** — that would add a UI surface the task list never asked for. File it instead as an Open Item with an owning story key in `EXPERIENCE.md`, so AC-5's structural-only status stops living in a `last_updated` comment. **RESOLVED 2026-07-31.** `<Toaster />` deliberately **not** mounted, per the owner. Filed instead as `EXPERIENCE.md` -> *Open Item 4* with owning key **Story 17.6**, and 17.6 registered in `epics.md` and `sprint-status.yaml` so the key resolves to something rather than naming a story that does not exist. Both artifacts that described toasts as a shipped pattern now say inline that nothing renders one (`EXPERIENCE.md` -> *Component Patterns*, `DESIGN.md` -> *Components*). 17.6's first job is stated as the decision - channel or no channel - not an implementation.
- [x] [Review][Patch] **First client-side persistence in the codebase, with no spine amendment** (medium) — `grep -rn "localStorage\|sessionStorage" src/` returned **zero** hits before this change; next-themes now writes `localStorage.theme`. `AGENTS.md` lists *storage target* among the structural invariants that require amending `ARCHITECTURE-SPINE.md` **in the same change set**, and the spine carries only `DB_PATH`/SQLite decisions (AD-4, AD-17, AD-18, AD-21) — nothing on browser-side state or a root-level client boundary. **Owner's call (2026-07-31): add the decision to the spine** as the next number, **AD-24** (highest existing is AD-23; `AGENTS.md` forbids renumbering). Per the same gate this must go through a `bmad-architecture` Update run, not an inline edit to the spine file. **RESOLVED 2026-07-31 by a `bmad-architecture` Update run** — the correct channel, which is why this workflow refused to satisfy the checkbox inline. `AD-24 — Operator Chrome State Is Browser-Local, and the Room-Facing Surface Is Closed to It` is added as the next id with nothing renumbered, and lands as **`[ADOPTED, partial]`** rather than `[ADOPTED]`, because that run's Reviewer Gate found a gap in **this change set**: see the new action item below. Its three clauses are the storage-tier division (application state goes to `settings`, `localStorage`, or AD-10's channel, decided by *who must agree on it*; the AD-5 session cookie is credential transport, not a fourth home; persisted-local carries a view preference and no domain data — which forecloses parking Story 17.4's unsaved canvas layout there), the client-boundary rule (mount at the narrowest layout containing every consumer; never `'use client'` on `layout.tsx`), and the room-facing closure (literal colours, the one shared shell reset, and `tests/theme-chrome.test.mjs` as the gate — with **both** its `PROJECTED` and `FULL_SCREEN` sets named, since the shell reset keys on the second). `localStorage` + the `storage` event is additionally named as a cross-window channel that is *not* a licence to carry coordination state, which matters for Story 17.5.

**New action item, found by that gate against this story's change set (high) — RE-FILED 2026-07-31 under Story 17.7, which now owns it** [src/app/services/[id]/slideshow/page.tsx:76] — *it had no owner when it was written, and round 2 then found it was one of four holes sharing a root. `17-7-projected-shell-route-group` is registered in `epics.md` and `sprint-status.yaml`, and `ARCHITECTURE-SPINE.md` names it as the key that takes AD-24 from `[ADOPTED, partial]` to `[ADOPTED]`. Left in place rather than deleted, because the finding's own wording is the clearest statement of the mechanism:* — the AC-4 fix extracted the shell reset to `src/lib/use-projected-shell.ts` and called it from both **Clients**, but the two room-facing **route shells** — `projector/page.tsx:71` and `slideshow/page.tsx:76`, the `fixed inset-0` branches a `buildSlidePlan` throw renders — are **Server Components** and cannot call a hook at all. Both paint `bg-black` on their own element and carry no theme token, so the token half of AC-4 holds; neither resets `html`/`body`, so the reserved `scrollbar-gutter: stable` still shows the themed `body` as a strip down the edge of the projected screen — the same defect, one layer out, on the surface a registry failure faces the congregation with. `FULL_SCREEN` (`tests/theme-chrome.test.mjs:284`) lists only the two Clients, so nothing catches it, and the repaint of these shells to literal colours (patch item above) fixed the element and not the shell behind it. Three candidate fixes are recorded in the spine's *Deferred*; the route-segment layout is the only one that also catches a future shell nobody annotates. Not patched here — this workflow's remediation pass is closed and this is a fresh finding, so it needs a story key rather than a silent edit.

**Patch — unambiguous fixes**

- [x] [Review][Patch] **AC-4 falsified: the slideshow canvas paints the operator's theme** (high) [src/app/services/[id]/slideshow/SlideshowClient.tsx:52] — `globals.css:124-130` sets `body { @apply bg-background }` *and* `html { scrollbar-gutter: stable }`. The reserved gutter means `fixed inset-0` sizes to the viewport **minus** that gutter, so `body` shows as a strip down the edge. `ProjectorClient.tsx:89-119` neutralises exactly this on purpose — `scrollbarGutter = 'auto'`, `root`/`body` `backgroundColor = '#000000'` — under a comment stating the observed symptom: *"the white page shows as a bright strip down the edge — on the projector, in front of the congregation."* `SlideshowClient` is the same `fixed inset-0` pattern with **no** reset, and `grep -rn scrollbarGutter src/` returns only `ProjectorClient`. Before this story that strip was permanently white; now it flips with the operator's choice, live, mid-service (next-themes syncs across same-origin windows on the `storage` event). The story's evidence — *"fingerprinted all 14 nodes"* — enumerates nodes **inside** the client tree and structurally cannot see `html`/`body`, which is where the theme actually paints. Fix: mirror the projector's reset, preferably by extracting the shared effect so the next full-screen surface inherits it. **RESOLVED 2026-07-31.** The projector's reset is extracted to `src/lib/use-projected-shell.ts` and called by both full-screen surfaces. Verified in the running app at `/services/2/slideshow`: `html` and `body` both compute `rgb(0, 0, 0)` with `scrollbar-gutter: auto` and `overflow: hidden`, **identical under both themes**. The defect was reproduced in place first, by dropping only the hook's inline styles: `body` computes `lab(100 0 0)` in light and `lab(2.75 0 0)` in dark, gutter `stable` - so the strip really did follow the operator's choice. `tests/theme-chrome.test.mjs` fails if either surface stops calling the hook (negative-tested).
- [x] [Review][Patch] **Badge tone shades authored for white go dark-switchable, and the repo already documents that they are unreadable there** (high) [src/components/SlidePreviewList.tsx:26] — `TONE_CLASS` uses `text-emerald-600` on `bg-emerald-500/10`, `text-amber-600`, `text-indigo-600`, with **no `dark:` variants**. It renders at `CreateForm.tsx:983` and `EditForm.tsx:1014` — hub chrome, now dark-switchable. `presenter-model.ts:48-54` maintains a *separate* table and states the reason: *"the Presenter is a dark surface and the light-theme shades the forms use (`text-emerald-600` on `bg-emerald-500/10`) are unreadable on it."* Measured against dark `--card` (`#171717`): `text-indigo-600` **2.85:1** (below even the 3:1 large-text floor), `text-amber-700` (`services/[id]/page.tsx:211`) **3.57:1**, `text-red-600` (`LogoutButton.tsx:30`, inside the Header dropdown this change set edited) **3.71:1**. Also `Header.tsx:180` `text-emerald-600`, in a file this change set touched. Three sub-AA pairs, in a story that added a contrast AC. Fix: give `TONE_CLASS` `dark:` shades — `PRESENTER_TONE_CLASS` already holds ones proven readable on dark. **RESOLVED 2026-07-31.** `TONE_CLASS`'s three chromatic tones carry `dark:` halves ported from `PRESENTER_TONE_CLASS`, which has always had to survive a dark surface; `LogoutButton` and `Header`'s password-success line likewise. Measured in the browser, canvas-resolved sRGB: emerald 4.23 -> **10.56:1**, amber 4.76 -> 10.57:1, indigo **2.54** -> **9.72:1**, logout red **3.76** -> **6.21:1** (5.72:1 over its own hover), success 4.91 -> 9.25:1. `dark:text-red-400` resolves to `#ff6467`, which is `.dark`'s `--destructive` exactly - verified by painting both. **One number in the finding was re-verified and does not hold:** `text-amber-700` at 3.57:1 cannot occur, because `services/[id]/page.tsx:211` carries `dark:text-amber-500` (8.40:1) and the `-700` shade therefore paints only on the light card (5.03:1). Its sibling `text-amber-600` **does** fail - 3.20:1, in the **light** theme, pre-existing - now recorded under `DESIGN.md` Open Item 4.
- [x] [Review][Patch] **The slideshow's failure branch renders theme tokens at a projected URL; the projector's equivalent uses literals** (medium) [src/app/services/[id]/slideshow/page.tsx:78] — `bg-background text-foreground` (:78), `border-destructive/40` (:80), `text-destructive` (:82), `bg-muted` (:91), `text-muted-foreground` (:94), plus token-painted `Card`/`Button`. `projector/page.tsx:71` uses literal `bg-black … text-white` for exactly this reason. Reached whenever `buildSlidePlan` throws — a registry failure puts a theme-following card on the projected screen. `PROJECTED` (`tests/theme-chrome.test.mjs:90-95`) lists only the four **client** components, so neither page shell is scanned and the *"tree stays closed"* test (:158) is scoped to a subtree, not a route. **RESOLVED 2026-07-31.** Rewritten to the projector's black canvas in literal colours, with the `Card` and `Button` imports dropped so no primitive can carry a token in. Both route shells joined `PROJECTED`, so the token guard, the edge guard and the closure test all scan them now. `EXPERIENCE.md` -> *State Patterns* updated in the same change set: the state it described (a `destructive`-bordered card) is not the state that ships.
- [x] [Review][Patch] **The edge guard misses the idiomatic width utilities it was written to catch** (medium) [tests/theme-chrome.test.mjs:127] — Executed against the real regex: **MISSED** `border-t-2`, `border-b-4`, `border-x-2`, `border-s-2`, `border-[3px]`, `border-t-[2px]`, `ring-1`, `ring-3`, `ring-[3px]`, `outline-1`, `divide-y-2`, `divide-x-4`. Caught only `border`, `border-2/4/8`, `border-t`, `border-b`, `ring`, `ring-2`, `outline`, `outline-2`, `divide-y`. The doc comment at :121 names **`ring-1`** as the hazard, and `ring-1` is missed. The negative test cited in the Completion Notes used `border-2` — one of the few forms that does match. The token guard has the matching hole: the pattern is `(?:prefix)-(?:token)`, so `border-t-border`, `border-b-border`, `border-x-border` and `ring-offset-background` all escape. A directional themed border in a projected file is unguarded on **both** halves. **RESOLVED 2026-07-31.** The edge guard now matches directional widths, arbitrary values, odd ring/outline widths and divider widths; the token guard gained the directional and `ring-offset` prefixes. Negative-tested one spelling at a time against the real regex: `ring-1`, `ring-3`, `border-t-2`, `border-x-2`, `border-s-2`, `border-[3px]`, `outline-1` and `divide-y-2` all fail it now, as do `border-t-border`, `border-x-border`, `ring-offset-background` and `divide-y-border` against the token guard. `border-white/25` deliberately stays green - stating a literal colour is the sanctioned way out of this guard, and the failure message says so.
- [x] [Review][Patch] **The "closed tree" claim is not closed: `className` and non-`@/components` imports** (medium) [tests/theme-chrome.test.mjs:158] — `SlideView.tsx:11-18` accepts `className` and forwards it to `ArtifactSlide`, which splices it onto the projected wrapper. The file header claims *"the token set below cannot enter the projected surface through a path this file does not read"* — a caller outside `PROJECTED` passing `bg-card` is exactly such a path. Latent today (verified: all four `SlideView` call sites are inside `PROJECTED` ∪ the two presenter surfaces, and none passes `className`), which is what makes it cheap to close now. The closure test also only matches `^import … from '@/components/…'`, so a relative `./Sibling`, an `@/app/…` component, and `dynamic(() => import('./Lazy'))` all join the tree unguarded. **RESOLVED 2026-07-31.** `SlideView`'s `className` pass-through is gone - it was dead (all four call sites verified) and it was the one way a caller outside the guarded set could style the projected wrapper. A new guard scans every `.tsx` under `src/` for a `className` on `<SlideView` or `<ArtifactSlide`, which covers the remaining entry. The closure test now reads relative, `@/app/...` and `dynamic(() => import('...'))` specifiers instead of `@/components/...` alone; all three were negative-tested and fail.
- [x] [Review][Patch] **In dark mode the toggle stops matching the siblings `DESIGN.md` says it matches** (medium) [src/components/ThemeToggle.tsx:52] — `shell` sets `border-border bg-card/50`; the `outline` variant carries `dark:border-input dark:bg-input/30 dark:hover:bg-input/50` (`ui/button.tsx:13`). `tailwind-merge` does not treat differently-prefixed classes as conflicting, so both survive, and `:is(.dark *)` out-specifies the unprefixed call-site override — the `dark:` rules win. `Header.getLinkClass` (`Header.tsx:26-27`) has **no** `dark:` variants, so the sibling nav pills stay at `bg-card/50`/`border-border` while the toggle renders at `input/30`. `DESIGN.md`'s new row states the override exists *"so it matches the sibling controls Header styles by hand"* — true in light, false in the mode this story exists to enable. **RESOLVED 2026-07-31.** The call site states its dark half (`dark:border-border dark:bg-card/50 dark:hover:bg-card`). Verified in the browser, in dark mode after a reload: the toggle and the *Announcements* pill compute **identical** `background-color`, `border-color` and `color`. A fresh-node probe shows what the old string produced - `bg-input/30` at alpha 0.045 with a `lab(100 0 0 / 0.15)` border, against the pill's `--card` at 0.5 and `lab(100 0 0 / 0.1)`. Worth recording *why* it works: `tailwind-merge` **deletes** the same-modifier conflict, so the variant's three `dark:` classes are absent from the rendered class list entirely - not out-specified, removed. An unprefixed override could not have done that, which is the finding's mechanism confirmed from the other side.
- [x] [Review][Patch] **The pre-mount placeholder contradicts its own comment on both halves** (medium) [src/components/ThemeToggle.tsx:54] — The comment reads *"the button is present, sized and **focusable** … so focus order and layout do not shift on hydration."* The button at :63 is `disabled`; Base UI emits the **native** `disabled` attribute (`nativeButton` true, `focusableWhenDisabled` false, both defaults), so it is out of the tab order until hydration — focus order *does* shift, and `disabled:opacity-50` (`ui/button.tsx:7`) means the box visibly goes 50% → 100%. And the mount guard causes the flip it exists to prevent for every operator who has ever clicked it: next-themes seeds `theme` from `localStorage` inside `useState`, so on the hydration render `theme` is already `light`/`dark` while `mounted` is still the server snapshot `false` → `MonitorIcon` → `SunIcon`/`MoonIcon`. Only `system` doesn't flip, and `system` is the one state the Debug Log tested. If hydration never completes the control is permanently dead, which fails AC-1's *reachable* outright — there is no `<noscript>` or server-side theme route. `DESIGN.md:162` repeats the same rationale as if the shipped control behaved that way. **RESOLVED 2026-07-31.** The placeholder is `disabled` **plus** `focusableWhenDisabled`, so Base UI emits `aria-disabled` and keeps `tabIndex 0` while still swallowing clicks - no tab-order shift, and `disabled:opacity-50` never fires, so the box does not step from half to full opacity either. Its glyph is `SunMoonIcon`, which is **none of the three states**: the remaining substitution is placeholder -> state, never state -> different state, which is what `MonitorIcon` was doing for every operator who had chosen light or dark. The comment and `DESIGN.md`'s row now describe the shipped control, including the part that cannot be engineered away: like the profile dropdown next to it, this is a client control and needs hydration.
- [x] [Review][Patch] **Four of the seventeen new tests are satisfied by a substring** (medium) [tests/theme-chrome.test.mjs:225] — `:225-233` (AC-5) asserts only that `useTheme()` appears in `sonner.tsx`; it passes unchanged if `ThemeProvider` is deleted from the layout, which is the entire content of the AC-5 claim. `:237-240` asserts `/ThemeToggle/` in `Header.tsx` — a commented-out import passes. `:262-272` asserts `/mounted/` in `ThemeToggle.tsx`, and the word sits in a comment at :54, so the test cannot fail while that comment survives. `:250` `/useTheme/` is comment-satisfiable too. The AC-3 guard `/className="dark[\s"]/` checks string position, not that a dark surface still wraps the named surface: `className="flex dark …"` (identical render) **fails**, `cn('dark', …)` **fails**, and `className="dark"` on a wrapper that no longer contains the presenter **passes**. And `:252`'s "no new dependency" regex `[^'.@]` excludes `@`, so `import x from '@radix-ui/react-dropdown-menu'` yields `[]` — as does any double-quoted import. That test passes for every scoped package in existence, in the one file where a dropdown primitive would most plausibly be added. **RESOLVED 2026-07-31.** Every scan strips comments before matching, and each of the four assertions was negative-tested to prove it can now fail: mount guard removed with the word `mounted` left in a comment -> fails; `ThemeToggle` import commented out -> fails; imported but never rendered -> fails; `ThemeProvider` deleted from the layout -> the AC-5 test fails, which it did not before. The AC-3 guard reads `dark` as a **class token** on the outermost classed element of the exported surface: `className="flex dark ..."` and `cn('dark', ...)` now pass (they render identically), while `darkroom` and a removed `dark` fail. The dependency regex accepts both quote styles and scoped packages. Test count 17 -> 28.
- [x] [Review][Patch] **AC-7 doc residue: four statements the change set left inconsistent with itself** (medium) [_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md:280] — (a) `EXPERIENCE.md:280` still routes *dark-mode choice* to `DESIGN.md` → *Open Items*, which now reads **CLOSED**. (b) `DESIGN.md` closes Open Item 2 and its token comment asserts *"since Story 17.1, CHOOSABLE"*, while `sprint-status.yaml:19` has the story at `review` — if review rejects the change, the design record has already closed the item that tracks it. (c) `EXPERIENCE.md:93` asserts no theme can reach *"a slideshow frame"*, *"verified node by node on the slideshow, 14 of 14"* — falsified by the first patch item above. (d) Open Item 4, **rewritten in this change set**, says *"Six warning affordances … at five shades … across five files"*; verified actual is **8 files** at **6 shades** (`amber-200/300/400/500/600/700`), and amber is not the only untokenized hue — `emerald`, `indigo`, `red` and `sky` are all in `src/`, including `Header.tsx:180`, a file this change set edited. Lower-priority in the same family: *"the dark palette passes every pair"* reads as palette-wide but covers four **text** pairs only; `--border` and `outline-ring/50` are applied to every node by `globals.css:121-123`, carry the WCAG 1.4.11 non-text obligation, and are unmeasured (~1.30:1 over `bg-card/50`) — which matters here because `ThemeToggle` is the first **icon-only** control in the header, so that border is its only resting affordance. **RESOLVED 2026-07-31.** (a) `EXPERIENCE.md`'s Open Items preamble no longer routes dark-mode choice at a struck-through entry. (b) `DESIGN.md` Open Item 2 now states that its closure is contingent on this change set landing, and records the convention that produced the problem. (c) The *"14 of 14"* claim is replaced by what actually happened - the verification ran inside the client tree and structurally could not see `html`/`body`, which is where the theme paints. (d) Open Item 4 is rewritten around a counted inventory (**five** untokenized hues across 11 files; amber alone 43 uses at 6 shades in 8 files) plus the reason three successive counts disagreed, which was the grep each used. Lower-priority half also done: *"passes every pair"* is scoped to the four **text** pairs it measured, and non-text contrast is measured and filed as Open Item 6 - `--border` **1.29:1** dark / **1.26:1** light, plus a failure the review did not name, the light theme's focus ring at **2.58:1**.

**Deferred — pre-existing, not caused by this change set**

- [x] [Review][Defer] **`DESIGN.md` cites a `slide-surface` class that exists nowhere in the codebase** [_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md:164] — deferred, pre-existing. `grep -rn slide-surface src/` returns nothing. Noted because it sits in the Components table row directly *above* the row this change set edited to add `ThemeToggle`.

**Dismissed as noise (3):** a `localStorage.theme` value outside `ORDER` (e.g. hand-edited to `blue`) is reported as `system` and its stale class is never removed — upstream next-themes behaviour, requires editing the origin's storage by hand, negligible consequence; `EXPERIENCE.md`'s new row carrying Tailwind-preflight detail its own header excludes — editorial, and the nuance earns its place; AC-4's word *previewed* not being separately verified — `SlidePreviewList` renders no `SlideView`/`ArtifactSlide` at all, so there is no projected pixel to leak.

---

### Review Findings — round 2 (`bmad-code-review`, 2026-07-31)

Three parallel layers again (Blind Hunter / Edge Case Hunter / Acceptance Auditor), launched
without this session's conversation context, against the same uncommitted working tree — now
carrying the round-1 remediation and the AD-24 amendment. Severity is this workflow's, not the
subagents'; every finding below was re-verified against the source before it was rated. **3
decision-needed — all resolved by the owner the same day, into 2 patch and 1 specification for the
spun-out Story 17.7 — plus 22 patch raised directly (24 patch in total), 3 deferred, 2 dismissed as
noise.** No layer failed or returned empty.

**The baseline question round 1 could not settle is now settled.** The story's own
`baseline_commit: acc8df0` was checked against `HEAD`: **16 commits separate them and not one
touches `src/`, `tests/` or `package.json`** — all are `docs:`. So the uncommitted working tree
*is* this story's complete code delta, exactly, and the three reviews have all read the same
thing. The tree is still uncommitted, which remains the one process risk nothing here can fix.

**Verification state at review time:** `npx tsc --noEmit` clean; `tests/theme-chrome.test.mjs`
28/28; full suite 365/364 pass/1 skipped; `npm run lint` reports exactly **one** problem in any
changed file (`LogoutButton.tsx:5`, and it is pre-existing). Every numeric claim in the round-1
resolutions that was spot-checked reproduced, including the 29/18/8 `dark:` recount, the ported
`PRESENTER_TONE_CLASS` shades, and `ArtifactSlide.tsx:128`'s literal `#FFFFFF` fallback.

**Two subagent claims did not survive re-verification and are corrected where they appear below.**
(a) Two layers reported Tailwind 4's `bg-(--card)` colour shorthand as *already in use* at
`ui/card.tsx:15` and `ui/popover.tsx:40`. The syntax is there, but for `--card-spacing` and
`--transform-origin` — **not** a colour token. `grep -rnoE '\b(bg|text|border|shadow|ring|fill|stroke)-\(--[a-z-]+\)' src/`
returns nothing, so that guard gap is **latent, not a live leak**, and is rated accordingly.
(b) One layer read `LogoutButton.tsx:5`'s unused `Button` import as introduced here;
`git show HEAD:src/components/LogoutButton.tsx` carries it too.

**Decision needed**

- [x] [Review][Decision] **The AC-4 shell guarantee has four holes, not one, and they share a root: the shell belongs to the app, not to the route** (high) — Round 1 closed the shell leak for the two full-screen *Clients*. The AD-24 gate then found the two *route shells*. Two further holes surfaced here, and all four are the same defect at different depths. (1) **First paint, every load.** `use-projected-shell.ts:33` is a `useEffect`, so from the SSR paint until hydration completes, `html` keeps `scrollbar-gutter: stable` and `body` keeps `bg-background` — and next-themes' blocking script has *already* resolved `.dark` on `<html>` by then, so that paint follows the operator's choice. `useLayoutEffect` does **not** fix it; the leaked paint is the server's. (2) **The two Server-Component error branches** (`slideshow/page.tsx:76`, `projector/page.tsx:71`) — the open item filed above. (3) **`notFound()`**, six reachable sites (`slideshow/page.tsx:38,50,56` and `projector/page.tsx:37,49,55`): `find src -name "not-found.tsx" -o -name "error.tsx" -o -name "global-error.tsx"` returns **zero**, so Next renders its default 404 inside the themed root layout at a room-facing URL, full-screen, gutter and all. (4) **`PROJECTED` is closed downward but never upward** — the closure test walks imports *out of* projected files, so `layout.tsx` above them is unchecked, as would be any future `error.tsx` / `loading.tsx` / `template.tsx` at the same URL, which is verbatim the argument used to add `page.tsx` to the set. **The decision:** one structural fix — a route-group layout owning every room-facing URL, with `FULL_SCREEN` widened to it — closes all four including the ones nobody has written yet; four point-fixes close none of them. The spine's *Deferred* already records three candidates and names the route-segment layout as the only one that catches an unannotated future shell. Choosing the point-fix route is legitimate but must be recorded as such, because AD-24 stays `[ADOPTED, partial]` until this closes. **Owner's call (2026-07-31): the route-group layout.** One layout owning every room-facing URL, with `FULL_SCREEN` widened to it — the fix that also catches the shell nobody has written yet. **This is not a patch against 17.1**: it is a new route surface, so per `AGENTS.md` it carries an `EXPERIENCE.md` IA-table update, and it is the change that takes AD-24 from `[ADOPTED, partial]` to `[ADOPTED]`, which routes through a `bmad-architecture` Update run rather than an inline spine edit. It is therefore the scope of **Story 17.7** (see the next item), and this bullet is its specification, not its execution. Note for whoever implements it: `useLayoutEffect` is not a shortcut here — the paint that leaks is the server's, so the closure has to be CSS or a server-emitted class, not a hook running earlier. **RESOLVED 2026-07-31 as a SPECIFICATION, not as work.** This bullet is Story 17.7's scope and is deliberately not executed here — it is a new route surface, so it carries an `EXPERIENCE.md` IA-table update, and it is the change that takes AD-24 to `[ADOPTED]`, which routes through a `bmad-architecture` Update run. What landed here: all four holes are now recorded in `ARCHITECTURE-SPINE.md`'s *Deferred* (it had only the two shells), the owner's choice of the route-group layout is recorded there, and so is the note that `useLayoutEffect` is not a shortcut because the leaking paint is the server's.
- [x] [Review][Decision] **Does 17.1 close with a known-open AC-4 hole, and under whose key?** (high) — The story asserts at :220 *"All seven AC are satisfied"* and at :266 *"AC-4 is now met"*, while :89-90 in the same file says *"its shell guarantee does not [hold]"*, :98 files that as open and unowned, and `ARCHITECTURE-SPINE.md:207` tags AD-24 `[ADOPTED, partial]` for precisely it. A story at `review` cannot carry both statements, and this workflow will not pick for the owner. Either (a) 17.1 closes with AC-4 scoped in writing to the token guarantee, and the shell guarantee moves to a new key — `17-7` by the current numbering, registered in `epics.md` **and** `sprint-status.yaml`, per the precedent 17.6 set — or (b) 17.1 stays open until the shell fix lands, and AD-24 goes to `[ADOPTED]` in the same change set. Whichever is chosen, :220 and :266 must be rewritten to match; leaving them is how the next reader learns the record cannot be trusted. **Owner's call (2026-07-31): 17.1 closes; the shell guarantee spins out to Story 17.7.** So this becomes a patch with three parts, and all three are required before 17.1 can be `done`: (a) **AC-4 is scoped in writing to the token guarantee** — the projected tree paints in literal colours or registry-resolved inline styles, enforced by `PROJECTED`; the *shell* behind it becomes 17.7's contract, and AC-4 says so explicitly rather than by omission. (b) The open unowned item at :98 and the four-hole decision above are **re-filed under key 17.7**, registered in `epics.md` **and** `sprint-status.yaml` per the precedent Story 17.6 set the same day, so the key resolves to something instead of naming a story that does not exist. (c) :220 (*"All seven AC are satisfied"*) and :266 (*"AC-4 is now met"*) are rewritten to state what is true — AC-4's token half is met and browser-verified; its shell half is 17.7's — and `ARCHITECTURE-SPINE.md`'s `[ADOPTED, partial]` tag gains 17.7 as the key that will take it to `[ADOPTED]`, so the partial tag stops being a dead end. **RESOLVED 2026-07-31, all three parts.** (a) AC-4 is scoped in writing, on two axes, with the amendment flagged as outside this workflow's normal edit surface and attributed to the owner. (b) The unowned item at `:98` is re-filed under **Story 17.7**, which is registered in `epics.md` and `sprint-status.yaml` — that registration had in fact already landed in commit `116ba3d`, so this part was half-done before this pass and is now complete. (c) *"All seven AC are satisfied"* and *"AC-4 is now met"* are rewritten below, and `ARCHITECTURE-SPINE.md` names 17.7 as the key that closes its `[ADOPTED, partial]` tag.
- [x] [Review][Decision] **AC-4's contract sentence is now false for the preview, and it was narrowed by a dismissal rather than an amendment** (medium) — AC-4 reads *"presented, **previewed**, downloaded or projected → the output is byte-identical."* `SlidePreviewList.tsx:44-49` now makes the Live Slide Preview deliberately theme-dependent, which round 1 resolved as correct and desirable. The *intent* — the congregation never sees operator chrome — is intact; the sentence is not. It was settled in a *Dismissed as noise* line (:116) on the ground that the preview renders no projected pixel, which is true but is not what the sentence says. Either amend AC-4's wording to exclude operator-side preview, or record the narrowing as an explicit scope note under the AC. Related and not independent: `DESIGN.md`'s Components row still describes that same list as *"a scrollable strip of scaled `slide-surface` instances"* (patch below), so the artifact currently contradicts the ground the dismissal stood on. **Owner's call (2026-07-31): amend AC-4's text.** The sentence is reworded to exclude operator-side preview, so that the AC's intent and its wording are both true rather than the intent carrying the wording. This is the same edit as (a) in the item above and must be made once, coherently: AC-4 ends up scoped on **two** axes — *what* is guaranteed (literal colours in the projected tree, not the shell) and *where* it is guaranteed (projected output, not the operator's preview of it). The round-1 dismissal at :116 stays correct on its own ground and is left standing; the `DESIGN.md` Components row that contradicts it is fixed as its own patch item below. **RESOLVED 2026-07-31.** The word *previewed* is gone from AC-4, and the WHERE axis states why: `SlidePreviewList` is hub chrome, themes deliberately, and renders neither `SlideView` nor `ArtifactSlide` — verified across **nine** call sites of the two, not the seven the review reported. The round-1 dismissal stands on its own ground; the `DESIGN.md` row that contradicted it is fixed as its own item below.

**Patch — unambiguous fixes**

- [x] [Review][Patch] **The AC-6 sweep stops four sites short of its own criterion** (high) [src/app/announcements/AnnouncementsManager.tsx:337] — Round 1's resolution states the rule it applied: *"shades with no dark half in files that became dark-switchable underneath them."* It found two such files and stopped. Four more sites meet that rule exactly, in two files that contain **zero** `dark:` utilities (`grep -c 'dark:'` → 0 for both): `AnnouncementsManager.tsx:337-338` — `text-emerald-600` on `bg-emerald-500/10` and `text-amber-600` on `bg-amber-500/10`, the identical pair fixed in `SlidePreviewList` at a measured **4.23:1** and 4.76:1 on the dark card, and these are `text-[10px]`, so the 4.5:1 small-text floor applies and emerald fails it; `AnnouncementsManager.tsx:372` — `text-red-600` on `bg-red-500/10`, the identical pair fixed in `LogoutButton` at **3.76:1**; `ArtifactEditor.tsx:851` — `text-emerald-600` as the success line beside `text-destructive`, byte-identical to the `Header.tsx:185` line this change set *did* fix. `HymnNumberAutocomplete.tsx:453` and `services/[id]/page.tsx:211` already carry dark halves, which is what makes the four omissions read as oversight rather than scope. **RESOLVED 2026-07-31.** All four sites fixed: `AnnouncementsManager.tsx` badges take the ported `emerald-200`/`amber-200` halves, its *Remove* button takes `text-destructive`, and `ArtifactEditor.tsx:851` takes `dark:text-emerald-400` — the same fix `Header`'s byte-identical line already had. Recorded in `DESIGN.md` as a table of site/was/now. **One thing is NOT done and is stated rather than implied:** each pair was not re-measured on its own host surface, because dependency install is blocked in this environment (see Debug Log) so no browser was available. No new colour pair enters the product — every replacement is a pair measured earlier in this same story — but a per-surface confirmation for these three files is outstanding.
- [x] [Review][Patch] **`LogoutButton`'s hand-rolled red pair *is* `--destructive`, in both themes** (medium) [src/components/LogoutButton.tsx:8] — Verified against `node_modules/tailwindcss/theme.css` and `globals.css`: `--color-red-600: oklch(57.7% 0.245 27.325)` equals `:root --destructive: oklch(0.577 0.245 27.325)`, and `--color-red-400: oklch(70.4% 0.191 22.216)` equals `.dark --destructive: oklch(0.704 0.191 22.216)`. Byte-identical on both halves. So `text-destructive` alone reproduces the entire shipped effect, cannot drift when the identity is retuned, and retires the six-line comment that reasons its way to *"it is the token this affordance would have used had it been written against one"* and then hardcodes the hue pair anyway. The comment is right; the code should do what it says. **RESOLVED 2026-07-31.** `text-destructive` replaces the pair, and the six-line comment that reasoned its way to the token and then hardcoded the hue is retired for one that records the equality as the reason. Verified against `globals.css`: `:root --destructive` is `oklch(0.577 0.245 27.325)` and `.dark` is `oklch(0.704 0.191 22.216)`, matching `--color-red-600`/`--color-red-400`. Applied to `AnnouncementsManager`'s *Remove* button too, which carried the identical pair. A guard now fails on `text-red-600` in either file, and `DESIGN.md` Open Item 4 records that `red` fell from 4 shades to 2 as a result.
- [x] [Review][Patch] **`ArtifactSlide` still accepts the `className` `SlideView` just stopped forwarding** (medium) [src/components/artifacts/ArtifactSlide.tsx:220] — Round 1 removed the pass-through at `SlideView` and added a regex guard. `ArtifactSlide` still declares `className = ''` and splices it onto the wrapper the congregation sees, and it now has exactly one caller, which passes nothing — the parameter is dead. Deleting it turns the invariant into a compile error. As shipped it is policed by `/<(SlideView|ArtifactSlide)\b([^>]*)>/` over `.tsx` files only, so a `{...props}` spread, a `React.createElement(ArtifactSlide, { className })`, a renamed default import and any `.ts` call site all pass. `SlideView`'s own new comment argues the principle — *"Styling a projected slide from the outside is not a thing to make convenient"* — and then leaves it unapplied one level down. **RESOLVED 2026-07-31.** The parameter is deleted, so the wrapper is no longer stylable from outside at all and the invariant is a compile error rather than a regex — which is what closes the `{...props}` spread, `React.createElement`, renamed-import and `.ts` call-site paths the guard could not see. A new test asserts neither component so much as *accepts* a `className`, checked against the exported parameter list rather than the file text (both files legitimately set `className` on their own elements — the first version of this assertion did not distinguish those and failed correctly). Negative-tested by restoring the parameter.
- [x] [Review][Patch] **Focus rings on projected surfaces paint from `--ring`, and the guard's own evidence was gathered unfocused** (medium) [src/app/services/[id]/slideshow/SlideshowClient.tsx:63] — `globals.css:122` applies `outline-ring/50` through the universal selector, so `outline-color` resolves from `--ring` — `oklch(0.708 0 0)` light vs `oklch(0.556 0 0)` dark (verified in `globals.css:69,104`). The UA's `:focus-visible` supplies the width the guard relies on being absent, and an author-declared `outline-color` beats `-webkit-focus-ring-color`. Focusables exist on both projected surfaces: `SlideshowClient.tsx:63`'s `Exit` link, and the two recovery links in the slideshow failure branch. `EDGE_UTILITY` matches width utilities only and structurally cannot see this. The test's supporting measurement — *"14 of 14 elements at `0px` on all four sides, no outline"* — was taken with nothing focused, and its comment generalises that to *"it paints nothing today."* Fix: a literal `focus-visible:outline-white` on projected focusables, and narrow the comment's claim to what was measured. **RESOLVED 2026-07-31.** All three projected focusables — the slideshow's *Exit* link and the two recovery links in its failure branch — state `focus-visible:outline-white`. A colour and no width, deliberately: the UA supplies the width on `:focus-visible`, and a width utility here would trip the edge guard, correctly. `ProjectorClient` was checked and has **no focusable at all**, so it needs nothing. A new guard asserts every `<Link>` in both files states its own outline colour, and the comment's *"14 of 14 at 0px"* evidence now says **with nothing focused**, which is what was actually measured.
- [x] [Review][Patch] **The rewritten failure screen cannot scroll, and its parity comment is false in both directions** (medium) [src/app/services/[id]/slideshow/page.tsx:76] — The branch is `fixed inset-0 … overflow-hidden` with `justify-center`, replacing a normal-flow `Card` on a page that scrolled. An `ArtifactHydrationError` message carries up to five `key=value` scope pairs (`runtime-contract.ts:125-134`) rendered at `text-xl font-mono`; on a short viewport the detail is clipped at both ends and the `mt-10` recovery links go off-screen with nothing able to reach them — on the one screen whose entire job is telling the operator how to recover. Use `overflow-y-auto`, or cap the detail block with its own scroll. The comment above it claims *"Same information, same two recovery routes"* and *"this one now matches it"*; neither holds. The `CardDescription` sentence (*"The artifact registry could not produce this service's slides…"*) is simply gone, and `projector/page.tsx:71` is not this branch's precedent — it has no `overflow-hidden`, no recovery links, and a different headline (*"Slides unavailable"* vs *"Slides cannot be built"*). One of the two headlines is wrong. A comment asserting parity beside code that has none is the exact defect class this change set's own test header rails against. **RESOLVED 2026-07-31.** The branch is now `fixed inset-0 overflow-y-auto` with a `min-h-full` inner column, so it centres while it fits and grows past the fold when a five-pair `ArtifactHydrationError` does not. The false parity comment is replaced by one that states the two real differences (this page offers navigation the projector window has nowhere to send; it scrolls). The dropped registry sentence is restored, and the headline is unified to the projector's **Slides unavailable** — one failure at two room-facing URLs should not have two names. `EXPERIENCE.md`'s state row carries both changes.
- [x] [Review][Patch] **`DESIGN.md` Open Item 6 states the opposite of the finding it was filed to own** (medium) [_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md:234] — Verified verbatim, same file, two sections apart. `:130` reads *"The focus indicator holds in dark (`--ring` 4.18:1) and **fails in light (2.58:1)**, so on the light theme neither the resting edge nor the focus ring reaches the floor."* `:234`, the Open Item that owns it, reads *"`--ring` (focus) **passes** at 4.18:1, so the failure is the **resting** edge."* `EXPERIENCE.md` → *Accessibility Floor* and the story's own Completion Notes (:293-297, which cite Open Item 6 as where the 2.58:1 failure was filed) both side with `:130`. Whichever number is right, the item that owns the finding currently denies it — and it is the item carrying *no owner*, so nothing downstream will catch the denial. **RESOLVED 2026-07-31.** The item now records **two** failures: the resting edge fails in both themes (`--border` 1.29:1 dark / 1.26:1 light) *and* the focus ring fails in the light theme at **2.58:1** while holding in dark at 4.18:1. It also names what went wrong — the dark figure was quoted as though it were the only one, two sections after *Contrast* had already recorded the light failure — because the item that owns a finding is the worst place for it to be contradicted, and this one has no owner.
- [x] [Review][Patch] **`DESIGN.md` Open Item 4's counted inventory counts doc-comment prose as utilities — including prose this change set added** (medium) [_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md] — Claimed: *"`red` 20 uses … `emerald` 20 at 4 in 5."* Actual utility counts over `src/` are **emerald 18** and **red 19**; the claimed figures reproduce only by matching `emerald-[0-9]` / `red-[0-9]` including mentions inside doc comments (20 and 21) — and three of those mentions sit in the comment this change set added at `LogoutButton.tsx:8-12`. The `amber` 43/6/8, `indigo` 10, `sky` 3 and *"11 files"* figures all reproduce exactly, so the defect is narrow and the method is the point: the item ends *"Any future recount states its grep or it will be wrong again"* and states no grep. In a change set whose central lesson is that prose about a token is not a token, an inventory that counts comments is the same error one artifact over. **RESOLVED 2026-07-31.** Recounted with **comments stripped first** and the grep **quoted in the item**, which it had demanded of its successor without supplying. Result: `amber` 45 uses / 6 shades / 8 files, `emerald` 19 / 4 / 5, `red` 14 / 2 / 4, `indigo` 9 / 4 / 2, `sky` 3 / 2 / 1 — **90 utilities across 11 files**. The item now records that its numbers have been wrong four times and that the immediately preceding count matched `emerald-[0-9]` including doc comments, three of those mentions being in prose this story had just written.
- [x] [Review][Patch] **`DESIGN.md`'s Components row still describes the preview list as something it is not** (medium) [_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md:164] — The row reads *"the preview list is a scrollable strip of scaled `slide-surface` instances."* `SlidePreviewList.tsx` renders text rows with badges and no `SlideView` / `ArtifactSlide` at all — verified across all seven call sites of both, which live only in `ProjectorClient`, `SlideshowClient`, `PresenterOperator` and `SlideGridDialog`. This change set appended the badge two-halves sentence to that same row and left the false half standing. It is not cosmetic: round 1 dismissed AC-4's word *previewed* on exactly the ground that this list renders no slide, so the authoritative artifact now contradicts a dismissal that depends on it. Round 1 deferred the missing `slide-surface` class as pre-existing; *"scaled slide instances"* is a separate false claim in the same row and was not covered by that defer. **RESOLVED 2026-07-31.** The row now says plainly that `SlidePreviewList` renders no slide — it is text rows with badges — and separates it from `SlideView`, which the row had conflated. Both false halves are named: `slide-surface` is cited by that file and defined nowhere in `src/` (still deferred, still unowned), and there are no scaled slide instances either. It also records **why** it mattered: round 1 dismissed AC-4's word *previewed* on exactly this ground.
- [x] [Review][Patch] **The test labelled AC-6 pins nothing AC-6 asks for, and AC-1's persistence clause has no net at all** (medium) [tests/theme-chrome.test.mjs:534] — AC-6 requires the dark palette's load-bearing pairs measured with a real checker and recorded in `DESIGN.md` *as measurements*. The single `AC-6` test asserts only that `dark:text-{emerald,amber,indigo}-` appears inside `TONE_CLASS` — badge shades that `DESIGN.md` itself classifies as *"not a palette token pair."* Nothing pins the four measured pairs, nothing pins the recording in `DESIGN.md`, and nothing pins AC-1's *"survives a reload and a new tab."* The suite's header presents itself as AC-4's regression net and the story presents it as the story's; for AC-6 and AC-1 the label is doing work the assertions are not. **RESOLVED 2026-07-31.** AC-6 now asserts the four load-bearing pairs are recorded in `DESIGN.md` **with a ratio**, scoped to the *dark* table — negative-testing caught that a document-wide match passed with the dark figure deleted, because the light table carries the same four pair names. The badge assertion is kept but widened to every file that hosts a chromatic shade. AC-1's persistence clause now has a net: no `forcedTheme`, no cleared `storageKey`, and the control must write through `setTheme` rather than toggling the class by hand.
- [x] [Review][Patch] **Nothing in the change set tests behaviour, and the untested path is the one that would strand the app shell** (medium) [tests/theme-chrome.test.mjs] — All 28 assertions are regexes over source text. Nothing exercises the cycle order (`ORDER` plus the modulo at `ThemeToggle.tsx:63` is precisely where an off-by-one would live and ship green), that `setTheme` is reached, that the placeholder swaps to a state icon — or, most consequentially, that `useProjectedShell` both **sets and restores** the five properties it snapshots. That hook is a pure DOM mutation with no React dependency: it is testable with a minimal `document` stub inside the existing `node:test` harness, no new dependency and no browser. The restore path is where a bug leaves the operator's whole app shell pinned at literal black after leaving a projected route. **RESOLVED 2026-07-31.** The DOM half of the shell claim is extracted to `src/lib/projected-shell.ts` with no React in it, and three behaviour tests drive it against a document stub: it sets all five properties, **restores** all five, keeps the shell black while a second claim is open, and treats a repeated release as a no-op. The cycle is extracted to `src/lib/theme-cycle.ts` and two more tests walk it — every state reachable, the wrap closing on `system`, and an unrecognised stored value reading as `system`. That is the restore path and the modulo, the two places the review named as untested and consequential.
- [x] [Review][Patch] **The token guard misses Tailwind 4's colour-variable shorthand and arbitrary widths** (medium) [tests/theme-chrome.test.mjs:104] — Run through the shipped `themeReferences()` verbatim: `bg-(--card)`, `bg-(--card)/50`, `text-(--foreground)`, `border-(--border)` and `shadow-(--ring)` are all **missed** — the utility regex needs `prefix-token` and `cssVar` needs a literal `var(`. On the edge side `[border-width:2px]` and `style={{ borderWidth: 1 }}` are missed, and either one turns the universal `border-border` colour into a painted, theme-varying edge, which is the guard's entire premise. **Corrected from the subagents' report:** no colour-token shorthand exists in `src/` today, so this is latent rather than an active leak — but the `-(--var)` form is already idiomatic here for non-colour variables (`ui/card.tsx`, `ui/popover.tsx`), which is what makes it a plausible next spelling rather than a hypothetical. Same class of hole the guard already closed twice, for `border-t-border` and `ring-1`. **RESOLVED 2026-07-31.** The token guard gained Tailwind 4's `prefix-(--token)` shorthand (with and without an opacity slash, and tolerating the `--color-` spelling), and the edge guard gained the arbitrary-property form `[border-width:2px]` and the inline-style form `borderWidth:`. Negative-tested one spelling at a time: `bg-(--card)`, `bg-(--card)/50`, `[border-width:2px]` and an injected `borderWidth: 1` all fail now. The review's own correction is kept — no colour shorthand exists in `src/` today, so this was latent rather than live.
- [x] [Review][Patch] **The AC-3 guard reads the first `className` in source order, not the outermost element** (medium) [tests/theme-chrome.test.mjs:344] — It takes `classNameValues(body)[0]` while its own failure message calls that *"the OUTERMOST classed element of the exported surface."* Any early-return branch carrying a `className` — loading, empty, error — silently becomes the checked element, so a stray `dark` on such a branch satisfies the assertion after the real surface root has lost it. Round 1 rewrote this guard specifically to stop checking string position rather than structure; it now checks a different position. **RESOLVED 2026-07-31.** The guard now extracts **every** JSX-returning branch of the exported surface and requires the root of each to carry `dark` as a class token, instead of taking the first `className` in the file. Effect cleanups (`return () => …`) are excluded by requiring a `<` after the paren. Both surfaces have exactly one branch today, so the weakness was latent — which is what made it cheap to close. Negative-tested by injecting an early return with a non-dark wrapper.
- [x] [Review][Patch] **`PROJECTED` is closed downward but never upward, and `@/lib` is exempt wholesale** (medium) [tests/theme-chrome.test.mjs:233] — The closure test walks imports *out of* projected files, so nothing checks what renders *above* them; see the decision item for the `layout.tsx` / `error.tsx` half. The other half is inside the same function: `@/lib/*` is filtered out entirely on the stated ground that it is *"data, helpers and hooks — not markup."* That is true today and is not enforced, so a class-name constant or a JSX helper placed in `@/lib` reaches the projected surface unscanned — and this change set has just established `@/lib` as where projected-surface logic goes. Exempt only files whose own `themeReferences()` is empty, rather than the directory. **RESOLVED 2026-07-31 for the half this story owns.** No directory is exempt by name any more: the closure test walks the projected tree **transitively** and requires every module it reaches to be in `PROJECTED` or to have an empty `themeReferences()`, with `import type` specifiers dropped because types erase. Negative-tested by hiding a class-name constant in `@/lib/transitions.ts`. The **upward** half — the root layout, an `error.tsx`, a `template.tsx` at the same URL — is Story 17.7's contract and is now stated as such in the test's own header rather than left as a silence.
- [x] [Review][Patch] **The pre-mount placeholder highlights under the cursor while swallowing every click** (medium) [src/components/ThemeToggle.tsx:82] — `focusableWhenDisabled` makes Base UI emit `aria-disabled` and omit the native `disabled` attribute (confirmed in `node_modules/@base-ui/react/utils/useFocusableWhenDisabled.js`), which is exactly what the comment wants — but Tailwind's `disabled:` variant targets `:disabled`, so **neither** `disabled:opacity-50` **nor** `disabled:pointer-events-none` from `buttonVariants` applies. The placeholder therefore keeps `hover:bg-card hover:text-foreground` from `shell` and lights up on hover while inert. The comment reasons carefully about the opacity half and states the intent the other half breaks: *"What it must not do is look interactive while inert."* **RESOLVED 2026-07-31.** The placeholder states `aria-disabled:pointer-events-none` — the `aria` twin of the class that was meant to do this and could not, since Tailwind's `disabled:` variant compiles to `:disabled` and Base UI emits no native `disabled` under `focusableWhenDisabled`. The comment records the consequence honestly: a click now passes through to the header row instead of being swallowed, which is the same nothing from the operator's side. Guarded and negative-tested. `DESIGN.md`'s row carries it too.
- [x] [Review][Patch] **Story-record repairs: five statements the change set left inconsistent with itself** (medium) [_bmad-output/implementation-artifacts/stories/17-1-reachable-dark-mode.md:221] — All verified in place. (a) `:221-222` still describes *"17 assertions across four groups … its four known files"*; shipped is **28** tests, **five** groups, and `PROJECTED` holds **six** files — and a later bullet in the same section says 17 → 28, so the record contradicts itself on one page. (b) `:276` says *"**Two** chromatic text pairs were failing AA"* while `:356`, `:103` and `sprint-status.yaml` all say **three**; three is correct (`emerald-600` at 4.23:1 is below 4.5:1), so the Completion Note undercounts the defect the story fixed. (c) The File List omits `deferred-work.md` and `ARCHITECTURE-SPINE.md`, both modified in this change set — the second being the spine amendment `AGENTS.md` requires *in the same change set*, and the one the Change Log already describes. (d) The same section still says *"none of the **six** changed files appears in the lint output"*; the change set touches **13**. (e) AC evidence citations drifted with this change set's own edits: AC-2 cites `layout.tsx:26` for `suppressHydrationWarning` (now **31**), AC-4 cites `ProjectorClient.tsx:125,145,162` for the literals (now **102,122,123**, after 26 lines were removed from that file). **RESOLVED 2026-07-31, all five.** (a) The test-count sentence is rewritten — and the number moved again, to **43 tests from 30 declarations** across **eight** groups over six `PROJECTED` files. (b) *"Two chromatic text pairs"* is **three**. (c) The File List gains `ARCHITECTURE-SPINE.md` and this round's files. (d) *"none of the six changed files"* is stated against the real count. (e) The drifted citations are repaired: `layout.tsx:26` → `:32`, and `ProjectorClient.tsx:125,145,162` → `:110,130,131`.
- [x] [Review][Patch] **Guard robustness: three ways the scanner can be broken or fooled without anyone noticing** (low) [tests/theme-chrome.test.mjs:48] — (a) `stripComments` removes every `/* … */` run with a non-greedy global regex, so a `*/` inside a string or regex literal in any scanned file silently deletes real code from the scan; and it drops line comments only when `//` opens the line, so a trailing `// use bg-card here instead` re-admits the exact false positive the mechanism exists to remove. (b) Two guards are anchored to source layout: AC-6 slices between `indexOf('const TONE_CLASS')` and `indexOf('const BADGE_CLASS')`, so hoisting `BADGE_CLASS` above `TONE_CLASS` yields an empty slice and three opaque failures; `mountGuardBranch` matches `/if \(!mounted\) \{[\s\S]*?\n {2}\}/`, pinned to a literal two-space closing brace, so re-indenting or extracting the branch breaks it. (c) `UTILITY_PREFIXES` lists `inset-ring` but not `inset-shadow` or `text-shadow` (both caught only incidentally by the bare `shadow` prefix); `border-border` is reported **twice**, once as a token and once as an "edge" because the trailing bare `border` satisfies `EDGE_END`, which will send the next reader hunting a width that does not exist; `componentImports` counts `import type` specifiers, which are erased at build and can contribute no markup; and `/\bdark:[a-z[]/` misses negative-value variants (`dark:-mt-1`) despite the doc advertising `dark:` as one of exactly three routes. **RESOLVED 2026-07-31.** (a) `stripComments` is a character scanner that skips string and template regions, so a `*/` inside a string no longer deletes real code **and** trailing `// use bg-card here` comments are stripped rather than re-admitted — the line-start rule was a workaround for not being able to see strings, and `xmlns="http://…"` is safe because it is inside one. Both negative-tested. (b) The `TONE_CLASS` slice and the mount guard are extracted by **brace balancing**, so hoisting a declaration or re-indenting the branch no longer breaks the test instead of the code. (c) `inset-shadow` and `text-shadow` added to the prefixes; a `(?<![-\w])` lookbehind replaces `\b` so `border-border` is no longer double-reported as a phantom edge; `import type` dropped; the `dark:` class widened to catch `dark:-mt-1`.
- [x] [Review][Patch] **`ThemeToggle` chrome consistency: three deltas from the row it was built to match** (low) [src/components/ThemeToggle.tsx:74] — (a) It is the only control in the header row without `cursor-pointer` (`grep -c` → `ThemeToggle` 0, `Header` 4, `LogoutButton` 1; `buttonVariants` sets none), so it shows a default arrow where every neighbour shows a pointer. (b) `shell` hand-reproduces the inactive branch of `Header.getLinkClass` — `border-border bg-card/50 text-muted-foreground shadow-sm hover:bg-card hover:text-foreground` — rather than sharing it, and the test pins only two of those seven classes (`dark:bg-card/50`, `dark:border-border`), so a restyle of `getLinkClass` drifts the toggle silently: the precise failure the class's own comment says this control cannot have. (c) It is rendered inside `<nav>` — a settings control in a navigation landmark — on a row (`Header.tsx:76`, `flex items-center gap-2`) with no `flex-wrap` that already carries four links plus the profile button for an admin, so the sixth control tightens an already-unwrappable row. **RESOLVED 2026-07-31, all three.** (a)+(b) The seven hand-reproduced classes are now one shared constant, `HEADER_CONTROL_BOX` in the new `src/components/header-chrome.ts`, read by both the toggle and `Header`'s pills — so a restyle carries both, and `cursor-pointer` comes from there (it is free for an `<a href>` and was missing on the one `<button>`). It lives in a third file because `Header` already imports `ThemeToggle`, so importing back would close a cycle. (c) `<nav>` now ends where the links end: the toggle and the profile menu sit beside it, not inside the navigation landmark, and the row is `flex-wrap`. Both guarded and negative-tested.
- [x] [Review][Patch] **`ThemeProvider` omits `disableTransitionOnChange`** (low) [src/components/ThemeProvider.tsx:22] — `Header.getLinkClass` puts `transition-all` on every nav pill, and the profile button, logo tile, dropdown items and every `buttonVariants` control carry it too. Flipping the theme therefore animates every colour in the shell instead of repainting, producing a staggered smear on the one control whose job is to make the change feel deliberate. next-themes ships the flag for exactly this. **RESOLVED 2026-07-31.** Added, with the reason recorded in the file and in `DESIGN.md`: `transition-all` is on every nav pill, the profile button, the logo tile, the dropdown items and every `buttonVariants` control, so without the flag one press animates all of them and the shell smears through an intermediate palette. Guarded.
- [x] [Review][Patch] **`useProjectedShell` is not reference-counted, and this change set doubled its callers** (low) [src/lib/use-projected-shell.ts:32] — It snapshots the live inline styles on `html`/`body` at mount and restores them at unmount, which is correct for exactly one concurrent consumer. With two — a presenter-embedded slideshow, an overlay route, anything the next story adds — the second snapshot captures the first's `#000000`, and the first cleanup then restores black to the operator's app shell permanently. The doc says *"hand it back on unmount"* and does not say *once*. Either count references or state the single-caller contract in the file. **RESOLVED 2026-07-31.** The claim is reference-counted: only the first claim snapshots and only the last release restores, and a release is single-shot so a stale call cannot decrement twice. The doc no longer says *"hand it back on unmount"* without saying *once* — it states why, including that this story took the callers from one to two and 17.7 adds a third over the same URLs. Behaviour-tested in both directions.
- [x] [Review][Patch] **`ProjectorClient` sets no text colour while `SlideshowClient` does** (low) [src/app/services/[id]/present/projector/ProjectorClient.tsx:102] — `body { @apply text-foreground }` therefore reaches any projected node in the projector that does not set its own colour. The test explicitly declines to guard this (*"No guard is added for it here"*) and rests instead on a manual browser observation plus `ArtifactSlide.tsx:128`'s `?? '#FFFFFF'` fallback. Adding `text-white` to the projector's root — one word, matching the slideshow's own wrapper — makes the invariant structural rather than observational, and costs nothing. **RESOLVED 2026-07-31.** `text-white` added to the projector's root, matching the slideshow, so the invariant stops resting on an observation about `ArtifactSlide`'s `#FFFFFF` fallback. Guarded — and the guard had to be fixed once: a file-wide `/\btext-white\b/` passed with the root stripped bare, because both files carry `text-white/70` and `hover:text-white` on inner chrome. It now reads the **root element's** className. Negative-testing is what caught that, and it is the same substring-satisfiable defect this pass exists to remove.
- [x] [Review][Patch] **`themeTokens()` re-reads and re-parses `globals.css` on every call** (low) [tests/theme-chrome.test.mjs:74] — `themeReferences()` invokes it each time, so a single run reads the same immutable file off disk about nine times, rebuilds a 30-token alternation and three regexes each time, and re-runs the `names.length > 20` assertion nine times. Hoist the token list and the compiled regexes to module scope. **RESOLVED 2026-07-31.** The token list, the prefix alternation and all four compiled regexes are hoisted to module scope and built once. The `names.length > 20` sanity assertion runs once with them.
- [x] [Review][Patch] **`LogoutButton.tsx:5` imports `Button` and never uses it** (low) [src/components/LogoutButton.tsx:5] — The element is a native `<button>`. This is the **only** lint problem in any of the 13 changed files (`npx eslint` over all of them: 1 warning, 0 errors), and it is pre-existing rather than introduced — but the file is in the change set and the fix is deleting one line. Note the adjacency: the `destructive` variant of `ui/button.tsx` is what this hand-rolled button is approximating, which is the deferred item below. **RESOLVED 2026-07-31.** Deleted, in the same edit that replaced the hand-rolled red pair with `text-destructive` — the import sat directly above the comment that block replaced. This was the only lint problem in any changed file, and it was pre-existing.

**Deferred — pre-existing, not caused by this change set**

- [x] [Review][Defer] **The contrast audit ran in one direction only, and the light half of the two forms it names is worse than anything it fixed** [src/app/services/new/CreateForm.tsx:444] — deferred, pre-existing. `CreateForm.tsx:444,447,473,481,483` and `EditForm.tsx:463,471,473` paint `text-amber-200`, `text-amber-300` and `text-red-200` on `bg-amber-500/10` / `bg-red-500/10` over `bg-background`, with no `dark:` half and no `.dark` ancestor (`services/new/page.tsx:39` is `bg-background text-foreground`). In the **light** theme the amber banners land near 1.15:1 — effectively invisible. These are the date-collision warning, the save-error banner and the missing-hymn warning, in the very *"both forms"* the story names as `SlidePreviewList`'s host. Pre-existing and unchanged by this story (these shades never had a dark ancestor to key against, so they always rendered light and always failed there). Recorded because the new AC-6 test asserts only the **presence** of a `dark:` half and is therefore structurally incapable of catching a dark shade stranded on a light surface — so the direction this story did not audit has no net either. Belongs with Story 17.2 or `DESIGN.md` Open Item 4.
- [x] [Review][Defer] **`PresenterOperator` pins `dark` on its own wrapper but never on the shell behind it** [src/app/services/[id]/present/PresenterOperator.tsx] — deferred, pre-existing. AC-3's opt-out is a wrapper class, so `html`/`body` keep `bg-background` plus the reserved gutter: with the operator on light, a white canvas and a white gutter strip frame the dark Presenter, in the dim sanctuary the AC's own rationale invokes. Pre-existing in the sense that nothing outside the presenter carried `.dark` before this change set either, so the mismatch already shipped — but the mechanism is identical to the one `useProjectedShell` was extracted for, and if the decision item above adopts a route-group shell, this surface is the obvious third consumer.
- [x] [Review][Defer] **`LogoutButton` hand-rolls what `ui/button.tsx`'s `destructive` variant already provides** [src/components/LogoutButton.tsx:16] — deferred, pre-existing. The variant ships `bg-destructive/10 text-destructive hover:bg-destructive/20` plus focus-visible and `aria-invalid` handling; `LOGOUT_CLASS` reproduces a subset by hand and drops the focus treatment. Distinct from the `text-destructive` patch above, which is the one-class colour fix inside the current shape; this is the larger refactor to the variant, and it is pre-existing.

**Dismissed as noise (2):** a `localStorage.theme` value outside `ORDER` — raised again by a layer that could not see round 1, and dismissed again on round 1's reasoning, which re-verified (next-themes applies the stored string as the `<html>` class without validating against `themes`, but reaching that state requires hand-editing the origin's storage, and the control reports `system` meanwhile); AC-5 being asserted about a `Toaster` that nothing mounts — correct, and already owned: round 1 resolved it at the owner's direction as `EXPERIENCE.md` Open Item 4 under **Story 17.6**, which is registered in `epics.md` and `sprint-status.yaml`. Not re-opened here.

## Dev Notes

### Verified starting state (2026-07-29, at `acc8df0`)

| Fact | Evidence |
|---|---|
| Complete dark palette exists | `src/app/globals.css:86` — `.dark { … }`, 104 token lines in the file |
| Dark variant is wired to a class | `src/app/globals.css:5` — `@custom-variant dark (&:is(.dark *))` |
| No provider anywhere | `grep -rn ThemeProvider src/` → no match |
| `next-themes` used once | `src/components/ui/sonner.tsx:3` — `useTheme()` for toast theming only |
| Two surfaces pin dark themselves | `PresenterOperator.tsx:449`, `SlideGridDialog.tsx:176` |
| Projected output uses literal colours | `ProjectorClient.tsx:125,145,162`; `ArtifactSlide.tsx` inline `style`; `SlideView.tsx` no theme tokens |

### Requirement ancestry

No PRD FR. Per the `AGENTS.md` authority map, operator-chrome visual identity is governed by `DESIGN.md`, and this story changes nothing about a Deck, a Slide Type or a payload contract — see the Epic 17 preamble, where that is recorded as a decision rather than left as a silence. Contrast with FR-20, which was added because Epic 16 changed how every slide is produced.

### Out of scope

- The `--muted-foreground` fix itself (Story 17.2 owns that token).
- Removing the hardcoded `dark` wrappers in the two presenter surfaces.
- Any change to registry-driven slide appearance, PPTX rendering or the projector.
- Theming the projector output, in any form, under any setting.

### References

- Defect source: `_bmad-output/planning-artifacts/implementation-readiness-report-2026-07-29.md` (open item 2 — corrected above). That report still carries the wrong claim in its own text; it is a dated assessment, not a living contract, so it was not rewritten.
- Visual authority: `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md` — reconciled 2026-07-30, `updated: '2026-07-30'`
- Behavioural counterpart: same folder, `EXPERIENCE.md` — same run. Its *Accessibility Floor* and *Open Items* are the two sections this story touches.
- Runtime rules: `_bmad-output/project-context.md`
- Epic: `_bmad-output/planning-artifacts/epics.md` — Epic 17

## Dev Agent Record

### Agent Model Used

Claude Opus 5 (`claude-opus-5`), via `bmad-dev-story`, 2026-07-30.

### Debug Log References

Verified against the running dev server (`bic-hub-dev`, next 16.2.10 Turbopack) on an
authenticated session, not by reading the source alone.

| Check | Method | Result |
| --- | --- | --- |
| AC-2 first visit follows the OS | `localStorage.theme` absent, `prefers-color-scheme: dark` | `<html class="… dark">`, `color-scheme: dark`, body `lab(2.75)` |
| AC-1 persistence | stored `light`, reload | resolved light **against** an OS that prefers dark |
| AC-1 new tab | fresh tab at `/` | stored choice carried; control read `Light theme. Switch to: dark theme` |
| AC-1 the control | clicked it | light → dark in one click, `localStorage` written, label advanced to `Switch to: follow system theme` |
| AC-1 keyboard/labelling | a11y tree | native `<BUTTON>`, `tabIndex 0`, `aria-label` carries state + next state |
| AC-2 no flash / no mismatch | console filtered on `hydrat\|Hydration\|did not match` | zero messages |
| AC-3 presenter | hub set light, opened `/services/2/present` | shell `div.dark …` resolves `--background` `lab(2.75)`, paints dark |
| AC-3 slide grid | opened **All slides** with hub light | portalled to `BODY` (outside the presenter shell), self-declares `dark`, popover `lab(7.78)` on white text |
| AC-4 slideshow | flipped the class on `<html>` in place, fingerprinted all 14 nodes | backgrounds and text byte-identical |
| AC-4 projector | same, 11 nodes | painted output identical |
| AC-6 | each `.dark` token painted to a 1×1 canvas, WCAG 2.1 luminance from the sRGB bytes | four pairs, recorded in `DESIGN.md` |

**Two latent theme leaks were found this way and neither is currently painted.**
`globals.css` applies `border-border` *and* `text-foreground` through base-layer rules that
reach every node, so on the slideshow all 14 nodes compute a theme-dependent `border-color`,
and on the projector 5 of 11 compute a theme-dependent `color`. Neither paints: every border
in the projected tree is `0px` on all four sides, and every text-bearing node inherits an
explicit inline colour from its Artifact wrapper (`ArtifactSlide.tsx:128` falls back to the
literal `#FFFFFF`, not to a token). The border half is now guarded, because the class that
would arm it is a *width* utility carrying no token name — invisible to a token scan. The text
half is left to `ArtifactSlide.tsx:128` and documented in the test rather than guarded twice.

#### Review remediation, 2026-07-31 — same server, same method

**The AC-4 row above is the one that failed review, and its wording is why.** *"Flipped the class
on `<html>`, fingerprinted all 14 nodes"* enumerated nodes **inside** the client tree; `html` and
`body` are not in it, and that is where the theme paints. A source-level fix would have repeated
the mistake, so each item below was re-checked in the browser.

| Check | Method | Result |
| --- | --- | --- |
| AC-4 the shell, fixed | `/services/2/slideshow`, both themes | `html` and `body` compute `rgb(0, 0, 0)`, `scrollbar-gutter: auto`, `overflow: hidden` — identical either way |
| AC-4 the shell, defect reproduced | dropped only the hook's five inline styles, in place | `body` → `lab(100 0 0)` light / `lab(2.75 0 0)` dark, gutter back to `stable`. The strip was real and it did follow the choice |
| Toggle vs siblings | dark mode, after a reload | toggle and *Announcements* pill compute **identical** `background-color`, `border-color`, `color` |
| Toggle, pre-fix delta | fresh probe nodes, so nothing is read from a stale style cache | old string `bg-input/30` α 0.045 + `lab(100 0 0 / .15)` border vs pill `--card` α 0.5 + `lab(100 0 0 / .1)` |
| Why the fix works | live class list on the rendered button | `tailwind-merge` **removed** the variant's `dark:border-input`, `dark:bg-input/30`, `dark:hover:bg-input/50` — deleted, not out-specified |
| Badge / affordance shades | each pair painted to a canvas, WCAG 2.1 luminance from the sRGB bytes | emerald 4.23 → 10.56, amber 4.76 → 10.57, indigo 2.54 → 9.72, logout 3.76 → 6.21, success 4.91 → 9.25 |
| `dark:text-red-400` = `--destructive` | painted both | both `#ff6467` |
| The 29 newly-live `dark:` overrides | tokens read from the resolved palette, layers composited on canvas | all pass; figures in `DESIGN.md` |
| Non-text (WCAG 1.4.11) | `--border`, `--input`, `--ring` over `card/50`, both themes | 1.29 / 1.54 / 4.18 dark, 1.26 / — / **2.58** light. Two failures, one of them the light focus ring |
| Console | filtered to errors, every page visited | only the pre-existing `ServicesList.tsx:98` Base UI warning; nothing from this change set |

**A measurement artifact worth recording, because it nearly became a false finding.** Reading
`getComputedStyle` immediately after flipping `.dark` at runtime returned the *light* values for
`bg-card/50`, `border-border` and `text-muted-foreground` while the CSS custom properties on the
same element already read dark — a stale computed-style cache behind `transition-all`. Reloading
in the target theme, or probing fresh nodes, returns correct values. Every figure above was taken
after a reload or from a fresh node; the first set of readings was discarded.

**Two claims of the review itself did not survive re-verification**, and are corrected in place
above: `text-amber-700` at 3.57:1 cannot occur (`dark:text-amber-500` shadows it in the only
theme where that background exists), and *19 overrides across 9 files* is 29 utilities at 18
sites in 8 files — the review's own line list said 18 and 8.

#### Round-2 remediation, 2026-07-31 — what was verified, and what could not be

**`npm ci` was broken in this repository, on every machine, and had been since 2026-07-29.** It
blocked verification for most of this round and is worth recording in full, because the cause was
not the environment and the first diagnosis written here was wrong.

`node_modules` could not be installed: `npm ci` failed with `EINTEGRITY` on
`set-function-name@2.0.2`. The *wanted* and *got* base64 sha512 digests differed **in one substring
only** — a four-character name inside the digest replaced by a five-character one. Two sha512
digests of different content differ across nearly all 88 characters, never in one word, so the
first conclusion drawn here was that something outside the repository was rewriting that name live
inside the npm process. **That was wrong, and the thing that disproved it was a cheap test:** with a
cache directory outside the default (`npm ci --cache <fresh dir>`), the tarball is downloaded and
hashed from scratch — and *got* came back identical. So *got* is the honest digest, and it is
**`wanted`, the value stored in `package-lock.json`, that was corrupt.** The registry settles it:

    npm view set-function-name@2.0.2 dist.integrity   ->  sha512-...4Wirafur5kcf...
    package-lock.json                                 ->  sha512-...4Galihfur5kcf...

The cause is collateral damage from this project's own 2026-07-29 PII remediation, which replaced
real names with invented ones **across the whole tracked tree**. One of those names occurs as an
ASCII substring inside that base64 hash, and the pass rewrote it there too. Nothing noticed for two
days because npm is the only thing in this repository that verifies a checksum.

**Blast radius, measured rather than assumed: 1 of 819.** Every `integrity` value in the lockfile
was checked, using the fact that a base64 sha512 payload is exactly 88 characters — the corrupted
one was 89. Exactly one anomaly. **That detector only catches length-CHANGING substitutions;** a
same-length replacement decodes to the right byte count and is invisible to it, and only a
per-package registry comparison would find one. Repaired to the registry's authentic value;
`tests/public-repo-guard.test.mjs` passes 4/4 with it, so the substring is not fingerprinted and
there is no collision with the PII rule. **Integrity checking was never disabled to get past this**
— the corrupt value was the anomaly, and restoring the authentic one is a repair rather than a
bypass. Install then succeeded: 699 packages. This finding is out of scope for Story 17.1 and is
filed for its own audit; the open question is what *else* that pass rewrote inside non-prose data.

| Check | Method | Result |
| --- | --- | --- |
| `tests/theme-chrome.test.mjs` | node built-ins plus `--experimental-strip-types`; ran before install too | **43/43 pass** |
| `tests/public-repo-guard.test.mjs` | the mandatory pre-commit gate; re-run after the lockfile repair | **4/4 pass** |
| Every new or widened guard | 18 defects injected one at a time, suite run, file restored | **18/18 behaved as claimed** |
| `npm run build` | required by `auth-http.test.mjs`, which self-reports it | **succeeded** |
| Full suite (`npm test`) | after build | **380 tests / 379 pass / 0 fail / 1 skipped** |
| `tsc --noEmit` | project TypeScript, not `npx tsc` | **clean, exit 0** |
| `npm run lint`, changed files only | `npx eslint` over all 15 | **4 problems, all pre-existing** — verified individually against `HEAD` |
| Browser verification of the four new `dark:` sites | — | **NOT RUN.** No new colour pair enters the product; per-surface confirmation is outstanding |

**One real defect of mine was found by `tsc` and nothing else.** `ShellDocument` first typed the
claimed style as `Record<string, string>`, which a real `CSSStyleDeclaration` does not satisfy — it
has no index signature — so `claimProjectedShell(document)` was a type error at the one call site
that matters, while every behaviour test against the stub passed. It is a mapped type over the
three named properties now. Worth recording as the counter-example to this round's own theme: the
behaviour tests were the right thing to add and they could not have caught this.

**The one suite failure was a missing prerequisite, not a regression.** `auth-http.test.mjs` throws
*"Run `npm run build` before auth-http tests"* by its own design. After a build it passes.

**Two of the eighteen negative tests caught the guard rather than the code**, and both were the
same defect this pass exists to remove — an assertion satisfiable by something other than what it
claims to check. A file-wide `/\btext-white\b/` stayed green with the full-screen root stripped
bare, because both surfaces carry `text-white/70` and `hover:text-white` on inner chrome; it reads
the root element's `className` now. And a document-wide `DESIGN.md` match stayed green with the
dark measurement deleted, because the light table carries the same four pair names; it is scoped to
the dark table now. Neither would have been found by reading the test.

**One review number did not survive re-verification.** The round-2 finding on the `DESIGN.md`
Components row says the preview list was verified against *"all seven call sites"* of `SlideView`
and `ArtifactSlide`. There are **nine**: eight `<SlideView` — `PresenterOperator` (3),
`ProjectorClient` (2), `SlideshowClient` (2), `SlideGridDialog` (1) — plus the single
`<ArtifactSlide` inside `SlideView`. The finding's conclusion is unaffected and correct; the count
is corrected where it is quoted.

**Two claims in the story's own record were also wrong and are corrected, not just the review's.**
The resolution note written during this pass first said the suite had *"nine groups"*; it has
eight. And `git status` at the start of this round was **clean** — the 25-file working tree the
round-2 review read as uncommitted had in fact been committed as `3f210c7`, and Story 17.7 was
already registered by `116ba3d`, so part (b) of the second decision item was half-closed before
this pass began. `sprint-status.yaml` said otherwise in three places.

### Completion Notes List

- Story created 2026-07-29 at the owner's request, through Epic → Story rather than an inline patch.
- **All seven AC are satisfied as scoped.** Six were verified in the running application on
  2026-07-30/31; AC-5 could not be (see below). **AC-4 carries an explicit two-axis scope
  recorded in the AC itself, added 2026-07-31 at the owner's direction:** its *token* guarantee
  is met and browser-verified — the projected tree paints in literals or registry-resolved
  inline styles, and the two full-screen Clients hold the app shell at literal black. Its
  *shell* guarantee is **Story 17.7's**, not this story's, and `AD-24` stays
  `[ADOPTED, partial]` until 17.7 lands — the spine now names 17.7 as the key that closes it.
  The word *previewed* is removed from AC-4, because the Live Slide Preview is hub chrome and
  themes deliberately. This sentence previously read *"All seven AC are satisfied"* beside a
  Review Findings section that said the shell guarantee did not hold; both statements cannot be
  true, and a story at `review` carrying them was itself a review finding.
- `tests/theme-chrome.test.mjs` is new — **43 tests from 30 declarations** (five are
  parameterised over the guarded file sets), in **eight groups** over **six** `PROJECTED`
  files: the projected tree carries no theme token, no theme-coloured edge and no
  theme-coloured focus ring, stays transitively closed with no exempt directory, and cannot be
  styled from outside (AC-4); both full-screen surfaces neutralise the themed `html`/`body`
  shell and set their own text colour, and the shell claim is exercised as **behaviour** against
  a document stub — set, restored, reference-counted (AC-4); the two presenter surfaces keep
  their own `dark` wrapper on **every** branch they render (AC-3); the provider is mounted as a
  client boundary under a Server-Component layout, persists, and does not animate the flip
  (AC-1/AC-2); the control is a labelled, dependency-free, mount-guarded button wearing the
  shared header box, outside the nav landmark (AC-1); the cycle is exercised as behaviour
  (AC-1); and the four dark pairs are recorded in `DESIGN.md` with their ratios (AC-6).
  **Every guard was negative-tested — 18 injected defects, each confirmed to make the suite
  react as claimed**, including two that caught the guard rather than the code: a file-wide
  `text-white` match passed with the root stripped bare, and a document-wide `DESIGN.md` match
  passed with the dark figure deleted, because the light table carries the same pair names.
- **AC-5 is structurally satisfied and cannot be observed.** `<Toaster />` is exported from
  `src/components/ui/sonner.tsx` and **mounted nowhere**; `toast()` is called nowhere in `src/`.
  So "when toast notifications appear" has no way to occur today. What the AC actually asks for
  is met: `sonner.tsx` was not touched, and its existing `useTheme()` now resolves against a
  real provider instead of nothing. Mounting the Toaster was not in the task list and would
  have added an unrequested UI surface, so it was left alone — flagged for the owner rather
  than decided here.
- `react-hooks/set-state-in-effect` (React 19, via `eslint-config-next` 16) rejects the usual
  `useEffect(() => setMounted(true), [])` hydration guard, so the control uses
  `useSyncExternalStore` with a server snapshot of `false`. Same single flip, no lint suppression.
- **Deliberately not done, per *Out of scope*:** `--muted-foreground` untouched (Story 17.2),
  both hardcoded `dark` wrappers left in place, `metadata` still reads *Create Next App*
  (Story 17.3), no change to registry-driven slide appearance or the projector.
- **Two pre-existing defects observed and left alone.** (a) `src/app/ServicesList.tsx:98`
  renders `<Button render={<Link/>}>`, which logs a Base UI error on every hub load — that file
  is not in this change set. (b) `npm run lint` reported 32 problems (15 errors, 17 warnings),
  all pre-existing, when it was last run on 2026-07-30. That sentence used to end *"none of the
  six changed files appears in the lint output"*, which was wrong twice: the change set touched
  **13** files by round 2, and one of them did appear — `LogoutButton.tsx:5`'s unused `Button`
  import, pre-existing, and now deleted. **Re-run after the round-2 remediation:** `npm run lint`
  reports **31** problems (15 errors, 16 warnings), one fewer than before, which is exactly that
  deleted import. Over the 15 files this round touched: **4 problems, every one pre-existing and
  verified individually against `HEAD`** — `AnnouncementsManager.tsx:5`'s unused `Button` import
  (present at `HEAD`, untouched by this round's three-hunk diff) and three
  `react-hooks/set-state-in-effect` errors at `AnnouncementsManager.tsx:36`,
  `ArtifactEditor.tsx:408` and `:416`, all outside this round's diffs (its only change to
  `ArtifactEditor` is one line, at 851). **Zero problems introduced.**
- AC-6's measurement produced a result worth carrying forward: **the dark palette passes every
  pair, including the one the light palette fails.** `muted-foreground` on `muted` is 5.86:1
  dark against 4.35:1 light, and the two themes hold independent token values — so Story 17.2's
  fix belongs in `:root` alone. `DESIGN.md` Open Item 1 was scoped accordingly.
  **Amended 2026-07-31: "every pair" was four pairs, all of them text on a surface.** Non-text
  contrast had never been measured and fails in both themes; see below.

#### Review remediation, 2026-07-31

- **11 of the 12 patch items are done. The twelfth is AD-24 and is deliberately not done here:**
  `AGENTS.md` routes a structural-invariant amendment through a `bmad-architecture` Update run,
  and satisfying the checkbox inline would have broken the gate the checkbox exists to enforce.
  It is the only open item on the story and nothing in the change set depends on it.
  **Closed 2026-07-31 by that run — and holding the line paid for itself.** The Update's Reviewer
  Gate ran four independent lenses, three of which converged on a gap in *this* change set that
  neither `bmad-code-review` nor this workflow's own browser verification had found: the extracted
  shell reset reaches the two full-screen Clients and cannot reach the two room-facing route
  shells, because those are Server Components. An inline one-line spine edit would have recorded
  the decision and skipped the review that found the defect.
- **AC-4's token guarantee is met — its shell guarantee is Story 17.7's, and the AC now says so.**
  This note read *"AC-4 is now met"* while the Review Findings above recorded the opposite; the
  owner settled it on 2026-07-31 by closing 17.1 against the token guarantee and spinning the
  shell out. What follows is the token half, which is what this story delivers. The reason it was
  thorough inside the wrong boundary: 14 nodes of the client tree, none of them `html` or `body`,
  which is where `bg-background` and the reserved scrollbar gutter actually paint. `ProjectorClient`
  had solved this for itself in a commented effect; the slideshow, the same `fixed inset-0` pattern
  at an equally room-facing URL, had no reset. Extracted to `src/lib/use-projected-shell.ts` and
  called by both, with the defect reproduced in the browser first so the fix is known to fix
  something.
- **The slideshow's route shell was leaking the same way and nobody had looked at it.** A
  `buildSlidePlan` throw rendered a `destructive`-bordered `Card` at a projected URL. Rewritten to
  the projector's literal-colour canvas, and **both route shells joined the guarded set** — the
  test previously scanned four client components and neither page.
- **Three chromatic text pairs were failing AA on the dark surface and none was a `dark:`
  override.** They were `-600` shades chosen against white, in files that became dark-switchable
  underneath them: the preview badges (emerald **4.23:1**, indigo **2.54:1** — below even the 3:1
  large-text floor) and `LogoutButton` (**3.76:1**). Fixed from `PRESENTER_TONE_CLASS`, which had
  already solved this problem for the one surface that was always dark. A story that added a
  contrast AC should not have shipped with those in it. **This note said *two* while three other
  places in the same change set said three** — the undercount was of the defect this story fixed.
  Round 2 then found the rule had stopped four sites short of itself, in three more files; those
  are fixed too, and `LogoutButton` now names `text-destructive` rather than reproducing it.
- **The 29 newly-live `dark:` overrides were reviewed and measured rather than deferred**, per the
  owner's call. All pass. The finding's framing was right even though its count was not: a `dark:`
  variant in a codebase with no provider is unexecuted code, and mounting a provider deploys all of
  it in one commit.
- **The test file's own credibility was the quietest finding and the most deserved.** Four of 17
  assertions could be satisfied by a word in a comment — one of them by the comment explaining the
  code it guarded — and the edge guard missed `ring-1`, the exact hazard its doc comment named.
  Every scan now strips comments, and **every new or widened guard was negative-tested**: 12 edge
  spellings, 4 token spellings, 3 import shapes, the `className` path, the shell reset, 4
  comment-satisfiable assertions, 2 placeholder regressions, 2 badge shades and the toggle
  override — each confirmed to fail when the defect is reintroduced. 17 tests → 28.
- **Non-text contrast fails WCAG 1.4.11 in both themes**, found while measuring the rest:
  `--border` (applied to every node by a universal selector) is **1.29:1** dark and **1.26:1**
  light against a 3:1 requirement, and the light theme's focus ring is **2.58:1** — a failure the
  review did not name. Filed as `DESIGN.md` Open Item 6 with no owner, because raising `--border`
  changes every card, input and dropdown on both themes: that is a decision, not a token nudge.
- **AC-5 stays structural, by the owner's decision**, and now has a tracked home instead of a
  `last_updated` comment: `EXPERIENCE.md` Open Item 4, owned by **Story 17.6**, registered in
  `epics.md` and `sprint-status.yaml` as `backlog`. No code was written for it. Its first job is a
  product decision — whether this product wants a transient channel at all — and if the answer is
  no, the story deletes two documentation rows and a dependency.
- **One more pre-existing defect observed and left alone**, in the spirit of the two already
  recorded above: `src/components/LogoutButton.tsx` imports `Button` and never uses it (the row is
  a hand-rolled `<button>`), which is one of the repo's 32 standing lint warnings. Not removed —
  it is unrelated to this story's behaviour — but `DESIGN.md`'s row, which called it a `button`
  ghost variant, was corrected because this change set edits that component's colours.

### File List

**Added**

- `src/components/ThemeProvider.tsx`
- `src/components/ThemeToggle.tsx`
- `src/lib/use-projected-shell.ts` *(2026-07-31 — the shared full-screen shell reset)*
- `tests/theme-chrome.test.mjs`

**Modified**

- `src/app/layout.tsx`
- `src/components/Header.tsx`
- `package.json` (new test file registered in the `test` script)
- `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md`
- `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/stories/17-1-reachable-dark-mode.md`

**Modified 2026-07-31, review remediation**

- `src/app/services/[id]/present/projector/ProjectorClient.tsx` (effect extracted to the shared hook)
- `src/app/services/[id]/slideshow/SlideshowClient.tsx` (calls the shared hook — AC-4)
- `src/app/services/[id]/slideshow/page.tsx` (failure branch to literal colours; `Card`/`Button` imports dropped)
- `src/components/SlideView.tsx` (dead `className` pass-through removed)
- `src/components/SlidePreviewList.tsx` (`dark:` halves for the three chromatic badge tones)
- `src/components/LogoutButton.tsx` (`dark:text-red-400`)
- `src/components/ThemeToggle.tsx` (dark box override; focusable, state-free placeholder)
- `src/components/Header.tsx` (`dark:text-emerald-400` on the password-success line)
- `tests/theme-chrome.test.mjs` (widened guards, comment stripping, new guards — 17 → 28 tests)
- `_bmad-output/planning-artifacts/epics.md` (Story 17.6 registered under Epic 17)
- `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md`
  *(the `AD-24` amendment — listed because `AGENTS.md` requires the spine to move in the same
  change set, and the round-1 File List omitted it while the Change Log already described it)*

**Added 2026-07-31, round-2 remediation**

- `src/components/header-chrome.ts` — the header row's shared control box, read by both `Header`
  and `ThemeToggle`. A third file rather than an export from `Header`, because `Header` already
  imports `ThemeToggle` and importing back would close a cycle
- `src/lib/projected-shell.ts` — the reference-counted DOM claim, with no React in it so the set
  *and* restore paths are reachable from `node:test` against a document stub
- `src/lib/theme-cycle.ts` — order, wrap-around and labels, extracted so the modulo is a function
  a test can call rather than a regex target inside a component

**Modified 2026-07-31, round-2 remediation**

- `src/app/announcements/AnnouncementsManager.tsx` (two badge tones gain the ported `dark:`
  halves; *Remove* takes `text-destructive`)
- `src/components/admin/ArtifactEditor.tsx` (`dark:text-emerald-400` on the success line)
- `src/components/LogoutButton.tsx` (`text-destructive` replaces the hand-rolled `red-600`/
  `red-400` pair; unused `Button` import deleted)
- `src/components/artifacts/ArtifactSlide.tsx` (`className` parameter deleted — the AC-4
  invariant becomes a compile error)
- `src/app/services/[id]/slideshow/SlideshowClient.tsx` (`focus-visible:outline-white` on the
  projected focusable)
- `src/app/services/[id]/slideshow/page.tsx` (scrollable failure branch; headline unified with the
  projector's; registry sentence restored; literal outline colour on both recovery links)
- `src/app/services/[id]/present/projector/ProjectorClient.tsx` (`text-white` on the root)
- `src/components/ThemeProvider.tsx` (`disableTransitionOnChange`)
- `src/components/ThemeToggle.tsx` (shared box; `aria-disabled:pointer-events-none`; cycle and
  labels imported from `@/lib/theme-cycle`)
- `src/components/Header.tsx` (`<nav>` ends at the links; row is `flex-wrap`; link classes come
  from `header-chrome`)
- `src/lib/use-projected-shell.ts` (reduced to the React binding over `projected-shell.ts`)
- `tests/theme-chrome.test.mjs` (scanner-based comment stripping, brace-balanced extraction,
  widened token and edge guards, transitive closure with no exempt directory, per-branch AC-3,
  behaviour tests for the shell claim and the cycle — 28 → **43 tests**)
- `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md`
  (Open Items 4 and 6 repaired; Components row for the preview list and `ThemeToggle` rewritten;
  the four newly-fixed sites recorded)
- `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md`
  (`ThemeToggle` row scoped to the token guarantee; slideshow failure state updated)
- `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md`
  (Story 17.7 named as the key that closes `AD-24`'s partial tag; the gap widened from one hole to
  four — a citation repair, not an amendment: no clause changed, no `AD-n` added)

- `package-lock.json` — **one `integrity` value repaired to the registry's authentic checksum.**
  Not this story's work and not caused by it: `npm ci` had been broken repo-wide since the
  2026-07-29 PII remediation rewrote a name substring inside a base64 sha512. Included because the
  repair is in this change set and because nothing could be verified without it; it wants its own
  audit entry, not attribution to Story 17.1

**Not modified, deliberately:** `package.json`. The behaviour tests live in the existing
`tests/theme-chrome.test.mjs` rather than a new file, so the `test` script needs no new entry.

### Change Log

- 2026-07-29: Story 17.1 created; Epic 17 added to `epics.md`; sprint keys added.
- 2026-07-30: Implemented. next-themes provider mounted as a client boundary under the
  Server-Component root layout; `ThemeToggle` added to the shared `Header`, cycling
  system → light → dark; `tests/theme-chrome.test.mjs` added (17 assertions) pinning that no
  theme token and no theme-coloured edge reaches the projected render tree. Dark palette
  measured on four pairs via canvas-resolved sRGB and recorded in `DESIGN.md`, which also
  closes its Open Item 2 and scopes Open Item 1 to the light theme; `EXPERIENCE.md`
  *Accessibility Floor* and *Component Patterns* updated in the same change set. Full suite
  354 tests / 353 pass / 0 fail / 1 skipped; public-repo guard 4/4.
- 2026-07-31: `bmad-code-review` returned the story to `in-progress` — AC-4 not met. **Addressed
  11 of the 12 patch findings** (AD-24 excepted; it needs a `bmad-architecture` Update run).
  AC-4 fixed at the layer that was actually leaking: the projector's `html`/`body` reset extracted
  to `src/lib/use-projected-shell.ts` and called by the slideshow too, and the slideshow's route
  shell repainted in literal colours. Three sub-AA chromatic text pairs fixed and re-measured;
  the 29 newly-live `dark:` overrides reviewed and measured; non-text contrast measured for the
  first time and filed as `DESIGN.md` Open Item 6. `tests/theme-chrome.test.mjs` rebuilt — comment
  stripping, widened edge and token guards, closure over relative/aliased/dynamic imports, a
  `className` guard, and every guard negative-tested (17 → 28 tests). AC-5 filed as
  `EXPERIENCE.md` Open Item 4 with owning **Story 17.6**, registered in `epics.md` and
  `sprint-status.yaml`. Full suite **365 tests / 364 pass / 0 fail / 1 skipped**; `tsc --noEmit`
  clean; lint clean on all changed files bar one pre-existing unused import; public-repo guard 4/4.
- 2026-07-31, later: **`bmad-architecture` Update run closed the twelfth item.** `AD-24` added to
  `ARCHITECTURE-SPINE.md` as the next id, nothing renumbered, tagged `[ADOPTED, partial]`;
  `next-themes` and `shadcn` added to the Stack table, a `Client state` row added to *Consistency
  Conventions*, the localStorage channel drawn into the first diagram, and five *Deferred* entries
  filed. Its Reviewer Gate (`lint_spine` 0 findings + four parallel lenses) returned one new high
  finding against story 17.1's change set — the Server-Component route shells keep the themed app
  shell — now filed in *Review Findings* above with no owner. Reports:
  `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/reviews/*-2026-07-31-ad24.md`.
- 2026-07-31, round 2: **`bmad-code-review` round 2 returned the story to `in-progress` with 25
  open items; all 25 are now addressed.** AC-4 is **rescoped in the AC itself, on two axes** at the
  owner's direction — the token guarantee is this story's, the shell guarantee is Story 17.7's, and
  the word *previewed* is removed because the Live Slide Preview is hub chrome. *(Amending an AC is
  outside this workflow's normal edit surface; it is done here because the owner directed it and
  because the contradiction between the AC section and the findings section was itself a finding.)*
  Four AC-6 sites the round-1 sweep missed are fixed (`AnnouncementsManager` ×2,
  `ArtifactEditor`), `LogoutButton`'s hand-rolled `red-600`/`red-400` pair collapses to
  `text-destructive` — the two are byte-identical in both themes — and its unused `Button` import
  is gone. `ArtifactSlide`'s dead `className` parameter is deleted, making the AC-4 invariant a
  compile error. Projected focusables state `focus-visible:outline-white`, closing a ring that
  painted from `--ring`. The slideshow's failure branch scrolls, matches the projector's headline
  and regains the sentence it dropped. `ThemeToggle` takes a shared `HEADER_CONTROL_BOX` (new
  `components/header-chrome.ts`) instead of a copy, gains `cursor-pointer` and
  `aria-disabled:pointer-events-none`, and moves out of the `<nav>` landmark onto a `flex-wrap`
  row. The provider gains `disableTransitionOnChange`. The shell claim is **reference-counted**
  and extracted to `src/lib/projected-shell.ts`; the theme cycle to `src/lib/theme-cycle.ts` — both
  so the restore path and the modulo are exercised as **behaviour** rather than matched as text.
  The guard file is rebuilt: scanner-based comment stripping, brace-balanced extraction, Tailwind 4
  `bg-(--card)` shorthand, arbitrary and inline edge widths, per-branch AC-3, transitive closure
  with **no exempt directory**, hoisted regexes — **28 → 43 tests, and 18 injected defects each
  confirmed to make the suite react.** `DESIGN.md`: Open Item 6 no longer denies its own finding,
  Open Item 4 is recounted with comments stripped and its grep quoted, the preview-list Components
  row stops describing slides it does not render. `ARCHITECTURE-SPINE.md` names **Story 17.7** as
  the key that closes `AD-24`'s `[ADOPTED, partial]` tag, and widens the recorded gap from one hole
  to four.
  **Verification complete → `review`.** `npm run build` succeeds; full suite **380 tests / 379 pass
  / 0 fail / 1 skipped**; `tsc --noEmit` clean; `tests/theme-chrome.test.mjs` **43/43**;
  `tests/public-repo-guard.test.mjs` **4/4**; `npm run lint` **31** problems against 32 before —
  the difference being the unused import this round deleted — with **4** in the 15 touched files,
  all pre-existing and verified individually against `HEAD`. Only a browser pass over the four new
  `dark:` sites is outstanding, and no new colour pair enters the product.
  **`tsc` caught one real defect of mine that 43 green tests did not:** `ShellDocument` typed the
  claimed style as `Record<string, string>`, which a real `CSSStyleDeclaration` cannot satisfy, so
  `claimProjectedShell(document)` failed to compile while every stub-based behaviour test passed.
  Fixed to a mapped type over the three named properties.
- 2026-07-31, **`package-lock.json` repaired — a defect outside this story, found while trying to
  verify it.** `npm ci` had been broken in this repository since 2026-07-29, on every machine: the
  `integrity` value for `set-function-name@2.0.2` did not match the registry, differing in a single
  four-character substring. It is collateral damage from this project's own PII remediation, which
  replaced real names with invented ones across the whole tracked tree and rewrote one of them
  inside a base64 sha512. All 819 integrity values were checked by base64 length (sha512 must be 88
  characters; the corrupt one was 89) — **exactly one** was affected, and that detector cannot see a
  length-preserving rewrite. Restored to the registry's authentic value, which the public-repo guard
  accepts; integrity checking was never disabled. Listed in the File List because the repair is in
  this change set, but it belongs to its own audit rather than to Story 17.1 — the open question is
  what else that pass rewrote in non-prose data.
