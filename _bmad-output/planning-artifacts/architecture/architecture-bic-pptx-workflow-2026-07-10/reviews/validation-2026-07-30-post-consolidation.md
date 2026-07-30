# Reviewer Gate — Validate intent, post-consolidation (2026-07-30)

Target: `ARCHITECTURE-SPINE.md`, the single project spine, after the Epic 16 child spine was folded
in and Epic 20's decisions landed as AD-16..AD-19.

Question asked: **is this spine conformant with BMad?** Lenses run: `lint_spine.py`, the good-spine
rubric walker, plus both configured `finalize_reviewers` (version/reality check, adversarial
two-units). Run sequentially rather than as parallel subagents, per this session's constraint.

**Verdict: structurally sound and BMad-shaped in the large, but not conformant in four ways — one of
them the kind a consistency contract cannot have.** The consolidation itself is correct and is now
*more* BMad-default than before. What is off-pattern is what the spine carries: a self-contradiction
left in place, a template-mandated section missing, rationale where the template says decisions,
and a memlog that no longer holds the decisions its own spine states.

---

## What passes, stated so it is not re-litigated

- **`lint_spine.py`: 0 findings.** AD ids ascending, none duplicated or reused, every block carries
  Binds / Prevents / Rule, every Stack row pinned, no placeholder markers, no unresolved
  cross-references.
- **One spine per project is the BMad default**, and the live folder
  `architecture-bic-pptx-workflow-2026-07-10` now matches the configured `run_folder_pattern`
  (`architecture-{project_name}-{date}`) exactly. The earlier deviation — an epic folder created by
  hand while the pattern was never overridden — is resolved *by* the merge rather than papered over.
- **`## Inherited Invariants` correctly cut.** The template says to include it only when a parent is
  inherited; with one spine there is no parent, and the section is gone rather than left empty.
- **Citation resolvability preserved** despite the renumber: an AD map in the live spine *and* in the
  tombstone, former identities inline on every renumbered heading, 36 prefixed plus 16 bare citations
  repaired in the same change set.
- **Both mermaid diagrams are valid and non-empty**, and the dependency-direction graph functions as
  a rule (dotted no-access edges), which the template asks for explicitly.
- **Brownfield ratification is strong.** Every mechanism the Epic 20 decisions name was read from
  source this session, not recalled — `insertArtifactTemplateIfMissing`, `seedArtifactRegistry`
  inside `getDb`, `artifact_seed_hash_backfilled`, `ORDER BY label COLLATE NOCASE`,
  `READ_ONLY_BASE_TYPES`, `resolveAnnouncementUrls`.

---

## CRITICAL

### C1 — The spine contradicts itself, and the contradiction is parked rather than resolved

`## Consistency Conventions`, *State* row: the phrase *"services are immutable once presented"* is
struck through and flagged, and `## Open items` item 1 says the replacement wording is not written.
`AD-16` states the opposite in force.

A spine's single job is to be the one consistency contract. A contract that contains a struck-through
clause plus a note saying what it ought to say instead is not a contract — two readers can honestly
reach opposite conclusions, which is the exact failure mode the artifact exists to prevent. It was
defensible while two spines existed (the child carried a correction, the parent held the stale text
and the conflict was visibly *cross-document*). Folding them into one file removed that alibi: the
inconsistency is now internal, in the authoritative document, on purpose.

BMad also has no mechanism for this. The skill's triage step is explicit: blockers get resolved one
at a time; everything else is deferred **with a revisit condition in the memlog**. There is no third
state where a known-false statement stays in the spine.

**Fix:** write the corrected *State* row. The owner already supplied the substance on 2026-07-30 —
freeze at creation, supporting data entry rather than the generated deck, Sync permitted on any
service. This is a transcription, not a decision.

---

## HIGH

### H1 — `## Capability → Architecture Map` is missing, and it is template-mandated here

