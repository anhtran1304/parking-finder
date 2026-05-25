package com.parkingfinder.service;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

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

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

  @Mock private BookingRepository bookingRepository;
  @Mock private ParkingRepository parkingRepository;
  @Mock private SlotCounterService slotCounterService;

  private BookingService bookingService;

  @BeforeEach
  void setUp() {
    bookingService = new BookingService(bookingRepository, parkingRepository, slotCounterService);
  }

  @Test
  void createBooking_shouldSucceed_whenSlotsAvailable() {
    Parking parking = parking(1L, 2, 2);
    CreateBookingRequest request =
        new CreateBookingRequest(
            1L, "user-1", Instant.now().plusSeconds(600), Instant.now().plusSeconds(1200));

    when(parkingRepository.findById(1L)).thenReturn(Optional.of(parking));
    when(bookingRepository.countActiveBookings(1L)).thenReturn(1L);
    when(slotCounterService.tryReserveSlot(1L, 1)).thenReturn(true);

    Booking saved = new Booking();
    saved.setId(100L);
    saved.setParkingId(1L);
    saved.setUserId("user-1");
    saved.setStartTime(request.startTime());
    saved.setEndTime(request.endTime());
    saved.setStatus(BookingStatus.ACTIVE);
    saved.setCreatedAt(Instant.now());

    when(bookingRepository.save(any(Booking.class))).thenReturn(saved);

    BookingResponse response = bookingService.createBooking(request);

    assertThat(response.id()).isEqualTo(100L);
    assertThat(response.status()).isEqualTo(BookingStatus.ACTIVE);
    verify(slotCounterService).tryReserveSlot(1L, 1);
  }

  @Test
  void createBooking_shouldThrow_whenNoAvailableSlotInDatabase() {
    Parking parking = parking(1L, 1, 1);
    CreateBookingRequest request =
        new CreateBookingRequest(
            1L, "user-2", Instant.now().plusSeconds(600), Instant.now().plusSeconds(1200));

    when(parkingRepository.findById(1L)).thenReturn(Optional.of(parking));
    when(bookingRepository.countActiveBookings(1L)).thenReturn(1L);

    assertThatThrownBy(() -> bookingService.createBooking(request))
        .isInstanceOf(NoAvailableSlotException.class);

    verify(slotCounterService, never()).tryReserveSlot(any(), anyInt());
    verify(bookingRepository, never()).save(any());
  }

  @Test
  void createBooking_shouldThrow_whenRedisReserveReturnsFalse() {
    Parking parking = parking(1L, 2, 2);
    CreateBookingRequest request =
        new CreateBookingRequest(
            1L, "user-4", Instant.now().plusSeconds(600), Instant.now().plusSeconds(1200));

    when(parkingRepository.findById(1L)).thenReturn(Optional.of(parking));
    when(bookingRepository.countActiveBookings(1L)).thenReturn(0L);
    when(slotCounterService.tryReserveSlot(1L, 2)).thenReturn(false);

    assertThatThrownBy(() -> bookingService.createBooking(request))
        .isInstanceOf(NoAvailableSlotException.class);

    verify(bookingRepository, never()).save(any());
  }

  @Test
  void createBooking_shouldRollbackRedisReserve_whenDatabaseSaveFails() {
    Parking parking = parking(1L, 2, 2);
    CreateBookingRequest request =
        new CreateBookingRequest(
            1L, "user-5", Instant.now().plusSeconds(600), Instant.now().plusSeconds(1200));
    RuntimeException dbFailure = new RuntimeException("db unavailable");

    when(parkingRepository.findById(1L)).thenReturn(Optional.of(parking));
    when(bookingRepository.countActiveBookings(1L)).thenReturn(0L);
    when(slotCounterService.tryReserveSlot(1L, 2)).thenReturn(true);
    when(bookingRepository.save(any(Booking.class))).thenThrow(dbFailure);

    assertThatThrownBy(() -> bookingService.createBooking(request)).isSameAs(dbFailure);

    verify(slotCounterService).rollbackReserve(1L);
  }

  @Test
  void createBooking_shouldThrowServiceUnavailable_whenRedisReserveFails() {
    Parking parking = parking(1L, 2, 2);
    CreateBookingRequest request =
        new CreateBookingRequest(
            1L, "user-6", Instant.now().plusSeconds(600), Instant.now().plusSeconds(1200));

    when(parkingRepository.findById(1L)).thenReturn(Optional.of(parking));
    when(bookingRepository.countActiveBookings(1L)).thenReturn(0L);
    when(slotCounterService.tryReserveSlot(1L, 2)).thenThrow(new RuntimeException("redis down"));

    assertThatThrownBy(() -> bookingService.createBooking(request))
        .isInstanceOf(BookingReservationUnavailableException.class)
        .hasMessage("Booking reservation system unavailable");

    verify(bookingRepository, never()).save(any());
  }

  @Test
  void createBooking_shouldNotCallRedis_whenParkingMissing() {
    CreateBookingRequest request =
        new CreateBookingRequest(
            404L, "user-7", Instant.now().plusSeconds(600), Instant.now().plusSeconds(1200));

    when(parkingRepository.findById(404L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> bookingService.createBooking(request))
        .isInstanceOf(ResourceNotFoundException.class);

    verifyNoInteractions(slotCounterService);
    verify(bookingRepository, never()).save(any());
  }

  @Test
  void createBooking_shouldThrow_whenEndBeforeStart() {
    Instant start = Instant.now().plusSeconds(1200);
    Instant end = Instant.now().plusSeconds(600);

    CreateBookingRequest request = new CreateBookingRequest(1L, "user-3", start, end);

    assertThatThrownBy(() -> bookingService.createBooking(request))
        .isInstanceOf(IllegalArgumentException.class);

    verifyNoInteractions(parkingRepository, bookingRepository, slotCounterService);
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
