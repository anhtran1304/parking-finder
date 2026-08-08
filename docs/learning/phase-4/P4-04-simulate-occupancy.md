# P4-04 — Admin Occupancy Simulator

## Problem

The realtime pipeline needs a controlled way to produce parking changes without creating or
finishing bookings. A public simulator would let any client forge availability, while a separate
counter implementation could violate the PostgreSQL and Redis consistency rules established in
P4-01.

## Chosen model

- `POST /admin/parkings/{parkingId}/occupancy-events` accepts exactly `ENTER` or `EXIT`.
- `ROLE_ADMIN` is required by the HTTP security filter chain.
- Success returns the committed-shape availability snapshot for immediate Swagger or cURL
  verification.
- The simulator uses `ParkingAvailabilityService`; it does not write slots or broadcast STOMP
  messages directly.

The role is stored as a string in PostgreSQL, so adding `ADMIN` to the Java enum does not require a
schema migration. JWTs embed the role at issuance time, and Spring converts `ADMIN` to the
`ROLE_ADMIN` authority used by `hasRole("ADMIN")`.

## Availability flow

```text
ENTER
  -> Redis atomic reservation
  -> PostgreSQL guarded DECR
  -> COMMIT: OCCUPANCY_ENTER event -> Redis Pub/Sub -> STOMP
  -> ROLLBACK: Redis INCR compensation

EXIT
  -> PostgreSQL guarded INCR only when available_slots < total_slots
  -> COMMIT: OCCUPANCY_EXIT event -> Redis Pub/Sub -> STOMP
```

The strict `EXIT` query is separate from booking lifecycle release. Lifecycle release remains
capped and tolerant, while a simulator command that tries to exceed capacity returns `400` and
does not update `updatedAt` or publish an event.

## Failure behavior

- Missing parking returns `404`.
- `ENTER` at zero slots and `EXIT` at full capacity return `400`.
- Missing or unknown action returns `400`.
- Missing authentication returns `401`; a non-admin user returns `403`.
- Redis failure during `ENTER` returns `503 AVAILABILITY_UNAVAILABLE`.
- Events are published only after commit, so Redis Pub/Sub or STOMP cannot expose rolled-back
  availability.

## Promote a local user

Open PostgreSQL in the local Docker container. The shell inside the container reads the database
credentials already loaded by Docker Compose:

```bash
docker exec -it parking_db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Then promote and verify the user:

```sql
UPDATE app_user
SET role = 'ADMIN'
WHERE lower(email) = lower('admin@example.com');

SELECT email, role FROM app_user WHERE lower(email) = lower('admin@example.com');
```

Log out and log in again after promotion. An access token already issued to the user still contains
the previous `USER` role.

## Smoke test

```bash
curl -X POST http://localhost:8080/admin/parkings/1/occupancy-events \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"ENTER"}'
```

Repeat with `EXIT`, or subscribe to `/topic/parking-availability` to observe the corresponding
absolute event.

## Verification

```bash
cd backend
mvn test
```

Tests cover the role claim, HTTP authorization, request validation, availability boundaries,
guarded repository updates, after-commit event reasons and Redis rollback compensation. PostGIS
tests remain controlled by `RUN_POSTGIS_IT`.
