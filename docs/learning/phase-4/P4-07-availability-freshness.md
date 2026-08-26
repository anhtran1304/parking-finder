# P4-07 — Availability Freshness Trust Signal

## Problem

Live slot counts are useful only when users can judge how recently they were confirmed. P4-06
already keeps each parking's `updatedAt` aligned with absolute WebSocket events and authoritative
REST refreshes, but parking cards did not expose that timestamp.

## Chosen model

- Every parking card shows a compact relative label next to its availability state.
- The sidebar owns one shared one-second clock and passes its value to every card. Individual cards
  do not allocate timers.
- Freshness is derived entirely from the existing `updatedAt` field, so no backend or realtime
  contract changes are required.
- The visible label uses seconds, minutes, hours or days. Values under five seconds and future
  timestamps caused by clock skew display as `Updated just now`.
- Invalid timestamps degrade to `Update time unavailable` instead of displaying `NaN`.
- The absolute local update time is available as both a tooltip and accessible label.

## Formatting contract

```text
age < 5 seconds    -> Updated just now
age < 60 seconds   -> Updated Ns ago
age < 60 minutes   -> Updated Nm ago
age < 24 hours     -> Updated Nh ago
otherwise          -> Updated Nd ago
invalid timestamp  -> Update time unavailable
```

Minutes, hours and days use floor rounding. A realtime event replaces `updatedAt`, so the affected
card returns to `Updated just now` on the next render without making another network request.

## Lifecycle

```text
Sidebar initializes
  -> set current clock value
  -> start one 1-second interval
  -> pass nowMs + each parking.updatedAt to cards

Sidebar destroys
  -> clear the shared interval
```

The trust signal is deliberately limited to parking cards. The detail panel and active-booking
banner keep their existing presentation.

## Verification

```bash
cd frontend
npm test
npm run build
```

Tests cover every formatting boundary, clock skew, invalid values, reactive input changes,
tooltip/accessibility text, shared clock propagation and interval cleanup.
