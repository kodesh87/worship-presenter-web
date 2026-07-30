---
name: Worship Presenter Web
description: Operator hub for preparing and projecting a worship service. shadcn/ui (base-nova) on Next.js + Tailwind 4; this DESIGN.md ratifies the as-built visual identity, which is a near-zero brand-layer delta over shadcn defaults.
status: final
updated: '2026-07-30'
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
  # Dark-theme values are REACHABLE but not CHOOSABLE: two components pin the
  # `dark` class on their own wrapper, so the palette renders in the presenter
  # and slide-grid surfaces today. Nothing lets an operator choose it -- Open Item 2.
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

**What nobody owns: *is this readable from the pews?*** No artifact answers it, and no test in this repository can — every slide assertion is regex over XML text presence, never geometry. The only control is the pre-launch projector inspection carried as an owner action item in `sprint-status.yaml`, which replaced the PRD §6 fidelity sign-off waived on 2026-07-29.

This file invents no minimum type sizes or contrast floors for projected slides: the registry's geometry came from a deck projected in this sanctuary for years, and invented numbers would displace that evidence. A readability standard is a product decision.

## Colors

The operator surface is greyscale. Every token in `src/app/globals.css` is `oklch(L 0 0)` — lightness varied, chroma exactly zero — with one exception:

- **`destructive`** (`oklch(0.577 0.245 27.325)`, red) is the only chromatic token in the light theme. It carries delete and stale-write-conflict affordances. Because it is the *only* color on the surface, it needs no reinforcement to read as dangerous.
- **`primary`** is near-black (`oklch(0.205 0 0)`) on near-white. High contrast is functional, not stylistic: the hub is read on a laptop in a poorly lit sanctuary.
- `chart-1` … `chart-5` exist as shadcn leftovers and are unused — there are no charts in this product.
- A stray `--sidebar-primary: oklch(0.488 0.243 264.376)` (violet) sits in the dark block. It is dead because **nothing consumes it** — there is no sidebar; navigation lives in `Header.tsx`. The cause is disuse, not the absence of a dark theme — that block does render (Open Item 2). If a sidebar were ever added, this token would paint it violet on a surface that has no other hue.

### Contrast on load-bearing combinations

**Measured 2026-07-29** against the running application: each token was painted to a 1×1 canvas so the browser resolved `oklch()` to sRGB bytes, then WCAG 2.1 relative luminance was computed from those bytes. Earlier estimates derived from Oklab lightness (`Y ≈ L³`) are shown alongside; they held to within 0.05.

| Combination | sRGB | Measured | Prior estimate | WCAG |
| --- | --- | --- | --- | --- |
| `foreground` on `background` | `#0a0a0a` on `#ffffff` | **19.80:1** | ~19:1 | AAA |
| `primary-foreground` on `primary` | `#fafafa` on `#171717` | **17.18:1** | ~17:1 | AAA |
| `muted-foreground` on `background` | `#737373` on `#ffffff` | **4.74:1** | ~4.7:1 | AA normal text — passes by 0.24 |
| `muted-foreground` on `muted` | `#737373` on `#f5f5f5` | **4.35:1** | ~4.4:1 | ❌ **FAILS AA** (needs 4.5:1) |

`muted-foreground` is shadcn's default and carries secondary text throughout, which is why the two `muted-foreground` rows matter more than their margins suggest. Darkening that single token fixes both surfaces at once — `#6b6b6b` reaches 5.1:1 on `background` and 4.7:1 on `muted`.

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
| `Header` | Shared chrome — nav (Dashboard / Announcements / Settings) + profile dropdown. Full-width, `border` beneath, no shadow. |
| Service card list | `card` at `{rounded.lg}` on `background`, separated by `border`. One card per service, date most prominent. Greyscale only — a card carries no status color. |
| `SlideView` / `SlidePreviewList` | Renders a slide plan on the web; consumes the hydrated AST. Slide chrome is `slide-surface`; the preview list is a scrollable strip of scaled `slide-surface` instances. |
| `artifacts/ArtifactSlide` | Renders one Artifact template — geometry, fonts, and colors come from the Registry, **not** from this file. Nothing in DESIGN.md governs its interior. |
| `admin/ArtifactEditor` | Fabric.js canvas editor at fixed 16:9. Editor chrome uses this file's tokens; the canvas interior does not. |
| `HymnNumberAutocomplete` | `popover` at `{rounded.md}` anchored to a number input; results are plain rows, no iconography. |
| `ImageUploadField` / `ImageFieldPreview` | Upload control plus a `{rounded.md}` thumbnail. A rejected reference shows `destructive` text, not a `destructive` fill. |
| `sonner` toasts | shadcn default, unmodified. Bottom-corner, greyscale, `destructive` only for failures. |
| `LogoutButton` | `button` ghost variant inside the profile dropdown. |
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

1. **`muted-foreground` fails WCAG AA on `muted` — measured, not estimated.** *Owner: Story 17.2.* 4.35:1 where 4.5:1 is required, and 4.74:1 on `background` (passing by 0.24), on the token that carries all secondary text. Verified 2026-07-29 against the running application via canvas-resolved sRGB. Darkening `--muted-foreground` to about `#6b6b6b` clears both surfaces; no other token needs to move.

2. **Dark mode cannot be *chosen*.** *Owner: Story 17.1 (`ready-for-dev`).* **This item previously said the palette was unreachable dead code; that was wrong.** Verified against `src/` on 2026-07-30:

   - `src/app/services/[id]/present/PresenterOperator.tsx:449` and `SlideGridDialog.tsx:176` each pin `className="dark …"` on their own wrapper.
   - `src/app/globals.css:5` — `@custom-variant dark (&:is(.dark *))` matches any *descendant* of a `.dark` element.

   So the 33-token palette renders **today**, in the two surfaces an operator uses while a service is running, with no provider involved. What is missing is **operator choice**: the rest of the hub is light-only, and the palette is reachable only where someone hardcoded it. Story 17.1 makes it selectable **without** disturbing those two deliberate opt-outs.

3. **`metadata` is still create-next-app boilerplate.** *Owner: Story 17.3.* `src/app/layout.tsx:16-17` exports `title: "Create Next App"`, `description: "Generated by create next app"` — re-confirmed in the source on 2026-07-30, unchanged. The browser tab and every bookmark of the hub read *Create Next App*. One-line fix; wording is product-owned.

4. **`chart-*` and `sidebar-*` tokens are dead.** *No owner, deliberately.* Harmless, and they imply structure this product does not have. Recorded so a future reader does not mistake them for a plan; not worth a story until someone touches the file anyway.
