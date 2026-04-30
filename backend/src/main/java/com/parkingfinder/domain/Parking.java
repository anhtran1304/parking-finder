package com.parkingfinder.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.locationtech.jts.geom.Point;

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

  @Column(nullable = false, columnDefinition = "geometry(Point,4326)")
  private Point location;

  @Column(name = "total_slots", nullable = false)
  private int totalSlots;

  @Column(name = "available_slots", nullable = false)
  private int availableSlots;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;
}
