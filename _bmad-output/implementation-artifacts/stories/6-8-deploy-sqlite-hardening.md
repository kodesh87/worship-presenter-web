# Story 6.8: Deploy + SQLite Production Hardening

Status: done

## Story

As a maintainer,
I want `DB_PATH`, WAL/busy timeout, and deploy notes for a single-node host,
So that `better-sqlite3` is production-safe for BIC’s hosting choice.

## Acceptance Criteria

1. **Given** `DB_PATH` set, **When** the app starts, **Then** SQLite opens that file.
2. **Given** deploy docs, **When** an operator follows them, **Then** they can run a single persistent Node process with a durable volume.

## References

- `deferred-work.md` better-sqlite3 / cwd `data.db` debt
