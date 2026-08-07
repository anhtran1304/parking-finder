# P4-01 — Availability Consistency Baseline

## Problem

The previous booking flow decremented only the Redis counter. PostgreSQL kept the old
`available_slots`, while parking REST responses read PostgreSQL or cached DTOs. Cancel and
lifecycle transitions then incremented only Redis. The write paths therefore disagreed about the
current availability.

## Chosen model

- PostgreSQL is the durable source of truth and enforces `0 <= available_slots <= total_slots`.
- Redis remains the fast atomic admission gate used to reject concurrent reservations early.
- A booking transaction performs the Redis reservation first and then a guarded PostgreSQL
  decrement. If the database rejects or rolls back the transaction, Redis is compensated.
  A database guard rejection also reconciles the Redis counter to the absolute database value.
- Cancel, completed and expired transitions use the same bounded PostgreSQL release operation.
- An absolute `ParkingAvailabilityChanged` event is exposed only after commit. Its absolute value
  is safe for later consumers to apply more than once.
- Nearby/detail metadata may remain cached, but every REST read overlays a small PostgreSQL
  availability projection. This favors correctness now; reducing that read cost belongs to the
  Phase 5 cache optimization ticket.
- After commit, Redis receives both the absolute slot counter and a JSON availability snapshot,
  and the cached detail DTO is evicted.

## Why this direction

### Why not Redis as the source of truth?

Redis is ideal for atomic counters, but making it authoritative would require persistence,
recovery and reconciliation rules. PostgreSQL already owns parking and booking durability, so
keeping the invariant there makes failures easier to reason about.

### Why reserve Redis before updating PostgreSQL?

The Lua counter cheaply serializes competing requests. PostgreSQL still uses a conditional update,
so it is the final guard if Redis is stale. The cost is a compensation path when the database
transaction fails.

### Why publish after commit?

Publishing before commit could show clients a slot value that is later rolled back. The service
registers transaction completion callbacks: commit publishes the absolute event; rollback restores
the Redis reservation.

### Why query availability on every REST read?

Static parking discovery data is cache-friendly, but availability changes frequently. A batched,
four-column PostgreSQL projection prevents a stale Redis snapshot from becoming authoritative.
This is intentionally a correctness-first baseline for learning and can later be optimized with a
versioned cache or reconciliation process.

## Data flow

```text
Create booking
  Redis Lua DECR
    -> PostgreSQL guarded DECR + booking INSERT
      -> COMMIT: publish absolute event -> sync Redis projection + evict detail cache
      -> ROLLBACK: Redis INCR compensation

Cancel / complete / expire
  booking status update + PostgreSQL bounded INCR
    -> COMMIT: publish absolute event -> sync Redis projection + evict detail cache

Parking REST read
  cached/static parking DTO + batched PostgreSQL availability snapshot
    -> response with current availableSlots and updatedAt
```

## Verification

```bash
cd backend
mvn test
RUN_POSTGIS_IT=true mvn test
```

The PostGIS integration suite requires the local database and Phase 4 migration to be reachable.
