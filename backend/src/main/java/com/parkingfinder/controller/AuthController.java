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

import com.parkingfinder.dto.ApiErrorResponse;
import com.parkingfinder.dto.AuthResponse;
import com.parkingfinder.dto.LoginRequest;
import com.parkingfinder.dto.RegisterRequest;
import com.parkingfinder.service.AuthService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Authentication and session lifecycle APIs")
public class AuthController {

  private static final String REFRESH_COOKIE_NAME = "refresh_token";

  private final AuthService authService;

  @Value("${app.jwt.refresh-token-expiry-days}")
  private long refreshTokenExpiryDays;

  @Value("${app.jwt.cookie-secure}")
  private boolean cookieSecure;

  @PostMapping("/register")
    @Operation(
      summary = "Register account",
      description = "Create a new user account and issue access + refresh tokens")
    @ApiResponses({
      @ApiResponse(
        responseCode = "201",
        description = "Registration successful",
        content = @Content(schema = @Schema(implementation = AuthResponse.class))),
      @ApiResponse(
        responseCode = "400",
        description = "Validation error",
        content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
      @ApiResponse(
        responseCode = "409",
        description = "Email already exists",
        content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
  public ResponseEntity<AuthResponse> register(
      @Valid @RequestBody RegisterRequest request, HttpServletResponse servletResponse) {
    AuthService.AuthSession session = authService.register(request);
    setRefreshCookie(servletResponse, session.refreshToken());
    return ResponseEntity.status(HttpStatus.CREATED).body(session.authResponse());
  }

  @PostMapping("/login")
    @Operation(
      summary = "Login",
      description = "Authenticate user credentials and issue access + refresh tokens")
    @ApiResponses({
      @ApiResponse(
        responseCode = "200",
        description = "Login successful",
        content = @Content(schema = @Schema(implementation = AuthResponse.class))),
      @ApiResponse(
        responseCode = "400",
        description = "Invalid credentials or invalid input",
        content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
  public ResponseEntity<AuthResponse> login(
      @Valid @RequestBody LoginRequest request, HttpServletResponse servletResponse) {
    AuthService.AuthSession session = authService.login(request);
    setRefreshCookie(servletResponse, session.refreshToken());
    return ResponseEntity.ok(session.authResponse());
  }

  @PostMapping("/refresh")
    @Operation(
      summary = "Refresh access token",
      description = "Rotate refresh token cookie and issue a new access token")
    @ApiResponses({
      @ApiResponse(
        responseCode = "200",
        description = "Token refresh successful",
        content = @Content(schema = @Schema(implementation = AuthResponse.class))),
      @ApiResponse(
        responseCode = "400",
        description = "Missing, invalid, or expired refresh token",
        content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
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
    @Operation(
      summary = "Logout",
      description = "Revoke current refresh token and clear refresh cookie")
    @ApiResponses({
      @ApiResponse(responseCode = "204", description = "Logout successful"),
      @ApiResponse(
        responseCode = "400",
        description = "Invalid request",
        content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
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
