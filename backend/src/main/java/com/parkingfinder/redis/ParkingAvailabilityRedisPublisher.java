package com.parkingfinder.redis;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.parkingfinder.event.ParkingAvailabilityChanged;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ParkingAvailabilityRedisPublisher {

  private final StringRedisTemplate redisTemplate;
  private final ParkingAvailabilityRedisCodec codec;

  @EventListener
  public void onAvailabilityChanged(ParkingAvailabilityChanged event) {
    try {
      redisTemplate.convertAndSend(
          ParkingAvailabilityRedisContract.CHANNEL, codec.serialize(event));
    } catch (JsonProcessingException | RuntimeException exception) {
      log.error(
          "Failed to publish availability event to Redis for eventId={} parkingId={}",
          event.eventId(),
          event.parkingId(),
          exception);
    }
  }
}
