# Story 17.2: `muted-foreground` Contrast

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an operator reading secondary text,
I want the muted foreground token to meet WCAG AA,
so that labels, hints and timings are legible.

## Acceptance Criteria

1. **The light-theme token clears the normal-text AA floor on every recorded host surface.** With the application in its light theme, browser-resolved `--muted-foreground` text has a WCAG 2.x contrast ratio of at least **4.5:1** against each of:
   - `--background` (current baseline: **4.74:1**),
   - `--muted` (current baseline: **4.35:1**, failing), and
   - the composited light ambient `bg-primary/5` glow represented by the measured `#f3f3f3` surface (current baseline: **4.27:1**, failing).

   Ratios are calculated from browser-resolved sRGB colours with the WCAG relative-luminance formula, not inferred from an OKLCH lightness value or accepted because a particular replacement literal appears in source. The normal-text 4.5:1 floor applies even where some consumers happen to render larger text.

2. **The implementation is one light-token adjustment, not a palette redesign.** Only `:root --muted-foreground` in `src/app/globals.css` changes. It remains an achromatic project token (`oklch(<L> 0 0)`); approximately `#6b6b6b` is a measured implementation lead, not the acceptance value. `:root --muted`, `:root --background`, every other root token, and the entire `.dark` token block remain byte-for-byte unchanged.

3. **Passing dark-mode behaviour and room-facing output remain untouched.** The existing dark `--muted-foreground: oklch(0.708 0 0)` continues to measure **7.66:1** on dark `background` and **5.86:1** on dark `muted`. The change introduces no edits to projected components, slide plans, PPTX generation, projector/slideshow output, theme persistence, routes, APIs, payload contracts, or registry data. Operator theme choice must still have no effect on projected output.

4. **A regression test protects the property and is proved to react.** `tests/theme-chrome.test.mjs` derives the relevant values from `src/app/globals.css`, checks all three light-theme surfaces at `>= 4.5:1`, and separately pins the light-only scope/dark-token non-change. The test must fail against the pre-story `oklch(0.556 0 0)` value and pass after the token adjustment; the Dev Agent Record captures that fail-then-pass mutation evidence. A source-only assertion for an exact new literal does not satisfy this criterion, and no new test runner or colour dependency is introduced.

5. **The visual authority documents describe the shipped result rather than an open defect.** In the same change set:
   - `DESIGN.md` updates its token inventory and before/after contrast evidence for all three light surfaces, closes Open Item 1 only after the implementation has earned the closure, and preserves the dark measurements;
   - `EXPERIENCE.md` updates the Accessibility Floor so it no longer claims that the light `muted-foreground` pair fails; and
   - `DESIGN.md` is the canonical measurement record: every ratio there names its method and resolved colours. `EXPERIENCE.md` may summarize the outcome and links to that evidence; it does not duplicate the measurement record. Neither document claims that this narrow change is a complete accessibility audit.

6. **The unrelated chromatic-hue decision is not smuggled into this story.** The 90 untokenized `amber`/`emerald`/`red`/`indigo`/`sky` utilities, including the ten Create/Edit form entries in `UNPAIRED_CHROMATIC_TEXT`, are not recoloured or tokenized by Story 17.2. Their existing guard entries remain exact. Stale comments or prose that say Story 17.2 owns the untokenized-hue sweep are corrected to point to `DESIGN.md` Open Item 4, which remains explicitly product-decision-first and ownerless. This story does not choose warning-token versus greyscale semantics.

7. **Repository verification is clean in the supported environment.** On Node.js 22.x (`>=22.12`), the focused theme test, TypeScript check, public-repository guard, and full registered suite pass. `npm run lint` introduces no new problem relative to the current **31-problem** baseline (15 errors, 16 warnings). If native-module state prevents the full suite, restore the supported environment with the repository's normal `npm ci` → `npm run build` → `npm test` sequence rather than weakening or skipping a test.

## Tasks / Subtasks

- [ ] Establish fail-first contrast regression coverage (AC: 1, 2, 3, 4)
  - [ ] Extend `tests/theme-chrome.test.mjs` with a small, dependency-free contrast helper that reads the actual light and dark token declarations from `src/app/globals.css`, parses achromatic `oklch(L 0 0)`, converts it through the CSS Color 4 OKLab-to-linear-sRGB and sRGB-transfer functions, and compares the nearest 8-bit sRGB channels used by the canvas measurement. Apply alpha compositing for the measured light ambient surface where needed, then calculate WCAG relative luminance/contrast.
  - [ ] Assert the light token against `background`, `muted`, and the recorded ambient-glow surface; assert that the `.dark` token/value and its two passing ratios are not changed by this story.
  - [ ] Before editing the production token, run the focused test and record the expected failure on the current 4.35:1/4.27:1 pairs. After the edit, record the passing run. Revert every temporary mutation/probe.
  - [ ] Keep the test property-based: do not make an exact replacement literal the only evidence of success.

