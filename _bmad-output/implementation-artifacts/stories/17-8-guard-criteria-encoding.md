---
baseline_commit: 460ce0875c873456a943e75d5de3c7629dd4338f
---

# Story 17.8: The Guard Encodes Its Criteria, Not Its Spellings

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the maintainer of the one test `AD-24` names as its closure gate,
I want each of that gate's remaining narrownesses closed by stating the **rule** rather than by adding the next spelling to a list,
so that the guarantee AC-4 rests on &#xE2;&#x20AC;&#x201D; the congregation never sees operator chrome &#xE2;&#x20AC;&#x201D; stops needing a fifth review round to discover a fifth spelling.

## The rule this story exists to apply

Story 17.1 wrote it down after four rounds of review found the same shape four times. Quote it in the diff:

> Where a list remains it is an **exception** list that fails closed, not a scope list that fails open.
> &#xE2;&#x20AC;&#x201D; `17-1-reachable-dark-mode.md:788`

**If your fix only names the next rejected spelling, it is the wrong fix.** Ask what property must hold, then assert that. A finite positive vocabulary may be the implementation of a property &#xE2;&#x20AC;&#x201D; CSS named colours are finite &#xE2;&#x20AC;&#x201D; while a growing subtraction list of bypasses is not. For AC-1 the property is *the outline resolves locally to a visible colour*; for AC-2 it is *the props are a closed set of locally-declared fields*.

## Scope: four filed findings, five behavioural ACs

The four findings that had **no owner** after code-review round 4 and the 2026-08-01 `bmad-architecture` Update run are now assigned to this story in `deferred-work.md`. They become **five behavioural criteria** because the props finding covers two independent mechanisms and splits into AC-2 and AC-3. AC-6 through AC-8 are cross-cutting verification and preservation criteria, so the story has eight ACs in total.

**Out of scope &#xE2;&#x20AC;&#x201D; Story 17.7 owns these, and one of them touches a function you are editing:**

| Not yours | Where | Why it matters to you |
| --- | --- | --- |
| Deriving the four room-facing lists from one source | `PROJECTED:578`, `ROUTE_SHELLS:772`, `FULL_SCREEN:1132`, inline pair `:1119` | 17.7's route segment is the first value they *could* derive from. Do not start it. |
| `exportedProps` cannot read `export default async function` | `:959-961` | **This is inside the function AC-2 edits.** Leave the `assert.ok(at !== -1)` loud failure exactly as it is; do not "fix" it in passing. |

## Acceptance Criteria

