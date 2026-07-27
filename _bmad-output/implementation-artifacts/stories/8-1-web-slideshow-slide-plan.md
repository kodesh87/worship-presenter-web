# Story 8.1: Web Slideshow + shared slide plan (FR-9/15)

Status: done

## Story

As a reviewer/operator,
I want a browser slideshow/preview driven by the same slide plan as PPTX,
So that preview and present match the downloaded deck order.

## Acceptance Criteria

1. **Given** `buildSlidePlan`, **When** PPTX generates, **Then** it consumes that plan.
2. **Given** `/services/:id/slideshow`, **When** opened, **Then** full-screen slides advance with ←/→/Space and fade.
3. **Given** slides loaded, **When** offline, **Then** advancing still works from client state (best-effort).