- [ ] Adjust only the light muted foreground token (AC: 1, 2, 3)
  - [ ] Change `:root --muted-foreground` in `src/app/globals.css` to the smallest practical achromatic OKLCH adjustment that clears all three recorded surfaces.
  - [ ] Confirm from the diff that no other `:root` token, no `.dark` token, and no projected/runtime surface changed.
  - [ ] Do not compensate by moving `--muted`, `--background`, `--primary`, opacity utilities, individual component classes, or any chromatic hue utility.

- [ ] Measure the running application with fresh browser-resolved colours (AC: 1, 2, 3, 5)
  - [ ] Use the established canvas/computed-style method to resolve the shipped CSS colours to sRGB and calculate all three light ratios plus the two dark control ratios.
  - [ ] Avoid Story 17.1's stale-style trap: switch/reload into the target theme or use fresh probe nodes before reading computed styles; do not reuse an element already measured through a `transition-all` state change.
  - [ ] Record resolved colour pairs, ratios, date, and method in `DESIGN.md`; verify each light pair is `>= 4.5:1` without rounding a sub-threshold raw value up to a pass.

- [ ] Synchronize UX authority and resolve the ownership contradiction (AC: 5, 6)
  - [ ] Update the `DESIGN.md` frontmatter token value, contrast table, Open Item 1, and ambient-glow evidence to match the measured implementation.
  - [ ] Update `EXPERIENCE.md` Accessibility Floor to report the repaired light pairs while retaining the separate dark-hue and non-text-contrast caveats. Keep its ratios as a summary and point readers to `DESIGN.md` for the resolved-colour and method evidence.
  - [ ] Qualify live `DESIGN.md` / `EXPERIENCE.md` claims that the shadcn defaults are “unmodified”: primitives remain unmodified, but the project now deliberately overrides the light muted-foreground token.
  - [ ] Preserve `DESIGN.md` Open Item 4 as an unresolved product decision; remove claims in `DESIGN.md`, `deferred-work.md`, and `tests/theme-chrome.test.mjs` that assign its form-site/untokenized-hue sweep to Story 17.2. Retag the ten exact form exceptions to the decision item without changing their values or weakening the guard's two-way multiset check; do not remove them until a future owned story actually fixes the sites.
  - [ ] Do not update the architecture spine: this story changes no structural invariant, route/surface, storage target, schema, auth gate, slide-order source, or sync channel.

- [ ] Run supported verification and complete the record (AC: 4, 7)
  - [ ] Run `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/theme-chrome.test.mjs`.
  - [ ] Run `npx tsc --noEmit`.
  - [ ] Run `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/public-repo-guard.test.mjs`.
  - [ ] Run `npm test` on the supported Node 22 environment; use `npm ci` then `npm run build` first if the native dependency ABI/build state is stale.
  - [ ] Run `npm run lint`, compare with the 31-problem baseline, and introduce zero new lint findings.
  - [ ] Inspect the final diff for accidental generated output, private data, projected-surface changes, token drift, and leftover measurement probes; update the Dev Agent Record and File List.

## Dev Notes

### Scope and authority

- This story deliberately has **no PRD functional-requirement ancestry**. Epic 17 records operator-chrome visual identity as `DESIGN.md` territory; the PRD's room-facing readability NFR is not a substitute ancestry for this operator-only correction.
- The live story contract is the Epic 17 statement plus the newer measured UX evidence. The earlier readiness report's “~4.4, not tool-measured” estimate is superseded by the running-browser measurements now recorded in `DESIGN.md` and the 2026-07-30 readiness report.
- Story 17.1 made the dark palette selectable and proved its muted pairs already pass. Story 17.2 therefore changes the light root token only. Story 17.7, not this story, owns the remaining projected-shell closure. Story 17.8 and its post-close AD-24 guard debts are unrelated.
- A visual token override requires a same-change-set `DESIGN.md` update under the repository process gate. `EXPERIENCE.md` also names the current failure directly, so leaving it unchanged would make the experience spine lie.

### Implementation guardrails

- Current source values are `:root --muted-foreground: oklch(0.556 0 0)` and `.dark --muted-foreground: oklch(0.708 0 0)` in `src/app/globals.css`. Keep the colour achromatic and preserve the project's OKLCH representation.
- `#6b6b6b` is a useful measured target area, but it must not become a magic acceptance literal. Browser-resolved ratios across all three actual light hosts decide completion.
- The ambient `bg-primary/5` glow exists on six operator routes. Its representative resolved surface (`#f3f3f3`) is the worst recorded light host at 4.27:1. A fix checked only on `muted` can still close against the wrong worst case.
- Many components consume `text-muted-foreground`; a token-level fix intentionally avoids a component sweep. Opacity-modified decorative text and placeholders such as `text-muted-foreground/30` are not evidence that the base token fails this story, and this story is not a full contrast audit.
- Do not add a colour library or a browser test runner for one token. The repository uses `node:test`, and `tests/theme-chrome.test.mjs` is the existing load-bearing theme gate. Add its new file to the explicit `npm test` list only if a separate test file is chosen; extending the existing file avoids that registration hazard.
- The existing `UNPAIRED_CHROMATIC_TEXT` list has inverse/exact polarity: an unlisted offender fails, and a fixed-but-still-listed exception also fails. Story 17.2 leaves the ten form source sites and their list entries unchanged; only their stale ownership explanation is corrected.
- Projected surfaces use literal/registry-resolved colours and remain closed to operator tokens under AD-24. No code under projector, slideshow, PPTX, slide-plan, registry, or projected-shell paths should appear in this story's implementation diff.