1. **The focus-ring guard recognises a visible, locally resolved colour instead of excluding non-colours.** `LITERAL_OUTLINE_COLOUR` (`:728-729`) is a nine-spelling negative lookahead followed by `[a-z[(]` &#xE2;&#x20AC;&#x201D; and `[` is in the accept class, so every bracketed value passes. Verified against the shipped regex: **accepted today** are `outline-[transparent]`, `outline-[inherit]`, `outline-[color:inherit]`, `outline-[revert]`, `outline-[unset]`, `outline-[initial]`, and `outline-[--ring]`. The last is the sharpest: it is a *theme token reference* that no token guard catches either, because `TOKEN_SHORTHAND` (`:548`) matches only the paren form `outline-(--ring)` and `TOKEN_CSS_VAR` (`:554`) requires a literal `var(`. All must be rejected. **Classify both bare and bracketed values by one positive rule.** Accepted classes include literal hex, colour functions, type-hinted colour values and named colours; CSS-wide keywords, `transparent`, and bare custom-property references are not visible locally resolved focus colours. A finite positive named-colour vocabulary or a real parser is a classifier and is allowed; the forbidden shape is a subtraction list of known failures. Do not add a dependency merely for this classifier.
2. **The `className` props guard asserts a closed shape, not the absence of a word.** `exportedPropsShape` (`:1074`) currently greps the resolved props text for `className`. An inline **index signature** defeats it: `{ slide: SlidePlanItem; [key: string]: unknown }` makes `propsAnnotation` return a string starting with `{`, so the function returns early at `:1083`, the text contains no `className`, and a caller's `className="bg-card"` compiles onto the wrapper the congregation sees. Assert the shape is a **closed object literal** &#xE2;&#x20AC;&#x201D; no index signature and no rest element &#xE2;&#x20AC;&#x201D; in addition to the existing checks.
3. **The direct-name call-site belt reaches a `.ts` call site.** The loop is `for (const file of allTsxFiles())` at **`:942`**, so `React.createElement(SlideView, { slide, className: 'bg-card' })` from a `.ts` module is invisible. Widen this source-scan belt for direct references to `SlideView` and `ArtifactSlide`; renamed/default-import aliases remain protected by the closed TypeScript props shape AC-2 preserves and are not a second import-resolution project.
4. **The edge-width guard sweeps the complete projected tree, not only its roots and not only `.tsx`.** `EDGE_UTILITY` (defined `:659`) is consumed at `:661` and **nowhere else**, inside `for (const file of PROJECTED)`. The token guard pairs its roots-only loop (`:676`) with a `projectedTree()` sweep (`:899`); the focusable guard sweeps the tree (`:750`). The edge guard has no companion. A reached `.ts` module can export a class string consumed by JSX &#xE2;&#x20AC;&#x201D; `src/components/header-chrome.ts` is the live house precedent &#xE2;&#x20AC;&#x201D; so filtering the sweep to `.tsx` merely recreates the extension exemption this gate already removed. A `border-2` literal anywhere in the reached module graph inherits `border-border` when used by the room-facing tree and must be reported.
5. **`DARK_VARIANT` detects a `dark:` segment anywhere in a variant chain.** `DARK_VARIANT` is at **`:565`** &#xE2;&#x20AC;&#x201D; `/(?<![\w:])dark:[a-z[-]/g` &#xE2;&#x20AC;&#x201D; so it misses suffix shapes (`dark:!bg-zinc-900`, `dark:2xl:bg-zinc-900`, `dark:*:bg-zinc-900`) and prefix stacks such as `sm:dark:bg-zinc-900` because its lookbehind rejects the colon before `dark:`. A `dark:` class naming a *token* is still caught by `TOKEN_UTILITY`, so the live hole is a `dark:` variant painting a **literal** colour on a projected surface while every token guard stays green. The rule is the segment, not whether stacking happens before or after it.
6. **Each independent mechanism is negative-tested with a matching control, and the evidence is recorded honestly.** Per mechanism: capture the pre-injection `git status --short` and diff, inject the defect, observe the suite **green**, apply the fix, observe the suite **fail**, add a control that must stay green, remove only the probe, and confirm status/diff returned exactly to the pre-injection snapshot. Do not require a globally clean tree while intended story edits exist. Record as *"N injections, N react"* and state explicitly that this is **a property of those N injections, not a coverage claim** &#xE2;&#x20AC;&#x201D; round 2 and round 4 both had to correct that exact overreach (`17-1:379`).
7. **A tightened guard that fails on correct code means the guard is wrong &#xE2;&#x20AC;&#x201D; and that has happened five times in this file.** Do not resolve such a failure by exempting the file. Precedents: root-only AC-3 failed on `SlideGridDialog`, whose `<Dialog>` is an unclassed context provider (the *rule* was wrong &#xE2;&#x20AC;&#x201D; it became *outermost classed*); the next AC-3 tightening then false-failed on the `<DialogTitle className="sr-only">` shadcn's accessibility guidance asks for (resolved by descending the single-element chain and **reporting ambiguity instead of guessing**); the first `className` assertion failed on both projected files, which legitimately set `className` on their own elements; `jsxReturnBranches` false-positived a `Caption` helper; and one prescribed widening was outright **unsatisfiable**. When a guard fails on correct code, fix the rule or report ambiguity. When it fails on genuinely wrong code, fix the source. **Adding an exemption to make a tightened guard pass is the failure this story exists to end.**
8. **`outline-current` stays allowed, deliberately.** `:722-727` records the decision: it resolves to the element's own `color`, which on these surfaces is the literal `text-white` the root guard pins, and a theme-token `color` cannot reach here because the token guard rejects it. A naive positive vocabulary rejects `current` &#xE2;&#x20AC;&#x201D; and **no projected file uses it, so no test would fail and the decision would be deleted silently.** Keep it, and keep the comment.

## Tasks / Subtasks

