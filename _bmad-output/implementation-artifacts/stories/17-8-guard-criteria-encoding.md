# Story 17.8: The Guard Encodes Its Criteria, Not Its Spellings

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the maintainer of the one test `AD-24` names as its closure gate,
I want each of that gate's remaining narrownesses closed by stating the **rule** rather than by adding the next spelling to a list,
so that the guarantee AC-4 rests on — the congregation never sees operator chrome — stops needing a fifth review round to discover a fifth spelling.

## The rule this story exists to apply

Story 17.1 wrote it down after four rounds of review found the same shape four times. Quote it in the diff:

> Where a list remains it is an **exception** list that fails closed, not a scope list that fails open.
> — `17-1-reachable-dark-mode.md:788`

**If your fix names a spelling, it is the wrong fix.** Ask what property must hold, then assert that. For AC-1 the property is *the outline names a colour*; for AC-2 it is *the props are a closed set of locally-declared fields*.

## Scope: four filed findings, five ACs

The four findings that had **no owner** after code-review round 4 and the 2026-08-01 `bmad-architecture` Update run, now assigned to this story in `deferred-work.md`. They become **five** ACs because one filed finding (`deferred-work.md:242-245`) covers two independent mechanisms and splits into AC-2 and AC-3.

**Out of scope — Story 17.7 owns these, and one of them touches a function you are editing:**

| Not yours | Where | Why it matters to you |
| --- | --- | --- |
| Deriving the four room-facing lists from one source | `PROJECTED:546`, `ROUTE_SHELLS:740`, `FULL_SCREEN:1100`, inline pair `:1087` | 17.7's route segment is the first value they *could* derive from. Do not start it. |
| `exportedProps` cannot read `export default async function` | `:927-929` | **This is inside the function AC-2 edits.** Leave the `assert.ok(at !== -1)` loud failure exactly as it is; do not "fix" it in passing. |

## Acceptance Criteria

