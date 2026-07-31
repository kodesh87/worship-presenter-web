---
name: Worship Presenter Web
description: Operator hub for preparing and projecting a worship service. shadcn/ui (base-nova) on Next.js + Tailwind 4; this DESIGN.md ratifies the as-built visual identity, which is a near-zero brand-layer delta over shadcn defaults.
status: final
updated: '2026-07-31'
colors:
  # Ratified from src/app/globals.css. The palette is ACHROMATIC BY REALITY:
  # every token below is oklch(L 0 0) -- lightness only, chroma exactly zero.
  # There is no brand hue. Unlisted tokens inherit from shadcn (base-nova).
  background: 'oklch(1 0 0)'
  foreground: 'oklch(0.145 0 0)'
  primary: 'oklch(0.205 0 0)'
  primary-foreground: 'oklch(0.985 0 0)'
  muted: 'oklch(0.97 0 0)'
  muted-foreground: 'oklch(0.556 0 0)'
  border: 'oklch(0.922 0 0)'
  ring: 'oklch(0.708 0 0)'
  # The only chromatic token in the light theme:
  destructive: 'oklch(0.577 0.245 27.325)'
  # Dark-theme values are REACHABLE, and CHOOSABLE with Story 17.1's change set:
  # the theme control in `Header` writes the operator's choice and next-themes
  # puts the `dark` class on <html>. The two presenter surfaces still pin that
  # class on their own wrapper and do not participate in the choice.
  # Stated with the change set that carries it, not after the fact — this note
  # and Open Item 2 stand or revert together with 17.1.
  background-dark: 'oklch(0.145 0 0)'
  foreground-dark: 'oklch(0.985 0 0)'
  primary-dark: 'oklch(0.922 0 0)'
  destructive-dark: 'oklch(0.704 0.191 22.216)'
typography:
  # Geist Sans / Geist Mono via next/font/google, verified in src/app/layout.tsx.
  # --font-heading aliases --font-geist-sans: there is NO separate display face.
  body:
    fontFamily: 'Geist Sans'
  heading:
    fontFamily: 'Geist Sans'
  mono:
    fontFamily: 'Geist Mono'
rounded:
  # Derived from a single --radius: 0.625rem (10px) via calc() in @theme inline.
  sm: 6px
  md: 8px
  lg: 10px
  xl: 14px
  2xl: 18px
spacing:
  # Tailwind 4 defaults inherited; no overrides in globals.css.
components:
  # Only five shadcn primitives are installed. None are brand-overridden.
  button:
    radius: '{rounded.md}'
    note: 'shadcn default, unmodified'
  card:
    background: '{colors.background}'
    border: '{colors.border}'
    radius: '{rounded.lg}'
  slide-surface:
    aspectRatio: '16:9'
    note: 'Projection surface. Geometry is governed by the Artifact Registry, not by this file.'
---

## Brand & Style

Worship Presenter Web is an operator tool used twice a week: once on Friday to prepare a service, once on Sabbath to project it. Both sessions are performed under pressure — Friday against a deadline, Sabbath in front of a congregation with no room to fumble. The visual identity follows from that: **nothing decorative, nothing that competes with the content being projected.**

The honest description of the as-built identity is *shadcn/ui (base-nova) defaults, unmodified*. This is not a placeholder awaiting a brand — it is the decision. Prior UX capture recorded it as AD-UX-1 ("clean, high-contrast, uncluttered … minimal custom brand colors"), and the shipped code took that to its logical end: **zero brand hue**.

> **Honesty note.** No visual design exploration was ever run for this product. This file documents what shipped and why it is defensible — not a design brief. Where reality falls short, it is recorded under *Open Items* rather than described as if it worked.

Two things are deliberately out of this file's scope:

- **Projected slide appearance** is governed by the Artifact Registry (`spec-slide-artifact-model`, `spec-artifact-registry-authoring`), which is runtime-editable by an administrator. This DESIGN.md governs the *operator chrome* only. A congregation never sees the tokens in this file.
- **Per-surface field and layout detail** lives in SPEC companions (`form-fields.md`, `edit-page-chrome.md`, `slide-kinds.md`), referenced rather than duplicated.

### Who owns the deck the congregation sees