- [x] **Task 1 &#xE2;&#x20AC;&#x201D; colour classification for the focus ring (AC: 1, 6, 8)**
  - [x] Rewrite `LITERAL_OUTLINE_COLOUR` (`:728-729`) to classify what follows `focus-visible:outline-`. Bare and bracketed spellings must be classified by the **same** rule, since that asymmetry is the current defect. A positive named-colour table is permitted; a subtraction list of known failures is not.
  - [x] **`EDGE_WIDTH` (`:629`) is a bracket *parser*, not a classifier** &#xE2;&#x20AC;&#x201D; it is `(?:\d+|\[[^\]\s"'\`]+\])`, an opaque any-blob matcher. Read it for how the file handles `[&#xE2;&#x20AC;&#xA6;]` syntax; **do not** reuse it as the accept rule, because it cannot tell `[#fff]` from `[transparent]`.
  - [x] **Keep the regex un-flagged.** `LITERAL_OUTLINE_COLOUR` has no `/g` and is consumed by `.test(tag)` inside a loop at `:755`. Adding `/g` makes `.test()` stateful through `lastIndex` and produces intermittent phantom offenders.
  - [x] Negative-test all seven bypasses in AC-1. Positive controls must separately prove that the classifier accepts bare and arbitrary valid colours: `focus-visible:outline-white`, `focus-visible:outline-current`, `focus-visible:outline-[#fff]`, a colour function such as `focus-visible:outline-[rgb(255_255_255)]`, a type-hinted colour such as `focus-visible:outline-[color:#fff]`, and a named colour in bracket form such as `focus-visible:outline-[red]`. Rejecting every arbitrary value does not satisfy this task.
- [x] **Task 2 &#xE2;&#x20AC;&#x201D; closed props shape (AC: 2, 6, 7)**
  - [x] In `exportedPropsShape` (`:1074`), reject a top-level index signature and a rest element in the props destructuring pattern, alongside the existing `className` check and loud failure on non-local types. Cover string, number, symbol, `PropertyKey`, and template-pattern index signatures without false-positive matching brackets used only inside an ordinary property's value type.
  - [x] Keep the loud-failure behaviour and message: *a guard that cannot read the shape it asserts about must say so rather than pass* (`17-1:254`).
  - [x] Do not touch `exportedProps`'s `export default function` literal at `:959-961` &#xE2;&#x20AC;&#x201D; that ceiling is Story 17.7's, and it fails loudly, so it is safe where it is applied.
  - [x] Run two independent negative probes: one adds only an index signature, one adds only a rest element. Add controls proving ordinary array/tuple/property types remain readable. Then run one end-to-end probe combining the permissive signature, `{...rest}` on the wrapper, and a caller-supplied `className`. **Run `npx tsc --noEmit` on the combined injected version** to prove the leak compiled before the guard fix.
- [x] **Task 3 &#xE2;&#x20AC;&#x201D; call-site belt reaches `.ts` (AC: 3, 6)**
  - [x] Widen the loop at **`:942`**. The file's own dual-extension idiom already exists at **`:2023`**: `for (const file of [...allTsxFiles(), ...allTsFiles()])`. `allTsFiles` is declared at `:373`.
  - [x] A `.ts` file has no JSX, so the direct-name check there is an identifier reference rather than a tag: flag `React.createElement(SlideView, &#xE2;&#x20AC;&#xA6;)` / `React.createElement(ArtifactSlide, &#xE2;&#x20AC;&#xA6;)` when the props object carries `className`. Do not build import-alias resolution here; AC-2's closed compile-time props shape is the protection for renamed imports.
  - [x] **Require a word boundary.** `src/lib/pptx.ts:321,552` declare and call `renderArtifactSlide` &#xE2;&#x20AC;&#x201D; a substring match on `ArtifactSlide` hits it twice. The belt itself uses `/^<(SlideView|ArtifactSlide)\b/` at `:944`.
  - [x] Negative-test with a `.ts` module calling `React.createElement(SlideView, { slide, className: 'bg-card' })`. Control: a `.ts` module mentioning `renderArtifactSlide` must stay green.
