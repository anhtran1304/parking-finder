package com.parkingfinder.repository;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.parkingfinder.domain.RefreshToken;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

  Optional<RefreshToken> findByTokenHash(String tokenHash);

  long deleteByUserId(Long userId);

  long deleteAllByExpiresAtBefore(Instant now);
}
