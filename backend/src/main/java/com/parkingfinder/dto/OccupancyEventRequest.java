package com.parkingfinder.dto;

import com.parkingfinder.domain.OccupancyAction;
import jakarta.validation.constraints.NotNull;

public record OccupancyEventRequest(@NotNull OccupancyAction action) {}