1. **The focus-ring guard recognises a colour instead of excluding non-colours.** `LITERAL_OUTLINE_COLOUR` (const at `:696`, regex at `:697`) is a nine-spelling negative lookahead followed by `[a-z[(]` — and `[` is in the accept class, so every bracketed value passes. Verified against the shipped regex: **accepted today** are `outline-[transparent]`, `outline-[inherit]`, `outline-[color:inherit]`, `outline-[revert]`, `outline-[unset]`, `outline-[initial]`, and `outline-[--ring]`. The last is the sharpest: it is a *theme token reference* that no token guard catches either, because `TOKEN_SHORTHAND` (`:516`) matches only the paren form `outline-(--ring)` and `TOKEN_CSS_VAR` (`:522`) requires a literal `var(`. All must be rejected. **The load-bearing requirement, which no list can satisfy: classify the bracket contents.** A colour is a hex value, a colour function, or a named colour; a CSS-wide keyword, `transparent`, and a bare custom-property reference are not.
2. **The `className` props guard asserts a closed shape, not the absence of a word.** `exportedPropsShape` (`:1042`) currently greps the resolved props text for `className`. An inline **index signature** defeats it: `{ slide: SlidePlanItem; [key: string]: unknown }` makes `propsAnnotation` return a string starting with `{`, so the function returns early at `:1051`, the text contains no `className`, and a caller's `className="bg-card"` compiles onto the wrapper the congregation sees. Assert the shape is a **closed object literal** — no index signature, no rest element — in addition to the existing checks.
3. **The call-site belt reaches a `.ts` call site.** The loop is `for (const file of allTsxFiles())` at **`:910`**, so `React.createElement(SlideView, { slide, className: 'bg-card' })` from a `.ts` module is invisible — and a `.ts` call site is one of the four cases the guard's own comment (`:1081-1086`) gives as its reason for existing.
4. **The edge-width guard sweeps the projected tree, not only its roots.** `EDGE_UTILITY` (defined `:627`) is consumed at `:631` and **nowhere else**, inside `for (const file of PROJECTED)`. The token guard pairs its roots-only loop (`:644`) with a `projectedTree()` sweep (`:867`); the focusable guard sweeps the tree (`:718`). The edge guard has no companion, so a `.tsx` reachable from a projected client is token-scanned and focus-scanned and **not** edge-scanned — a `border-2` in it inherits `border-border` from the universal selector and changes with the operator's theme on the room-facing screen, suite green.
5. **`DARK_VARIANT` matches every spelling of the variant it claims to cover.** `DARK_VARIANT` is at **`:533`** — `/(?<![\w:])dark:[a-z[-]/g` — and requires a lowercase letter, `[` or `-` after the colon, so `dark:!bg-zinc-900`, `dark:2xl:bg-zinc-900` and `dark:*:bg-zinc-900` all fall outside it. A `dark:` class naming a *token* is still caught by `TOKEN_UTILITY`, so the live hole is narrow and real: a `dark:` variant painting a **literal** colour on a projected surface, which makes that surface theme-dependent while every token guard stays green.
6. **Each change is negative-tested with a matching control, and the evidence is recorded honestly.** Per AC: inject the defect, observe the suite **green**, apply the fix, observe the suite **fail**, add a control that must stay green, revert, confirm `git status --short` clean. Record as *"N injections, N react"* and state explicitly that this is **a property of those N injections, not a coverage claim** — round 2 and round 4 both had to correct that exact overreach (`17-1:379`).
7. **A tightened guard that fails on correct code means the guard is wrong — and that has happened five times in this file.** Do not resolve such a failure by exempting the file. Precedents: root-only AC-3 failed on `SlideGridDialog`, whose `<Dialog>` is an unclassed context provider (the *rule* was wrong — it became *outermost classed*); the next AC-3 tightening then false-failed on the `<DialogTitle className="sr-only">` shadcn's accessibility guidance asks for (resolved by descending the single-element chain and **reporting ambiguity instead of guessing**); the first `className` assertion failed on both projected files, which legitimately set `className` on their own elements; `jsxReturnBranches` false-positived a `Caption` helper; and one prescribed widening was outright **unsatisfiable**. When a guard fails on correct code, fix the rule or report ambiguity. When it fails on genuinely wrong code, fix the source. **Adding an exemption to make a tightened guard pass is the failure this story exists to end.**
8. **`outline-current` stays allowed, deliberately.** `:690-695` records the decision: it resolves to the element's own `color`, which on these surfaces is the literal `text-white` the root guard pins, and a theme-token `color` cannot reach here because the token guard rejects it. A naive positive vocabulary rejects `current` — and **no projected file uses it, so no test would fail and the decision would be deleted silently.** Keep it, and keep the comment.

## Tasks / Subtasks

- [ ] **Task 1 — colour classification for the focus ring (AC: 1, 6, 8)**
  - [ ] Rewrite `LITERAL_OUTLINE_COLOUR` (`:696-697`) to classify what follows `focus-visible:outline-`. Bare and bracketed spellings must be classified by the **same** rule, since that asymmetry is the current defect.
  - [ ] **`EDGE_WIDTH` (`:597`) is a bracket *parser*, not a classifier** — it is `(?:\d+|\[[^\]\s"'\`]+\])`, an opaque any-blob matcher. Read it for how the file handles `[…]` syntax; **do not** reuse it as the accept rule, because it cannot tell `[#fff]` from `[transparent]`. An earlier draft of this task said to reuse it and that instruction was self-contradictory.
  - [ ] **Keep the regex un-flagged.** `LITERAL_OUTLINE_COLOUR` has no `/g` and is consumed by `.test(tag)` inside a loop at `:723`. Adding `/g` makes `.test()` stateful through `lastIndex` and produces intermittent phantom offenders.
  - [ ] Negative-test all seven accepted spellings in AC-1. Controls that must stay green: `focus-visible:outline-white` (all three shipped focusables) and `focus-visible:outline-current` per AC-8.
