# Story 7.1: Services list/search API (FR-8)

Status: done

## Story

As picoclaw / an operator,
I want `GET /api/services` with optional `?q=` text search,
So that Services are queryable by date/raw/parsed text for targeting.

## Acceptance Criteria

1. **Given** a session, **When** `GET /api/services`, **Then** services JSON is returned.
2. **Given** `?q=`, **When** searching, **Then** matches date, raw_payload, or parsed_data.
3. **Given** no session, **When** calling the API, **Then** 401.
