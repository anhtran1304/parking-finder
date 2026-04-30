# Redis Strategy

## Purpose
- Reduce latency when fetching parking slots
- Handle concurrent booking safely

## Patterns

### 1. Cache-aside
Flow:
1. Check Redis
2. If miss -> query Postgres
3. Store in Redis with TTL (5-10 min)

### 2. Atomic Counter
Use:
- INCR / DECR for slot updates

Rule:
- Never allow slot < 0

### 3. Key Design
- parking:{id}:slots
- parking:nearby:{geo_hash}

## Trade-offs
- Possible stale data
- Need fallback to DB validation