- [ ] **Task 2 — closed props shape (AC: 2, 6, 7)**
  - [ ] In `exportedPropsShape` (`:1042`), reject an index signature (`[key: string]:`, `[k: number]:`) and a rest element in the destructuring pattern, alongside the existing `className` check and the existing loud failure on non-local types.
  - [ ] Keep the loud-failure behaviour and message: *a guard that cannot read the shape it asserts about must say so rather than pass* (`17-1:254`).
  - [ ] Do not touch `exportedProps`'s `export default function` literal at `:927-929` — that ceiling is Story 17.7's, and it fails loudly, so it is safe where it is applied.
  - [ ] Negative-test: `{ slide: SlidePlanItem; [key: string]: unknown }` with `{...rest}` on the wrapper. **Run `npx tsc --noEmit` on the injected version** to prove it really compiled — that is what makes it a hole rather than a typo.
- [ ] **Task 3 — call-site belt reaches `.ts` (AC: 3, 6)**
  - [ ] Widen the loop at **`:910`**. The file's own dual-extension idiom already exists at **`:1988`**: `for (const file of [...allTsxFiles(), ...allTsFiles()])`. `allTsFiles` is declared at `:341`.
  - [ ] A `.ts` file has no JSX, so the check there is an identifier reference rather than a tag: flag `React.createElement(SlideView, …)` and any object literal passing `className` to either component.
  - [ ] **Require a word boundary.** `src/lib/pptx.ts:321,552` declare and call `renderArtifactSlide` — a substring match on `ArtifactSlide` hits it twice. The file's idiom is `(?<![-\w])` / `\b`; the belt itself uses `/^<(SlideView|ArtifactSlide)\b/` at `:912`.
  - [ ] Negative-test with a `.ts` module calling `React.createElement(SlideView, { slide, className: 'bg-card' })`. Control: a `.ts` module mentioning `renderArtifactSlide` must stay green.
- [ ] **Task 4 — edge guard sweeps the tree (AC: 4, 6)**
  - [ ] Add a `projectedTree()` sweep for `EDGE_UTILITY`, filtered to `.tsx`. **Mirror `:867`, not `:718`** — `:867` filters `via !== null` because it is paired with a roots-only loop, which is exactly your situation. `:718` does not filter, so copying it while keeping `:629` double-reports every offender in the six roots.
  - [ ] Keep the roots-only loop at `:629`; the token guard keeps both and that is the established pattern.
  - [ ] **The obvious negative test proves nothing.** All 27 walked modules are `.ts` today (`:820-823`), so `projectedTree()` filtered to `.tsx` is *exactly* `PROJECTED` — injecting `border-2` into an existing projected file is caught by `:629` and yields false evidence that the new sweep works. The injection must **create a new `.tsx` component carrying `border-2` and import it into `SlideshowClient`**, then be fully removed.
- [ ] **Task 5 — `DARK_VARIANT` (AC: 5, 6)**
  - [ ] Widen `DARK_VARIANT` at **`:533`** to cover the important suffix, a stacked variant and the child selector.
  - [ ] **Reuse `DARK_VARIANT_CHAIN` (`:1921`)** — `dark:(?:[a-z0-9-]+:)*`, already in this file and already documented as tolerating `dark:` anywhere in a stacked chain. It is the right exemplar. (`EDGE_END` is **not**: its `!` is an end delimiter, the opposite position from `dark:!bg-…` where `!` precedes the utility.)
  - [ ] **Keep the `/g` flag.** `DARK_VARIANT` is consumed by `source.matchAll()` at `:540`; a non-global regex there throws `TypeError`, which surfaces as opaque cascading failures across every token test rather than as an assertion.
  - [ ] Negative-test `dark:!bg-zinc-900`, `dark:2xl:bg-zinc-900`, `dark:*:bg-zinc-900`; controls: `dark:bg-zinc-900` still fails, a non-`dark:` literal still passes.
