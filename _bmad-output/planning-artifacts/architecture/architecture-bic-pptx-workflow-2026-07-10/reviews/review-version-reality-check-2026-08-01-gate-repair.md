# Reviewer Gate — VERSION / REALITY-CHECK lens

**Target:** `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md` (411 lines, `updated: '2026-07-31'`)
**Run:** 2026-08-01, gate repair
**Mandate:** verify every committed decision was web-researched or reality-checked rather than asserted from training data — current library/framework versions, that each named technology still exists and fits, and that every `file:line` citation points at what the spine says it does.
**Method:** every citation opened and read; every Stack row compared against `package.json`, `package-lock.json`, and the npm registry / upstream docs today; nothing modified.

---

## Verdict

**PASS WITH REQUIRED REPAIRS.**

The two passages the Update run rewrote are **clean — zero citation rot in either**. All eleven line references resolve to exactly the claimed construct, several to the exact opening line of the named function or array. The repeat defect did not repeat, and the measured claims in them (the 48-test baseline, the reach floor of 27, the two-reasons-not-one failure analysis) are all reproducible.

The rot is elsewhere, and two instances are worse in kind than a wrong line number: they are **claims about sibling artifacts that have since been repaired**, so the spine is now telling readers a defect is live where none is. One of those sits in the AD-map paragraph and one in *Deferred*; a third sits inside `AD-23`'s own justification. Four HIGH findings, three MEDIUM, six LOW.

Stack-table drift against `package.json` is **zero, confirmed row by row**. Currency-vs-upstream is more accurate than most spines get: the Next security bullet is correct down to both CVSS scores, and the `next-themes`, ESLint-maintenance-tag, better-sqlite3-Node-gate and Node-20-EOL claims are exact. Two version claims need correcting and one CVE applicability argument is half wrong.

---

# PART A — Citation audit of the two rewritten passages

Both live in `## Deferred`. Both were rewritten because their previous citations had rotted, so a wrong line number here is a repeat defect. **There are none.**

## A1 — The ceiling bullet (spine `:393-395`)

*"**AD-24's closure gate is a static source scan, and its remaining ceiling is now the *roots* rather than the reach (rewritten 2026-08-01, every claim re-measured).**"*

| Cited | Claim in the spine | Actual | Verdict |
|---|---|---|---|
| `tests/theme-chrome.test.mjs:546` | `PROJECTED` (six entries) | `const PROJECTED = [` at `:546`; entries `:547-554`, six of them | ✓ EXACT |
| `:718` | the focusable sweep consumes `projectedTree()` | `for (const { file } of projectedTree()) {` | ✓ EXACT |
| `:784` | `moduleImports` reads `export … from` and bare side-effect imports as module edges | `function moduleImports(file) {`; the three specifier regexes below it cover `(?:import\|export)…from`, `import(…)`, and bare `import "…"` | ✓ EXACT |
| `:825` | `projectedTree()` walks every extension | `const projectedTree = (() => {`; the queue loop applies no extension filter | ✓ EXACT |
| `:867` | the token guard consumes `projectedTree()` | `const walked = projectedTree().filter(({ via }) => via !== null);` | ✓ EXACT |
| `:881` | asserts a floor of 27 reached modules | `assert.ok(` at `:881`, `walked.length >= 27,` at `:882` | ✓ EXACT |
| `:1042` | `exportedPropsShape` resolves the props shape and fails loudly | `function exportedPropsShape(source, file) {` | ✓ EXACT |
| `:1100` | `FULL_SCREEN` (two entries) | `const FULL_SCREEN = [` at `:1100`; two entries `:1101-1102` | ✓ EXACT |
| `src/app/globals.css:124-129` | paints `body` with `bg-background`, reserves the gutter on `html` | `:124-126` `body { @apply bg-background text-foreground; }`; `:127-129` `html { @apply font-sans; scrollbar-gutter: stable; }` | ✓ EXACT — the range is exactly both halves and nothing else |

Non-line claims in the same bullet, all verified:

- *"The wholesale `@/lib` directory exemption and the `componentImports` function that held it are gone."* ✓ — `componentImports` has **zero** occurrences in the file.
- *"`src/lib/projected-shell.ts` among them"* ✓ — named in the walk's own comment at `:822` and reachable through `use-projected-shell.ts`; suite green.
- *"asserts that `SlideView` and `ArtifactSlide` take **no `className` at all**"* ✓ — `tests/theme-chrome.test.mjs:1080-1094`, `assert.doesNotMatch(exportedPropsShape(…), /\bclassName\b/)`, over exactly those two files.
- *"`globals.css` is read only to harvest `--color-*` names"* ✓ — `GLOBALS_CSS` declared at `:457`, consumed once at `:469` by `/^\s*--color-([a-z0-9-]+)\s*:/gm`; no other read of that path exists in the suite.
- *"a `.css` specifier resolves to nothing in `moduleImports` and is dropped"* ✓ — `moduleImports` keeps only `.`/`@/` specifiers and then resolves through a TS/TSX extension probe; independently, `globals.css` is imported only by `src/app/layout.tsx`, which is *above* the walk the bullet correctly calls downward-only.
- *"48 green"* ✓ **MEASURED THIS RUN:** `ℹ tests 48 / ℹ pass 48 / ℹ fail 0`.
- *"the roots are a list … an unregistered room-facing surface is still invisible"* ✓ — structurally true: `PROJECTED` (`:546`) and `FULL_SCREEN` (`:1100`) are literal arrays with no assertion tying them to the filesystem or to a route manifest, unlike AD-5's matcher assertion. The bullet's refusal of parity is honest.

