package com.parkingfinder.dto;

import java.time.Instant;

public record NearbyParkingResponse(
    Long id,
    String name,
    int availableSlots,
    double lat,
    double lng,
    long distanceMeters,
    Instant updatedAt) {}
