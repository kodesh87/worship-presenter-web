#!/usr/bin/env bash
# Cursor worktree setup — mirrors Claude Code (.claude/settings.json + .worktreeinclude).
set -euo pipefail

ROOT="${ROOT_WORKTREE_PATH:?ROOT_WORKTREE_PATH is not set}"

echo '[worktree-setup] Refreshing origin/main...'
git -C "$ROOT" fetch origin main --quiet 2>/dev/null || true

copy_include_entry() {
  local rel="${1%/}"
  # Every skip below returns 0 on purpose. A bare `return` hands back the status
  # of the test that preceded it, and under `set -e` that non-zero status kills
  # the whole run from the loop body — one absent entry (.env is optional, and
  # data.db-shm/-wal only exist mid-write) would strand every later copy and the
  # node_modules link.
  [[ -z "$rel" ]] && return 0
  # Entries are copied as literal paths. A gitignore glob or negation matches
  # nothing here and would skip in silence, reading as if it had been copied.
  if [[ "$rel" == *'*'* || "$rel" == *'?'* || "$rel" == *'['* || "$rel" == '!'* ]]; then
    echo "[worktree-setup] skipped $rel — literal paths only, no glob patterns" >&2
    return 0
  fi
  local src="$ROOT/$rel"
  [[ -e "$src" ]] || return 0
  if [[ -d "$src" ]]; then
    mkdir -p "$(dirname "$rel")"
    rm -rf "$rel"
    cp -a "$src" "$rel"
    echo "[worktree-setup] copied dir $rel"
  else
    mkdir -p "$(dirname "$rel")"
    cp -a "$src" "$rel"
    echo "[worktree-setup] copied file $rel"
  fi
}

while IFS= read -r line || [[ -n "$line" ]]; do
  # Trim both ends with parameter expansion rather than xargs: xargs aborts on an
  # unbalanced quote (data/o'brien/) and silently eats backslashes (data\local ->
  # datalocal). [[:space:]] also drops the trailing CR of a CRLF checkout.
  line="${line#"${line%%[![:space:]]*}"}"
  line="${line%"${line##*[![:space:]]}"}"
  # Gitignore opens a comment with '#' only at the start of a line, never inline,
  # so a '#' inside a path stays part of the path — as it does for PowerShell.
  [[ -z "$line" || "$line" == '#'* ]] && continue
  copy_include_entry "$line"
done < "$ROOT/.worktreeinclude"

if [[ -d "$ROOT/node_modules" ]]; then
  rm -rf node_modules
  ln -s "$ROOT/node_modules" node_modules
  echo "[worktree-setup] node_modules symlink -> $ROOT/node_modules"
else
  echo '[worktree-setup] node_modules missing in main checkout — npm ci'
  npm ci
fi

echo '[worktree-setup] complete (Cursor / Claude Code parity)'
