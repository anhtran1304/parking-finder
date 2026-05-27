package com.parkingfinder.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.parkingfinder.domain.AppUser;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

  Optional<AppUser> findByEmail(String email);

  boolean existsByEmail(String email);
}