### Latest technical specifics

- WCAG 2.2 Success Criterion 1.4.3 requires at least **4.5:1** contrast for normal text and **3:1** for large text. Use 4.5:1 here because this token carries labels, hints, timings, and small secondary copy.
- W3C Technique G18 defines the sRGB-relative-luminance contrast calculation used by this story. Keep unrounded values for the pass/fail comparison and round only for human-readable reporting.
- CSS Color 4 defines OKLCH `L` on a 0–1 range and `C = 0` as achromatic. Adjust lightness while preserving zero chroma and hue omission.

### Project Structure Notes

- Expected implementation files:
  - `src/app/globals.css` — one light token declaration.
  - `tests/theme-chrome.test.mjs` — contrast property and mutation-proof regression coverage; stale hue-ownership comment correction.
  - `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md` — token inventory, measurements, Open Item 1 closure, Open Item 4 ownership repair.
  - `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md` — Accessibility Floor sync.
  - `_bmad-output/planning-artifacts/epics.md` — keep the Epic 17 summary and Story 17.2 label synchronized with `ready-for-dev` / subsequent sprint status.
  - `_bmad-output/implementation-artifacts/deferred-work.md` — only the stale Story 17.2 hue attribution, if still present at development time.
  - this story and `sprint-status.yaml` — normal implementation tracking updates.
- No new source module, dependency, route, component, API, database/schema change, architecture decision, UX surface, or design token is expected.
- The working tree already contains the completed 2026-08-03 AD-24/Story 17.8 architecture-update artifacts. Preserve them; they are not Story 17.2 implementation files and must not be reverted or folded into this story's File List.

### Testing Standards

- Supported runtime: Node.js 22.x (`>=22.12`). The current host may expose Node 24/native `better-sqlite3` ABI failures; that is an environment/build-state issue, not permission to relax acceptance.
- Required focused test command:
  `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/theme-chrome.test.mjs`
- Required public-repository guard command:
  `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/public-repo-guard.test.mjs`
- Run the full registered suite with `npm test`, TypeScript with `npx tsc --noEmit`, and lint with `npm run lint`.
- Current verified baseline before Story 17.2: theme-chrome **54/54**, TypeScript clean, and lint **31 problems** (15 errors, 16 warnings). Full-suite verification must use the supported Node/build state.
- Prove the new contrast guard reacts by restoring the old token or applying an equivalent temporary defect, observing the intended failure, then reverting the probe. Do not weaken an existing guard to make the suite pass.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md:280-296`] — Epic 17 authority, non-PRD ancestry, projected-output boundary, and Story 17.2 statement.
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md:102-126`] — browser/canvas measurement method, light baselines, proposed target area, and passing dark controls.
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md:221-247`] — Open Item 1 including the ambient-glow worst case, and product-decision-first Open Item 4.
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md:162-169`] — Accessibility Floor and separate non-text/hue caveats.
- [Source: `_bmad-output/implementation-artifacts/stories/17-1-reachable-dark-mode.md:406-477`] — prior-story scope exclusion, dark-palette measurement, and stale computed-style warning.
- [Source: `src/app/globals.css:58-67,93-102`] — current light and dark token declarations.
- [Source: `tests/theme-chrome.test.mjs:2267-2284,2404-2470`] — existing dark measurement record guard and exact chromatic-text exception list.
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md:204-219`] — AD-24 operator-local theme state and room-facing closure.
- [Source: `_bmad-output/project-context.md:28-36,76-87`] — supported stack and load-bearing theme-guard conventions.
- [Source: `package.json`] — authoritative package versions and registered test command.
- [W3C WCAG 2.2, Success Criterion 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum) — current AA text-contrast thresholds.
- [W3C Technique G18](https://www.w3.org/WAI/WCAG22/Techniques/general/G18) — contrast-ratio and relative-luminance calculation.
- [W3C CSS Color Module Level 4 — OKLCH](https://www.w3.org/TR/css-color-4/#ok-lab) — OKLCH semantics used by the shipped token.

## Dev Agent Record

### Story Context Completion

Ultimate context engine analysis completed — comprehensive developer guide created and validated against the Epic 17, UX, architecture, project-context, current-code, and test-guard constraints.

Validation amendments applied: Epic 17 tracking is synchronized with `ready-for-dev`; `DESIGN.md` is explicit as the canonical resolved-colour measurement record; and the regression helper's achromatic CSS Color 4 conversion and 8-bit canvas comparison are defined.

### Agent Model Used

TBD (implementation agent)

### Debug Log References

### Completion Notes List

### File List
