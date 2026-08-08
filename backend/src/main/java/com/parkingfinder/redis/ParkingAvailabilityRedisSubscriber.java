package com.parkingfinder.redis;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.parkingfinder.event.ParkingAvailabilityChanged;
import com.parkingfinder.websocket.ParkingAvailabilityStompPublisher;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ParkingAvailabilityRedisSubscriber implements MessageListener {

  private final ParkingAvailabilityRedisCodec codec;
  private final ParkingAvailabilityStompPublisher stompPublisher;

  @Override
  public void onMessage(Message message, byte[] pattern) {
    try {
      String payload = new String(message.getBody(), StandardCharsets.UTF_8);
      ParkingAvailabilityChanged event = codec.deserialize(payload);
      stompPublisher.publish(event);
    } catch (JsonProcessingException | RuntimeException exception) {
      log.error(
          "Failed to process Redis availability message from channel={}",
          new String(message.getChannel(), StandardCharsets.UTF_8),
          exception);
    }
  }
}
