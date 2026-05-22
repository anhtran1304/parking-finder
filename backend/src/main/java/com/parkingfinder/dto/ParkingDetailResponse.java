package com.parkingfinder.dto;

import java.time.Instant;

public record ParkingDetailResponse(
    Long id,
    String name,
    String address,
    int totalSlots,
    int availableSlots,
    double lat,
    double lng,
    Instant updatedAt) {}
