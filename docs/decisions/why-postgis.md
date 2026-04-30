# Why PostGIS

## Decision
Use PostgreSQL + PostGIS for geospatial parking queries.

## Why
- native geo functions (`ST_DWithin`, `ST_Distance`)
- reliable indexing via GIST
- strong transactional model for booking consistency

## Trade-off
- query tuning is required for large datasets
- geospatial schema needs careful migration discipline
