package com.parkingfinder.repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.parkingfinder.domain.Parking;
import com.parkingfinder.dto.ParkingAvailabilitySnapshot;

public interface ParkingRepository extends JpaRepository<Parking, Long> {

  @Query(
      value =
          """
          SELECT p.id,
                 p.name,
                 p.total_slots     AS totalSlots,
                 p.available_slots AS availableSlots,
                 ST_Y(p.location::geometry) AS lat,
                 ST_X(p.location::geometry) AS lng,
                 ST_Distance(p.location,
                       ST_MakePoint(:lng, :lat)::geography) AS distanceMeters,
                 p.updated_at      AS updatedAt,
                 p.hourly_rate     AS hourlyRate,
                 p.parking_type    AS parkingType,
                 p.has_ev_charging AS hasEvCharging,
                 p.has_security    AS hasSecurity,
                 p.has_roof        AS hasRoof,
                 p.rating,
                 p.review_count    AS reviewCount
          FROM parking p
          WHERE ST_DWithin(p.location,
                     ST_MakePoint(:lng, :lat)::geography,
                          :radiusMeters)
          ORDER BY distanceMeters ASC
          """,
      nativeQuery = true)
  List<NearbyParkingProjection> findNearby(
      @Param("lat") double lat, @Param("lng") double lng, @Param("radiusMeters") double radiusMeters);

  @Query(
      """
      SELECT new com.parkingfinder.dto.ParkingAvailabilitySnapshot(
        p.id, p.availableSlots, p.totalSlots, p.updatedAt
      )
      FROM Parking p
      WHERE p.id IN :parkingIds
      """)
  List<ParkingAvailabilitySnapshot> findAvailabilitySnapshots(
      @Param("parkingIds") Collection<Long> parkingIds);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query(
      """
      UPDATE Parking p
      SET p.availableSlots = p.availableSlots - 1,
          p.updatedAt = :updatedAt
      WHERE p.id = :parkingId AND p.availableSlots > 0
      """)
  int decrementAvailableSlot(@Param("parkingId") Long parkingId, @Param("updatedAt") Instant updatedAt);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query(
      """
      UPDATE Parking p
      SET p.availableSlots = CASE
            WHEN p.availableSlots < p.totalSlots THEN p.availableSlots + 1
            ELSE p.totalSlots
          END,
          p.updatedAt = :updatedAt
      WHERE p.id = :parkingId
      """)
  int incrementAvailableSlot(@Param("parkingId") Long parkingId, @Param("updatedAt") Instant updatedAt);
}
