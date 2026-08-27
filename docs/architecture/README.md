# Architecture

Documentation for Parking Finder's architecture, design decisions, and system flows.

---

## Files

| File | Description |
|------|-------------|
| [architecture-decisions.md](architecture-decisions.md) | Core architectural choices and accepted trade-offs |
| [system-overview.md](system-overview.md) | Components, security, REST/realtime flows, and browser recovery |
| [booking-sequence-diagram.md](booking-sequence-diagram.md) | Booking creation flow with Redis race condition protection; lifecycle state machine |
| [auth-sequence-diagram.md](auth-sequence-diagram.md) | Register, login, and authenticated request flows |
| [redis-flow.md](redis-flow.md) | Metadata cache, atomic admission, absolute projections, and Pub/Sub fan-out |
