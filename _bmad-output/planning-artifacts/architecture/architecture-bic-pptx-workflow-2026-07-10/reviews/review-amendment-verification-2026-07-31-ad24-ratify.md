# Amendment Verification — the 2026-07-31 AD-24 ratification run

**Lens:** ad-hoc amendment verification, `bmad-architecture` Reviewer Gate
**Date:** 2026-07-31
**Subject:** the uncommitted working-tree change to
`_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md`
(diff against `HEAD` = `fe27523`) plus its `.memlog.md` record, entries 4–8 of that file's tail.
**Commissioned by:** owner decision at
`_bmad-output/implementation-artifacts/stories/17-1-reachable-dark-mode.md:239`, patch item at `:269`,
tracked at `_bmad-output/implementation-artifacts/sprint-status.yaml:148`.

**Verdict: the spine work is done and factually sound — every claim the run added verified against
the code — but the run did not close the record that gates it, and it exceeded the owner's stated
scope in one clause without surfacing that it had.** Nine findings: 1 high, 1 medium-high, 3 medium,
4 low. No finding disputes a fact the run asserted; the defects are coverage, authority and sweep.

---

## 1. Commission coverage

The commission had three parts. **All three landed in the spine. None landed in the record.**

| Commissioned | Where it landed | State |
|---|---|---|
| Ratify-or-restate the `:218` edit | `ARCHITECTURE-SPINE.md:220` — the self-certification note *"Recorded 2026-07-31 by `bmad-dev-story` as a citation repair, not an amendment"* is replaced by a ratification record naming this run and the owner's direction | **Addressed, ratified** |
| Ratify-or-restate the `:393` edit | `ARCHITECTURE-SPINE.md:393` — parenthetical inserted at the head of the bullet: *"(This entry is the second of the two inline `bmad-dev-story` edits the owner routed through the 2026-07-31 Update run — **ratified here on the same terms as the `AD-24` paragraph**…)"* | **Addressed, ratified** |
| Repair the stale `@/lib` / `componentImports` bullet at `:392` | `ARCHITECTURE-SPINE.md:392` rewritten; the dead symbol and the dead `:233` citation are gone (`grep -o ':233' ARCHITECTURE-SPINE.md` → no match), and the replacement describes the *real* ceiling rather than deleting the bullet, which is what the patch item asked for | **Addressed** |

Both ratifications verified as *ratifications* rather than restatements, and the run's ground for
that verified too: Story 17.7 is registered at `sprint-status.yaml:173`
(`17-7-projected-shell-route-group: backlog`) and at `epics.md:319`, so the `:218` paragraph's claim
to have an owning key is true.

### F1 — HIGH — the blocking record was not closed, so the tracker still reads as blocked on a run that has landed

`sprint-status.yaml:148` still states verbatim:

> **BLOCKING: the owner ruled that the inline `ARCHITECTURE-SPINE.md` edit (`:218`, `:393`) goes
> through a `bmad-architecture` Update run before 17.1 can be `done`, and the stale
> `@/lib`/`componentImports` bullet at `:392` should be repaired by that same run rather than a
> different hand.**

`git diff` on `sprint-status.yaml` shows exactly two changed lines (`:31` and `:148`), both authored
by the round-3 `bmad-code-review` pass, neither mentioning the ratification. The story is worse:

- `stories/17-1-reachable-dark-mode.md:239` — the decision item is still `- [ ]`, unchecked, with no
  closure note.
- `stories/17-1-reachable-dark-mode.md:269` — the `:392` patch item is still `- [ ]`, although the
  run has repaired `:392`.
- `grep -n "bmad-architecture Update\|Ratified" stories/17-1-reachable-dark-mode.md` → **no match**.
  The story does not record that the gate ran at all.

This is the failure mode `AGENTS.md` names twice ("never leave docs lying"; the same-change-set
rule), and the run regressed against its own precedent: the previous Update run's memlog entry
records *"Same-change-set artifacts updated so nothing is left lying: story 17-1 twelfth patch item
checked off with the AD-24 resolution AND the new high finding filed against its own change set with
no owner, and sprint-status.yaml carries both."* This run's memlog has no equivalent line. A reader
of the tracker today concludes 17.1 is still blocked on work that is sitting finished in the working
tree beside them.

Not scored as a spine defect — the spine is correct. Scored high because the artifact
`AGENTS.md` designates as the sprint-tracking source of truth now asserts a false prerequisite on the
row that gates closing the story.

### F2 — MEDIUM-HIGH — a new code-owned finding was filed only in prose, with no key

