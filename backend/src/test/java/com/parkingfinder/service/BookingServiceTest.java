package com.parkingfinder.service;

import java.time.Instant;
import java.util.List;
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
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

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
        new CreateBookingRequest(1L, Instant.now().plusSeconds(300), Instant.now().plusSeconds(3900));

    when(parkingRepository.findById(1L)).thenReturn(Optional.of(parking));
    when(bookingRepository.countActiveBookings(1L)).thenReturn(1L);
    when(slotCounterService.tryReserveSlot(1L, 1)).thenReturn(true);

    Booking saved = new Booking();
    saved.setId(100L);
    saved.setParkingId(1L);
    saved.setUserId("user-1");
    saved.setStartTime(request.startTime());
    saved.setEndTime(request.endTime());
    saved.setStatus(BookingStatus.PENDING);
    saved.setCreatedAt(Instant.now());

    when(bookingRepository.save(any(Booking.class))).thenReturn(saved);

    BookingResponse response = bookingService.createBooking(request, "user-1");

    assertThat(response.id()).isEqualTo(100L);
    assertThat(response.status()).isEqualTo(BookingStatus.PENDING);
    verify(slotCounterService).tryReserveSlot(1L, 1);
  }

  @Test
  void createBooking_shouldThrow_whenNoAvailableSlotInDatabase() {
    Parking parking = parking(1L, 1, 1);
    CreateBookingRequest request =
        new CreateBookingRequest(1L, Instant.now().plusSeconds(300), Instant.now().plusSeconds(3900));

    when(parkingRepository.findById(1L)).thenReturn(Optional.of(parking));
    when(bookingRepository.countActiveBookings(1L)).thenReturn(1L);

    assertThatThrownBy(() -> bookingService.createBooking(request, "user-2"))
        .isInstanceOf(NoAvailableSlotException.class);

    verify(slotCounterService, never()).tryReserveSlot(any(), anyInt());
    verify(bookingRepository, never()).save(any());
  }

  @Test
  void createBooking_shouldThrow_whenRedisReserveReturnsFalse() {
    Parking parking = parking(1L, 2, 2);
    CreateBookingRequest request =
        new CreateBookingRequest(1L, Instant.now().plusSeconds(300), Instant.now().plusSeconds(3900));

    when(parkingRepository.findById(1L)).thenReturn(Optional.of(parking));
    when(bookingRepository.countActiveBookings(1L)).thenReturn(0L);
    when(slotCounterService.tryReserveSlot(1L, 2)).thenReturn(false);

    assertThatThrownBy(() -> bookingService.createBooking(request, "user-4"))
        .isInstanceOf(NoAvailableSlotException.class);

    verify(bookingRepository, never()).save(any());
  }

  @Test
  void createBooking_shouldRollbackRedisReserve_whenDatabaseSaveFails() {
    Parking parking = parking(1L, 2, 2);
    CreateBookingRequest request =
        new CreateBookingRequest(1L, Instant.now().plusSeconds(300), Instant.now().plusSeconds(3900));
    RuntimeException dbFailure = new RuntimeException("db unavailable");

    when(parkingRepository.findById(1L)).thenReturn(Optional.of(parking));
    when(bookingRepository.countActiveBookings(1L)).thenReturn(0L);
    when(slotCounterService.tryReserveSlot(1L, 2)).thenReturn(true);
    when(bookingRepository.save(any(Booking.class))).thenThrow(dbFailure);

    assertThatThrownBy(() -> bookingService.createBooking(request, "user-5")).isSameAs(dbFailure);

    verify(slotCounterService).rollbackReserve(1L);
  }

  @Test
  void createBooking_shouldThrowServiceUnavailable_whenRedisReserveFails() {
    Parking parking = parking(1L, 2, 2);
    CreateBookingRequest request =
        new CreateBookingRequest(1L, Instant.now().plusSeconds(300), Instant.now().plusSeconds(3900));

    when(parkingRepository.findById(1L)).thenReturn(Optional.of(parking));
    when(bookingRepository.countActiveBookings(1L)).thenReturn(0L);
    when(slotCounterService.tryReserveSlot(1L, 2)).thenThrow(new RuntimeException("redis down"));

    assertThatThrownBy(() -> bookingService.createBooking(request, "user-6"))
        .isInstanceOf(BookingReservationUnavailableException.class)
        .hasMessage("Booking reservation system unavailable");

    verify(bookingRepository, never()).save(any());
  }

  @Test
  void createBooking_shouldNotCallRedis_whenParkingMissing() {
    CreateBookingRequest request =
        new CreateBookingRequest(404L, Instant.now().plusSeconds(300), Instant.now().plusSeconds(3900));

    when(parkingRepository.findById(404L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> bookingService.createBooking(request, "user-7"))
        .isInstanceOf(ResourceNotFoundException.class);

    verifyNoInteractions(slotCounterService);
    verify(bookingRepository, never()).save(any());
  }

  @Test
  void createBooking_shouldThrow_whenEndBeforeStart() {
    Instant start = Instant.now().plusSeconds(1200);
    Instant end = Instant.now().plusSeconds(600);

    CreateBookingRequest request = new CreateBookingRequest(1L, start, end);

    assertThatThrownBy(() -> bookingService.createBooking(request, "user-3"))
        .isInstanceOf(IllegalArgumentException.class);

    verifyNoInteractions(parkingRepository, bookingRepository, slotCounterService);
  }

  @Test
  void getUserBookings_shouldReturnPage_whenStatusFilterMissing() {
    Pageable pageable = PageRequest.of(0, 10);
    Booking booking = new Booking();
    booking.setId(21L);
    booking.setParkingId(2L);
    booking.setUserId("user-1@example.com");
    booking.setStartTime(Instant.now().minusSeconds(600));
    booking.setEndTime(Instant.now().plusSeconds(1800));
    booking.setStatus(BookingStatus.ACTIVE);
    booking.setCreatedAt(Instant.now().minusSeconds(900));

    Page<Booking> bookingPage = new PageImpl<>(List.of(booking), pageable, 1);
    when(bookingRepository.findByUserId("user-1@example.com", pageable)).thenReturn(bookingPage);

    Page<BookingResponse> responsePage =
        bookingService.getUserBookings("user-1@example.com", null, pageable);

    assertThat(responsePage.getTotalElements()).isEqualTo(1);
    assertThat(responsePage.getContent()).hasSize(1);
    assertThat(responsePage.getContent().get(0).id()).isEqualTo(21L);
    assertThat(responsePage.getContent().get(0).status()).isEqualTo(BookingStatus.ACTIVE);
    verify(bookingRepository).findByUserId("user-1@example.com", pageable);
    verify(bookingRepository, never())
        .findByUserIdAndStatus("user-1@example.com", BookingStatus.ACTIVE, pageable);
  }

  @Test
  void getUserBookings_shouldReturnFilteredPage_whenStatusFilterProvided() {
    Pageable pageable = PageRequest.of(1, 5);
    Booking booking = new Booking();
    booking.setId(22L);
    booking.setParkingId(3L);
    booking.setUserId("user-2@example.com");
    booking.setStartTime(Instant.now().minusSeconds(3600));
    booking.setEndTime(Instant.now().minusSeconds(1200));
    booking.setStatus(BookingStatus.COMPLETED);
    booking.setCreatedAt(Instant.now().minusSeconds(4000));

    Page<Booking> bookingPage = new PageImpl<>(List.of(booking), pageable, 6);
    when(bookingRepository.findByUserIdAndStatus(
            "user-2@example.com", BookingStatus.COMPLETED, pageable))
        .thenReturn(bookingPage);

    Page<BookingResponse> responsePage =
        bookingService.getUserBookings("user-2@example.com", BookingStatus.COMPLETED, pageable);

    assertThat(responsePage.getTotalElements()).isEqualTo(6);
    assertThat(responsePage.getNumber()).isEqualTo(1);
    assertThat(responsePage.getSize()).isEqualTo(5);
    assertThat(responsePage.getContent().get(0).status()).isEqualTo(BookingStatus.COMPLETED);
    verify(bookingRepository)
        .findByUserIdAndStatus("user-2@example.com", BookingStatus.COMPLETED, pageable);
    verify(bookingRepository, never()).findByUserId("user-2@example.com", pageable);
  }

  @Test
  void getActiveUserBooking_shouldReturnBooking_whenActiveExists() {
    Booking booking = new Booking();
    booking.setId(31L);
    booking.setParkingId(8L);
    booking.setUserId("user-1@example.com");
    booking.setStartTime(Instant.now().minusSeconds(300));
    booking.setEndTime(Instant.now().plusSeconds(1800));
    booking.setStatus(BookingStatus.ACTIVE);
    booking.setCreatedAt(Instant.now().minusSeconds(900));

    when(
            bookingRepository
                .findFirstByUserIdAndStatusAndStartTimeLessThanEqualAndEndTimeGreaterThanOrderByStartTimeDesc(
                    eq("user-1@example.com"),
                    eq(BookingStatus.ACTIVE),
                    any(Instant.class),
                    any(Instant.class)))
        .thenReturn(Optional.of(booking));

    BookingResponse response = bookingService.getActiveUserBooking("user-1@example.com");

    assertThat(response).isNotNull();
    assertThat(response.id()).isEqualTo(31L);
    assertThat(response.status()).isEqualTo(BookingStatus.ACTIVE);
  }

  @Test
  void getActiveUserBooking_shouldReturnNull_whenNoActiveBooking() {
    when(
            bookingRepository
                .findFirstByUserIdAndStatusAndStartTimeLessThanEqualAndEndTimeGreaterThanOrderByStartTimeDesc(
                    eq("user-2@example.com"),
                    eq(BookingStatus.ACTIVE),
                    any(Instant.class),
                    any(Instant.class)))
        .thenReturn(Optional.empty());

    BookingResponse response = bookingService.getActiveUserBooking("user-2@example.com");

    assertThat(response).isNull();
  }

  @Test
  void getActiveUserBooking_shouldThrow_whenUserIdBlank() {
    assertThatThrownBy(() -> bookingService.getActiveUserBooking("   "))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("userId is required");

    verifyNoInteractions(bookingRepository);
  }

  @Test
  void cancelBooking_shouldSucceed_whenActive() {
    Booking booking = new Booking();
    booking.setId(10L);
    booking.setParkingId(1L);
    booking.setUserId("user-1");
    booking.setStartTime(Instant.now().minusSeconds(300));
    booking.setEndTime(Instant.now().plusSeconds(3300));
    booking.setStatus(BookingStatus.ACTIVE);
    booking.setCreatedAt(Instant.now().minusSeconds(600));

    when(bookingRepository.findById(10L)).thenReturn(Optional.of(booking));
    when(bookingRepository.save(any(Booking.class))).thenReturn(booking);

    BookingResponse response = bookingService.cancelBooking(10L);

    assertThat(response.status()).isEqualTo(BookingStatus.CANCELLED);
    verify(slotCounterService).releaseSlot(1L);
  }

  @Test
  void cancelBooking_shouldSucceed_whenPending() {
    Booking booking = new Booking();
    booking.setId(11L);
    booking.setParkingId(2L);
    booking.setUserId("user-2");
    booking.setStartTime(Instant.now().plusSeconds(300));
    booking.setEndTime(Instant.now().plusSeconds(3900));
    booking.setStatus(BookingStatus.PENDING);
    booking.setCreatedAt(Instant.now());

    when(bookingRepository.findById(11L)).thenReturn(Optional.of(booking));
    when(bookingRepository.save(any(Booking.class))).thenReturn(booking);

    BookingResponse response = bookingService.cancelBooking(11L);

    assertThat(response.status()).isEqualTo(BookingStatus.CANCELLED);
    verify(slotCounterService).releaseSlot(2L);
  }

  @Test
  void cancelBooking_shouldThrow_whenAlreadyCompleted() {
    Booking booking = new Booking();
    booking.setId(12L);
    booking.setParkingId(1L);
    booking.setStatus(BookingStatus.COMPLETED);

    when(bookingRepository.findById(12L)).thenReturn(Optional.of(booking));

    assertThatThrownBy(() -> bookingService.cancelBooking(12L))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("COMPLETED");

    verify(bookingRepository, never()).save(any());
    verify(slotCounterService, never()).releaseSlot(any());
  }

  private Parking parking(Long id, int totalSlots, int availableSlots) {
    GeometryFactory factory = new GeometryFactory();
    Point point = factory.createPoint(new Coordinate(106.7, 10.7));
    point.setSRID(4326);

    Parking parking = new Parking();
    parking.setId(id);
    parking.setName("Parking " + id);
    parking.setAddress("123 Test St");
    parking.setLocation(point);
    parking.setTotalSlots(totalSlots);
    parking.setAvailableSlots(availableSlots);
    parking.setUpdatedAt(Instant.now());
    return parking;
  }

  @Test
  void getByIdForUser_shouldReturnEnrichedDetail_whenOwnerRequests() {
    Booking booking = new Booking();
    booking.setId(50L);
    booking.setParkingId(3L);
    booking.setUserId("owner@example.com");
    booking.setStartTime(Instant.now().plusSeconds(300));
    booking.setEndTime(Instant.now().plusSeconds(3900));
    booking.setStatus(BookingStatus.PENDING);
    booking.setCreatedAt(Instant.now());

    Parking parking = parking(3L, 5, 4);

    when(bookingRepository.findById(50L)).thenReturn(Optional.of(booking));
    when(parkingRepository.findById(3L)).thenReturn(Optional.of(parking));

    BookingDetailResponse response = bookingService.getByIdForUser(50L, "owner@example.com");

    assertThat(response.id()).isEqualTo(50L);
    assertThat(response.parkingName()).isEqualTo("Parking 3");
    assertThat(response.parkingAddress()).isEqualTo("123 Test St");
    assertThat(response.status()).isEqualTo(BookingStatus.PENDING);
  }

  @Test
  void getByIdForUser_shouldThrow_whenBookingNotFound() {
    when(bookingRepository.findById(99L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> bookingService.getByIdForUser(99L, "user@example.com"))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessageContaining("99");
  }

  @Test
  void getByIdForUser_shouldThrow_whenCallerDoesNotOwnBooking() {
    Booking booking = new Booking();
    booking.setId(51L);
    booking.setParkingId(4L);
    booking.setUserId("owner@example.com");
    booking.setStartTime(Instant.now().plusSeconds(300));
    booking.setEndTime(Instant.now().plusSeconds(3900));
    booking.setStatus(BookingStatus.PENDING);
    booking.setCreatedAt(Instant.now());

    when(bookingRepository.findById(51L)).thenReturn(Optional.of(booking));

    assertThatThrownBy(() -> bookingService.getByIdForUser(51L, "attacker@example.com"))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessageContaining("51");

    verify(parkingRepository, never()).findById(any());
  }
}
