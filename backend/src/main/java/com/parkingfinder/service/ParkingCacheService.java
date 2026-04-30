package com.parkingfinder.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.parkingfinder.dto.NearbyParkingResponse;
import com.parkingfinder.dto.ParkingDetailResponse;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ParkingCacheService {

  private static final String DETAIL_PREFIX = "parking:detail:";
  private static final String NEARBY_PREFIX = "parking:nearby:";

  private final StringRedisTemplate redisTemplate;
  private final ObjectMapper objectMapper;

  @Value("${app.cache.parking-detail-ttl-seconds:300}")
  private long detailTtlSeconds;

  @Value("${app.cache.nearby-ttl-seconds:300}")
  private long nearbyTtlSeconds;

  public Optional<ParkingDetailResponse> getParkingDetail(Long parkingId) {
    String raw = redisTemplate.opsForValue().get(DETAIL_PREFIX + parkingId);
    if (raw == null) {
      return Optional.empty();
    }

    try {
      return Optional.of(objectMapper.readValue(raw, ParkingDetailResponse.class));
    } catch (JsonProcessingException e) {
      log.warn("Failed to deserialize parking detail cache for parkingId={}", parkingId, e);
      return Optional.empty();
    }
  }

  public void saveParkingDetail(ParkingDetailResponse response) {
    try {
      redisTemplate
          .opsForValue()
          .set(
              DETAIL_PREFIX + response.id(),
              objectMapper.writeValueAsString(response),
              Duration.ofSeconds(detailTtlSeconds));
    } catch (JsonProcessingException e) {
      log.warn("Failed to serialize parking detail cache for parkingId={}", response.id(), e);
    }
  }

  public Optional<List<NearbyParkingResponse>> getNearby(double lat, double lng, double radiusMeters) {
    String raw = redisTemplate.opsForValue().get(nearbyKey(lat, lng, radiusMeters));
    if (raw == null) {
      return Optional.empty();
    }

    try {
      List<NearbyParkingResponse> responses =
          objectMapper.readValue(raw, new TypeReference<List<NearbyParkingResponse>>() {});
      return Optional.of(responses);
    } catch (JsonProcessingException e) {
      log.warn("Failed to deserialize nearby cache", e);
      return Optional.empty();
    }
  }

  public void saveNearby(double lat, double lng, double radiusMeters, List<NearbyParkingResponse> responses) {
    try {
      redisTemplate
          .opsForValue()
          .set(
              nearbyKey(lat, lng, radiusMeters),
              objectMapper.writeValueAsString(responses),
              Duration.ofSeconds(nearbyTtlSeconds));
    } catch (JsonProcessingException e) {
      log.warn("Failed to serialize nearby cache", e);
    }
  }

  public void evictParkingDetail(Long parkingId) {
    redisTemplate.delete(DETAIL_PREFIX + parkingId);
  }

  private String nearbyKey(double lat, double lng, double radiusMeters) {
    return NEARBY_PREFIX
        + String.format("%.4f", lat)
        + ":"
        + String.format("%.4f", lng)
        + ":"
        + Math.round(radiusMeters);
  }
}