The run raised a genuine new defect against production code (see §3, verified true) — the false
header comment at `src/lib/projected-shell.ts:34-36` — and its memlog says *"Code-owned, filed not
fixed: an architecture Update run does not patch production code."* Where it was filed is the
problem. `grep -rn "Server-Component layout can reach" _bmad-output/` returns exactly two hits: the
memlog entry, and the spine's own Deferred prose at `:393`. It is **not** in
`_bmad-output/implementation-artifacts/deferred-work.md`, not in the story, not in
`sprint-status.yaml`, and carries no `[Review][Patch]` item or story key.

The contrast is sharp and in the same working tree: the *sibling* finding in the same memlog entry —
`claimProjectedShell` ignoring its `doc` argument — **is** filed properly, in
`deferred-work.md`'s new `### Round 3 of the same review (2026-07-31)` section with
`owner: Story 17.7 (17-7-projected-shell-route-group)`. One of the two got a key; the other got a
paragraph. This project has stated its own history on this precisely — *"a decision recorded without
a key is how this project has repeatedly lost findings"* (`sprint-status.yaml:148`) — and a false
comment in the module a 17.7 implementer opens first is exactly the kind of finding that gets lost.

**Recommendation:** add a `deferred-work.md` entry beside the `doc`-argument one, owned by 17.7 or by
a bugfix, since the correction is a one-sentence code edit.

---

## 2. Overreach — the AD-24 clause changes at `:215` and `:216`

The owner's scope sentence is narrow and explicit (`story:239`): *"The run's scope is the two AD-24
edits this commit made at `:218` and `:393`: ratify them as an amendment or restate them, and while
the spine is open, repair the stale `@/lib` / `componentImports` bullet at `:392`."* The run also
changed two clause bullets that are not on that list.

**What changed at `:215`** (the closure clause of an `[ADOPTED, partial]` rule):

1. *Module naming.* `"through the one shared hook src/lib/use-projected-shell.ts and never its own
   copy"` → `"through **one shared implementation, never its own copy** (the DOM half is
   src/lib/projected-shell.ts — claimProjectedShell, **reference-counted**, only the first claim
   snapshots and only the last release restores — and src/lib/use-projected-shell.ts is a
   nineteen-line React binding over it)"`.
2. *A new named invariant, appended:* **"The reference counting in that shared implementation is an
   invariant of it, not an optimisation:"** … *"What the split does **not** buy is Server-Component
   reach — see the gap below."*

**What changed at `:216`**: the stated reason for the word *client* in the closure clause. The
sentence *"the clause says **client** surface because a React hook cannot run in a Server
Component"* was replaced by an explicit retraction of that reason plus the binding one (a Server
Component never executes in the browser and has no `document`, so no browser-side mechanism closes
the gap).

### The case that this is within "restate"

- The two ratified paragraphs cannot stand on clauses that contradict them. `:218` instructs the
  implementer *"`useLayoutEffect` is not a shortcut, because the paint that leaks is the **server's**"*
  — which the pre-existing `:216` reason directly undercut. Ratifying `:218` under this file's
  authority while leaving `:216` asserting the reason `:218` refutes would ratify an internal
  contradiction. The spine's own standing rule is invoked in the new text and pre-dates this run:
  *"a rule defended by a refutable reason is a rule that gets reverted (the AD-5 precedent)."*
- The module-naming fix is the **same defect class** the owner did assign. The `:392` patch item was
  assigned because the spine "points at a dead symbol at a dead line number". `:215` named
  `use-projected-shell.ts` as the mechanism after round 2 had moved the mechanism to
  `projected-shell.ts` — a superseded module name in a rule clause, arguably a worse instance of the
  same thing. Fixing one and knowingly leaving the other in the same file, in the same run, is hard
  to defend.
- `AGENTS.md` gives spine content to this skill and to no other host. Once the file is legitimately
  open under this authority, correcting a factually superseded clause is the gate doing its job, not
  scope creep.

### The case that it is unrequested clause change

- The owner's directive enumerates three targets by line number. `:215` and `:216` are not among
  them, and the decision item's closing logic is explicitly about *who gets to decide how much is
  too much*: *"whether it is **enough** more to need the gate is the owner's call, not this
  workflow's."* Applying an unrequested clause change is the mirror image of the offence the owner
  had just ruled against — a workflow deciding for itself that its edit is small enough.
