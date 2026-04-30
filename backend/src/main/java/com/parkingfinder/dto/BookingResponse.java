package com.parkingfinder.dto;

import com.parkingfinder.domain.BookingStatus;
import java.time.Instant;

public record BookingResponse(
    Long id,
    Long parkingId,
    String userId,
    Instant startTime,
    Instant endTime,
    BookingStatus status,
    Instant createdAt) {}
