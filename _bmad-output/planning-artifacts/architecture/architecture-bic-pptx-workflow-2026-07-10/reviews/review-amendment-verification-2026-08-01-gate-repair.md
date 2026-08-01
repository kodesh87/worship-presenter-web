# Amendment Verification — 2026-08-01 gate-repair Update run

**Lens:** ad-hoc amendment verification, hostile to this run's own text.
**Subject:** the two passages the `bmad-architecture` Update run of 2026-08-01 wrote into
`_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md`,
both inside `## Deferred` — the rewritten AD-24 closure-gate ceiling bullet (`:393-395`, "PASSAGE 1")
and the rewritten sub-bullet **(ii)** under the AD-24 shell-gap entry (`:400`, "PASSAGE 2").

**Verdict: ACCEPT WITH REQUIRED EDITS.** Every line citation in both passages is correct, and
Passage 2 is the best-evidenced sentence in the entire bullet — I reproduced its measurement exactly.
Passage 1's *factual* claims about the shipped guard are almost all true. What fails is Passage 1's
*self-assessment*: the "four ceilings closed" tally is inflated by one, and the headline claim that
the list-widening pattern "broke in round 4" does not survive contact with round 4's own third patch,
which widened a list of spellings after the review explicitly offered the criterion as the alternative.
The passage's derived instruction — *"the roots are the last instance in this gate"* — is therefore
false, and it replaced a correctly-general standing warning with a narrower one.

---

## 0. Method and probe record

Baseline, shipped tree, no edits:

```
node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/theme-chrome.test.mjs
→ tests 48 / pass 48 / fail 0
```

**Passage-2 probe (performed, then reverted).** The two route shells were temporarily appended to
`FULL_SCREEN` (`tests/theme-chrome.test.mjs:1100`) and the suite re-run:

```
→ tests 52 / pass 48 / fail 4

✖ AC-4: src/app/services/[id]/present/projector/page.tsx neutralises the themed html/body shell
    AssertionError: … Call `useProjectedShell()`.   expected: /useProjectedShell\(\)/
✖ AC-4: src/app/services/[id]/slideshow/page.tsx neutralises the themed html/body shell
    AssertionError: … Call `useProjectedShell()`.   expected: /useProjectedShell\(\)/
✖ AC-4: src/app/services/[id]/present/projector/page.tsx sets its own text colour on every full-screen surface
    AssertionError: expected a default-exported function
✖ AC-4: src/app/services/[id]/slideshow/page.tsx sets its own text colour on every full-screen surface
    AssertionError: expected a default-exported function
```

Reverted with `git checkout -- tests/theme-chrome.test.mjs`; `git diff -- tests/theme-chrome.test.mjs`
is empty and `git status --short` shows only the two files that were already modified when this review
began (`.memlog.md`, `ARCHITECTURE-SPINE.md`). **No file was modified by this review except this report.**

**Tree-shape probe.** A standalone replica of `moduleImports` + the `projectedTree()` walk was run from
the scratchpad (outside the repo) against the shipped roots. Results in §1.

---

## 1. Passage 1 — claim-by-claim

