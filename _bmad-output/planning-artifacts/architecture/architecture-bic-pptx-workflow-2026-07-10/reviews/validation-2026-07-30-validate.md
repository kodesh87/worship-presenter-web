# Reviewer Gate — Validate intent (2026-07-30, fresh independent pass)

Target: `ARCHITECTURE-SPINE.md`, AD-1..AD-22, the single project spine as committed in `c04fea0`
("consolidate to one architecture spine, then make it pass its own gate").

This is a **standalone Validate run** — the spine is not changed by it. Lenses run: deterministic
`lint_spine.py`, the good-spine rubric walker, and both configured `finalize_reviewers`
(version/reality-check, adversarial two-units), each dispatched as an **independent fresh subagent**
with no knowledge of the prior post-trim round's findings, so they could not simply confirm old
results — they had to re-derive.

**Verdict: not a clean pass.** The spine's last Reviewer Gate round (post-trim, same commit) found
six issues and fixed them — this run verified all six fixes actually hold. But a fresh, independently
adversarial read surfaces a new layer this narrower prior round didn't examine: one cross-document
contradiction with `EXPERIENCE.md` that's live today, a mis-cited source path, a boot-order
interaction between three separately-worded ADs, and two places where the spine's own "left as an
open schema call" language lets two compliant units disagree about the same column. **1 CRITICAL, 3
HIGH, 1 MEDIUM-HIGH, 4 MEDIUM, 3 LOW.**

---

## What's confirmed clean (not re-litigated)

- **`lint_spine.py`: 0 findings.** AD ids ascending, none duplicated/reused, every block carries
  Binds/Prevents/Rule, every Stack row pinned, no placeholders, no unresolved cross-references.
- **Stack table: zero version drift**, re-verified row by row against both `package.json` and the
  resolved `package-lock.json` — all ten rows match exactly, and the two Stack-named releases
  (Next.js 16.2.10, React 19.2.4) are confirmed real, current releases via web search.
- **The prior post-trim round's six fixes all hold**, independently re-checked:
  - `AD-18` — migration-must-not-rewrite-snapshots is a stated prohibition, not a permission.
  - `AD-22` — background image refs cite `AD-8`'s shared helper explicitly.
  - `AD-21` — the seed marker and the data-version counter are explicitly stated as distinct.
  - `AD-22` — administrator-configured values vs. developer layout distinguishability is required
    (though see H4/Pair 3 below — required-to-exist is not the same as unambiguous).
  - Design Paradigm citation range and CAP-4's AD-22 citation were both refreshed.
- **Nearly every file/function/line citation checked against real source resolves exactly** —
  `src/proxy.ts`, `registry/store.ts` (`RegistryStaleError`, `expectedUpdatedAt`), `registry/types.ts`
  (`READ_ONLY_BASE_TYPES`), `ArtifactEditor.tsx:104`, `registry/store.ts:226`, `db/index.ts`
  (`artifact_seed_hash_backfilled`), `registry/seed.ts`, `tests/registry-reseed.test.mjs`,
  `announcements.ts` — one directory citation is wrong (H2 below).
- **All eight CAP-1..CAP-8 rows cite a governing AD**; no capability is a hole.
- **Three of four holes from the pre-trim adversarial round are confirmed still closed**: migration
  rewriting snapshots, background-image vocabulary, and the two `settings` markers.

---

## CRITICAL

### C1 — `EXPERIENCE.md` still states, as current fact, the rule `AD-16` already reversed

