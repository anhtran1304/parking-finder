package com.parkingfinder.repository;

import java.time.Instant;

public interface NearbyParkingProjection {
  Long getId();

  String getName();

  Integer getAvailableSlots();

  Double getLat();

  Double getLng();

  Double getDistanceMeters();

  Instant getUpdatedAt();
}
