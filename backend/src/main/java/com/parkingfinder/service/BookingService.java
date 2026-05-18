package com.parkingfinder.service;

import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.parkingfinder.domain.Booking;
import com.parkingfinder.domain.BookingStatus;
import com.parkingfinder.domain.Parking;
import com.parkingfinder.dto.BookingResponse;
import com.parkingfinder.dto.CreateBookingRequest;
import com.parkingfinder.exception.NoAvailableSlotException;
import com.parkingfinder.exception.ResourceNotFoundException;
import com.parkingfinder.repository.BookingRepository;
import com.parkingfinder.repository.ParkingRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BookingService {

  private final BookingRepository bookingRepository;
  private final ParkingRepository parkingRepository;

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

    // Naive baseline: check active bookings in DB, then insert.
    long activeBookings = bookingRepository.countActiveBookings(parking.getId());
    if (activeBookings >= parking.getTotalSlots()) {
      throw new NoAvailableSlotException("No available slot for parkingId=" + parking.getId());
    }

    Booking booking = new Booking();
    booking.setParkingId(request.parkingId());
    booking.setUserId(request.userId());
    booking.setStartTime(request.startTime());
    booking.setEndTime(request.endTime());
    booking.setStatus(BookingStatus.ACTIVE);
    booking.setCreatedAt(Instant.now());

    Booking saved = bookingRepository.save(booking);
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
