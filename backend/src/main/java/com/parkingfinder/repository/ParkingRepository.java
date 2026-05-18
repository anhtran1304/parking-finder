package com.parkingfinder.repository;

import com.parkingfinder.domain.Parking;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ParkingRepository extends JpaRepository<Parking, Long> {

  @Query(
      value =
          """
          SELECT p.id,
                 p.name,
                 p.available_slots AS availableSlots,
               ST_Y(p.location::geometry) AS lat,
               ST_X(p.location::geometry) AS lng,
               ST_Distance(p.location,
                     ST_MakePoint(:lng, :lat)::geography) AS distanceMeters,
                 p.updated_at AS updatedAt
          FROM parking p
           WHERE ST_DWithin(p.location,
                      ST_MakePoint(:lng, :lat)::geography,
                           :radiusMeters)
          ORDER BY distanceMeters ASC
          """,
      nativeQuery = true)
  List<NearbyParkingProjection> findNearby(
      @Param("lat") double lat, @Param("lng") double lng, @Param("radiusMeters") double radiusMeters);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query(
      """
      UPDATE Parking p
      SET p.availableSlots = p.availableSlots - 1,
          p.updatedAt = :updatedAt
      WHERE p.id = :parkingId AND p.availableSlots > 0
      """)
  int decrementAvailableSlot(@Param("parkingId") Long parkingId, @Param("updatedAt") Instant updatedAt);
}
