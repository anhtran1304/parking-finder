# P4-08 — Phase 4 Realtime Closeout

## What this closes

Phase 4 now has layered proof for the complete availability path:

```text
Admin HTTP ENTER / EXIT
  → guarded PostgreSQL commit
  → absolute application event
  → Redis projection + Pub/Sub
  → Redis subscriber
  → local STOMP broker
  → WebSocket client
  → Angular shared parking state
  → marker, card, filter, detail, reserve state, freshness label
```

The backend path is covered by a Docker-backed integration test. Angular transport, ordering,
fallback, reconnect, and presentation behavior are covered by unit/component tests. The runbook
below verifies the assembled browser experience without adding a browser E2E dependency solely for
closeout.

## Automated verification

Docker must be running if the end-to-end test is expected to execute rather than skip.

```bash
cd backend
mvn test
mvn -Dtest=RealtimeAvailabilityEndToEndIntegrationTest test
```

The targeted result must report one test run with zero skipped. It starts isolated PostGIS and
Redis containers, creates an admin JWT, subscribes a native STOMP client, applies `ENTER` and
`EXIT`, and verifies the HTTP response, WebSocket event, PostgreSQL row, Redis counter, and Redis
snapshot all agree.

```bash
cd frontend
npm test
npm run build
```

## Local browser demo

### 1. Start the stack

Create the local environment once:

```bash
cp .env.example .env
```

Replace the placeholder database credentials, then start PostGIS and Redis:

```bash
cd infrastructure/docker
docker compose up -d
docker compose ps
```

In a second terminal, export the backend variables and start Spring Boot:

```bash
cd backend
set -a
source ../.env
set +a
mvn spring-boot:run
```

In a third terminal, start Angular:

```bash
cd frontend
npm install
npm start
```

Open `http://localhost:4200/map` and keep the parking list and one detail panel visible.

### 2. Create and promote the demo admin

Register through the UI or call `POST /auth/register`. Promote that local user in PostgreSQL:

```bash
docker exec -it parking_db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

```sql
UPDATE app_user
SET role = 'ADMIN'
WHERE lower(email) = lower('admin@example.com');
```

Sign out and sign in again so the newly issued JWT contains `ADMIN`. Copy `accessToken` from the
login response into the shell and choose a parking visible on the map:

```bash
export ADMIN_TOKEN='paste-access-token-here'
export PARKING_ID='3'
```

### 3. Verify live ENTER and EXIT

Apply an entry:

```bash
curl -X POST "http://localhost:8080/admin/parkings/$PARKING_ID/occupancy-events" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"ENTER"}'
```

Without refreshing the browser, verify:

- the matching card count decreases by one;
- its freshness returns to `Updated just now` and then ages each second;
- its map marker changes state if the count crosses a threshold;
- the Available filter removes the parking if the count reaches zero;
- an open detail panel shows the same count and disables Reserve Spot at zero.

Apply an exit and verify the same surfaces return to the absolute value in the response:

```bash
curl -X POST "http://localhost:8080/admin/parkings/$PARKING_ID/occupancy-events" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"EXIT"}'
```

### 4. Verify reconnect recovery

1. Keep the map open and stop the backend with `Ctrl-C`.
2. Confirm the `/ws` connection closes; after 10 seconds the client attempts the REST fallback
   without clearing its last known parking state.
3. Restart Spring Boot with the same environment.
4. Confirm STOMP reconnects and an immediate `GET /parkings/nearby` resynchronizes the map.
5. Apply another `ENTER` or `EXIT` and confirm live updates resume without reloading the page.

Redis Pub/Sub is non-durable. The REST request after reconnect is the mechanism that recovers
changes missed while the browser was disconnected.

## Cleanup

Stop the application processes and then the infrastructure:

```bash
cd infrastructure/docker
docker compose down
```

Keep the named PostgreSQL volume for future demos. Use `docker compose down -v` only when the local
database is intentionally disposable.

## Phase 4 result

The realtime phase is complete with PostgreSQL authority, Redis admission and cross-instance
fan-out, read-only STOMP delivery, disconnect recovery, timestamp ordering, and a visible freshness
signal. Cache optimization is the first Phase 5 ticket.
