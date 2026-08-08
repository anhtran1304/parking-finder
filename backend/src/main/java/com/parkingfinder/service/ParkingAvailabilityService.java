package com.parkingfinder.service;

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
import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
@RequiredArgsConstructor
@Slf4j
public class ParkingAvailabilityService {

  private final ParkingRepository parkingRepository;
  private final SlotCounterService slotCounterService;
  private final ParkingAvailabilitySnapshotCache snapshotCache;
  private final ApplicationEventPublisher eventPublisher;

  @Transactional(propagation = Propagation.MANDATORY)
  public boolean reserveSlot(Long parkingId, int fallbackAvailableSlots) {
    return tryDecreaseSlot(
            parkingId,
            fallbackAvailableSlots,
            ParkingAvailabilityChangeReason.BOOKING_CREATED,
            exception ->
                new BookingReservationUnavailableException(
                    "Booking reservation system unavailable", exception))
        != null;
  }

  @Transactional
  public ParkingAvailabilitySnapshot applyOccupancyEvent(
      Long parkingId, OccupancyAction action) {
    if (action == null) {
      throw new IllegalArgumentException("Occupancy action is required");
    }

    Parking parking = currentParking(parkingId);
    return switch (action) {
      case ENTER -> simulateEnter(parking);
      case EXIT -> simulateExit(parking);
    };
  }

  @Transactional(propagation = Propagation.MANDATORY)
  public ParkingAvailabilitySnapshot releaseSlot(
      Long parkingId, ParkingAvailabilityChangeReason reason) {
    Instant updatedAt = Instant.now();
    parkingRepository.incrementAvailableSlot(parkingId, updatedAt);
    Parking parking = currentParking(parkingId);
    ParkingAvailabilityChanged event = toEvent(parking, reason);
    publishAfterTransaction(event, ignored -> {});
    return toSnapshot(parking);
  }

  @Transactional(readOnly = true)
  public Map<Long, ParkingAvailabilitySnapshot> getSnapshots(Collection<Long> parkingIds) {
    Set<Long> requestedIds = parkingIds.stream().collect(Collectors.toSet());
    if (requestedIds.isEmpty()) {
      return Map.of();
    }

    Map<Long, ParkingAvailabilitySnapshot> snapshots =
        parkingRepository.findAvailabilitySnapshots(requestedIds).stream()
            .collect(Collectors.toMap(ParkingAvailabilitySnapshot::parkingId, snapshot -> snapshot));
    snapshots.values().forEach(snapshotCache::put);
    return snapshots;
  }

  private Parking currentParking(Long parkingId) {
    return parkingRepository
        .findById(parkingId)
        .orElseThrow(() -> new ResourceNotFoundException("Parking not found: " + parkingId));
  }

  private ParkingAvailabilitySnapshot simulateEnter(Parking parking) {
    if (parking.getAvailableSlots() <= 0) {
      throw new IllegalStateException("Parking has no available slots");
    }

    ParkingAvailabilitySnapshot snapshot =
        tryDecreaseSlot(
            parking.getId(),
            parking.getAvailableSlots(),
            ParkingAvailabilityChangeReason.OCCUPANCY_ENTER,
            exception ->
                new AvailabilityUnavailableException(
                    "Parking availability system unavailable", exception));
    if (snapshot == null) {
      throw new IllegalStateException("Parking has no available slots");
    }
    return snapshot;
  }

  private ParkingAvailabilitySnapshot simulateExit(Parking parking) {
    if (parking.getAvailableSlots() >= parking.getTotalSlots()) {
      throw new IllegalStateException("Parking is already at full availability");
    }

    Instant updatedAt = Instant.now();
    if (parkingRepository.incrementAvailableSlotIfBelowCapacity(parking.getId(), updatedAt) == 0) {
      currentParking(parking.getId());
      throw new IllegalStateException("Parking is already at full availability");
    }

    Parking updatedParking = currentParking(parking.getId());
    ParkingAvailabilityChanged event =
        toEvent(updatedParking, ParkingAvailabilityChangeReason.OCCUPANCY_EXIT);
    publishAfterTransaction(event, ignored -> {});
    return toSnapshot(updatedParking);
  }

  private ParkingAvailabilitySnapshot tryDecreaseSlot(
      Long parkingId,
      int fallbackAvailableSlots,
      ParkingAvailabilityChangeReason reason,
      Function<RuntimeException, RuntimeException> unavailableExceptionFactory) {
    boolean reserved;
    try {
      reserved = slotCounterService.tryReserveSlot(parkingId, fallbackAvailableSlots);
    } catch (RuntimeException exception) {
      throw unavailableExceptionFactory.apply(exception);
    }
    if (!reserved) {
      return null;
    }

    Instant updatedAt = Instant.now();
    try {
      if (parkingRepository.decrementAvailableSlot(parkingId, updatedAt) == 0) {
        rollbackReservation(parkingId);
        parkingRepository.findById(parkingId).ifPresent(this::syncCounter);
        return null;
      }

      Parking updatedParking = currentParking(parkingId);
      ParkingAvailabilityChanged event = toEvent(updatedParking, reason);
      publishAfterTransaction(
          event,
          status -> {
            if (status != TransactionSynchronization.STATUS_COMMITTED) {
              rollbackReservation(parkingId);
            }
          });
      return toSnapshot(updatedParking);
    } catch (RuntimeException exception) {
      rollbackReservation(parkingId);
      throw exception;
    }
  }

  private ParkingAvailabilityChanged toEvent(
      Parking parking, ParkingAvailabilityChangeReason reason) {
    return new ParkingAvailabilityChanged(
        UUID.randomUUID(),
        parking.getId(),
        parking.getAvailableSlots(),
        parking.getTotalSlots(),
        parking.getUpdatedAt(),
        reason);
  }

  private ParkingAvailabilitySnapshot toSnapshot(Parking parking) {
    return new ParkingAvailabilitySnapshot(
        parking.getId(),
        parking.getAvailableSlots(),
        parking.getTotalSlots(),
        parking.getUpdatedAt());
  }

  private void publishAfterTransaction(
      ParkingAvailabilityChanged event, Consumer<Integer> completionCallback) {
    if (!TransactionSynchronizationManager.isSynchronizationActive()) {
      publishSafely(event);
      return;
    }

    TransactionSynchronizationManager.registerSynchronization(
        new TransactionSynchronization() {
          @Override
          public void afterCommit() {
            publishSafely(event);
          }

          @Override
          public void afterCompletion(int status) {
            completionCallback.accept(status);
          }
        });
  }

  private void publishSafely(ParkingAvailabilityChanged event) {
    try {
      eventPublisher.publishEvent(event);
    } catch (RuntimeException exception) {
      log.error(
          "Failed to publish committed availability event for parkingId={}",
          event.parkingId(),
          exception);
    }
  }

  private void rollbackReservation(Long parkingId) {
    try {
      slotCounterService.rollbackReserve(parkingId);
    } catch (RuntimeException rollbackFailure) {
      log.error("Failed to roll back Redis reservation for parkingId={}", parkingId, rollbackFailure);
    }
  }

  private void syncCounter(Parking parking) {
    try {
      slotCounterService.syncSlot(parking.getId(), parking.getAvailableSlots());
    } catch (RuntimeException syncFailure) {
      log.error(
          "Failed to reconcile Redis counter for parkingId={}", parking.getId(), syncFailure);
    }
  }
}