- [ ] **Task 6 — verification (AC: 6, 7)**
  - [ ] `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/theme-chrome.test.mjs` — baseline **48/48**, 0 fail.
  - [ ] `npm test` (baseline **387 tests / 386 pass / 0 fail / 1 skipped**), `npx tsc --noEmit` clean, `npx eslint src tests` no worse than **31 problems (15 errors, 16 warnings)** and **0** in any file you touch.
  - [ ] **Measure eslint on a clean checkout.** A round-3 review layer reported 14,559 problems; 14,528 came from an untracked agent worktree under `.claude/worktrees/` (`17-1:218-223`). 31 is the correct figure.
  - [ ] `tests/public-repo-guard.test.mjs` 4/4 before committing, per `AGENTS.md`.
- [ ] **Task 7 — update the artifacts this story makes stale (AC: none — process)**
  - [ ] **In this change set:** `deferred-work.md:229-232, 238-241, 242-245, 246-249` (these four findings → resolved); `sprint-status.yaml`'s `17-8-guard-criteria-encoding` row; `epics.md`'s Story 17.8 status tag. `AGENTS.md` names `sprint-status.yaml` the tracking source of truth.
  - [ ] **Not in this change set — hand it off, do not do it.** `ARCHITECTURE-SPINE.md` goes stale and a spine change routes through a `bmad-architecture` Update run. Three workflows have declined to substitute for that gate; do not be the first to break the precedent. **Name precisely what needs amending** so that run does not rediscover it: the *"six things"* enumeration's **#4** (the edge-guard sweep), the whole `className` paragraph at `:394` (the index-signature and `.tsx`-belt spellings it records as live), and the `LITERAL_OUTLINE_COLOUR` sentences at `:396`. **Ceilings 1, 2 and 6 stay live and are not yours** — 1 is runtime-composed class names, 2 is the CSS-file route, 6 is the four-list derivation (17.7's). `DARK_VARIANT` appears nowhere in the spine, so AC-5 makes nothing there stale.
  - [ ] `EXPERIENCE.md` and `DESIGN.md` are **not** expected to change — this story alters no rendered output. If an AC-7 fix does change rendered output, that is a `bmad-ux` handoff: name it, do not perform it.

## Dev Notes

### Read before writing anything

- **`tests/theme-chrome.test.mjs`** — 2027 lines, 48 tests, the only file this story modifies. **Read all of it.** Its comments carry the reasoning for every guard and record what each one already tried and rejected; four of the five tasks are anticipated in them.
- **`17-1-reachable-dark-mode.md`** — four rounds of review on this same file. Highest-value sections: the round-3 pattern statement (`:228-235`), the round-4 one (`:303-313`), and `:788`'s governing rule. **Two numbers in it are stale — do not copy them:** its Completion Notes still say *"43 tests"* (`:665`; the file is at 48) and three sites still say *"20 pinned exceptions"* (`:591`, `:593`, `:1097`; corrected to **18** at `:375`).
- **`ARCHITECTURE-SPINE.md`** → `AD-24` and the *Deferred* entry beginning *"AD-24's closure gate is a static source scan"* — the authority on what this gate does and does not enforce.
- **`deferred-work.md`** → the `2026-08-01` heading and round 4's `DARK_VARIANT` entry.

### Current state of each site (verified 2026-08-01)

