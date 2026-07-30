---
lens: rubric walker (good-spine checklist)
target: ARCHITECTURE-SPINE.md (AD-1..AD-22, post-trim)
run: 2026-07-30, Reviewer Gate under the Update intent
mode: sequential (subagents unauthorized this session; reviewer-gate.md permits the fallback)
---

# Rubric walker — post-trim spine

**Verdict: passes.** The trim did what it was for. `AD-16`..`AD-19` now carry only
`Binds` / `Prevents` / `Rule` (plus the cross-reference lines the file already used at `AD-11` and
`AD-14`), every clause the handover marked as binding survives inside a `Rule`, and the two
story-level notes that were addressed to another skill's pass have left the document. Three new
decisions arrived during the pass (`AD-20` was already in place; `AD-21` and `AD-22` are new) and
both close holes the checklist would otherwise have reported. Findings below are all
**post-trim regressions or newly exposed edges**, not leftovers from the trim.

## Checklist walk

| Criterion | Verdict |
| --- | --- |
| Fixes the real divergence points one level down, misses none | **Pass with findings** — R2, R3, R4 below are three it now misses |
| Every `AD`'s Rule is enforceable and prevents its stated divergence | **One failure** — `AD-18`'s snapshot clause is permissive, not prohibitive (R2) |
| Nothing under `Deferred` could let two units diverge | **Pass, one soft spot** — R7 |
| Named tech verified-current | Pass — see the version lens; Stack re-verified against `package.json` this run, no drift |
| Ratifies rather than contradicts the brownfield codebase | **Pass with a named delta** — `AD-22` extends `READ_ONLY_BASE_TYPES`; see the version lens |
| Covers the driving specs' capabilities | Pass — CAP-1..CAP-8 all governed; CAP-3's hole closed by `AD-22` this run |
| No new `AD` weakens an inherited one | N/A — one spine, no parent |
| Every dimension the altitude owns is decided, deferred, or open | Pass — operational envelope carried in `AD-4` prose + `Deferred` observability; still undiagrammed (R8, pre-existing) |

## Findings

### R1 — HIGH · Administrator configuration and developer-authored layout are indistinguishable

`AD-22` grants a `songset-*` row a bounded surface for **background image, font style and font
size**, and in the same breath says **layout composition is developer-owned seed data**. But font
size and background live *inside* the layout JSON — the shipped `song-set` template carries
`backgroundColor`, `backgroundImage` and per-element `style.fontSize` in the same structure as its
coordinates.

So the rule as written does not say whether an administrator's font choice is a value *beside* the
developer's layout or a mutation *of* it. Both readings satisfy `AD-22`. The consequence is not
cosmetic: under `AD-21`, a developer's later coordinate change reaches a deployed database as a data
migration, and that migration must preserve the administrator's configured values. If those values
were written in place with nothing marking them as administrator-owned, the migration cannot tell
what to keep — and `AD-11`'s Reset already restores the whole shipped template, so there is no other
record of them.

**Fix:** one clause requiring administrator-configured values to stay distinguishable from
developer-authored layout, without dictating the storage shape (that stays a story-level schema
call, like the two already in `Deferred`).

### R2 — HIGH · "Not obliged to keep snapshots renderable" permits two opposite implementations

`AD-18` ends: *"A migration is **not** obliged to keep existing service snapshots renderable
(AD-16); what it must preserve is the entered data."* **Not obliged** grants a licence; it forbids
nothing. One implementer migrates the live registry only and lets old snapshots break as `AD-16`
accepts. Another, reading the same sentence as merely permissive, also rewrites every service
snapshot's `base_type` so nothing breaks. Both obey the letter, and they produce different
databases — one where a past service still renders and one where it does not.

`AD-16` is the decision that should settle it: structure reaches an existing service **only** through
Sync Artifact. A migration that rewrites snapshots is a second structural channel, which `AD-16`
exists to prevent — but `AD-18` never says so.

**Fix:** turn the licence into a prohibition — a migration operates on the live registry and does
not rewrite service snapshots; a service takes structural change only through Sync.

### R3 — MEDIUM · The SongSet configuration surface accepts images and no `AD` resolves them

`AD-8` is careful about *which* surfaces it covers: announcements, hub uploads, registry `/assets/`
refs, PPTX embedding, and by name *"the canvas editor introduces no second resolver."* `AD-22` has
just created a **new image-accepting surface** that is explicitly *not* the canvas editor, and
nothing points it at the shared helper. A builder can satisfy `AD-22` while accepting an arbitrary
remote URL for a background.

**Fix:** cite `AD-8` in `AD-22`'s rule for the two background images.

### R4 — MEDIUM · Two markers in `settings`, and nothing says they are different things

`AD-17`: seeding *"is gated by a marker in `settings`"*. `AD-21`: the data version is *"one
monotonic version number in `settings`"*. A builder can reasonably collapse them — gate seeding on
`data_version >= 1` — and another can reasonably keep them apart. That is a divergence in the
bootstrap path, which `AD-9` names as shared ground and therefore sensitive.

**Fix:** one clause stating they are distinct: the seed marker records that bootstrap happened, the
counter records which data version is persisted; neither stands in for the other.

### R5 — LOW · The Design Paradigm's citation range is stale

*"data-driven presentation rendering with a decoupled editor **(AD-11..AD-19)**"* — `AD-20`,
`AD-21` and `AD-22` all belong to that same paragraph's subject (registry-authored deck, versioned
data, authoring authority). This is precisely the class of citation error the fold-in audit was
built to catch.

### R6 — LOW · CAP-4 does not cite `AD-22`

CAP-4 is *"Placeholder Catalog inserted and styled locally"* — and *locally* means **on a General**,
which is now `AD-22`'s rule. The row cites `AD-19` and `AD-15` only.

### R7 — LOW · A deferred schema call is a divergence point on paper

*"Where a SongSet slot identity is persisted"* could in principle let two units read the identity
from different columns. Mitigated in fact: both named stories (20.2 / 20.7) are the same schema
work, and everything downstream binds to the identity **value**, which `AD-19` fixes. Acceptable as
deferred; recorded so the mitigation is on the record rather than assumed.

### R8 — LOW · Operational envelope still has no diagram

Carried forward unchanged from the 2026-07-30 validation report (L1) and pre-dating the
consolidation. `AD-4` holds Docker/standalone, Cloudflare Tunnel and bind mounts in prose and
`Deferred` names observability, so the dimension is not silent — only undrawn. The owner has
deliberately left this open; not re-raised as actionable.

### R9 — LOW · CAP-5's `[kind] label` display for a slot-carrying row is unstated

CAP-5 shows an entry as `[kind] label`. For a `songset-*` row, is the chip `[song-set]` or
`[songset-bt-open]`? `AD-19` fixes the key and says `song-set` names the kind but is never an entry,
which implies the chip shows the kind — but the spine does not say it, and the display is
`EXPERIENCE.md`'s to own. Routed there rather than fixed here.
