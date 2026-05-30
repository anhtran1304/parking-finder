# Architecture

Documentation for Parking Finder's architecture, design decisions, and system flows.

---

## Files

| File | Description |
|------|-------------|
| [architecture-decisions.md](architecture-decisions.md) | ADR-001 through ADR-010 — why decisions were made and what trade-offs were accepted |
| [system-overview.md](system-overview.md) | Components, modules, security model, and core data flows |
| [booking-sequence-diagram.md](booking-sequence-diagram.md) | Booking creation flow with Redis race condition protection; lifecycle state machine |
| [auth-sequence-diagram.md](auth-sequence-diagram.md) | Register, login, and authenticated request flows |
| [redis-flow.md](redis-flow.md) | Cache-aside for parking search; atomic Lua reservation for booking concurrency |
