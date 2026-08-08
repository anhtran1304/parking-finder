package com.parkingfinder.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.parkingfinder.domain.OccupancyAction;
import com.parkingfinder.domain.Parking;
import com.parkingfinder.dto.ParkingAvailabilitySnapshot;
import com.parkingfinder.event.ParkingAvailabilityChangeReason;
import com.parkingfinder.event.ParkingAvailabilityChanged;
import com.parkingfinder.exception.AvailabilityUnavailableException;
import com.parkingfinder.exception.BookingReservationUnavailableException;
import com.parkingfinder.exception.ResourceNotFoundException;
import com.parkingfinder.repository.ParkingRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@ExtendWith(MockitoExtension.class)
class ParkingAvailabilityServiceTest {

  @Mock private ParkingRepository parkingRepository;
  @Mock private SlotCounterService slotCounterService;
  @Mock private ParkingAvailabilitySnapshotCache snapshotCache;
  @Mock private ApplicationEventPublisher eventPublisher;

  private ParkingAvailabilityService service;

  @BeforeEach
  void setUp() {
    service =
        new ParkingAvailabilityService(
            parkingRepository, slotCounterService, snapshotCache, eventPublisher);
  }

  @AfterEach
  void clearTransactionSynchronization() {
    if (TransactionSynchronizationManager.isSynchronizationActive()) {
      TransactionSynchronizationManager.clearSynchronization();
    }
  }

  @Test
  void reserveSlot_shouldUpdateDatabaseAndPublishAbsoluteSnapshot() {
    Parking parking = parking(1L, 10, 4);
    when(slotCounterService.tryReserveSlot(1L, 5)).thenReturn(true);
    when(parkingRepository.decrementAvailableSlot(any(), any())).thenReturn(1);
    when(parkingRepository.findById(1L)).thenReturn(Optional.of(parking));

    assertThat(service.reserveSlot(1L, 5)).isTrue();

    verify(parkingRepository).decrementAvailableSlot(any(), any());
    ArgumentCaptor<ParkingAvailabilityChanged> eventCaptor =
        ArgumentCaptor.forClass(ParkingAvailabilityChanged.class);
    verify(eventPublisher).publishEvent(eventCaptor.capture());
    assertThat(eventCaptor.getValue().availableSlots()).isEqualTo(4);
    assertThat(eventCaptor.getValue().totalSlots()).isEqualTo(10);
    assertThat(eventCaptor.getValue().reason())
        .isEqualTo(ParkingAvailabilityChangeReason.BOOKING_CREATED);
  }

  @Test
  void reserveSlot_shouldCompensateRedis_whenDatabaseGuardRejectsReservation() {
    Parking parking = parking(1L, 10, 0);
    when(slotCounterService.tryReserveSlot(1L, 1)).thenReturn(true);
    when(parkingRepository.decrementAvailableSlot(any(), any())).thenReturn(0);
    when(parkingRepository.findById(1L)).thenReturn(Optional.of(parking));

    assertThat(service.reserveSlot(1L, 1)).isFalse();

    verify(slotCounterService).rollbackReserve(1L);
    verify(slotCounterService).syncSlot(1L, 0);
    verifyNoInteractions(eventPublisher);
  }

  @Test
  void reserveSlot_shouldCompensateRedis_whenOuterTransactionRollsBack() {
    Parking parking = parking(1L, 10, 4);
    when(slotCounterService.tryReserveSlot(1L, 5)).thenReturn(true);
    when(parkingRepository.decrementAvailableSlot(any(), any())).thenReturn(1);
    when(parkingRepository.findById(1L)).thenReturn(Optional.of(parking));
    TransactionSynchronizationManager.initSynchronization();

    assertThat(service.reserveSlot(1L, 5)).isTrue();
    verifyNoInteractions(eventPublisher);

    TransactionSynchronization synchronization =
        TransactionSynchronizationManager.getSynchronizations().get(0);
    synchronization.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);