`AD-16` (dated `2026-07-30`, the same day as this spine's `updated:` field) supersedes `AD-14`'s
"global across services" clause: a service now clones a snapshot, and a live registry edit reaches
it only through explicit Sync. But `EXPERIENCE.md` → *Venue & Projection Constraints* (line 153)
still reads:

> "Registry edits are global and immediate... There is no per-service override, by design (AD-14).
> **Scheduled to reverse:** Epic 20 CAP-6 clones the registry per service... which supersedes AD-4."

Two problems compound: the reversal is framed as *future* even though `AD-16` is already decided and
dated today, and the citation is wrong on its own terms — it says AD-16 "supersedes AD-4" (LiveServer
durable paths, an unrelated decision) when the superseded clause belongs to `AD-14`. `epics.md`
(Story 20.8) independently confirms this is a known, still-open gap. The spine's `Deferred` list has
an entry that looks adjacent — staleness-affordance UX — but that is a narrower question than "this
companion doc currently contradicts the spine's core clone/sync rule for every service."

`AGENTS.md`'s own BMad gate requires a structural-invariant change to travel with its companion docs
in the same change set. `AD-16` is exactly such a change, and `EXPERIENCE.md` was not amended with it.

**Fix:** name this exact contradiction in `Deferred` (or close it directly) and correct
`EXPERIENCE.md`'s citation from AD-4 to AD-16 regardless of timing, since that citation is wrong
independent of the reversal question.

---

## HIGH

### H1 — A fresh install can seed vocabulary the migration will never see (boot-order hole)

`AD-11`/`AD-17` require the seed to validate and never re-seed an edited row — nothing requires the
seed JSON's `baseType` vocabulary to already match the *current* schema version. Today's shipped
`data/default-registry.json` still reads `"baseType": "text-placeholder"` (Epic 16 vocabulary).
Separately, `AD-21`'s future migration reasons from `AD-18`: *"until first deploy no production rows
exist... folds into production data version 1"* — a brand-new database starts at version 1, so its
one-time migration is a no-op there by design.

Neither AD fixes **boot order**. Today's `getDb()` runs schema DDL → value-migration/backfill →
`seedArtifactRegistry` last. If the future migration keeps that order, a fresh install migrates an
empty table (nothing to do, version stamped at head) and *only afterward* inserts seed rows straight
from the still-unconverted JSON — rows that were never "already persisted" when the one-time
migration ran, with the counter now at head and no migration left to run again. Result: a fresh
production database holding `text-placeholder` rows that `AD-19`'s three-kind validator rejects or
mis-scopes.

**Fix:** an explicit clause — the seed file is authored in the vocabulary of the *current* production
data version, asserted by a test that parses `data/default-registry.json` against the current
validator — or fix the order to seed-then-migrate so freshly-inserted rows are never exempt.

### H2 — Canvas editor's directory is mis-cited in two places inside the spine itself

CAP-3's "Lives in" cell and the Structural Seed source tree both point at `src/components/artifacts/`
for the canvas editor. The real editor (`ArtifactEditor.tsx` — the file `AD-13`/`AD-22` bind, and
which the spine's own `Deferred` section correctly cites at `ArtifactEditor.tsx:104`) lives in
`src/components/admin/`. `src/components/artifacts/` holds only `ArtifactSlide.tsx`, the *renderer*
under `AD-7`/`AD-12` — a different component under a different decision. The Structural Seed tree's
`src/components/` line never mentions `admin/` at all. Confirmed independently by both the rubric
walker and the version/reality-check lens.

**Fix:** change the CAP-3 cell to `src/components/admin/` (or disambiguate both paths) and add
`admin/` to the Structural Seed tree.

### H3 — Where a SongSet slot identity lives is a fork the spine hands to two owners, and it breaks silently

The spine's own `Deferred` section already names this fork and declines to close it: whether the four
slot identities live *in* `base_type` itself or in a discriminator column beside it. Two stories built
from that same sentence can legally disagree — and if they do, every `WHERE base_type = 'song-set'`
query (planner kind dispatch, CAP-5's list UI, `AD-22`'s "only those two kinds expand" rule) silently
stops matching rows the other unit wrote, because one shape overwrites `base_type` with the slot
string while the other leaves `song-set` in place and adds a sibling column. This is two ADs and one
Deferred item touching the same column without saying how they relate — flagged as open already,
not accidentally missed, but still open.

**Fix:** pick a shape in the spine itself — most naturally, `base_type` stays exactly the three kind
values forever, and the four slot identities live in a new column scoped to `song-set` rows only —
and update `Deferred` to record the decision instead of the question.

---

## MEDIUM-HIGH

### M1 — `AD-22`'s "distinguishable, shape TBD" is necessary but not sufficient (reopened residual)

A prior adversarial pass already forced the fix requiring administrator-configured values to stay
distinguishable from developer-authored layout. But the same sentence hands the *how* back out:
"whether the distinction is an override record beside the layout or a marked field inside it is a
schema call, not an invariant." One unit (the SongSet config surface) can write an inline
`"adminSet": true` flag into the layout JSON; a second unit (the later `AD-21` migration, built
independently) can assume a side table keyed by `(template_id, element_id, field)` because that's
what makes "rewrite the layout without discarding the override" mechanically tractable. The migration
then has nothing to read on the first unit's rows — reproducing the exact data-loss failure the fix
was meant to prevent, just one layer further out.

**Fix:** name the representation in the spine, not just its existence — e.g. "administrator overrides
are recorded in a table separate from `layout_json`, keyed by `(template_id, element_id, field)`" —
so the authoring surface and the migration are provably building against the same shape.

---

## MEDIUM

### M2 — `AD-19`'s "gone rather than renamed" is stated as present fact, unlike its sibling `AD-21`

`AD-19` states in the present tense that the kind vocabulary already is the closed three-value set.
`src/lib/registry/types.ts` still ships the full seven-value `ARTIFACT_BASE_TYPES` set. This is
expected (Epic 20 is still backlog) — but `AD-21` explicitly flags its own shipped/unshipped gap in
`Deferred`, while `AD-19`/`AD-20`/`AD-22`, describing the same unshipped migration, don't. A reader
skimming only AD text can mistake "decided" for "already true in `src/`."

**Fix:** one `Deferred` line, parallel to the `AD-21` one, naming that `AD-19`/`AD-20`/`AD-22`
describe target state and `src/lib/registry/types.ts` still carries the seven-value vocabulary until
Story 20.1 lands.

### M3 — Backup / disaster-recovery of the durable SQLite store is a silent dimension

`AD-4` fixes durable paths to prevent *ephemeral-container* loss; nothing in the spine — AD or
Deferred — addresses backup cadence or disk-failure recovery for that same path, even though the
registry is now (post-Epic-20) the sole source of the ordered deck, not just a seed-recoverable
catalog. This is exactly the kind of operational dimension the initiative altitude should at least
name, the way `Observability` is named and deliberately left at the `console.error` floor.

**Fix:** one `Deferred` line next to `Observability` naming backup/restore of `DB_PATH` as an open ops
item — even "manual/none today, revisit before the registry becomes irreplaceable" closes the
silence.

### M4 — "Announcements master list stays live" reads as two different scoping models

`AD-16`'s carve-out — "the Announcements master list stays live and reaches an existing service at
render time" — never states per-service scoping. The existing schema scopes `announcement_items` by
`service_id`; a developer implementing CAP-7 fresh from the spine's wording alone could reasonably
build (or repurpose) an unscoped table instead, reasoning that a solo-congregation hub only ever has
one "current week." The two designs render identically under normal single-service operation and
diverge only when two services are open at once — a stale service reopened for a correction while
next week's is being prepared — at which point the unscoped design bleeds one service's announcement
images onto another's plan. `AD-16` is careful about scoping everywhere else in the same decision;
this is the one carve-out it isn't.

**Fix:** one clause — "the Announcements master list is scoped per service (`service_id`), matching
the clone/snapshot boundary everywhere else in this decision."

### M5 — No stated failure mode when a snapshot element can't be hydrated

`AD-16`/`AD-18` both permit an older snapshot to stop being renderable, but neither says what
"unrenderable" looks like at render time. A PPTX renderer could treat a missing `layoutId`/placeholder
as a hard generation error; the web `SlideView` could skip the element and render the rest — both
defensible, both licensed by the same permissive wording, and now visibly disagreeing for the same
stale service. `AD-7`'s whole point is that no surface recomputes order or content so the two
renderers agree — but it's silent on whether they must agree on *failure* behavior for content the
plan itself can't fully hydrate.

**Fix:** one sentence on `AD-7`/`AD-16` — an explicit "unrenderable" marker in the Fat Payload schema,
with each renderer's behavior for it (skip / fail / placeholder) specified once, not per renderer.

---

## LOW

- **L1 — `deferred-work.md`'s "nine routes" figure is stale.** Counting actual `route.ts` files under
  the named groups today gives eleven, not nine (`services` alone has four). Not spine-authored, but
  repeated in the spine without an "approximate" qualifier.
- **L2 — React patch pin (`19.2.4`) is intentionally behind newer upstream patches** (`19.2.5`/`.6`/`.7`
  exist as of this review), confirmed as a deliberate pin via the lockfile — fine, but undocumented as
  intentional, unlike caret-range entries elsewhere in the same table.
- **L3 — `Node.js v20+` is an unenforced claim.** No `engines` field, no `.nvmrc` — inferred only from
  `@types/node: ^20`. Not contradicted (dev env runs v22.20.0), just unverifiable from the manifest
  alone.

---

## Adversarial two-units lens — new pairs this round vs. previously closed

**New (this pass):** H1 (seed/migration boot order), H3 (slot-identity column fork), M1 (reopened
distinguishability residual), M4 (announcements scoping), M5 (stale-snapshot failure mode).

**Re-verified closed from the pre-trim round:** migration-rewrites-snapshots prohibition,
background-image-vocabulary citation, seed-marker-vs-version-counter distinctness — all three
confirmed present and unchanged in the current text.

**Tried and held (no pair found):** SongSet hymn-number binding surviving Sync's destructive re-clone
(the binding key is the semantic slot string, not a row reference, so there's no row to orphan);
off-canvas clipping/overflow policy between Web and PPTX (a test-level obligation, not a spec gap);
registry-asset vocabulary separation between General-canvas images and announcement/upload images;
registry admin-route authorization as an `AD-5` specialization.

## Version / reality-check lens — summary

No fabricated or mismatched technology in the Stack table; all ten rows verified against
`package.json` **and** the resolved lockfile with zero drift, and the two dated releases (Next.js
16.2.10, React 19.2.4) confirmed real via web search. Every spot-checked file/function/line citation
resolved to matching source except the canvas-editor directory (H2). Several AD-19/21/22 claims
describe intended-but-unshipped state and the spine's own `Deferred` section mostly says so
correctly (M2 names the one gap in that self-labeling).
