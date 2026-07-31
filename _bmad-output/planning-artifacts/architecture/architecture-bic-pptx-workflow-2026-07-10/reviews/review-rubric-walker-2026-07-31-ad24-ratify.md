---
lens: rubric-walker
gate: bmad-architecture Reviewer Gate
run: 'Update — AD-24 shell split, gap-reason correction, Story-17.7 ratification (2026-07-31)'
target: '_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md'
date: '2026-07-31'
verdict: 'APPROVE WITH REQUIRED REPAIRS — 0 CRITICAL, 1 HIGH, 7 MEDIUM, 3 LOW'
---

# Rubric Walker — ARCHITECTURE-SPINE.md after the 2026-07-31 AD-24 Update

## Verdict

**Approve with required repairs. No CRITICAL. One HIGH.**

The five edits are each individually correct and each verified against real code — the split
implementation exists as described, the reference counting works as described, the corrected
gap reason is the true one, the ratification's factual claims all hold, and the two new
Deferred items are real defects I reproduced. Citation hygiene across the whole file is
unusually good: of roughly forty `file:line` citations I resolved, **one** is stale.

What the run did not do is finish the edit. Sharpening AD-24's gap reason (edit 2) changed
what is *possible* at that gap, and three places that were written against the old reason
still assume the old possibility — most seriously the Deferred bullet that instructs Story
17.7 to do something the closure gate cannot accept. Naming the DOM half as the shared
implementation (edit 1) likewise retracted a claim the Structural Seed still makes. These are
same-change-set omissions of exactly the kind `AGENTS.md`'s BMad gate exists to catch, and
they are cheap to close.

---

## Method

Every claim below was checked against the working tree at `fe27523` on branch
`fix/ci-build-before-tests`. I did not accept the spine's citations on trust: I resolved line
numbers and symbol names, ran the gate suite, and reimplemented the closure walk to test the
spine's own arithmetic about it.

Verification performed:

- Read `src/lib/projected-shell.ts` (106 lines) and `src/lib/use-projected-shell.ts` (19 lines) in full.
- Ran `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/theme-chrome.test.mjs` → **43 pass, 0 fail**.
- Reimplemented `moduleImports` + the closure walk from `tests/theme-chrome.test.mjs:384-445` in a scratch script and compared the real walk against a walk without the `.tsx` restriction.
- Resolved every code citation inside AD-24 and inside Deferred bullets 392–393, 395.
- Spot-resolved citations in AD-5, AD-10, AD-11, AD-17, AD-18, AD-19, AD-20, AD-21, AD-22, AD-23 and the Stack table.
- Measured every `AD`'s word count to judge the readability question on evidence rather than impression.

---

## Part 1 — What verified clean

Recorded first, because the findings below are narrow and the reader should not infer from
their number that the changed region is shaky. It is not.

### Edit 1 — the shell reset named as one shared implementation split in two

| Spine claim | Location | Result |
| --- | --- | --- |
| `src/lib/projected-shell.ts` exists and exports `claimProjectedShell` | AD-24 `:215` | **VERIFIED** — `projected-shell.ts:74` |
| Reference-counted; only the first claim snapshots, only the last release restores | AD-24 `:215` | **VERIFIED** — `projected-shell.ts:75-99`; `claims === 0` guards both the snapshot (`:75`) and the restore (`:95`) |
| `src/lib/use-projected-shell.ts` is a nineteen-line React binding | AD-24 `:215` | **VERIFIED** — the file is exactly 19 lines; its whole body is `useEffect(() => claimProjectedShell(document), [])` (`:18`) |
| The reference counting is an invariant, not an optimisation | AD-24 `:215` | **VERIFIED and enforced** — three behaviour tests drive it against a document stub: set/restore (`tests/theme-chrome.test.mjs:573-596`), two concurrent claims (`:598-620`), double-release no-op (`:622-636`) |
| Story 17.1 took the callers from one to two | AD-24 `:215` | **VERIFIED** — `ProjectorClient.tsx:96` and `SlideshowClient.tsx:33` |

The invariant claim is the strongest part of this edit: it is not merely asserted, it is the
only clause in AD-24 whose enforcement is *behavioural* rather than a regex over source text,
and `tests/theme-chrome.test.mjs:598-620` fails in precisely the way the spine describes if
the counting is removed.

### Edit 2 — the corrected gap reason

The new reason is the true one and the retracted one was genuinely refutable in the wrong
direction. `claimProjectedShell` takes a `ShellDocument` structural type
(`projected-shell.ts:50-53`) and contains no React import, so a reader told only "a React hook
cannot run in a Server Component" would correctly conclude the DOM half is callable and
incorrectly conclude the shells can call it. `projector/page.tsx` and `slideshow/page.tsx` are
Server Components with no `'use client'`; a Server Component has no `document`. The
replacement reason — the leaking paint is the server's own first paint — is confirmed by
`src/app/globals.css:120-131`, where `body { @apply bg-background text-foreground }` (`:125`)
and `html { scrollbar-gutter: stable }` (`:129`) are stylesheet rules that land on the first
byte the server emits, before any script runs.

