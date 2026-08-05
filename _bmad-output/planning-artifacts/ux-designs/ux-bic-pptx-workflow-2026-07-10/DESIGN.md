---
name: Worship Presenter Web
description: Operator hub for preparing and projecting a worship service. shadcn/ui (base-nova) on Next.js + Tailwind 4; this DESIGN.md ratifies the as-built visual identity, which is a near-zero brand-layer delta over shadcn defaults.
status: final
updated: '2026-08-03'
colors:
  # Ratified from src/app/globals.css. The palette is ACHROMATIC BY REALITY:
  # every token below is oklch(L 0 0) -- lightness only, chroma exactly zero.
  # There is no brand hue. Unlisted tokens inherit from shadcn (base-nova).
  background: 'oklch(1 0 0)'
  foreground: 'oklch(0.145 0 0)'
  primary: 'oklch(0.205 0 0)'
  primary-foreground: 'oklch(0.985 0 0)'
  muted: 'oklch(0.97 0 0)'
  muted-foreground: 'oklch(0.543 0 0)'
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

The honest description of the as-built identity is *shadcn/ui (base-nova) defaults, with one deliberate light-token override*. The primitives remain unmodified; Story 17.2 darkened `:root --muted-foreground` alone so secondary text clears WCAG AA on every recorded light host. This is not a placeholder awaiting a brand — it is the decision. Prior UX capture recorded it as AD-UX-1 ("clean, high-contrast, uncluttered … minimal custom brand colors"), and the shipped code took that to its logical end: **zero brand hue**.

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
- **A second hue ships without a token: Tailwind's `amber`.** Found 2026-07-30 while reconciling against the architecture spine, and stated here because the greyscale claim above is about `globals.css` tokens and would otherwise read as a claim about the rendered product. It carries the date-collision warning (`CreateForm.tsx`), *hymn lookup unavailable* (`HymnNumberAutocomplete.tsx`), the scripture badge (`SlidePreviewList.tsx` and `presenter-model.ts`), the run sheet warning card (`services/[id]/page.tsx`), the flyer notice (`AnnouncementsManager.tsx`), and the projector-blanked border, scripture-lookup error and live-transition-override notice (`PresenterOperator.tsx`). So *warning* is already a semantic color in this product, just not a designed one. Open Item 4 carries the counted inventory and why the count kept being wrong.
- **And amber is not the only one.** Counted against `src/` on 2026-07-31 (`.tsx` **and** `.ts` — the presenter's tone table is a `.ts` module, which is how earlier counts came up short): **five untokenized hues across 11 files** — `amber` (8 files), `red` (4), `emerald` (5), `indigo` (2), `sky` (1). `red` was the sharpest of the four newcomers, because `destructive` is a real token that already means what it means — and that one is now closed: `LogoutButton` **did** paint its own `red-600`/`red-400` pair rather than using it, that pair reproduced `--destructive` byte for byte in both themes, and Story 17.1 replaced it with `text-destructive` (`LogoutButton.tsx:19`, the was/now table above, and this item's own `red` note below). What is still untokenized under `red` is the `red-500/10` tints and borders, the two `text-red-500` delete affordances and the two `text-red-200` error-banner shades in the create and edit forms — all deferred to Open Item 4, and all four text sites pinned by name in `UNPAIRED_CHROMATIC_TEXT` (`tests/theme-chrome.test.mjs`) so they cannot be forgotten. The `200` shade was omitted from this sentence when it was written and Open Item 4 listed it two hundred lines below, which is the file disagreeing with itself about the one hue this story closed. The greyscale claim in this section is about tokens, and every one of these hues is what the operator actually sees.
- A stray `--sidebar-primary: oklch(0.488 0.243 264.376)` (violet) sits in the dark block. It is dead because **nothing consumes it** — there is no sidebar; navigation lives in `Header.tsx`. The cause is disuse, not the absence of a dark theme — that block always rendered in the presenter, and since Story 17.1 an operator can choose it hub-wide, so *no theme* was never the reason. If a sidebar were ever added, this token would paint it violet on a surface that has no other hue.

### Contrast on load-bearing combinations