| # | Claim | Verdict | Evidence |
|---|---|---|---|
| 1 | The `@/lib` directory exemption and `componentImports` are gone | **TRUE** | `grep -n componentImports tests/theme-chrome.test.mjs` → 4 hits, **all inside comments** (`:708`, `:823`, `:848`, `:850`); no function, no filter. No directory exemption exists in `moduleImports` (`:784-806`) or `projectedTree()` (`:825-842`). |
| 2 | `projectedTree()` at `:825` walks every extension | **MISLEADING — see F5** | `:825` is correct and the walk applies **no** extension filter. But it can only enqueue what `moduleImports` *resolves*, and that resolver is a four-candidate list at `:801` — `['.tsx','.ts','/index.tsx','/index.ts']`. "Every extension" is literally false. |
| 3 | A floor of 27 reached modules is asserted at `:881` | **TRUE, and exact** | `:881-886` asserts `walked.length >= 27`. Measured reach: **exactly 27** non-root modules (33 tree entries − 6 roots). The floor is tight, which is the strongest form. |
| 4 | `src/lib/projected-shell.ts` is among the reached modules | **TRUE** | Present in the measured 27, reached via `use-projected-shell.ts`. All 27 walked modules are `.ts`, matching the file's own comment at `:822`. |
| 5 | `moduleImports` at `:784` reads `export … from` **and** bare side-effect imports | **TRUE** | `:789` — `\b(?:import\|export)\s+(?!type\b)…\bfrom\s+…`; `:794` — `\bimport\s+["']([^"']+)["']`, commented "A bare side-effect import carries no `from` clause at all." |
| 6 | `exportedPropsShape` at `:1042` resolves a named props type's whole declaration through `;` or an `interface` body, and every locally-declared composed type, failing loudly otherwise | **TRUE** | `:1042-1078`. `typeDeclarationBody` (`:963-983`) scans to a depth-0 `;` for a `type` alias and returns the `interface` header **plus** its balanced block; `resolve()` recurses over every identifier surviving `withoutObjectLiterals` (`:1070-1073`); an unresolvable name hits `assert.notEqual(at, -1, …)` at `:1059`. |
| 7 | `React.ComponentProps<'div'>` is named in the failure message | **TRUE** | `:1065`. Traced: annotation `React.ComponentProps<'div'> & { … }` → `annotation.replace(/[^\w$].*$/s,'')` → `React` → not locally declared → loud failure carrying that exact string. |
| 8 | `themeReferences` is regexes over source, so a runtime-composed class is invisible | **TRUE** | `:535-542`, four `matchAll` calls over `TOKEN_UTILITY` / `TOKEN_SHORTHAND` / `TOKEN_CSS_VAR` / `DARK_VARIANT`. Nothing evaluates an expression. |
| 9 | No stylesheet is token-scanned; a `.css` specifier resolves to nothing in `moduleImports` | **TRUE** | `GLOBALS_CSS` is read at exactly one place, `:469`, for `--color-*` names only (other hits at `:45`, `:563`, `:636` are prose). `moduleImports`'s candidate list (`:801`) never produces a `.css` path, so the specifier is dropped by the `find`/`flatMap` at `:803-804`. |
| 10 | `globals.css:124-129` paints `body` with `bg-background` and reserves the gutter on `html` | **TRUE, exact range** | `124` `body {`, `125` `@apply bg-background text-foreground;`, `127` `html {`, `129` `scrollbar-gutter: stable;`. |
| 11 | The walk is downward-only | **TRUE** | `projectedTree()` follows `moduleImports` out of each file; nothing enumerates importers or parent segments. Stated in-file at `:855-857`. |
| 12 | `PROJECTED` is six entries at `:546`; `FULL_SCREEN` two at `:1100` | **TRUE but incomplete — see F4** | Both counts and both line numbers are right. `ROUTE_SHELLS` (`:740`) is a **third** hardcoded room-facing list and is not mentioned. |
| 13 | The token guard consumes `projectedTree()` at `:867`, the focusable sweep at `:718` | **TRUE** | `:867` `const walked = projectedTree().filter(…)`; `:718` `for (const { file } of projectedTree())`. One shared answer, two consumers, as claimed. |
| 14 | The suite "strips comments" | **TRUE** | `read = (rel) => stripComments(readRaw(rel))` at `:288`; every guard above reads through it. |
| 15 | The `exportedProps` "only while props stay declared inline" clause is retracted because patch P3 closed the composed-type spelling | **SUBSTANTIVELY TRUE** | The composed-type item is `17-1-reachable-dark-mode.md:356` (`&`/`extends` restores `className` with `tsc` clean, **high**, marked RESOLVED 2026-08-01). Verified against the shipped `exportedPropsShape`. The *label* "P3" is loose — round 4's decision item cites "patch item P3 below" (`:349`) and the owner's call cites "P3 above" (`:351`) — but the item it points at is unambiguous. |
| 16 | AD-24 already states the roots ceiling in its own rule clause and declines parity with AD-5 | **TRUE** | `ARCHITECTURE-SPINE.md:215`: *"these two sets have no structural anchor to compare themselves against and an unregistered surface is invisible to them … Both ceilings are recorded in Deferred; neither is a claim of parity with AD-5."* |

