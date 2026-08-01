# Adversarial Two-Units Review — ARCHITECTURE-SPINE.md

- **Lens:** Adversarial Two-Units (construct two compliant units that build incompatibly)
- **Run:** 2026-08-01, gate-repair
- **Target:** `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md`
- **Focus:** AD-24 (theme / room-facing chrome closure, lines 207–221) and its *Deferred* entries, rewritten by the Update run of 2026-08-01; secondary sweep over AD-6, AD-10, AD-16, AD-17, AD-19, AD-21
- **Method:** every constructed attack was run against the repository before being recorded. Attacks the code already forecloses are listed in *Foreclosed* with the file:line that forecloses them. `tests/theme-chrome.test.mjs` was executed at HEAD (**48 tests, 48 pass, 0 fail**), which matches the count the spine's *Deferred* entry at `:400` asserts. No file outside this report was modified.

---

## Verdict

**The spine holds against most of the two-units attack, and AD-24's *closure* clause does not.** The decision states that a test is what keeps the room-facing surface closed (`:215`), and then hands the closing of its own named gap to a story whose three permitted mechanisms are each, individually, invisible to that test — one of them for a reason the spine itself records two paragraphs later. Underneath that sit two smaller but sharper structural defects: the AD's Rule body presents the three pre-paint mechanisms as equals while the property AD-24 calls an invariant (release) disqualifies one of them **only in *Deferred***; and the same-day rewrite of the ceiling bullet issues an instruction (`:394`, *widening the root list is the widening to refuse*) that directly contradicts the closure AD-24 has already chosen for Story 17.7 (`:218`, *`FULL_SCREEN` widened to it*). Beyond AD-24, one MEDIUM pair each in AD-16/AD-6, AD-10 and AD-21, and one live walk-through of a ceiling the rewritten bullet declares retracted.

**Nine findings: 4 HIGH, 4 MEDIUM, 1 LOW.** Five constructed attacks were foreclosed by the code and are recorded as such.

---

## F1 — HIGH — AD-24's Rule offers three pre-paint mechanisms as peers; the property AD-24 calls an invariant disqualifies one, and the disqualifier is not in the Rule

**Where.** `ARCHITECTURE-SPINE.md:216` (AD-24 Rule, gap clause) and `:218` (owned-by-17.7 paragraph) name the three mechanisms — *a route-segment stylesheet, a server-set class, or a pre-paint inline `<script>`* — inside the binding text, with no discriminator, and defer the discriminator: *"`Deferred` records what separates the three, because they are **not** interchangeable."* The discriminator itself is at `:398` (Deferred (i)).

**The two units.**

