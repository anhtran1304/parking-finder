# Database Design (PostGIS)

## Tables

### parking
- id
- name
- location (geometry POINT)
- total_slots

### booking
- id
- parking_id
- user_id
- start_time
- end_time

## Queries

### Nearby search
- use ST_DWithin or ST_Distance
- index: GIST on location

## Rules
- always index geo column
- avoid full table scan
