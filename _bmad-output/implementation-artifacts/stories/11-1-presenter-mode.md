# Story 11.1: Dual-screen Presenter Mode (FR-16)

Status: done

## Story

As an on-duty operator,
I want a projector window synced with an operator view,
So that I can advance a clean deck while seeing current/next and the Run-Sheet.

## Acceptance Criteria

1. **Given** `/services/:id/present`, **When** opened, **Then** operator view shows current/next + compact Run-Sheet.
2. **Given** Open projector, **When** `/present/projector` opens, **Then** it syncs via `BroadcastChannel('bic-present-'+id)`.
3. **Given** operator advances, **When** projector is open, **Then** both stay in lockstep.
