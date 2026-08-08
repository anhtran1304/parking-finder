package com.parkingfinder.redis;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.parkingfinder.event.ParkingAvailabilityChangeReason;
import com.parkingfinder.event.ParkingAvailabilityChanged;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

class ParkingAvailabilityRedisCodecTest {

  private final ParkingAvailabilityRedisCodec codec =
      new ParkingAvailabilityRedisCodec(applicationObjectMapper());

  @Test
  void shouldRoundTripAvailabilityContract() throws Exception {
    ParkingAvailabilityChanged event =
        new ParkingAvailabilityChanged(
            UUID.fromString("f86e94e6-94c7-43c2-b67e-e39b36ae614f"),
            42L,
            7,
            20,
            Instant.parse("2026-08-08T10:30:00Z"),
            ParkingAvailabilityChangeReason.BOOKING_CREATED);

    String payload = codec.serialize(event);

    assertThat(payload)
        .contains("\"eventId\":\"f86e94e6-94c7-43c2-b67e-e39b36ae614f\"")
        .contains("\"parkingId\":42")
        .contains("\"availableSlots\":7")
        .contains("\"totalSlots\":20")
        .contains("\"updatedAt\":\"2026-08-08T10:30:00Z\"")
        .contains("\"reason\":\"BOOKING_CREATED\"");
    assertThat(codec.deserialize(payload)).isEqualTo(event);
  }

  private static ObjectMapper applicationObjectMapper() {
    return Jackson2ObjectMapperBuilder.json()
        .modules(new JavaTimeModule())
        .featuresToDisable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
        .build();
  }
}
