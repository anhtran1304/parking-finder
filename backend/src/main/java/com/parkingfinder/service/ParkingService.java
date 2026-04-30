package com.parkingfinder.service;

import com.parkingfinder.domain.Parking;
import com.parkingfinder.dto.NearbyParkingResponse;
import com.parkingfinder.dto.ParkingDetailResponse;
import com.parkingfinder.exception.ResourceNotFoundException;
import com.parkingfinder.repository.NearbyParkingProjection;
import com.parkingfinder.repository.ParkingRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ParkingService {

  private final ParkingRepository parkingRepository;
  private final ParkingCacheService parkingCacheService;

  @Transactional(readOnly = true)
  public List<NearbyParkingResponse> getNearby(double lat, double lng, double radiusMeters) {
    return parkingCacheService
        .getNearby(lat, lng, radiusMeters)
        .orElseGet(
            () -> {
              List<NearbyParkingResponse> responses =
                  parkingRepository.findNearby(lat, lng, radiusMeters).stream()
                      .map(this::toNearbyResponse)
                      .toList();
              parkingCacheService.saveNearby(lat, lng, radiusMeters, responses);
              return responses;
            });
  }

  @Transactional(readOnly = true)
  public ParkingDetailResponse getById(Long id) {
    return parkingCacheService
        .getParkingDetail(id)
        .orElseGet(
            () -> {
              Parking parking =
                  parkingRepository
                      .findById(id)
                      .orElseThrow(() -> new ResourceNotFoundException("Parking not found: " + id));
              ParkingDetailResponse response = toDetailResponse(parking);
              parkingCacheService.saveParkingDetail(response);
              return response;
            });
  }

  private NearbyParkingResponse toNearbyResponse(NearbyParkingProjection projection) {
    return new NearbyParkingResponse(
        projection.getId(),
        projection.getName(),
        projection.getAvailableSlots(),
        projection.getLat(),
        projection.getLng(),
        Math.round(projection.getDistanceMeters()),
        projection.getUpdatedAt());
  }

  ParkingDetailResponse toDetailResponse(Parking parking) {
    return new ParkingDetailResponse(
        parking.getId(),
        parking.getName(),
        parking.getTotalSlots(),
        parking.getAvailableSlots(),
        parking.getLocation().getY(),
        parking.getLocation().getX(),
        parking.getUpdatedAt());
  }
}
