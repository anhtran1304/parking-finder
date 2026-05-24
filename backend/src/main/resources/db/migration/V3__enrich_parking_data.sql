-- V3: Enrich parking schema + seed diverse parking scenarios
-- Adds hourly_rate, parking_type, amenity flags, rating fields
-- Seeds 10 realistic parking locations with varied states

-- --- Schema additions ---
ALTER TABLE parking ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(5,2) DEFAULT 2.00;
ALTER TABLE parking ADD COLUMN IF NOT EXISTS parking_type VARCHAR(50) DEFAULT 'garage';
ALTER TABLE parking ADD COLUMN IF NOT EXISTS has_ev_charging BOOLEAN DEFAULT FALSE;
ALTER TABLE parking ADD COLUMN IF NOT EXISTS has_security BOOLEAN DEFAULT FALSE;
ALTER TABLE parking ADD COLUMN IF NOT EXISTS has_roof BOOLEAN DEFAULT FALSE;
ALTER TABLE parking ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 0;
ALTER TABLE parking ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- --- Clear old minimal seed data ---
DELETE FROM booking;
DELETE FROM parking;

-- --- Rich seed data ---
-- All locations around District 1, HCMC (lat ~10.77, lng ~106.70)

INSERT INTO parking (name, address, location, total_slots, available_slots, hourly_rate, parking_type, has_ev_charging, has_security, has_roof, rating, review_count, created_at, updated_at) VALUES

-- Available, standard garage
('Saigon Centre Garage',
 '65 Le Loi, District 1',
 ST_MakePoint(106.6990, 10.7730)::geography,
 200, 45, 2.50, 'garage', FALSE, TRUE, TRUE, 4.5, 128, NOW(), NOW()),

-- Available, premium downtown
('Vincom Platinum Parking',
 '72 Le Thanh Ton, District 1',
 ST_MakePoint(106.7035, 10.7760)::geography,
 120, 32, 4.00, 'premium', TRUE, TRUE, TRUE, 4.8, 256, NOW(), NOW()),

-- Available, budget open lot
('Tran Hung Dao Open Lot',
 '100 Tran Hung Dao, District 5',
 ST_MakePoint(106.6850, 10.7580)::geography,
 60, 38, 1.50, 'open_lot', FALSE, FALSE, FALSE, 3.8, 42, NOW(), NOW()),

-- Limited, EV-focused
('GreenCharge EV Hub',
 '15 Nguyen Hue, District 1',
 ST_MakePoint(106.7015, 10.7740)::geography,
 40, 4, 3.50, 'ev_station', TRUE, TRUE, TRUE, 4.6, 89, NOW(), NOW()),

-- Limited, transit hub
('Ben Thanh Transit Parking',
 '1 Ben Thanh Square, District 1',
 ST_MakePoint(106.6980, 10.7725)::geography,
 80, 3, 2.00, 'transit', FALSE, TRUE, TRUE, 4.2, 315, NOW(), NOW()),

-- Limited, smart facility
('SmartPark Tower',
 '88 Dong Khoi, District 1',
 ST_MakePoint(106.7045, 10.7790)::geography,
 150, 5, 3.00, 'smart', TRUE, TRUE, TRUE, 4.7, 178, NOW(), NOW()),

-- Available, mall parking (large capacity)
('Takashimaya Basement P',
 '92 Nam Ky Khoi Nghia, District 1',
 ST_MakePoint(106.6975, 10.7735)::geography,
 300, 87, 2.00, 'mall', FALSE, TRUE, TRUE, 4.3, 412, NOW(), NOW()),

-- Full, rush hour garage
('Diamond Plaza Garage',
 '34 Le Duan, District 1',
 ST_MakePoint(106.6995, 10.7810)::geography,
 100, 0, 3.00, 'garage', FALSE, TRUE, TRUE, 4.1, 203, NOW(), NOW()),

-- Full, event lot
('Opera House Lot',
 '7 Lam Son Square, District 1',
 ST_MakePoint(106.7030, 10.7770)::geography,
 50, 0, 3.50, 'event', FALSE, TRUE, FALSE, 3.9, 67, NOW(), NOW()),

-- Available, airport long-term
('TSN Airport Long-Term P3',
 'Truong Son, Tan Binh',
 ST_MakePoint(106.6570, 10.8130)::geography,
 500, 210, 5.00, 'airport', TRUE, TRUE, TRUE, 4.4, 534, NOW(), NOW());
