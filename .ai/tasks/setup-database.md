# Task: Setup Database

- Use Postgres with PostGIS
- Enable extension:
  CREATE EXTENSION postgis;

- Create tables:
  - parking
  - booking

- Add index:
  CREATE INDEX idx_parking_location ON parking USING GIST(location);