    verify(slotCounterService).rollbackReserve(1L);
    verifyNoInteractions(eventPublisher);
  }

  @Test
  void reserveSlot_shouldPublishOnlyAfterTransactionCommit() {
    Parking parking = parking(1L, 10, 4);
    when(slotCounterService.tryReserveSlot(1L, 5)).thenReturn(true);
    when(parkingRepository.decrementAvailableSlot(any(), any())).thenReturn(1);
    when(parkingRepository.findById(1L)).thenReturn(Optional.of(parking));
    TransactionSynchronizationManager.initSynchronization();

    service.reserveSlot(1L, 5);
    verifyNoInteractions(eventPublisher);

    TransactionSynchronizationManager.getSynchronizations().get(0).afterCommit();

    verify(eventPublisher).publishEvent(any(ParkingAvailabilityChanged.class));
    verify(slotCounterService, never()).rollbackReserve(any());
  }

  @Test
  void reserveSlot_shouldFailClosed_whenRedisIsUnavailable() {
    when(slotCounterService.tryReserveSlot(1L, 5)).thenThrow(new RuntimeException("redis down"));

    assertThatThrownBy(() -> service.reserveSlot(1L, 5))
        .isInstanceOf(BookingReservationUnavailableException.class)
        .hasMessage("Booking reservation system unavailable");

    verifyNoInteractions(parkingRepository, eventPublisher);
  }

  @Test
  void releaseSlot_shouldUseCappedDatabaseUpdateAndPublishSnapshot() {
    Parking parking = parking(2L, 5, 5);
    when(parkingRepository.incrementAvailableSlot(any(), any())).thenReturn(1);
    when(parkingRepository.findById(2L)).thenReturn(Optional.of(parking));

    ParkingAvailabilitySnapshot snapshot =
        service.releaseSlot(2L, ParkingAvailabilityChangeReason.BOOKING_CANCELLED);

    assertThat(snapshot.availableSlots()).isEqualTo(5);
    verify(parkingRepository).incrementAvailableSlot(any(), any());
    ArgumentCaptor<ParkingAvailabilityChanged> eventCaptor =
        ArgumentCaptor.forClass(ParkingAvailabilityChanged.class);
    verify(eventPublisher).publishEvent(eventCaptor.capture());
    assertThat(eventCaptor.getValue().reason())
        .isEqualTo(ParkingAvailabilityChangeReason.BOOKING_CANCELLED);
  }

  @Test
  void getSnapshots_shouldAlwaysReadPostgresAndRefreshRedisProjection() {
    ParkingAvailabilitySnapshot snapshot =
        new ParkingAvailabilitySnapshot(3L, 7, 12, Instant.parse("2026-08-07T16:30:00Z"));
    when(parkingRepository.findAvailabilitySnapshots(any())).thenReturn(List.of(snapshot));

    Map<Long, ParkingAvailabilitySnapshot> result = service.getSnapshots(List.of(3L));

    assertThat(result).containsEntry(3L, snapshot);
    verify(snapshotCache).put(snapshot);
  }

  @Test
  void applyOccupancyEvent_enterShouldPublishAbsoluteEventOnlyAfterCommit() {
    Parking before = parking(11L, 10, 4);
    Parking after = parking(11L, 10, 3);
    when(parkingRepository.findById(11L))
        .thenReturn(Optional.of(before), Optional.of(after));
    when(slotCounterService.tryReserveSlot(11L, 4)).thenReturn(true);
    when(parkingRepository.decrementAvailableSlot(any(), any())).thenReturn(1);
    TransactionSynchronizationManager.initSynchronization();

    ParkingAvailabilitySnapshot snapshot =
        service.applyOccupancyEvent(11L, OccupancyAction.ENTER);

    assertThat(snapshot.availableSlots()).isEqualTo(3);
    verifyNoInteractions(eventPublisher);

    TransactionSynchronizationManager.getSynchronizations().get(0).afterCommit();

    ArgumentCaptor<ParkingAvailabilityChanged> eventCaptor =
        ArgumentCaptor.forClass(ParkingAvailabilityChanged.class);
    verify(eventPublisher).publishEvent(eventCaptor.capture());
    assertThat(eventCaptor.getValue().availableSlots()).isEqualTo(3);
    assertThat(eventCaptor.getValue().reason())
        .isEqualTo(ParkingAvailabilityChangeReason.OCCUPANCY_ENTER);
  }

  @Test
  void applyOccupancyEvent_enterShouldCompensateRedisWhenTransactionRollsBack() {
    Parking before = parking(12L, 10, 4);
    Parking after = parking(12L, 10, 3);
    when(parkingRepository.findById(12L))
        .thenReturn(Optional.of(before), Optional.of(after));
    when(slotCounterService.tryReserveSlot(12L, 4)).thenReturn(true);
    when(parkingRepository.decrementAvailableSlot(any(), any())).thenReturn(1);
    TransactionSynchronizationManager.initSynchronization();

    service.applyOccupancyEvent(12L, OccupancyAction.ENTER);
    TransactionSynchronizationManager.getSynchronizations()
        .get(0)
        .afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);

    verify(slotCounterService).rollbackReserve(12L);
    verifyNoInteractions(eventPublisher);
  }

  @Test
  void applyOccupancyEvent_enterShouldRejectEmptyParking() {
    when(parkingRepository.findById(13L)).thenReturn(Optional.of(parking(13L, 10, 0)));

    assertThatThrownBy(() -> service.applyOccupancyEvent(13L, OccupancyAction.ENTER))
        .isInstanceOf(IllegalStateException.class)
        .hasMessage("Parking has no available slots");

    verifyNoInteractions(slotCounterService, eventPublisher);
  }

  @Test
  void applyOccupancyEvent_enterShouldReconcileWhenDatabaseGuardRejects() {
    Parking parking = parking(14L, 10, 1);
    when(parkingRepository.findById(14L)).thenReturn(Optional.of(parking));
    when(slotCounterService.tryReserveSlot(14L, 1)).thenReturn(true);
    when(parkingRepository.decrementAvailableSlot(any(), any())).thenReturn(0);

    assertThatThrownBy(() -> service.applyOccupancyEvent(14L, OccupancyAction.ENTER))
        .isInstanceOf(IllegalStateException.class)
        .hasMessage("Parking has no available slots");

    verify(slotCounterService).rollbackReserve(14L);
    verify(slotCounterService).syncSlot(14L, 1);
    verifyNoInteractions(eventPublisher);
  }

  @Test
  void applyOccupancyEvent_enterShouldReturnUnavailableWhenRedisFails() {
    when(parkingRepository.findById(15L)).thenReturn(Optional.of(parking(15L, 10, 4)));
    when(slotCounterService.tryReserveSlot(15L, 4))
        .thenThrow(new RuntimeException("redis down"));

    assertThatThrownBy(() -> service.applyOccupancyEvent(15L, OccupancyAction.ENTER))
        .isInstanceOf(AvailabilityUnavailableException.class)
        .hasMessage("Parking availability system unavailable");

    verify(parkingRepository, never()).decrementAvailableSlot(any(), any());
    verifyNoInteractions(eventPublisher);
  }

  @Test
  void applyOccupancyEvent_exitShouldIncrementAndPublishOnlyAfterCommit() {
    Parking before = parking(21L, 10, 4);
    Parking after = parking(21L, 10, 5);
    when(parkingRepository.findById(21L))
        .thenReturn(Optional.of(before), Optional.of(after));
    when(parkingRepository.incrementAvailableSlotIfBelowCapacity(any(), any())).thenReturn(1);
    TransactionSynchronizationManager.initSynchronization();

    ParkingAvailabilitySnapshot snapshot =
        service.applyOccupancyEvent(21L, OccupancyAction.EXIT);

    assertThat(snapshot.availableSlots()).isEqualTo(5);
    verifyNoInteractions(eventPublisher);

    TransactionSynchronizationManager.getSynchronizations().get(0).afterCommit();

    ArgumentCaptor<ParkingAvailabilityChanged> eventCaptor =
        ArgumentCaptor.forClass(ParkingAvailabilityChanged.class);
    verify(eventPublisher).publishEvent(eventCaptor.capture());
    assertThat(eventCaptor.getValue().availableSlots()).isEqualTo(5);
    assertThat(eventCaptor.getValue().reason())
        .isEqualTo(ParkingAvailabilityChangeReason.OCCUPANCY_EXIT);
  }

  @Test
  void applyOccupancyEvent_exitShouldRejectFullParking() {
    when(parkingRepository.findById(22L)).thenReturn(Optional.of(parking(22L, 10, 10)));

    assertThatThrownBy(() -> service.applyOccupancyEvent(22L, OccupancyAction.EXIT))
        .isInstanceOf(IllegalStateException.class)
        .hasMessage("Parking is already at full availability");

    verify(parkingRepository, never()).incrementAvailableSlotIfBelowCapacity(any(), any());
    verifyNoInteractions(eventPublisher);
  }

  @Test
  void applyOccupancyEvent_exitShouldRejectWhenDatabaseGuardLosesRace() {
    Parking before = parking(23L, 10, 9);
    Parking concurrentlyFilled = parking(23L, 10, 10);
    when(parkingRepository.findById(23L))
        .thenReturn(Optional.of(before), Optional.of(concurrentlyFilled));
    when(parkingRepository.incrementAvailableSlotIfBelowCapacity(any(), any())).thenReturn(0);

    assertThatThrownBy(() -> service.applyOccupancyEvent(23L, OccupancyAction.EXIT))
        .isInstanceOf(IllegalStateException.class)
        .hasMessage("Parking is already at full availability");

    verifyNoInteractions(eventPublisher);
  }

  @Test
  void applyOccupancyEvent_shouldReturnNotFoundForMissingParking() {
    when(parkingRepository.findById(99L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.applyOccupancyEvent(99L, OccupancyAction.ENTER))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessage("Parking not found: 99");

    verifyNoInteractions(slotCounterService, eventPublisher);
  }

  private Parking parking(Long id, int totalSlots, int availableSlots) {
    Parking parking = new Parking();
    parking.setId(id);
    parking.setTotalSlots(totalSlots);
    parking.setAvailableSlots(availableSlots);
    parking.setUpdatedAt(Instant.parse("2026-08-07T16:30:00Z"));
    return parking;
  }
}