The template says this section is *"Present when a spec drove this run"* and calls it *"the
consistency auditor's checklist."* Two specs drove this run and both are in `sources:` —
`spec-slide-artifact-model/SPEC.md` and `spec-artifact-registry-authoring/SPEC.md`, the latter
carrying CAP-1..CAP-8 as the whole reason AD-16..AD-19 exist. The section is absent.

This is not a formatting nit: the map is the mechanism that catches an uncovered capability, and it
would have caught H2 below without a reviewer.

**Fix:** add the section, one row per CAP-1..CAP-8 plus the Epic 16 areas, each naming where it lives
and which AD governs it.

### H2 — CAP-1 has no invariant: nothing fixes that deck order stops living in code

CAP-1's success clause is *"…without editing TypeScript plan constants."* The spine never states
that. `AD-7` says `buildSlidePlan` is the only order **source**; `AD-16` says the snapshot is the
sequence **input**. Together they imply the registry supplies order — but neither forbids a
liturgical rule continuing to live as a literal in the planner, which is precisely what
`{ skipTitle: true }` at three call sites in `src/lib/slide-plan.ts` does today, and precisely what
Story 20.1 (absorbing Story 19.1) has to remove.

Two units can comply fully and diverge: one moves suppression into registry data, the other adds a
fourth `skipTitle` literal for a new liturgical case. Both obey every AD.

**Fix:** an AD fixing that per-slide sequence and liturgical flags are registry data, with the
planner applying rather than storing them — which is also what makes Story 20.1's AC checkable.

### H3 — Rationale sits in the spine where the template says the memlog

The template's guide is unambiguous: *"Decisions, not rationale (rationale lives in the memlog).
Carry shape in diagrams; prose only where it must."* Default output is a terse build substrate.

Four blocks violate it, and they are the four newest:

| Block | Off-pattern content |
| --- | --- |
| `AD-16` | *"What the snapshot is for — and what it is not"* — ~200 words of purpose and three consequence bullets |
| `AD-17` | *"Operational consequence this rule must carry"* |
| `AD-18` | *"Pre-first-deploy waiver"* narrative |
| `AD-19` | four extra bullets, including catalog-key spelling advice and two SPEC reconciliations for a different skill's pass |

Some of it is load-bearing and belongs *somewhere*: the private-override trap in AD-17 is a real
constraint, and the "not obliged to keep old snapshots renderable" clause in AD-16 genuinely binds a
migration. But the reasoning, the alternatives declined, and the notes addressed to a future
`bmad-spec` run are memlog and hand-off material. As written, these ADs read as meeting minutes, and
a terse spine is what keeps a small agent from drifting.

**Fix:** compress each to Binds / Prevents / Rule plus at most one binding clause; move the reasoning
to the memlog (much of it is already there) and the cross-skill notes to `sprint-status.yaml`.

---

## MEDIUM

### M1 — The spine is no longer distilled from its own memlog

BMad's Update flow says to resume from `.memlog.md`, *"the authority on what was decided"*, and
Finalize step 1 says the spine is **distilled from the memlog**. The merged spine's AD-11..AD-19 were
transcribed from the rendered Epic 16 spine instead. This memlog holds the *fold-in* decisions but
not the nine decisions the spine now states, whose decision-of-record lives only in
`../architecture-epic-16/.memlog.md` — which the live spine's `companions:` does not even reference
(it lists `CASE-STUDY.md` alone).

Consequence: a future resume reads this memlog, finds no record of AD-11..AD-19, and either re-derives
them or drops them.

**Fix:** either append the nine decisions to this memlog, or list
`../architecture-epic-16/.memlog.md` as a companion of record and say in the spine that it is where
AD-11..AD-19 were decided. The second is cheaper and does not fake a history.

### M2 — Story-level detail in an initiative-altitude spine

`altitude: initiative` keeps *features* coherent. The skill says even an epic spine *"does not expand
per-story detail."* AD-16..AD-19 name Story 20.1, 20.2, 20.5, 20.7, 20.8, and one bullet is addressed
to *"the `bmad-spec` pass."* That is two altitudes below where this document sits.

