package com.parkingfinder.dto;

import java.time.Instant;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

public record CreateBookingRequest(
    @NotNull Long parkingId,
    @NotNull @Future Instant startTime,
    @NotNull @Future Instant endTime) {}
