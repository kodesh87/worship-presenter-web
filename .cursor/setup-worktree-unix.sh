#!/usr/bin/env bash
# Cursor worktree setup — mirrors Claude Code (.claude/settings.json + .worktreeinclude).
set -euo pipefail

ROOT="${ROOT_WORKTREE_PATH:?ROOT_WORKTREE_PATH is not set}"

echo '[worktree-setup] Refreshing origin/main...'
git -C "$ROOT" fetch origin main --quiet 2>/dev/null || true

copy_include_entry() {
  local rel="${1%/}"
  [[ -z "$rel" ]] && return
  local src="$ROOT/$rel"
  [[ -e "$src" ]] || return
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
  line="${line%%#*}"
  line="$(echo "$line" | xargs)"
  [[ -z "$line" ]] && continue
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
