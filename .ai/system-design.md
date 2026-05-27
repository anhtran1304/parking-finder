# System Overview

Last reviewed: 2026-05-27

## Architecture

- Frontend: Angular SPA (map-first user journey)
- Backend: Spring Boot monolith, layered by controller/service/repository
- Database: PostgreSQL + PostGIS (single source of truth)
- Cache and counters: Redis

## Backend Modules

- Parking module
	- nearby search
	- parking detail
- Booking module
	- create booking
	- paginated booking history
	- booking detail and cancellation
	- lifecycle scheduler for status transitions
- Auth module
	- register/login/refresh/logout
	- JWT access token
	- refresh token cookie with server-side hashed persistence
- User module
	- current user profile endpoint

## Security Model

- Stateless API security with Spring Security filter chain
- JWT bearer access token for protected APIs
- Refresh token stored as HttpOnly cookie
- Refresh token hash stored in database for revocation and rotation

Request flow for protected endpoint:
1. Client sends Authorization: Bearer access_token
2. JwtAuthFilter validates token
3. SecurityContext is populated with authenticated principal
4. Controller uses authenticated identity (email/username) to scope data

## Core Data Flows

### Nearby Parking Flow
1. Client requests nearby list
2. Backend checks Redis nearby cache key
3. Cache miss falls back to PostGIS query in PostgreSQL
4. Response cached in Redis with TTL and returned

### Booking Create Flow
1. Authenticated user requests booking
2. Backend validates booking window and parking existence
3. SlotCounterService executes Redis Lua reserve script (atomic decrement)
4. Booking is saved in PostgreSQL
5. If DB write fails, Redis slot decrement is rolled back

### Booking Lifecycle Flow
1. New booking starts as PENDING
2. Scheduled jobs run every 60 seconds
3. PENDING becomes ACTIVE when start_time is reached
4. ACTIVE becomes COMPLETED when end_time passes
5. PENDING can become EXPIRED if time window passes unused
6. CANCELLED/COMPLETED/EXPIRED releases slot in Redis

## Scalability and Consistency Choices

- Redis is performance layer only; PostgreSQL remains source of truth
- Fail-closed behavior for reservation when Redis operation is unavailable
- Scheduler keeps booking status consistent over time without client polling dependency

## Near-Term Extensions

- GET /bookings/active endpoint for current reservation state
- frontend auth state management (interceptor + route guards)
- websocket/pub-sub layer after identity + lifecycle are fully integrated
