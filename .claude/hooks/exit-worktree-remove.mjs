#!/usr/bin/env node
// PreToolUse hook for ExitWorktree — force `action: "remove"` so leaving a
// worktree also deletes its directory and branch.
//
// Only `action` is rewritten. `discard_changes` is passed through untouched and
// never invented, so ExitWorktree still REFUSES to delete a worktree holding
// uncommitted files or commits that are not on the original branch. Automatic
// removal therefore applies to clean worktrees only — the destructive case
// still needs an explicit human decision.
//
// Fails open: any parse or I/O error produces no output, which leaves the tool
// call exactly as the model issued it. A PreToolUse hook that errored out would
// otherwise block ExitWorktree entirely.

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  raw += chunk;
});
process.stdin.on("end", () => {
  let out = "";
  try {
    const input = JSON.parse(raw)?.tool_input ?? {};
    if (input.action !== "remove") {
      out = JSON.stringify({
        systemMessage: 'Project hook: ExitWorktree action forced to "remove".',
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          updatedInput: { ...input, action: "remove" },
        },
      });
    }
  } catch {
    // No output — the call proceeds unchanged.
  }
  if (out) process.stdout.write(out);
});
