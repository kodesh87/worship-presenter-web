# Reviewer Gate — rubric walker (Epic 20 amendment, 2026-07-30)

Judges `ARCHITECTURE-SPINE.md` after AD-6/AD-7/AD-8 landed, against the good-spine checklist.
Scope: the amendment. Epic 16's own AD-1..AD-5 were passed by the 2026-07-29 run and are
re-read here only where the amendment touches them.

**Verdict: PASS with two HIGH findings.** The three new decisions are enforceable, grounded in
code that was read this session, and precise about which clauses they supersede. What is
missing is coverage — two of the eight capabilities the spine now binds have no invariant.

## Does it fix the real divergence points for the level below (stories 20.1–20.8)?

| Story | Covered by | Verdict |
| --- | --- | --- |
| 20.1 ordered registry | AD-6 (snapshot is the sequence input), AD-7 (boot never reorders), INIT AD-9 (ordering column is ordinary DDL) | covered |
| 20.2 three kinds | AD-8 | covered |
| 20.3 add/delete/rename/reorder | AD-7 (delete sticks), AD-4 surviving admin-only clause | covered |
| 20.4 General canvas | AD-3, AD-5 — unchanged, already sufficient | covered |
| 20.5 placeholder catalog | **nothing** | **MED-1** |
| 20.6 Announcement expands | AD-2; Epic 16 already had expanding base types, so no new shape | covered |
| 20.7 SongSet slots | **nothing** | **HIGH-2** |
| 20.8 clone + Sync | AD-6 | covered, but see HIGH-1 |

## HIGH-1 — INIT AD-6 is absent from Inherited Invariants, and AD-6 needs it

The Inherited Invariants table lists INIT AD-1, 2, 3, 4, 5, 7, 8, 9, 10. **INIT AD-6
(optimistic concurrency on service edits) is not there** — and it is not a harmless omission:

- the registry already implements it (`expectedUpdatedAt`, `RegistryStaleError` in
  `src/lib/registry/store.ts`, and both `/api/admin/artifacts/[id]` routes), so it was binding
  on Epic 16 all along and the table simply missed it;
- INIT AD-6 says *"every service mutation carries the client's `updated_at` as a precondition …
  no write path may bypass the precondition"*;
- **Sync Artifact is a service mutation.** AD-6 says it "replaces the snapshot destructively"
  and says nothing about the precondition.

Two units obeying AD-6 to the letter can therefore build Sync differently — one with a 409 on a
stale read, one as an unconditional overwrite. That is the divergence an `AD` exists to close.

**Fix:** add the INIT AD-6 row, and one clause in AD-6 binding Sync to it.

## HIGH-2 — the SongSet slot identity is a cross-boundary contract, not a story-local call

CAP-8 and the SPEC *Constraints* require the four predefined slots to have **stable identities**
"so worship-service settings can bind hymnal numbers per slot even if display labels or order
change." `epics.md:393` calls that identity "the story's central design decision."

It is not a story-local decision. It is a key that **two independently-built units must agree
on** — the registry authoring surface that owns the row, and the worship-service settings form
that binds a hymn number to it. One could key on the row's position, one on its label, one on a
slot id. Every pair of those choices builds incompatibly, and two of them silently break the
moment an admin does exactly what CAP-2 invites (reorder, rename).

AD-5 fixes "stable template/layout/element/placeholder IDs" — internal registry identity. It does
not fix an identity referenced from *outside* the registry.

**Fix:** a new AD fixing that the binding is by stable slot identity, opaque to label and order.

## MED-1 — nobody owns the Placeholder Catalog key set

CAP-4's success clause includes *"UI cannot invent new catalog keys"*, and SPEC *Constraints*
says extending the catalog "require[s] code + tests." That is an enforcement boundary with the
same shape as HIGH-2: a key the admin UI and the server validator must agree on. AD-5 makes every
write validate, but whether the catalog key set is part of the validated vocabulary is unfixed —
so a UI free-text field and a validator that accepts any string both comply.

This also has a public-repository edge: an invented placeholder key is a channel for arbitrary
congregation text, which is the class of leak `AGENTS.md` is built around.

**Fix:** same AD as HIGH-2 — both are "an identity two units must agree on, enforced server-side."

## Are the new Rules enforceable, and do they prevent their stated divergence?

- **AD-6** — yes. "A service reads its own snapshot" is testable; "no renderer reads a snapshot"
  matches the existing AD-2 assertion shape.
- **AD-7** — yes, and it names the marker mechanism rather than gesturing at it. Its *Operational
  consequence* paragraph is the strongest part of the amendment: it catches a trap the rule
  creates (the private override read only at first boot) instead of leaving it to be discovered
  in production.
- **AD-8** — the rule is enforceable. The **waiver** is a condition, not a testable invariant, but
  it carries an explicit expiry trigger ("first deploy") and names what the post-expiry work is,
  which is the most a spine can do with a dated assumption.

## Does anything under Deferred let two units diverge?

No. "Where the snapshot lives physically" is safe because AD-4's surviving clause routes every
read through one server-side module. The `seed_hash` retirement item correctly insists the
resurrection test be **inverted rather than deleted** — without that sentence the removal would
leave AD-7 unguarded.

## Inherited-invariant conflicts

- **AD-6 vs the parent's State convention** (*"services are immutable once presented"*): a real
  puncture. The spine records it as an owner-decided accepted cost, with what it gives up stated
  plainly. That is the right handling **locally**, but the parent spine still states the
  convention unqualified. Per the skill's rule that a conflict with an inherited invariant is
  surfaced rather than locally overridden, the parent needs a pointer. → **HIGH-3, escalate.**
  **Resolved differently, same day:** the owner's answer was that the parent wording is *itself*
  inaccurate — the freeze event is service **creation**, and what is frozen is the supporting data
  entry, not the generated deck. So this is not a puncture to be justified but a **factual
  correction owed to the parent spine**. AD-6's cost paragraph was rewritten as three deliberate
  non-goals, and the epic-16 Inherited Invariants table now carries the correction as an explicit
  escalation row. The parent edit itself is still outstanding.
- **AD-8 vs INIT AD-9:** the framing ("AD-9 fixes schema, is silent on values") is defensible, and
  AD-8 explicitly re-affirms the no-framework prohibition rather than eroding it. But INIT AD-9's
  *Binds* names the **bootstrap path**, which is precisely where AD-8 operates, so a reviewer at
  initiative altitude could read this as a child decision about parent-owned ground. → **MED-2,
  surface; the parent amendment was offered to the owner and not taken up.**

## Brownfield ratification

Strong. Every mechanism the amendment names was read this session, not recalled:
`insertArtifactTemplateIfMissing` first in `reseedArtifactTemplateIfUntouched`
(`store.ts:395`), `seedArtifactRegistry` inside `getDb` (`db/index.ts:263`),
`artifact_seed_hash_backfilled` (`db/index.ts:13`), `ORDER BY label COLLATE NOCASE` proving no
ordering column exists (`store.ts:81`), `READ_ONLY_BASE_TYPES` / `EDITABLE_BASE_TYPES`
(`types.ts:13,19`), and the test that asserts the resurrection
(`tests/registry-reseed.test.mjs:337`).

## Dimensions the altitude owns

Storage, authorization, state mutation, seeding, migration, dependency direction: all decided.
Operational envelope: the private-override trap is named in AD-7; deployment stays INIT AD-4.
UX staleness is deferred to `EXPERIENCE.md` **by name**, so it is a boundary rather than a
silence. No whole dimension is left unaddressed.
