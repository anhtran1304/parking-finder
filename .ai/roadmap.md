# Parking Finder Roadmap

Last reviewed: 2026-08-26

Source of truth for detailed task status:
- .ai/progress.yaml

## Phase 1: Core Search
Status: done

Backend highlights:
- Docker setup, PostGIS schema, nearby search API
- parking entity fields expanded (slots, pricing, type, amenities)

Frontend highlights:
- Angular app and map shell
- nearby API integration and marker rendering
- UI architecture and icon system

## Phase 2: Booking
Status: done

Backend highlights:
- booking creation flow
- race condition reproduction and Redis atomic reservation
- flexible booking duration (1h/2h/4h/daily)
- booking status lifecycle with scheduler (PENDING/ACTIVE/COMPLETED/CANCELLED/EXPIRED)

Frontend highlights:
- parking detail panel with media and amenities
- reserve flow and booking feedback states
- search/filter basics

## Phase 3: User Journey
Status: done

Backend highlights:
- JWT authentication and current-user endpoint
- Paginated booking history, active booking, and booking detail APIs scoped to the authenticated user
- Ownership-safe cancellation and standardized Swagger/OpenAPI documentation

Frontend highlights:
- Map-persistent sign-in/sign-up flow with token interceptor, guards, and return-to-booking intent
- Profile, Booking Center, active reservation banner/card, booking detail drill-in, and responsive panel parity
- Destructive cancel confirmation wired to the backend with local booking/availability synchronization

## Phase 4: Realtime
Status: in progress

Completed:
- availability consistency baseline: PostgreSQL bounds, Redis compensation, after-commit absolute events, and fresh REST availability overlays
- native Spring STOMP endpoint, read-only availability topic, heartbeat scheduler, and server-side publisher
- Redis Pub/Sub bridge from committed availability events to each backend instance's local STOMP clients
- ROLE_ADMIN occupancy simulator with guarded ENTER/EXIT updates and realtime event propagation
- Angular STOMP client with typed availability events, heartbeat, exponential reconnect, runtime validation, and explicit lifecycle management
- live map-shell synchronization with timestamp ordering, REST fallback polling, reconnect resync, and authoritative booking/cancellation refreshes
- parking-card availability freshness labels driven by one shared sidebar clock

Planned next:
- Phase 4 closeout and end-to-end realtime demo verification

## Phase 5: UX and Integrations
Status: pending

Planned:
- cache optimization
- error contract hardening
- geolocation and directions deep-link
- filter chips and active booking banner
- OAuth2 (Google) after core auth flow is stable

## Current Next Step
- Close out Phase 4 with end-to-end realtime demo verification and documentation sync
- Continue one Phase 4 ticket per implementation turn
