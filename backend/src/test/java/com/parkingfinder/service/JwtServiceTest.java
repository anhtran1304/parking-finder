package com.parkingfinder.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.parkingfinder.domain.AppUser;
import com.parkingfinder.domain.Role;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

  private final JwtService jwtService =
      new JwtService("test-secret-key-that-is-at-least-thirty-two-characters", 900);

  @Test
  void generateAccessToken_shouldCarryAdminRoleClaim() {
    AppUser admin = new AppUser();
    admin.setId(7L);
    admin.setEmail("admin@example.com");
    admin.setPasswordHash("N/A");
    admin.setFullName("Local Admin");
    admin.setRole(Role.ADMIN);
    admin.setCreatedAt(Instant.now());

    String token = jwtService.generateAccessToken(admin);

    assertThat(jwtService.isTokenValid(token)).isTrue();
    assertThat(jwtService.extractEmail(token)).isEqualTo("admin@example.com");
    assertThat(jwtService.extractRole(token)).isEqualTo("ADMIN");
  }
}
