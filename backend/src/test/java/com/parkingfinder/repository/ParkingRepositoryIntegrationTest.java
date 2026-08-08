package com.parkingfinder.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.parkingfinder.domain.Parking;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@EnabledIfEnvironmentVariable(named = "RUN_POSTGIS_IT", matches = "true")
class ParkingRepositoryIntegrationTest {

  @Autowired private ParkingRepository parkingRepository;
  private Long parkingId;

  @BeforeEach
  void setUp() {
    GeometryFactory factory = new GeometryFactory();

    Parking parking = new Parking();
    parking.setName("Center Parking");
    Point location = factory.createPoint(new Coordinate(106.7000, 10.7000));
    location.setSRID(4326);
    parking.setLocation(location);
    parking.setTotalSlots(100);
    parking.setAvailableSlots(80);
    parking.setCreatedAt(Instant.now());
    parking.setUpdatedAt(Instant.now());
    parkingId = parkingRepository.save(parking).getId();
  }

  @Test
  void findNearby_shouldReturnNearestParking() {
    List<NearbyParkingProjection> results = parkingRepository.findNearby(10.7001, 106.7001, 500);
    assertThat(results).isNotEmpty();
    assertThat(results.get(0).getName()).isEqualTo("Center Parking");
  }

  @Test
  void decrementAvailableSlot_shouldUpdateValueAndTimestampWithDatabaseGuard() {
    Parking parking = parkingRepository.findById(parkingId).orElseThrow();
    Instant updatedAt = Instant.now().plusSeconds(10);

    int updated = parkingRepository.decrementAvailableSlot(parking.getId(), updatedAt);
    Parking refreshed = parkingRepository.findById(parking.getId()).orElseThrow();

    assertThat(updated).isEqualTo(1);
    assertThat(refreshed.getAvailableSlots()).isEqualTo(79);
    assertThat(refreshed.getUpdatedAt()).isEqualTo(updatedAt);
  }

  @Test
  void incrementAvailableSlot_shouldNeverExceedTotalSlots() {
    Parking parking = parkingRepository.findById(parkingId).orElseThrow();
    parking.setAvailableSlots(parking.getTotalSlots());
    parkingRepository.saveAndFlush(parking);

    parkingRepository.incrementAvailableSlot(parking.getId(), Instant.now());
    Parking refreshed = parkingRepository.findById(parking.getId()).orElseThrow();

    assertThat(refreshed.getAvailableSlots()).isEqualTo(refreshed.getTotalSlots());
  }

  @Test
  void incrementAvailableSlotIfBelowCapacity_shouldRejectFullParkingWithoutChangingTimestamp() {
    Parking parking = parkingRepository.findById(parkingId).orElseThrow();
    Instant unchangedUpdatedAt = Instant.parse("2026-08-08T10:30:00Z");
    parking.setAvailableSlots(parking.getTotalSlots());
    parking.setUpdatedAt(unchangedUpdatedAt);
    parkingRepository.saveAndFlush(parking);

    int updated =
        parkingRepository.incrementAvailableSlotIfBelowCapacity(
            parking.getId(), unchangedUpdatedAt.plusSeconds(10));
    Parking refreshed = parkingRepository.findById(parking.getId()).orElseThrow();

    assertThat(updated).isZero();
    assertThat(refreshed.getAvailableSlots()).isEqualTo(refreshed.getTotalSlots());
    assertThat(refreshed.getUpdatedAt()).isEqualTo(unchangedUpdatedAt);
  }

  @Test
  void incrementAvailableSlotIfBelowCapacity_shouldIncrementAvailableSlots() {
    Parking parking = parkingRepository.findById(parkingId).orElseThrow();
    Instant updatedAt = Instant.now().plusSeconds(10);

    int updated =
        parkingRepository.incrementAvailableSlotIfBelowCapacity(parking.getId(), updatedAt);
    Parking refreshed = parkingRepository.findById(parking.getId()).orElseThrow();

    assertThat(updated).isEqualTo(1);
    assertThat(refreshed.getAvailableSlots()).isEqualTo(81);
    assertThat(refreshed.getUpdatedAt()).isEqualTo(updatedAt);
  }

  @Test
  void decrementAvailableSlot_shouldNeverGoBelowZero() {
    Parking parking = parkingRepository.findById(parkingId).orElseThrow();
    parking.setAvailableSlots(0);
    parkingRepository.saveAndFlush(parking);

    int updated = parkingRepository.decrementAvailableSlot(parking.getId(), Instant.now());
    Parking refreshed = parkingRepository.findById(parking.getId()).orElseThrow();

    assertThat(updated).isZero();
    assertThat(refreshed.getAvailableSlots()).isZero();
  }
}
