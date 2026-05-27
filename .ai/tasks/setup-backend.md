# Task: Setup Backend (Spring Boot)

Last reviewed: 2026-05-27

## Goal
Bootstrap backend with current project baseline:
- parking discovery
- booking workflow
- JWT auth
- Swagger/OpenAPI docs

## Runtime Baseline

- Java: 17
- Spring Boot: 3.3.5
- Build: Maven

## Required Dependencies

- spring-boot-starter-web
- spring-boot-starter-validation
- spring-boot-starter-data-jpa
- spring-boot-starter-security
- spring-boot-starter-data-redis
- flyway-core
- postgresql driver
- springdoc-openapi-starter-webmvc-ui
- jjwt (api/impl/jackson)
- spring-boot-starter-test + spring-security-test

## Package Structure

com.parkingfinder
- controller
- service
- repository
- domain
- dto
- config
- exception

## API Baseline

Public:
- GET /parkings/nearby
- GET /parkings/{id}
- POST /parkings

Auth:
- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout

Protected:
- GET /users/me
- POST /bookings
- GET /bookings
- GET /bookings/{id}
- PATCH /bookings/{id}/cancel

## Security Baseline

- Stateless security filter chain
- JwtAuthFilter before UsernamePasswordAuthenticationFilter
- Access token in Authorization header
- Refresh token in HttpOnly cookie

## Booking Consistency Rules

1. Validate booking input and parking existence
2. Reserve slot atomically in Redis
3. Save booking in PostgreSQL
4. Roll back Redis reserve if DB save fails

## Definition of Done

- App runs with Postgres + Redis
- Flyway migrations apply successfully
- Swagger UI available at /swagger-ui.html
- Controller and service tests pass

## Notes for AI Agent

- Keep controllers thin
- Keep business rules in service layer
- Treat PostgreSQL as source of truth
