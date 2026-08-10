# P4-05 — Angular WebSocket/STOMP Client

## Problem

The backend can now broadcast absolute parking availability, but Angular needs a single owner for
the WebSocket lifecycle. Creating connections inside individual components would multiply sockets
and subscriptions, while passing unvalidated JSON directly into UI state would make malformed or
incompatible messages capable of breaking the live stream.

## Options considered

- Raw browser `WebSocket` would minimize dependencies, but the client would need to implement the
  STOMP protocol, heartbeats, subscriptions and reconnect behavior itself.
- `@stomp/rx-stomp` offers a higher-level RxJS wrapper, but adds another abstraction for a single
  topic and hides lifecycle details that are useful to learn in this project.
- `@stomp/stompjs` handles the protocol and reconnect mechanics while the Angular service owns a
  small RxJS-facing API.

The third option is used here. It keeps the transport standard and makes connection state,
validation and cleanup explicit.

## Lifecycle and data flow

```text
Shell (P4-06) calls connect()
  -> STOMP client opens ws://localhost:8080/ws
  -> onConnect subscribes to /topic/parking-availability
  -> JSON message is parsed and runtime-validated
  -> availabilityEvents$ emits ParkingAvailabilityEvent
  -> Shell updates UI state (P4-06)
```

The service is provided at the application root, so all consumers share one client. `connect()` is
idempotent. The subscription is created in `onConnect` because STOMP.js invokes that callback for
the initial connection and every successful reconnect. A defensive unsubscribe also prevents a
repeated callback from leaving two live subscriptions.

Connection is deliberately lazy instead of starting in the service constructor. P4-06 can align
the socket with the Shell lifecycle, tests do not connect merely by injecting the service, and
other routes do not pay for realtime they do not consume.

## Reconnect and heartbeat choices

- Incoming and outgoing heartbeats are both 10 seconds, matching the Spring broker.
- Reconnect starts after 1 second and doubles up to 30 seconds.
- `connectionState$` distinguishes initial connection from recovery, allowing P4-06 to start REST
  fallback polling only while realtime is unavailable.
- An explicit disconnect disables reconnect before deactivating the client.

Redis Pub/Sub is not durable, so reconnecting cannot replay missed messages. P4-06 will perform an
immediate REST resync after reconnect; this ticket only exposes the state needed to coordinate it.

## Runtime validation

TypeScript interfaces disappear at runtime, so each message is checked before emission:

- `eventId` must be a UUID and `parkingId` a positive integer.
- Slots must be integers satisfying `0 <= availableSlots <= totalSlots`.
- `updatedAt` must be parseable and `reason` must be one of the six Phase 4 values.

Invalid messages produce a short warning without logging the raw body. They are dropped without
erroring or completing the observable, so a later valid update is still delivered.

## Testability

The service receives a `StompClientFactory` through an Angular injection token. Production creates
the real STOMP client; unit tests provide a fake that drives connect, message, close and reconnect
callbacks without opening a network socket.

## Verification

```bash
cd frontend
npm test
npm run build
```

The tests cover configuration, idempotent activation, subscription and resubscription, valid and
invalid payloads, reconnect state, duplicate-subscription prevention, disconnect and Angular
destroy cleanup.
