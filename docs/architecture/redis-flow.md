# Redis Flow

Redis serves two distinct roles in Parking Finder.

Redis is **never** the source of truth. PostgreSQL is.

---

## Role 1: Cache-Aside for Parking Search

Reduces database load for the most frequent read path: nearby parking queries.

```mermaid
flowchart TD
    A[GET /parking/nearby lat,lng,radius] --> B{Redis cache hit?}
    B -->|Hit| C[Return cached result]
    B -->|Miss| D[PostGIS ST_DWithin query on PostgreSQL]
    D --> E[Write result to Redis with TTL]
    E --> F[Return result to client]
```

**Trade-off accepted:** Cache may return slightly stale slot counts.
Acceptable because parking search is a discovery flow, not a reservation commitment.

---

## Role 2: Atomic Slot Reservation for Booking

Prevents overselling when multiple users try to book the last available slot simultaneously.

```mermaid
flowchart TD
    A[POST /bookings] --> B[Validate parking + window — PostgreSQL]
    B --> C[Redis Lua script:
IF slots > 0 THEN DECR slots
RETURN 1 ELSE RETURN 0 END]
    C -->|returned 1 — slot secured| D[INSERT booking in PostgreSQL]
    D -->|write success| E[201 Booking confirmed]
    D -->|write failure| F[INCR slots — rollback
500 error]
    C -->|returned 0 — no slots| G[409 No available slots]
```

### Why a Lua Script?

Redis commands are single-threaded. A Lua script runs atomically — no other command can execute between the check and the decrement.

Without atomicity:

```
User A: GET slots → 1
User B: GET slots → 1
User A: DECR slots → 0  ✓
User B: DECR slots → -1 ✗  (oversold)
```

With Lua script — this race condition is impossible.

---

## Slot Counter Lifecycle

Slot counters are seeded from PostgreSQL on startup and updated by:

| Event | Redis Operation |
|-------|----------------|
| Booking created | `DECR parking:{id}:slots` |
| Booking cancelled | `INCR parking:{id}:slots` |
| Booking completed | `INCR parking:{id}:slots` |
| Booking expired | `INCR parking:{id}:slots` |
| DB write failure | `INCR parking:{id}:slots` (rollback) |