- [x] **Task 4 &#xE2;&#x20AC;&#x201D; edge guard sweeps the tree (AC: 4, 6)**
  - [x] Add a `projectedTree()` sweep for `EDGE_UTILITY` over **every reached module, regardless of extension**. Mirror the token sweep at `:899` by filtering `via !== null` because this companion is paired with the roots-only loop; do not filter `.tsx`. Keeping roots out prevents duplicate reports while keeping `.ts` class sources visible.
  - [x] Keep the roots-only loop at `:661`; the token guard keeps both and that is the established pattern.
  - [x] **Inject the defect through the house pattern, not through a root.** Create a temporary reachable `.ts` module exporting a `border-2` class string, import it into `SlideshowClient`, and use that constant in its JSX. The pre-fix suite must stay green and the fixed sweep must fail on the `.ts` source. An injection into an existing projected root proves only the old roots loop. Remove the temporary module and all imports after the probe.
- [x] **Task 5 &#xE2;&#x20AC;&#x201D; `DARK_VARIANT` (AC: 5, 6)**
  - [x] Rewrite `DARK_VARIANT` at **`:565`** around the property *a `dark:` segment occurs anywhere in the variant chain*. Cover prefix stacks, suffix stacks, the important modifier and child selector without enumerating only the four examples below.
  - [x] Read `DARK_VARIANT_CHAIN` (`:1956`) as an exemplar for suffixes after `dark:`, **not as a complete recognizer**: it does not cover a stack before `dark:` or the `*` child selector. `EDGE_END` is also not the answer; its `!` is an end delimiter, while `dark:!bg-&#xE2;&#x20AC;&#xA6;` puts `!` before the utility.
  - [x] **Keep the `/g` flag.** `DARK_VARIANT` is consumed by `source.matchAll()` at `:572`; a non-global regex there throws `TypeError` and produces opaque cascading failures.
  - [x] Negative-test at least `dark:!bg-zinc-900`, `dark:2xl:bg-zinc-900`, `dark:*:bg-zinc-900`, `sm:dark:bg-zinc-900`, `sm:dark:hover:bg-zinc-900`, and `dark:hover:!bg-zinc-900`. Controls: the ordinary `dark:bg-zinc-900` still fails and a stacked literal with no `dark:` segment stays green.
- [x] **Task 6 &#xE2;&#x20AC;&#x201D; verification (AC: 6, 7)**
  - [x] `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/theme-chrome.test.mjs` &#xE2;&#x20AC;&#x201D; baseline **48/48**, 0 fail.
  - [x] Run the repository's load-bearing verification order under Node 22.x (`>=22.12`): dependencies present (`npm ci` in a disposable/clean worktree when needed) &#xE2;&#x2020;&#x2019; `npm run build` &#xE2;&#x2020;&#x2019; `npm test`. Capture a fresh full-suite baseline before the edit and require the final run to have 0 failures and no unexplained test-count regression; do not copy the historical 387-test count. `tests/auth-http.test.mjs` deliberately rejects a missing or stale build.
  - [x] Run `npx tsc --noEmit` clean and `npx eslint src tests`; lint must be no worse than the freshly measured clean-`main` baseline and must report **0** problems in files this story touches. The last verified clean-`main` lint count was 31, but measurement wins over prose.
  - [x] **Measure eslint on a clean checkout.** A round-3 review layer reported 14,559 problems; 14,528 came from an untracked agent worktree under `.claude/worktrees/` (`17-1:218-223`). The last verified clean-`main` count was 31; the fresh measurement is authoritative.
  - [x] `tests/public-repo-guard.test.mjs` **5/5** before committing, per `AGENTS.md` (freshly verified 2026-08-02). If the guard's own test count legitimately changes, require all of its current tests to pass rather than preserving five by deletion.
