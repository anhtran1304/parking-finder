# Architecture Decisions

This document records important architectural decisions made during the development of Parking Finder.

The goal is not to document every implementation detail.

The goal is to explain:

* why decisions were made
* what alternatives were considered
* what trade-offs were accepted

---

# ADR-001: Modular Monolith Instead of Microservices

## Decision

Use a modular monolith built with Spring Boot.

Modules:

* parking
* booking
* auth
* user

---

## Why

Project goals:

* portfolio
* learning
* system design exploration

A modular monolith provides:

* simpler deployment
* faster iteration
* easier debugging
* lower operational complexity

---

## Alternatives Considered

### Microservices

Pros:

* independent scaling
* service isolation

Cons:

* distributed complexity
* service discovery
* network failures
* excessive for current project scope

---

## Trade-Off

Sacrifice service independence in exchange for development simplicity.

---

# ADR-002: PostgreSQL Is The Source Of Truth

## Decision

All business-critical data is persisted in PostgreSQL.

Redis is never considered the source of truth.

---

## Why

Bookings represent financial/business state.

Losing booking data is unacceptable.

PostgreSQL provides:

* durability
* transactions
* consistency

---

## Redis Role

Redis is used only for:

* caching
* atomic counters
* realtime events

---

## Trade-Off

Slightly more complexity during synchronization.

Gain stronger consistency guarantees.

---

# ADR-003: PostGIS For Geospatial Queries

## Decision

Use PostGIS instead of manually storing latitude and longitude.

---

## Why

Core product feature:

Find nearby parking locations.

PostGIS provides:

* ST_DWithin
* ST_Distance
* spatial indexes
* optimized geographic queries

---

## Alternatives Considered

Store:

* latitude
* longitude

And calculate distance manually.

Rejected because:

* poor scalability
* less accurate
* harder to maintain

---

# ADR-004: Cache-Aside Strategy For Redis

## Decision

Use Cache-Aside.

Flow:

Application
→ Redis
→ PostgreSQL

---

## Why

Simple.

Easy to reason about.

Well suited for parking search.

---

## Trade-Off

Potential stale cache.

Accepted because parking search does not require strict consistency.

---

# ADR-005: Redis Atomic Reservation For Booking

## Decision

Booking reservations use Redis atomic operations before database persistence.

---

## Why

Race conditions were reproduced during testing.

Multiple users could reserve the final slot simultaneously.

---

## Solution

Redis Lua script:

1. Check available slots
2. Decrement atomically
3. Return success/failure

Then:

4. Persist booking in PostgreSQL

If persistence fails:

5. Restore slot count

---

## Trade-Off

More implementation complexity.

Gain protection against overselling.

---

# ADR-006: JWT Before OAuth2

## Decision

Implement JWT authentication before OAuth2 providers.

---

## Why

Project objective:

Learn authentication fundamentals.

JWT teaches:

* identity
* tokens
* filters
* authorization
* refresh tokens

OAuth2 hides many of these concepts behind provider integrations.

---

## Trade-Off

Slightly slower path to social login.

Much stronger understanding of authentication architecture.

---

# ADR-007: Auth Before Realtime

## Decision

Authentication is implemented before WebSocket realtime features.

---

## Why

The authenticated booking journey and ownership model needed to be stable before realtime could
publish changes caused by user actions.

Features such as:

* booking history
* active booking
* personalized updates

depend on authenticated users. The implemented availability topic itself is public and read-only;
the occupancy simulator that produces demo events is restricted to `ROLE_ADMIN`.

---

## Trade-Off

Realtime development is delayed.

Architecture becomes cleaner and easier to secure.

---

# ADR-008: Feature-Based Frontend Structure

## Decision

Frontend is organized by features.

Examples:

* parking
* booking
* auth

---

## Why

Improves maintainability.

Keeps related UI, services, and models together.

Avoids large shared folders with unclear ownership.

---

# ADR-009: Reactive Angular Architecture

## Decision

Prefer RxJS and reactive flows.

---

## Why

Project includes:

* map interactions
* API-driven data
* realtime updates

Reactive streams scale better than manual state synchronization.

---

## Trade-Off

Higher learning curve.

More predictable state management.

---

# ADR-010: Portfolio Value Over Feature Count

## Decision

Prioritize engineering depth over feature quantity.

---

## Examples

Chosen:

* PostGIS
* Redis concurrency control
* JWT authentication
* realtime architecture

Deferred:

* payment gateway
* OCR
* advanced AI analysis

---

## Why

The objective is to demonstrate engineering decisions and system design thinking.

Not maximize the number of features.
