package com.parkingfinder.redis;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.parkingfinder.event.ParkingAvailabilityChangeReason;
import com.parkingfinder.event.ParkingAvailabilityChanged;
import com.parkingfinder.websocket.ParkingAvailabilityStompPublisher;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.connection.DefaultMessage;
import org.springframework.data.redis.connection.Message;

@ExtendWith(MockitoExtension.class)
class ParkingAvailabilityRedisSubscriberTest {

  @Mock private ParkingAvailabilityRedisCodec codec;
  @Mock private ParkingAvailabilityStompPublisher stompPublisher;

  private ParkingAvailabilityRedisSubscriber subscriber;

  @BeforeEach
  void setUp() {
    subscriber = new ParkingAvailabilityRedisSubscriber(codec, stompPublisher);
  }

  @Test
  void onMessage_shouldBroadcastValidEventExactlyOnce() throws Exception {
    ParkingAvailabilityChanged event = event();
    when(codec.deserialize("{\"parkingId\":42}")).thenReturn(event);

    subscriber.onMessage(message("{\"parkingId\":42}"), null);

    verify(stompPublisher).publish(event);
  }

  @Test
  void onMessage_shouldIgnoreMalformedJson() throws Exception {
    when(codec.deserialize("not-json"))
        .thenThrow(new JsonProcessingException("invalid payload") {});

    assertThatCode(() -> subscriber.onMessage(message("not-json"), null))
        .doesNotThrowAnyException();

    verifyNoInteractions(stompPublisher);
  }

  @Test
  void onMessage_shouldContainStompFailure() throws Exception {
    ParkingAvailabilityChanged event = event();
    when(codec.deserialize("{\"parkingId\":42}")).thenReturn(event);
    doThrow(new RuntimeException("broker unavailable"))
        .when(stompPublisher)
        .publish(event);

    assertThatCode(() -> subscriber.onMessage(message("{\"parkingId\":42}"), null))
        .doesNotThrowAnyException();

    verify(stompPublisher).publish(event);
  }

  private Message message(String payload) {
    return new DefaultMessage(
        ParkingAvailabilityRedisContract.CHANNEL.getBytes(StandardCharsets.UTF_8),
        payload.getBytes(StandardCharsets.UTF_8));
  }

  private ParkingAvailabilityChanged event() {
    return new ParkingAvailabilityChanged(
        UUID.randomUUID(),
        42L,
        7,
        20,
        Instant.parse("2026-08-08T10:30:00Z"),
        ParkingAvailabilityChangeReason.BOOKING_CREATED);
  }
}
