package com.parkingfinder.service;

import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.parkingfinder.domain.Booking;
import com.parkingfinder.domain.BookingStatus;
import com.parkingfinder.domain.Parking;
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
  public BookingResponse createBooking(CreateBookingRequest request) {
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
    booking.setUserId(request.userId());
    booking.setStartTime(request.startTime());
    booking.setEndTime(request.endTime());
    booking.setStatus(BookingStatus.ACTIVE);
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

  private void validateBookingWindow(CreateBookingRequest request) {
    if (!request.endTime().isAfter(request.startTime())) {
      throw new IllegalArgumentException("endTime must be after startTime");
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
}
