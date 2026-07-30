---
lens: 'adversarial two-units — construct pairs one level down that obey every AD-n to the letter yet build incompatibly'
target: ARCHITECTURE-SPINE.md (AD-1..AD-22, 2026-07-30 fold-in state)
run: 2026-07-30, validate pass
---

# Adversarial two-units — validate pass

Five pairs found: two HIGH, one MEDIUM-HIGH (a reopened residual of an earlier fix that only half-closed
its gap), two MEDIUM. This spine has already been through at least one adversarial round — three of that
round's four findings are verified closed below — so this pass deliberately avoided re-deriving those and
went looking for what a prior "does the rule permit divergence" scan would miss: boot-order interactions
between three separately-worded AD's, a storage question the spine's own Deferred section admits it never
answered, and a scoping noun ("master list") that reads differently depending which existing table you
already know about.

## Pair 1 — HIGH · A fresh install seeds vocabulary the migration will never see

- **Unit 1 (seed author, Story 20.1/20.3):** ships `data/default-registry.json` reasoning purely from
  `AD-11`/`AD-17`: the seed is a bootstrap, insert-missing-IDs-once, format is whatever validates. Nothing
  in `AD-11` or `AD-17` requires the seed JSON's `baseType` vocabulary to already match the *current*
  schema version — only that it validates and that startup doesn't re-seed an edited row. Today's shipped
  file (checked directly) still reads `"baseType": "text-placeholder"` — Epic 16 vocabulary, not Epic 20's
  three kinds.
- **Unit 2 (migration author, `AD-21`):** implements the seven-to-three `base_type` collapse as the
  literal one-time, version-gated transition `AD-21` describes, reasoning from `AD-18`'s own text: *"Until
  first deploy no production rows exist, so Epic 20's ... collapse ships as a total replacement ... folding
  into production data version 1."* Read literally, a brand-new database starts **at** version 1 — there is
  nothing to migrate on a fresh install, so the migration is a no-op there by design.

Both readings are correct on their own terms. The collision is boot **order**, which no AD fixes: today's
`getDb()` (`src/lib/db/index.ts`) runs schema DDL, then a value-migration/backfill step, then
`seedArtifactRegistry` last. If `AD-21`'s future migration keeps that same order — migrate, *then* seed —
a fresh install migrates an empty table (nothing to do, version stamped at head) and only afterward inserts
Unit 1's seed rows straight from the still-unconverted JSON. Those rows are never "already persisted" at
the moment the one-time migration ran, the version counter now reads head, and the migration never runs
again. The result is a production database holding `base_type: 'text-placeholder'` rows that `AD-19`'s
validator (exactly three kinds) rejects or silently mis-scopes, on a fresh install, with zero migrations
left to blame it on.

**Why it matters:** this is not hypothetical wiring — it is the exact shape of the currently-committed
seed file plus the currently-committed boot order, and `AD-21`'s own Deferred note confirms the counter
"does not exist yet." Whoever lands it first fixes the order almost by accident; nothing in the spine says
which order is required, or that the seed file's vocabulary must be re-verified against the *current*
data version before being trusted un-migrated.

**Close it with:** an explicit clause — the seed file is authored in the vocabulary of the *current*
production data version, full stop, and is asserted so (a test that parses `data/default-registry.json`
against the current validator, not the shipped-as-of-any-particular-release one); *or* fix the order as
seed-then-migrate so freshly-inserted rows are never exempt from a migration that already ran.

## Pair 2 — HIGH · Where a SongSet slot identity lives is a question the spine hands to two different owners

- **Unit 1 (migration/schema author, `AD-19`/`AD-21`):** reasons that `base_type` already carries the row's
  full type today (`text-placeholder`, `song-set`, etc.), so the natural place for the four slot identities
  is the same column — `base_type = 'songset-bt-open'` and so on. Nothing in `AD-19` forbids this; it only
  requires the identity be unique, server-owned, and semantic, all of which a `base_type` value satisfies.