The ~68-slide deck is this product's primary visual output, the subject of FR-5 readability and NFR-3 — and it has no design document. That is a deliberate three-part split:

| Concern | Owner |
| --- | --- |
| Operator chrome — every token in this file | This file |
| Slide geometry, fonts, colours, per-element layout | Artifact Registry rows (runtime data), validated by `AD-15` |
| Which slides exist and in what order | `buildSlidePlan` (AD-7) + the `slide-kinds.md` companion |

Both citations were re-checked against the architecture spine on 2026-07-30 and still say what this table claims. One forward note, so this row is not the next stale citation: under AD-20 and AD-16 — `[TARGET]`, landing with Epic 20 — *which slides exist* becomes ordered registry data that the planner merely applies, and the sequence is read from a per-service snapshot. `buildSlidePlan` stays the single order source (AD-7); what changes is where its sequence comes from. Neither move touches this file's own scope, and [`EXPERIENCE.md`](./EXPERIENCE.md) → *Information Architecture* carries the surface-level consequence.

**What nobody owns: *is this readable from the pews?*** No artifact answers it, and no test in this repository can — every slide assertion is regex over XML text presence, never geometry. The only control is the pre-launch projector inspection carried as an owner action item in `sprint-status.yaml`, which replaced the PRD §6 fidelity sign-off waived on 2026-07-29.

This file invents no minimum type sizes or contrast floors for projected slides: the registry's geometry came from a deck projected in this sanctuary for years, and invented numbers would displace that evidence. A readability standard is a product decision.

## Colors

The operator surface is greyscale. Every token in `src/app/globals.css` is `oklch(L 0 0)` — lightness varied, chroma exactly zero — with one exception:

