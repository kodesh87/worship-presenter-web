# Step 1: Pre-flight

Read-only environment and baseline checks, run exactly once per run, before
the first story is selected. Every check here MUST be non-mutating: no
terminal is created, no file is written outside the journal, and no git
command that changes state is run.

## Resolve the Orca executable once

The run MUST resolve `<orca>` exactly once, in this order, and MUST reuse the
resolved value for every later command in this step and every subsequent
step — never re-resolve mid-run.

1. If the environment variable `ORCA_CLI_COMMAND` is set, `<orca>` MUST be its
   value.
2. Else, if the run is in a dev checkout that exposes
   `ORCA_DEV_REPO_ROOT`, `<orca>` MUST be `orca-dev`.
3. Else, if the run is on Linux and outside an Orca-managed terminal, `<orca>`
   MUST be `orca-ide`. Bare `orca` MUST NOT be run in this case: on that
   platform outside an Orca terminal it resolves to the GNOME screen reader
   and starts speech on the operator's machine.
4. Else `<orca>` MUST be `orca`.

If the resolved executable cannot run, the run MUST report its exact error and
escalate under condition 5. It MUST NOT fall through to the next candidate in
the order above — a silent fallback could target a different Orca build than
the one the operator intended.

## Load the orchestration guide

Once `<orca>` is resolved, the run MUST load the version-matched guide with:

```
<orca> skills get orchestration
```

The run MUST NOT act on a remembered or cached copy of this guide from an
earlier session or an earlier run — the guide is versioned to the installed
binary, and a stale copy can describe a flag or a wait condition that no
longer exists.

## Environment checks

Each of the following MUST pass before the run proceeds to story selection.
Each is independent of the others; a failure in one MUST NOT suppress the
others from being checked and recorded.

- **Orca reachable** — MUST run `<orca> status --json` and MUST require a
  successful, parseable response.
- **GitHub auth** — MUST run `gh auth status` and MUST require success.
- **Clean tree** — MUST run `git status --porcelain` and MUST require empty
  output.
- **`agy` trust gate and served models** — one probe proves both, and MUST run
  on a real run only. A declarative precondition here would be a branch with
  no detector: no read-only command reports whether that gate is cleared.
  - For each of the two `agy` model rows the operator's panel rule mandates,
    MUST create one terminal with `dispatch-recipes.md`'s terminal-creation
    command and argv assembly, MUST send that CLI's own trivial prompt, and
    MUST wait for `tui-idle`. No task, no dispatch, no `worker_done`: this is
    not a worker.
  - A terminal that never reaches `tui-idle`, or whose output shows a
    workspace-trust prompt, MUST be treated as the trust gate not cleared and
    escalate under condition 5.
  - MUST read the served model for each row from the CLI's own log output, by
    the method the operator's `agy` rules name, and MUST record both in the
    journal `note`. Where both rows report the same served model MUST escalate
    under condition 5: the panel requires two distinct models and this account
    is serving one, which no fix inside this loop can change.
  - MUST close both terminals with `orca terminal close --terminal <handle>
    --json` — no dispatch owns them, so `worker-release` does not apply.
  - `step-04-review-panel.md` MUST rely on what this check recorded and MUST
    NOT re-verify per panel. The gate is cleared once for this worktree path,
    which every worker shares.

## Baseline

The run MUST establish a green baseline before the first story is selected,
so an inherited failure is never charged to whichever story happens to run
next:

```
npm run build
npm test
```

Both MUST be green. `npm test` already runs the public-repo guard as one of
its registered files, so a baseline failure is either the guard or an
ordinary test/build failure — the two are distinguished below.

## Dry-run branch

On a `dry-run` invocation this step MUST still run, and MUST hold to
`SKILL.md`'s contract that no Orca or repository state is mutated:

- MUST run the Orca resolution, the guide load, `<orca> status --json`,
  `gh auth status`, and `git status --porcelain` unchanged — each is read-only.
- MUST run `npm run build` and `npm test`. Their only output is the ignored
  build directory and no repository state changes, and skipping the baseline
  would make the dry run silent about the one failure most likely to stop the
  real run.
- MUST NOT create the `agy` probe terminals. MUST instead print both mandated
  rows as unverified, naming the trust gate and the served-model check as the
  two things a dry run cannot establish.
- MUST NOT write `preflight:` or anything else to the journal. MUST instead
  print the journal record it would have written.

## Recording and escalation

On a real run, the run MUST record the outcome as `preflight: passed` or
`preflight: failed` in the journal before story selection begins.

- A failure in any environment check above (Orca reachable, GitHub auth,
  clean tree, `agy` trust gate) MUST escalate under condition 5 —
  infrastructure is down.
- A red baseline MUST escalate under condition 1 if the public-repo guard test
  is the one that failed, or under condition 2 if `npm run build` or any other
  test failed. It MUST NOT escalate under condition 5: a red baseline is not
  an infrastructure failure, it is exactly the case condition 1 or 2 names.