- Item 2 is not a restatement of anything. **"The reference counting … is an invariant of it, not an
  optimisation"** creates a new binding constraint inside AD-24, and it binds an **unbuilt** story:
  Story 17.7's route-group layout is now required to preserve reference counting as an invariant,
  decided without the owner being asked. Elevating an implementation property to an invariant is
  precisely the structural change `AGENTS.md` routes through this gate — which is satisfied here in
  form, but the owner was not told a new invariant was being added.
- The run knew. Its own memlog entry opens *"AD-24 amended at :215 and :216, and **this is the
  substantive half of the run rather than a citation fix**."* That is self-aware exceedance — and
  unlike the previous Update run, which recorded two items as *"NOT done and reported to the owner
  instead of acted on"*, this run recorded no owner-visible flag on any of it.

### Verdict

**Split, and the split is the finding.** The `:216` reason correction and the `:215` module rename are
**within** a defensible reading of "ratify or restate": both are corrections *required* for the
ratified paragraphs to be true, both are the same defect class the owner assigned, and both were
verified rather than asserted. Neither should have been surfaced as a decision.

The new **invariant sentence** is **not** a restatement and is scored as overreach — not because it
is wrong (it is correct, and the code backs it) but because a new invariant binding an unbuilt story
is exactly the class of change the owner reserved to themselves one round earlier, and the run's own
record shows it recognised the change was substantive without flagging it.

### F3 — MEDIUM — a new named invariant was added to AD-24 outside the owner's stated scope, unflagged

`ARCHITECTURE-SPINE.md:215`, the sentence beginning *"The reference counting in that shared
implementation is an invariant of it, not an optimisation."* Facts correct, authority not sought, no
"reported instead of acted on" line in the memlog. **Recommendation:** surface it to the owner as a
one-line ratification of an addition, or move it to a non-clause position (Deferred, or the
`:218` implementer note) where it informs 17.7 without binding it.

### F4 — LOW — a new prescriptive convention entered Deferred on the same unsurfaced footing

`ARCHITECTURE-SPINE.md:392` closes with *"treat the next list-widening as a signal to encode the
criterion instead"*, and the same bullet promotes a three-round process pattern to spine altitude.
Same authority question as F3, materially lower stakes because Deferred is not a rule clause and the
promotion is well argued (a gate an `AD` names does own its failure mode). Recorded for completeness,
not for action.

---

## 3. New defects — every added factual claim, checked against the code

All checks run against the working tree at review time.

| Claim (spine location) | Check | Result |
|---|---|---|
| DOM half is `src/lib/projected-shell.ts`, React binding is `src/lib/use-projected-shell.ts` (`:215`) | both files exist; `use-projected-shell.ts:4` imports `claimProjectedShell` from `./projected-shell` | **TRUE** |
| `claimProjectedShell` is reference-counted; only the first claim snapshots, only the last release restores (`:215`) | `projected-shell.ts:75` snapshot+write gated on `if (claims === 0)`; `:88` `claims += 1`; `:94-98` release decrements and restores only when `claims === 0` | **TRUE** |
| "a **nineteen-line** React binding" (`:215`) | `src/lib/use-projected-shell.ts` is exactly 19 lines | **TRUE** |
| Story 17.1 took the callers from one to two (`:215`) | `grep -rn useProjectedShell src/` → two call sites: `ProjectorClient.tsx:96`, `SlideshowClient.tsx:33` | **TRUE** |
| `grep -c componentImports tests/theme-chrome.test.mjs` → 0 (`:392`) | ran it: **0** | **TRUE** |
| the walk is `moduleImports` at `:384` (`:392`) | `tests/theme-chrome.test.mjs:384` is `function moduleImports(file) {` | **TRUE** |
| no directory is exempt by name any more (`:392`) | the only filter in `moduleImports` is `inRepo` (`:392` of the test — `.` or `@/` prefix); no path/directory predicate anywhere in the walk | **TRUE** |
| the queue enqueues `.tsx` only, at `:432` (`:392`) | `tests/theme-chrome.test.mjs:432` — `if (resolved.endsWith('.tsx') && !seen.has(resolved))` | **TRUE** |
| "**fourteen** modules reachable from the projected tree unwalked, `projected-shell.ts` among them" (`:392`) | replicated both walks off the real `PROJECTED` set and the real `moduleImports`: modules the full (`.ts`+`.tsx`) closure reaches that the shipped walk never reaches = **14**, and `src/lib/projected-shell.ts` is one of them (the others: `artifacts/hydrate.ts`, `artifacts/registry-snapshot.ts`, `auth/password.ts`, `hymn-sections.ts`, `images.ts`, `lyrics.ts`, `parser.ts`, `registry/asset-safety.ts`, `registry/seed.ts`, `registry/store.ts`, `registry/types.ts`, `registry/validate.ts`, `uploads.ts`) | **TRUE — exact** |
| `export … from` is invisible to `moduleImports`, live at `src/lib/parsed-fields.ts:432` (`:392`) | `parsed-fields.ts:432` is `export { songNumbersFromParsed } from './worship-form-fields';` — and it is the only `export … from` in `src/lib/` or `src/components/` | **TRUE** |
| `SlideView` / `ArtifactSlide` take no `className` (`:392`) | `SlideView.tsx:18` — `({ slide }: { slide: SlidePlanItem })`, and `:11-16` documents the deliberate omission; `ArtifactSlide.tsx:220-229` likewise, `className` appearing only on its own element at `:239` | **TRUE** |
| `projected-shell.ts:34-36`'s *"a Server-Component layout can reach it without a hook"* is **FALSE** (`:393`) | the comment is there and says that; a Server Component never executes in the browser and has no `document`, and `claimProjectedShell(doc)` dereferences `doc.documentElement.style` (`:77`), so a Server Component cannot call it — the run's correction is right | **TRUE (the comment is false)** |
| the suite is 43 tests (`:392`) | ran `tests/theme-chrome.test.mjs`: **43 pass / 0 fail** | **TRUE** |
| round 3 found "**nine** further ways it is narrower than it reads" (`:392`) | the story's guard section states *"Nine ways it is narrower than it reads"* and enumerates exactly nine `[Review][Patch]` items | **TRUE** |
| "four of its first seventeen assertions were satisfiable by a word in a comment" (`:392`, pre-existing) | survived the rewrite with substance intact (only an em dash became a colon) | **SURVIVED TRUTHFULLY** — see F8 for the caveat |