- **`destructive`** (`oklch(0.577 0.245 27.325)`, red) is the only chromatic token in the light theme. It carries delete and stale-write-conflict affordances. Because it is the *only* color on the surface, it needs no reinforcement to read as dangerous.
- **`primary`** is near-black (`oklch(0.205 0 0)`) on near-white. High contrast is functional, not stylistic: the hub is read on a laptop in a poorly lit sanctuary.
- `chart-1` … `chart-5` exist as shadcn leftovers and are unused — there are no charts in this product.
- **A second hue ships without a token: Tailwind's `amber`.** Found 2026-07-30 while reconciling against the architecture spine, and stated here because the greyscale claim above is about `globals.css` tokens and would otherwise read as a claim about the rendered product. It carries the date-collision warning (`CreateForm.tsx`), *hymn lookup unavailable* (`HymnNumberAutocomplete.tsx`), the scripture badge (`SlidePreviewList.tsx` and `presenter-model.ts`), the run-sheet warning card (`services/[id]/page.tsx`), the flyer notice (`AnnouncementsManager.tsx`), and the projector-blanked border, scripture-lookup error and live-transition-override notice (`PresenterOperator.tsx`). So *warning* is already a semantic color in this product, just not a designed one. Open Item 4 carries the counted inventory and why the count kept being wrong.
- **And amber is not the only one.** Counted against `src/` on 2026-07-31 (`.tsx` **and** `.ts` — the presenter's tone table is a `.ts` module, which is how earlier counts came up short): **five untokenized hues across 11 files** — `amber` (8 files), `red` (4), `emerald` (5), `indigo` (2), `sky` (1). `red` is the sharpest of the four newcomers, because `destructive` is a real token that already means what it means: `LogoutButton` paints its own `red-600`/`red-500` rather than using it, and `red-400` — which the dark half now uses — *is* `.dark`'s `--destructive`, byte for byte. The greyscale claim in this section is about tokens, and every one of these hues is what the operator actually sees.
- A stray `--sidebar-primary: oklch(0.488 0.243 264.376)` (violet) sits in the dark block. It is dead because **nothing consumes it** — there is no sidebar; navigation lives in `Header.tsx`. The cause is disuse, not the absence of a dark theme — that block always rendered in the presenter, and since Story 17.1 an operator can choose it hub-wide, so *no theme* was never the reason. If a sidebar were ever added, this token would paint it violet on a surface that has no other hue.

### Contrast on load-bearing combinations

**Measured 2026-07-29** against the running application: each token was painted to a 1×1 canvas so the browser resolved `oklch()` to sRGB bytes, then WCAG 2.1 relative luminance was computed from those bytes. Earlier estimates derived from Oklab lightness (`Y ≈ L³`) are shown alongside; they held to within 0.05.

| Combination | sRGB | Measured | Prior estimate | WCAG |
| --- | --- | --- | --- | --- |
| `foreground` on `background` | `#0a0a0a` on `#ffffff` | **19.80:1** | ~19:1 | AAA |
| `primary-foreground` on `primary` | `#fafafa` on `#171717` | **17.18:1** | ~17:1 | AAA |
| `muted-foreground` on `background` | `#737373` on `#ffffff` | **4.74:1** | ~4.7:1 | AA normal text — passes by 0.24 |
| `muted-foreground` on `muted` | `#737373` on `#f5f5f5` | **4.35:1** | ~4.4:1 | ❌ **FAILS AA** (needs 4.5:1) |

`muted-foreground` is shadcn's default and carries secondary text throughout, which is why the two `muted-foreground` rows matter more than their margins suggest. Darkening that single token fixes both surfaces at once — `#6b6b6b` reaches 5.1:1 on `background` and 4.7:1 on `muted`.

#### The same four pairs in the dark palette

**Measured 2026-07-30**, by the same method — each `.dark` token painted to a 1×1 canvas so the browser resolved `oklch()` to sRGB bytes, then WCAG 2.1 relative luminance computed from those bytes. Before this run the dark palette had **never been measured on any pair**, while rendering every service in the presenter and slide-grid surfaces. Story 17.1 (AC-6) is what closed that.

| Combination | sRGB | Measured | WCAG |
| --- | --- | --- | --- |
| `foreground` on `background` | `#fafafa` on `#0a0a0a` | **18.97:1** | AAA |
| `primary-foreground` on `primary` | `#171717` on `#e5e5e5` | **14.23:1** | AAA |
| `muted-foreground` on `background` | `#a1a1a1` on `#0a0a0a` | **7.66:1** | AAA |
| `muted-foreground` on `muted` | `#a1a1a1` on `#262626` | **5.86:1** | AA (not AAA) |

**The dark palette passes all four of these pairs, including the one the light palette fails.** That is the finding, and it narrows Open Item 1: `muted-foreground` on `muted` is 5.86:1 here against 4.35:1 in the light theme, so the AA failure is **light-only**. The two themes hold independent `--muted-foreground` values (`oklch(0.708 0 0)` dark, `oklch(0.556 0 0)` light), so Story 17.2 changes `:root` alone — applying the same darkening to the `.dark` block would push a passing pair toward the floor rather than away from it.

**Four pairs is four pairs.** Until 2026-07-31 the sentence above read *"passes every pair"*, which is a claim about the palette and was never measured. What these four cover is **text on a surface**. Two things they do not:

- **Non-text contrast (WCAG 1.4.11) has never passed, in either theme.** `globals.css` applies `border-border` to every node through `@layer base { * { … } }`, so this is the most widely applied colour pair in the product. Measured 2026-07-31: `--border` over `card/50` on `background` is **1.29:1** dark and **1.26:1** light where 3:1 is required; `--input` is 1.54:1 dark. The *focus* indicator holds in dark (`--ring` 4.18:1) and **fails in light (2.58:1)**, so on the light theme neither the resting edge nor the focus ring reaches the floor. Open Item 6. It matters more since 17.1 than before it, because `ThemeToggle` is the first **icon-only** control in the header: a nav pill has a word in it, an icon in a 1.29:1 box does not.
- **The un-tokenized hues** layered on top of the palette (*Colors*, Open Item 4). Two of them sit in the presenter, so the surface's own tokens are now measured while the hue painted over them is not.

#### The `dark:` overrides that went live with the theme control

**Reviewed and measured 2026-07-31, in scope for Story 17.1 by the owner's decision** rather than deferred. Before 17.1 no `.dark` ancestor existed outside `PresenterOperator` and `SlideGridDialog`, and neither of those files contains a single `dark:` utility — so **every `dark:` rule in `src/` was dead CSS**, written against a variant nothing could trigger. Mounting the provider armed all of them at once. Counted precisely, because the review that raised this said *19 across 9 files* while its own enumeration listed 18 sites in 8: **29 `dark:` utilities at 18 sites in 8 files.**

None of them is a palette token pair, which is why AC-6's four-pair measurement said nothing about them:

| What went live | Sites | Verdict |
| --- | --- | --- |
| Ambient page backdrop — `dark:opacity-100` takes a decorative grid from 40% to full, `dark:bg-primary/10` swaps a near-black glow for a near-white one | 6 surfaces (`/`, `/admin`, `/announcements`, `/login`, `/services/new`, `/services/[id]`) × 3 = **18 utilities** | **Passes.** Decorative, `pointer-events-none`, no affordance and no text of its own. What it could have done is lift the surface under text: the dark glow resolves to `#1f1f1f`, where `foreground` measures 15.79:1 and `muted-foreground` 6.38:1; the grid line lifts `#0a0a0a` to `#0e0e0e` (7.47:1). It is the **light** half of this pair that is a problem — see Open Item 1 |
| Two amber text affordances **outside** the presenter: the run-sheet warning card (`services/[id]/page.tsx:211`) and *hymn lookup unavailable* (`HymnNumberAutocomplete.tsx:453`) | 2 | **Passes, better than its light half.** `dark:text-amber-500` on `--card` is **8.40:1**; `dark:text-amber-400` on `--background` is **11.49:1**. The review recorded `text-amber-700` at 3.57:1 here — that pair cannot occur: `:211` carries `dark:text-amber-500`, so the `-700` shade only ever paints on the light card, where it measures 5.03:1 |
| `button` variants — `outline` box, `ghost` hover, `destructive` fill, `aria-invalid` ring | 9 | **Passes on contrast, failed on consistency.** `text-destructive` on `dark:bg-destructive/20` is 4.64:1 on `card` and 5.31:1 on `background`; `foreground` over the `outline` and `ghost` dark surfaces is 17.50:1 and 17.01:1. The consistency defect was real and is fixed: `outline`'s `dark:bg-input/30 dark:border-input` out-specified `ThemeToggle`'s own unprefixed override, so the toggle rendered its box at `#151515` while the sibling nav pills — hand-styled in `Header`, with no `dark:` variants — stayed at `#111111`. The call site now states its dark half explicitly |

Two chromatic **text** pairs did fail, and they were not `dark:` overrides at all — they were shades with no dark half, in files that became dark-switchable underneath them. Both fixed in the same change set: the slide-preview badges (`text-emerald-600` **4.23:1**, `text-indigo-600` **2.54:1** — below even the 3:1 large-text floor) and `LogoutButton`'s `text-red-600` (**3.76:1**). The replacements are ported from `PRESENTER_TONE_CLASS`, which has always had to survive a dark surface, and re-measured: **10.56:1**, **10.57:1**, **9.72:1**, and **6.21:1** for logout. `Header`'s password-success line went the same way at 4.91:1 — passing, thinly — and now measures 9.25:1.

**The lesson worth keeping:** a `dark:` variant in a codebase with no theme provider is not a preference recorded for later. It is unexecuted code, and mounting a provider deploys all of it in one commit.

**Avoid:** introducing a brand hue surface-wide without a product decision; using color to encode state (the palette has none to spare); tinting the operator chrome to match projected slides — the chrome must stay visually separate from the content so the operator never mistakes one for the other.

## Typography

**Geist Sans** for everything, **Geist Mono** where a fixed width earns it. Both load through `next/font/google` in `src/app/layout.tsx`.

`--font-heading` is an alias of `--font-geist-sans`, so headings differ from body by **size and weight only**. There is no display or serif face. This is a real constraint on the identity, not an omission to correct casually: adding a second family would be the first genuinely new visual decision this product has made.

## Layout & Spacing

Tailwind 4's default scale, inherited whole — `globals.css` overrides no spacing token.

Structural choices that are load-bearing:

- `<html>` carries `h-full antialiased`; `<body>` is `min-h-full flex flex-col`. Surfaces are expected to fill the viewport, which matters for the full-screen projection routes.
- `scrollbar-gutter: stable` on `html` — prevents layout shift when a list grows past the fold. Small, but it is the difference between a run sheet that jitters while an operator scans it and one that does not.
- Navigation is a top `Header`, never a sidebar.

## Elevation & Depth

shadcn defaults; elevation is not used as a hierarchy device. `card` sits on `background` separated by `border`, not by shadow. Dialogs and popovers carry shadcn's own elevation.

## Shapes

A single `--radius: 0.625rem` (10px) generates the whole ramp through `calc()`: 6 / 8 / 10 / 14 / 18 px. Inputs and small controls take `sm`–`md`; cards take `lg`; dialogs take `xl`. Nothing is pill-shaped and nothing is square.

## Components

Five shadcn primitives are installed, **all unmodified**: `button`, `card`, `dialog`, `popover`, `sonner`. The contract is *don't customize them* — the brand has no delta to express, so a customization would be taste without a mandate.

Every component below has a behavioral counterpart in `EXPERIENCE.md` → *Component Patterns*; the two tables cover the same component set.

| Component | Visual role |
| --- | --- |
| `Header` | Shared chrome — nav (Dashboard / Announcements / Settings) + theme control + profile dropdown. Full-width, `border` beneath, no shadow. |
| `ThemeToggle` | The only control that changes this file's palette at runtime. One `button` (`outline` variant, icon size) cycling **system → light → dark**, sitting between the nav links and the profile dropdown. Icon-only, from `lucide` — `MonitorIcon` / `SunIcon` / `MoonIcon` — with the state and the next state in `aria-label`. Its `className` overrides the primitive's radius and box to `{rounded.xl}` at 38px so it matches the sibling controls Header styles by hand; that is a call-site override, not a customization of `button` itself, and it is the only reason this row is not "shadcn default, unmodified" like the rest. **The override has to state its dark half explicitly** (`dark:border-border dark:bg-card/50`): `outline` ships `dark:bg-input/30 dark:border-input`, `tailwind-merge` does not treat a `dark:`-prefixed class as conflicting with an unprefixed one, and `:is(.dark *)` out-specifies the plain override — so without it the toggle sat at `#151515` while the nav pills stayed at `#111111`, matching in light and drifting in the mode the control exists to reach. Before hydration it renders **focusable and inert** (`aria-disabled`, via Base UI's `focusableWhenDisabled`) showing `SunMoonIcon`, which is **none of the three states**: next-themes seeds the choice from `localStorage` inside `useState`, so on the hydration render the state is already known while the mount flag is still the server's `false` — a `MonitorIcon` placeholder is the `system` icon and made every operator who had chosen light or dark watch their control claim `system` and correct itself. A native `disabled` would also have left the tab order and stepped the box from `opacity-50` to full as it landed. |
| Service card list | `card` at `{rounded.lg}` on `background`, separated by `border`. One card per service, date most prominent. Greyscale only — a card carries no status color. |
| `SlideView` / `SlidePreviewList` | Renders a slide plan on the web; consumes the hydrated AST. Slide chrome is `slide-surface`; the preview list is a scrollable strip of scaled `slide-surface` instances. The list's badge tones carry **two halves**: token-painted tones (`song-title`, `default`) follow the theme on their own, and the three chromatic tones state a `dark:` shade because their `-600` values were chosen against white and the list is hub chrome — see *The `dark:` overrides that went live with the theme control*. `SlideView` deliberately accepts **no `className`**: it is the entry point to the projected wrapper, and styling that from outside is how an operator's theme would reach the congregation. |
| `artifacts/ArtifactSlide` | Renders one Artifact template — geometry, fonts, and colors come from the Registry, **not** from this file. Nothing in DESIGN.md governs its interior. |
| `admin/ArtifactEditor` | Fabric.js canvas editor at fixed 16:9. Editor chrome uses this file's tokens; the canvas interior does not. |
| `admin/TransitionSettings` | A `card` on `/admin` holding a native `select` plus a `button`. No custom control and no iconography; the hint and the save confirmation are `muted-foreground` body text. |
| Presenter transition control | A native `select` in the presenter's dark control bar, carrying an inline **Live only · not saved** badge — `border` outline on `muted`, no fill. When the live style differs from the saved one the surface adds a warning line in un-tokenized amber (*Open Item 4*), on the reasoning that greyscale alone cannot distinguish "this is temporary" from ordinary secondary text. |
| `HymnNumberAutocomplete` | `popover` at `{rounded.md}` anchored to a number input; results are plain rows, no iconography. |
| `ImageUploadField` / `ImageFieldPreview` | Upload control plus a `{rounded.md}` thumbnail. A rejected reference shows `destructive` text, not a `destructive` fill. |
| `sonner` toasts | shadcn default, unmodified. Bottom-corner, greyscale, `destructive` only for failures. **⚠ Nothing renders it today** — `Toaster` is mounted in no layout and `toast(` is called nowhere in `src/`. It reads the theme correctly (`useTheme()`, resolving against the provider Story 17.1 mounted), so this row describes what would appear rather than what does. [`EXPERIENCE.md`](./EXPERIENCE.md) → *Open Item 4*, owner Story 17.6. |
| `LogoutButton` | The destructive-tinted row at the foot of the profile dropdown. Not the `button` primitive — a hand-rolled `<button>` painting its own `red-600`, which is the sharpest instance of Open Item 4: `destructive` is a real token that already means this. Its dark half is `red-400`, which happens to be `.dark`'s `--destructive` exactly, so the dark side is accidentally on-token while the light side is not. |
| `dialog` / `popover` | shadcn defaults at `{rounded.xl}` / `{rounded.md}`. Used for confirmations and lookups; never for primary workflow. |

## Do's and Don'ts

| Do | Don't |
| --- | --- |
| Inherit shadcn base-nova defaults | Override a shadcn token without a recorded product decision |
| Keep the operator chrome greyscale | Introduce a brand hue "to warm it up" |
| Reserve `destructive` for destructive and conflict states | Reuse `destructive` for emphasis |
| Let the Artifact Registry govern projected appearance | Style slides from this file or from component CSS |
| Differentiate headings by size and weight | Add a second type family casually — that is a new design decision |
| Record shortfalls under Open Items | Describe an unbuilt capability as shipped |

## Open Items

Items this file owns, most severe first. Behavioral gaps live in [`EXPERIENCE.md`](./EXPERIENCE.md) → *Open Items* and are not restated here. **Each item names the story key that owns it** — an open item with no key is how a finding becomes permanent.

1. **`muted-foreground` fails WCAG AA on `muted` — measured, not estimated.** *Owner: Story 17.2.* 4.35:1 where 4.5:1 is required, and 4.74:1 on `background` (passing by 0.24), on the token that carries all secondary text. Verified 2026-07-29 against the running application via canvas-resolved sRGB. Darkening `--muted-foreground` to about `#6b6b6b` clears both surfaces; no other token needs to move. **Scoped 2026-07-30 by Story 17.1's AC-6 measurement: this is a light-theme defect only.** The `.dark` block's own `--muted-foreground` measures 5.86:1 on `muted` and passes, so the fix belongs in `:root` alone — see *The same four pairs in the dark palette*.

   **A third failing surface, found 2026-07-31 while measuring the newly-live `dark:` overrides: 4.27:1 on the light ambient glow.** Six surfaces lay a `bg-primary/5` blur behind their content, which resolves to `#f3f3f3` — lighter than `muted` and worse than it. So the token fails on `muted` (4.35:1) *and* on the decorative surface that sits under most of the hub's secondary text (4.27:1), and both were invisible until someone painted them. The `#6b6b6b` fix clears this one too — measured **4.80:1** there — so the scope does not change. But the target must be verified against the glow, not only against `muted`, or 17.2 closes on a pair that is not the worst one; 4.80:1 passes AA by 0.30, which is the whole margin the fix buys.

2. **~~Dark mode cannot be *chosen*.~~ CLOSED by Story 17.1** — recorded 2026-07-30, re-confirmed 2026-07-31 after code review sent the story back. The palette is now selectable from `ThemeToggle` in `Header`; next-themes puts the class on `<html>`, the choice persists in `localStorage` and a first visit with nothing stored follows the operating system. The two deliberate opt-outs were left untouched — `PresenterOperator.tsx:449` and `SlideGridDialog.tsx:176` still pin `className="dark …"` on their own wrapper, so the presenter renders dark whatever the operator picked, and `tests/theme-chrome.test.mjs` pins that along with the rule that no theme token may reach the projected output.

   **This closure is contingent on 17.1's change set landing, and says so deliberately.** The item was first marked closed while the story sat at `review`; review then found AC-4 unmet and returned it to `in-progress`, which left the design record closing an item its own tracking said was unfinished. The convention this establishes: a closure lands *with* the change set that earns it and reverts with it, rather than being written when the work feels done.

   Kept rather than deleted for the correction it carries: **this item once said the palette was unreachable dead code, and that was wrong** — `@custom-variant dark (&:is(.dark *))` (`src/app/globals.css:5`) matches any descendant of a `.dark` element, so the palette always rendered in those two surfaces with no provider involved. What was missing was operator choice, not the palette.

3. **`metadata` is still create-next-app boilerplate.** *Owner: Story 17.3.* `src/app/layout.tsx:16-17` exports `title: "Create Next App"`, `description: "Generated by create next app"` — re-confirmed in the source on 2026-07-30, unchanged. The browser tab and every bookmark of the hub read *Create Next App*. One-line fix; wording is product-owned.

4. **Five undesigned hues, not one.** *No owner yet — this needs a product decision before a story is worth writing.* This file's own *Avoid* list says the palette has no color to spare for encoding state, and the rendered product uses five hues that have no token behind them.

   **Counted against `src/` on 2026-07-31, including `.ts`:** `amber` **43 uses at 6 shades in 8 files**, `red` 20 uses at 4 shades in 4, `emerald` 20 at 4 in 5, `indigo` 10 at 4 in 2, `sky` 3 at 2 in 1 — **11 files** in total. One of two things has to move: either *warning* becomes a real token pair alongside `destructive` and the sites adopt it, or the affordances re-express themselves in greyscale and the utilities go. Deciding by default is how one warning became 96 utilities.

   **This item's own numbers have been wrong three times, and the reason is worth more than the count.** It has read *"six affordances, five files, five shades"*, then *"eight files, six shades"* for amber alone. Each count was taken with a different grep: `.tsx` only misses `presenter-model.ts`, which is where the presenter's whole tone table lives; counting *affordances* rather than *utilities* undercounts a badge that sets border, background and text; and counting only `amber` misses that `red` sits beside a `destructive` token that already means exactly that. Any future recount states its grep or it will be wrong again.

   **Contrast, measured 2026-07-31 rather than left unmeasured:** the two amber affordances outside the presenter pass comfortably in dark (8.40:1, 11.49:1) and one of them **fails in the light theme** — `text-amber-600` on white is **3.20:1**. So this is not a dark-mode item: the hue was never measured on either side, and the side that fails is the one that has been shipping since long before a theme could be chosen. Three chromatic pairs that *were* failing on the dark surface were fixed by Story 17.1 because that story made them reachable (see *The `dark:` overrides that went live with the theme control*); the rest of the hue inventory is still undesigned, which is what this item is for.

5. **`chart-*` and `sidebar-*` tokens are dead.** *No owner, deliberately.* Harmless, and they imply structure this product does not have. Recorded so a future reader does not mistake them for a plan; not worth a story until someone touches the file anyway.

6. **Non-text contrast fails WCAG 1.4.11 on the most widely applied pair in the product.** *No owner yet — this is a product decision about the identity, not a token nudge.* `globals.css` applies `border-border` to **every node** via `@layer base { * { @apply border-border outline-ring/50 } }`. Measured 2026-07-31: `--border` over `card/50` on `background` is **1.29:1** dark and **1.26:1** light, against a 3:1 requirement for a control boundary; `--input` is 1.54:1. `--ring` (focus) passes at 4.18:1, so the failure is the **resting** edge — how a control says it is there before anyone tabs to it.

   Recorded now rather than later because Story 17.1 added the first **icon-only** control to the header. A nav pill with a word in it survives a near-invisible border; a lone glyph in a 1.29:1 box is relying on that box. Raising `--border` is not a one-token fix in the way Open Item 1 is: it is the separation device this whole identity uses in place of shadow (*Elevation & Depth*), so a value that satisfies 1.4.11 visibly changes every card, input and dropdown on both themes. That is a decision, and it is the owner's.
