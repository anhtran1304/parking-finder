CREATE INDEX IF NOT EXISTS idx_booking_status_start ON booking (status, start_time);
CREATE INDEX IF NOT EXISTS idx_booking_status_end   ON booking (status, end_time);
