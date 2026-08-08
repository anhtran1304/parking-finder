package com.parkingfinder.redis;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.parkingfinder.event.ParkingAvailabilityChangeReason;
import com.parkingfinder.event.ParkingAvailabilityChanged;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;

@ExtendWith(MockitoExtension.class)
class ParkingAvailabilityRedisPublisherTest {

  @Mock private StringRedisTemplate redisTemplate;
  @Mock private ParkingAvailabilityRedisCodec codec;

  private ParkingAvailabilityRedisPublisher publisher;
  private ParkingAvailabilityChanged event;

  @BeforeEach
  void setUp() {
    publisher = new ParkingAvailabilityRedisPublisher(redisTemplate, codec);
    event = event();
  }

  @Test
  void onAvailabilityChanged_shouldPublishOneJsonMessageToExactChannel() throws Exception {
    when(codec.serialize(event)).thenReturn("{\"parkingId\":42}");

    publisher.onAvailabilityChanged(event);

    verify(redisTemplate)
        .convertAndSend(ParkingAvailabilityRedisContract.CHANNEL, "{\"parkingId\":42}");
    verifyNoMoreInteractions(redisTemplate);
  }

  @Test
  void onAvailabilityChanged_shouldContainSerializationFailure() throws Exception {
    when(codec.serialize(event)).thenThrow(new JsonProcessingException("invalid event") {});

    assertThatCode(() -> publisher.onAvailabilityChanged(event)).doesNotThrowAnyException();

    verifyNoInteractions(redisTemplate);
  }

  @Test
  void onAvailabilityChanged_shouldContainRedisFailure() throws Exception {
    when(codec.serialize(event)).thenReturn("{\"parkingId\":42}");
    when(redisTemplate.convertAndSend(ParkingAvailabilityRedisContract.CHANNEL, "{\"parkingId\":42}"))
        .thenThrow(new RuntimeException("redis unavailable"));

    assertThatCode(() -> publisher.onAvailabilityChanged(event)).doesNotThrowAnyException();

    verify(redisTemplate)
        .convertAndSend(ParkingAvailabilityRedisContract.CHANNEL, "{\"parkingId\":42}");
    verifyNoMoreInteractions(redisTemplate);
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
