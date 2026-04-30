# Task: Setup Backend (Spring Boot)

## Goal
Initialize a Spring Boot backend with clean architecture, ready for:
- PostGIS integration
- Redis caching
- Booking logic

---

## Project Setup

- Use Spring Boot (latest stable)
- Build tool: Maven or Gradle
- Java version: 17+

### Required Dependencies
- Spring Web
- Spring Data JPA
- PostgreSQL Driver
- Spring Data Redis
- Lombok (optional)

---

## Package Structure

Use modular layered architecture:

com.parkingfinder
├── controller        # REST endpoints
├── service           # business logic
├── repository        # database access
├── domain            # entities
├── dto               # request/response objects
├── config            # redis, db config
└── exception         # global error handling

---

## Core Modules to Create

### 1. Parking
- CRUD parking
- Geo location (PostGIS)

### 2. Booking
- Create booking
- Validate slot availability

---

## Database Integration

- Use PostgreSQL with PostGIS
- Use Hibernate Spatial

### Rule
- Location must be stored as `geometry(Point, 4326)`

---

## Redis Integration

- Connect to Redis
- Use for:
  - caching parking slots
  - atomic slot updates

---

## Booking Flow (IMPORTANT)

1. Check slot in Redis
2. If available -> decrement
3. Save booking in DB
4. If DB fails -> rollback Redis

---

## API Design (initial)

### Parking APIs
- GET /parkings/nearby?lat=&lng=&radius=
- GET /parkings/{id}

### Booking APIs
- POST /bookings
- GET /bookings/{id}

---

## Rules

- Controllers must be thin
- Business logic only in service layer
- Always validate data before saving
- Do not trust Redis alone -> always confirm with DB

---

## Deliverables

- Running Spring Boot app
- Connected to Postgres + Redis
- Basic APIs working

---

## Notes for AI Agent

- Prefer simple implementation first
- Add comments explaining trade-offs
- Avoid over-engineering