- **Unit 2 (validator/planner author, `AD-19`/`AD-14`'s bind on the registry access layer):** reasons from
  `AD-19`'s own closed-vocabulary sentence — *"the kind vocabulary is exactly the three the SPEC fixes ...
  `general`, `song-set`, `announcement`"* — and keeps `base_type` strictly one of those three, adding a
  **separate** `slot_identity` column "beside it" for the four slot values, matching CAP-5's `[kind] label`
  UI which needs the bare kind to build the badge.

This is not manufactured ambiguity — the spine's own **Deferred** section names exactly this fork and
declines to close it: *"Where a SongSet slot identity is persisted — in the `base_type` column itself, or
in a discriminator beside it — is a Story 20.2 / 20.7 schema call. `AD-19` fixes only that the identity
exists, is unique, is server-owned, and is a semantic name."* Two stories built from that same sentence can
legally disagree, and if they do: every `WHERE base_type = 'song-set'` query Unit 2 writes (the planner's
kind dispatch, the CAP-5 list UI, `AD-22`'s "only those two kinds expand" rule) silently stops matching the
rows Unit 1 wrote, because Unit 1 overwrote `base_type` with the slot string instead of leaving `song-set`
in place and adding a sibling column.

**Why it matters:** this is a case of two AD's (`AD-19`'s kind closure, `AD-19`'s slot-identity closure) and
one Deferred item all touching the *same column* without saying how they relate — precisely the "two AD's
touch the same mechanism" failure mode this lens is built to catch, and the spine has already flagged it as
open rather than accidentally missed it.

**Close it with:** pick one of the two shapes in the spine itself (not defer it to whichever story lands
first) — most naturally: `base_type` stays exactly the three kind values forever, and the four slot
identities live in a new column scoped to `song-set` rows only. Then update the Deferred note to record the
decision instead of the question.

## Pair 3 — MEDIUM-HIGH · "Distinguishable, shape TBD" still lets two admin-value stores collide (reopened residual)

`AD-22` already carries a fix for an earlier version of this exact hole: it requires that
"administrator-configured values must stay distinguishable from developer-authored layout," precisely
because `AD-21`'s migration must rewrite layout without discarding them and `AD-11`'s Reset keeps no second
copy. But the same sentence immediately hands the *how* back out: *"whether the distinction is an override
record beside the layout or a marked field inside it is a schema call, not an invariant."*

- **Unit 1 (SongSet config surface, Story 20.7):** picks the simplest path — writes the administrator's
  chosen `fontSize` / `backgroundImage` directly into the layout JSON's element `style`, the same field the
  renderer already reads, and marks it with a boolean flag inline (`"adminSet": true`) — a "marked field
  inside," fully licensed by the rule as quoted.
- **Unit 2 (`AD-21` migration author, arriving later against the same table):** was told the same clause and
  assumed the other shape — a side table / override record keyed by template + element id — because that
  is the shape that makes "rewrite the layout without discarding the override" mechanically tractable
  without a field-by-field diff against every possible layout mutation the migration makes.

Unit 2's migration code, written against its assumed shape, has nothing to read on Unit 1's rows: there is
no side record, only an inline flag the migration's diff logic doesn't know to look for. Depending on how
defensively Unit 2 wrote the "don't touch admin values" check, this reproduces the exact failure `AD-22`'s
sentence exists to prevent — the administrator's `fontSize: 52` and the developer's new default `fontSize:
46.67` are the same field, and the migration cannot tell which one a human chose, because the *existence*
of the distinguishing marker was never guaranteed to be the same marker system on both sides of the
boundary.

**Why it matters:** the previous adversarial pass on this spine already forced the "distinguishability must
exist" fix; this pass shows that fix was necessary but not sufficient — it converted a total silence into a
narrower, still-open fork, and the fork sits exactly on the boundary between two independently-built
stories (the authoring surface and the migration) that have no reason to compare notes before one of them
ships.

**Close it with:** name the shape in the spine, not just its existence — e.g. "administrator overrides are
recorded in a table separate from `layout_json`, keyed by `(template_id, element_id, field)`" — so `AD-21`
and Story 20.7 are provably building against the same representation before either lands.

## Pair 4 — MEDIUM · "Announcements master list stays live" reads as two different scoping models

`AD-16`'s carve-out reads: *"Announcement membership is not cloned: the Announcements master list stays
live and reaches an existing service at render time (CAP-7)."* "Master list" is never defined elsewhere in
the spine.

- **Unit 1 (existing/incumbent design — matches the current schema):** `announcement_items` carries a
  `service_id` foreign key (verified directly in `src/lib/db/index.ts`). "Stays live" here means: this
  service's own announcement assignment is not frozen at clone time, so an operator can keep adding or
  removing images for *this* service right up to render, and Sync Artifact doesn't need to touch it because
  it was never part of the snapshot to begin with. Scoping is per-service throughout.
- **Unit 2 (a developer implementing CAP-7 fresh from the spine, without cross-checking the existing
  table):** reads "master list" literally — one global, currently-active set of announcement images, not
  scoped to any particular service, on the reasoning that a solo-operator single-congregation hub only ever
  has one "current week" in flight, so scoping by service is unnecessary machinery. Builds (or repurposes)
  an unscoped `announcements` table read the same way by every service's plan build.

Both comply with the literal sentence — it says "stays live," not "stays live and scoped per service." The
divergence is latent rather than immediately visible, because under normal single-current-service operation
the two designs render identically. It surfaces the moment two services are open at once — a stale service
re-opened for a bulletin correction, or next week's service prepared early while this week's is still being
finalized: Unit 2's global list bleeds this week's announcement images onto whichever other service's plan
gets built next, something Unit 1's `service_id`-scoped design structurally cannot do.

**Why it matters:** `AD-16` is the decision that most needed to say "scoped to which service" and didn't,
because everywhere else in the same rule it is careful about exactly that (snapshot is per-service,
Sync Artifact names the service). The one exception it carves out is the one place scoping is left to the
reader's assumption.

**Close it with:** one clause: "the Announcements master list is scoped per service (`service_id`), matching
the clone/snapshot boundary everywhere else in this decision; render time reads live from that scope, not
from a global list."

## Pair 5 — MEDIUM · No stated failure mode when a stale snapshot outlives what Reset/migration kept

`AD-16` states plainly: *"A later structural change obliges nobody to keep an older snapshot renderable."*
`AD-18` repeats the same acceptance for a `base_type` collapse. Both are permissions, not prohibitions, and
neither says what "not renderable" looks like in practice.

- **Unit 1 (PPTX renderer, `pptx.ts`):** on encountering a snapshot element whose `layoutId` or placeholder
  key the live registry no longer defines (post-Reset or post-migration), throws — treating an
  unrenderable reference as a hard generation error, on the reasoning that a corrupt-looking deck is worse
  than no deck and an operator should be forced to re-sync.
- **Unit 2 (Web `SlideView`):** on the same input, skips the offending element and renders the rest of the
  slide — reasoning that a partially-degraded slideshow is strictly better for an in-progress service than
  a hard crash, and that `AD-1`'s offline-Sabbath-reliability spirit favors "something on screen" over "an
  exception."

Both are defensible, both are explicitly licensed by "obliges nobody to keep renderable," and both comply
with `AD-7`/`AD-12` (neither recomputes order or invents content — they differ only in failure handling for
content the plan already carries). The two renderers now visibly disagree on the same stale service: PPTX
download fails outright while the web slideshow silently plays a degraded deck, for a condition the spine
says is allowed to exist by design (`AD-16`) rather than an edge case either team thought to negotiate.

**Why it matters:** `AD-7`'s whole point is that "no surface recomputes order or content" so the two
renderers agree — but it is silent on whether they must agree on *failure* behavior for content the plan
itself cannot fully hydrate, which is exactly the situation `AD-16`/`AD-18` say is allowed to arise.

**Close it with:** one sentence on `AD-7` or `AD-16`: when `buildSlidePlan` cannot fully hydrate a snapshot
element, the Fat Payload carries an explicit "unrenderable" marker in its own schema, and every renderer's
behavior for that marker (skip vs. fail vs. placeholder) is specified once, not decided independently per
renderer.

## Checked and found sound

- **Migration rewriting service snapshots.** A prior adversarial pass on this spine found this open;
  `AD-18` now states outright, "a migration ... does not rewrite service snapshots," closing it as a
  prohibition rather than a permission. Verified present in the current text.
- **Background-image vocabulary for the SongSet bounded config surface (`AD-22`).** Same prior pass found
  this open against `AD-8`'s enumeration; `AD-22` now explicitly says both background references "resolve
  through the shared helper AD-8 requires," closing the gap by citation. Verified present.
- **Seeding marker vs. data-version counter both living in `settings`.** Same prior pass found this open;
  `AD-21` now states directly, "AD-17's seeding marker and this counter are distinct, and neither
  substitutes for the other." Verified present.
- **SongSet hymn-number binding surviving Sync Artifact's destructive re-clone.** Tried to break this by
  assuming a schema author would foreign-key the service's entered hymn number to a specific snapshot row
  (which a delete-and-reinsert re-clone would orphan). Held: `AD-19` explicitly fixes the binding key as the
  *semantic slot-identity string itself* ("that identity is the key the worship-service settings form binds
  a hymnal number to"), not a row reference, and separately states the deleted-row case as "inert, not an
  error." There is no row to orphan because the rule never licenses keying by row.
  - Note: how the *renderer* looks up "which snapshot row currently carries slot X" at plan-build time is
    still an implementation detail with no AD covering it, but it is a same-team, same-query lookup with
    low divergence risk — not a cross-unit incompatibility the way the binding key would have been.
- **Off-canvas clipping / overflow rendering between Web and PPTX (`AD-15`'s "coordinates may extend beyond
  the canvas").** Considered as a pair — the two renderers could reasonably disagree on CSS `overflow`
  policy versus PowerPoint's native slide-boundary clipping. Did not promote to a full pair: CAP-3's success
  criterion ("appears equivalently in web Presenter and PPTX") is a test-level obligation independent of
  this spine, and any implementer checking that criterion catches the divergence before ship, unlike Pairs
  1-5 where nothing forces the two units to compare output.
- **Registry-asset vocabulary for General-canvas images vs. announcement/hub-upload images (`AD-8`).** Each
  vocabulary is named for its own surface ("registry `/assets/...` refs for Artifact templates," uploads for
  announcements); no rule licenses a General canvas write path to reach for the uploads vocabulary instead.
  No divergence found.
- **Registry admin-route authorization as a specialization of the AD-5 gate (`AD-14`).** Checked whether a
  registry route could plausibly ship believing itself covered by a weaker check; `AD-14` explicitly names
  both the matcher-inclusion requirement and the same-change-set test obligation `AD-5` demands, leaving no
  room for a route to reason its way to a separate scheme.
