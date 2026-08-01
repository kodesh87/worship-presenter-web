# Reviewer Gate — Adversarial Two-Units

**Run:** 2026-08-01 architecture Update, AD-28 (scripture input model)
**Lens (configured `finalize_reviewers[1]`):** construct two units one level down that each obey every `AD` to the letter yet still build incompatibly.
**Verdict:** the pair is unusually easy to attack because **Stories 21.4 and 21.5 are deliberately cut to be built in separate worktrees**, so every divergence below is live rather than hypothetical. **Four findings, two HIGH.** One (A1) was found while drafting and closed before this gate; three are new.

---

## A1 — HIGH — *(found pre-gate, already closed in the draft)* — nobody said who supplies the scope, or what an absent one means

21.5 sends no scope and expects the server to read `default_bible_translation`; 21.4 reads an absent scope as *all installed translations* — the other scope this same decision names. Both are faithful. The result compiles, passes both stories' AC, and **reinstates cross-language operator input through a default**.

Closed in AD-28's scope clause: required, registry-validated corpus code on operator surfaces; absent or unrecognised is **refused**; *all-installed* is a property of the rundown surface, never a fallback.

## A2 — HIGH — "longest-prefix match" does not say which side the prefix is on, and the decision's own examples require **both** directions

This is the sharpest hole and it survives every clause as drafted.

*Prefix* is a relation between two strings and AD-28 never fixes its direction. Both readings are natural, and **each is separately mandated by an example AD-28 or Story 21.4 states as a requirement**:

| Reading | Relation | Required by |
|---|---|---|
| **(a) corpus name is a prefix of the input** | `Kisah Para Rasul` ⊂ `Kisah Para Rasul 1:8` | finding *where the book name ends* — the stated replacement for the two-word cap and the hyphen |
| **(b) typed token is a prefix of a corpus name** | `Ps` ⊂ `Psalms` | the stated justification for **dropping `shortName`** — *"`Ps` still reaches Psalms"* |

They are **opposite relations.** A builder who implements only (a) — the obvious reading for a parser, and the one 21.4 owns — produces a server that **refuses `Ps 23:1`**, because `Ps` is not a corpus name. A builder who implements only (b) cannot tell where the book name ends in a three-word name.

The divergence lands exactly on the 21.4 / 21.5 seam, and on the feature the owner chose the single field *for*: 21.5's autocomplete needs (b) to offer `Psalms` while the operator types `Ps`, and **paste** — the stated reason a single free-text field beat the picker — sends the raw string to 21.4's (a)-shaped resolver. Autocomplete offers what the server then rejects.

**Measured against the shipped corpus** (`data/bible/kjv.json`, 66 books), reading (b) is genuinely ambiguous and reading (a) is not:

- `Ps` → 1 (`Psalms`) — resolves
- `Song` → 1 (`Song of Songs`; still 1 after the pending correction to `Song of Solomon`)
- `1 Co` → 1 (`1 Corinthians`)
- **`Phil` → 2** (`Philippians`, `Philemon`)
- **`Jo` → 5** (`Joshua`, `Job`, `Joel`, `Jonah`, `John`)
- **No full book name is a prefix of another** — checked all 66×66 pairs, zero. (`Judges` is not a prefix of `Jude`: J-U-D-**G**-E-S.) So reading (a) is unambiguous *for this corpus*, which is a property of one shipped file rather than an invariant, and a second translation is not required to preserve it.

**Fix applied:** AD-28 now states the relation in both directions and the disambiguation rule that reconciles them — the book name is the longest leading span of the input that is a corpus name, a translation-scoped alias, **or an unambiguous prefix of exactly one** name in scope; a partial matching more than one **does not resolve**; an exact full-name match always wins over a prefix extension, stated even though no KJV pair needs it today, because it is the rule the next corpus will need and it costs a clause now.

## A3 — MEDIUM — the collision rule is written for cross-translation ambiguity only, and the measured ambiguity is **intra**-translation

AD-28 as drafted said: *"Rundown scope matches every installed translation, so two translations' tolerance can resolve one string to two different books."* Both the mechanism and the remedy are scoped to **two translations**.

But `Phil 1:1` is ambiguous with **one** translation installed, and `Jo 1:1` is ambiguous five ways. Under the drafted clause a builder reasonably concludes the collision rule does not apply — it is written about a condition that is not present — and picks the first match, or the lowest book id. That is precisely the silent mis-split the clause exists to prevent, arriving in the single-corpus configuration that ships today.

**Fix applied:** the collision clause is generalised to ambiguity **of any origin — within one translation or across several** — with the cross-translation case kept as the illustrating instance rather than the definition.

## A4 — MEDIUM — installing a translation can un-resolve a rundown reference that worked last week

Rundown scope is *every installed translation*, and ambiguity is refused rather than guessed. Both are correct. Together they mean **adding a corpus is not a purely additive act on the rundown surface**: a reference that resolved unambiguously against one translation can become ambiguous against two and start arriving as unmapped input.

This has AD-1's shape — the failure surfaces on a Sabbath morning, on a rundown nobody changed, after an install nobody connected to it. It is not an argument against the rule (guessing is worse, and NFR-5 makes unmapped input visible rather than silent), but it is a consequence an operator will experience and no artifact names.

**Fix applied:** recorded as a consequence in AD-28's collision clause and as a *Deferred* note, so the affordance question — how an operator learns *why* a previously-fine reference is now unmapped — reaches `EXPERIENCE.md` rather than being discovered live.

## A5 — MEDIUM — 21.2's translation parameter and 21.4's scope are the same value, and nothing says so

Story 21.2 (*translation is a parameter*) removes the `'KJV'` literals at `src/lib/scripture.ts:6`, `:106`, `:128`, `:144` and threads a translation through the read path. AD-28 adds a **scope** to the matcher. On an operator surface these are the same value — you search inside the translation you are reading, which is the owner direction in one sentence — but the two stories introduce them separately, under different names, into the same module.

Two units obeying everything can therefore land **two parameters that must always agree**, with nothing asserting it. The first caller that passes a scope of `TB` and a read translation of `KJV` gets Indonesian book names resolving to English verse text, and every clause of AD-27 and AD-28 is still satisfied.

**Fix applied:** AD-28 states that on an operator surface the matcher's scope **is** the translation being read — one value, not two that agree — while on the rundown they are legitimately different, because the matcher spans every installed translation and the resolved passage is read from the one that matched.

---

## Attacks attempted that found nothing

- **21.4 against 22.3 (song-book locale).** Disjoint corpus families; hymns resolve by number, not by name, and the matcher is scripture-only. No shared surface.
- **AD-28 against AD-26's never-filter rule.** Scoping the matcher by corpus **code** is not filtering by locale — the code carries no locale by construction (AD-26), so scoping cannot smuggle a locale predicate in. This was the most promising attack on the decision and it fails cleanly, which is the payoff AD-26 was written for.
- **AD-28 against AD-5.** The suggestion endpoint adds no matcher exclusion; verified at `src/proxy.ts:122` that `/api/scripture` and `/api/hymns` are gated by default. No authorization seam.
