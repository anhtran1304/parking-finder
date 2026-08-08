# P4-02 — Spring WebSocket/STOMP Setup

## Problem

P4-01 produces committed, absolute availability events, but the backend did not yet expose a
transport that browsers can subscribe to. P4-02 adds that transport without deciding how events
move between multiple backend instances; Redis Pub/Sub remains the responsibility of P4-03.

## Chosen model

- Native WebSocket handshake endpoint: `/ws`.
- STOMP application prefix: `/app`.
- In-memory simple broker prefix: `/topic`.
- Public availability destination: `/topic/parking-availability`.
- Server and client heartbeat intervals: 10 seconds, driven by a dedicated one-thread scheduler.
- Allowed browser origins reuse `app.cors.allowed-origins`.
- `ParkingAvailabilityStompPublisher` is the only server-side adapter that knows the topic name.
  It is intentionally not an application event listener; the Redis subscriber will invoke it in
  P4-03.

## Why STOMP over native WebSocket

WebSocket supplies a duplex byte stream but does not define subscriptions or destinations. STOMP
adds `CONNECT`, `SUBSCRIBE`, `MESSAGE` and lifecycle semantics, so Angular can subscribe to a topic
instead of inventing a custom wire protocol. Native WebSocket is sufficient for the supported
browsers, so SockJS fallback is unnecessary.

## Why the simple broker

The Spring simple broker keeps subscriptions in memory and is enough for a single application
instance. It is not a durable message broker and does not connect multiple instances. Redis
Pub/Sub in P4-03 will fan domain events to every backend instance; each instance will then use its
local STOMP publisher for its connected clients.

## Read-only security

Availability is public, so the handshake does not require JWT. The browser Origin header is still
checked against the configured allowlist. A separate inbound channel interceptor makes the STOMP
session read-only:

- connection lifecycle commands are allowed;
- only the exact availability topic can be subscribed to;
- client `SEND`, wildcard subscriptions and other destinations are rejected.

This prevents a connected client from publishing a forged slot count through the simple broker.
The project does not use `@EnableWebSocketSecurity` here because its default CONNECT CSRF contract
would require an additional token exchange for a public stream.

## Data flow after P4-02

```text
Angular (future P4-05)
  -> WebSocket handshake /ws
  -> STOMP SUBSCRIBE /topic/parking-availability

ParkingAvailabilityStompPublisher
  -> SimpMessagingTemplate
  -> simple broker
  -> subscribed browser sessions
```

There is deliberately no arrow from `ParkingAvailabilityChanged` to the publisher yet. P4-03 adds
the path `after-commit event -> Redis channel -> Redis subscriber -> STOMP publisher`.

## Verification

```bash
cd backend
mvn test
```

The WebSocket integration test starts embedded Tomcat on a random localhost port. It verifies the
origin allowlist, native handshake, subscription, JSON payload and heartbeat configuration without
requiring PostgreSQL or Redis.
