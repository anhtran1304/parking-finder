# Parking Finder - Copilot Instructions

## Project Context

This repository is a portfolio-focused fullstack project designed to demonstrate:

* System design thinking
* Geospatial search with PostGIS
* Redis caching and concurrency control
* Authentication and user lifecycle
* Realtime architecture

The goal is not feature quantity.

The goal is to demonstrate clear engineering decisions and trade-offs.

---

# Source of Truth

Before making changes, always read:

* `.ai/progress.yaml`
* `.ai/system-design.md`
* `.ai/conventions.yaml`

If roadmap status and implementation differ:

* Trust `.ai/progress.yaml`
* Explain the discrepancy

Never invent roadmap tasks.

Never skip project phases without being asked.

---

# Current Development Philosophy

Prefer:

* Simple
* Explicit
* Educational
* Portfolio-friendly

Avoid:

* Premature optimization
* Enterprise complexity
* Architecture astronauts

This project intentionally favors clarity over completeness.

---

# Think Before Coding

Do not assume requirements.

Before implementing:

1. State assumptions explicitly.
2. Surface trade-offs.
3. Identify missing information.
4. Ask for clarification if ambiguity affects implementation.

If there are multiple valid approaches:

* Explain them briefly.
* Recommend one.
* Explain why.

---

# Simplicity First

Use the minimum code that solves the problem.

Do not add:

* Future-proof abstractions
* Generic frameworks
* Extra configuration
* Unrequested flexibility

Avoid:

* Overusing interfaces
* Creating factories for one implementation
* Adding layers without clear value

Ask:

"Would a senior engineer reviewing this portfolio project consider this over-engineered?"

If yes:

Simplify.

---

# Surgical Changes

Only modify code directly related to the task.

Do not:

* Reformat unrelated files
* Rename unrelated symbols
* Refactor adjacent modules
* Introduce architecture changes without request

You may:

* Remove imports made unused by your change
* Remove code made obsolete by your change

Every modified line should be traceable to the requested task.

---

# Goal-Driven Execution

Transform tasks into verifiable outcomes.

Examples:

Instead of:
"Add booking validation"

Use:
"Prevent bookings when available slots are zero and verify via test"

Instead of:
"Fix auth bug"

Use:
"Reproduce invalid JWT behavior, fix it, and verify protected endpoints reject expired tokens"

For multi-step tasks:

1. Implement
2. Verify
3. Explain

Always define success criteria before coding.

---

# Architecture Rules

## Database

PostgreSQL is the source of truth.

Redis is never the source of truth.

Any booking logic must ultimately be validated against persisted data.

---

## Redis

Use Redis only for:

* Cache-aside
* Atomic counters
* Realtime event distribution

Do not store critical business state exclusively in Redis.

---

## Backend

Preferred architecture:

Controller
→ Service
→ Repository

Rules:

* Controllers remain thin
* Business logic belongs in services
* Repositories only access data

Avoid placing business logic inside controllers.

---

## Frontend

Preferred architecture:

Feature-driven Angular structure.

Use:

* RxJS
* Async pipe
* Signals when appropriate

Avoid:

* Deep component coupling
* State duplication
* Manual subscriptions when avoidable

---

# Authentication Rules

Current roadmap:

Basic JWT authentication before OAuth2.

Do not introduce:

* Google OAuth
* Social login
* RBAC complexity

until basic JWT flow is complete.

Preferred learning sequence:

1. Register
2. Login
3. JWT validation
4. Protected endpoints
5. Refresh token
6. OAuth2

---

# Portfolio Mindset

Every feature should answer:

1. What problem does it solve?
2. Why was this approach chosen?
3. What alternatives exist?
4. What trade-offs were accepted?

When implementing significant features:

Include concise comments explaining decisions.

Do not add comments that merely describe code syntax.

---

# Progress Awareness

Before suggesting new work:

Read `.ai/progress.yaml`.

Prioritize:

1. Current phase
2. Incomplete tasks
3. Dependencies

Avoid proposing future-phase work unless explicitly requested.

---

# Response Format

When implementing:

1. State assumptions
2. State plan
3. Implement
4. Explain verification

When reviewing code:

1. Identify issues
2. Explain impact
3. Recommend minimal fixes

Always prefer practical engineering decisions over theoretical perfection.
