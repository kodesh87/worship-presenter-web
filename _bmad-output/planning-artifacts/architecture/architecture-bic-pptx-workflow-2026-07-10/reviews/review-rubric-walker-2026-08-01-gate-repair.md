# Reviewer Gate — RUBRIC WALKER lens

**Target:** `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md`
**Run:** `bmad-architecture` Update, 2026-08-01 — two edits inside `## Deferred`, both about AD-24's closure gate.
**Date:** 2026-08-01
**Method:** every load-bearing claim in the two edited passages re-measured against the repository. Nothing below is taken from the prose.

---

## Verdict

**Return for repair.** The two edits are the most accurately measured passages in this file — I could not falsify a single one of their factual claims about `tests/theme-chrome.test.mjs`, and I checked them all, including the test count, the 27-module floor and the four-failure prediction. What fails is not measurement. It is that the rewritten bullet issues a standing instruction (**refuse the next root-list widening**) that the *same run's other edit*, and AD-24's own ratified paragraph, both direct Story 17.7 to violate; that its central new claim — *the roots are `PROJECTED` and `FULL_SCREEN`* — undercounts the roots the code actually has; and that the axis it declares closed ("the reach") is still open on the one guard it did not check.

---

## Scope of verification

Everything cited below was read or executed:

| Artefact | What was done |
| --- | --- |
| `tests/theme-chrome.test.mjs` (2027 lines) | read in full across the cited regions; suite executed |
| suite run | `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/theme-chrome.test.mjs` → **tests 48, pass 48, fail 0** |
| projected-tree walk | `moduleImports`/`projectedTree` logic re-implemented in a scratchpad script and run against the repo → **27 walked non-root modules, 0 of them `.tsx`, `src/lib/projected-shell.ts` present** |
| `src/lib/projected-shell.ts`, `src/lib/use-projected-shell.ts` | read in full |
| `src/app/globals.css`, `src/components/SlideView.tsx`, `src/components/artifacts/ArtifactSlide.tsx` | read |
| `src/app/services/[id]/present/projector/page.tsx`, `src/app/services/[id]/slideshow/page.tsx` | read in full |
| `git diff` of the working tree | used to establish exactly what the two edits changed against the committed text |

The two edits are **uncommitted working-tree changes** on `review/17-1-code-review-rounds-3-4` (`git status`: `M ARCHITECTURE-SPINE.md`, `M .memlog.md`), on top of `100f76a docs: ratify AD-24's inline edits, and fix the reason the gate refuted`.

---

## What the edits get right (recorded first, because it is most of them)

A gate review that only lists faults would mislead the next reader about where this document stands. Every one of the following was independently confirmed:

