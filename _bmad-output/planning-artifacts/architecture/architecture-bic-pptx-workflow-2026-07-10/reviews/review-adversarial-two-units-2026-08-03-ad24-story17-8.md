# Adversarial Two-Units Review — AD-24 after Story 17.8

- **Lens:** Adversarial Two-Units (construct independently-built units whose composition defeats the stated convergence rule)
- **Run:** 2026-08-03, AD-24 Story 17.8 closure-gate update
- **Target:** `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md`
- **Focus:** the amended closure-gate block at lines 446–449 only
- **Evidence:** candidate spine, completed Story 17.8, `deferred-work.md`, `tests/theme-chrome.test.mjs`, and `tsconfig.json`. The focused suite was run at HEAD: **54 tests, 54 pass, 0 fail**. No file other than this report was modified.

## Verdict

**NEEDS FIX.** The requested Story 17.8 synchronization is present: the closed edge-sweep ceiling is removed, the index/rest/`.ts` and positive-outline mechanisms are described, the five pre-existing live ceilings and their owners survive, and the cited line locations resolve. But the amended text overclaims three guarantees the gate does not provide: its “positive” outline classifier admits invalid functional colours; its “closed props” claim is defeated by two individually-safe units composed through TypeScript's structural typing; and its “regardless of extension” transitive sweep cannot reach JavaScript or JSON modules that this repository explicitly permits. The first two are holes in the newly amended claims, and the third is an unrecorded reach ceiling—not one of the five preserved ceilings.

**Three findings: 2 HIGH, 1 MEDIUM.**

## HIGH

### F1 — The positive outline classifier still accepts invalid CSS, so “locally resolved” and “invalid rejected” are overclaims

**Where.** The amendment says `localColour` positively recognises locally resolved colour-function values while rejecting invalid values (`ARCHITECTURE-SPINE.md:449`, citing `tests/theme-chrome.test.mjs:828-869`).

**The two units.** Two independently-authored focusable controls choose arbitrary functional-colour syntax, which the amended rule expressly permits:

- Unit A uses `focus-visible:outline-[rgb(255_255_255)]`.
- Unit B uses `focus-visible:outline-[rgb(255)]`.

The first is a colour. The second is not a valid `rgb()` colour because it supplies only one channel. Yet both pass `localColour`: `rgb` is in `COLOUR_FUNCTIONS`; the body is non-empty; it contains no forbidden resolver; it has no alphabetic word outside the allowlist; it has no slash; and its comma split is not four items, so the legacy-alpha rejection does not apply. The function then returns `{ current: false }` at `:869`. The browser drops Unit B's invalid declaration and the universal `outline-ring/50` remains in force, so Unit B can still ring in the operator theme while the gate is green.

This is not only `rgb(255)`: the same shape accepts under-specified forms such as `hsl(20deg)` or `color(display-p3)` because the implementation classifies vocabulary, not the grammar and arity of the named function. The controls at `:1064-1096` prove the seven historical bypasses and selected valid values; they do not prove invalid functional notation.

**Disposition: autofix before finalizing.** Either narrow the spine to the exact guarantee the classifier provides and record invalid functional grammar as a live ceiling, or—preferably, because Story 17.8's review already required invalid colours to fail—strengthen the classifier with grammar/arity checks and a reacting negative control such as `outline-[rgb(255)]`. Do not call it a positive locally-resolved colour classifier while a declaration the browser discards is accepted.

### F2 — A closed TypeScript props type does not make renamed callers a compile-error boundary

**Where.** The amendment says the AST guard rejects top-level index/mapped signatures and rest destructuring, and that renamed/default-import aliases remain protected by the closed TypeScript props shape (`ARCHITECTURE-SPINE.md:446-447`; the same claim appears in `tests/theme-chrome.test.mjs:1540-1543`).

**The two units.** Neither change alone changes the projected result; together they reopen caller styling without `any`:

1. Unit A refactors the component while preserving a closed local props annotation:

   ```tsx
   export default function SlideView(props: { slide: SlidePlanItem }) {
     const { slide, ...rest } = props;
     return <div {...rest}>{/* slide */}</div>;
   }
   ```

   `assertClosedPropsStructure` checks only a rest element in the **parameter's** binding pattern (`tests/theme-chrome.test.mjs:1378-1385`). An identifier parameter followed by rest destructuring in the function body is not inspected. The type remains a closed object literal and contains no `className`, so both props assertions pass.