- **Unit A — Story 17.7** (`epics.md:319`, `backlog`). Its mount is decided (route-group layout, owner's 2026-07-31 choice, `:218`); its **mechanism is not**. An implementer reading AD-24 top to bottom sees three named, sanctioned options in a `Rule` clause and picks the cheapest: a route-segment stylesheet. Two lines of CSS in `src/app/(room)/room.css`, no client component, no hook, closes the server's first paint on every projected load. Every word of AD-24's Rule is satisfied.
- **Unit B — the `notFound()` closure** (`:408`). The spine states outright that this closure and 17.7's *"are free to pick different encodings from the three mechanisms above."* Unit B picks the pre-paint inline `<script>`.

**Why they are incompatible.** AD-24 states at `:215` that *"the reference counting in that shared implementation is an **invariant** of it, not an optimisation"* — the whole point being that the shell is **given back** when the last consumer leaves. A stylesheet has no release. Verified against the framework's own documentation, which the spine cites and which is accurate at HEAD: `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md:294` — *"this currently does not remove stylesheets as you navigate between routes."* So Unit A's closure leaves the operator's entire hub pinned at `#000000` with `scrollbar-gutter` suppressed after they press Exit — a failure on the *operator's* screen, produced by a decision whose subject is the *congregation's*. Unit B releases. Two units, two closures of one hazard, opposite post-Exit states.

**Why this is a spine hole and not a story bug.** The Rule clause is the binding text; *Deferred* is by the spine's own framing a list of open items, not an invariant. `:398` even states the constraint correctly — *"what it may **not** do is take a non-releasing mechanism and leave `claimProjectedShell` mounted as though the pair still had a single release path"* — but a builder who obeys AD-24's Rule to the letter has already shipped the defect. The AD names three mechanisms and hands the only property that distinguishes them to a non-binding section.

**Aggravator.** `src/lib/projected-shell.ts:34-36` still tells the next reader *"a Server-Component layout can reach it without a hook"* — false, and it is the file a 17.7 implementer opens first. The spine records this at `:402` and correctly declines to patch production code from an architecture run; it is noted here because it points a Unit-A implementer toward the wrong mental model of what the mount can do.

**Close it with.** Move the release requirement into AD-24's Rule as a property of any closure, not a property of the current implementation: *a mechanism that closes the first paint must also release the shell when the last room-facing surface leaves; a mechanism with no release is not admissible.* That is one sentence and it eliminates one of the three candidates by rule instead of by narrative.

---

## F2 — HIGH — The spine gives two opposite instructions about the same list, both dated to the same rewrite

**Where.** Two clauses, both current, both about `FULL_SCREEN` / `PROJECTED` in `tests/theme-chrome.test.mjs`:

- `:218` (AD-24, owned-by-17.7, ratified 2026-07-31): the closure is *"one layout owning every room-facing URL, **with `FULL_SCREEN` widened to it**."*
- `:400` (Deferred (ii), same ratification): *"the set it applies to **widens to the route group**."*
- `:394` (Deferred, **rewritten 2026-08-01**): *"**the roots are the last instance in this gate, and widening that list is the widening to refuse.**"*

**The two units.** Unit A is the 17.7 implementer, who reads AD-24 and widens `FULL_SCREEN` to the new layout as instructed. Unit B is whoever next maintains the guard — the spine at `deferred-work.md:230` explicitly anticipates that being the same story — who reads `:394` and refuses the widening, on the ground that the spine has just promoted *encode the criterion, do not extend the list* to spine altitude and named this exact list as the one remaining instance.

**Why it matters.** These are not two readings of an ambiguous sentence; they are two imperatives about one edit, written on consecutive days into one document, and the later one does not acknowledge the earlier. The 2026-08-01 rewrite is otherwise scrupulous about superseding what it replaces (it explicitly retracts a narrowing instruction later in the same bullet); this one it does not touch. A reader who resolves the conflict by recency blocks the closure AD-24 has already chosen.

**It is also the harder of the two positions to hold.** `:394` is right that widening the roots is the wrong shape — but the criterion it asks to be encoded (*"which routes are room-facing?"*) has **no structural anchor in this codebase**. AD-5's matcher assertion works because `config.matcher` is a real value the test can read; there is no equivalent value for *room-facing*. Which means the instruction at `:394`, as written, forbids the only available action without naming a substitute. See F10 for the one anchor that could exist.

**Close it with.** Decide which instruction governs and say so in one place. If the roots are to be encoded rather than listed, AD-24 has to name the anchor (a route-group directory, a per-route export, a `layout.tsx` marker) — that is a structural invariant and belongs in the AD, not in *Deferred*. If they are to stay listed, `:394` must be narrowed to *widening the roots without also widening the criterion is what to refuse*, and `:218` left standing.

---

## F3 — HIGH — Whichever mechanism Story 17.7 lands, `tests/theme-chrome.test.mjs` guarantees nothing about it, so AD-24's "a test is what keeps it closed" is false exactly where AD-24 is partial

**Where.** AD-24's closure clause is titled *"the room-facing surface is closed to operator chrome, **and a test is what keeps it closed**"* (`:215`). The gap it declares partial (`:216`) is closed by one of three mechanisms (F1). Take each against the gate as it stands at HEAD:

| Mechanism | What the gate does with it | Evidence |
| --- | --- | --- |
| Route-segment stylesheet | **Nothing.** No stylesheet is token-scanned. `moduleImports` (`tests/theme-chrome.test.mjs:774-805`) resolves candidates against `.tsx`, `.ts`, `/index.tsx`, `/index.ts` only, so a `.css` specifier resolves to nothing and is dropped. `globals.css` is read only to harvest `--color-*` names (`:457`, `:478`). | Verified by reading the resolver's extension list at `:800-804` |
| Server-set class | **Nothing.** Only the root layout may render `<html>`, and the walk is downward-only from the six hardcoded roots — the guard's own comment says so: *"What renders ABOVE a projected route … is Story 17.7's contract, and is deliberately not asserted here"* (`tests/theme-chrome.test.mjs:851-853`). `src/app/layout.tsx` is in neither `PROJECTED` (`:546`) nor `FULL_SCREEN` (`:1100`). | Verified; `projectedTree()` at `:806-841` seeds from `PROJECTED` and only follows imports outward |
| Pre-paint inline `<script>` in the route-group layout | **Nothing**, for the same reason — the layout renders above the pages, so the walk never reaches it, and it is not a root. | Same |

And the one assertion `FULL_SCREEN` carries is `assert.match(read(file), /useProjectedShell\(\)/, …)` (`tests/theme-chrome.test.mjs:1105-1119`). **None of the three mechanisms calls that hook.** So the widening AD-24 prescribes at `:218` does not *guard* the new layout — it *fails* on it. Deferred (ii) at `:400` measures four failures from adding the two Server-Component shells and correctly attributes two of them to the `export default function` literal in `exportedProps` (`tests/theme-chrome.test.mjs:934`, verified: both shells are `export default async function`). It does not carry the conclusion the measurement supports: the assertion `FULL_SCREEN` makes is *specific to the current mechanism*, so changing the mechanism invalidates the set rather than extending it.

**The two units.** Unit A ships the closure and widens `FULL_SCREEN`; four reds. Unit A rewrites the assertion to match whatever it built — a regex for its own mechanism, in its own change set, with no independent statement of what is being guaranteed. Unit B, later, closes the `notFound()` hazard with a different mechanism (`:408` permits it) and adds a second assertion. The gate now asserts two mechanism-shaped facts and still asserts no *property*. A third surface using neither is green.

**Why this is the sharpest AD-24 finding.** The spine is careful to record each of these ceilings individually — `:394` records the CSS blindness and the downward-only walk, `:400` records the four failures. What no clause says is the thing they compose into: **the gate is structurally blind to all three of the fixes it will be asked to guarantee.** `:394` half-reaches it — *"the gate is structurally blind to a fix it would be asked to guarantee"* — but scopes that observation to the stylesheet candidate only. It is true of all three.

**Close it with.** State in AD-24 what the assertion is *about* rather than what it matches: *every room-facing URL resolves through a layout segment that emits the shell reset before first paint, and the guard asserts that property of the segment, not the spelling of the mechanism.* Then the enumeration problem (F2/F10) is the only one left.

---

## F4 — HIGH — "Room-facing surfaces read persisted-local never" is enforced by nothing, and the tier question cannot decide the case where it matters

**Where.** AD-24's tier rule (`:210`) and the *Client state* convention (`:230`): *"Room-facing surfaces read **persisted-local never**."* AD-24's *Prevents* (`:209`) names the hazard precisely: *"a client-persisted value that **paints** becoming a third structural channel to the congregation's screen."*

**The two units.** A product request: *the slideshow should remember how the operator last fitted the slide to their screen.*

- **Unit A — Story X.** Applies the tier question. *Who must agree on it?* Nobody but this operator's own browser; the projector window has its own. → **persisted-local**. Writes `localStorage.setItem('wpw-slideshow-fit', mode)` and reads it in `SlideshowClient.tsx`. Same reasoning, verbatim, that AD-24 uses to justify the theme.
- **Unit B — Story Y.** Applies the same question to the projector. *Who must agree?* Both room-facing surfaces and the operator watching them, so **persisted-shared** → `settings`.

Both cite AD-24's own words. They disagree about the home of one preference, and Unit A additionally lands a persisted value on a room-facing surface — which the convention forbids and the AD's *Prevents* names — while **passing the gate**.

**Verified green by construction.** `themeReferences()` (`tests/theme-chrome.test.mjs:1096-1103`) is the union of four regexes over source text: `TOKEN_UTILITY`, `TOKEN_SHORTHAND`, `TOKEN_CSS_VAR` (all three built from `--color-*` names harvested out of `globals.css` at `:457-478`) and `DARK_VARIANT` (`/(?<![\w:])dark:[a-z[-]/g`). `localStorage.getItem('wpw-slideshow-fit')` matches none of them, and the `EDGE_*` patterns are about widths. `FULL_SCREEN` asserts only `fixed inset-0`, `useProjectedShell()` and a root `text-white`. A repository-wide search for `localStorage` in `tests/` returns three hits, all inside the AC-1 `ThemeToggle` tests (`tests/theme-chrome.test.mjs:1495`, `:1735`, `:1793`) — nothing anywhere asserts that a projected file does not read browser-persisted state.

**And Unit A crosses into AD-10's territory silently.** AD-24 `:213` documents that a `localStorage` write fires a `storage` event in every same-origin window, and that *"persisted-local is for state a browser keeps for **itself**."* The projector is a same-origin window. A fit-mode write in the operator's slideshow tab reaches the projector window without a `BroadcastChannel` and without a message shape — slipping past both of AD-10's prohibitions, exactly as `:213` predicts, with no plan identity and no guard. The spine describes this hazard well and enforces nothing against it.

**The unsatisfiable case underneath.** An operator-settable, room-visible preference has **no legal home at all**: persisted-shared is admin-write-only (`src/app/api/admin/settings/route.ts:29`), persisted-local is closed to room-facing surfaces, ephemeral-shared does not persist. `:407` records the missing per-account tier but frames it as convenience — *"a preference should follow an operator to a different machine"* — rather than as a constraint the three tiers cannot satisfy. A story handed that requirement must violate one of the three rules, and which one it violates is arbitrary.

**Close it with.** Two sentences in AD-24's Rule: (a) a room-facing surface reads no browser-persisted store, and the gate asserts the absence of `localStorage` / `sessionStorage` / `document.cookie` in the projected tree — a regex the existing walk already has the machinery for; (b) name what happens when a preference is operator-owned *and* room-visible, even if the answer is *this product does not have one and a story that needs one comes back here.*

---

## F5 — MEDIUM — AD-24 scopes "one shared implementation, never its own copy" to room-facing surfaces, licensing the queued third consumer to stand up a second one

**Where.** `:215` binds *"a full-screen **room-facing** client surface neutralises the app shell it inherits … through **one shared implementation, never its own copy**."* `:221` classes `PresenterOperator.tsx` and `SlideGridDialog.tsx` as **operator** surfaces, *"not room-facing."* Deferred `:409` calls `PresenterOperator` the obvious third consumer of a route-group shell and records that black is the wrong reset for it.

**The two units.**

- **Unit A** follows Deferred `:409` and parameterises the shared module: `claimProjectedShell(doc, colour)`. The entry itself flags the hazard — the guard reads only the module default (`tests/theme-chrome.test.mjs:1163-1175`, verified: it asserts the literal `'backgroundColor', '#000000'` in the source), so the parameter arrives with nothing checking the call sites.
- **Unit B** notes that the *"never its own copy"* clause is scoped to **room-facing** surfaces, and `:221` says the Presenter is not one. It therefore writes a four-line `usePresenterShell` beside the existing module. Nothing in AD-24 forbids it.

**Why they are incompatible.** Unit B produces two independent reference counters over one `html`/`body`. That is precisely the failure the reference counting exists to prevent, stated at `:215` — *"a snapshot/restore pair written for one consumer hands the second surface's black back to the operator's whole app shell permanently"* — reached from a direction the clause's own scoping permits.

**Verified.** `PresenterOperator.tsx:449` is `className="dark flex min-h-dvh flex-col bg-background text-foreground lg:h-dvh lg:overflow-hidden"` — `min-h-dvh`, **not** `fixed inset-0`. So it is not even the shape `src/lib/projected-shell.ts:5-12` documents itself as serving, which strengthens Unit B's case for a separate mechanism and weakens Deferred `:409`'s framing of it as *"the obvious third consumer."* `deferred-work.md:206` confirms the symptom (a light-theme operator gets a white canvas framing the dark Presenter).

**Close it with.** Drop *room-facing* from the "never its own copy" clause and make it a property of the shell itself: *`html`/`body` chrome is claimed through exactly one module, whatever the surface and whatever the colour.* The colour then has to become a parameter, and the guard has to check call sites rather than the default — which is what `:409` already asks for and what the scoping currently makes optional.

---

## F6 — MEDIUM — AD-10's plan identity has two incompatible definitions in one spine, and the interim one manufactures the room-facing failure the rule exists to prevent

**Where.** `:124` defines the identity as *"a fingerprint of **the snapshot and resolved announcement set** that produced the deck."* Deferred `:376` authorises a first version that fingerprints *"the resolved plan itself."*

**The two units.** Story P lands the interim fingerprint (plan hash) today, because `:376` says the hazard is live now and the identity's full form need not wait for AD-16. Story Q lands the AD-16 form (snapshot id + announcement set) with Epic 20. Both obey AD-10.

**Why they are incompatible.** The two fingerprints differ for the same deck. AD-10's stated behaviour on mismatch is that the receiver *"**refuses to follow the index** and says so on the room-facing screen"* — so during any window in which a projector window is running one build and the presenter another, the closure produces the on-screen failure the decision exists to avoid. That window is real, not theoretical: `src/lib/present-channel.ts:73-76` already documents the cross-build case in code — *"the declared type says this field is there, and the sending window is the one thing that cannot be trusted to agree"* — and a projector left open across a deploy is the ordinary case for a home-server hub.

**And AD-10 does not say what a receiver does with an identity it cannot interpret.** The same module already draws exactly the distinction AD-10 omits: `blankStateOf` treats absent as `false` because a projector must land somewhere (`:50-53`), and `liveTransitionOf` treats absent as `null` because the projector already holds a server-rendered value (`:71-77`), with the reasoning for the asymmetry written out at `:55-70`. AD-10 gives no such reading for `identity`. Story P and Story Q will each pick one — absent-means-trust versus absent-means-refuse — and they are opposite failure modes on the congregation's screen.

**Close it with.** AD-10 should fix the identity's *interpretation contract* rather than only its content: what an absent identity means, what an unrecognised one means, and that the fingerprint's definition is itself versioned so the interim and final forms never compare as merely "different."

---

## F7 — MEDIUM — AD-16's Sync precondition is checked against a value Sync is not required to advance, and an unrelated Deferred storage call decides whether it is

**Where.** AD-16 `:159`: Sync *"carries the service's `updated_at` precondition (AD-6), and may not alter the service's entered data."* Deferred `:370`: *"Where the snapshot lives physically — a table keyed by service, or a payload column on `services` — is a Story 20.8 design call."*

**The shipped mechanism, verified.** AD-6's precondition works because the write advances the value it checks, in the same statement: `src/lib/services/update-service.ts:134` pushes `updated_at = CURRENT_TIMESTAMP` into the assignment list and `:139` re-asserts `WHERE id = ? AND COALESCE(updated_at, created_at) = ?`. Read-check-then-write without the advance is not a precondition, it is a read.

**The two units.**

- **Unit A** — Story 20.8 picks *a payload column on `services`*. Sync writes the `services` row, so it bumps `updated_at` for free and inherits the working mechanism.
- **Unit B** — Story 20.8 picks *a table keyed by service*. Sync writes only that table. It reads `services.updated_at`, compares, and writes the snapshot. **`services.updated_at` never advances.** Two concurrent Syncs, or a Sync racing a re-clone, both pass the precondition and the second silently wins — the exact last-write-wins outcome AD-6's *Prevents* names, produced by a path that satisfies AD-6's letter.

A Unit-B implementer who *does* bump `services.updated_at` then has to argue it against AD-16's own *"may not alter the service's entered data"* and the *State* convention at `:229`. Defensible either way; that is the point — two readings, no rule.

**The same fork also picks the error shape.** The *Boundaries* convention (`:231`) fixes the stale-write signal **by layer**: `src/lib/services/*` returns a result, `src/lib/registry/store.ts` throws (`RegistryStaleError` at `:20`, raised at `:224` and `:272`), and *"a third must not appear."* Sync is a service-scoped action over registry data; whether it lands in `services/` or `registry/` is decided by the same 20.8 storage call. So one deferred storage decision silently determines both the concurrency semantics and the 409 shape of a write the spine describes as governed.

**Close it with.** One clause in AD-16: *Sync advances the precondition value it checks, in the same statement, whatever table the snapshot lives in* — which makes the 20.8 storage choice genuinely free.

---

## F8 — MEDIUM — AD-21 has no reading of the counter for a fresh, empty database, because its own order clause runs migrations before the bootstrap that stamps it

**Where.** `:194` fixes the order: *startup DDL (AD-9) → data migrations (AD-18) → first-boot bootstrap (AD-17)*, asserted by a test. `:193` defines exactly two states: a bootstrap-created database *"stamped with the current data version by the bootstrap itself, in the same transaction as the seeding marker"*, and *"a database holding registry rows and no version key"* = pre-counter, one repair transition.

**The state neither clause covers.** On a fresh install, the migration step runs **before** the bootstrap. At that moment the database has no version key **and no registry rows** — it is neither of the two states `:193` enumerates.

**The two units.** Runner A reads absent-as-0 and replays every declared transition against the empty database. Runner B reads absent-as-current and skips. Both obey AD-21 as written, and they diverge the moment a transition does anything other than rewrite existing rows — which AD-18 `:172` permits, since a migration is only constrained to be *"explicit, one-time, on the startup path."* Latent today only because Epic 20's collapse is keyed on the seven retired `base_type` values, of which a fresh database has none.

**Aggravator — nobody owns compaction.** `:192` says *"the whole batch of unreleased transitions **is compacted** into a single transition before it reaches production"* — passive, no owner — and `:410` records that nothing defines what a release *is* for this project. Two developers each declare "the transition to version 1" in their own branch; both are correct; the merge has no rule.

**Close it with.** Make `:193` total: state the reading for *absent counter, empty database* (the natural answer is that the migration step is a no-op before bootstrap on a fresh install, and the order clause at `:194` already implies it), and name who compacts.

---

## F9 — MEDIUM — the rewritten ceiling bullet retracts the `className` narrowing, and the guarantee is still walkable

**Where.** `:393` states the `className` clause *"was slated here for **narrowing**; it is **retracted** instead, because the composed-type spelling that justified narrowing it was closed by Story 17.1's patch P3."*

**What is actually closed.** Verified: `exportedPropsShape` (`tests/theme-chrome.test.mjs:1042-1078`) resolves the parameter list, follows a named props type through `typeDeclarationBody` (terminating `;` or `interface` body, not merely the first balanced block), recurses through `withoutObjectLiterals` into every composed local type, and `assert.notEqual(at, -1, …)` fails loudly on anything the file does not declare, naming `React.ComponentProps<'div'>` in the message. The composed-type hole is genuinely closed.

**What an adversary still walks through.** The assertion is `assert.doesNotMatch(exportedPropsShape(…), /\bclassName\b/)` over exactly two files (`:1080-1097`). An **index signature** contains no `className`:

```ts
export default function SlideView({ slide, ...rest }: { slide: SlidePlanItem; [key: string]: unknown }) {
```

`propsAnnotation` returns a string starting with `{`, so `exportedPropsShape` short-circuits at `:1057` and returns the parameter list verbatim; the regex finds no `className`; green. `Record<string, unknown>` fails loudly (it is not locally declared), but the index-signature spelling does not.

The belt is the JSX call-site scan at `:899-923`, which flags `className=` or a `{...` spread on a `<SlideView>` / `<ArtifactSlide>` tag — but it iterates `allTsxFiles()`, and `allTsxFiles` is `allSourceFiles(['.tsx'])` (`:340`). So `React.createElement(SlideView, { slide, className: 'bg-card' })` from a `.ts` module is invisible to it. Both guards green, `tsc` clean, `bg-card` on the wrapper the congregation sees.

Note this is the same defect class the bullet itself narrates twice — *"a `{...props}` spread, a `React.createElement(…)`, a renamed default import and a `.ts` call site"* is the guard's stated reason for existing (`:1080-1084`), and the `.ts` call site is exactly what the belt does not cover. The retraction is one spelling too confident.

**Close it with.** The ceiling bullet should record the index signature and the `.tsx`-only call-site scan as live rather than declaring the clause retracted. Encoding the rule (per the bullet's own standard) means asserting the props shape is a **closed** object literal — no index signature, no rest element — rather than asserting the absence of one word.

---

## F10 — MEDIUM — there is no definition anywhere of *room-facing*, so the route group AD-24 chose has no membership rule

**Where.** `:218` chooses *"one layout owning **every room-facing URL**."* Nothing in the spine, the tests, or `src/` defines which URLs those are.

**The two units.** Unit A (17.7) builds `src/app/(room)/` and has to decide whether `/services/[id]/present` belongs in it: it is full-height, it pins `dark` on its own wrapper, and on a mirrored sanctuary laptop it is on the projector. Unit B (the guard maintainer) reads AD-24 `:221` — *"the two surfaces that pin `.dark` on their own wrapper are **operator** surfaces, not room-facing"* — and excludes it. Both are reading the same spine. The divergence is silent: a route in the group but out of the list, or in the list and out of the group, produces no failure.

**Why the anchor matters more than the list.** F2 shows the spine simultaneously demanding and refusing a widening of `PROJECTED` / `FULL_SCREEN`. The reason `:394`'s *encode the criterion* instruction cannot be followed today is that there is no value to encode against — unlike AD-5, where `config.matcher` is a real value the assertion reads. **Story 17.7's route group is the first opportunity to create one.** If room-facing is defined as *inside the `(room)` segment*, then the guard can enumerate the directory instead of a literal array, the roots stop being a list, and `:394`'s standing instruction becomes satisfiable rather than merely correct.

**Verified context.** `PROJECTED` holds six entries (`tests/theme-chrome.test.mjs:546-557`), `FULL_SCREEN` two (`:1100-1103`); both hardcoded. `src/app/` has exactly one `layout.tsx` (the root) and **no** `not-found.tsx`, `error.tsx` or `global-error.tsx` anywhere — confirming `:408`. `notFound()` appears at eleven sites, of which six are on the two projected routes (`projector/page.tsx:37,49,55` and `slideshow/page.tsx:38,50,56`), which matches the spine's count of *"six reachable sites"* at a projected URL; the other five are at `/services/[id]` and `/services/[id]/present`.

**Close it with.** AD-24 should name the anchor as part of the closure, not leave it to the story: *room-facing URLs are exactly those under the room route segment, and the guard's roots are derived from that segment rather than listed.*

---

## F11 — LOW — a citation in the per-account-tier bullet points at a read gate to support a claim about write paths

`:407` reads: *"every **write** path into it is `requireAdminSession` (`src/app/api/admin/settings/route.ts:17,29`)."* Verified: `:17` is the gate inside `export async function GET` (`:16`); `:29` is the gate inside `export async function PUT` (`:28`). The conclusion holds and is in fact stronger than stated — the settings API is admin-only for **reads** too, which makes the "no operator-writable persisted tier" argument sharper, not weaker. Worth correcting because this bullet is the one load-bearing statement behind F4's unsatisfiable case, and a citation that does not support its sentence is the thing this spine's own AD-map paragraph (`:42`) warns readers about.

---

## Foreclosed attacks

Constructed, then found already closed by the code. Recorded so a later run does not re-file them.

1. **"A second consumer of `claimProjectedShell` snapshots the first one's black and restores it permanently."** Foreclosed by the reference count: only `claims === 0` snapshots and only the last release restores (`src/lib/projected-shell.ts:91-124`). Both live callers verified — `ProjectorClient.tsx:96` and `SlideshowClient.tsx:33`, exactly the two in `FULL_SCREEN`.
2. **"A test that claims without releasing wedges every later test into a state where the shell is never blacked out."** Foreclosed by the `generation` token (`src/lib/projected-shell.ts:82`, checked at `:109`) plus the floored decrement at `:120`, and by `resetProjectedShellForTest` calling `restore?.()` before zeroing (`:139-144`). The two failure modes are documented in-file with the driven reproduction.
3. **"A caller styles the projected wrapper by passing `className` in JSX."** Foreclosed as a compile error — neither component declares one (`SlideView.tsx:18`, `ArtifactSlide.tsx:229`) — with the JSX scan at `tests/theme-chrome.test.mjs:899-923` as the belt. (The `.ts` / index-signature route around it is F9.)
4. **"A `.ts` module in the projected tree carries a theme token and is never scanned because the walk enqueues `.tsx` only."** Foreclosed: `projectedTree()` (`:806-841`) walks every extension, and the floor assertion at `:874-880` (`walked.length >= 27`) fails if the walk regresses to the twelve-module reach. `src/lib/projected-shell.ts` is among the reached modules. Suite runs 48/48 green at HEAD.
5. **"Two Sync Artifact implementations invent a third stale-write signal shape."** Foreclosed at the convention level by `:231`, which fixes the shape by layer and says a third must not appear — the residual ambiguity is *which layer*, which is F7 rather than a third shape.

---

## Attack coverage summary

| AD | Pair constructed | Outcome |
| --- | --- | --- |
| AD-24 (tiers) | slideshow fit-mode: persisted-local vs persisted-shared | **F4 HIGH** — open, and unenforced |
| AD-24 (first paint) | 17.7 stylesheet vs `notFound()` inline script | **F1 HIGH** — open; release constraint is non-binding |
| AD-24 (gate) | any mechanism vs the gate's reach | **F3 HIGH** — open; gate blind to all three |
| AD-24 (list) | widen `FULL_SCREEN` vs refuse to widen | **F2 HIGH** — direct contradiction |
| AD-24 (3rd consumer) | parameterise vs second module | **F5 MEDIUM** — open; clause scoped too narrowly |
| AD-24 (new route) | route in group vs route in list | **F10 MEDIUM** — no definition of room-facing |
| AD-24 (Deferred claims) | index signature + `.ts` call site | **F9 MEDIUM** — retraction is one spelling too confident |
| AD-6 / AD-16 | snapshot table vs payload column | **F7 MEDIUM** — precondition may not advance |
| AD-10 | interim plan hash vs snapshot fingerprint | **F6 MEDIUM** — two identities, no interpretation contract |
| AD-21 | absent counter on an empty database | **F8 MEDIUM** — state not enumerated |
| AD-17 | seed substitution for absent vs corrupt rows | No new pair — `:165` and `:375` already fix both halves and name the shared-loop trap; verified against `src/lib/artifacts/registry-snapshot.ts:85-90` |
| AD-19 | slot identity in `base_type` vs a discriminator | No new pair — `:371` scopes the schema call and `:173`'s derived-index rule already binds either choice; verified against `worship-form-fields.ts:6-9` and `parsed-fields.ts:414-422`, both still ordinal as the AD states |
| AD-16 (announcements) | shared vs per-service list | Foreclosed at spine level by `:159`, which picks the scoped reading; the nullable column that made both expressible is confirmed at `src/lib/db/index.ts:113` |

---

## Recommended AD changes, in priority order

1. **AD-24 Rule — admissibility of a closure mechanism.** A pre-paint mechanism must also release the shell when the last room-facing surface leaves. Promotes Deferred (i) into the binding text and eliminates the stylesheet by rule. *(F1)*
2. **AD-24 Rule — what the gate asserts.** Assert the *property* (every room-facing URL resolves through a segment that emits the reset before first paint), not the mechanism's spelling. *(F3)*
3. **AD-24 Rule — the room-facing anchor.** Define room-facing structurally (the route segment), and derive the guard's roots from it. Resolves the `:218` / `:394` contradiction by making the refused widening unnecessary. *(F2, F10)*
4. **AD-24 Rule — persisted-local is closed to room-facing surfaces, and the gate says so.** Plus a named answer for an operator-owned, room-visible preference. *(F4)*
5. **AD-24 Rule — de-scope "never its own copy"** from room-facing to the shell itself. *(F5)*
6. **AD-16** — Sync advances the precondition value it checks, whatever table the snapshot lives in. *(F7)*
7. **AD-10** — fix the identity's interpretation contract (absent, unrecognised, versioned), matching the asymmetry `present-channel.ts:50-77` already documents for `blank` and `transition`. *(F6)*
8. **AD-21** — make `:193` total for the fresh-empty-database state, and name who compacts. *(F8)*
9. **Deferred `:393`** — un-retract: record the index signature and the `.tsx`-only call-site scan. **Deferred `:407`** — fix the citation. *(F9, F11)*
