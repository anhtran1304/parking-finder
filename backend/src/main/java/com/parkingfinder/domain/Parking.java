package com.parkingfinder.domain;

import java.math.BigDecimal;
import java.time.Instant;

import org.locationtech.jts.geom.Point;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "parking")
@Getter
@Setter
@NoArgsConstructor
public class Parking {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String name;

  @Column
  private String address;

  @Column(nullable = false, columnDefinition = "geography(Point,4326)")
  private Point location;

  @Column(name = "total_slots", nullable = false)
  private int totalSlots;

  @Column(name = "available_slots", nullable = false)
  private int availableSlots;

  @Column(name = "hourly_rate")
  private BigDecimal hourlyRate;

  @Column(name = "parking_type")
  private String parkingType;

  @Column(name = "has_ev_charging")
  private Boolean hasEvCharging;

  @Column(name = "has_security")
  private Boolean hasSecurity;

  @Column(name = "has_roof")
  private Boolean hasRoof;

  @Column(name = "rating")
  private BigDecimal rating;

  @Column(name = "review_count")
  private Integer reviewCount;

  @Column(name = "created_at")
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;
}
