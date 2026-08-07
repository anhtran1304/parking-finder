package com.parkingfinder.service;

import com.parkingfinder.dto.ParkingAvailabilitySnapshot;
import com.parkingfinder.event.ParkingAvailabilityChanged;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ParkingAvailabilityProjectionUpdater {

  private final SlotCounterService slotCounterService;
  private final ParkingAvailabilitySnapshotCache snapshotCache;
  private final ParkingCacheService parkingCacheService;

  @EventListener
  public void onAvailabilityChanged(ParkingAvailabilityChanged event) {
    ParkingAvailabilitySnapshot snapshot =
        new ParkingAvailabilitySnapshot(
            event.parkingId(),
            event.availableSlots(),
            event.totalSlots(),
            event.updatedAt());

    try {
      slotCounterService.syncSlot(event.parkingId(), event.availableSlots());
      snapshotCache.put(snapshot);
      parkingCacheService.evictParkingDetail(event.parkingId());
    } catch (RuntimeException exception) {
      log.error(
          "Failed to refresh Redis availability projection for parkingId={}",
          event.parkingId(),
          exception);
    }
  }
}
