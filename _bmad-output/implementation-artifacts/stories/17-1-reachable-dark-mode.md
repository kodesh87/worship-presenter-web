---
baseline_commit: acc8df04c4139fdd0f37a80b23030c15dbb124df
---

# Story 17.1: Reachable Dark Mode

Status: ready-for-dev

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

2. **Given** a first visit with no stored preference, **When** the page loads, **Then** the theme follows the operating system, **And** no wrong-theme flash appears before hydration. `<html>` carries `suppressHydrationWarning` (`src/app/layout.tsx:26`), because next-themes writes the class before React hydrates and the attribute mismatch is expected.

3. **Given** the presenter operator view or the slide-grid dialog, **When** the operator's chosen theme is light, **Then** both still render dark — their local `.dark` wrapper wins for its own subtree. Neither file's wrapper is removed by this story.

4. **Given** any chosen theme, **When** a Service is presented, previewed, downloaded or projected, **Then** the output is byte-identical. This is the load-bearing constraint: the congregation never sees operator chrome. It holds today and must keep holding —
   - `ProjectorClient.tsx:125,145,162` uses literal `bg-black`, `bg-[#0B1220]`, `text-white`, `text-[#D4A574]`, never theme tokens;
   - `src/components/SlideView.tsx` contains no theme-token class at all;
   - `ArtifactSlide.tsx` colours every element from inline `style` resolved out of the Artifact Registry.
   A regression here is a defect against FR-20 and the Deck Blueprint, not a styling preference.

5. **Given** dark mode active, **When** toast notifications appear, **Then** they follow the theme. `src/components/ui/sonner.tsx:3` already calls `useTheme()`; today it resolves to nothing. Mounting the provider is what makes that call meaningful — no change to `sonner.tsx` should be needed, and needing one is a signal the provider is mounted in the wrong place.

6. **Given** the dark palette in use as chrome, **When** its load-bearing pairs are measured with a real contrast checker, **Then** each result is recorded in `DESIGN.md` as a measurement, not an estimate. The light palette's `muted-foreground` was measured at **4.35:1 on `muted` and fails WCAG AA**; the dark side has never been measured at all. If a dark pair also fails, record it as a known defect rather than silently shipping it — the fix belongs to Story 17.2, which owns that token.

7. **Given** this story ships, **When** the change set is reviewed, **Then** `DESIGN.md` is updated in the same change set — the theme control documented under *Components*, and the AC-6 measurements recorded in the contrast table. `AGENTS.md` requires it: a UI component with a visual delta updates `DESIGN.md`. **Do not** re-correct the "dead code" claim; `bmad-ux` did that on 2026-07-30. **Also** update `DESIGN.md` Open Item 2 to closed and `EXPERIENCE.md` → *Accessibility Floor*, whose second bullet says the dark palette has never been measured — AC-6 is what makes that statement obsolete.

## Tasks / Subtasks

- [ ] Mount the provider (AC: #1, #2, #5)
  - [ ] Wrap `children` in `src/app/layout.tsx` with next-themes' provider, `attribute="class"`, `defaultTheme="system"`, `enableSystem`
  - [ ] Add `suppressHydrationWarning` to the `<html>` element (`layout.tsx:26`)
  - [ ] Confirm no `'use client'` leaks into the layout beyond the provider boundary — keep the provider in its own client component
- [ ] Theme control in the shared header (AC: #1)
  - [ ] Add the control to `src/components/Header.tsx` (Epic 13.2's shared shell), beside the existing profile/logout affordances
  - [ ] Keyboard reachable and labelled; use an existing shadcn/Base UI control, no new dependency
  - [ ] Render nothing theme-dependent until mounted, so the button does not flip after hydration
- [ ] Prove the projected output is untouched (AC: #3, #4)
  - [ ] Verify `/services/[id]/present`, its projector window, `/services/[id]/slideshow` and the PPTX download are identical in both themes
  - [ ] Confirm `PresenterOperator` and `SlideGridDialog` still render dark while the hub is light
  - [ ] Consider a test asserting no theme-token class reaches `SlideView` / `ArtifactSlide` — cheaper than re-checking by eye later
- [ ] Measure the dark palette (AC: #6)
  - [ ] `foreground`/`background`, `primary-foreground`/`primary`, `muted-foreground`/`background`, `muted-foreground`/`muted`
  - [ ] Use a real checker or canvas-resolved sRGB, as the light-side measurement did — not Oklab lightness estimates
- [ ] Update `DESIGN.md` in the same change set (AC: #7)
- [ ] `npm test` and the public-repo guard green before commit

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

### Debug Log References

### Completion Notes List

- Story created 2026-07-29 at the owner's request, through Epic → Story rather than an inline patch.

### File List

### Change Log

- 2026-07-29: Story 17.1 created; Epic 17 added to `epics.md`; sprint keys added.