- [x] **Task 7 &#xE2;&#x20AC;&#x201D; update the artifacts this story makes stale (AC: none &#xE2;&#x20AC;&#x201D; process)**
  - [x] **In this change set:** update exactly the four `deferred-work.md` records whose `owner` is Story 17.8 and whose summaries name `DARK_VARIANT`, `LITERAL_OUTLINE_COLOUR`, the `className` props/call-site pair, and the edge-width transitive sweep. Mark each with the existing `resolved:` precedent; identify records by owner + summary, never by a line range. Do not resolve the adjacent Story 17.7 finding or the section heading.
  - [x] Update `sprint-status.yaml`: the `17-8-guard-criteria-encoding` row, the Epic 17 narrative that still says only 17.1 has a story file, the top `last_updated` comment and the YAML `last_updated` field. `AGENTS.md` names this file the tracking source of truth.
  - [x] Update both Story 17.8 status sites in `epics.md`: the Epic 17 summary and the Story 17.8 heading. Do not leave one at `ready-for-dev` while the other says `done`.
  - [x] **Not in this change set &#xE2;&#x20AC;&#x201D; hand it off, do not do it.** `ARCHITECTURE-SPINE.md` goes stale and a spine change routes through a `bmad-architecture` Update run. Name precisely what needs amending in its current closure-gate block (`:446-449`): the edge-sweep item in the *"six things"* enumeration, the `className` paragraph, and the `LITERAL_OUTLINE_COLOUR` paragraph. Require that Update run to re-resolve every `tests/theme-chrome.test.mjs` citation in the block after this implementation moves the file again. Preserve the remaining live ceilings and their existing owners &#xE2;&#x20AC;&#x201D; runtime-composed classes, CSS imports, the downward-only walk, the unasserted duplicate shell implementation, and the four-list derivation. `DARK_VARIANT` appears nowhere in the spine, so AC-5 makes nothing there stale.
  - [x] `EXPERIENCE.md` and `DESIGN.md` are **not** expected to change &#xE2;&#x20AC;&#x201D; this story alters no rendered output. If an AC-7 fix does change rendered output, that is a `bmad-ux` handoff: name it, do not perform it.

### Review Findings

- [x] [Review][Patch] Make the outline classifier reject zero-alpha, unresolved, and invalid colours while accepting the complete valid named-colour set and preserving `current` only when its resolved colour is visible [tests/theme-chrome.test.mjs:803]
- [x] [Review][Patch] Parse `dark` as a Tailwind variant segment so JavaScript properties and named group/peer modifiers do not false-positive [tests/theme-chrome.test.mjs:577]
- [x] [Review][Patch] Replace the unbounded `React.createElement` regex with a structural second-argument check covering `.ts` and `.tsx`, shorthand, quoted/computed keys, and spreads without scanning unrelated objects [tests/theme-chrome.test.mjs:1185]
- [x] [Review][Patch] Make closed-props index-signature and rest checks depth-aware, including optional mapped signatures, without rejecting nested dictionary types or nested object spreads [tests/theme-chrome.test.mjs:1367]
- [x] [Review][Patch] Keep the transitive edge sweep from treating type-only `borderWidth` declarations as painted runtime edges [tests/theme-chrome.test.mjs:696]
- [x] [Review][Patch] Record the required combined permissive-props injection with injected `tsc` result and the measured clean-checkout/final ESLint comparison [17-8-guard-criteria-encoding.md:152]

## Dev Notes

### Read before writing anything

- **`tests/theme-chrome.test.mjs`** &#xE2;&#x20AC;&#x201D; 2062 lines and 48 tests at validation time, the only implementation/test-code file this story modifies. **Read all of it.** Task 7 also updates three tracking artifacts. Its comments carry the reasoning for every guard and record what each one already tried and rejected.
- **Preserve the import barrier at `tests/theme-chrome.test.mjs:59-89`.** Dynamic imports use top-level `await` and must remain above the first `test()` declaration. Commit `910b869` fixed the CI-only race caused when tests began running against declarations still in their temporal dead zone. If the colour classifier needs a helper, prefer a synchronous local helper; do not introduce a mid-file awaited import.
- **`17-1-reachable-dark-mode.md`** &#xE2;&#x20AC;&#x201D; four rounds of review on this same file. Highest-value sections are the round-3 and round-4 pattern statements and the governing exception-list rule. Historical sections legitimately retain intermediate counts such as 43 tests; they are history, not the baseline. The shipped guard baseline is 48 tests and the pinned exception list has 18 entries.
- **`ARCHITECTURE-SPINE.md`** &#xE2;&#x2020;&#x2019; `AD-24` and the *Deferred* entry beginning *"AD-24's closure gate is a static source scan"* &#xE2;&#x20AC;&#x201D; the authority on what this gate does and does not enforce.
- **`deferred-work.md`** &#xE2;&#x2020;&#x2019; the `2026-08-01` heading and round 4's `DARK_VARIANT` entry.

### Current state of each site (re-verified 2026-08-02)

