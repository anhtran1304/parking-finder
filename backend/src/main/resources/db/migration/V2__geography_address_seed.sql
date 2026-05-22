CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE parking
  ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE parking
  ALTER COLUMN location TYPE geography(Point, 4326)
  USING ST_SetSRID(location::geometry, 4326)::geography;

ALTER TABLE parking
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DROP INDEX IF EXISTS idx_parking_location;
CREATE INDEX IF NOT EXISTS idx_parking_location ON parking USING GIST (location);

ALTER TABLE booking
  ALTER COLUMN end_time DROP NOT NULL;

ALTER TABLE booking
  ALTER COLUMN status TYPE VARCHAR(50);

ALTER TABLE booking
  ALTER COLUMN status SET DEFAULT 'ACTIVE';

INSERT INTO parking (name, address, location, total_slots, available_slots, created_at, updated_at)
SELECT
  'Parking A',
  'District 1',
  ST_MakePoint(106.70098, 10.77689)::geography,
  50,
  50,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM parking WHERE name = 'Parking A'
);

INSERT INTO parking (name, address, location, total_slots, available_slots, created_at, updated_at)
SELECT
  'Parking B',
  'District 3',
  ST_MakePoint(106.68217, 10.78230)::geography,
  30,
  30,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM parking WHERE name = 'Parking B'
);
