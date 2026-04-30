package com.parkingfinder.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record CreateBookingRequest(
    @NotNull Long parkingId,
    @NotBlank String userId,
    @NotNull @Future Instant startTime,
    @NotNull @Future Instant endTime) {}