| Site | Current shape | Why it is narrow |
| --- | --- | --- |
| `:728-729` `LITERAL_OUTLINE_COLOUR` | 9-spelling negative lookahead, then `[a-z[(]`; **no `/g`**, `.test()` at `:755` | `[` is in the accept class, so every bracketed value passes; positive arbitrary colours are unproved |
| `:1074` `exportedPropsShape` | resolves named + composed local types, fails loudly otherwise | returns early at `:1083` for an inline annotation, and only ever greps `className` |
| `:942` call-site belt | `for (const file of allTsxFiles())` | never reads a `.ts` module; dual-extension idiom already at `:2023` |
| `:659`/`:661` `EDGE_UTILITY` | defined once, consumed once, roots-only | no extension-agnostic `projectedTree()` companion, unlike the token guard |
| `:565` `DARK_VARIANT` | `/(?<![\w:])dark:[a-z[-]/g`; `matchAll()` at `:572` | misses modifiers/stacks after `dark:` and any stack before it |

### What must be preserved

- **`SlideView` and `ArtifactSlide` take no `className` at all**, and that is a *compile* error rather than an assertion &#xE2;&#x20AC;&#x201D; stronger than anything this file tests. Both declare closed inline props today: `SlideView.tsx:18` is `{ slide }: { slide: SlidePlanItem }`; `ArtifactSlide.tsx:229-233` is `{ instance }: { instance: ArtifactInstance }`. **Neither has an index signature or a rest element, so AC-2 tightens with no product change.** Verify rather than assume.
- **All three projected focusables state `focus-visible:outline-white`** &#xE2;&#x20AC;&#x201D; `slideshow/page.tsx:104,110`, `SlideshowClient.tsx:72` &#xE2;&#x20AC;&#x201D; a colour and deliberately no width, because the UA supplies the width on `:focus-visible` and a width utility here would correctly trip the edge guard. `ProjectorClient` has **no focusable at all**, and that is now *enforced* by the sweep rather than defended in prose &#xE2;&#x20AC;&#x201D; do not reintroduce a file-level exemption for it.
- **The `>= 27` floor at `:914`** constrains count, not extension. Do not weaken it; floors are why two earlier narrowings were caught.
- The `fixed inset-0` precondition at `:1139` and the reference-counted shell-claim behaviour tests (`:1193` onward) are unrelated to this story. Leave them alone.

### Why all five are latent (so AC-7 should not fire)

Verified across `src/`: no `dark:!`, `dark:<digit>`, `dark:*` or stacked-before-`dark:` literal reaches a projected source; **no `.ts` file contains `className` at all**; no projected file uses a bracketed outline value or `outline-current`; and both projected component props remain closed. All 27 walked descendants are `.ts`, but that is not a safety argument: this repository already stores Tailwind class strings in `.ts` modules (`header-chrome.ts`). This story closes latent enforcement gaps rather than a shipped rendering bug.

### Regression surface

`theme-chrome.test.mjs` is the only suite that consumes these five constants, and it is already registered in `package.json`, so no new suite or test-script entry is needed. The real risk is **within** the file &#xE2;&#x20AC;&#x201D; `stripComments`, `walkJsx`, `openingTag`, `jsxTags`, `classNameValues` and `projectedTree()` are shared by four or more guards each. Changing a shared helper to serve one AC can move another guard silently; if you touch one, negative-test every guard that reads it.

### Project Structure Notes

Test-only by construction &#xE2;&#x20AC;&#x201D; no new tracked implementation files, dependencies, routes, or surfaces, so `EXPERIENCE.md`'s IA table and `DESIGN.md` are untouched. Task 4's temporary probe module must be removed after the injection test. This story changes no structural invariant: it strengthens an existing `AD`'s named gate, which is implementation of `AD-24` rather than a change to it, so it needs no spine amendment of its own &#xE2;&#x20AC;&#x201D; only the stale-entry handoff in Task 7.

### References

