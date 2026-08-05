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
- **`agy` trust gate** — the `agy` workspace-trust gate MUST already be
  cleared for this worktree path. This run dispatches no `agy` worker until
  it is; a gate cleared later, once per epic, is not this check's job to
  re-verify.

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

## Recording and escalation

The run MUST record the outcome as `preflight: passed` or `preflight: failed`
in the journal before doing anything else.

- A failure in any environment check above (Orca reachable, GitHub auth,
  clean tree, `agy` trust gate) MUST escalate under condition 5 —
  infrastructure is down.
- A red baseline MUST escalate under condition 1 if the public-repo guard test
  is the one that failed, or under condition 2 if `npm run build` or any other
  test failed. It MUST NOT escalate under condition 5: a red baseline is not
  an infrastructure failure, it is exactly the case condition 1 or 2 names.
