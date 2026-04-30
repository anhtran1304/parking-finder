# Experiment: Cache vs DB

## Goal
Measure latency improvement when serving parking reads from Redis vs Postgres.

## Setup
- endpoint: nearby parking and parking detail
- scenarios: cold cache, warm cache
- metrics: p50/p95 latency, DB query count

## Record Template
- Date:
- Dataset size:
- p50/p95 (DB only):
- p50/p95 (Redis warm):
- Notes:

## Expected Outcome
Warm-cache reads should be faster and reduce DB pressure.