2. Unit B uses a renamed import and a non-fresh props object:

   ```tsx
   import ProjectedSlide from '@/components/SlideView';
   const projectedProps = { slide, className: 'bg-card' };
   return <ProjectedSlide {...projectedProps} />;
   ```

   TypeScript's structural assignability permits a variable with extra fields where `{ slide: SlidePlanItem }` is required; excess-property rejection does not make this a compile error. The JSX belt only recognises literal tag names `SlideView` and `ArtifactSlide` (`:1235-1238`), so the renamed import is invisible. At runtime Unit A's rest object retains the extra `className` and forwards it to the room-facing wrapper.

This is the two-units failure the architecture spine exists to prevent: the component author can truthfully say the exported type is closed and no parameter rest exists; the caller author can truthfully say the call type-checks and the direct-name belt does not apply; composition reopens exactly the channel AD-24 says does not exist.

**Disposition: autofix before finalizing.** The smallest current-code-compatible boundary is to require these two components to destructure their named props directly in the parameter and to reject an identifier parameter, or to inspect rest/spreads derived from that parameter throughout the component. If the implementation is not tightened now, the spine must not claim renamed aliases are protected by the closed type or that “rest destructuring” generally is rejected; it is only parameter-binding rest that is rejected.

## MEDIUM

### F3 — “Regardless of extension” is false for a repository with `allowJs` and `resolveJsonModule`

**Where.** The amendment says the `.tsx`-only enqueue is gone, `projectedTree()` applies no extension filter, and the edge guard sweeps every reached module regardless of extension (`ARCHITECTURE-SPINE.md:446`). It later records one reach ceiling—CSS—because `moduleImports` resolves only `.tsx`, `.ts`, `/index.tsx`, and `/index.ts` (`:448`; `tests/theme-chrome.test.mjs:1003-1011`).

**The two units.** Unit A puts a shared `border-2` class string in `edge-palette.ts` and imports it extensionlessly; it is reached and rejected. Unit B puts the same string in `edge-palette.js` (or imported JSON) and imports that module; the repo permits this shape (`tsconfig.json` has `allowJs: true` and `resolveJsonModule: true`). `moduleImports` does not test `.js`, `.jsx`, `.mjs`, `.json`, or an already-complete specifier. For `./edge-palette.js` it probes nonexistent names such as `edge-palette.js.tsx`, drops the edge, and leaves the transitive edge scan green.

The block is transparent about the four-candidate resolver, so this is not a hidden fact. The defect is classification: only CSS is named as the surviving ceiling, while legal executable/data modules are equally invisible, and “regardless of extension” reads as a coverage claim. The 27-module floor does not close it; a missed branch can leave the count above 27.

**Disposition: autofix or record explicitly.** Resolve actual relative/alias specifiers first and include the repository's permitted source/data extensions, or amend the claim to “every reached `.ts`/`.tsx` module” and add JavaScript/JSON imports to the live reach ceiling beside CSS. This does not restore the removed Story 17.8 edge-sweep ceiling; it identifies the narrower resolver ceiling that remains underneath it.

## Preserved live ceilings versus new defects

The five ceilings the handoff required preserving are all still present and correctly remain owned outside Story 17.8:

1. runtime-composed class names;
2. CSS imports / stylesheet paint;
3. the downward-only import walk (nothing above projected routes);
4. the absence of an assertion against a duplicate shell implementation; and
5. four hand-maintained projected-root lists, owned by Story 17.7 for route-segment derivation.

The transitive **TypeScript** edge sweep itself is genuinely closed: the non-root `projectedTree()` loop at `tests/theme-chrome.test.mjs:1050-1062` uses `edgeUtilities`, and the old edge-sweep ceiling should not be restored. F3 is the resolver boundary beneath that loop, not the removed root-only defect.

F1 and F2 are newly overclaimed by the Story 17.8 synchronization. Neither appears among the five preserved ceilings. F3 is also not recorded as a live ceiling except for its CSS subset.

## Citation and handoff audit

All `tests/theme-chrome.test.mjs` citations in the amended block resolve to the mechanism described: `projectedTree` and its floor (`:1031`, `:1157-1162`), import parsing/resolution (`:990`, `:1003-1011`), props structure and controls (`:1367-1436`, `:1468`, `:1510-1537`), both caller scans (`:1190-1219`, `:1235-1245`), transitive edge scan (`:1050-1062`, `:678-700`), and outline classifier/controls (`:803`, `:828-869`, `:895-902`, `:1064-1096`). `globals.css:124-129` also supports the body/background and scrollbar-gutter claim. No remaining ceiling was lost by citation drift.

## Gate recommendation

Do not finalize the amendment as written. Apply F1 and F2 as clear fixes to the claim or to the named gate, and either fix F3's resolver reach or name it as an additional live ceiling. The rest of the Story 17.8 handoff is accurate and should remain unchanged.
