# Reviewer Gate — Rubric Walker

**Run:** 2026-08-01 architecture Update, AD-28 (scripture input model)
**Target:** `ARCHITECTURE-SPINE.md`
**Lens:** good-spine checklist (`references/reviewer-gate.md`)
**Verdict:** AD-28 fixes the divergence the action item named, and closes one the action item did not. **Three findings, two of them HIGH**, all inside AD-28's own scope rather than elsewhere in the spine.

---

## R1 — HIGH — AD-28 names no enforcement, and one of its clauses is the rare one with a structural anchor

The good-spine checklist asks whether each Rule is *enforceable*. This spine has a hard-won position on that question: AD-24's gate is recorded as four hand-maintained lists with no structural anchor, AD-25's closure is recorded as *"a grep somebody ran once on 2026-08-01, not a gate"*, and AD-5's matcher assertion is held up as the good case because an unlisted route is **detectable**.

AD-28 says nothing about how any of its clauses are held. That is a gap by this file's own standard, and it is worse than usual here because **the one-matcher clause is squarely in the AD-5 class rather than the theme-chrome class**: the forbidden thing is a *source pattern*, the pattern is known exactly, and a scan over `src/` either finds it or does not. *"No regex survives at any of the three sites"* is machine-checkable in a way *"never its own copy"* was not.

The scoped-alias clause has an anchor too, one level weaker: an alias table keyed by translation code can be asserted to have no unkeyed rows, and a corpus loader can be asserted to reject an `aliases` field — which is the clause AD-28 leans on AD-27 for.

**Fix applied:** an enforcement clause in AD-28 naming what a guard can assert and what it cannot, plus a *Deferred* entry assigning it to whichever of 21.4 / 21.5 lands the matcher — following the AD-25 precedent, where the guard belongs with the thing it guards rather than being filed separately.

## R2 — HIGH — *output is exact* is already violated by the echoed reference, and AD-28 is what makes it acute

`src/lib/scripture.ts:139-142` builds the returned `reference` from `parsed.book` — **the operator's typed string**, not the corpus's name for the book:

```
const reference = parsed.verseStart === parsed.verseEnd
  ? `${parsed.book} ${parsed.chapter}:${parsed.verseStart}`
  : ...
```

So `ps 23:1` returns the reference `ps 23:1`, and today `sos 2:1` would return `sos 2:1`. AD-27 says output is exact — *the chosen translation's own name* — and this is a second live violation of it on the shipped default translation, **distinct from the `Song of Songs` corpus misnaming already in *Deferred*** and not recorded anywhere.

It is AD-28 that makes it acute rather than cosmetic. AD-28 deliberately *widens* what input is accepted — prefix forms and scoped aliases — and the whole justification for dropping `shortName` is that `Ps` remains a typing shortcut. If the echoed reference is whatever was typed, then every tolerance AD-28 grants becomes a way for an abbreviation to reach the rendered reference. That reference is displayed with the passage, so this is not confined to an operator screen.

**Fix applied:** a clause in AD-28 stating that a resolved reference is **rendered from the scoped translation's corpus name**, never echoed from input — the point where AD-27's *output is exact* and AD-28's *input is tolerant* meet — plus a *Deferred* entry recording the live defect under Story 21.4, on the same "an architecture run does not patch production code" footing as the corpus misnaming.

## R3 — MEDIUM — the matcher reads a table AD-25 rebuilds at boot, and whether it may cache is unstated

The matcher compares against corpus-supplied names. Under AD-25 those names are a **projection reconciled at startup**, and under AD-26 a corpus can be added or removed by dropping or deleting a file. A builder therefore faces a question AD-28 does not answer: may the matcher hold the name set in memory?

The answer happens to be yes and the reason is worth one sentence rather than a rediscovery: the reconcile runs on the `getDb` boot path before anything serves, and AD-25's closure means **no runtime write path into a corpus table exists**, so a set loaded after boot cannot go stale while the process lives. The hazard is the inverse — a builder who assumes runtime mutability and builds an invalidation mechanism with no trigger, or one who caches *across* a corpus change that AD-25 says can only happen at boot.

Left as a note rather than a Rule: it constrains no unit against another, so it is guidance, not an invariant.

---

## Checklist items that pass

- **Fixes the real divergence points for the level below** — yes, and the scope-defaulting hole (see the adversarial review) was found and closed before the gate.
- **Ratifies rather than contradicts the codebase** — AD-28 contradicts shipped code deliberately and carries `[TARGET]`, with all three regex sites measured at this run.
- **No inherited-spine conflict** — one spine, no parent. AD-28 supersedes exactly two clauses of AD-27 and says so in its opening line, on the `AD-16 supersedes this clause of AD-14 and nothing else` precedent.
- **Nothing under Deferred lets two units diverge** — the two new entries (alias-list sizing, alias shape) are scoped to Story 21.4 alone; 21.5 consumes suggestions and never touches aliases.
- **Operational/environmental envelope** — untouched by this change and already covered by the standing *Deferred* entries (no CI/release definition, no observability, no performance budget). AD-28 adds a request-per-keystroke endpoint, which is inside the existing performance entry rather than a new silent dimension; it is session-gated (AD-5), so it carries no public-abuse surface.
