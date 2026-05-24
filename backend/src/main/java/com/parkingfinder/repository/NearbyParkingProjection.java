package com.parkingfinder.repository;

import java.math.BigDecimal;
import java.time.Instant;

public interface NearbyParkingProjection {
  Long getId();

  String getName();

  Integer getTotalSlots();

  Integer getAvailableSlots();

  Double getLat();

  Double getLng();

  Double getDistanceMeters();

  Instant getUpdatedAt();

  BigDecimal getHourlyRate();

  String getParkingType();

  Boolean getHasEvCharging();

  Boolean getHasSecurity();

  Boolean getHasRoof();

  BigDecimal getRating();

  Integer getReviewCount();
}