### Edit 3 — the Story-17.7 ratification

Every factual claim in the ratification record (`:220`) verified:

- Story 17.7 is registered (`_bmad-output/implementation-artifacts/sprint-status.yaml`, `epics.md`).
- The four holes are the four round-2 found, and I confirmed the two that are checkable in code. `notFound()`: the spine's "six reachable sites" is the correct count for the two *projected* routes — `projector/page.tsx:37,49,55` and `slideshow/page.tsx:38,50,56` — though a whole-repo grep returns eleven across four files (see LOW-3). And **no** `not-found.tsx`, `error.tsx` or `global-error.tsx` exists anywhere under `src/` (`find src -name …` → empty), so the framework default does render inside the themed root layout as claimed.
- `PROJECTED` does contain the two route shells (`tests/theme-chrome.test.mjs:265-270`), so the spine is right that the *token* half holds there and only the *shell* half is open.

Ratifying rather than restating was the right call and the precedent paragraph is correct on
its own terms: this is the third workflow in a row to decline to substitute for this gate.

### Edit 4 — the repaired closure-gate bullet

This is the most impressive verification in the run. Every one of its mechanical claims is
exactly right:

| Claim | Result |
| --- | --- |
| The `@/lib` wholesale exemption is gone | **VERIFIED** — the only `@/lib` occurrences in the suite are the historical comment at `tests/theme-chrome.test.mjs:408,410` explaining why it was removed. No live filter. |
| `componentImports` is gone; `grep -c` → 0 | **VERIFIED** — `grep -c componentImports tests/theme-chrome.test.mjs` → `0` |
| The walk is `moduleImports` at `:384` | **VERIFIED** — `function moduleImports(file)` is on line 384 exactly |
| The queue enqueues `.tsx` only, at `:432` | **VERIFIED** — `if (resolved.endsWith('.tsx') && !seen.has(resolved))` is on line 432 exactly |
| That leaves **fourteen** modules reachable from the projected tree unwalked | **VERIFIED EXACTLY** — my reimplementation: the real walk leaf-checks 16 modules; the unrestricted closure reaches 30; **14** are reachable and never scanned at all |
| `projected-shell.ts` is among them | **VERIFIED** — see LOW-2 for why it is the weakest example to have picked |
| `export … from` is invisible to `moduleImports`, already live at `parsed-fields.ts:432` | **VERIFIED** — `parsed-fields.ts:432` is `export { songNumbersFromParsed } from './worship-form-fields';`, and neither regex at `:387-390` matches it |
| 43 tests | **VERIFIED** — 43 pass, 0 fail |
| A runtime-composed class shape does not exist in the projected tree today | **VERIFIED** — no `cn(`, `clsx(` or template-literal `className` in any of the four component-level `PROJECTED` files |

For the record, the fourteen: `artifacts/hydrate.ts`, `artifacts/registry-snapshot.ts`,
`auth/password.ts`, `hymn-sections.ts`, `images.ts`, `lyrics.ts`, `parser.ts`,
`projected-shell.ts`, `registry/asset-safety.ts`, `registry/seed.ts`, `registry/store.ts`,
`registry/types.ts`, `registry/validate.ts`, `uploads.ts`.

### Edit 5 — the two new Deferred items

Both are real and I reproduced both.

- **The false header comment.** `projected-shell.ts` lines 33-36 read "It lives apart from the `useProjectedShell` hook because none of this is React: it is a DOM mutation with a lifetime, so it is testable with a document stub in the `node:test` harness, **and a Server-Component layout can reach it without a hook**." The quoted clause is verbatim-correct and the sentence is false for the reason edit 2 gives. Filing it as a code change rather than fixing it here is correct — the spine may not edit `src/`.
- **`claimProjectedShell` ignores its `doc` after the first claim.** **VERIFIED** — the `if (claims === 0)` block at `:75-87` is the only reader of `doc`, and the `restore` closure at `:82-86` captures the *first* `doc`. A second claim against a different document sets nothing and its release restores the wrong document. The spine's reachability assessment ("unreachable today because both callers pass the same `document`") is also correct: `use-projected-shell.ts:18` is the only call site and always passes `document`.

### Other dimensions