This is the cost of the merge, and it was foreseen but not mitigated. It is not fatal — the story
references are mostly locating aids — but combined with H3 it is why the spine has grown from a
contract into a briefing.

**Fix:** keep story pointers only where they identify *who owes an unresolved piece*; drop the rest.

### M3 — The tombstone invents frontmatter and occupies a scanned filename

`../architecture-epic-16/ARCHITECTURE-SPINE.md` declares `type: architecture-spine-tombstone`,
`status: superseded`, and `superseded_by:`. None exist in BMad: the template's `type` is
`architecture-spine` and `status` is `draft · final`. Worse, the file keeps the name
`ARCHITECTURE-SPINE.md` inside `spine_output_path`, and the skill's activation step 4 scans that path
for a prior run to offer resuming from. A future run may offer to resume a tombstone.

**Fix:** rename it to something outside the scanned name (e.g. `SUPERSEDED.md`) and use
`status: final` with the supersession stated in the body, or move the folder under a `superseded/`
subdirectory.

### M4 — `## Open items` is a section BMad does not have

Related to C1 but distinct: the template's vocabulary for undecided things is `Deferred` (each item
carrying *the reason it can wait*), and the skill's triage routes the rest to the memlog with a
revisit condition. A bespoke `Open items` section creates a third bucket that no downstream skill or
reviewer knows to read.

**Fix:** resolve item 1 (C1), and move item 2 to `Deferred` with its revisit condition, or resolve it
too — it is a one-line clarification to AD-9's own Rule.

---

## LOW

- **L1 — The operational envelope has no diagram.** The template names *"DEPLOYMENT & ENVIRONMENTS
  and external provider/infra topology … don't let it fall through"* as a Structural Seed candidate
  the initiative altitude owns. AD-4 carries it in prose (Docker/standalone, Cloudflare Tunnel, bind
  mounts) and `Deferred` names observability, so it is not *silent* — but there is no topology view.
  Pre-existing; not introduced by the consolidation.
- **L2 — `binds` lists FR and epic ranges, not the driving spec's capability ids.** The template says
  *"capability / unit IDs governed (from the driving spec)"*. CAP-1..CAP-8 are absent. Ties to H1.
- **L3 — `child_spines: []`** is not a template field and is now empty. Harmless, but it is a
  vestige of the two-spine world.
- **L4 — Stack table not re-verified this run.** It carries *"synced to it on 2026-07-29"* while the
  spine says `updated: '2026-07-30'`. The configured version lens asks exactly this. No version is
  load-bearing for AD-16..AD-19, so the risk is low — but the note now understates the file's age.
- **L5 — `AD-19` carries two Rules** (*"Rule — SongSet slots"*, *"Rule — Placeholder Catalog"*) and
  says so itself: *"the same species of hole, not the same hole."* Two divergences, two rules, one
  id. It should probably be two ADs; splitting it now costs a renumber, which is why this is LOW
  rather than higher — appending a new id for the catalog half is the cheap route if it is ever split.

---

## Adversarial two-units lens — new pairs found post-merge

- **Pair A (= H2).** Unit one moves `skipTitle` into registry data per CAP-1. Unit two adds a fourth
  literal in `slide-plan.ts` for a new liturgical case. Both obey every AD in the file.
- **Pair B.** Two readers of the *State* convention: one treats a presented service as frozen and
  builds Sync to refuse it; the other reads AD-16 and builds Sync unrestricted. This is C1 with a
  builder attached — the contradiction is not academic.
- **Attempted and clean:** the AD-6 / AD-16 and AD-9 / AD-19 double-meanings that existed while two
  spines coexisted are genuinely gone; one number now means one decision. The clone/Sync write paths
  still have exactly one owner each and both validate under AD-15.

## Version / reality-check lens

No new technology is named by the consolidation, so this reduces to whether claims about the codebase
hold. They do — see *What passes*. One process gap: **Finalize step 2 (Reconcile inputs) never ran**
for either driving SPEC, and step 3's semantic gate never ran against the *merged* file, only
`lint_spine.py`. H1 and H2 are what that omission cost, and this validation is the belated substitute.
