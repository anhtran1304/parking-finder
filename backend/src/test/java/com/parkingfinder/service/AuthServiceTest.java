package com.parkingfinder.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.parkingfinder.domain.AppUser;
import com.parkingfinder.domain.RefreshToken;
import com.parkingfinder.domain.Role;
import com.parkingfinder.dto.LoginRequest;
import com.parkingfinder.dto.RegisterRequest;
import com.parkingfinder.exception.DuplicateEmailException;
import com.parkingfinder.repository.AppUserRepository;
import com.parkingfinder.repository.RefreshTokenRepository;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

  @Mock private AppUserRepository appUserRepository;
  @Mock private RefreshTokenRepository refreshTokenRepository;
  @Mock private PasswordEncoder passwordEncoder;
  @Mock private JwtService jwtService;

  private AuthService authService;

  @BeforeEach
  void setUp() {
    authService = new AuthService(appUserRepository, refreshTokenRepository, passwordEncoder, jwtService);
    ReflectionTestUtils.setField(authService, "accessTokenExpirySeconds", 900L);
    ReflectionTestUtils.setField(authService, "refreshTokenExpiryDays", 7L);
  }

  @Test
  void register_shouldSucceed_withNewEmail() {
    RegisterRequest request = new RegisterRequest("demo@example.com", "password123", "Demo User");

    when(appUserRepository.existsByEmail("demo@example.com")).thenReturn(false);
    when(passwordEncoder.encode("password123")).thenReturn("hashed-password");
    when(appUserRepository.save(any(AppUser.class))).thenAnswer(invocation -> {
      AppUser user = invocation.getArgument(0, AppUser.class);
      user.setId(99L);
      return user;
    });
    when(jwtService.generateAccessToken(any(AppUser.class))).thenReturn("access-token");

    AuthService.AuthSession session = authService.register(request);

    assertThat(session.authResponse().accessToken()).isEqualTo("access-token");
    assertThat(session.authResponse().expiresIn()).isEqualTo(900L);
    assertThat(session.authResponse().userId()).isEqualTo(99L);
    assertThat(session.authResponse().email()).isEqualTo("demo@example.com");
    assertThat(session.refreshToken()).isNotBlank();

    verify(refreshTokenRepository).save(any(RefreshToken.class));
  }

  @Test
  void register_shouldThrow_whenEmailAlreadyExists() {
    RegisterRequest request = new RegisterRequest("taken@example.com", "password123", "Taken User");
    when(appUserRepository.existsByEmail("taken@example.com")).thenReturn(true);

    assertThatThrownBy(() -> authService.register(request))
        .isInstanceOf(DuplicateEmailException.class)
        .hasMessageContaining("taken@example.com");

    verify(appUserRepository, never()).save(any(AppUser.class));
    verify(refreshTokenRepository, never()).save(any(RefreshToken.class));
  }

  @Test
  void login_shouldSucceed_withValidCredentials() {
    LoginRequest request = new LoginRequest("demo@example.com", "password123");
    AppUser user = user(1L, "demo@example.com", "hashed-password");

    when(appUserRepository.findByEmail("demo@example.com")).thenReturn(Optional.of(user));
    when(passwordEncoder.matches("password123", "hashed-password")).thenReturn(true);
    when(jwtService.generateAccessToken(user)).thenReturn("access-token");

    AuthService.AuthSession session = authService.login(request);

    assertThat(session.authResponse().accessToken()).isEqualTo("access-token");
    assertThat(session.authResponse().userId()).isEqualTo(1L);
    assertThat(session.refreshToken()).isNotBlank();

    verify(refreshTokenRepository).save(any(RefreshToken.class));
  }

  @Test
  void login_shouldThrow_withWrongPassword() {
    LoginRequest request = new LoginRequest("demo@example.com", "wrong-pass");
    AppUser user = user(1L, "demo@example.com", "hashed-password");

    when(appUserRepository.findByEmail("demo@example.com")).thenReturn(Optional.of(user));
    when(passwordEncoder.matches("wrong-pass", "hashed-password")).thenReturn(false);

    assertThatThrownBy(() -> authService.login(request))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Invalid email or password");

    verify(refreshTokenRepository, never()).save(any(RefreshToken.class));
  }

  @Test
  void refresh_shouldSucceed_withValidToken() {
    String rawToken = "refresh-token";
    String tokenHash = hash(rawToken);

    RefreshToken stored = new RefreshToken();
    stored.setId(100L);
    stored.setUserId(1L);
    stored.setTokenHash(tokenHash);
    stored.setExpiresAt(Instant.now().plusSeconds(3600));
    stored.setCreatedAt(Instant.now());

    AppUser user = user(1L, "demo@example.com", "hashed-password");

    when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(stored));
    when(appUserRepository.findById(1L)).thenReturn(Optional.of(user));
    when(jwtService.generateAccessToken(user)).thenReturn("new-access-token");

    AuthService.AuthSession session = authService.refresh(rawToken);

    assertThat(session.authResponse().accessToken()).isEqualTo("new-access-token");
    assertThat(session.authResponse().userId()).isEqualTo(1L);
    assertThat(session.refreshToken()).isNotBlank();

    verify(refreshTokenRepository).delete(stored);
    verify(refreshTokenRepository).save(any(RefreshToken.class));
  }

  @Test
  void refresh_shouldThrow_whenTokenExpired() {
    String rawToken = "expired-token";
    String tokenHash = hash(rawToken);

    RefreshToken stored = new RefreshToken();
    stored.setId(101L);
    stored.setUserId(1L);
    stored.setTokenHash(tokenHash);
    stored.setExpiresAt(Instant.now().minusSeconds(30));
    stored.setCreatedAt(Instant.now().minusSeconds(3600));

    when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(stored));

    assertThatThrownBy(() -> authService.refresh(rawToken))
        .isInstanceOf(IllegalStateException.class)
        .hasMessage("Refresh token expired");

    verify(refreshTokenRepository).delete(stored);
    verify(appUserRepository, never()).findById(any());
  }

  @Test
  void logout_shouldDeleteRefreshToken() {
    String rawToken = "logout-token";
    String tokenHash = hash(rawToken);

    RefreshToken stored = new RefreshToken();
    stored.setId(200L);
    stored.setUserId(2L);
    stored.setTokenHash(tokenHash);
    stored.setExpiresAt(Instant.now().plusSeconds(3600));
    stored.setCreatedAt(Instant.now());

    when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(stored));

    authService.logout(rawToken);

    verify(refreshTokenRepository).delete(stored);
  }

  private AppUser user(Long id, String email, String passwordHash) {
    AppUser user = new AppUser();
    user.setId(id);
    user.setEmail(email);
    user.setPasswordHash(passwordHash);
    user.setFullName("Demo User");
    user.setRole(Role.USER);
    user.setCreatedAt(Instant.now());
    return user;
  }

  private String hash(String value) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(hash);
    } catch (NoSuchAlgorithmException ex) {
      throw new RuntimeException(ex);
    }
  }
}
