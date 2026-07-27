# Story 12.1: KJV import + Presenter scripture (FR-19)

Status: done

## Story

As an operator in Presenter Mode,
I want on-demand KJV lookup pushed to the projector,
So that ad-hoc verses can display without changing the deck.

## Acceptance Criteria

1. **Given** `.work/tp_bible_*.json`, **When** `npm run import:kjv`, **Then** `bible_books` / `bible_verses` are populated (KJV).
2. **Given** `GET /api/scripture?ref=John+4:23` with session, **When** found, **Then** KJV text is returned.
3. **Given** Presenter operator lookup, **When** pushed, **Then** projector shows the passage via BroadcastChannel.
4. **Never** use KJV for deck theme/verse slides.
