# Story 9.1: Telegram correction + first-save-wins (FR-12/13b)

Status: done

## Story

As a song leader / reviewer,
I want Telegram corrections to target a Service and concurrent web edits to conflict safely,
So that late changes do not silently overwrite each other.

## Acceptance Criteria

1. **Given** webhook `{ action: "correct", date|serviceId, text?|fields? }`, **When** posted, **Then** the targeted Service updates.
2. **Given** PUT without matching `updated_at`, **When** saved, **Then** 409 is returned.
3. **Given** a successful PUT, **When** response returns, **Then** it includes the new `updated_at`.
