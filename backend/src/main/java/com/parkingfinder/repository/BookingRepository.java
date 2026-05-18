package com.parkingfinder.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.parkingfinder.domain.Booking;

public interface BookingRepository extends JpaRepository<Booking, Long> {

  @Query(
      """
      SELECT COUNT(b)
      FROM Booking b
      WHERE b.parkingId = :parkingId
      AND b.status = 'ACTIVE'
      """)
  long countActiveBookings(@Param("parkingId") Long parkingId);
}
