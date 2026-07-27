# Story 6.6: Automated Tests (parser / middleware / webhook)

Status: done

## Story

As a maintainer,
I want regression tests for auth, webhook, and rundown parsing,
So that robust-parsing expectations and story testing notes are covered.

## Acceptance Criteria

1. **Given** the sample addendum rundown, **When** parser tests run, **Then** sermon / The Speaker / Special Song `-` / hymn resolution assert green.
2. **Given** missing/wrong auth or webhook secret, **When** middleware/webhook tests run, **Then** 401/503 responses are asserted.

## References

- `deferred-work.md` zero-tests debt
