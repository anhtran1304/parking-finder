package com.parkingfinder.service;

import com.parkingfinder.domain.Booking;
import com.parkingfinder.domain.BookingStatus;
import com.parkingfinder.domain.Parking;
import com.parkingfinder.dto.BookingResponse;
import com.parkingfinder.dto.CreateBookingRequest;
import com.parkingfinder.exception.BookingFailedException;
import com.parkingfinder.exception.NoAvailableSlotException;
import com.parkingfinder.exception.ResourceNotFoundException;
import com.parkingfinder.repository.BookingRepository;
import com.parkingfinder.repository.ParkingRepository;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BookingService {

  private final BookingRepository bookingRepository;
  private final ParkingRepository parkingRepository;
  private final SlotCounterService slotCounterService;
  private final ParkingCacheService parkingCacheService;

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

    if (!slotCounterService.tryReserveSlot(parking.getId(), parking.getAvailableSlots())) {
      throw new NoAvailableSlotException("No available slot for parkingId=" + parking.getId());
    }

    boolean rollbackRedis = true;
    try {
      int updated = parkingRepository.decrementAvailableSlot(parking.getId(), Instant.now());
      if (updated == 0) {
        rollbackRedis = false;
        slotCounterService.rollbackReserve(parking.getId());
        throw new NoAvailableSlotException("No available slot for parkingId=" + parking.getId());
      }

      Booking booking = new Booking();
      booking.setParkingId(request.parkingId());
      booking.setUserId(request.userId());
      booking.setStartTime(request.startTime());
      booking.setEndTime(request.endTime());
      booking.setStatus(BookingStatus.CONFIRMED);
      booking.setCreatedAt(Instant.now());

      Booking saved = bookingRepository.save(booking);
      rollbackRedis = false;

      parkingRepository
          .findById(parking.getId())
          .ifPresent(p -> slotCounterService.syncSlot(p.getId(), p.getAvailableSlots()));
      parkingCacheService.evictParkingDetail(parking.getId());

      return toResponse(saved);
    } catch (NoAvailableSlotException ex) {
      throw ex;
    } catch (RuntimeException ex) {
      if (rollbackRedis) {
        slotCounterService.rollbackReserve(parking.getId());
      }
      throw new BookingFailedException("Booking failed and transaction rolled back", ex);
    }
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
