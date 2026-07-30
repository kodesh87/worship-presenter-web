# Reviewer Gate — version / reality-check lens (Epic 20 amendment, 2026-07-30)

Configured lens: *verify every committed decision was web-researched or reality-checked rather
than asserted from training data.* This amendment names **no new technology**, so the lens reduces
to its second half — is every claim about the existing codebase true, and is every claim about
project state true?

**Verdict: PASS. Every mechanism claim was read from source this session; one claim was corrected
before it shipped.**

## Claims about code, and where each was verified

| Claim in the spine | Verified at | Result |
| --- | --- | --- |
| A deleted row is resurrected on boot | `src/lib/registry/store.ts:395` — `reseedArtifactTemplateIfUntouched` calls `insertArtifactTemplateIfMissing` **first** and returns `'inserted'` | true |
| Seeding runs on every boot | `src/lib/db/index.ts:263` — `seedArtifactRegistry(db)` inside the `getDb` init block | true, once per process |
| A marker-gated one-time data migration already exists in this codebase | `src/lib/db/index.ts:13` — `artifact_seed_hash_backfilled`, gated on `settings`, applied via `backfillSeedHashes.immediate(db)` | true; AD-8 cites a real precedent, not an invented pattern |
| No ordering column exists today | `src/lib/registry/store.ts:81` — `ORDER BY label COLLATE NOCASE` | true; corroborates `epics.md` and Story 20.1 |
| `READ_ONLY_BASE_TYPES` / `EDITABLE_BASE_TYPES` exist and collapse with the taxonomy | `src/lib/registry/types.ts:13` and `:19`, consumed at `store.ts:90` and `store.ts:226` | true — **this one was checked precisely because it was inherited from `epics.md` prose rather than seen; an unverified path name in an `AD` is the failure mode this lens exists for** |
| The resurrection behaviour is asserted by a test | `tests/registry-reseed.test.mjs:337` — *"a missing row is inserted with its seed hash recorded"* | true; the Deferred item's insistence on **inverting** it is load-bearing |
| Optimistic concurrency is already implemented in the registry | `RegistryStaleError` / `expectedUpdatedAt` in `src/lib/registry/store.ts` and both `/api/admin/artifacts/[id]` routes | true — and it is what makes the missing INIT AD-6 row a live hazard rather than a tidiness issue |
| `loadSeedTemplates` is independent of any bootstrap marker, so Reset survives AD-7 | `src/lib/registry/seed.ts:55` — file read + per-process cache | true |

## Claims about project state

- **"No production deployment exists as of 2026-07-30."** Not asserted from the model's own
  belief: it is the owner's confirmation, restated in this session, and it is independently the
  recorded premise of two `open` Epic 16 action items in `sprint-status.yaml` (both reframed on
  2026-07-29 from "pre-Sabbath" to "pre-launch" on exactly that basis). AD-8's waiver rests
  entirely on this, and the spine logs it with an expiry trigger rather than as a standing fact.
  Correctly handled — but it *is* the amendment's single load-bearing assumption, so if it turns
  out a hub has been running, AD-8's waiver is void and the seven-to-three collapse needs the
  backfill the waiver skips.

## Stack table

Untouched, and correctly so: the amendment introduces no library. The table's own note
(*"`package.json` is the version authority; this table is a seed synced to it on 2026-07-29"*)
still holds, and nothing in AD-6/AD-7/AD-8 depends on a version. No pinning finding.

## Where a training-data assertion could still have slipped in, and did not

- AD-8 does **not** propose a migration tool. The temptation with "seven values become three" is to
  reach for a migration framework from memory; INIT AD-9 forbids it and AD-8 re-states the
  prohibition instead of quietly relaxing it.
- AD-7 does **not** invent a marker mechanism. It reuses the `settings`-key shape already in the
  file it cites.
- AD-6 does **not** name a storage shape for the snapshot. Guessing "a `service_artifacts` table"
  would have been asserting a design that does not exist; it is left in Deferred as a Story 20.8
  call, with only the durability requirement fixed by inheritance.