**Measured 2026-08-03** (Story 17.2) in a fresh Chrome load of `/login` with the application set to light: computed token colours and the actual `bg-primary/5` utility were painted to a 1×1 canvas, then WCAG 2.1 relative luminance and contrast ratio were computed from the resulting sRGB bytes. The dependency-free conversion in `tests/theme-chrome.test.mjs` reproduces that browser result from `src/app/globals.css` so the property cannot drift. Earlier estimates derived from Oklab lightness (`Y ≈ L³`) are shown alongside where they existed; they held to within 0.05.

| Combination | sRGB | Measured | Prior estimate | WCAG |
| --- | --- | --- | --- | --- |
| `foreground` on `background` | `#0a0a0a` on `#ffffff` | **19.80:1** | ~19:1 | AAA |
| `primary-foreground` on `primary` | `#fafafa` on `#171717` | **17.18:1** | ~17:1 | AAA |
| `muted-foreground` on `background` | `#6f6f6f` on `#ffffff` | **5.02:1** | ~4.7:1 (pre-17.2: 4.74:1 at `#737373`) | AA normal text |
| `muted-foreground` on `muted` | `#6f6f6f` on `#f5f5f5` | **4.61:1** | ~4.4:1 (pre-17.2: 4.35:1 at `#737373`) | AA normal text |
| `muted-foreground` on ambient glow (`bg-primary/5`) | `#6f6f6f` on `#f3f3f3` | **4.53:1** | — (pre-17.2: 4.27:1 at `#737373`) | AA normal text |

Story 17.2 changed `:root --muted-foreground` from `oklch(0.556 0 0)` to `oklch(0.543 0 0)` — the smallest achromatic adjustment that clears all three light hosts. The resolved sRGB is `#6f6f6f`, not the earlier `#6b6b6b` planning estimate; ratios decide, not a replacement literal.

#### The same four pairs in the dark palette

**Measured 2026-07-30**, by the same method — each `.dark` token painted to a 1×1 canvas so the browser resolved `oklch()` to sRGB bytes, then WCAG 2.1 relative luminance computed from those bytes. Before this run the dark palette had **never been measured on any pair**, while rendering every service in the presenter and slide-grid surfaces. Story 17.1 (AC-6) is what closed that.

| Combination | sRGB | Measured | WCAG |
| --- | --- | --- | --- |
| `foreground` on `background` | `#fafafa` on `#0a0a0a` | **18.97:1** | AAA |
| `primary-foreground` on `primary` | `#171717` on `#e5e5e5` | **14.23:1** | AAA |
| `muted-foreground` on `background` | `#a1a1a1` on `#0a0a0a` | **7.66:1** | AAA |
| `muted-foreground` on `muted` | `#a1a1a1` on `#262626` | **5.86:1** | AA (not AAA) |

**The dark palette passes all four of these pairs.** Story 17.2 left the `.dark` block byte-for-byte unchanged. The two themes hold independent `--muted-foreground` values (`oklch(0.708 0 0)` dark, `oklch(0.543 0 0)` light).

**Four pairs is four pairs.** Until 2026-07-31 the sentence above read *"passes every pair"*, which is a claim about the palette and was never measured. What these four cover is **text on a surface**. Two things they do not:

- **Non-text contrast (WCAG 1.4.11) has never passed, in either theme.** `globals.css` applies `border-border` to every node through `@layer base { * { … } }`, so this is the most widely applied colour pair in the product. Measured 2026-07-31: `--border` over `card/50` on `background` is **1.29:1** dark and **1.26:1** light where 3:1 is required; `--input` is 1.54:1 dark. The *focus* indicator holds in dark (`--ring` 4.18:1) and **fails in light (2.58:1)**, so on the light theme neither the resting edge nor the focus ring reaches the floor. Open Item 6. It matters more since 17.1 than before it, because `ThemeToggle` is the first **icon-only** control in the header: a nav pill has a word in it, an icon in a 1.29:1 box does not.
- **The un-tokenized hues** layered on top of the palette (*Colors*, Open Item 4). Two of them sit in the presenter, so the surface's own tokens are now measured while the hue painted over them is not.

#### The `dark:` overrides that went live with the theme control

**Reviewed and measured 2026-07-31, in scope for Story 17.1 by the owner's decision** rather than deferred. Before 17.1 no `.dark` ancestor existed outside `PresenterOperator` and `SlideGridDialog`, and neither of those files contains a single `dark:` utility — so **every `dark:` rule in `src/` was dead CSS**, written against a variant nothing could trigger. Mounting the provider armed all of them at once. Counted precisely, because the review that raised this said *19 across 9 files* while its own enumeration listed 18 sites in 8: **29 `dark:` utilities at 18 sites in 8 files.**

