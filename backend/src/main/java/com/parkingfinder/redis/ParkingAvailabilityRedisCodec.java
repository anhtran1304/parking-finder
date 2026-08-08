package com.parkingfinder.redis;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.parkingfinder.event.ParkingAvailabilityChanged;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ParkingAvailabilityRedisCodec {

  private final ObjectMapper objectMapper;

  public String serialize(ParkingAvailabilityChanged event) throws JsonProcessingException {
    return objectMapper.writeValueAsString(event);
  }

  public ParkingAvailabilityChanged deserialize(String payload) throws JsonProcessingException {
    return objectMapper.readValue(payload, ParkingAvailabilityChanged.class);
  }
}
