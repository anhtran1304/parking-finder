package com.parkingfinder.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.parkingfinder.dto.NearbyParkingResponse;
import com.parkingfinder.dto.ParkingAvailabilitySnapshot;
import com.parkingfinder.dto.ParkingDetailResponse;
import com.parkingfinder.repository.ParkingRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ParkingServiceTest {

  @Mock private ParkingRepository parkingRepository;
  @Mock private ParkingCacheService parkingCacheService;
  @Mock private SlotCounterService slotCounterService;
  @Mock private ParkingAvailabilityService parkingAvailabilityService;

  private ParkingService parkingService;

  @BeforeEach
  void setUp() {
    parkingService =
        new ParkingService(
            parkingRepository,
            parkingCacheService,
            slotCounterService,
            parkingAvailabilityService);
  }

  @Test
  void getById_shouldOverlayFreshAvailabilityOnCachedDetail() {
    Instant staleAt = Instant.parse("2026-08-07T16:00:00Z");
    Instant freshAt = Instant.parse("2026-08-07T16:30:00Z");
    ParkingDetailResponse cached =
        new ParkingDetailResponse(1L, "Central", "District 1", 20, 18, 10.77, 106.70, staleAt);
    when(parkingCacheService.getParkingDetail(1L)).thenReturn(Optional.of(cached));
    when(parkingAvailabilityService.getSnapshots(List.of(1L)))
        .thenReturn(Map.of(1L, new ParkingAvailabilitySnapshot(1L, 7, 20, freshAt)));

    ParkingDetailResponse result = parkingService.getById(1L);

    assertThat(result.availableSlots()).isEqualTo(7);
    assertThat(result.updatedAt()).isEqualTo(freshAt);
    assertThat(result.name()).isEqualTo("Central");
  }

  @Test
  void getNearby_shouldOverlayFreshAvailabilityOnCachedDiscoveryData() {
    Instant staleAt = Instant.parse("2026-08-07T16:00:00Z");
    Instant freshAt = Instant.parse("2026-08-07T16:30:00Z");
    NearbyParkingResponse cached =
        new NearbyParkingResponse(
            2L,
            "Market Parking",
            30,
            25,
            10.77,
            106.70,
            120,
            staleAt,
            BigDecimal.valueOf(2.5),
            "garage",
            false,
            true,
            true,
            BigDecimal.valueOf(4.5),
            20);
    when(parkingCacheService.getNearby(10.77, 106.70, 1000)).thenReturn(Optional.of(List.of(cached)));
    when(parkingAvailabilityService.getSnapshots(List.of(2L)))
        .thenReturn(Map.of(2L, new ParkingAvailabilitySnapshot(2L, 4, 30, freshAt)));

    List<NearbyParkingResponse> result = parkingService.getNearby(10.77, 106.70, 1000);

    assertThat(result).singleElement().satisfies(parking -> {
      assertThat(parking.availableSlots()).isEqualTo(4);
      assertThat(parking.updatedAt()).isEqualTo(freshAt);
      assertThat(parking.distanceMeters()).isEqualTo(120);
    });
  }
}
