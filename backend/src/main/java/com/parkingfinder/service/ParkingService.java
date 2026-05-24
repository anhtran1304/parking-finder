package com.parkingfinder.service;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.parkingfinder.domain.Parking;
import com.parkingfinder.dto.CreateParkingRequest;
import com.parkingfinder.dto.NearbyParkingResponse;
import com.parkingfinder.dto.ParkingDetailResponse;
import com.parkingfinder.exception.ResourceNotFoundException;
import com.parkingfinder.repository.NearbyParkingProjection;
import com.parkingfinder.repository.ParkingRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ParkingService {

  private final ParkingRepository parkingRepository;
  private final ParkingCacheService parkingCacheService;
  private final SlotCounterService slotCounterService;

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

  @Transactional
  public ParkingDetailResponse createParking(CreateParkingRequest request) {
    GeometryFactory geometryFactory = new GeometryFactory();
    Point location = geometryFactory.createPoint(new Coordinate(request.lng(), request.lat()));
    location.setSRID(4326);

    Parking parking = new Parking();
    parking.setName(request.name());
    parking.setAddress(request.address());
    parking.setLocation(location);
    parking.setTotalSlots(request.totalSlots());
    parking.setAvailableSlots(request.totalSlots());
    parking.setUpdatedAt(Instant.now());

    Parking saved = parkingRepository.save(parking);

    slotCounterService.syncSlot(saved.getId(), saved.getAvailableSlots());
    parkingCacheService.evictParkingDetail(saved.getId());
 
    return toDetailResponse(saved);
  }

  private NearbyParkingResponse toNearbyResponse(NearbyParkingProjection projection) {
    return new NearbyParkingResponse(
        projection.getId(),
        projection.getName(),
        Objects.requireNonNullElse(projection.getTotalSlots(), 0),
        Objects.requireNonNullElse(projection.getAvailableSlots(), 0),
        projection.getLat(),
        projection.getLng(),
        Math.round(projection.getDistanceMeters()),
        projection.getUpdatedAt(),
        projection.getHourlyRate(),
        projection.getParkingType(),
        projection.getHasEvCharging(),
        projection.getHasSecurity(),
        projection.getHasRoof(),
        projection.getRating(),
        projection.getReviewCount());
  }

  ParkingDetailResponse toDetailResponse(Parking parking) {
    return new ParkingDetailResponse(
        parking.getId(),
        parking.getName(),
        parking.getAddress(),
        parking.getTotalSlots(),
        parking.getAvailableSlots(),
        parking.getLocation().getY(),
        parking.getLocation().getX(),
        parking.getUpdatedAt());
  }
}
