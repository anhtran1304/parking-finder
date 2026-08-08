package com.parkingfinder.websocket;

import com.parkingfinder.event.ParkingAvailabilityChanged;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ParkingAvailabilityStompPublisher {

  private final SimpMessagingTemplate messagingTemplate;

  public void publish(ParkingAvailabilityChanged event) {
    messagingTemplate.convertAndSend(
        RealtimeWebSocketDestinations.PARKING_AVAILABILITY_TOPIC, event);
  }
}