1. **"48 green"** — the suite runs 48 tests, 48 pass, 0 fail. Exact.
2. **The four-failure prediction is structurally sound**, without needing the probe re-run. `FULL_SCREEN` (`tests/theme-chrome.test.mjs:1100`) feeds two `for` loops (`:1105`, `:1121`) → adding two files adds four tests. Loop 1 asserts `/useProjectedShell\(\)/` (`:1110`); neither route shell contains it. Loop 2 → `jsxReturnBranches` (`:1422`) → `exportedFunctionBody` (`:1416`) → `exportedProps` (`:927`), which does `source.indexOf('export default function')` and asserts `!== -1` with the message *"expected a default-exported function"*; both shells are `export default async function` (`src/app/services/[id]/present/projector/page.tsx:30`, `src/app/services/[id]/slideshow/page.tsx:31`). Four failures, two mechanisms, exactly as (ii) states. The claim that the second mechanism fails **loudly** is also correct — it is an `assert.ok`, not a silent skip.
3. **The 27-module floor is real and tight.** `assert.ok(walked.length >= 27)` at `:881`. Measured today: exactly 27 walked non-root modules. `src/lib/projected-shell.ts` is among them, reached `SlideshowClient/ProjectorClient → @/lib/use-projected-shell → ./projected-shell`.
4. **`componentImports` and the `@/lib` directory exemption are gone.** Zero occurrences in the suite.
5. **`moduleImports` (`:784`) does read `export … from` (`:789`) and bare side-effect imports (`:794`)**, and resolves `.` / `@/` specifiers through `.tsx`, `.ts`, `/index.tsx`, `/index.ts`.
6. **`exportedPropsShape` (`:1042`) does what the edit says** — resolves the parameter list, follows a named annotation to its local `type`/`interface` declaration through `typeDeclarationBody` (`:963`, terminating `;` or `interface` body, not merely the first balanced block), recurses through composed members via `withoutObjectLiterals` (`:989`), and fails loudly on anything not locally declared with `React.ComponentProps<'div'>` named in the message (`:1065`).
7. **`SlideView` and `ArtifactSlide` accept no `className`.** `src/components/SlideView.tsx:18` is `({ slide }: { slide: SlidePlanItem })`.
8. **`globals.css:124-129` is precisely the shape claimed** — `body { @apply bg-background text-foreground }` at `:124-126`, `html { … scrollbar-gutter: stable }` at `:127-129`.
9. **The CSS blindness is real.** `globals.css` is read exactly once, via `readRaw(GLOBALS_CSS)` at `:469`, to harvest `--color-*` names. A `.css` specifier resolves to none of `moduleImports`' four candidates and is dropped. No stylesheet is token-scanned.
10. **(iii) is true.** `src/lib/projected-shell.ts:35-36` says *"a Server-Component layout can reach it without a hook"* — false, and it does sit two lines below the correct reasoning. (The spine cites `:34-36`; the sentence begins on `:35`. Immaterial.)
11. **(iv) is true.** `claimProjectedShell` (`src/lib/projected-shell.ts:89`) touches `doc` only inside the `claims === 0` block (`:91-103`); a second claim against a different document gets neither reset nor a working restore.
12. **`projectedTree()` is genuinely shared** by the token closure guard (`:867`) and the focusable sweep (`:718`).

Against the checklist item *"does it ratify rather than contradict the brownfield codebase"*, the edits pass on facts. The findings below are about coherence, completeness of enumeration, and one instruction that cannot be obeyed.

---

## Findings

### F1 — CRITICAL/HIGH: the spine now forbids, and mandates, the same change

`ARCHITECTURE-SPINE.md:395` (new text, third paragraph of the rewritten bullet):

> The instruction stands and its scope is narrower: **the roots are the last instance in this gate, and widening that list is the widening to refuse.**

`ARCHITECTURE-SPINE.md:400` (the *other* edit from the same run, five lines below):

> Whatever mechanism 17.7 lands becomes the thing asserted, **the set it applies to widens to the route group**, and the async-component reach is part of the same change set.

