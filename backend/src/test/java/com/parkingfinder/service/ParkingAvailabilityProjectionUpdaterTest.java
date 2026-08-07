package com.parkingfinder.service;

import static org.mockito.Mockito.verify;

import com.parkingfinder.dto.ParkingAvailabilitySnapshot;
import com.parkingfinder.event.ParkingAvailabilityChangeReason;
import com.parkingfinder.event.ParkingAvailabilityChanged;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ParkingAvailabilityProjectionUpdaterTest {

  @Mock private SlotCounterService slotCounterService;
  @Mock private ParkingAvailabilitySnapshotCache snapshotCache;
  @Mock private ParkingCacheService parkingCacheService;

  private ParkingAvailabilityProjectionUpdater updater;

  @BeforeEach
  void setUp() {
    updater =
        new ParkingAvailabilityProjectionUpdater(
            slotCounterService, snapshotCache, parkingCacheService);
  }

  @Test
  void onAvailabilityChanged_shouldRefreshCounterSnapshotAndDetailCache() {
    Instant updatedAt = Instant.parse("2026-08-07T16:30:00Z");
    ParkingAvailabilityChanged event =
        new ParkingAvailabilityChanged(
            UUID.randomUUID(),
            9L,
            6,
            20,
            updatedAt,
            ParkingAvailabilityChangeReason.BOOKING_CREATED);

    updater.onAvailabilityChanged(event);

    verify(slotCounterService).syncSlot(9L, 6);
    verify(snapshotCache).put(new ParkingAvailabilitySnapshot(9L, 6, 20, updatedAt));
    verify(parkingCacheService).evictParkingDetail(9L);
  }
}
