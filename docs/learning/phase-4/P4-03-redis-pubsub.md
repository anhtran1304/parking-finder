# P4-03 — Redis Pub/Sub Availability Bridge

## Problem

P4-01 creates an absolute availability event only after the database transaction commits. P4-02
can broadcast an event to WebSocket sessions connected to one backend process. A direct call
between them would not reach clients connected to other backend instances and would later create
a duplicate broadcast when Redis was added.

## Chosen model

- The local after-commit event is serialized to JSON and published to
  `parking.availability.v1`.
- Every backend instance subscribes to that exact Redis channel.
- The Redis subscriber is the only component that calls `ParkingAvailabilityStompPublisher`.
- The publishing instance also receives its own Redis message, so it uses the same path as every
  other instance.
- A shared codec uses Spring's configured `ObjectMapper`; timestamps remain ISO-8601 strings.

## Data flow

```text
PostgreSQL transaction
  -> COMMIT
  -> ParkingAvailabilityChanged
  -> ParkingAvailabilityRedisPublisher
  -> Redis channel parking.availability.v1
  -> ParkingAvailabilityRedisSubscriber on each backend instance
  -> ParkingAvailabilityStompPublisher
  -> local /topic/parking-availability subscribers
```

The projection updater from P4-01 remains a separate local event listener. It synchronizes the
Redis counter and snapshot cache, while the Pub/Sub publisher handles realtime distribution.
Neither listener calls the other.

## Why Redis Pub/Sub

The Spring simple broker owns only the WebSocket sessions connected to its current process. Redis
Pub/Sub gives all backend instances a shared fan-out channel without introducing a separate STOMP
broker. `RedisMessageListenerContainer` manages the blocking subscription connection, listener
registration and recovery lifecycle.

This is intentionally not durable messaging. Redis does not replay a message to a backend that was
disconnected. Availability events contain absolute values, so applying a duplicate is safe, while
the frontend REST resync planned for P4-06 recovers messages missed during a disconnect.

## Failure behavior

The database commit happens before Redis publication. Serialization, Redis and STOMP failures are
therefore logged and contained rather than propagated. Retrying inside this ticket could reorder
events or require durable delivery semantics, so no retry or deduplication store is added.

## Verification

```bash
cd backend
mvn test
```

Tests cover the JSON round trip, exact channel publication, one subscriber-to-STOMP call per
message, malformed payload handling, Redis/STOMP failure isolation and single exact-topic listener
registration. PostGIS tests remain controlled by the existing environment flag.
