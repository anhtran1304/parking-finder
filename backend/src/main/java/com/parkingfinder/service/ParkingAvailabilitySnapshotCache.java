package com.parkingfinder.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.parkingfinder.dto.ParkingAvailabilitySnapshot;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ParkingAvailabilitySnapshotCache {

  private static final String KEY_PREFIX = "parking:";
  private static final String KEY_SUFFIX = ":availability";

  private final StringRedisTemplate redisTemplate;
  private final ObjectMapper objectMapper;

  public void put(ParkingAvailabilitySnapshot snapshot) {
    try {
      redisTemplate
          .opsForValue()
          .set(key(snapshot.parkingId()), objectMapper.writeValueAsString(snapshot));
    } catch (JsonProcessingException exception) {
      log.warn(
          "Failed to serialize availability snapshot for parkingId={}",
          snapshot.parkingId(),
          exception);
    } catch (RuntimeException exception) {
      log.warn(
          "Failed to cache availability snapshot for parkingId={}",
          snapshot.parkingId(),
          exception);
    }
  }

  private String key(Long parkingId) {
    return KEY_PREFIX + parkingId + KEY_SUFFIX;
  }
}