None of them is a palette token pair, which is why AC-6's four-pair measurement said nothing about them:

| What went live | Sites | Verdict |
| --- | --- | --- |
| Ambient page backdrop — `dark:opacity-100` takes a decorative grid from 40% to full, `dark:bg-primary/10` swaps a near-black glow for a near-white one | 6 surfaces (`/`, `/admin`, `/announcements`, `/login`, `/services/new`, `/services/[id]`) × 3 = **18 utilities** | **Passes.** Decorative, `pointer-events-none`, no affordance and no text of its own. What it could have done is lift the surface under text: the dark glow resolves to `#1f1f1f`, where `foreground` measures 15.79:1 and `muted-foreground` 6.38:1; the grid line lifts `#0a0a0a` to `#0e0e0e` (7.47:1). The light half composes `bg-primary/5` to `#f3f3f3`; Story 17.2 verified `muted-foreground` there at **4.53:1** (see *Contrast on load-bearing combinations*) |
| Two amber text affordances **outside** the presenter: the run sheet warning card (`services/[id]/page.tsx:211`) and *hymn lookup unavailable* (`HymnNumberAutocomplete.tsx:453`) | 2 | **Passes, better than its light half.** `dark:text-amber-500` on `--card` is **8.40:1**; `dark:text-amber-400` on `--background` is **11.49:1**. The review recorded `text-amber-700` at 3.57:1 here — that pair cannot occur: `:211` carries `dark:text-amber-500`, so the `-700` shade only ever paints on the light card, where it measures 5.03:1 |
| `button` variants — `outline` box, `ghost` hover, `destructive` fill, `aria-invalid` ring | 9 | **Passes on contrast, failed on consistency.** `text-destructive` on `dark:bg-destructive/20` is 4.64:1 on `card` and 5.31:1 on `background`; `foreground` over the `outline` and `ghost` dark surfaces is 17.50:1 and 17.01:1. The consistency defect was real and is fixed: `outline`'s `dark:bg-input/30 dark:border-input` out-specified `ThemeToggle`'s own unprefixed override, so the toggle rendered its box at `#151515` while the sibling nav pills — hand-styled in `Header`, with no `dark:` variants — stayed at `#111111`. The call site now states its dark half explicitly |

Three chromatic **text** pairs did fail, and they were not `dark:` overrides at all — they were shades with no dark half, in files that became dark-switchable underneath them. All fixed in the same change set: the slide-preview badges (`text-emerald-600` **4.23:1**, `text-indigo-600` **2.54:1** — below even the 3:1 large-text floor) and `LogoutButton`'s `text-red-600` (**3.76:1**). The badge replacements are ported from `PRESENTER_TONE_CLASS`, which has always had to survive a dark surface, and re-measured: **10.56:1**, **10.57:1**, **9.72:1**. `Header`'s password-success line went the same way at 4.91:1 — passing, thinly — and now measures 9.25:1. `LogoutButton` measured **6.21:1** with a hand-rolled `dark:text-red-400`, and now states **`text-destructive`** instead, which is the identical colour in both themes (see Open Item 4).

**The rule those two files established stopped four sites short of itself, and code review round 2 found the rest.** The rule is *"a shade with no dark half, in a file that became dark-switchable underneath it"*, and three more files met it exactly — two of which contained **no `dark:` utility at all**, so nothing about them looked like theme work:

| Site | Was | Now |
| --- | --- | --- |
| `AnnouncementsManager.tsx` recurring / one-off badges, `text-[10px]` so the **4.5:1** small-text floor applies | `text-emerald-600` on `bg-emerald-500/10` (the pair measured at **4.23:1**, i.e. failing), `text-amber-600` | the ported `emerald-200` / `amber-200` halves, as `SlidePreviewList` |
| `AnnouncementsManager.tsx` *Remove* button | `text-red-600` (the pair measured at **3.76:1**) | `text-destructive` |
| `admin/ArtifactEditor.tsx` success line, byte-identical to the `Header` line already fixed | `text-emerald-600` | `dark:text-emerald-400` |

