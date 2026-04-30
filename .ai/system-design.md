# System Overview

## Architecture

- Monolith backend (Spring Boot)
- Redis for caching
- Postgres as main DB

## Data Flow

User -> API -> Redis -> Postgres

## Booking Flow

1. User requests booking
2. Check Redis slot
3. Decrement slot (atomic)
4. Save booking in DB
5. If DB fails -> rollback Redis

## Future Extension

- WebSocket for realtime updates
- Separate realtime service
