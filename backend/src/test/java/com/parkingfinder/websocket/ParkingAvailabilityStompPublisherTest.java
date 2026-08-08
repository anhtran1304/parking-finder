package com.parkingfinder.websocket;

import static org.mockito.Mockito.verify;

import com.parkingfinder.event.ParkingAvailabilityChangeReason;
import com.parkingfinder.event.ParkingAvailabilityChanged;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@ExtendWith(MockitoExtension.class)
class ParkingAvailabilityStompPublisherTest {

  @Mock private SimpMessagingTemplate messagingTemplate;

  @Test
  void publish_shouldSendEventToAvailabilityTopic() {
    ParkingAvailabilityChanged event =
        new ParkingAvailabilityChanged(
            UUID.randomUUID(),
            42L,
            7,
            20,
            Instant.parse("2026-08-08T10:30:00Z"),
            ParkingAvailabilityChangeReason.BOOKING_CREATED);
    ParkingAvailabilityStompPublisher publisher =
        new ParkingAvailabilityStompPublisher(messagingTemplate);

    publisher.publish(event);

    verify(messagingTemplate)
        .convertAndSend(RealtimeWebSocketDestinations.PARKING_AVAILABILITY_TOPIC, event);
  }
}
