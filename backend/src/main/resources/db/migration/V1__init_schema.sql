CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS parking (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location geometry(Point, 4326) NOT NULL,
  total_slots INTEGER NOT NULL CHECK (total_slots >= 0),
  available_slots INTEGER NOT NULL CHECK (available_slots >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parking_location ON parking USING GIST (location);

CREATE TABLE IF NOT EXISTS booking (
  id BIGSERIAL PRIMARY KEY,
  parking_id BIGINT NOT NULL REFERENCES parking(id),
  user_id VARCHAR(255) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time)
);
