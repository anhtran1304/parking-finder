package com.parkingfinder.service;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.parkingfinder.domain.Booking;
import com.parkingfinder.domain.BookingStatus;
import com.parkingfinder.event.ParkingAvailabilityChangeReason;
import com.parkingfinder.repository.BookingRepository;

@ExtendWith(MockitoExtension.class)
class BookingLifecycleSchedulerTest {

  @Mock private BookingRepository bookingRepository;
  @Mock private ParkingAvailabilityService parkingAvailabilityService;

  private BookingLifecycleScheduler scheduler;

  @BeforeEach
  void setUp() {
    scheduler = new BookingLifecycleScheduler(bookingRepository, parkingAvailabilityService);
  }

  @Test
  void activateBookings_shouldCallRepositoryWithCurrentTime() {
    when(bookingRepository.activatePendingBookings(any(Instant.class))).thenReturn(3);

    scheduler.activateBookings();

    verify(bookingRepository).activatePendingBookings(any(Instant.class));
  }

  @Test
  void activateBookings_shouldDoNothingWhenNoBookingsToActivate() {
    when(bookingRepository.activatePendingBookings(any(Instant.class))).thenReturn(0);

    scheduler.activateBookings();

    verify(bookingRepository).activatePendingBookings(any(Instant.class));
  }

  @Test
  void expireBookings_shouldCompleteActiveAndExpirePending() {
    Booking activeBooking = booking(1L, 10L, BookingStatus.ACTIVE);
    Booking pendingBooking = booking(2L, 20L, BookingStatus.PENDING);

    when(bookingRepository.findExpirable(any(Instant.class)))
        .thenReturn(List.of(activeBooking, pendingBooking));
    when(bookingRepository.bulkUpdateStatus(any(), any())).thenReturn(1);

    scheduler.expireBookings();

    verify(bookingRepository)
        .bulkUpdateStatus(argThat(ids -> ids.contains(1L)), eq(BookingStatus.COMPLETED));
    verify(bookingRepository)
        .bulkUpdateStatus(argThat(ids -> ids.contains(2L)), eq(BookingStatus.EXPIRED));
    verify(parkingAvailabilityService)
        .releaseSlot(10L, ParkingAvailabilityChangeReason.BOOKING_COMPLETED);
    verify(parkingAvailabilityService)
        .releaseSlot(20L, ParkingAvailabilityChangeReason.BOOKING_EXPIRED);
  }

  @Test
  void expireBookings_shouldReleaseSlotPerBooking_whenMultipleBookingsForSameParking() {
    Booking b1 = booking(1L, 5L, BookingStatus.ACTIVE);
    Booking b2 = booking(2L, 5L, BookingStatus.ACTIVE);

    when(bookingRepository.findExpirable(any(Instant.class))).thenReturn(List.of(b1, b2));
    when(bookingRepository.bulkUpdateStatus(any(), any())).thenReturn(2);

    scheduler.expireBookings();

    verify(parkingAvailabilityService, times(2))
        .releaseSlot(5L, ParkingAvailabilityChangeReason.BOOKING_COMPLETED);
  }

  @Test
  void expireBookings_shouldSkipWhenNothingExpirable() {
    when(bookingRepository.findExpirable(any(Instant.class))).thenReturn(List.of());

    scheduler.expireBookings();

    verify(bookingRepository, never()).bulkUpdateStatus(any(), any());
    verify(parkingAvailabilityService, never()).releaseSlot(any(), any());
  }

  @Test
  void expireBookings_shouldOnlyCompleteWhenAllAreActive() {
    Booking b1 = booking(1L, 10L, BookingStatus.ACTIVE);
    Booking b2 = booking(2L, 10L, BookingStatus.ACTIVE);

    when(bookingRepository.findExpirable(any(Instant.class))).thenReturn(List.of(b1, b2));
    when(bookingRepository.bulkUpdateStatus(any(), eq(BookingStatus.COMPLETED))).thenReturn(2);

    scheduler.expireBookings();

    verify(bookingRepository)
        .bulkUpdateStatus(argThat(ids -> ids.size() == 2), eq(BookingStatus.COMPLETED));
    verify(bookingRepository, never())
        .bulkUpdateStatus(any(), eq(BookingStatus.EXPIRED));
  }

  private Booking booking(Long id, Long parkingId, BookingStatus status) {
    Booking b = new Booking();
    b.setId(id);
    b.setParkingId(parkingId);
    b.setUserId("user-" + id);
    b.setStartTime(Instant.now().minusSeconds(3600));
    b.setEndTime(Instant.now().minusSeconds(60));
    b.setStatus(status);
    b.setCreatedAt(Instant.now().minusSeconds(7200));
    return b;
  }
}