---

## 2. Passage 2 — claim-by-claim

| # | Claim | Verdict |
|---|---|---|
| 1 | `FULL_SCREEN` feeds exactly **two** loops | **TRUE** — `:1105` and `:1121`. The only other occurrences are prose (`:19`, `:1407`). |
| 2 | Adding the two route shells adds **four** tests and **all four fail** | **TRUE — reproduced.** 2 loops × 2 files = 4 new tests, 4 failures. |
| 3 | 48 green becomes **52 tests, 4 failures** | **TRUE — reproduced exactly.** `tests 52 / pass 48 / fail 4`. |
| 4 | The assertion at `:1105-1119` is `useProjectedShell()` | **TRUE, with a nit — see F6.** The cited range is the loop; it holds two assertions, a `fixed inset-0` precondition at `:1107` and the `/useProjectedShell\(\)/` match at `:1108-1117`. The precondition passes (both shells carry `fixed inset-0`), so the failure is the one named. |
| 5 | `exportedProps` at `:927` matches the literal string `export default function` | **TRUE** — `:928`, `source.indexOf('export default function')`. |
| 6 | Both shells are `export default async function` | **TRUE** — `projector/page.tsx:30`, `slideshow/page.tsx:31`. |
| 7 | The resulting message is *"expected a default-exported function"* | **TRUE — observed verbatim** in the probe output, twice. |
| 8 | That failure is loud rather than silent | **TRUE.** `assert.ok(at !== -1, …)` at `:929` throws. Verified safe at every current call site: `exportedPropsShape` reads two sync components, `exportedFunctionBody` reads the two `FULL_SCREEN` clients and the AC-3 pair — all `export default function`. |
| 9 | The gate cannot read stylesheets, so a CSS mechanism would be guaranteed by nothing | **TRUE** — see Passage 1 claim 9. |

**Passage 2 verdict: no defect.** It is measured rather than derived, it says so, it names the reason
(the sentence carried a wrong count twice before), and every number and message string reproduces. It
also correctly identifies a mechanism no prior round had named — the async-component reach — and
correctly classifies it as loud-not-silent. This is the standard the rest of the bullet should be held to.

---

## 3. Findings

### F1 — HIGH — "the pattern broke in round 4 … on both axes it touched" is false; round 4 widened a third list
`ARCHITECTURE-SPINE.md:395`; `tests/theme-chrome.test.mjs:697`; `17-1-reachable-dark-mode.md:358`

Passage 1's closing paragraph is the one place it argues *about itself*, and it is the weakest. It claims
round 4 encoded the criterion "on both axes it touched" and concludes: **"the roots are the last instance
in this gate, and widening that list is the widening to refuse."**

Round 4 touched a third list-shaped axis. Story item `:358` — *"The focus-ring guard accepts
`outline-transparent` and `outline-inherit`"* — offered two fixes in its own words: *"exclude the CSS-wide
keywords and `transparent`, **or match a positive colour vocabulary rather than a subtraction list**."*
Round 4 chose the first. `LITERAL_OUTLINE_COLOUR` went from a four-spelling subtraction list to a
**nine**-spelling subtraction list:

```js
/focus-visible:outline-(?!none\b|hidden\b|offset\b|transparent\b|inherit\b|initial\b|unset\b|revert\b|\d)[a-z[(]/
```

