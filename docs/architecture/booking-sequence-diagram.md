# Booking Sequence Diagram

Two diagrams:

1. **Booking creation** — including race condition protection via Redis atomic reservation
2. **Booking lifecycle** — state machine driven by a background scheduler

---

## 1. Booking Creation

```mermaid
sequenceDiagram
    actor User
    participant Angular
    participant Guard as authGuard
    participant API as Spring Boot
    participant Redis
    participant DB as PostgreSQL

    User->>Angular: Click "Reserve Spot"
    Angular->>Guard: canActivate?
    Guard-->>Angular: ✓ token present

    Angular->>API: POST /bookings {parkingId, duration}
    Note over API: JwtAuthFilter validates Bearer token

    API->>DB: Load parking, validate booking window
    DB-->>API: OK

    API->>Redis: Lua script — DECR slots if slots > 0
    alt slots available
        Redis-->>API: slot decremented
        API->>DB: INSERT booking (status = PENDING)
        alt DB write succeeds
            DB-->>API: booking saved
            API-->>Angular: 201 BookingResponse
            Angular-->>User: Booking confirmed
        else DB write fails
            API->>Redis: INCR slots (rollback)
            API-->>Angular: 500
        end
    else no slots
        Redis-->>API: reservation failed (slots = 0)
        API-->>Angular: 409 No available slots
        Angular-->>User: "No slots available"
    end
```

---

## 2. Booking Lifecycle

Driven by `BookingLifecycleScheduler` — runs every 60 seconds.

```mermaid
stateDiagram-v2
    [*] --> PENDING : POST /bookings
    PENDING --> ACTIVE : scheduler — start_time reached
    PENDING --> EXPIRED : scheduler — window passed unused
    ACTIVE --> COMPLETED : scheduler — end_time passed
    ACTIVE --> CANCELLED : PATCH /bookings/{id}/cancel
    COMPLETED --> [*] : slot released
    CANCELLED --> [*] : slot released
    EXPIRED --> [*] : slot released
```

Terminal states (COMPLETED, CANCELLED, EXPIRED) trigger a Redis slot restore (`INCR`).
