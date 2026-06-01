package com.parkingfinder.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.parkingfinder.domain.BookingStatus;

public record BookingDetailResponse(
    Long id,
    Long parkingId,
    String parkingName,
    String parkingAddress,
    BigDecimal hourlyRate,
    String userId,
    Instant startTime,
    Instant endTime,
    BookingStatus status,
    Instant createdAt) {}
