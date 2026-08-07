package com.parkingfinder.event;

import java.time.Instant;
import java.util.UUID;

public record ParkingAvailabilityChanged(
    UUID eventId,
    Long parkingId,
    int availableSlots,
    int totalSlots,
    Instant updatedAt,
    ParkingAvailabilityChangeReason reason) {}
