# Cursor worktree setup - mirrors Claude Code (.claude/settings.json + .worktreeinclude).
# Copy list is read from .worktreeinclude in the main checkout (ROOT_WORKTREE_PATH).
$ErrorActionPreference = 'Stop'

$Root = $env:ROOT_WORKTREE_PATH
if (-not $Root) {
  Write-Error 'ROOT_WORKTREE_PATH is not set - Cursor injects this during worktree setup.'
}

Write-Host '[worktree-setup] Refreshing origin/main...'
& git -C $Root fetch origin main --quiet
if ($LASTEXITCODE -ne 0) { Write-Host '[worktree-setup] git fetch skipped (non-fatal)' }

function Link-Or-Install-NodeModules {
  $src = Join-Path $Root 'node_modules'
  if (-not (Test-Path $src)) {
    Write-Host '[worktree-setup] node_modules missing in main checkout - npm ci'
    npm ci
    return
  }

  if (Test-Path 'node_modules') {
    Remove-Item 'node_modules' -Recurse -Force -ErrorAction SilentlyContinue
  }

  $rootDrive = (Split-Path $Root -Qualifier)
  $hereDrive = (Split-Path (Get-Location) -Qualifier)
  $linkType = if ($rootDrive -eq $hereDrive) { 'Junction' } else { 'SymbolicLink' }

  try {
    New-Item -ItemType $linkType -Path 'node_modules' -Target $src -ErrorAction Stop | Out-Null
    Write-Host "[worktree-setup] node_modules $linkType -> $src"
    return
  } catch {
    Write-Host "[worktree-setup] link failed ($($_.Exception.Message)) - npm ci"
  }

  npm ci
}

function Copy-WorktreeIncludeEntry([string]$Line) {
  $trimmed = $Line.Trim()
  if (-not $trimmed) { return }

  $isDir = $trimmed.EndsWith('/') -or $trimmed.EndsWith('\')
  $rel = $trimmed.Replace('/', [IO.Path]::DirectorySeparatorChar).TrimEnd([IO.Path]::DirectorySeparatorChar)
  if (-not $rel) { return }

  $src = Join-Path $Root $rel
  if (-not (Test-Path $src)) { return }

  $dest = Join-Path (Get-Location) $rel
  if ($isDir -or (Test-Path $src -PathType Container)) {
    $parent = Split-Path $dest -Parent
    if ($parent -and -not (Test-Path $parent)) {
      New-Item -ItemType Directory -Force -Path $parent | Out-Null
    }
    if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
    Copy-Item -Path $src -Destination $dest -Recurse -Force
    Write-Host "[worktree-setup] copied dir $rel"
  } else {
    $parent = Split-Path $dest -Parent
    if ($parent -and -not (Test-Path $parent)) {
      New-Item -ItemType Directory -Force -Path $parent | Out-Null
    }
    Copy-Item -Path $src -Destination $dest -Force
    Write-Host "[worktree-setup] copied file $rel"
  }
}

$includeFile = Join-Path $Root '.worktreeinclude'
if (-not (Test-Path $includeFile)) {
  Write-Error "Missing .worktreeinclude at $includeFile"
}

Get-Content $includeFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -match '^#' -or $line -eq '') { return }
  Copy-WorktreeIncludeEntry $line
}

Link-Or-Install-NodeModules

Write-Host '[worktree-setup] complete (Cursor / Claude Code parity)'