The doc comment above it (`:679-690`) states the diagnosis correctly — *"Excluding those four was still a
list of spellings rather than the criterion, and two more walked past it at 47/47 green"* — and then the
code adds five more spellings and groups them into two named buckets. Grouping a list is not encoding a
criterion. This is the exact pattern the passage says stopped, occurring in the round the passage credits
with stopping it, in the same file, after the review named the criterion option explicitly.

The consequence is not cosmetic. The passage converts its self-assessment into a **standing instruction**
for the next reader, and that instruction is now narrower than the evidence supports. The previous version
said *"treat the next list-widening as a signal to encode the criterion instead"* — general, and correct.
The new version scopes it to the roots alone.

**Required edit.** Either (a) drop "on both axes it touched" and the "last instance" scoping, keeping the
general instruction and recording that round 4 encoded the criterion on two axes *and widened a list on a
third*; or (b) keep the narrower scope only if `LITERAL_OUTLINE_COLOUR` is re-done as a positive
vocabulary first. Option (a) is the honest one and costs one sentence.

### F2 — HIGH — the widened subtraction list is already defeated, in the same direction, by the codebase's own idiom
`tests/theme-chrome.test.mjs:697`

Direct evidence for F1, and a live hole in its own right. Run against the shipped regex:

```
ACCEPTED   focus-visible:outline-[transparent]
ACCEPTED   focus-visible:outline-[inherit]
ACCEPTED   focus-visible:outline-[color:inherit]
rejected   focus-visible:outline-transparent
rejected   focus-visible:outline-inherit
```

