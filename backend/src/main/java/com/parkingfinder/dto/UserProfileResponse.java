package com.parkingfinder.dto;

import java.time.Instant;

import com.parkingfinder.domain.Role;

public record UserProfileResponse(
    Long id,
    String email,
    String fullName,
    Role role,
    Instant createdAt) {}
