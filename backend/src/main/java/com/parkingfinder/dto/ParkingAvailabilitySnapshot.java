package com.parkingfinder.dto;

import java.time.Instant;

public record ParkingAvailabilitySnapshot(
    Long parkingId, int availableSlots, int totalSlots, Instant updatedAt) {}
