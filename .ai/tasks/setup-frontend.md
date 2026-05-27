# Task: Setup Frontend (Angular)

Last reviewed: 2026-05-27

## Goal
Maintain Angular frontend baseline for parking discovery and booking, then extend with auth-aware user journey.

## Runtime Baseline

- Angular 21
- RxJS 7
- Leaflet map integration
- TailwindCSS 4

## Current Structure

src/app/
- core/ (services, resolvers)
- features/parking
- features/booking
- layout/
- shared/components
- models

## Current Implemented Capabilities

1. Map and parking discovery
- nearby parking API integration
- markers and selection flow

2. Parking detail view
- detail panel, amenities, and booking CTA

3. Booking API usage
- create booking
- get booking by id

## Pending Frontend Auth Scope

1. sign-in page
2. sign-up page
3. auth state service
4. HTTP interceptor for bearer token
5. route guards for protected views
6. booking history and current booking views

## Data Flow Rules

- Keep API calls observable-based
- Prefer async pipe patterns
- Keep caching logic in services
- Avoid scattering auth token logic across components

## API Surface To Support

Public:
- GET /parkings/nearby
- GET /parkings/{id}

Protected:
- POST /bookings
- GET /bookings
- GET /bookings/{id}
- PATCH /bookings/{id}/cancel
- GET /users/me

Auth:
- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout

## Deliverables

- Existing map/parking flow remains stable
- Auth flow integrated without regression
- User-specific booking views are connected to authenticated identity