## A2 — Sub-bullet (ii) (spine `:400`)

*"**(ii) The guard cannot simply gain the two shells**, so the closing change set has to rewrite the assertion, not extend the list — and it fails for *two* reasons, only one of which is the gap."*

| Cited | Claim | Actual | Verdict |
|---|---|---|---|
| `tests/theme-chrome.test.mjs:1100` | `FULL_SCREEN` feeds two loops | `const FULL_SCREEN = [` at `:1100`; the two `for (const file of FULL_SCREEN)` loops are at `:1105` and `:1120` | ✓ EXACT |
| `:1105-1119` | the assertion is that every member calls `useProjectedShell()` | the loop occupies exactly `:1105-1119`; `/useProjectedShell\(\)/` is the second `assert.match` at `:1110`, message ending `:1116` | ✓ EXACT — the range is the whole loop and stops at its closing brace |
| `:927` | the branch-root text-colour guard reaches `exportedProps`, which matches the literal `export default function` | `function exportedProps(source) {` at `:927`; `const at = source.indexOf('export default function');` at `:928`; `assert.ok(at !== -1, 'expected a default-exported function');` at `:929` | ✓ EXACT |

**The causal chain the sub-bullet asserts is real and I traced it end to end:** the text-colour guard (`:1120`) → `jsxReturnBranches` (`:1420`) → `exportedFunctionBody` (`:1416`) → `exportedProps` (`:927`) → `indexOf('export default function')`. Both route shells are `export default **async** function` — `src/app/services/[id]/present/projector/page.tsx:30` and `src/app/services/[id]/slideshow/page.tsx:31` — so `indexOf` returns `-1` and `:929` fires with the exact message the spine quotes.

**The 48 → 52 tests / 4 failures count is sound.** I did not re-run the probe (the working tree must stay as found), but every mechanism is confirmed: two added members × two loops = four added tests; in loop 1 the first assert *passes* (`fixed inset-0` is present at `projector/page.tsx:85` and `slideshow/page.tsx:88`) and the `useProjectedShell()` assert fails; loop 2 fails at `:929` before reading any class name. Two failures from the gap, two from the async-component reach — exactly as stated, and the "loud rather than silent" characterisation is correct.

**Also verified in the same entry group:** `src/lib/projected-shell.ts:34-36` ✓ — the header comment's false sentence *"and a Server-Component layout can reach it without a hook"* is at `:35-36`, two lines below the correct reasoning, exactly as `(iii)` describes. And `(iv)`'s claim that `claimProjectedShell` ignores `doc` after the first claim is consistent with the module's single `let claims = 0; let restore = null;` module-scope state (`:66-67`).

### Priority-A conclusion

**Zero rot.** This is the most accurate stretch of citation in the file, and it is the stretch that had rotted before. The rewrite worked. The one thing worth carrying forward: nothing in the gate structurally pins these line numbers, so the same passage will rot again the next time anyone edits `tests/theme-chrome.test.mjs` above line 546 — the ceiling the bullet itself names (*"the roots are a list"*) applies to its own citations.

---

# PART B — Widened citation audit (rest of the spine)

Prioritised as instructed: `AD` text over *Deferred*.

## B1 — HIGH — `EXPERIENCE.md:153` is a blank line, and both claims resting on it are now false

**Where:** spine `:42` (*AD map — the 2026-07-30 fold-in*).

The spine says:

> **Not the UX set** — `EXPERIENCE.md:153` still cites a bare `AD-4` for the clone/Sync reversal that belongs to `AD-14`, which is the very confusion AD-14's own text warns against, and it still states the superseded global-and-immediate rule as current design.

Three things are wrong:

1. **`EXPERIENCE.md:153` is a blank line** between the *Presentation Primitives* list and `## Accessibility Floor` (`:154`). The bullet being described is now **`EXPERIENCE.md:185`**.
2. **The bare `AD-4` is gone.** `EXPERIENCE.md:185` reads: *"It supersedes **AD-14** and nothing else; a previous version of this bullet cited `AD-4`, which is LiveServer durable paths and an unrelated decision."* `grep -n "AD-4" EXPERIENCE.md` returns that meta-note and nothing else.
3. **It does not state the superseded rule as current design.** The same bullet splits *"As shipped:"* from *"Decided, not scheduled:"*, names AD-16, dates it 2026-07-30, and marks it `[TARGET]` with its landing epic and story.

Consequence: the spine's downstream argument — *"That repair is owned by `bmad-ux` and, as of the 2026-07-31 gate, **is tracked nowhere** … The handoff is unacknowledged"* — is arguing for a repair that has already landed. A reader following this paragraph is sent to fix something that is fixed, and the paragraph's own hedge (*"An earlier version of this paragraph claimed every live citation in the repo was repaired; that was too strong"*) now cuts the other way.

**Also in the same paragraph:** `epics.md:374` is a **blank line**. The spine describes it as holding "an unrelated liturgical-suppression note" — that was the point being made about a bad citation, and the description of the bad citation has itself rotted.

**Repair:** rewrite the paragraph's UX clause to record the repair as done, cite `EXPERIENCE.md:185` for the AD-14 correction, and drop or re-locate the `epics.md:374` reference. `sprint-change-proposal-2026-07-29.md:85` — the residue the paragraph names as uncatchable — **is still accurate** (see verified list below), so the paragraph's central point survives; only its UX half is stale.

## B2 — HIGH — "Two affordance questions … have not been received there" is refuted 0-for-2

**Where:** spine `:389` (*Deferred*).

