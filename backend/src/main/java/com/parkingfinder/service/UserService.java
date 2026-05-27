package com.parkingfinder.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.parkingfinder.domain.AppUser;
import com.parkingfinder.dto.UserProfileResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

  private final AuthService authService;

  @Transactional(readOnly = true)
  public UserProfileResponse getCurrentUserProfile(String email) {
    if (email == null || email.isBlank()) {
      throw new IllegalArgumentException("Authenticated user email is required");
    }

    AppUser user = authService.getByEmailOrThrow(email);
    return new UserProfileResponse(
        user.getId(),
        user.getEmail(),
        user.getFullName(),
        user.getRole(),
        user.getCreatedAt());
  }
}
