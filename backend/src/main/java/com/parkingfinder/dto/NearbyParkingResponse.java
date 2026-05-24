package com.parkingfinder.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record NearbyParkingResponse(
    Long id,
    String name,
    int totalSlots,
    int availableSlots,
    double lat,
    double lng,
    long distanceMeters,
    Instant updatedAt,
    BigDecimal hourlyRate,
    String parkingType,
    Boolean hasEvCharging,
    Boolean hasSecurity,
    Boolean hasRoof,
    BigDecimal rating,
    Integer reviewCount) {}
