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
    parking.setUpdatedAt(Instant.now());
    parkingRepository.save(parking);
  }

  @Test
  void findNearby_shouldReturnNearestParking() {
    List<NearbyParkingProjection> results = parkingRepository.findNearby(10.7001, 106.7001, 500);
    assertThat(results).isNotEmpty();
    assertThat(results.get(0).getName()).isEqualTo("Center Parking");
  }
}
