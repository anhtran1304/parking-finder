# Task: Setup Redis

Last reviewed: 2026-05-27

## Goal
Configure Redis as cache plus atomic reservation gate for booking flow.

## Runtime Baseline

- Redis 7
- appendonly: yes
- maxmemory-policy: allkeys-lru

## Keys

- parking:{id}:slots
- parking:nearby:{geo_hash}

## Required Behaviors

1. Atomic slot reserve via Lua script
	- initialize key from DB fallback if missing
	- reject when slot <= 0
	- decrement atomically on success

2. Recovery actions
	- rollbackReserve after DB save failure
	- releaseSlot on cancel/expire/complete

3. Cache-aside for nearby results with TTL

## Rules

- Redis is not source of truth
- Final booking correctness must be validated in PostgreSQL
- Reservation failures in Redis should fail closed, not oversell