`ARCHITECTURE-SPINE.md:218` (AD-24, ratified by the 2026-07-31 Update run, therefore carrying this file's authority):

> The owner chose the route-group layout on 2026-07-31 — one layout owning every room-facing URL, **with `FULL_SCREEN` widened to it** — from the three candidates in *Deferred*.

`FULL_SCREEN` is one of the two lists the new text names as *the roots*. So the spine simultaneously (a) instructs the next reviewer to **refuse** a widening of the root list and (b) records, as the owner's ratified choice, a story whose design **is** a widening of the root list. A reviewer of Story 17.7 cannot satisfy both, and neither clause is subordinated to the other.

This is not a wording quibble, because the rewritten bullet's entire warrant is that the *pattern* — closing a too-narrow rule by widening a list — is a spine-altitude failure mode. Having promoted it, the document then charters an instance of it and does not say why that instance is exempt.

There is a defensible resolution and the spine does not state it: a route-group layout is arguably the *structural encoding* rather than a list-widening, because every page under the group inherits it and no registration step exists to forget. If that is the reading, say it — the entry should read *"widening `FULL_SCREEN` to a route-group layout is the encoding, not the widening; what must be refused is adding another leaf file to either list."* As written, the two clauses are flatly opposed.

**Second-order problem in the same finding: the harder root list has no owner.** 17.7 touches `FULL_SCREEN`. Nothing in the spine assigns anyone the `PROJECTED` list (`tests/theme-chrome.test.mjs:546`), which is the root set for the token, edge and closure guards and the one that "declines parity with AD-5's matcher assertion". The bullet names the roots as *the last instance* and *the widening to refuse* without naming who encodes the criterion. AD-24:218 states the principle this violates in its own voice: *"a partial tag with no owner is a dead end."*

**Repair:** decide whether 17.7's route-group widening is the encoding or the last exception; say which in both places; and either assign the `PROJECTED` criterion to a story or record explicitly that it is accepted as permanent, with the reason.

---

### F2 — HIGH: "the roots are a list … `PROJECTED` and `FULL_SCREEN`" undercounts the roots

`ARCHITECTURE-SPINE.md:394`:

> **the roots are a list.** `PROJECTED` (six entries, `:546`) and `FULL_SCREEN` (two, `:1100`) are hardcoded…

and AD-24's rule text, `ARCHITECTURE-SPINE.md:215`:

> `tests/theme-chrome.test.mjs` is the gate, with **two** sets that must both be maintained … so a new room-facing surface joins whichever of them applies **in the same change set**

The gate has **at least four** hardcoded file lists, three of which enumerate room-facing or projected surfaces:

| Line | Constant | Contents | Guards fed |
| --- | --- | --- | --- |
| `tests/theme-chrome.test.mjs:546` | `PROJECTED` | 6 files | edge-width (`:629`), token (`:644`), roots of `projectedTree()` |
| `tests/theme-chrome.test.mjs:740` | **`ROUTE_SHELLS`** | the 2 route shells | *"the room-facing failure branches can both be scrolled"* (`:745`) |
| `tests/theme-chrome.test.mjs:1100` | `FULL_SCREEN` | 2 client surfaces | shell reset (`:1105`), branch-root text colour (`:1121`) |
| `tests/theme-chrome.test.mjs:1087` | inline pair | `SlideView`, `ArtifactSlide` | the `className` props guard |

`ROUTE_SHELLS` is the concrete cost. An implementer who follows AD-24:215 to the letter — join `PROJECTED`, join `FULL_SCREEN` — registers a new room-facing failure branch in both named sets and still misses the scroll guard at `:745-772`, whose own comment records that the two existing branches *"diverged immediately after a change set declared them one failure"*. That is the same class of omission the bullet says is the last one left, occurring in a list the bullet does not know about.

The inline pair at `:1087` is a fourth. It duplicates `PROJECTED[0..1]`, so a third projected component would be token-guarded and not props-guarded.

**Repair:** enumerate the actual root sets in AD-24:215 and in the Deferred bullet, or — better, and consistent with the bullet's own stated principle — collapse `ROUTE_SHELLS` and the inline pair into derivations of `PROJECTED` so there is one registration point to forget rather than four.

---

### F3 — HIGH: the "reach" ceiling the edit declares closed is still open on the edge-width guard

`ARCHITECTURE-SPINE.md:393-395` frames the whole rewrite as *"its remaining ceiling is now the **roots** rather than the reach"*, and credits round 4 with encoding the criterion *"on both axes it touched"*, citing `projectedTree()` as **one** shared answer to *what is projected*.

Measured: `projectedTree()` is consumed by **two** of the four projected-surface guards.

- Token closure guard — `projectedTree()` at `:867`. Covers the walked tree.
- Focusable sweep — `projectedTree()` at `:718`. Covers the walked tree.
- Per-root token guard — `for (const file of PROJECTED)` at `:644`. Roots only, which together with `:867` gives complete token coverage.
- **Edge-width guard — `for (const file of PROJECTED)` at `:629`, and `EDGE_UTILITY` is consumed at `:631` and nowhere else in the file.** Roots only, with no companion sweep over the walked tree.

So a `.tsx` component reachable from a projected client — the `ExitBar.tsx` scenario the suite's own comment at `:816-819` uses to justify the focusable sweep — is token-scanned and focus-scanned and **not edge-scanned**. A `border-2` in it inherits `border-border` from the universal selector at `globals.css:121-123` and paints `#e5e5e5` light against `oklch(1 0 0 / 10%)` dark, on the room-facing screen, with the suite green. That is verbatim the AC-4 hazard the edge guard exists for, on the axis the edit says was closed.

Latent today, and only latent: all 27 walked modules are `.ts` (measured), and a `.ts` module carries no JSX. But *"no `.tsx` is reachable today"* is exactly the defence the suite's own comment at `:821-823` records as **"true and unenforced, which is verbatim the shape round 2 rejected"** — and unlike the walk depth, nothing pins it: the `>= 27` floor at `:881` constrains count, not extension.

**Repair:** either sweep `EDGE_UTILITY` over `projectedTree()` filtered to `.tsx`, exactly as the focusable guard does, or correct the bullet to record the edge guard's reach as a fifth live ceiling. The bullet cannot claim the reach axis is closed while one of its four guards is still list-scoped.

---

### F4 — MEDIUM: AD-24 asserts two ceilings are recorded in *Deferred*; after the rewrite only one is

`ARCHITECTURE-SPINE.md:215`, AD-24's rule text, closes the enforcement clause with:

> The *"never its own copy"* half is likewise convention rather than assertion — nothing fails when a surface resets the shell by some other means. **Both ceilings are recorded in *Deferred*;** neither is a claim of parity with AD-5.

The rewritten bullet's enumeration is explicit and closed — *"What remains genuinely live, **four things**"* — and lists: runtime-composed class names, the CSS-file route, the downward-only walk, and the roots. The *"never its own copy"* ceiling is not among them, and `grep` finds the phrase nowhere else in the file. AD-24 points *Deferred* at a record that does not exist.

This matters more after the rewrite than before it. The previous bullet was an open-ended list of ceilings; the new one is a definitive four. A definitive enumeration that omits an item another clause says it contains is a stronger contradiction than an incomplete list was.

I confirmed the underlying claim is true, which is why it deserves a line: nothing in the suite asserts that a full-screen surface resets the shell *through* `claimProjectedShell` rather than by its own means. `:1105-1119` asserts the string `useProjectedShell()` is present; it does not assert the absence of a second implementation.

**Repair:** add the fifth ceiling to the bullet's enumeration, or strike *"Both ceilings are recorded in Deferred"* from AD-24:215.

---

### F5 — MEDIUM: the re-measured passage miscounts its own re-measurement

`ARCHITECTURE-SPINE.md:393`:

> **Four ceilings this bullet previously recorded as live are closed**, and they are listed because a stale ceiling is worse than none

The committed text this replaced recorded the `@/lib` directory exemption as **already closed**, not live:

> **No directory is exempt by name any more** — the wholesale `@/lib` filter, and the `componentImports` function that held it, are both gone (round 2 of Story 17.1's review; `grep -c componentImports` → 0).

Three ceilings were previously recorded as live and are now closed (the `.tsx`-only enqueue, `export … from` invisibility, and the inline-props limit on the `className` guarantee). The `@/lib` exemption is a fourth *closure* but not a fourth *stale ceiling*. In a passage whose stated warrant is *"every claim re-measured"*, and which argues that a stale ceiling misleads a reader about a guarantee that holds, the arithmetic should hold too.

**Repair:** *"Three ceilings this bullet previously recorded as live are closed, and a fourth closure it had already recorded is restated here for completeness."*

---

### F6 — MEDIUM: (i) says the mount is open; the same entry's header and AD-24 say it was chosen

`ARCHITECTURE-SPINE.md:398`:

> **(i) The mount is the open decision; the mechanism is constrained regardless of it…**

`ARCHITECTURE-SPINE.md:396` (the same entry's own headline) and `:218`:

> Owned by Story 17.7; **the owner chose the third candidate below on 2026-07-31.** … hoisting the reset into a route-segment layout that owns both surfaces; the third … is the owner's choice.

The mount is decided. What (i) actually goes on to discuss — stylesheet vs. server-set class vs. pre-paint inline `<script>`, and which of the three releases — is the **mechanism**, and (i)'s own closing sentence says so (*"17.7 picks one and says which"*). The opening clause is inverted.

The inversion has teeth, because the chosen mount **eliminates one of (i)'s three mechanisms**: (i) states that a server-set class *"has one reachable encoding, because only the **root** layout may render `<html>`"*, and the chosen mount is a nested route-group layout, which cannot. With the stylesheet ruled out on release grounds by (i) and on guardability grounds by (ii), the pre-paint inline `<script>` is the only survivor. The spine has effectively decided the mechanism and still presents it as three open candidates.

This clause predates the two edits under review, but (ii) — which is under review — was written beside it and inherits its framing.

**Repair:** relabel (i) as *the mechanism is the open decision*, and record that the route-group mount already excludes the server-set-class encoding.

---

### F7 — LOW: stale citation, twice

`ARCHITECTURE-SPINE.md:216` and `:396` both cite the projector's failure branch as `projector/page.tsx:71`. The `fixed inset-0` branch is at **`src/app/services/[id]/present/projector/page.tsx:85`**; line 71 is comment prose (*"`ArtifactHydrationError` carries up to five `key=value` scope pairs at"*). The file grew by 38 lines in `100f76a` when the scroll fix landed, and the citation did not move with it. The companion citation `slideshow/page.tsx:88` is correct.

Neither of these two clauses is one of the edits under review, but the 2026-08-01 run re-measured the passage immediately around them and left them stale — and AD-24's fold-in preamble (`:42`) makes stale citation a named hazard for this document.

---

## Checklist walk (the whole spine)

### 1. Does every AD's Rule prevent its stated divergence, and is it enforceable?

Largely yes, and unusually well — most `AD`s name their enforcement site (`tests/proxy-matcher.test.mjs` for AD-5, `tests/theme-chrome.test.mjs` for AD-24, `expectedUpdatedAt`/`RegistryStaleError` for AD-6), and the *Testing* convention (`:232`) exists precisely because that delegation was otherwise undocumented.

Three observations:

- **AD-24's tier rule has no enforcement and does not claim one.** Nothing asserts that a new `localStorage` key is a view preference rather than domain data — the hazard `:212` names as the one *who must agree* cannot catch. This is honest (the clause argues the rule rather than citing a test) but it is a rule whose violation is invisible to CI, in the same `AD` whose other half is gated. Acceptable at this altitude; worth a sentence saying so.
- **AD-23's "no surface keeps a default of its own"** is stated as the invariant and cites no assertion.
- **AD-6's rule is stated absolutely and four shipped paths bypass it** — correctly recorded as a named gap at `:104` and in *Deferred* `:377`, with the reasoning for not narrowing the rule spelled out. This is the right shape.

### 2. Could anything under *Deferred* let two units one level down diverge?

Two entries license divergence explicitly, both mitigated but neither closed:

- **`:408`** — *"this closure and 17.7's are free to pick **different** encodings from the three mechanisms above, and if they do, the same hazard is closed twice by two rules. Land them together or state which one owns the shell."* Two units, one hazard, two permitted mechanisms. The instruction to coordinate is present; the decision is not made. Given F6 (the mechanism set is already down to one survivor), this could simply be closed by fiat now.
- **`:409`** — the shared shell reset pins `#000000` while its queued third consumer (`PresenterOperator`) needs a different colour, and *"the natural fix — a colour parameter — passes `tests/theme-chrome.test.mjs`, which reads only the module's default."* Correctly identified; the guard at `:1161-1171` does read only the default (`assert.match(claim, /'backgroundColor',\s*'#000000'/)`), so the trap is real as described.

Beyond those, **F1 is itself a divergence licence**: two units one level down (17.7's reviewer and 17.7's implementer) are given opposite instructions about the same list.

### 3. Is every dimension the altitude owns decided, deferred, or an open question?

**The operational/environmental envelope is not silent** — I checked specifically for this and it is covered:

| Dimension | Where |
| --- | --- |
| Deployment & environments | AD-4 (`:93`), with the "no deployment exists as of 2026-07-30" anchor made load-bearing |
| Infra/provider strategy | AD-4 — home-PC LiveServer, Docker/standalone, Cloudflare Tunnel |
| CI & release | *Deferred* `:410`, named explicitly as *"the one dimension AD-21 binds by name and no decision owns"* |
| Observability | *Deferred* `:368` |
| Backup & recovery | *Deferred* `:378`, with the stakes-raised argument from AD-17 |
| Secrets | *Deferred* `:379` |
| Performance / NFR-2 | *Deferred* `:380` |
| Dependency currency & CVE exposure | *Deferred* `:382-386` |

**One dimension is genuinely thin: data classification and congregation privacy.** It is the hardest constraint the project has (`AGENTS.md`, `.constitution/public-repository.md`), it is enforced by two suites the *Structural Seed* names (`tests/public-repo-guard.test.mjs`, `tests/asset-map-evidence.test.mjs`), and it is structural — the two-layer seed precedence at AD-11, the git-ignored `data/local/`, the generator-side `evidenceFor` filter. Yet no `AD` owns it. AD-11 touches it in one subordinate clause (*"a seeder that reads only the shipped example breaks the mechanism that keeps congregation data out of a public repository"*), and the *Testing* convention at `:232` names AD-5, AD-15 and AD-17 as the decisions that delegate enforcement to suites — omitting the two privacy suites, which have no delegating decision at all.

This is the shape the spine itself calls a hole: a capability with real structural invariants, real enforcement, and no governing decision. Recommend an `AD-25` ratifying what already ships (private data lives only in git-ignored `data/local/`; the seeder prefers it; generators filter at the source rather than at commit time; both suites are the gate) rather than leaving it to two markdown files outside the authority map.

### 4. Does it ratify rather than contradict the brownfield codebase?

Yes, with the exceptions in F2, F3 and F7. Everything else I sampled ratified cleanly, including the details most likely to have drifted — the `[ADOPTED]` / `[ADOPTED, partial]` / `[TARGET]` tagging convention (`:62-73`) is doing real work, and `AD-24`'s partial tag is accurately placed.

### 5. Internal consistency of the two new passages with AD-24:210-221 and the rest of *Deferred*

Covered in F1 (contradiction with `:218` and with the sibling edit), F4 (contradiction with `:215`), F2 (both the edit and `:215` undercount the root sets), F5 (internal miscount), F6/F7 (adjacent staleness the run did not repair).

The specific things looked for, and what was found:

- **A claim the edits make that another part of the spine still contradicts** → F1 (`:395` vs `:218` and `:400`) and F4 (`:394`'s closed four-item list vs `:215`'s *"Both ceilings are recorded in Deferred"*).
- **A present-tense claim the code does not support** → F2 (`:394`'s *"the roots are a list. `PROJECTED` … and `FULL_SCREEN`"* — the code has `ROUTE_SHELLS` at `:740` as well) and F3 (`:395`'s *"one shared answer to what is projected"* — the edge guard at `:629` still answers separately).
- **An instruction the spine now issues that is unsatisfiable** → F1. *"Widening that list is the widening to refuse"* cannot be obeyed by the reviewer of the story the same document charters to widen it.

---

## Recommended disposition

**Return for repair.** Three of the seven findings (F1, F2, F3) require a text change before the gate should pass; F1 additionally requires a decision, not only wording. F4-F7 are corrections that can ride along in the same change set.

Ordered:

1. **F1** — resolve refuse-the-widening vs. widen-`FULL_SCREEN`; assign or explicitly accept the `PROJECTED` root criterion.
2. **F2** — enumerate the real root sets (or collapse them); fix AD-24:215's *"two sets"*.
3. **F3** — sweep the edge guard over the tree, or record the fifth ceiling.
4. **F4** — restore the *"never its own copy"* ceiling to the enumeration, or strike the claim in AD-24:215.
5. **F5** — four → three.
6. **F6** — (i)'s opening clause is inverted; the route-group mount already excludes the server-set-class mechanism.
7. **F7** — `projector/page.tsx:71` → `:85`, in both places.

Separately, and outside this gate's scope: recommend an `AD` for the congregation-privacy dimension (§3).

---

## Note on process

No file was modified by this review except this report. The four-failure probe described in `(ii)` was **not** re-run — it would have required editing `tests/theme-chrome.test.mjs` — and was instead verified structurally by reading both `FULL_SCREEN` loops and both route shells' export forms. The 48-test baseline and the 27-module walk *were* executed, the latter via a scratchpad re-implementation of `moduleImports`/`projectedTree` rather than against the repository's own suite.
