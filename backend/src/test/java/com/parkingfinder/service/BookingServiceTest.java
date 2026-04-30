package com.parkingfinder.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.parkingfinder.domain.Booking;
import com.parkingfinder.domain.BookingStatus;
import com.parkingfinder.domain.Parking;
import com.parkingfinder.dto.BookingResponse;
import com.parkingfinder.dto.CreateBookingRequest;
import com.parkingfinder.exception.BookingFailedException;
import com.parkingfinder.exception.NoAvailableSlotException;
import com.parkingfinder.repository.BookingRepository;
import com.parkingfinder.repository.ParkingRepository;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

  @Mock private BookingRepository bookingRepository;
  @Mock private ParkingRepository parkingRepository;
  @Mock private SlotCounterService slotCounterService;
  @Mock private ParkingCacheService parkingCacheService;

  private BookingService bookingService;

  @BeforeEach
  void setUp() {
    bookingService =
        new BookingService(bookingRepository, parkingRepository, slotCounterService, parkingCacheService);
  }

  @Test
  void createBooking_shouldSucceed_whenSlotsAvailable() {
    Parking parking = parking(1L, 10, 6);
    CreateBookingRequest request =
        new CreateBookingRequest(
            1L, "user-1", Instant.now().plusSeconds(600), Instant.now().plusSeconds(1200));

    when(parkingRepository.findById(1L)).thenReturn(Optional.of(parking));
    when(slotCounterService.tryReserveSlot(1L, 6)).thenReturn(true);
    when(parkingRepository.decrementAvailableSlot(any(), any())).thenReturn(1);

    Booking saved = new Booking();
    saved.setId(100L);
    saved.setParkingId(1L);
    saved.setUserId("user-1");
    saved.setStartTime(request.startTime());
    saved.setEndTime(request.endTime());
    saved.setStatus(BookingStatus.CONFIRMED);
    saved.setCreatedAt(Instant.now());

    when(bookingRepository.save(any(Booking.class))).thenReturn(saved);
    when(parkingRepository.findById(1L)).thenReturn(Optional.of(parking(1L, 10, 5)));

    BookingResponse response = bookingService.createBooking(request);

    assertThat(response.id()).isEqualTo(100L);
    assertThat(response.status()).isEqualTo(BookingStatus.CONFIRMED);
    verify(slotCounterService).syncSlot(1L, 5);
    verify(parkingCacheService).evictParkingDetail(1L);
  }

  @Test
  void createBooking_shouldThrow_whenRedisNoSlot() {
    Parking parking = parking(1L, 10, 0);
    CreateBookingRequest request =
        new CreateBookingRequest(
            1L, "user-2", Instant.now().plusSeconds(600), Instant.now().plusSeconds(1200));

    when(parkingRepository.findById(1L)).thenReturn(Optional.of(parking));
    when(slotCounterService.tryReserveSlot(1L, 0)).thenReturn(false);

    assertThatThrownBy(() -> bookingService.createBooking(request))
        .isInstanceOf(NoAvailableSlotException.class);

    verify(bookingRepository, never()).save(any());
  }

  @Test
  void createBooking_shouldRollbackRedis_whenDbSaveFails() {
    Parking parking = parking(1L, 10, 2);
    CreateBookingRequest request =
        new CreateBookingRequest(
            1L, "user-3", Instant.now().plusSeconds(600), Instant.now().plusSeconds(1200));

    when(parkingRepository.findById(1L)).thenReturn(Optional.of(parking));
    when(slotCounterService.tryReserveSlot(1L, 2)).thenReturn(true);
    when(parkingRepository.decrementAvailableSlot(any(), any())).thenReturn(1);
    when(bookingRepository.save(any())).thenThrow(new RuntimeException("db down"));

    assertThatThrownBy(() -> bookingService.createBooking(request))
        .isInstanceOf(BookingFailedException.class);

    verify(slotCounterService).rollbackReserve(1L);
  }

  private Parking parking(Long id, int totalSlots, int availableSlots) {
    GeometryFactory factory = new GeometryFactory();
    Point point = factory.createPoint(new Coordinate(106.7, 10.7));
    point.setSRID(4326);

    Parking parking = new Parking();
    parking.setId(id);
    parking.setName("Parking " + id);
    parking.setLocation(point);
    parking.setTotalSlots(totalSlots);
    parking.setAvailableSlots(availableSlots);
    parking.setUpdatedAt(Instant.now());
    return parking;
  }
}