| Site | Current shape | Why it is narrow |
| --- | --- | --- |
| `:696-697` `LITERAL_OUTLINE_COLOUR` | 9-spelling negative lookahead, then `[a-z[(]`; **no `/g`**, `.test()` at `:723` | `[` is in the accept class, so every bracketed value passes |
| `:1042` `exportedPropsShape` | resolves named + composed local types, fails loudly otherwise | returns early at `:1051` for an inline annotation, and only ever greps `className` |
| `:910` call-site belt | `for (const file of allTsxFiles())` | never reads a `.ts` module; dual-extension idiom already at `:1988` |
| `:627`/`:631` `EDGE_UTILITY` | defined once, consumed once, roots-only | no `projectedTree()` companion, unlike the token and focusable guards |
| `:533` `DARK_VARIANT` | `/(?<![\w:])dark:[a-z[-]/g`; `matchAll()` at `:540` | `!`, a digit and `*` are outside the character class |

### What must be preserved

- **`SlideView` and `ArtifactSlide` take no `className` at all**, and that is a *compile* error rather than an assertion — stronger than anything this file tests. Both declare closed inline props today: `SlideView.tsx:18` is `{ slide }: { slide: SlidePlanItem }`; `ArtifactSlide.tsx:229-233` is `{ instance }: { instance: ArtifactInstance }`. **Neither has an index signature or a rest element, so AC-2 tightens with no product change.** Verify rather than assume.
- **All three projected focusables state `focus-visible:outline-white`** — `slideshow/page.tsx:104,110`, `SlideshowClient.tsx:72` — a colour and deliberately no width, because the UA supplies the width on `:focus-visible` and a width utility here would correctly trip the edge guard. `ProjectorClient` has **no focusable at all**, and that is now *enforced* by the sweep rather than defended in prose — do not reintroduce a file-level exemption for it.
- **The `>= 27` floor at `:882`** constrains count, not extension. Do not weaken it; floors are why two earlier narrowings were caught.
- The `fixed inset-0` precondition at `:1107` and the reference-counted shell-claim behaviour tests (`:1161` onward) are unrelated to this story. Leave them alone.

### Why all five are latent (so AC-7 should not fire)

Verified across `src/`: no `dark:!`, `dark:<digit>` or `dark:*` anywhere; **no `.ts` file contains `className` at all**; no projected file uses a bracketed outline value or `outline-current`; all 27 walked modules are `.ts` and carry no JSX. This story closes the gap between what the guard asserts and what it reads as asserting — it is not a bug fix.

### Regression surface

`theme-chrome.test.mjs` is self-contained: no other test file or script consumes any of these five constants, and `package.json:10` lists only the file itself, so cross-test regression risk is nil and no new `test` entry is needed. The real risk is **within** the file — `stripComments`, `walkJsx`, `openingTag`, `jsxTags`, `classNameValues` and `projectedTree()` are shared by four or more guards each. Changing a shared helper to serve one AC can move another guard silently; if you touch one, negative-test every guard that reads it.

### Project Structure Notes

Test-only by construction — no new files, no dependencies, no route or surface change, so `EXPERIENCE.md`'s IA table and `DESIGN.md` are untouched. This story changes no structural invariant: it strengthens an existing `AD`'s named gate, which is implementation of `AD-24` rather than a change to it, so it needs no spine amendment of its own — only the stale-entry handoff in Task 7.

### References

- [Source: `_bmad-output/implementation-artifacts/stories/17-1-reachable-dark-mode.md:788` → the governing exception-list rule; `:228-235` and `:303-313` → the pattern statements; `:665`, `:591`, `:593`, `:1097` → the two stale numbers not to copy]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md` → `AD-24`, and *Deferred* → *"AD-24's closure gate is a static source scan"*]
- [Source: `_bmad-output/implementation-artifacts/deferred-work.md` → *`bmad-architecture` Update run, 2026-08-01* and *Round 4 of the same review (2026-08-01)*]
- [Source: `_bmad-output/planning-artifacts/epics.md` → Epic 17, incl. *"whatever an operator's theme, the projected output must be byte-identical"*; §17.7 for the two findings that are not this story's]
- [Source: `AGENTS.md` → the BMad process gate (same-change-set artifact rules; spine amendments route through `bmad-architecture`) and the mandatory commit/push audit]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
