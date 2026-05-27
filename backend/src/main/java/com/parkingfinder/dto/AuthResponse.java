package com.parkingfinder.dto;

public record AuthResponse(
    String accessToken, long expiresIn, Long userId, String email, String fullName) {}
