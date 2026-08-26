# P4-06 — Live Availability UI Synchronization

## Problem

The Angular STOMP client exposed validated availability events, but no UI owner consumed them.
The map, sidebar and detail panel therefore kept the values returned by the initial nearby REST
request. Redis Pub/Sub also has no replay, so a browser disconnected during a change needs an
authoritative way to recover the missed value.

The existing booking and cancellation flows introduced a second problem: they adjusted the local
slot count arithmetically. If the absolute WebSocket event arrived before the HTTP response, the
local adjustment could apply the same change twice.

## Chosen model

- `ShellComponent` owns the singleton realtime connection for the map experience.
- Absolute events update the shared parking signal, which feeds markers, cards, filters and the
  selected detail panel.
- Events for parking outside the loaded nearby result are ignored because they do not include the
  static metadata required to add a new map item.
- `updatedAt` is the ordering key. Older WebSocket events and older in-flight REST responses cannot
  replace newer availability already held by the shell.
- While realtime is unavailable, the shell refreshes the nearby query every configured polling
  interval. Polling stops when STOMP connects.
- Every reconnect performs one immediate REST refresh because Redis Pub/Sub cannot replay messages
  missed during the outage.
- Successful booking and cancellation responses trigger the same authoritative refresh instead of
  incrementing or decrementing local state.

## Data flow

```text
Connected
  STOMP absolute event
    -> timestamp guard
    -> shared parkings signal
    -> map markers + sidebar cards + selected detail

Disconnected / connecting / reconnecting
  10-second timer
    -> uncached GET /parkings/nearby
    -> per-parking timestamp reconciliation

Reconnected
  immediate uncached GET /parkings/nearby
    -> recover any Pub/Sub messages missed during the outage
```

## Failure behavior

- Invalid event payloads remain the responsibility of the STOMP client and never reach the shell.
- Unknown parking IDs and stale timestamps are ignored.
- A failed fallback refresh preserves the last known list and the next polling/reconnect attempt can
  recover it.
- Detail REST cache entries are evicted when a live event changes their parking.
- Destroying the shell cancels timers and subscriptions and deactivates the STOMP client.

The visible relative availability timestamp remains a separate ticket. This ticket keeps
`updatedAt` correct in state but does not add a connection badge or "Updated Xs ago" UI.

## Verification

```bash
cd frontend
npm test
npm run build
```

Tests cover cache-bypassing refreshes, event ordering and idempotency, selected/filter state,
connection-driven polling, reconnect resync, refresh failure preservation, lifecycle cleanup and
authoritative post-booking/cancellation refreshes.