Two claims warrant findings.

### F5 — MEDIUM — the ceiling bullet gained a guarantee that round 3 reproducibly defeated, and omits that ceiling

`ARCHITECTURE-SPINE.md:392` now reads that the suite *"asserts that `SlideView` and `ArtifactSlide`
take **no `className` at all**, so a caller styling a projected slide from the outside is a compile
error rather than a test failure."* Two problems, in a bullet whose entire subject is what the guard
**cannot** see:

1. The assertion is `exportedProps` (`tests/theme-chrome.test.mjs:471-484`), consumed at `:486-500`.
   It slices the literal parenthesised parameter list after `export default function` and greps it
   for `className`. Round 3 filed and **reproduced** the defeat: rewrite `SlideView` as
   `type SlideViewProps = { slide: SlidePlanItem; className?: string }` with a wrapper forwarding it,
   and the suite is **43/43 green and `tsc --noEmit` clean** — so in the defeated state it is neither
   a compile error *nor* a test failure. `Header.tsx:9` already uses that named-props shape, so it is
   house style rather than a contrivance.
2. The `so` mis-attributes the mechanism. The compile error comes from the *code's* signature, not
   from the assertion; the assertion is the only thing guarding the signature, and it is the weak
   link round 3 named.

The previous wording — *"guards `className` on `SlideView`/`ArtifactSlide`, each spelling
negative-tested"* — was vaguer but not overclaimed. The run's memlog defends the change as
*"a stronger property than the one the spine was crediting"*, which is true of the code and false of
the enforcement. This is the same overclaim shape the bullet's own new pattern paragraph warns
about, committed in the paragraph that warns about it. **Recommendation:** add the named-props-type
ceiling to the list of things the guard cannot see, and attribute the compile error to the signature.

### F6 — LOW — the `:34-36` citation is off by one line

The quoted fragment *"a Server-Component layout can reach it without a hook"* begins at
`src/lib/projected-shell.ts:35` and ends at `:36`; line 34 is the preceding clause about the
`node:test` document stub. The spine cites `:34-36`. Harmless in itself, and noted only because the
sentence it appears in is the run's own correction of a dead citation.

### F7 — LOW — "18 injected defects" is now a spine-altitude fact with no enumerated record

`:392` carries *"the rebuild that answered that took it to 43 tests with 18 injected defects each
confirmed to make it react."* Round 3 explicitly considered the objection to this figure and
**dismissed** it (*"the claim is about 18 specific injections that all did react"*), so repeating it
is consistent with the review's own disposition, and the spine immediately juxtaposes the nine
round-3 injections that stayed green — which is honest. The residue: the 18 are a `bmad-dev-story`
self-report enumerated nowhere in any tracked artifact (`grep -rn "18 injected" _bmad-output/` finds
only restatements of the claim), and it now sits in the spine as fact. Informational.

