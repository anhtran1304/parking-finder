# Parking Finder Roadmap

Last reviewed: 2026-05-27

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
Status: in progress

Backend completed:
- basic_auth_jwt
- current_user_endpoint
- booking_history_api (paginated + optional status filter, scoped to authenticated user)
- API documentation standardized with Swagger/OpenAPI and endpoint annotations

Backend pending:
- active_booking_api

Frontend pending:
- sign_in_page
- sign_up_page
- auth_state_management (interceptor + guards)
- current_booking_view
- booking_history_view

## Phase 4: Realtime
Status: pending

Planned:
- websocket setup
- Redis pub/sub
- frontend websocket client and live slot updates

## Phase 5: UX and Integrations
Status: pending

Planned:
- cache optimization
- error contract hardening
- geolocation and directions deep-link
- filter chips and active booking banner
- OAuth2 (Google) after core auth flow is stable

## Current Next Step
- Implement backend active booking API (GET /bookings/active)
- Start frontend auth pages and token handling
