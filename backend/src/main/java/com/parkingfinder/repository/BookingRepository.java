package com.parkingfinder.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.parkingfinder.domain.Booking;
import com.parkingfinder.domain.BookingStatus;

public interface BookingRepository extends JpaRepository<Booking, Long> {

  Page<Booking> findByUserId(String userId, Pageable pageable);

  Page<Booking> findByUserIdAndStatus(String userId, BookingStatus status, Pageable pageable);

  Optional<Booking>
      findFirstByUserIdAndStatusAndStartTimeLessThanEqualAndEndTimeGreaterThanOrderByStartTimeDesc(
          String userId, BookingStatus status, Instant startTime, Instant endTime);

  @Query(
      """
      SELECT COUNT(b)
      FROM Booking b
      WHERE b.parkingId = :parkingId
      AND b.status IN (
        com.parkingfinder.domain.BookingStatus.PENDING,
        com.parkingfinder.domain.BookingStatus.ACTIVE
      )
      """)
  long countActiveBookings(@Param("parkingId") Long parkingId);

  @Modifying(clearAutomatically = true)
  @Transactional
  @Query(
      """
      UPDATE Booking b
      SET b.status = com.parkingfinder.domain.BookingStatus.ACTIVE
      WHERE b.status = com.parkingfinder.domain.BookingStatus.PENDING
      AND b.startTime <= :now
      """)
  int activatePendingBookings(@Param("now") Instant now);

  @Query(
      """
      SELECT b FROM Booking b
      WHERE b.status IN (
        com.parkingfinder.domain.BookingStatus.PENDING,
        com.parkingfinder.domain.BookingStatus.ACTIVE
      )
      AND b.endTime <= :now
      """)
  List<Booking> findExpirable(@Param("now") Instant now);

  @Modifying(clearAutomatically = true)
  @Transactional
  @Query("UPDATE Booking b SET b.status = :status WHERE b.id IN :ids")
  int bulkUpdateStatus(@Param("ids") List<Long> ids, @Param("status") BookingStatus status);
}