### F8 — LOW — "first seventeen assertions" is unverifiable from the repository

Pre-existing text, correctly preserved, so not a defect of this run. Recorded because a future
verifier will try: `git log -- tests/theme-chrome.test.mjs` has only two revisions (`3f210c7`,
`517f6c1`), whose suites ran 28 and 43. The 17-assertion version never reached a commit, so the claim
rests on the round-1 record alone.

---

## 4. Retraction sweep

Searched the whole file for `use-projected-shell`, `useProjectedShell`, `componentImports`, `@/lib`,
`projected-shell`, `:233`, and *"a React hook cannot run"*.

**Clean:**

- `componentImports` — one occurrence, `:392`, inside the retraction itself. No other site.
- `:233` — gone; no dead citation remains.
- *"a React hook cannot run"* — one occurrence, `:216`, inside the explicit retraction.
- `@/lib` — `:124` (AD-10's `@/lib/present-channel`, unrelated and correct) and `:392`'s retraction.
- **`Consistency Conventions` "Client state" row (`:230`)** — describes the three tiers, the
  room-facing read prohibition and the AD-5 cookie exclusion. Names no module and no mechanism.
  Carries nothing retracted; needs no change.
- **`Design Paradigm` (`:31-36`)** — *"Server Components are the default; `'use client'` is added only
  where hooks, browser APIs, or event handlers require it — including at the root…"*. Consistent with
  the amended `:214` boundary clause; carries nothing retracted; needs no change.
- Tag legend `:69` (`[ADOPTED, partial]` = *"the mechanism ships, but a named gap remains. The gap is
  recorded in Deferred"*) — satisfied: the gap is in Deferred at `:393`.

**Two misses.**

### F9 — MEDIUM — the source-tree map at `:310` still names the retracted module as the mechanism

`ARCHITECTURE-SPINE.md:310`, inside the `src/` tree map:

```
                     #   + use-projected-shell.ts -- the ONE app-shell reset every full-screen room-facing surface calls (AD-24)
```

This is verbatim the naming `:215` was amended to retract — the run's own memlog calls the fix
*"(1) MODULE NAMING"* and gives the reason: *"naming the wrong half of the split is how a third
surface ends up snapshotting the second one's black and restoring it to the operator's whole app
shell."* The map compounds it by omitting `src/lib/projected-shell.ts` entirely, so a reader
orienting from the map finds only the hook and no reference-counted core at all — the exact reading
path the amendment exists to close, left open one screen away in the same file. Severity medium
rather than low because the tree map is the orientation surface a new implementer (Story 17.7's)
reads before the AD text.

**Recommendation:** `+ projected-shell.ts -- the reference-counted app-shell reset (AD-24), with
use-projected-shell.ts as its React binding`.

### F10 — LOW — `:393` keeps the hook as the stated reason the shells cannot close the gap

`ARCHITECTURE-SPINE.md:393` still reads *"are **Server Components** and therefore cannot call
`useProjectedShell()`"*. Narrowly true, and materially mitigated by the sentence the run added later
in the same bullet (*"the shared implementation's React-free DOM half does **not** give the server a
way in"*). But *"therefore cannot call `useProjectedShell()`"* is the refutable framing `:216` just
retracted, in the bullet `:216` points the reader to. Rewriting it to *"never execute in the browser,
so no browser-side call — hook or direct DOM — reaches them"* would make the retraction complete.

---

## 5. Same-change-set discipline — `EXPERIENCE.md` and `DESIGN.md`

Report only; nothing edited. Round 3 filed `EXPERIENCE.md:93` and `DESIGN.md:99,204` as separate
patch items owned by `bmad-ux`.

**`DESIGN.md` — no new obligation.** Searched it for `projected-shell`, `useProjectedShell`,
`componentImports`, `@/lib`, `reference-count` and `React hook`: no match on any. Its two filed lines
(`:99`, `:204`) are about `LogoutButton` and the untokenized red pair — untouched by today's change,
and neither made newly wrong by it.

**`EXPERIENCE.md` — one narrow new obligation, and it is *not* covered by the filed item's text.**

- `EXPERIENCE.md:93` states the shell behind the projected tree — *"the root layout, a `notFound()`
  at a room-facing URL, the server's first paint **before any hook runs**"* — is Story 17.7's
  contract. *"Before any hook runs"* is the framing spine `:216` retracted **today** as the
  refutable reason, and after today it is the last live instance of it in the two spines' downstream
  corpus. The already-filed item against `:93` is about two different things (the *"both route
  shells"* scope error and the *"every projected focusable"* overclaim) and does not mention this
  phrase, so a `bmad-ux` pass that fixes only what is filed will leave it standing.
- Also on `:93`: *"`useProjectedShell` now does it for both surfaces."* This one is **still true** —
  the two client surfaces do call the hook (`ProjectorClient.tsx:96`, `SlideshowClient.tsx:33`) — and
  needs no change. Flagged so the `bmad-ux` pass does not over-correct it into a false statement
  while fixing the phrase above.

**Recommendation:** fold *"before any hook runs"* into the existing `bmad-ux`-owned item on
`EXPERIENCE.md:93` rather than opening a second one. No new obligation on `DESIGN.md`.

---

## 6. AD ID integrity — clean

- `grep -c '^### AD-'` → **24**, identical to `HEAD`.
- `diff <(git show HEAD:…ARCHITECTURE-SPINE.md | grep '^### AD-') <(grep '^### AD-' …)` → **identical**,
  byte for byte, including every status tag.
- No `AD-n` added. Nothing renumbered. No retired ID reused. AD-24's heading tag is still
  `[ADOPTED, partial]` at `:207`, which is correct — the gap is unclosed and Story 17.7 owns it.
- The `## AD map — the 2026-07-30 fold-in` table (`:38-42`) is untouched, so the one recorded
  renumbering waiver is not disturbed and no second waiver was taken.

`AGENTS.md`'s hard rule held.

---

## Findings, collected

| # | Sev | Finding | Location |
|---|---|---|---|
| F1 | **high** | The blocking record was never closed: `sprint-status.yaml:148` still asserts the Update run as an unmet prerequisite, and story `:239` / `:269` are still unchecked with no mention of the ratification anywhere in the story | `sprint-status.yaml:148`; `stories/17-1-reachable-dark-mode.md:239,269` |
| F2 | **medium-high** | The run's new code finding (`projected-shell.ts:34-36`) is filed only in spine prose and the memlog — no `deferred-work.md` entry, no key, while its sibling finding from the same memlog entry got one | `ARCHITECTURE-SPINE.md:393`; `deferred-work.md` (absent) |
| F3 | **medium** | Overreach: a new named invariant ("the reference counting … is an invariant of it, not an optimisation") was added to AD-24's closure clause outside the owner's stated scope and never surfaced, though the memlog calls the change substantive | `ARCHITECTURE-SPINE.md:215` |
| F5 | **medium** | The ceiling bullet now credits the suite with a `className` guarantee round 3 defeated at 43/43 green **and** `tsc` clean, and omits that ceiling from the list | `ARCHITECTURE-SPINE.md:392`; `tests/theme-chrome.test.mjs:471-500` |
| F9 | **medium** | Retraction sweep miss: the source-tree map still names `use-projected-shell.ts` as "the ONE app-shell reset", and omits `projected-shell.ts` entirely | `ARCHITECTURE-SPINE.md:310` |
| F4 | low | A new prescriptive convention entered Deferred on the same unsurfaced footing as F3 | `ARCHITECTURE-SPINE.md:392` |
| F6 | low | `:34-36` citation is off by one line; the quoted fragment is at `:35-36` | `ARCHITECTURE-SPINE.md:393` |
| F7 | low | "18 injected defects" is now spine-altitude fact with no enumerated record anywhere | `ARCHITECTURE-SPINE.md:392` |
| F8 | low | "first seventeen assertions" is unverifiable from git (pre-existing, correctly preserved) | `ARCHITECTURE-SPINE.md:392` |
| F10 | low | `:393` keeps *"therefore cannot call `useProjectedShell()`"*, the framing `:216` retracted | `ARCHITECTURE-SPINE.md:393` |

**Nothing here disputes a fact the run added.** Every verifiable claim it introduced — module names,
reference-counting behaviour, nineteen lines, `componentImports` → 0, `moduleImports` at `:384`,
`.tsx`-only enqueue at `:432`, fourteen unwalked modules with `projected-shell.ts` among them,
`export … from` at `parsed-fields.ts:432`, both components taking no `className`, the false header
comment, 43 tests, nine round-3 narrownesses — checked out, several of them exactly. The commissioned
spine work is complete and correct. What is missing is the sweep (F9, F10), the filing (F1, F2), and
one owner signature (F3).
