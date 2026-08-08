# Version / reality check — 2026-08-07, Story 20.1 Gate discharge

**Lens (configured `finalize_reviewers`, never cherry-picked):** was every committed claim
web-researched or reality-checked rather than asserted?
**Verdict:** PASS on technology, THREE CITATION DEFECTS in this run's own text. All applied.

## Technology

This run introduces **no** technology, no version, and no starter. The Stack table is untouched.
Nothing here needed the web. The four Stack-currency items and the `next@16.2.10` security bullet
are inherited and unchanged — **re-verified as unchanged rather than re-researched**, which is the
correct scope for a run whose deliverable is a tag reconciliation.

## Reality check — every citation this run wrote was opened

Verified correct: `db/index.ts:438-446` (the `artifact_templates` DDL), `:444` (`seed_hash`),
`:445` (`position`), `:484`, `:495`; `store.ts:62`, `:76-96`, `:129-133`, `:233`, `:289`, `:323`;
`registry-snapshot.ts:76-92`, `:79`; `seed.ts:16`, `:19`, `:48`, `:115`, `:118`;
`types.ts:1-10`, `:13-17`; `ArtifactEditor.tsx:113`, `:842`; `slide-plan.ts:296-302`, `:357`,
`:478`, `:514`, `:724-731`, `:834-836`; `registry-reseed.test.mjs:105`, `:152`, `:304`, `:319`,
`:363`, `:386`; `slide-plan.test.mjs:231`.

### V1 — three off-by-a-little ranges (MEDIUM, against this run's own text)

| Written | Actual | Note |
| --- | --- | --- |
| `seed.ts:96-131` | **`:96-133`** | `bootstrapArtifactRegistry` closes at `:133` |
| `db/index.ts:300-320` | **`:300-318`** | `repairPreCounterArtifactRegistry` closes at `:318` |
| `scripts/registry-doctor.mjs:1-34` | **`:1-35`** | the header block's `*/` is at `:35` |

Small, and worth applying rather than waving through: this file's standing finding is that a citation
which cannot be checked is worse than none, and a range that stops two lines short of its own closing
brace is the shape a reader stops trusting. **Disposition: autofix.**

### V2 — one inherited citation repaired, and it had rotted into unrelated code (HIGH, pre-existing)

The AD-21 Deferred entry cited `ArtifactEditor.tsx:104` for the `READ_ONLY_BASE_TYPES` refusal. That
line is now `normalizeFontSize` — a font-size helper with nothing to do with read-only base types.
The two real sites are `:113` and `:842`. Repaired in place with the rot stated, because a citation
pointing at plausible-but-unrelated code is the failure the AD map paragraph opens on, and silently
correcting it would lose the fact that it happened. **Pre-existing, not this run's; fixed here.**

### V3 — checked, and the inherited claim holds

`seed.ts:39` → `:48` for `WPW_USE_SHIPPED_REGISTRY`: the mechanism is unchanged (the env var still
inverts the two-layer precedence and still only for tests and fidelity smokes), only the line moved.
Corrected with the old number stated.

## Not re-verified, and stated so a green review is not over-read

`prd.md:563` (NFR-3 bound on FR-20 registry edits) and `epics.md:52` (NFR-3 owned by no epic) are
carried forward from the entry this run rewrote and were **not** re-opened at this run. They are the
load-bearing half of the NFR-3 finding reported to the owner, so if that finding is acted on, they
should be read first.
