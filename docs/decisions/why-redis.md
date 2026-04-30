# Why Redis

## Decision
Use Redis for cache and atomic slot reservation support.

## Why
- reduce read latency for slot-heavy views
- lower DB pressure under high read traffic
- support atomic decrement for booking concurrency

## Trade-off
- risk of stale cache
- must reconcile with DB as source of truth

## Rule
Redis is not the final authority for booking state.
