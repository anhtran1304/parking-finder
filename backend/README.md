# Backend (Spring Boot)

## Purpose
Backend service for:
- nearby parking search (PostGIS)
- slot caching and atomic reserve (Redis)
- booking workflow with DB as source of truth
- committed availability fan-out through Redis Pub/Sub and STOMP

## Run
```bash
mvn spring-boot:run
```

## Main APIs
- `GET /parkings/nearby?lat=&lng=&radius=`
- `GET /parkings/{id}`
- `POST /bookings`
- `GET /bookings`
- `GET /bookings/active`
- `GET /bookings/{id}`
- `PATCH /bookings/{id}/cancel`
- `POST /admin/parkings/{id}/occupancy-events` (`ADMIN` only)

## Realtime

- Native WebSocket handshake: `ws://localhost:8080/ws`
- Public read-only STOMP topic: `/topic/parking-availability`
- Events contain absolute slot counts and are emitted only after PostgreSQL commit.
- Redis Pub/Sub channel `parking.availability.v1` fans events to every backend instance.
- The publishing instance receives its own Redis message and uses the same subscriber-to-STOMP path.

## API Docs (Swagger)
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

If you want to call protected endpoints from Swagger UI:
1. Login via `POST /auth/login` and copy `accessToken` from response.
2. Click `Authorize` in Swagger UI.
3. Paste token as `Bearer <accessToken>`.

## Notes
- Redis is cache and fast counter layer.
- Postgres remains source of truth.

## Verification

```bash
mvn test
```

With Docker available, the suite starts isolated PostGIS and Redis containers and proves the
admin HTTP → commit → Redis Pub/Sub → STOMP path. Without Docker, that one integration test is
reported as skipped. To require and inspect it directly:

```bash
mvn -Dtest=RealtimeAvailabilityEndToEndIntegrationTest test
```
