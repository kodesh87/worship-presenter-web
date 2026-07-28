# Workflow State: Mission Control Lab Design

## Identity

- `WORKFLOW_ID`: `mission-control-lab-design`
- `STATUS`: `DOCUMENTATION_READY`
- `CURRENT_OWNER`: `user`
- `HANDOVER_SEQ`: `0`
- `LATEST_HANDOVER_ID`: `none`
- Git object format: `sha1`

## Goal

Define a portable, multi-project Mission Control that derives a Kanban board from BMad/inter-agent evidence, coordinates subscription-backed local agents, runs two independent Antigravity reviews, isolates each story in its own Git branch/worktree, and asks the user only for material decisions or permissions.

## Definition of Done for This Design Work Item

1. The existing workflow and all six transition skills are read completely.
2. Current repository evidence is audited for automation hazards.
3. Board states, legal transitions, dependency eligibility, dual-review quorum, and consult behavior are explicit.
4. Control-plane, coordinator, local-runner, provider-adapter, repository, and Git boundaries are defined.
5. Stable acceptance criteria cover observer mode through close/push.
6. A self-contained lab folder can be moved to a dedicated repository.
7. No production code, tests, implementation configuration, branch, worktree, commit, push, or deployment is created.

## Ordered SSOT and Fingerprints

Git blob fingerprints use repository object format `sha1`.

1. `labs/mission-control/README.md` - `60fc826d395a395ee31058be40923f6555283f4c`
2. `labs/mission-control/SPEC.md` - `ed48831cacddacc9a723acfd601f3a217becaae6`
3. `labs/mission-control/ARCHITECTURE.md` - `7b6b003142e8ad4bb1692c220b96740c5b8ec0f6`
4. `labs/mission-control/DATA-MODEL.md` - `f2fed198fd6c17cf340500843fe422c7e6199736`
5. `labs/mission-control/ADAPTERS.md` - `4050fe02233fb4e48b69f711807085bfa9b42a4b`
6. `labs/mission-control/OPERATIONS.md` - `ba9921a9c2539e88cc262d28aedbe5b343199ef2`
7. `labs/mission-control/PORTABILITY.md` - `edc7d209798a3aac241f98549d6de10572b65158`
8. `.work/inter-agent-cooperation.md` - `6ff08309296249cd5fd81050147639e68fdd391b`

## Locked Decisions

- Use a website control plane plus authenticated local CLI/SDK runners; do not use a CLI-only or UI-scraping architecture.
- Keep repository artifacts as product/delivery evidence and the control DB as a rebuildable coordination projection.
- Only the coordinator may allocate handover sequences and commit state transitions.
- Use one branch and external worktree per story.
- Require a clean committed exact target before review.
- Run Gemini 3.6 Flash and Gemini 3.1 Pro as independent reviews of the same target, followed by one adjudicated handover.
- Treat `Need Consult` as a pausing overlay with structured options and allowed resume destinations.
- Mark `Done` only after `close-spek`, complete traceability, scoped commit, and confirmed branch push.
- Start implementation in a dedicated destination repository, not inside the BIC product codebase.

## Scope

- Mission Control product contract.
- Board state machine and dependency eligibility.
- Multi-project architecture and consistency model.
- Provider/repository/Git adapter contracts.
- Dual-review quorum and adjudication.
- Human-in-the-loop policy.
- Security, quota, recovery, rollout, and portability guidance.

## Non-goals

- No executable implementation.
- No provider installation or authentication.
- No modification of the six transition skills in this work item.
- No repair of existing immutable workflow history.
- No deployment or remote hosting.
- No automated merge to base branches.

## Constraints

- Codex may edit only Markdown documentation and operational chain artifacts.
- The destination repository is not yet selected.
- A BMad implementation epic/story and protocol-v2 transition-skill revision must exist before Cursor writes production code.
- Provider model selection can be requested and recorded but cannot be independently guaranteed when a provider omits authoritative metadata.
- Subscription quotas and overage policies remain provider-controlled and mutable.

## Code / Diff Identity

- Repository baseline: `118462739a74a1ed94ec159a4aace2d59118ebd2`
- Documentation diff source: `git diff -- labs/mission-control .work/inter-agent/mission-control-lab-design`
- Production code diff: `N/A`
- Implementation repository/branch/worktree: `not selected`

## Verification Evidence

- Complete workflow and six transition skill read: `pass`.
- Current chain anomaly audit: `pass` - duplicate H014 and wrong SKILL metadata detected.
- Official provider capability research: `pass` - Codex non-interactive CLI, Cursor Agent CLI, and Antigravity CLI/SDK paths confirmed.
- Local provider executable check: `partial` - Cursor editor CLI exists; Cursor Agent and Antigravity CLI are absent; current Codex desktop executable was not directly runnable from the shell.
- `git diff --check -- labs/mission-control`: `pass`.
- Production tests/build: `not run` - documentation-only design work item.

## Open Items

- Select or create the destination repository.
- Create the Mission Control implementation epic, observer-mode story, and implementation SPEC there.
- Approve and install protocol-v2 changes across all six transition skills.
- Install/authenticate provider CLIs or SDKs on the local runner host.
- Decide whether the first deployment is loopback-only or private-LAN.

## Handover Eligibility

No `spek-to-coding` handover is created yet. Cursor cannot implement without guessing the destination repository, implementation story, branch/base, package versions, and approved protocol-v2 skill changes. This is not an error or a request for immediate consultation; the user explicitly intends to move the lab later.

When the destination repository and observer-mode story exist, resume this design through `spek-to-coding`, fingerprint the destination SSOT, create the first immutable handover, and set the workflow to `AWAITING_CODING`.

## Traceability Matrix

| AC ID | Specification | Implementation | Test / gate | Review | Final documentation | Status |
| --- | --- | --- | --- | --- | --- | --- |
| AC-MC-001..003 | `SPEC.md` sections 4, 6, 11 | pending destination story | observer/project fixtures pending | pending | this lab | specified |
| AC-MC-004..005 | `ARCHITECTURE.md` sections 5, 10; `OPERATIONS.md` section 6 | pending | chain fixtures pending | pending | this lab | specified |
| AC-MC-006..008 | `SPEC.md` sections 7, 11; `ADAPTERS.md` | pending | host/Git fixtures pending | pending | this lab | specified |
| AC-MC-009..010 | `SPEC.md` section 8; `ARCHITECTURE.md` section 9 | pending | dual-review fixtures pending | pending | this lab | specified |
| AC-MC-011..012 | `SPEC.md` section 9; `OPERATIONS.md` sections 1-2 | pending | consult fixtures pending | pending | this lab | specified |
| AC-MC-013..014 | `ADAPTERS.md` sections 1-4 | pending | fake/live adapter gates pending | pending | this lab | specified |
| AC-MC-015..016 | `SPEC.md` sections 7, 11; `OPERATIONS.md` section 5 | pending | temporary remote fixture pending | pending | this lab | specified |
| AC-MC-017..019 | `ARCHITECTURE.md` sections 10, 12; `SPEC.md` section 12 | pending | recovery/observer tests pending | pending | this lab | specified |
| AC-MC-020 | `PORTABILITY.md` | pending destination extraction | portability audit pending | pending | this lab | specified |

## Chain Integrity

- Sequence is `0`; no immutable handover exists.
- `LATEST_HANDOVER_ID` is `none`.
- The work item is documentation-ready but intentionally not eligible for coding handover until destination-repository prerequisites are satisfied.