The spine says:

> **Two affordance questions this spine hands to `EXPERIENCE.md` have not been received there.** The stale-snapshot affordance and Reset-reverts-a-rename (both below) are routed to that document, whose *Open Items* carries neither.

Both are in that document's *Open Items*, with owners:

- **`EXPERIENCE.md:304` — Open Item 6:** *"**A stale snapshot has no affordance.** *Owner: Story 20.8.*"* — and it reproduces all three constraints the spine's own bullet at `:372` names (admin-only Sync, stale ≠ broken, "nothing" must be chosen).
- **`EXPERIENCE.md:306` — Open Item 7:** *"**Reset reverts a rename, and some rows have no Reset at all.** *Owner: Story 20.3.*"* — and it also picks up AD-17's authored-row-has-no-Reset second face, which the spine's `:373` bullet does not mention.

Both are cross-referenced from *State Patterns* (`EXPERIENCE.md:129`), Flow 5 step 6 (`:250`), and Branch 5b (`:254`).

This is the sharpest finding of the run because of what the bullet says about itself: *"Recorded here because an unacknowledged handoff is exactly how these four artifact families drifted apart in the first place."* The handoff was acknowledged; the spine did not notice; the spine is now the drifted artifact in the pair it was watching.

**Repair:** move this bullet to *Shipped (no longer deferred)* citing `EXPERIENCE.md:304` and `:306`. The `:372` and `:373` bullets can stay (they correctly say the affordance is undecided and UX-owned) but should cite the received Open Items.

**Note, not a finding against the spine:** `EXPERIENCE.md:185` points at "Open Item 5" for the stale-snapshot affordance while `:129`, `:254` and the list itself say 6. That is `bmad-ux`'s to fix.

## B3 — HIGH — `prd.md:305` does not make FR-7 a requirement (inside `AD-23`)

**Where:** spine `:205`, `AD-23 — Transition Style Is One Value, Described Once, Consumed Identically`.

> …it is recorded here because FR-7 (`prd.md:305`) makes it a requirement…

`prd.md:305` is an offline-cache assumption bullet: *"The slideshow requires connectivity for its initial load … [ASSUMPTION: the PPTX remains the hard offline guarantee…]"*. Nothing about transition style.

- **FR-7 is at `prd.md:179`** (`#### FR-7: Apply one selectable, elegant slide transition`) and stated at **`:180`**.
- The line that would *best* serve AD-23's actual argument is **`prd.md:304`** — *"The browser transition matches the Deck's configured transition style (FR-7); the two are chosen once and never diverge"* — which is one line above the cited one and is precisely AD-23's *Prevents*.

This matters more than a stray line number: it is the sentence that justifies AD-23 existing at all (*"the decision stays because FR-7 still needs an owner"*), and it is in `AD` text, which the mandate prioritises.

**Repair:** cite `prd.md:179-180` for the requirement, and `prd.md:304` for the cross-surface obligation.

## B4 — HIGH — `projector/page.tsx:71` has rotted, at two sites, one of them in `AD` text

