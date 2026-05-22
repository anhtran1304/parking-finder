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
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.parkingfinder.domain.Booking;
import com.parkingfinder.domain.BookingStatus;
import com.parkingfinder.domain.Parking;
import com.parkingfinder.dto.BookingResponse;
import com.parkingfinder.dto.CreateBookingRequest;
import com.parkingfinder.exception.NoAvailableSlotException;
import com.parkingfinder.repository.BookingRepository;
import com.parkingfinder.repository.ParkingRepository;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

  @Mock private BookingRepository bookingRepository;
  @Mock private ParkingRepository parkingRepository;

  private BookingService bookingService;

  @BeforeEach
  void setUp() {
    bookingService = new BookingService(bookingRepository, parkingRepository);
  }

  @Test
  void createBooking_shouldSucceed_whenSlotsAvailable() {
    Parking parking = parking(1L, 2, 2);
    CreateBookingRequest request =
        new CreateBookingRequest(
            1L, "user-1", Instant.now().plusSeconds(600), Instant.now().plusSeconds(1200));

    when(parkingRepository.findById(1L)).thenReturn(Optional.of(parking));
    when(bookingRepository.countActiveBookings(1L)).thenReturn(1L);

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
  }

  @Test
  void createBooking_shouldThrow_whenNoAvailableSlot() {
    Parking parking = parking(1L, 1, 1);
    CreateBookingRequest request =
        new CreateBookingRequest(
            1L, "user-2", Instant.now().plusSeconds(600), Instant.now().plusSeconds(1200));

    when(parkingRepository.findById(1L)).thenReturn(Optional.of(parking));
    when(bookingRepository.countActiveBookings(1L)).thenReturn(1L);

    assertThatThrownBy(() -> bookingService.createBooking(request))
        .isInstanceOf(NoAvailableSlotException.class);

    verify(bookingRepository, never()).save(any());
  }

  @Test
  void createBooking_shouldThrow_whenEndBeforeStart() {
    Instant start = Instant.now().plusSeconds(1200);
    Instant end = Instant.now().plusSeconds(600);

    CreateBookingRequest request = new CreateBookingRequest(1L, "user-3", start, end);

    assertThatThrownBy(() -> bookingService.createBooking(request))
        .isInstanceOf(IllegalArgumentException.class);
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
