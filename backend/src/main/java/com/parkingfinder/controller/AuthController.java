package com.parkingfinder.controller;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.parkingfinder.dto.AuthResponse;
import com.parkingfinder.dto.LoginRequest;
import com.parkingfinder.dto.RegisterRequest;
import com.parkingfinder.service.AuthService;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

  private static final String REFRESH_COOKIE_NAME = "refresh_token";

  private final AuthService authService;

  @Value("${app.jwt.refresh-token-expiry-days}")
  private long refreshTokenExpiryDays;

  @Value("${app.jwt.cookie-secure}")
  private boolean cookieSecure;

  @PostMapping("/register")
  public ResponseEntity<AuthResponse> register(
      @Valid @RequestBody RegisterRequest request, HttpServletResponse servletResponse) {
    AuthService.AuthSession session = authService.register(request);
    setRefreshCookie(servletResponse, session.refreshToken());
    return ResponseEntity.status(HttpStatus.CREATED).body(session.authResponse());
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(
      @Valid @RequestBody LoginRequest request, HttpServletResponse servletResponse) {
    AuthService.AuthSession session = authService.login(request);
    setRefreshCookie(servletResponse, session.refreshToken());
    return ResponseEntity.ok(session.authResponse());
  }

  @PostMapping("/refresh")
  public ResponseEntity<AuthResponse> refresh(
      @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshToken,
      HttpServletResponse servletResponse) {
    if (refreshToken == null || refreshToken.isBlank()) {
      throw new IllegalStateException("Refresh token is required");
    }

    AuthService.AuthSession session = authService.refresh(refreshToken);
    setRefreshCookie(servletResponse, session.refreshToken());
    return ResponseEntity.ok(session.authResponse());
  }

  @PostMapping("/logout")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void logout(
      @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshToken,
      HttpServletResponse servletResponse) {
    authService.logout(refreshToken);
    clearRefreshCookie(servletResponse);
  }

  private void setRefreshCookie(HttpServletResponse servletResponse, String refreshToken) {
    ResponseCookie cookie =
        ResponseCookie.from(REFRESH_COOKIE_NAME, refreshToken)
            .httpOnly(true)
            .secure(cookieSecure)
            .sameSite("Lax")
            .path("/auth")
            .maxAge(Duration.ofDays(refreshTokenExpiryDays))
            .build();
    servletResponse.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
  }

  private void clearRefreshCookie(HttpServletResponse servletResponse) {
    ResponseCookie cookie =
        ResponseCookie.from(REFRESH_COOKIE_NAME, "")
            .httpOnly(true)
            .secure(cookieSecure)
            .sameSite("Lax")
            .path("/auth")
            .maxAge(Duration.ZERO)
            .build();
    servletResponse.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
  }
}
