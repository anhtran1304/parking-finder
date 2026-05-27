package com.parkingfinder.service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.parkingfinder.domain.AppUser;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

  private final SecretKey signingKey;
  private final long accessTokenExpirySeconds;

  public JwtService(
      @Value("${app.jwt.secret}") String secret,
      @Value("${app.jwt.access-token-expiry-seconds}") long accessTokenExpirySeconds) {
    if (secret == null || secret.length() < 32) {
      throw new IllegalStateException("app.jwt.secret must be at least 32 characters");
    }
    this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.accessTokenExpirySeconds = accessTokenExpirySeconds;
  }

  public String generateAccessToken(AppUser user) {
    Instant now = Instant.now();
    Instant expiresAt = now.plusSeconds(accessTokenExpirySeconds);

    return Jwts.builder()
        .subject(user.getEmail())
        .claim("userId", user.getId())
        .claim("role", user.getRole().name())
        .issuedAt(Date.from(now))
        .expiration(Date.from(expiresAt))
        .signWith(signingKey)
        .compact();
  }

  public boolean isTokenValid(String token) {
    try {
      parseClaims(token);
      return true;
    } catch (JwtException | IllegalArgumentException ex) {
      return false;
    }
  }

  public String extractEmail(String token) {
    return parseClaims(token).getSubject();
  }

  public Long extractUserId(String token) {
    Number claim = parseClaims(token).get("userId", Number.class);
    return claim == null ? null : claim.longValue();
  }

  public String extractRole(String token) {
    return parseClaims(token).get("role", String.class);
  }

  private Claims parseClaims(String token) {
    return Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token).getPayload();
  }
}
