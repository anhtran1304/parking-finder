package com.parkingfinder.service;

import java.time.Duration;
import java.time.Instant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.parkingfinder.domain.Booking;
import com.parkingfinder.domain.BookingStatus;
import com.parkingfinder.domain.Parking;
import com.parkingfinder.dto.BookingDetailResponse;
import com.parkingfinder.dto.BookingResponse;
import com.parkingfinder.dto.CreateBookingRequest;
import com.parkingfinder.exception.BookingReservationUnavailableException;
import com.parkingfinder.exception.NoAvailableSlotException;
import com.parkingfinder.exception.ResourceNotFoundException;
import com.parkingfinder.repository.BookingRepository;
import com.parkingfinder.repository.ParkingRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

  private final BookingRepository bookingRepository;
  private final ParkingRepository parkingRepository;
  private final SlotCounterService slotCounterService;

  @Transactional
  public BookingResponse createBooking(CreateBookingRequest request, String userId) {
    if (userId == null || userId.isBlank()) {
      throw new IllegalArgumentException("userId is required");
    }

    validateBookingWindow(request);

    Parking parking =
        parkingRepository
            .findById(request.parkingId())
            .orElseThrow(
                () ->
                    new ResourceNotFoundException(
                        "Parking not found: " + request.parkingId()));

    long activeBookings = bookingRepository.countActiveBookings(parking.getId());
    long remainingSlots = parking.getTotalSlots() - activeBookings;
    if (remainingSlots <= 0) {
      throw new NoAvailableSlotException("No available slot for parkingId=" + parking.getId());
    }

    boolean reserved = tryReserveSlot(parking.getId(), (int) remainingSlots);
    if (!reserved) {
      throw new NoAvailableSlotException("No available slot for parkingId=" + parking.getId());
    }

    Booking booking = new Booking();
    booking.setParkingId(request.parkingId());
    booking.setUserId(userId);
    booking.setStartTime(request.startTime());
    booking.setEndTime(request.endTime());
    booking.setStatus(BookingStatus.PENDING);
    booking.setCreatedAt(Instant.now());

    Booking saved;
    try {
      saved = bookingRepository.save(booking);
    } catch (RuntimeException ex) {
      rollbackReserve(parking.getId(), ex);
      throw ex;
    }

    return toResponse(saved);
  }

  @Transactional(readOnly = true)
  public BookingResponse getById(Long bookingId) {
    Booking booking =
        bookingRepository
            .findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));
    return toResponse(booking);
  }

  @Transactional(readOnly = true)
  public BookingDetailResponse getByIdForUser(Long bookingId, String userId) {
    Booking booking =
        bookingRepository
            .findById(bookingId)
            .filter(b -> b.getUserId().equals(userId))
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));

    Parking parking = parkingRepository.findById(booking.getParkingId()).orElse(null);
    String parkingName = parking != null ? parking.getName() : "";
    String parkingAddress = parking != null ? parking.getAddress() : "";

    return new BookingDetailResponse(
        booking.getId(),
        booking.getParkingId(),
        parkingName,
        parkingAddress,
        booking.getUserId(),
        booking.getStartTime(),
        booking.getEndTime(),
        booking.getStatus(),
        booking.getCreatedAt());
  }

  @Transactional(readOnly = true)
  public Page<BookingResponse> getUserBookings(
      String userId,
      BookingStatus status,
      Pageable pageable) {
    if (userId == null || userId.isBlank()) {
      throw new IllegalArgumentException("userId is required");
    }

    Page<Booking> bookings =
        status == null
            ? bookingRepository.findByUserId(userId, pageable)
            : bookingRepository.findByUserIdAndStatus(userId, status, pageable);
    return bookings.map(this::toResponse);
  }

  @Transactional(readOnly = true)
  public BookingResponse getActiveUserBooking(String userId) {
    if (userId == null || userId.isBlank()) {
      throw new IllegalArgumentException("userId is required");
    }

    Instant now = Instant.now();
    return bookingRepository
        .findFirstByUserIdAndStatusAndStartTimeLessThanEqualAndEndTimeGreaterThanOrderByStartTimeDesc(
            userId, BookingStatus.ACTIVE, now, now)
        .map(this::toResponse)
        .orElse(null);
  }

  private void validateBookingWindow(CreateBookingRequest request) {
    if (!request.endTime().isAfter(request.startTime())) {
      throw new IllegalArgumentException("endTime must be after startTime");
    }
    Duration duration = Duration.between(request.startTime(), request.endTime());
    if (duration.toMinutes() < 30) {
      throw new IllegalArgumentException("Booking duration must be at least 30 minutes");
    }
    if (duration.toHours() > 24) {
      throw new IllegalArgumentException("Booking duration cannot exceed 24 hours");
    }
  }

  private boolean tryReserveSlot(Long parkingId, int remainingSlots) {
    try {
      return slotCounterService.tryReserveSlot(parkingId, remainingSlots);
    } catch (RuntimeException ex) {
      throw new BookingReservationUnavailableException(
          "Booking reservation system unavailable", ex);
    }
  }

  private void rollbackReserve(Long parkingId, RuntimeException originalFailure) {
    try {
      slotCounterService.rollbackReserve(parkingId);
    } catch (RuntimeException rollbackFailure) {
      log.error(
          "Failed to roll back Redis slot reservation for parkingId={} after DB booking failure",
          parkingId,
          rollbackFailure);
      originalFailure.addSuppressed(rollbackFailure);
    }
  }

  private BookingResponse toResponse(Booking booking) {
    return new BookingResponse(
        booking.getId(),
        booking.getParkingId(),
        booking.getUserId(),
        booking.getStartTime(),
        booking.getEndTime(),
        booking.getStatus(),
        booking.getCreatedAt());
  }

  @Transactional
  public BookingResponse cancelBookingForUser(Long bookingId, String userId) {
    Booking booking =
        bookingRepository
            .findById(bookingId)
            .filter(b -> b.getUserId().equals(userId))
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));

    if (booking.getStatus() != BookingStatus.PENDING
        && booking.getStatus() != BookingStatus.ACTIVE) {
      throw new IllegalStateException(
          "Cannot cancel booking in status: " + booking.getStatus());
    }

    booking.setStatus(BookingStatus.CANCELLED);
    Booking saved = bookingRepository.save(booking);
    slotCounterService.releaseSlot(booking.getParkingId());

    return toResponse(saved);
  }
}