The arbitrary-value spellings of the two spellings round 4 just patched pass the focus-ring guard. Neither
carries a theme-token name, so `TOKEN_UTILITY` / `TOKEN_SHORTHAND` / `TOKEN_CSS_VAR` do not catch them
either — `outline-[inherit]` takes its `outline-color` from `* { @apply outline-ring/50 }`, which is
precisely the leak the guard exists to stop. Arbitrary values are house idiom on these very surfaces
(`ProjectorClient`'s `bg-[#0B1220]`), and `EDGE_WIDTH` at `:597` already models the `[…]` form for widths
— so the vocabulary was available and was not applied here.

Not a defect *of the amendment*, but it is the counter-evidence that decides F1. It should be filed as a
patch item on the story rather than left in this report.

### F3 — HIGH — "Four ceilings this bullet previously recorded as live are closed" is a miscount; three is the number
`ARCHITECTURE-SPINE.md:393`

The previous version of this bullet recorded the `@/lib` exemption as **already closed**, in bold:

> **No directory is exempt by name any more** — the wholesale `@/lib` filter, and the `componentImports`
> function that held it, are both gone (round 2 of Story 17.1's review; `grep -c componentImports` → 0).

It is item #1 in the new passage's list of "four ceilings this bullet previously recorded as live". The
three genuinely moved from live to closed are the `.tsx`-only enqueue, `export … from` invisibility, and
the `exportedProps` inline-props clause. Inflating three to four is a small error with a bad shape: it
occurs in the sentence immediately after a parenthetical promising *"every claim re-measured"*, in a
paragraph whose stated purpose is that a reader should be able to trust which guarantees hold, and it
flatters the run doing the writing. Fix: `**Three ceilings … are closed**`, and move the `@/lib` sentence
into a clause that says it was already recorded closed and is restated for continuity.

### F4 — MEDIUM — "the roots are a list" undercounts the lists by one; `ROUTE_SHELLS` is a third
`ARCHITECTURE-SPINE.md:394`; `tests/theme-chrome.test.mjs:740`

The passage names `PROJECTED` (`:546`) and `FULL_SCREEN` (`:1100`). `ROUTE_SHELLS` (`:740`) is a third
hardcoded room-facing list, duplicating two of `PROJECTED`'s entries by hand, feeding the
"both room-facing failure branches can be scrolled" assertion. A new room-facing route shell must be added
to **three** places, not two, and the third is the one nobody would think to look for because it is
derivable from `PROJECTED` and is not.

The same undercount is inherited from `AD-24`'s rule clause (`:215`, *"**two** sets that must both be
maintained"*), so this is a two-line fix in two places, or one line if `ROUTE_SHELLS` is instead derived
from `PROJECTED` in the test. The latter is the option consistent with the paragraph's own thesis.

### F5 — MEDIUM — "walks every extension" is literally false, and the surviving list is the one that causes the CSS blindness named two sentences later
`ARCHITECTURE-SPINE.md:393`; `tests/theme-chrome.test.mjs:801`

`projectedTree()` applies no extension filter — that part is true and is the fix round 4 landed. But the
walk can only enqueue what `moduleImports` resolves, and resolution is a four-candidate list:
`['.tsx', '.ts', '/index.tsx', '/index.ts']`. `.js`, `.jsx`, `.mjs`, `.json` and `.css` all resolve to
nothing and are silently dropped. None exists under `src/` today, which makes this exactly the
*"true today and unenforced"* shape round 2 rejected for the `@/lib` exemption and round 4 rejected again
for the focusable file list.

It matters more than a wording nit because the passage's *next* paragraph names the CSS blindness as one
of the four live ceilings without connecting it to its cause: the `.css` specifier is dropped **by this
list**. Saying "walks every extension it can resolve, and resolution is still a four-entry list at `:801`
— which is why a `.css` import vanishes" makes the live ceiling and the surviving list one fact instead of
two, and supplies F1's argument in the passage's own voice.

### F6 — LOW — `:1105-1119` holds two assertions, not one
`ARCHITECTURE-SPINE.md:400`; `tests/theme-chrome.test.mjs:1105-1119`

Passage 2 says *"the assertion at `:1105-1119` is that every member calls `useProjectedShell()`"*. The
cited range is the loop, and it contains a `fixed inset-0` precondition at `:1107` before the
`useProjectedShell()` match at `:1108`. Immaterial to the measurement — the precondition passes for both
shells — but a reader adding a *non*-`fixed inset-0` surface to `FULL_SCREEN` will hit the other assertion
first and find the sentence does not describe it. One clause: "the operative assertion at `:1108`, behind a
`fixed inset-0` precondition at `:1107`".

### F7 — LOW — a stale line citation survives immediately beside the re-measured passage
`ARCHITECTURE-SPINE.md:396`, `:216`; `src/app/services/[id]/present/projector/page.tsx:85`

Not inside either passage, but inside the entry Passage 2 is a sub-bullet of, and inside this run's stated
scope (*"repair sub-bullet (ii)'s citation"*). Both `:396` and `AD-24`'s gap clause at `:216` cite
*"`projector/page.tsx:71` and `slideshow/page.tsx:88`, the `fixed inset-0` branches"*. `slideshow/page.tsx:88`
is correct. `projector/page.tsx:71` is a comment line; the `fixed inset-0` branch is at **`:85`**, moved by
round 3's scroll fix to that same file. A run that re-measured every citation in the two passages it
rewrote left a wrong one two lines above, in a sentence about the same two files.

---

## 4. Does either passage overclaim? Declare closed what is only narrowed?

**Passage 2: no.** It is measured, it says what it measured, and it reproduces.

**Passage 1: yes, in three places, all of them self-assessment rather than fact about the guard.**
F1 (the pattern claim and the "last instance" scoping), F3 (four-versus-three), F5 ("every extension").
None of them declares an *open* ceiling closed — the four ceilings the passage carries as live are all
genuinely live, and the four it declares closed are all genuinely closed. The overclaiming is about the
*run's own performance*, which is the failure mode this gate exists to catch and the one prior rounds
found in the amendments themselves.

On "closed vs narrowed" specifically, the one substantive risk was the `exportedProps` retraction, because
the owner's written instruction (`17-1-reachable-dark-mode.md:351`) said **narrow, do not delete**. The
retraction is nevertheless **correct**: the instruction was written before round 4's patch at `:356`
landed, that patch is marked RESOLVED, and I verified against the shipped `exportedPropsShape` that the
`&` / `extends` composed-type spelling now fails loudly. Passage 1 states this reasoning explicitly and
in the right place. **Departing from the owner's instruction was right and is properly justified.**

One residual the passage handles well and should keep: `exportedPropsShape` is fail-closed, not
all-seeing. A projected component whose props come from anywhere but its own file — including a legitimate
`React.ComponentProps` — now fails the guard rather than passing it. The passage says
*"anything the file does not declare fails **loudly**"*, which is the accurate framing.

## 5. Is anything MISSING that the previous version correctly warned about?

**One thing, and it is F1's other half.** The previous bullet closed with:
*"treat the next list-widening as a signal to encode the criterion instead"* — unscoped. The new bullet
narrows it to the roots. Given `LITERAL_OUTLINE_COLOUR` (F1/F2), `UTILITY_PREFIXES` (`:489`),
`EDGE_PATTERNS` (`:612`), `FOCUSABLE_TAG` (`:666`) and the extension-resolution list (`:801`), the general
form was the correct one and should be restored.

**Everything else previously warned about is accounted for.** Checked individually:

- runtime-composed class — carried, live, correct.
- theme token via a CSS file — carried, live, correct, and still the decision's own open gap.
- downward-only walk — carried, live, correct, still routed to Story 17.7.
- listed-files-only — carried, live, correct, and sharpened into "the roots are a list" (modulo F4).
- `.ts` enqueue ceiling and `use-projected-shell.ts → projected-shell.ts` as its sharpest instance —
  correctly retired; `projected-shell.ts` is in the measured 27.
- `export … from` invisibility — correctly retired.
- *"nine further ways it is narrower than it reads … all latent today"* — the nine round-3 items
  (`17-1-reachable-dark-mode.md:247-262`) are all `[x]`, as are all round-4 patch items
  (`:355-375`). The only open item in the story is the `[ ]` Decision at `:349`, which is the item
  commissioning this very Update run. Nothing live was dropped by compressing that sentence.
- *"the rebuild … 43 tests with 18 injected defects each confirmed to make it react"* — dropped. This was
  positive evidence for the guard, not a warning, and its loss is stylistic. Noted, not filed.

## 6. Required edits, in priority order

1. `:395` — drop "on both axes it touched" and "the roots are the last instance in this gate"; record that
   round 4 encoded the criterion twice **and widened a subtraction list once**; restore the unscoped form
   of the standing instruction. **(F1)**
2. `:393` — "Four ceilings" → "Three ceilings"; restate the `@/lib` closure as continuity rather than as
   newly closed. **(F3)**
3. `:394` and `:215` — add `ROUTE_SHELLS` (`:740`) as the third root list, or derive it in the test and say
   so. **(F4)**
4. `:393` — qualify "walks every extension" with the `:801` resolution list, and link it to the `.css`
   blindness named in the next paragraph. **(F5)**
5. `:400` — one clause naming the `fixed inset-0` precondition at `:1107`. **(F6)**
6. `:396` and `:216` — `projector/page.tsx:71` → `:85`. **(F7)**

## 7. Referred out of this gate

- **F2** — `focus-visible:outline-[transparent]` / `outline-[inherit]` pass `LITERAL_OUTLINE_COLOUR`
  (`tests/theme-chrome.test.mjs:697`) and carry no token, so nothing catches them. This is a code change
  and belongs on Story 17.1 as a round-5 patch item, or on 17.7 if 17.1 closes first. An architecture
  Update run does not patch test code, for the same reason recorded at `:402`.

## 8. Tree state at completion

`git status --short` shows only `.memlog.md` and `ARCHITECTURE-SPINE.md`, both already modified when this
review began. `tests/theme-chrome.test.mjs` is byte-identical to `HEAD`. No other file was touched.
