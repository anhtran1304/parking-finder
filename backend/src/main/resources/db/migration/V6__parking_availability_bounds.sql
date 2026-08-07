ALTER TABLE parking
  ADD CONSTRAINT chk_parking_available_slots_bounds
  CHECK (available_slots >= 0 AND available_slots <= total_slots);
