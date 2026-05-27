# Redis Strategy

Last reviewed: 2026-05-27

## Purpose
- Reduce latency when fetching parking slots
- Handle concurrent booking safely with atomic operations

## Patterns

### 1. Cache-aside
Flow:
1. Check Redis
2. If miss -> query Postgres
3. Store in Redis with TTL (5-10 min)

Applied keys:
- parking:nearby:{geo_hash}
- parking:{id}:detail (through detail cache service)

TTL is configurable via application settings:
- app.cache.nearby-ttl-seconds
- app.cache.parking-detail-ttl-seconds

### 2. Atomic Slot Reservation
Implementation detail:
- SlotCounterService runs a Lua script for reserve operation
- If key is missing, script initializes Redis value using DB-derived fallback
- Script rejects reservation when current <= 0
- Successful reserve performs DECR atomically

Rule:
- Never allow slot < 0
- Reservation must fail closed when Redis reserve operation is unavailable

### 3. Recovery Operations
- rollbackReserve(parkingId): increment slot if DB save failed after reserve
- releaseSlot(parkingId): increment slot when booking is cancelled/completed/expired
- syncSlot(parkingId, available): hard set slot value when reconciliation is required

### 4. Key Design
- parking:{id}:slots
- parking:nearby:{geo_hash}

## Trade-offs
- Possible stale data
- Need fallback to DB validation for final consistency
- Redis counter can drift if external writes bypass service flow, so reconciliation strategy is required

## Non-Negotiable Rules
- Redis is a cache/counter layer only, never source of truth
- PostgreSQL validation remains mandatory for booking persistence
- Any DB failure after reserve must trigger Redis rollback
