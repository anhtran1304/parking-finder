package com.parkingfinder.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.parkingfinder.domain.AppUser;
import com.parkingfinder.domain.RefreshToken;
import com.parkingfinder.domain.Role;
import com.parkingfinder.dto.AuthResponse;
import com.parkingfinder.dto.LoginRequest;
import com.parkingfinder.dto.RegisterRequest;
import com.parkingfinder.exception.DuplicateEmailException;
import com.parkingfinder.exception.ResourceNotFoundException;
import com.parkingfinder.repository.AppUserRepository;
import com.parkingfinder.repository.RefreshTokenRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final AppUserRepository appUserRepository;
  private final RefreshTokenRepository refreshTokenRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  @Value("${app.jwt.access-token-expiry-seconds}")
  private long accessTokenExpirySeconds;

  @Value("${app.jwt.refresh-token-expiry-days}")
  private long refreshTokenExpiryDays;

  @Transactional
  public AuthSession register(RegisterRequest request) {
    String email = normalizeEmail(request.email());

    if (appUserRepository.existsByEmail(email)) {
      throw new DuplicateEmailException("Email already registered: " + email);
    }

    AppUser user = new AppUser();
    user.setEmail(email);
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    user.setFullName(request.fullName().trim());
    user.setRole(Role.USER);
    user.setCreatedAt(Instant.now());

    AppUser savedUser = appUserRepository.save(user);
    return issueSession(savedUser);
  }

  @Transactional(readOnly = true)
  public AppUser getByEmailOrThrow(String email) {
    return appUserRepository
        .findByEmail(normalizeEmail(email))
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
  }

  @Transactional
  public AuthSession login(LoginRequest request) {
    String email = normalizeEmail(request.email());

    AppUser user =
        appUserRepository
            .findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

    if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      throw new IllegalArgumentException("Invalid email or password");
    }

    return issueSession(user);
  }

  @Transactional
  public AuthSession refresh(String rawRefreshToken) {
    if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
      throw new IllegalStateException("Refresh token is required");
    }

    String tokenHash = hashToken(rawRefreshToken);
    RefreshToken storedToken =
        refreshTokenRepository
            .findByTokenHash(tokenHash)
            .orElseThrow(() -> new IllegalStateException("Invalid refresh token"));

    Instant now = Instant.now();
    if (storedToken.getExpiresAt().isBefore(now)) {
      refreshTokenRepository.delete(storedToken);
      throw new IllegalStateException("Refresh token expired");
    }

    AppUser user =
        appUserRepository
            .findById(storedToken.getUserId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

    refreshTokenRepository.delete(storedToken);
    return issueSession(user);
  }

  @Transactional
  public void logout(String rawRefreshToken) {
    if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
      return;
    }

    String tokenHash = hashToken(rawRefreshToken);
    refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(refreshTokenRepository::delete);
  }

  private AuthSession issueSession(AppUser user) {
    String accessToken = jwtService.generateAccessToken(user);
    String rawRefreshToken = UUID.randomUUID().toString();

    RefreshToken refreshToken = new RefreshToken();
    refreshToken.setUserId(user.getId());
    refreshToken.setTokenHash(hashToken(rawRefreshToken));
    refreshToken.setExpiresAt(Instant.now().plus(Duration.ofDays(refreshTokenExpiryDays)));
    refreshToken.setCreatedAt(Instant.now());
    refreshTokenRepository.save(refreshToken);

    AuthResponse authResponse =
        new AuthResponse(
            accessToken,
            accessTokenExpirySeconds,
            user.getId(),
            user.getEmail(),
            user.getFullName());

    return new AuthSession(authResponse, rawRefreshToken);
  }

  private String hashToken(String rawToken) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(hash);
    } catch (NoSuchAlgorithmException ex) {
      throw new IllegalStateException("SHA-256 algorithm is not available", ex);
    }
  }

  private String normalizeEmail(String email) {
    return email.trim().toLowerCase(Locale.ROOT);
  }

  public record AuthSession(AuthResponse authResponse, String refreshToken) {}
}
