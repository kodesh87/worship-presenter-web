# Story 6.6: Automated Tests (parser / middleware / webhook)

Status: done

## Story

As a maintainer,
I want regression tests for auth, webhook, and rundown parsing,
So that NFR-5 (robust parsing) and NFR-6 (access control) are covered.

## Acceptance Criteria

1. **Given** the sample addendum rundown, **When** parser tests run, **Then** sermon / The Speaker / Special Song `-` / hymn resolution assert green.
2. **Given** missing/wrong auth or webhook secret, **When** middleware/webhook tests run, **Then** 401/503 responses are asserted.

## References

- `deferred-work.md` zero-tests debt

## Superseded terminology (recorded 2026-07-29)

This story's title and AC-2 say **middleware**. Under Next 16 the request gate is `src/proxy.ts`, not `middleware.ts`, and the rename is load-bearing — a Proxy file always runs on Node, which is what lets the gate open SQLite per request. The corresponding test is `tests/proxy-matcher.test.mjs`. Read AC-2 as covering the proxy gate. Recorded rather than rewritten: the AC is delivery history, and `bmad-dev-story` reads prior stories as *Previous Story Intelligence*, so the stale term needed correcting in place. NFR ids added by Correct Course 2026-07-29 (the PRD did not number its NFRs until then).