- **Named tech verified-current.** Stack table mirrors `package.json` with zero drift on every library row I checked (`next 16.2.10` pinned exact, `react/react-dom 19.2.4` pinned exact, `next-themes ^0.4.6`, `shadcn ^4.13.0`, `@base-ui/react ^1.6.0`, `better-sqlite3 ^12.11.1`, `fabric ^6.6.1`, `pptxgenjs ^4.0.1`, `jszip ^3.10.1`, `fast-xml-parser ^5.10.1`, `typescript ^5`, `eslint ^9`, `eslint-config-next 16.2.10`, `tailwindcss ^4`). `globals.css:3` does `@import "shadcn/tailwind.css"` and `globals.css:5` is `@custom-variant dark (&:is(.dark *))`, both exactly as cited. No `engines` field and `@types/node: ^20`, both as the Deferred bullet at `:381` says. Currency-vs-upstream is the version-reality-check lens's charge and I do not duplicate it; see MEDIUM-6 for the one presentation defect I do own.
- **Brownfield ratification beyond AD-24.** Spot-resolved and clean: `slide-plan.ts` `skipTitle` at `:140,:148,:438,:460,:550` (five sites, exactly as AD-20 `:186` says); `slide-plan.ts:399` and `:464-466` (the unbounded DS-middle songs); `worship-form-fields.ts:6-9` (`song1Number..song4Number`); `parsed-fields.ts:418-421` (positional mapping); `registry-snapshot.ts:85-90` (the read-time gap-fill, including `rejected.delete(seed.id)` at `:89`); `registry-snapshot.ts:41` (`parseRow` returning `null`); `store.ts:35-38`, `:74-80`, `:226`; `types.ts:83` (`schemaVersion: 1`); `validate.ts:449-450` and `:505`; `ArtifactEditor.tsx:104`; `ALLOWED_PLACEHOLDER_KEYS` at `validate.ts:24` used at `:297` — confirmed an unrelated object-key whitelist, exactly as AD-19 `:181` warns; `songset-` appears nowhere in `src/`, `tests/`, `data/` or `scripts/`; `PresentMessage` (`present-channel.ts:19-27`) carries no identity field; `layout.tsx` is a Server Component with `suppressHydrationWarning` at `:32` and one client child at `:36`; `proxy.ts:5-11` states the Node-runtime reasoning correctly; `admin/settings/route.ts:17,29` both `requireAdminSession`; `ArtifactSlide.tsx` literal fallbacks `#FFFFFF` (`:128`), `transparent` (`:181`), `#000000` (`:256`); `SlideView.tsx:11` documents taking no `className`; `sonner.tsx` calls `useTheme()` and `<Toaster />` is mounted nowhere. `tests/theme-chrome.test.mjs` **is** registered in `package.json` `scripts.test` (37 suites listed), satisfying the Testing convention at `:232`.
- **Deferred cannot let two units diverge** — holds, with one exception (MEDIUM-3) where a Deferred bullet's reassurance is wrong, and one (HIGH-1) where a Deferred instruction is unfollowable.
- **Operational/environmental envelope** — covered, not silent. Deployment and environments: AD-4 `:93`. Infra/provider: AD-4 (Docker/standalone, home-PC LiveServer, Cloudflare Tunnel, compose bind-mounts). Operations: four Deferred bullets name the floor honestly — observability `:367`, durability/recovery `:377`, secrets `:378`, performance `:379`. One sub-dimension **is** silent; see MEDIUM-7.

---

## Part 2 — Findings

### HIGH-1 — `Deferred`'s same-change-set instruction for Story 17.7 is unsatisfiable against the gate AD-24 designates, and edit 2 is what made it so

**Where:** `ARCHITECTURE-SPINE.md:393` (final sentence), against `ARCHITECTURE-SPINE.md:215-216`
and `tests/theme-chrome.test.mjs:506-525`.

AD-24 `:215` designates `FULL_SCREEN` as the gate for the shell-reset half and requires that
"a new room-facing surface joins whichever of them applies **in the same change set**".
Deferred `:393` turns that into an instruction: "Whichever mount lands, `FULL_SCREEN` in
`tests/theme-chrome.test.mjs` gains both shells in the same change set."

That instruction cannot be followed. `FULL_SCREEN` is defined at
`tests/theme-chrome.test.mjs:506-509`, and every member is asserted against two things
(`:511-525`):

```
assert.match(read(file), /\bfixed inset-0\b/, 'this is a full-screen surface');
assert.match(read(file), /useProjectedShell\(\)/, …);
```

`grep -c useProjectedShell` on both shells returns **0**, and per AD-24 `:216` — as rewritten
by *today's* edit 2 — it must stay 0: "**no browser-side mechanism closes this gap — hook,
direct DOM call, or `useLayoutEffect` alike.**" So adding `projector/page.tsx:71` and
`slideshow/page.tsx:88` to `FULL_SCREEN` takes the suite from 43/43 green to 2 failures, and
the only way to make them pass is to do the thing AD-24 forbids.