- [Source: `_bmad-output/implementation-artifacts/stories/17-1-reachable-dark-mode.md` &#xE2;&#x2020;&#x2019; the governing exception-list rule and the round-3 / round-4 pattern statements; intermediate test counts in its historical review record are not current baselines]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md` &#xE2;&#x2020;&#x2019; `AD-24`, and *Deferred* &#xE2;&#x2020;&#x2019; *"AD-24's closure gate is a static source scan"*]
- [Source: `_bmad-output/implementation-artifacts/deferred-work.md` &#xE2;&#x2020;&#x2019; *`bmad-architecture` Update run, 2026-08-01* and *Round 4 of the same review (2026-08-01)*]
- [Source: `_bmad-output/planning-artifacts/epics.md` &#xE2;&#x2020;&#x2019; Epic 17, incl. *"whatever an operator's theme, the projected output must be byte-identical"*; &#xC2;&#x1F1;7.7 for the two findings that are not this story's]
- [Source: `AGENTS.md` &#xE2;&#x2020;&#x2019; the BMad process gate (same-change-set artifact rules; spine amendments route through `bmad-architecture`) and the mandatory commit/push audit]

## Dev Agent Record

### Agent Model Used

GPT-5.6-terra (implementation); GPT-5.6-sol (three parallel review layers)

### Debug Log References

- Source-injection evidence (2026-08-02): 6 independent probes reacted under the focused suite and were all reverted: transparent outline; index signature; rest destructuring; .ts React.createElement call site; reachable .ts border-2 export; and dark: important variant. Controls remained green. The post-probe diff hash returned to the pre-probe value; the visible working-tree snapshot is the intended Story 17.8 change set.
- Code-review remediation evidence (2026-08-03): a seventh, combined injection added the permissive index signature, top-level `...rest` forwarding, and a `.ts` `React.createElement` caller carrying `className`. The injected tree passed `npx tsc --noEmit`, proving the leak compiled, while the fixed guard failed 2 of 54 tests (the direct-call belt and closed-props assertion). The probe was fully reverted; focused returned to 54/54 and the binary diff hash returned exactly to its pre-probe value. Seven injections, seven react — evidence for those seven injections, not a coverage claim.
- Current-shell full-suite attempt (2026-08-02): blocked by environment only. Node 24.18.0 cannot load the Node-22-built better-sqlite3 addon (ABI 137 requested, 127 present), and auth-http rejects the stale Node-22 build after reversible source probes changed mtimes. The focused guard suite and public-repo guard pass; the prior Node 22 verification remains recorded below.

- Node 22.23.2: focused `theme-chrome` baseline 48/48; final focused run 52/52.
- Node 22.23.2: `npm ci` &#xE2;&#x2020;&#x2019; `next build` &#xE2;&#x2020;&#x2019; `npm test` completed; suite 432 tests, 431 pass, 0 fail, 1 skipped. `tsc --noEmit` completed clean. The repository-wide ESLint run retains pre-existing findings under `src`; none were introduced in `tests/theme-chrome.test.mjs`.
- Code-review final (2026-08-03, current shell): focused `theme-chrome` 54/54, public-repo guard 5/5, `tsc --noEmit` clean, and touched-file ESLint 0. Clean detached `HEAD` and the final working tree both measured 15 errors + 16 warnings = 31 ESLint findings, so the review introduced none. The known Node 24 / Node-22 `better-sqlite3` ABI blocker still prevents a fresh full-suite rerun in this shell; the successful Node 22 run above remains the full-suite evidence.

### Completion Notes List

- Completed: replaced spelling-based dark and outline checks with segment/positive-colour rules, closed the props index/rest hole, extended the direct call-site belt to `.ts`, and added the transitive edge sweep.
- Recorded 7 source injections, all of which made the focused guard suite react; this is evidence for those probes, not a coverage claim.
- Closed all 6 code-review findings with structural TypeScript parsing where source regexes could not express the rule safely; Story 17.8 is complete.
- Resolved exactly the four Story 17.8 deferred-work records and synchronized epics and sprint tracking. The required bmad-architecture Update handoff is recorded; the spine itself was not edited in this story change set.

### File List

- tests/theme-chrome.test.mjs
- _bmad-output/implementation-artifacts/stories/17-8-guard-criteria-encoding.md
- _bmad-output/implementation-artifacts/deferred-work.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/planning-artifacts/epics.md

### Change Log

- 2026-08-02: Completed Story 17.8, recorded six source-injection probes, resolved its four deferred findings, synchronized tracking, and handed the stale AD-24 spine entry to bmad-architecture Update.
- 2026-08-03: Applied all six code-review patches, recorded the combined seventh injection and exact lint comparison, and closed Story 17.8.
