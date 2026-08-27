# WebSocket vs Polling

## Decision

Use WebSocket/STOMP as the primary availability transport and REST as the recovery path.

## Why the Choice Changed

Polling was appropriate while the product and consistency model were still being built. Realtime
availability is now a core demonstration flow: occupancy, booking, cancellation, completion, and
expiration should update connected maps without waiting for the next interval.

STOMP supplies subscription and heartbeat semantics over native WebSocket. Redis Pub/Sub fans each
committed absolute event to every backend instance, whose in-memory broker serves its local browser
sessions.

## Recovery Model

Redis Pub/Sub is intentionally non-durable and does not replay missed messages. The Angular shell
therefore:

- loads an authoritative REST snapshot on entry;
- polls REST while the WebSocket is connecting or reconnecting;
- stops polling while connected;
- performs an immediate REST resync after reconnect;
- rejects events and REST responses older than its current `updatedAt`.

## Trade-off

The hybrid model costs more client lifecycle logic than polling alone, but provides instant updates
without treating a non-durable transport as a source of truth. PostgreSQL remains authoritative.