This is a direct consequence of edit 2. Under the *old* reason ("a React hook cannot run in a
Server Component") the instruction was merely awkward — a reader could imagine the shells
becoming Clients, or calling the DOM half. Under the new and correct reason there is no such
path, and the instruction is now self-contradictory with the paragraph directly above it.

**Second half of the same defect: "never its own copy" is unenforced.** AD-24 `:215` requires
the reset to happen "through **one shared implementation, never its own copy**." The only
enforcement is the `/useProjectedShell\(\)/` match above — which asserts that the shared one
*is* called, and says nothing about a surface that also mutates `html`/`body` itself. Once the
mechanism becomes a server-emitted class or `<style>` (the owner's chosen route-group layout),
there will be **no** assertion tying it to a shared implementation at all, because the current
one is spelled as a hook-call regex rather than over the mechanism.

**Required repair (spine-side, this file):** replace the final sentence of `:393` with the
constraint that actually applies — that closing the gap requires the `FULL_SCREEN`
*assertion* to be re-expressed over **the mechanism that neutralises the shell** rather than
over the hook call, and that the room-facing route shells join the set only once that
re-expression lands. Note explicitly that a hook-call regex cannot express a server-emitted
closure. The irony is worth stating in the bullet: `:392` names "a finding that a rule was
applied too narrowly has been closed by widening the list rather than by encoding the rule"
as the pattern to break, and `:393`'s instruction to widen `FULL_SCREEN` is that same pattern
one paragraph later.

**Also weaken the AD-5 analogy at `:215`.** "exactly as AD-5 requires of a new matcher
exclusion" is a false equivalence in the one respect that matters: AD-5's gate has a
structural anchor — `tests/proxy-matcher.test.mjs` enumerates paths against the *real*
`config.matcher`, so an omission is detectable. Nothing in the app declares "this is a
room-facing surface", so this gate cannot detect an omission, which `:392` concedes in its
fifth ceiling ("it is how `SlideshowClient` shipped the AC-4 defect"). A builder reads the AD,
not the Deferred bullet. Say "with the same same-change-set discipline AD-5 requires, but
without AD-5's structural anchor — see *Deferred*."

---

### MEDIUM-2 — `slideshow/page.tsx:76` is stale, in both places today's edits touched

**Where:** `ARCHITECTURE-SPINE.md:216` and `ARCHITECTURE-SPINE.md:393`.

Both cite the room-facing route shells as "`projector/page.tsx:71` and `slideshow/page.tsx:76`,
the `fixed inset-0` branches a `buildSlidePlan` throw renders."

- `projector/page.tsx:71` — **correct.** That line is `<div className="fixed inset-0 flex flex-col items-center justify-center bg-black px-12 text-center text-white">`.
- `slideshow/page.tsx:76` — **stale.** That line is a comment: `// comment beside code that had none. Same headline and same explanation,`. The `fixed inset-0` branch is at **`:88`**: `<div className="fixed inset-0 overflow-y-auto bg-black text-white">`.

`git log` shows the drift: commit `517f6c1` ("fix: close the 25 findings code review round 2
left on story 17.1") added the 18-line explanatory comment at `:69-86`, pushing the JSX down
twelve lines. The citation was accurate before that commit and has been wrong since.

Severity is MEDIUM rather than LOW for two reasons. First, it appears in the exact clause edit
2 rewrote and the exact bullet edit 5 appended to — a run that re-read both paragraphs and
still shipped a stale number in them. Second, it lands on a *comment*, which is the worst
failure mode: a reader who follows it finds prose about why the branch is not the projector's
twin, and may reasonably conclude the spine is describing a comment rather than a code branch.

**Repair:** `slideshow/page.tsx:88` in both places. Consider citing the branch by its `catch`
rather than its JSX line (`slideshow/page.tsx:64` / `projector/page.tsx:63`), which is stable
against comment growth — the same reasoning the spine applies elsewhere when it prefers a
symbol name to a line number.

---

### MEDIUM-3 — three places outside AD-24 still assert what edits 1 and 2 retracted

Today's edits changed *what the shared implementation is* and *how complete the closure is*.
Three projections of AD-24 were not brought along. Taken together they are the same defect the
BMad gate's same-change-set rule exists to prevent, and the task brief named two of the three
as suspects.

**(a) Structural Seed `:310` names the wrong module as the implementation.**

```
src/lib/           # … + use-projected-shell.ts -- the ONE app-shell reset every full-screen room-facing surface calls (AD-24)
```

Three things wrong with this after edit 1. It names the nineteen-line binding as "the ONE
app-shell reset" when AD-24 `:215` now says the reset *is* `projected-shell.ts` and the hook is
a binding over it. It omits `projected-shell.ts` from the directory map entirely — the one
module in `src/lib/` that an `AD` names as a shared implementation is the one the tree does not
list. And "every full-screen room-facing surface calls" is now forward-false: the owner's
chosen Story 17.7 route-group layout will call neither module, because it must emit CSS or a
class. **Repair:** name `projected-shell.ts` as the shared implementation and
`use-projected-shell.ts` as its React binding, and drop "every … calls" for "the shared app-shell
reset the full-screen room-facing client surfaces use (AD-24)".

**(b) Consistency Conventions "Client state" `:230` states the closure as complete.**
"Room-facing surfaces read **persisted-local** never." AD-24 is `[ADOPTED, partial]` and its own
gap clause `:216` says the opposite for the surface that matters: the server-rendered room-facing
shells inherit `body { @apply bg-background }` under a `.dark` class that `next-themes` set from
`localStorage`, so the operator's persisted-local choice *does* reach the room-facing screen
today. A builder who reads only the conventions table — which is what a conventions table is
for — takes the closure as done. **Repair:** append "(the closure is `[ADOPTED, partial]` — see
AD-24's gap and *Deferred*)". The row need not restate the gap; it must not conceal it.

**(c) Structural Seed mermaid `:280` does the same.**
`Theme -.->|"AD-24: closed -- literal colours + one shared shell reset"| Projector`, under a
preamble (`:258-259`) that says only the AD-16 snapshot nodes are target and "everything else in
this graph ships today". The AD-16 edges are marked; this one is not. **Repair:** `"AD-24:
closed for the client surfaces -- literal colours + one shared shell reset; server first paint
open"` or equivalent.

**What is clean:** the *Design Paradigm* (`:34`) asserts nothing edit 1 or 2 retracted — its
claim is only that one client provider wraps every route without making the wrapped tree
client-side, which `layout.tsx:36` confirms. `componentImports` and the `@/lib` exemption
appear nowhere in the spine except `:392`'s correct account of their removal. `:200`'s
"wholesale" is unrelated (layout replacement under AD-22). No other `AD` cites
`use-projected-shell.ts`.

---

### MEDIUM-4 — `Deferred:392`'s reassurance is false for the second ceiling it lists, and it is the ceiling AD-24's open gap is about

**Where:** `ARCHITECTURE-SPINE.md:392`, the sentence "None of these shapes exists in the
projected tree today."

That bullet lists, among the things the gate structurally cannot see, "**a theme token arriving
through a CSS file rather than a utility class**". Then it reassures the reader that none of the
listed shapes is live.

That shape is live, and it is the single most consequential one in the file. `src/app/globals.css`:

- `:122` — `* { @apply border-border outline-ring/50; }` (universal, so it reaches every node in the projected tree)
- `:125` — `body { @apply bg-background text-foreground; }`
- `:129` — `html { scrollbar-gutter: stable; }`

These are theme tokens arriving through a CSS file, they reach the projected tree, and they are
*precisely* the mechanism AD-24 `:216` describes as the open gap ("`globals.css` paints `body`
with the theme background and reserves `scrollbar-gutter: stable` on `html`"). The suite had to
build the `EDGE_UTILITY` guard (`:311-324`) and the `text-white`-on-root guard (`:527-546`)
specifically because of them, and `tests/theme-chrome.test.mjs:274-283` documents the discovery
in detail. The other four ceilings' "not live today" claims I verified and they hold — no
runtime-composed classes in the projected components, no `export … from` in the projected tree,
the downward-only and listed-files limits are structural rather than instances.

So the defect is narrow and surgical: one sentence generalises a true statement about four
ceilings to a fifth where it is false, and it does so in the bullet a reader consults to decide
whether the gate's ceilings need attention now. It also sits in direct contradiction with the
`AD` two hundred lines above it, which is the coherence failure this lens is asked to hunt.

**Repair:** scope the sentence — "Of these, only the CSS-file case is live today, and it is
AD-24's open shell gap: `globals.css:122,125,129` reach the projected tree through rules no
source scan over component files can see. The other four are structural limits with no current
instance." That converts a false reassurance into the pointer the bullet was trying to be.

---

### MEDIUM-5 — AD-24's length is now a defect, and the defect is structural rather than verbal

Measured, so this is not an impression:

| AD | words | | AD | words |
| --- | --- | --- | --- | --- |
| **AD-24** | **2009** | | AD-18 | 435 |
| AD-19 | 821 | | AD-5 | 420 |
| AD-16 | 783 | | AD-23 | 269 |
| AD-17 | 594 | | AD-10 | 257 |
| AD-21 | 586 | | AD-11 | 241 |
| AD-22 | 586 | | *(AD-1..AD-15 rest)* | 68–183 |

AD-24 is **23.5% of all AD text** in the file (2009 of 8561 words) and **2.4×** the next
longest. It is also 13.5% of the entire 14,827-word document. Today's edits added roughly 250
words to the largest AD in the file.

Prior gates ruled that every sub-bullet closes a divergence a lens actually constructed, and I
did not find a sub-bullet that fails that test. So "trim it" is not the finding. The finding is
that **AD-24 is two decisions wearing one number**, and the cost of that shows up in three ways
a reader pays for:

1. Its `[ADOPTED, partial]` tag is earned entirely by the shell clause. The three-tier state-home
   rule (`:210-213`) is fully shipped and fully ratified, and it inherits a partial tag from a gap
   in an unrelated clause — which the tag table at `:69` explicitly says means "the mechanism
   ships, but a named gap remains". A builder consulting the tier rule cannot tell that the tier
   rule has no gap.
2. Its *Binds* line (`:208`) has to name five unrelated things, and its *Prevents* line (`:209`)
   has to say "one hazard with three faces" — a formulation that only exists because three hazards
   were merged.
3. Its ownership is split: the shell clause is owned by Story 17.7; nothing owns the tier rule
   because nothing needs to.

**What I would do, named specifically so it is usable:**

**(a) Split, don't trim — promote the closure to `AD-25` (~1100 words).** `AGENTS.md` forbids
renumbering an existing `AD` and explicitly sanctions "add the next one", so this is the
permitted move. `AD-24` keeps the state-home taxonomy: the three tiers (`:210`), the cookie
clause (`:211`), the persisted-local-holds-a-view-preference clause (`:212`), the
`localStorage`-is-not-AD-10's-channel clause (`:213`), and the client-boundary-placement rule
(`:214`) — five paragraphs that all answer *where does a value live and where does the client
boundary mount*, and that are `[ADOPTED]` outright. `AD-25` takes the room-facing closure: the
three mechanisms (`:215`), the shell-gap clause (`:216`), the Story-17.7 ownership paragraph and
its ratification (`:218-220`), and the two-operator-surfaces exception (`:221`) — four paragraphs
that all answer *what may reach the congregation's screen*, that share one enforcement gate, and
that are `[ADOPTED, partial]` with a named owner. Every existing citation of AD-24 stays valid for
whichever half it meant; both new ADs land near AD-19's 821 and under AD-16's 783, i.e. inside the
file's existing tolerance.

**(b) Move ~340 words of run-record narrative to the memlog, which is a declared companion of
record for exactly this.** Three specific passages, none of which contains an invariant:

- The whole ratification parenthetical (`:220`, ~150 words). The `AD` needs one sentence — "Ratified as an amendment of this file by the `bmad-architecture` Update run of 2026-07-31, at the owner's direction." The self-certification history, the declined waiver, and the two-workflows-in-a-row precedent are process record. The file already states at `:42` that dated run records keep their own form and are not folded in; this is that principle applied to itself.
- The refuted-reason relitigation at `:216` ("**The reason that word is there is not…**" through "…the AD-5 precedent", ~130 words). The rule-bearing content is one sentence: a Server Component never executes in the browser and has no `document`, so no browser-side mechanism closes this gap. That the earlier text said something else, and why a refutable reason is dangerous, is memlog material — and note that the AD-5 precedent is already stated in AD-5 itself (`:98`), so this is its second telling.
- The reference-counting justification at `:215` (~60 words). It duplicates `projected-shell.ts:25-31` almost sentence for sentence, including the "Story 17.1 doubled the callers … Story 17.7 adds a route-group layout" argument. The spine's job is the invariant ("the reference counting is an invariant of this implementation, not an optimisation"); the *why* is already at the point of use, which is where an implementer will meet it, and is additionally pinned by three tests.

Together (a) and (b) take AD-24 from 2009 words to roughly 550 and produce an AD-25 of roughly
900, with **no invariant, no rule and no divergence closure removed** — which is the bar the
brief set.

---

### MEDIUM-6 — the Stack row with a live security consequence is the one row carrying no pointer to it

**Where:** `ARCHITECTURE-SPINE.md:239` and `:250`, against `:383`.

Deferred `:383` records that `next@16.2.10` predates the **16.2.11** July 2026 security release
— nine CVEs, four High, two of them touching decisions in this spine — and that bumping it
"belongs before first deploy". That is a serious, well-argued item.

The Stack table's Next.js row is:

```
| Next.js | 16.2.10 (App Router, `output: "standalone"`) |
```

No annotation, no pointer. Meanwhile three neighbouring rows *do* carry inline pointers: Node
(`:238`, "see *Deferred*"), shadcn (`:248`, a full explanation of why it earns a row),
next-themes (`:249`, "see *Deferred*, because that is not the same as active"). The
`eslint-config-next` row (`:250`) pins the same `16.2.10` and is likewise bare.

So the table teaches a reader that an unannotated row is a clean row, and then leaves the one
row with a known-vulnerable pin unannotated, 144 lines from the bullet that explains it. The
Stack table is what a builder copies a version from.

**Repair:** append to `:239` — "**16.2.11 supersedes this** (nine CVEs, four High, 2026-07-21) —
see *Deferred*; bump before first deploy" — and add "(moves with `next`)" to `:250`. This is a
one-line change and it is the highest ratio of safety to effort in the file.

---

### MEDIUM-7 — CI and the release gate are a silent dimension that `AD-21` binds by name

**Where:** `ARCHITECTURE-SPINE.md:190` (AD-21 *Binds*), `:192`, `:232` (Testing convention),
against `.github/workflows/test.yml`.

AD-21's *Binds* line names "**the release procedure**", and its Rule turns on release
boundaries: "the whole batch of unreleased transitions is compacted into a single transition
**before it reaches production**", "once a version has reached production it is never
renumbered", "Small steps … stop at **the merge**; production sees one transition per release."

Nothing in the spine says what a release *is*, what promotes a merge to production, or whether
CI gates it. No `AD` decides it and no *Deferred* bullet defers it. The operational envelope is
otherwise well covered — AD-4 fixes deployment, environments and provider; four bullets defer
observability, durability, secrets and performance with the current floor named in each. This is
the one gap in it, and it is not a gap I had to invent: AD-21's frozen-released-version rule is
*unenforceable without it*, because "has this version reached production" has no defined answer.

The gap has a live cost right now. `.github/workflows/test.yml` runs on `push: main` and
`pull_request: main` only, and does `npm ci` → `npm run build` → `npm test`. The current branch
is `fix/ci-build-before-tests`, whose commit message is "build before testing, so the auth-HTTP
gate can actually run" — i.e. the ordering inside that pipeline is load-bearing for whether a
declared gate executes at all, exactly as the Testing convention at `:232` says of suite
registration ("an unregistered test file never runs, locally or in CI, and nothing detects the
omission"). Two conventions lean on CI and no decision owns it.

**Repair (deferral is sufficient — this does not need an `AD` today):** add a *Deferred* bullet.
"**No decision fixes the build/release gate, and AD-21 binds one.** `.github/workflows/test.yml`
runs `npm ci` → `npm run build` → `npm test` on `main` pushes and PRs to `main`; the build step
is required for `tests/auth-http.test.mjs` to run at all, and the pipeline's step order is
therefore load-bearing for whether an AD-delegated gate executes. Nothing defines what promotes a
merge to production, which is the boundary AD-21's *released version is frozen* rule turns on.
Current floor: the workflow file plus manual deploy (`docs/deploy.md`). Revisit before first
deploy — the same milestone AD-4 dates."

---

### MEDIUM-8 — the Invariants preamble's blanket claim no longer holds

**Where:** `ARCHITECTURE-SPINE.md:73` — "AD-16..AD-22 land with Epic 20; everything else is
shipped."

AD-24's shell clause does not ship for the two Server-Component room-facing shells; AD-10's
plan-identity clause is `[TARGET]` inside an `[ADOPTED, partial]` AD; AD-6 has four live bypass
paths. All three are honestly tagged and all three gaps are in *Deferred*, so the tag system
works — but the preamble sentence contradicts it, and it is the sentence a reader hits first,
before the tags. It was written when AD-23 and AD-24 did not exist.

**Repair:** "AD-16..AD-22 land with Epic 20. Everything else ships, with three named partials —
AD-6, AD-10 and AD-24 — whose gaps are recorded in *Deferred*." Rated MEDIUM rather than LOW
because it is the file's own reading instructions.

---

### LOW-1 — the `projected-shell.ts:34-36` citation is off by a line at the start

**Where:** `ARCHITECTURE-SPINE.md:393`.

The false clause is "and a Server-Component layout can reach it without a hook", which begins
mid-line **35** and ends on **36**. Line 34 is the other half of the same sentence ("…so it is
testable with a document stub in the `node:test` harness"), which is true. So `:34-36` is neither
the sentence (33-36) nor the clause (35-36) and includes a true statement inside a citation for a
false one. The quoted text itself is verbatim-correct. **Repair:** cite `:35-36`, or `:33-36`
if the intent is the whole sentence.

### LOW-2 — `projected-shell.ts` is the weakest of the fourteen unwalked modules to have named

**Where:** `ARCHITECTURE-SPINE.md:392`.

The bullet names `projected-shell.ts` as its example of a module the `.tsx`-only walk leaves
unwalked. Structurally true — I confirmed it is one of the fourteen. But it is the *one* of the
fourteen that is separately and explicitly guarded: `tests/theme-chrome.test.mjs:547-556`
("AC-4: the shell claim paints a literal, never a token") reads
`src/lib/projected-shell.ts` directly and asserts `themeReferences(claim)` is empty, plus two
literal-colour assertions. So the example reads as "the shared shell implementation is
unguarded" when it is in fact the best-guarded `.ts` module in the tree, and the ceiling looks
less serious than it is. Better examples from the same fourteen:
`src/lib/artifacts/hydrate.ts` and `src/lib/registry/validate.ts` — both on the plan's
hydration path that AD-12 makes room-facing, and neither asserted anywhere in the suite.
**Repair:** name one of those and keep `projected-shell.ts` with the parenthetical that it is
separately asserted, which strengthens the bullet rather than weakening it.

### LOW-3 — the `notFound()` site count is right for projected URLs but reads as a whole-repo count

**Where:** `ARCHITECTURE-SPINE.md:218`, `:393`, `:395` — "`notFound()` at six reachable sites".

`git grep -n "notFound()" -- src` returns **eleven** call sites across four files. Six is the
correct count for the *projected* routes (`projector/page.tsx:37,49,55` and
`slideshow/page.tsx:38,50,56`); the other five are `services/[id]/page.tsx:40,58` and
`present/page.tsx:47,59,65`, of which `present/` is the operator's presenter route. The claim is
therefore accurate and its scope is merely unstated — but "six reachable sites" against a repo
that greps eleven is the kind of number a later reviewer will flag as wrong. **Repair:** "at six
sites under the two projected routes". Worth noting the missing `not-found.tsx` hurts the
presenter route too, which is closer to room-facing than the operator hub.

### LOW-4 — `tw-animate-css` fails the Stack table's own stated criterion for a row

**Where:** `ARCHITECTURE-SPINE.md:248`, against `src/app/globals.css:2` and `package.json`.

The `shadcn` row earns its place with an explicit criterion: "a **runtime** dependency, not just
a generator: `globals.css:3` does `@import "shadcn/tailwind.css"`, so it feeds the same palette
file AD-24 cites." `tw-animate-css` (`^1.4.0`) is imported one line earlier, at `globals.css:2`,
by the identical mechanism into the identical file — and has no row. The row was added because
"the `@base-ui/react` row above used to name shadcn while pinning a different package's version,
which made an auditor read this as already covered", which is the same failure mode.
**Repair:** add the row, or state that the table lists only rows an `AD` cites. (`lucide-react`,
`clsx`, `tailwind-merge` and `class-variance-authority` are also unlisted but none is imported
into the palette file, so they do not trip this criterion.)

---

## Part 3 — Rubric summary

| Rubric dimension | Result |
| --- | --- |
| Fixes the real divergence points for the level below, misses none | **Pass.** No missing divergence found. AD-24's sub-bullets each close a constructed one; I attempted and failed to find one that does not. |
| Every `AD`'s Rule is enforceable and prevents its stated divergence | **Fail at one point — HIGH-1.** AD-24's closure rule delegates to a gate whose assertion cannot express the mechanism the chosen fix uses, and whose "never its own copy" half is unasserted. The AD-5 analogy that vouches for it is false in the respect that matters. All other ADs pass, with AD-6, AD-10 and AD-24 honestly tagged partial. |
| Nothing under Deferred could let two units diverge | **Pass with one repair — MEDIUM-4.** The bullets are unusually specific about what is bounded. One reassurance sentence is false and conceals the live case. |
| Named tech verified-current | **Pass on drift, one presentation defect — MEDIUM-6.** Zero drift vs `package.json`. The known-vulnerable `next` pin is the one row with no pointer to its own Deferred item. |
| Ratifies rather than contradicts the brownfield codebase | **Strong pass.** ~40 citations resolved; one stale (MEDIUM-2), one off-by-one (LOW-1), one scope-unstated (LOW-3). The 14-module arithmetic, `:384`, `:432`, the 19-line binding, `grep -c componentImports` → 0 and 43/43 green all verified exactly. Both new Deferred defects reproduced. |
| Every owned dimension decided, deferred, or open — no SILENT dimension | **One silent sub-dimension — MEDIUM-7.** Operational/environmental envelope otherwise fully covered (AD-4 + four floors named). CI / build-release gate is bound by AD-21 and owned by nothing. |
| Internal coherence after today's edits | **Fail at three points — MEDIUM-3.** Structural Seed `:310`, Conventions `:230`, mermaid `:280`. Design Paradigm clean; no residual `componentImports` or `@/lib`-exemption citation anywhere. Plus MEDIUM-8 on the preamble. |
| Readability at the altitude | **Fail — MEDIUM-5.** AD-24 at 2009 words is 23.5% of all AD text and 2.4× the next longest. Structural, not verbose: split to AD-25 (~1100 words) and move ~340 words of run record to the declared memlog companion, losing no invariant. |

## Required before this Update run closes

1. **HIGH-1** — reconcile `:393`'s `FULL_SCREEN` instruction with `:216`'s corrected reason; soften the AD-5 analogy at `:215`.
2. **MEDIUM-2** — `slideshow/page.tsx:76` → `:88`, both sites.
3. **MEDIUM-3** — Structural Seed `:310`, Conventions `:230`, mermaid `:280`.
4. **MEDIUM-4** — scope `:392`'s "None of these shapes exists" sentence.

## Recommended in the same change set

5. **MEDIUM-6** — annotate the `Next.js` Stack row (one line, highest safety-per-word in the file).
6. **MEDIUM-8** — repair the preamble at `:73`.
7. **LOW-1**, **LOW-3** — citation precision.

## Recommended as follow-on spine work

8. **MEDIUM-5** — the AD-24 → AD-24 + AD-25 split. Not a blocker for this run; it is the largest single readability win available and it also resolves the inherited-partial-tag problem.
9. **MEDIUM-7** — the CI / release-gate deferral bullet.
10. **LOW-2**, **LOW-4** — example choice and the `tw-animate-css` row.

## Filed as code changes, not spine changes (already correctly recorded at `:393`)

- `src/lib/projected-shell.ts:35-36` — the false "a Server-Component layout can reach it without a hook" sentence.
- `src/lib/projected-shell.ts:74-88` — `claimProjectedShell` ignoring `doc` after the first claim.

Both verified live. Neither is reachable today. Both are correctly deferred to Story 17.7 rather
than fixed by this gate.
