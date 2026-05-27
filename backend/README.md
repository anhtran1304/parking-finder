# Backend (Spring Boot)

## Purpose
Backend service for:
- nearby parking search (PostGIS)
- slot caching and atomic reserve (Redis)
- booking workflow with DB as source of truth

## Run
```bash
mvn spring-boot:run
```

## Main APIs
- `GET /parkings/nearby?lat=&lng=&radius=`
- `GET /parkings/{id}`
- `POST /bookings`
- `GET /bookings`
- `GET /bookings/active`
- `GET /bookings/{id}`
- `PATCH /bookings/{id}/cancel`

## API Docs (Swagger)
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

If you want to call protected endpoints from Swagger UI:
1. Login via `POST /auth/login` and copy `accessToken` from response.
2. Click `Authorize` in Swagger UI.
3. Paste token as `Bearer <accessToken>`.

## Notes
- Redis is cache and fast counter layer.
- Postgres remains source of truth.
