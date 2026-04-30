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
- `GET /bookings/{id}`

## Notes
- Redis is cache and fast counter layer.
- Postgres remains source of truth.