**Where:** spine `:216` (`AD-24`'s gap clause) and spine `:396` (*Deferred*, the shell-gap entry).

Both say the `fixed inset-0` failure branch is at `projector/page.tsx:71`. It is at **`:85`** — `return (` at `:84`, `<div className="fixed inset-0 overflow-y-auto bg-black text-white">` at `:85`. Line `:71` is inside the explanatory comment block (`// It SCROLLS, for the reason the slideshow's twin does. An`).

The paired citation **`slideshow/page.tsx:88` is correct** (`<div className="fixed inset-0 overflow-y-auto bg-black text-white">` at `:88`).

This confirms the separate sweep's finding and locates the higher-priority instance: the `AD-24` occurrence at spine `:216` is inside `AD` text, and it is one of the two anchors for the `[ADOPTED, partial]` tag.

**Repair:** `:71` → `:85` at both sites.

## B5 — MEDIUM — `spec-artifact-registry-authoring/SPEC.md:88` is off by one (inside `AD-16`)

**Where:** spine `:159`, `AD-16`.

> …`spec-artifact-registry-authoring/SPEC.md:88` assumed exactly this and an earlier draft of this rule forbade it…

`SPEC.md:88` is *"Multiple SongSet rows beyond the four defaults may be added later only if new stable slot identities and form bindings are introduced in code…"*. The pre-existing-services assumption AD-16 is answering is at **`:89`**: *"Worship services that already exist when this model ships (no clone yet) continue to render from their stored `parsed_data` plus the then-current live registry until an operator freezes/clones or syncs one for them."*

Off-by-one, but it lands on a different claim, so a reader checking the citation finds the wrong SPEC bullet. **Repair:** `:88` → `:89`.

## B6 — MEDIUM — the CVE-2026-64642 applicability argument is half wrong: Turbopack *is* what this project builds with

**Where:** spine `:384`.

> …and a middleware bypass (CVE-2026-64642, CVSS 8.3) whose stated precondition is a Turbopack + single-locale i18n configuration **this project does not have** — so it appears not to apply…

The advisory's precondition is *"App Router built with Turbopack **and** a single entry in `config.i18n.locales`"*. **Turbopack has been the default bundler for both `next dev` and `next build` since Next 16** (<https://nextjs.org/blog/next-16>), and `package.json` `scripts` carry no webpack opt-out (`"dev": "next dev"`, `"build": "next build"`). So the Turbopack half **is** met. Only the `config.i18n.locales` half is absent — `next.config.ts` contains nothing but `output: "standalone"`.

The conclusion (not applicable) survives, and survives cleanly, because `config.i18n` is a Pages-Router option this App Router project never sets. But the spine's stated reason claims two absent preconditions where there is one, which is the *"rule defended by a refutable reason"* failure mode `AD-5` and `AD-24` each name in their own text.

**Repair:** state the single reason and cite it — `next.config.ts` sets no `i18n`, and Turbopack is the Next 16 default rather than an opt-in this project declined.

## B7 — MEDIUM — three of the four "unassessed" CVEs are cheaply assessable; the one that is not is the one that touches `AD-8`

**Where:** spine `:384`, *"The remaining CVEs are unassessed here."*

Of the seven the spine does not assess, four are decidable in one grep and one is the one worth naming:

| CVE | Severity | Precondition | Applies? |
|---|---|---|---|
| CVE-2026-64641 — DoS via Server Actions | **High** | ≥1 Server Action | **No** — `grep -rn "'use server'" src/` returns nothing |
| CVE-2026-64646 — unbounded Server Action payload, Edge runtime | Medium | ≥1 Server Action | **No** — same, and no Edge runtime is used (`AD-5`) |
| CVE-2026-64643 — Server Function endpoint ID disclosure | Medium | Server Actions / `use cache` | **No** — same |
| CVE-2026-64648 / 64647 — `fetch` cache confusion | Medium | `fetch(new Request(init), aDifferentInit)` | not audited |
| CVE-2026-64644 — Image Optimization SVG DoS | Medium | remote images via the default loader | **worth assessing** — touches `AD-8`'s remote-image allowlist and `/_next/image` |
| **CVE-2026-64649 — SSRF in Server Actions on custom servers** | **High** | a Server Action forwarding/redirecting, attacker-controlled Host headers | the only unassessed **High**; `AD-8`'s exact hazard class, on a hub `AD-4` publishes to the open internet through a tunnel |

So the bullet's *"four High"* framing can be sharpened: **two of the four Highs are structurally inapplicable today** (no Server Actions anywhere in `src/`), which strengthens rather than weakens the bump argument by making it precise. And `AD-5`'s own note that *"a Server Function POST inherits its route's matcher outcome"* means the moment a Server Action is added, three of these CVEs become live — which is exactly the trigger the *Deferred* defence-in-depth bullet already watches for.

**Repair:** name the Server-Action precondition once, cite the absence, and carry CVE-2026-64649 and CVE-2026-64644 as the two that bear on `AD-8`.

## B8 — LOW — "a major behind" understates TypeScript by one major

**Where:** spine `:383`.

`npm view typescript dist-tags` → `latest: 7.0.2` (also `rc: 7.0.1-rc`, `beta: 6.0.0-beta`). `^5` resolves `5.9.3`, so it is **two** majors behind. The bullet's own parenthetical says *"7.x current — `^5` can never resolve 6 or 7"*, which is right; the header clause *"Four Stack rows sit a major behind current stable"* contradicts its own evidence.

ESLint is genuinely one behind: `latest: 10.8.0`, `maintenance: 9.39.5`.

## B9 — LOW — the proposed `engines` floor is one patch below what an ESLint 10 bump requires

**Where:** spine `:382` proposes `"engines": {"node": ">=22.12.0"}`; spine `:383` wants ESLint off `^9`.

`eslint@10.8.0` declares `engines.node: "^20.19.0 || ^22.13.0 || >=24"`. A Node floor of `>=22.12.0` therefore admits a Node (22.12.x) that ESLint 10 refuses. The two *Deferred* bullets interact and neither says so.

Two supporting facts for the same pair: `eslint-config-next@16.2.10` peers are `{ eslint: '>=9.0.0', typescript: '>=3.3.1' }`, so the **framework is not the blocker** — the `^9` caret is, exactly as the spine states. And `better-sqlite3@13` declares `engines.node: ">=22"`, so the spine's claim that it is *"gated behind the Node floor above"* is exact.

**Repair:** `>=22.13.0` (or `>=24` if the Node row moves at the same time, which `Deferred` `:385` already anticipates).

## B10 — LOW — `sonner` is a runtime dependency the spine argues about at length and has no Stack row

The Stack table's own rationale argues against this omission twice: `next-themes` *"earns a row because AD-24 rests on it"*, and `shadcn` was given its own row because a mis-scoped row *"made an auditor read this as already covered"*. `sonner@^2.0.7` (resolved `2.0.7`, `latest` `2.0.7` — at head) is the subject of an entire *Deferred* entry (`:392`) as the live test of `AD-24`'s second-root-provider bar, and `src/components/ui/sonner.tsx` calls `useTheme()`, i.e. it consumes the very `next-themes` contract that earned a row.

Same shape, lower stakes: `lucide-react ^1.25.0` (latest `1.28.0`), `tailwind-merge ^3.6.0` (at head), `clsx ^2.1.1` (at head), `class-variance-authority ^0.7.1` (at head), `tw-animate-css ^1.4.0` (at head), `@types/better-sqlite3 ^7.6.13` (at head). None is drift; the table does not claim completeness. Only `sonner` is load-bearing on a decision in the file.

## B11 — LOW — "`notFound()` at six reachable sites" is right for the projected pair and undercounts the app

**Where:** spine `:218` and `:396`.

Per-file counts: `projector/page.tsx` **3** + `slideshow/page.tsx` **3** = **6 at the two room-facing URLs** ✓ — the number is exact for the scope the sentence is about. Across `src/` there are **11**, the other five in `services/[id]/page.tsx` (2) and `present/page.tsx` (3). `present/page.tsx` is the Presenter route, which renders inside the same themed root layout with no `not-found.tsx` either — and the *Deferred* entry at `:409` already flags the Presenter as the queued third consumer of a route-group shell, so the two entries are describing one surface from two directions.

**Repair (optional):** say *"six at the two projected routes (eleven across `src/`)"* so the count cannot be read as an app-wide audit.

## B12 — LOW — `authentication.md` is cited without a line, where every neighbour has one

**Where:** spine `:98`, `AD-5`. The claim is correct and locatable: `node_modules/next/dist/docs/01-app/02-guides/authentication.md:1031` — *"…it's important to only read the session from the cookie (optimistic checks), and avoid database checks to prevent performance issues."*

Relatedly, `proxy.md:217-219` ✓ resolves, but the doc's sentence is scoped: *"Always verify authentication and authorization inside **each Server Function** rather than relying on Proxy alone."* `AD-5` paraphrases it as *"never to rely on Proxy alone for authorization"* generally. The broader claim is defensible (the passage links the Data Security guide) but the quoted range is the Server-Function note, which is also — correctly — what `AD-5`'s last sentence cites it for.

---

## Citations verified CORRECT (the long tail)

Every remaining `file:line` in the spine resolves. Notable exact hits, because they establish that the misses above are isolated rather than systemic:

**`AD` text**
- `src/proxy.ts:5-11` ✓ — the Node-runtime reasoning, stated correctly, exactly as `AD-5` claims (*"`src/proxy.ts:5-11` states it correctly"*).
- `slide-plan.ts:140, :148, :438, :460, :550` ✓ — five `skipTitle` sites, and exactly five: the option declaration, the guard, and three `{ skipTitle: true }` call sites. `AD-20`'s removal scope is accurate.
- `slide-plan.ts:399` ✓ (`divineServiceHymns.slice(1, -1)`) and `:464-466` ✓ (`dsMiddle.forEach`) — the unbounded middle-song rendering `AD-19` cites.
- `worship-form-fields.ts:6-9` ✓ — `song1Number`…`song4Number`, exactly four lines. `parsed-fields.ts:418-421` ✓ — the positional `{ key: 'songNNumber', slot: N }` map, exactly four lines.
- `store.ts:35-38` ✓ — `rowToStored`, reads `row.payload`. `store.ts:74-92` ✓ — `listArtifactSummaries`, reads the `base_type` column and derives `editable` at `:90`; `:81` also confirms *"orders by `label COLLATE NOCASE`"* and therefore the no-ordering-column claim. `AD-18`'s two-readers argument is fully substantiated.
- `registry-snapshot.ts:41-64` ✓ — `parseRow`, returning `null` on both throw branches. `src/lib/artifacts/registry-snapshot.ts:85-90` ✓ — the plan-build gap-fill loop, with `rejected.delete(seed.id)` at `:89`. `AD-11`'s and `AD-17`'s central evidence is exact.
- `types.ts:83` ✓ `schemaVersion: 1;`. `validate.ts:449-450` ✓ the `!== 1` throw. `validate.ts:505` ✓ the re-stamp inside the constructed template. `AD-21`'s discriminator triple is exact.
- `seed.ts:39` ✓ `if (process.env.WPW_USE_SHIPPED_REGISTRY === '1') return SEED_PATH;`.
- `globals.css:5` ✓ `@custom-variant dark (&:is(.dark *));`. `globals.css:3` ✓ `@import "shadcn/tailwind.css";` (Stack table).
- `node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md:15` ✓ — *"Using an **inline script** that runs synchronously as the browser parses the HTML, you can update the DOM **before the first paint**."* `AD-24`'s third mechanism is documented exactly where it says.
- `slideshow/page.tsx:88` ✓.

**Deferred**
- `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md:294` ✓ — *"…this currently does not remove stylesheets as you navigate between routes…"*. Entry (i)'s no-release argument against the CSS candidate is upstream-sourced and correct.
- `src/lib/projected-shell.ts:34-36` ✓ — the false *"a Server-Component layout can reach it without a hook"*.
- `ArtifactEditor.tsx:104` ✓ and `registry/store.ts:226` ✓ — the two `READ_ONLY_BASE_TYPES` refusals.
- `src/app/api/admin/settings/route.ts:17,29` ✓ — `requireAdminSession` on both GET and PUT; the "no per-account persisted tier" argument holds.
- `deferred-work.md:116` ✓ — second-granularity `updated_at`.
- `docs/deploy.md:79` ✓ — the manual backup step.
- `epics.md:52` ✓ NFR-3 owned by **None**. `epics.md:56` ✓ NFR-7 / Arial tension.
- `docs/architecture.md:61` ✓ — reconciled, states the configured value, cites `AD-23`. `AD-23`'s closed-contradiction claim verified.
- `sprint-change-proposal-2026-07-29.md:85` ✓ — the **Architecture spines** row, citing bare `(AD-2…AD-5)` in an epic-16 context. The AD-map paragraph's uncatchable-residue example is exact.
- `prd.md:552` ✓ — *"**target, not yet deployed** — corrected 2026-07-29 by the owner; the deployment tooling exists and is configured, nothing is running"*. `AD-4`'s load-bearing date is anchored.
- `src/lib/db/index.ts` ✓ — `const SEED_HASH_BACKFILL_KEY = 'artifact_seed_hash_backfilled';` at `:13`.
- Story 17.7 registered ✓ — `epics.md:319`, *"Story 17.7: The Room-Facing Shell Belongs to the Route, Not to the App *(backlog)*"*, which supports the 2026-07-31 ratification note at spine `:220`.

**One MEDIUM correction inside this group:** `prd.md:550` (spine `:388`) is cited for *"`prd.md:550` binds NFR-3 on FR-20 registry edits too"*. `:550` is the **Privacy** paragraph. The NFR-3 statement carrying that binding is at **`prd.md:563`** — *"**NFR-3 — Readability.** … *(Binding on FR-20 and FR-21 registry edits too…)*"*, and the hand-authored-liturgical-pages consequence the same spine bullet argues is at `prd.md:413` and `:541`. Rot; *Deferred* rather than `AD` text, hence MEDIUM.

**Absence claims — all confirmed**
- `songset-bt-open` / `songset-*` appear **nowhere** in `src/`, `tests/`, `data/`, `scripts/` ✓
- `ARTIFACT_BASE_TYPES` still carries all **seven** values (`general`, `text-placeholder`, `fullscreen-image`, `image-placeholder`, `mix-placeholder`, `song-set`, `announcement`) ✓ `src/lib/registry/types.ts:1-9`
- `/api/admin/artifacts` is **GET only** ✓; `[id]/route.ts` has GET + PUT; `[id]/reset/route.ts` has POST. No create, delete or reorder verb ✓
- `ALLOWED_PLACEHOLDER_KEYS` is an **object-key whitelist** (`'key'`, `'type'`, `'required'`, `'defaultValue'`) at `src/lib/registry/validate.ts:24`, consumed by `rejectUnknownKeys` at `:297` ✓ — unrelated to a catalog of admitted placeholder identities, exactly as the spine warns twice
- No `not-found.tsx`, `error.tsx` or `global-error.tsx` anywhere under `src/` ✓
- `PresentMessage` carries no plan identity ✓ — `src/lib/present-channel.ts:19-27`, the `sync` variant is `{ type, index, blank, transition }`
- **Ten** literal placeholder-value call sites in `slide-plan.ts` ✓ (`AD-19`'s Placeholder-Catalog clause)
- `use-projected-shell.ts` is **19 lines** ✓ (`AD-24`'s "nineteen-line React binding")

---

# PART C — Stack table currency

## C1 — Drift vs `package.json`: zero, confirmed row by row

The spine claims *"`package.json` pins every library row and this table mirrors it — last mirrored 2026-07-30, zero drift."* Re-verified 2026-08-01 against `package.json`:

| Stack row | Table | `package.json` | |
|---|---|---|---|
| Next.js | `16.2.10` | `"next": "16.2.10"` | ✓ |
| React / React DOM | `19.2.4` | `19.2.4` / `19.2.4` | ✓ |
| TypeScript | `^5` | `"typescript": "^5"` | ✓ |
| Tailwind CSS | `^4` | `"tailwindcss": "^4"`, `"@tailwindcss/postcss": "^4"` | ✓ |
| better-sqlite3 | `^12.11.1` | `^12.11.1` | ✓ |
| pptxgenjs | `^4.0.1` | `^4.0.1` | ✓ |
| jszip | `^3.10.1` | `^3.10.1` | ✓ |
| fabric | `^6.6.1` | `^6.6.1` | ✓ |
| @base-ui/react | `^1.6.0` | `^1.6.0` | ✓ |
| shadcn | `^4.13.0` | `^4.13.0` | ✓ |
| next-themes | `^0.4.6` (resolved `0.4.6`) | `^0.4.6`, lock `0.4.6` | ✓ |
| ESLint / eslint-config-next | `^9` / `16.2.10` | `^9` / `16.2.10` | ✓ |
| fast-xml-parser | `^5.10.1` (dev) | dev `^5.10.1` | ✓ |
| Test runner | `node:test` + `--experimental-strip-types` | `scripts.test` | ✓ |
| Node.js | `22.x (>=22.12)` | **no `engines` field** | ✓ as the spine already says |

`Dockerfile:1` is `FROM node:22-bookworm-slim`; `.github/workflows/test.yml:19` is `node-version: '22'`. Both run 22.x ✓ — neither pins `>=22.12`, so that parenthetical is a target rather than a mirror, which the `engines` *Deferred* entry already owns.

## C2 — Currency vs upstream (npm registry + upstream docs, 2026-08-01)

| Row | Pinned → resolved | Upstream `latest` | Gap |
|---|---|---|---|
| Node.js | 22.x | 22.23.2 (Maint.) / 24.18.1 (Active) / **26.5.1** | see below |
| **Next.js** | `16.2.10` → `16.2.10` | **`16.2.12`** | 2 patches, spans the security release |
| React / DOM | `19.2.4` | `19.2.8` | 4 patches — spine says *"rides along"* ✓ |
| **TypeScript** | `^5` → `5.9.3` | **`7.0.2`** | **two majors** (B8) |
| Tailwind CSS | `^4` → `4.3.3` | `4.3.3` | at head |
| **better-sqlite3** | `^12.11.1` → `12.11.1` | **`13.0.2`** (`engines.node >=22`) | one major |
| pptxgenjs | `^4.0.1` | `4.0.1` | at head |
| jszip | `^3.10.1` | `3.10.1` | at head |
| **fabric** | `^6.6.1` → `6.6.1` | **`7.4.0`** (`engines.node >=20.0.0`) | one major |
| @base-ui/react | `^1.6.0` | `1.6.0` | at head |
| shadcn | `^4.13.0` → `4.13.0` | `4.16.1` | same major |
| next-themes | `^0.4.6` → `0.4.6` | `0.4.6` | **at head** ✓ |
| **ESLint** | `^9` → `9.39.5` | **`10.8.0`** (`maintenance: 9.39.5`) | one major |
| eslint-config-next | `16.2.10` | `16.2.12` | moves as a set with `next` ✓ |
| fast-xml-parser | `^5.10.1` | `5.10.1` | at head |
| *(no row)* `@types/node` | `^20` → `20.19.43` | **`26.1.2`** | five majors |

Every named technology still exists, is published, and is undeprecated. `npm view next-themes deprecated` returns empty; the repo is not archived.

## C3 — The five *Deferred* currency entries, confirmed or refuted

### 1. `next@16.2.10` predates the July 2026 security release — **CONFIRMED, and unusually precise**

Everything in this bullet checks out:

| Claim | Verification |
|---|---|
| 16.2.11 shipped 2026-07-21 | ✓ npm publish `2026-07-21T16:00:01.566Z`. (The blog post is dated *July 20th 2026* — the npm artifact is the 21st, so the spine's date is defensible; worth a parenthetical.) |
| **nine CVEs** | ✓ exactly nine: 64641, 64642, 64643, 64644, 64645, 64646, 64647, 64648, 64649 |
| **four High** | ✓ 64641 (DoS/Server Actions), 64642 (middleware bypass), 64645 (SSRF rewrites), 64649 (SSRF Server Actions) — the other five are Medium |
| CVE-2026-64645 SSRF via request-controlled rewrite/redirect destination, **CVSS 8.3** | ✓ CVSS 4.0 base **8.3**; affects `>=12.0.0 <15.5.21` and `>=16.0.0 <16.2.11` |
| CVE-2026-64642 middleware bypass, **CVSS 8.3** | ✓ CVSS 4.0 base **8.3**, vector `CVSS:4.0/AV:N/AC:L/AT:P/PR:N/UI:N/VC:H/VI:L/VA:N/SC:N/SI:N/SA:N`, CWE-285, GHSA-6gpp-xcg3-4w24 |
| `15.5.21` was patched the same day — the refutation of *"earlier minors are not back-patched"* | ✓ the release page ships `15.5.21` (Maintenance LTS) alongside `16.2.11` (Active LTS). The 2026-07-31 refutation stands. |
| `16.2.12` was current when written | ✓ published `2026-07-25T20:45:53Z`, **still `latest` on 2026-08-01** |
| `next` and `eslint-config-next` are pinned exact and move as a set | ✓ both `16.2.10`; both have `16.2.12` upstream |
| React 19.2.4 → 19.2.8 rides along | ✓ `react` / `react-dom` `latest` = `19.2.8` |
| SSRF is *"the class AD-8 exists to contain"* and touches `AD-5`'s `safeNextPath` | ✓ CVE-2026-64645's own remediation is *"do not build the hostname of an external `rewrites()`/`redirects()` destination from user-controlled input"* — same shape as `AD-8`'s fail-closed allowlist |

The bullet's conclusion — *"Bumping them is a code change, and it belongs before first deploy"* — is well founded. `AD-4` publishes this hub to the open internet through a Cloudflare Tunnel; `AD-1` makes Sabbath reliability the point.

Two defects: **B6** (the Turbopack half of 64642's precondition *is* met) and **B7** (three of the seven "unassessed" CVEs are decidable in one grep; the remaining High, CVE-2026-64649, is the one worth naming).

Source: <https://nextjs.org/blog/july-2026-security-release>, <https://github.com/advisories/GHSA-6gpp-xcg3-4w24>, <https://github.com/advisories/GHSA-p9j2-gv94-2wf4>

### 2. `package.json` has no `engines` field while `@types/node` is pinned `^20` — **CONFIRMED**

- No `engines` key in `package.json` ✓ — so the Node row genuinely has no manifest to mirror from.
- `@types/node` pinned `^20`, lock-resolved **`20.19.43`** ✓ — exactly the figure the spine states. Upstream `latest` is `26.1.2`.
- `next@16.2.10` declares `engines.node: ">=20.9.0"` ✓ — exactly as the Stack row says.
- The machine-enforcement point is right: the caret pin on `@types/node` is the one Node-20 commitment no doc edit can reach.
- One correction: the proposed floor should be `>=22.13.0`, not `>=22.12.0` — **B9**.

### 3. Four rows sit a major behind — **CONFIRMED with one correction**

- TypeScript: `^5` → `5.9.3`, `latest` `7.0.2`. **Two** majors (B8). *"`^5` can never resolve 6 or 7"* ✓.
- better-sqlite3: 12 pinned, `13.0.2` current, **`engines.node: ">=22"`** ✓ — the spine's Node-gating claim is exact.
- fabric: 6 pinned, `7.4.0` current ✓. The *"two explicit v6 workarounds in `ArtifactEditor.tsx`"* claim makes it a real migration; `fabric@7`'s own `engines.node: ">=20.0.0"` means the Node floor is *not* the blocker here.
- ESLint: `^9` → `9.39.5`; `latest` `10.8.0`; **`dist-tags.maintenance === '9.39.5'`** ✓ — the spine's *"resolved `9.39.5` is the maintenance tag"* is confirmed verbatim by the registry, which is the single best-evidenced claim in the table. And `eslint-config-next@16.2.10` peers `eslint: ">=9.0.0"`, so the caret pin is the only blocker, as stated.

### 4. `next-themes` is at head, cadence is the thing to watch — **CONFIRMED to the day**

| Claim | Verification |
|---|---|
| `0.4.6`, released 2025-03-11 | ✓ npm `time["0.4.6"] = 2025-03-11T21:02:05.882Z` |
| still the latest | ✓ `dist-tags.latest = 0.4.6` |
| ~16 months without a release | ✓ 2025-03-11 → 2026-08-01 ≈ 16.7 months |
| repository not dormant, last push 2026-02-25 | ✓ GitHub `pushed_at: 2026-02-25T05:25:42Z` |
| not archived, not deprecated | ✓ `archived: false`, `disabled: false`; npm carries no deprecation |

*"Unreleased activity"* is the accurate reading, exactly as the bullet says. Nothing to repair.

### 5. The Node row will need this again — **CONFIRMED, and now slightly behind**

- Node 20 EOL **2026-04-30** ✓ exact.
- Node 22 in **Maintenance** ✓ (active support ended 2025-10-21; security to 2027-04-30).
- Node 24 **Active** ✓ (active support to 2026-10-20).
- **Not mentioned: Node 26 has shipped** — `26.5.1` on 2026-07-29, with active support to 2027-10-27. So by the time the `engines` change lands, 24 is the conservative target and 22 is two lines back. The bullet's own argument (*"the same argument reaches 22 on a schedule"*) is already one release further along than its text.

Source: <https://endoflife.date/nodejs>

---

# Required repairs, ordered

| # | Severity | Where | Repair |
|---|---|---|---|
| B1 | HIGH | spine `:42` | `EXPERIENCE.md:153` is blank; the bullet is `:185` and the `AD-4`→`AD-14` repair has **landed**. Rewrite the UX clause to record it as closed; drop `epics.md:374` (blank). |
| B2 | HIGH | spine `:389` | Both affordance handoffs **were received** — `EXPERIENCE.md:304` (Open Item 6, Story 20.8) and `:306` (Open Item 7, Story 20.3). Move to *Shipped (no longer deferred)*. |
| B3 | HIGH | spine `:205`, `AD-23` | `prd.md:305` → `prd.md:179-180` (FR-7 itself) and/or `:304` (the cross-surface obligation). |
| B4 | HIGH | spine `:216` (`AD-24`) and `:396` | `projector/page.tsx:71` → `:85`. `slideshow/page.tsx:88` is correct. |
| B5 | MED | spine `:159`, `AD-16` | `SPEC.md:88` → `:89`. |
| B6 | MED | spine `:384` | Turbopack **is** the Next 16 default; the single absent precondition is `config.i18n.locales`, evidenced by `next.config.ts`. |
| B7 | MED | spine `:384` | Three "unassessed" CVEs need ≥1 Server Action and `src/` has none; name CVE-2026-64649 (High, SSRF) and CVE-2026-64644 as the two touching `AD-8`. |
| — | MED | spine `:388` | `prd.md:550` → `prd.md:563` (NFR-3's binding on FR-20/FR-21). |
| B8 | LOW | spine `:383` | TypeScript is **two** majors behind; the header clause contradicts its own parenthetical. |
| B9 | LOW | spine `:382` | Proposed `engines` floor `>=22.12.0` is below `eslint@10`'s `^22.13.0`; use `>=22.13.0` or `>=24`. |
| B10 | LOW | Stack table | `sonner@^2.0.7` has no row despite being an `AD-24` subject; the table's own shadcn rationale argues for one. |
| B11 | LOW | spine `:218`, `:396` | *"six reachable sites"* is exact for the projected pair; say so (11 across `src/`). |
| B12 | LOW | spine `:98` | Give `authentication.md` its line (`:1031`), as every neighbour has. |
| — | LOW | spine `:384` | Note the blog is dated July 20 while the npm publish is July 21. |
| — | LOW | spine `:385` | Node **26** has shipped (26.5.1, 2026-07-29); the row's successor argument is one release further along. |

---

## Notes on scope and method

- **Nothing was modified.** I ran `tests/theme-chrome.test.mjs` read-only (48/48 green) and did **not** apply the `FULL_SCREEN` probe the spine describes — its 52/4 arithmetic was confirmed structurally instead, by tracing `:1105`, `:1120`, `:1420`, `:1416`, `:927-929` and the two shells' `export default async function` declarations.
- `git status` shows more modified files at the end of this run than at its start (`deferred-work.md`, `sprint-status.yaml`, `stories/17-1-reachable-dark-mode.md`, `epics.md`). **None of those were touched by this lens** — it made no writes outside this report file. Concurrent gate work is the likely source; flagged so it is not read as this review's footprint.
- Currency figures come from the live npm registry (`npm view … version` / `dist-tags` / `time`), `package-lock.json` for resolved versions, the Vercel security blog and GitHub Advisory Database for CVE data, and `endoflife.date/nodejs` for the Node schedule. Upstream Next.js prose was read from the vendored docs under `node_modules/next/dist/docs/`, which is the copy this project actually builds against.

## Sources

- [Next.js July 2026 Security Release](https://nextjs.org/blog/july-2026-security-release)
- [GHSA-6gpp-xcg3-4w24 — CVE-2026-64642, middleware/proxy bypass, CVSS 8.3](https://github.com/advisories/GHSA-6gpp-xcg3-4w24)
- [GHSA-p9j2-gv94-2wf4 — CVE-2026-64645, SSRF in rewrites, CVSS 8.3](https://github.com/advisories/GHSA-p9j2-gv94-2wf4)
- [Next.js 16 — Turbopack is the default for `next dev` and `next build`](https://nextjs.org/blog/next-16)
- [Node.js release schedule — endoflife.date](https://endoflife.date/nodejs)
- [next-themes repository metadata (GitHub API)](https://api.github.com/repos/pacocoursey/next-themes)