**What is and is not measured here, stated plainly.** No new colour pair enters the product — every replacement above is a pair already measured in this same pass (10.56:1, 10.57:1, 9.25:1, 6.21:1). What was **not** re-measured is each pair on *its own* host surface, because the browser was unavailable in the session that made the change (dependency install is blocked in that environment — see Story 17.1's Debug Log). The shades are proven on the dark `--card`; a per-surface confirmation for these three files is outstanding and belongs with whoever next has a running app.

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
| `ThemeToggle` | The only control that changes this file's palette at runtime. One `button` (`outline` variant, icon size) cycling **system → light → dark**, sitting after the nav links and before the profile dropdown — **outside** the `<nav>` landmark, because it is a setting and not navigation; the row it sits on is `flex-wrap` since it made six controls for an admin. Icon-only, from `lucide` — `MonitorIcon` / `SunIcon` / `MoonIcon` — with the state and the next state in `aria-label`. Its `className` overrides the primitive's radius and box to `{rounded.xl}` at 38px so it matches the sibling nav pills; that is a call-site override, not a customization of `button` itself, and it is the only reason this row is not "shadcn default, unmodified" like the rest. **The box it matches is now a shared constant, not a copy** (`components/header-chrome.ts`, **two** exports and **three** consumers: `HEADER_CONTROL_BOX_BASE` is the box — radius, border, `bg-card/50`, shadow, `cursor-pointer`, transition — and `HEADER_CONTROL_BOX` is that plus the muted tone this control and `Header`'s nav pills share; the profile dropdown trigger takes the base with its own `text-foreground`, which is why the split exists rather than a single constant): the toggle reproduced those seven classes by hand at first, and a hand-reproduced box drifts the moment the pills are restyled — the one failure a control whose purpose is to match its siblings cannot have. That constant is also where `cursor-pointer` comes from; this was the only control in the row rendering a default arrow, since `<a href>` gets a pointer from the UA for free and a `<button>` does not. **The override has to state its dark half explicitly** (`dark:border-border dark:bg-card/50`): `outline` ships `dark:bg-input/30 dark:border-input`, `tailwind-merge` does not treat a `dark:`-prefixed class as conflicting with an unprefixed one, and `:is(.dark *)` out-specifies the plain override — so without it the toggle sat at `#151515` while the nav pills stayed at `#111111`, matching in light and drifting in the mode the control exists to reach. Before hydration it renders **focusable and inert** (`aria-disabled`, via Base UI's `focusableWhenDisabled`) showing `SunMoonIcon`, which is **none of the three states**: next-themes seeds the choice from `localStorage` inside `useState`, so on the hydration render the state is already known while the mount flag is still the server's `false` — a `MonitorIcon` placeholder is the `system` icon and made every operator who had chosen light or dark watch their control claim `system` and correct itself. A native `disabled` would also have left the tab order and stepped the box from `opacity-50` to full as it landed. **The same absent native attribute is why the placeholder states `aria-disabled:pointer-events-none` by hand:** Tailwind's `disabled:` variant compiles to `:disabled`, so neither `disabled:opacity-50` nor `disabled:pointer-events-none` from `buttonVariants` reaches an `aria-disabled` element — and the placeholder kept the shared box's `hover:bg-card hover:text-foreground` and lit up under the cursor while inert, which is precisely what "must not *look* interactive while inert" rules out. |
| Service card list | `card` at `{rounded.lg}` on `background`, separated by `border`. One card per service, date most prominent. Greyscale only — a card carries no status color. |
| `SlideView` / `SlidePreviewList` | Two different things, and the row used to conflate them. `SlideView` renders a slide plan on the web from the hydrated AST — it is the entry point to the projected wrapper. **`SlidePreviewList` renders no slide at all:** it is a list of text rows with tone badges, and it mounts neither `SlideView` nor `ArtifactSlide`. Verified by enumerating every call site of both — **nine**, not the seven the review reported: eight `<SlideView`, in `PresenterOperator` (3), `ProjectorClient` (2), `SlideshowClient` (2) and `SlideGridDialog` (1), plus the single `<ArtifactSlide` inside `SlideView` itself. This row described the list as *"a scrollable strip of scaled `slide-surface` instances"*, which was false twice over: `slide-surface` is cited by this file and defined nowhere in `src/` (a pre-existing finding, deferred by Story 17.1's review and still without an owning key), and the list holds no scaled slide instances either. The second half was not harmless: Story 17.1's review dismissed AC-4's word *previewed* on precisely the ground that this list renders no projected pixel, so the authoritative artifact was contradicting a dismissal that depends on it. The list's badge tones carry **two halves**: token-painted tones (`song-title`, `default`) follow the theme on their own, and the three chromatic tones state a `dark:` shade because their `-600` values were chosen against white and the list is hub chrome — see *The `dark:` overrides that went live with the theme control*. Neither `SlideView` nor `ArtifactSlide` accepts a `className` — the parameter is gone from both signatures, so a caller styling the projected wrapper is a compile error rather than a lint of `.tsx` files. |
| `artifacts/ArtifactSlide` | Renders one Artifact template — geometry, fonts, and colors come from the Registry, **not** from this file. Nothing in DESIGN.md governs its interior. |
| `admin/ArtifactEditor` | Fabric.js canvas editor at fixed 16:9. Editor chrome uses this file's tokens; the canvas interior does not. |
| `admin/TransitionSettings` | A `card` on `/admin` holding a native `select` plus a `button`. No custom control and no iconography; the hint and the save confirmation are `muted-foreground` body text. |
| `admin/UiLocaleSettings` | `admin/TransitionSettings`'s row reproduced rather than reinterpreted: a `card` on `/admin` holding a native `select` plus a `button`, no custom control, no iconography, the save confirmation in `muted-foreground` body text. **No token override and no chromatic affordance** — a language is named in words and never encoded as a tone, the same rule the *Corpus picker* row states for itself. One visual consequence of a behavioral contract this file inherits rather than makes ([`EXPERIENCE.md`](./EXPERIENCE.md) → *Component Patterns*, commits on Save): the card's labels and its `select` can legitimately show two different languages at once while the operator hesitates. **That is the intended appearance, not a lag**, and it needs no affordance to explain it. |
| Presenter transition control | A native `select` in the presenter's dark control bar, carrying an inline **Live only · not saved** badge — `border` outline on `muted`, no fill. When the live style differs from the saved one the surface adds a warning line in un-tokenized amber (*Open Item 4*), on the reasoning that greyscale alone cannot distinguish "this is temporary" from ordinary secondary text. |
| `HymnNumberAutocomplete` | `popover` at `{rounded.md}` anchored to a number input; results are plain rows, no iconography. |
| Scripture reference field | **⚠ Not shipped** — *Owner: Story 21.5*, added here 2026-08-01 to keep this table paired with [`EXPERIENCE.md`](./EXPERIENCE.md) → *Component Patterns*. Visually it is `HymnNumberAutocomplete`'s row: a `popover` at `{rounded.md}` anchored to a single text input, plain result rows, no iconography. **One input, not a composite** — no book `select` beside a chapter and verse pair — which is a behavioral decision this file inherits rather than makes. The one thing that is this file's: a suggestion row carries a book name, not a code, so it needs no badge and no second tone. Today the three sites are bare inputs and one is `PresenterOperator`'s, which pins `dark` on its own wrapper — so this control renders on the dark surface at least as often as the light one and must be measured on both, unlike every other row here. |
| Corpus picker | **⚠ Not shipped** — *Owners: Story 21.3, Story 22.3.* Behavior is [`EXPERIENCE.md`](./EXPERIENCE.md)'s; what this file owns is that the always-present *reach the other locales* control is **not** a chromatic affordance. It is the standard `outline` control on `muted`, greyscale like everything else — a locale outside the default is ordinary, not a warning, and this file's *Avoid* list has no colour to spend on it (*Open Item 4* is what happens when that rule is skipped). A locale is named in words on the row, never encoded as a tone. |
| `ImageUploadField` / `ImageFieldPreview` | Upload control plus a `{rounded.md}` thumbnail. A rejected reference shows `destructive` text, not a `destructive` fill. |
| `sonner` toasts | shadcn default, unmodified. Bottom-corner, greyscale, `destructive` only for failures. **⚠ Nothing renders it today** — `Toaster` is mounted in no layout and `toast(` is called nowhere in `src/`. It reads the theme correctly (`useTheme()`, resolving against the provider Story 17.1 mounted), so this row describes what would appear rather than what does. [`EXPERIENCE.md`](./EXPERIENCE.md) → *Open Item 4*, owner Story 17.6. |
| `LogoutButton` | The destructive-tinted row at the foot of the profile dropdown. Still not the `button` primitive — a hand-rolled `<button>` — but it names **`text-destructive`** since Story 17.1 (`LogoutButton.tsx:19`). It used to paint its own `red-600` with a hand-rolled `red-400` dark half, which was the sharpest instance of Open Item 4: both shades reproduced `--destructive` exactly, so the dark side was accidentally on-token while the light side was not, and either could drift the moment the destructive identity was retuned. What remains untokenized here is the hover tint `bg-red-500/10`, which has no `destructive` equivalent at that alpha. |
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

1. **~~`muted-foreground` fails WCAG AA on `muted` — measured, not estimated.~~ CLOSED by Story 17.2** — recorded 2026-07-29, re-measured and fixed 2026-08-03. The pre-story light token (`oklch(0.556 0 0)`, `#737373`) failed at 4.35:1 on `muted` and 4.27:1 on the ambient `bg-primary/5` glow (`#f3f3f3`). Story 17.2 darkened `:root --muted-foreground` to `oklch(0.543 0 0)` (`#6f6f6f`), clearing all three light hosts at **5.02:1**, **4.61:1**, and **4.53:1** respectively (method and resolved colours in *Contrast on load-bearing combinations*; regression in `tests/theme-chrome.test.mjs`). The `.dark` block was untouched.

2. **~~Dark mode cannot be *chosen*.~~ CLOSED by Story 17.1** — recorded 2026-07-30, re-confirmed 2026-07-31 after code review sent the story back. The palette is now selectable from `ThemeToggle` in `Header`; next-themes puts the class on `<html>`, the choice persists in `localStorage` and a first visit with nothing stored follows the operating system. **The flip repaints rather than animating** — the provider passes `disableTransitionOnChange`, which matters here because `transition-all` is on every nav pill (via `HEADER_CONTROL_BOX`), the profile button, the logo tile, the dropdown items and every `buttonVariants` control; without the flag a single press animates all of them at once and the shell smears through an intermediate palette, on the one control whose job is to make the change read as deliberate. The two deliberate opt-outs were left untouched — `PresenterOperator.tsx:449` and `SlideGridDialog.tsx:176` still pin `className="dark …"` on their own wrapper, so the presenter renders dark whatever the operator picked, and `tests/theme-chrome.test.mjs` pins that along with the rule that no theme token may reach the projected output.

   **This closure is contingent on 17.1's change set landing, and says so deliberately.** The item was first marked closed while the story sat at `review`; review then found AC-4 unmet and returned it to `in-progress`, which left the design record closing an item its own tracking said was unfinished. The convention this establishes: a closure lands *with* the change set that earns it and reverts with it, rather than being written when the work feels done.

   Kept rather than deleted for the correction it carries: **this item once said the palette was unreachable dead code, and that was wrong** — `@custom-variant dark (&:is(.dark *))` (`src/app/globals.css:5`) matches any descendant of a `.dark` element, so the palette always rendered in those two surfaces with no provider involved. What was missing was operator choice, not the palette.

3. **~~`metadata` is still create-next-app boilerplate.~~ CLOSED by Story 17.3** — recorded 2026-07-30, fixed 2026-08-05. Before the fix, `src/app/layout.tsx` exported create-next-app defaults `title: "Create Next App"` and `description: "Generated by create next app"`, so the browser tab and every bookmark of the hub read *Create Next App*. Story 17.3 replaced only those two string literals with the product-owned values already in this file's frontmatter: `title: "Worship Presenter Web"` and `description: "Operator hub for preparing and projecting a worship service."` (regression in `tests/theme-chrome.test.mjs`). No other line in `layout.tsx`, and no favicon/icon/manifest/route, was touched.

4. **Five undesigned hues, not one.** *No owner yet — this needs a product decision before a story is worth writing.* This file's own *Avoid* list says the palette has no color to spare for encoding state, and the rendered product uses five hues that have no token behind them.

   **Counted 2026-07-31, and this time the grep is stated, because the item demanded that of its successor and did not supply it.** Over every `.ts`/`.tsx` under `src/`, **comments stripped first**, matching
   `(?<![-\w])(?:dark:)?(?:bg|text|border|ring|ring-offset|inset-ring|from|via|to|fill|stroke|divide|divide-x|divide-y|shadow|inset-shadow|text-shadow|caret|accent|decoration|placeholder|outline)-<hue>-\d{2,3}\b`:
   `amber` **45 uses at 6 shades (200,300,400,500,600,700) in 8 files**, `emerald` 19 at 4 (200,400,500,600) in 5, `red` 14 at 2 (200,500) in 4, `indigo` 9 at 4 (200,400,500,600) in 2, `sky` 3 at 2 (200,400) in 1 — **90 utilities across 11 files**. One of two things has to move: either *warning* becomes a real token pair alongside `destructive` and the sites adopt it, or the affordances re-express themselves in greyscale and the utilities go. Deciding by default is how one warning became 90 utilities.

   **This item's own numbers were wrong four times, and the reason is worth more than the count.** It has read *"six affordances, five files, five shades"*, then *"eight files, six shades"* for amber alone, then *"`red` 20 uses at 4 shades, `emerald` 20 at 4"*. Each count used a different grep and none said which: `.tsx` only misses `presenter-model.ts`, where the presenter's whole tone table lives; counting *affordances* rather than *utilities* undercounts a badge that sets border, background and text; counting only `amber` misses that `red` sits beside a `destructive` token that already means exactly that; and the immediately preceding count matched `emerald-[0-9]` **including mentions inside doc comments**, which inflated `emerald` and `red` by the prose explaining them — three of those mentions being in a comment Story 17.1 had just written. In a change set whose central lesson is that prose about a token is not a token, an inventory that counted comments was the same error one artifact over. Hence: comments stripped, utilities only, grep quoted above.

   **`red` moved for a real reason, not a counting one.** It fell from 4 shades to 2 because Story 17.1 replaced both hand-rolled `text-red-600` pairs with `text-destructive` — `--color-red-600` and `:root --destructive` are the same `oklch(0.577 0.245 27.325)`, and `red-400` and `.dark --destructive` likewise, so the token reproduced the shipped colour exactly. What remains under `red` is `red-500/10` backgrounds and borders, plus the `red-200` light-theme banners in *Deferred*. That is the shape the rest of this item is asking for: where a token already means the thing, name it.

   **Contrast, measured 2026-07-31 rather than left unmeasured:** the two amber affordances outside the presenter pass comfortably in dark (8.40:1, 11.49:1) and one of them **fails in the light theme** — `text-amber-600` on white is **3.20:1**. So this is not a dark-mode item: the hue was never measured on either side, and the side that fails is the one that has been shipping since long before a theme could be chosen. Three chromatic pairs that *were* failing on the dark surface were fixed by Story 17.1 because that story made them reachable (see *The `dark:` overrides that went live with the theme control*); the rest of the hue inventory is still undesigned, which is what this item is for.

5. **`chart-*` and `sidebar-*` tokens are dead.** *No owner, deliberately.* Harmless, and they imply structure this product does not have. Recorded so a future reader does not mistake them for a plan; not worth a story until someone touches the file anyway.

6. **Non-text contrast fails WCAG 1.4.11 on the most widely applied pair in the product.** *No owner yet — this is a product decision about the identity, not a token nudge.* `globals.css` applies `border-border` to **every node** via `@layer base { * { @apply border-border outline-ring/50 } }`. Measured 2026-07-31: `--border` over `card/50` on `background` is **1.29:1** dark and **1.26:1** light, against a 3:1 requirement for a control boundary; `--input` is 1.54:1 dark.

   **Two failures, not one, and this item denied the second until 2026-07-31.** The resting edge fails in **both** themes — that is the `--border` figure above, and it is how a control says it is there before anyone tabs to it. The **focus ring** fails in the **light** theme at **2.58:1**; it holds in dark at 4.18:1. So on light neither the resting edge nor the focus ring reaches the floor. This item previously read *"`--ring` (focus) passes at 4.18:1, so the failure is the resting edge"* — quoting the dark figure as though it were the only one, two sections after *Contrast* had already recorded the light failure. The item that owns a finding is the worst place for it to be contradicted, and this one carries **no owner**, so nothing downstream would have caught the denial.

   Recorded now rather than later because Story 17.1 added the first **icon-only** control to the header. A nav pill with a word in it survives a near-invisible border; a lone glyph in a 1.29:1 box is relying on that box. Raising `--border` is not a one-token fix in the way Open Item 1 is: it is the separation device this whole identity uses in place of shadow (*Elevation & Depth*), so a value that satisfies 1.4.11 visibly changes every card, input and dropdown on both themes. That is a decision, and it is the owner's.
