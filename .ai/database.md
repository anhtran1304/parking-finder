# Database Design (PostgreSQL + PostGIS)

Last reviewed: 2026-05-27

## Migration Source of Truth

Flyway scripts under:
- backend/src/main/resources/db/migration

Current migration set:
- V1__init_schema.sql
- V2__geography_address_seed.sql
- V3__enrich_parking_data.sql
- V4__booking_status_index.sql
- V5__auth_schema.sql

## Current Tables

### parking
Core columns:
- id
- name
- address
- location
- total_slots
- available_slots
- updated_at

Enrichment columns (V3):
- hourly_rate
- parking_type
- has_ev_charging
- has_security
- has_roof
- rating
- review_count

Indexes:
- GIST index on location

### booking
Columns:
- id
- parking_id (FK parking.id)
- user_id
- start_time
- end_time
- status
- created_at

Constraints and indexes:
- CHECK (end_time > start_time)
- idx_booking_status_start (status, start_time)
- idx_booking_status_end (status, end_time)

### app_user
Columns:
- id
- email (UNIQUE)
- password_hash
- full_name
- role
- created_at

### refresh_token
Columns:
- id
- user_id (FK app_user.id, ON DELETE CASCADE)
- token_hash (UNIQUE)
- expires_at
- created_at

Indexes:
- idx_refresh_token_hash
- idx_refresh_token_user

## Query Guidance

### Nearby Search
- Use ST_DWithin or ST_Distance with indexed location column
- Keep geo query selective by radius and paging when needed

### Booking History
- Query by user_id with Pageable
- Optional status filter by user_id + status
- Sort primarily by created_at unless product requirement says otherwise

## Design Rules

- PostgreSQL is the single source of truth
- Redis must not replace DB validation for final booking decisions
- Add explicit indexes for new high-cardinality filters
- Keep schema evolution append-only via Flyway migrations
