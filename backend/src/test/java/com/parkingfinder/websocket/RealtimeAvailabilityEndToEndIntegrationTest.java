package com.parkingfinder.websocket;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.parkingfinder.ParkingFinderApplication;
import com.parkingfinder.domain.AppUser;
import com.parkingfinder.domain.OccupancyAction;
import com.parkingfinder.domain.Parking;
import com.parkingfinder.domain.Role;
import com.parkingfinder.dto.OccupancyEventRequest;
import com.parkingfinder.dto.ParkingAvailabilitySnapshot;
import com.parkingfinder.event.ParkingAvailabilityChangeReason;
import com.parkingfinder.event.ParkingAvailabilityChanged;
import com.parkingfinder.repository.AppUserRepository;
import com.parkingfinder.repository.ParkingRepository;
import com.parkingfinder.service.JwtService;
import java.lang.reflect.Type;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@SpringBootTest(
    classes = ParkingFinderApplication.class,
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(RealtimeAvailabilityEndToEndIntegrationTest.ProbeConfiguration.class)
@Testcontainers(disabledWithoutDocker = true)
class RealtimeAvailabilityEndToEndIntegrationTest {

  private static final DockerImageName POSTGIS_IMAGE =
      DockerImageName.parse("postgis/postgis:15-3.3")
          .asCompatibleSubstituteFor("postgres");

  @Container
  private static final PostgreSQLContainer<?> POSTGRES =
      new PostgreSQLContainer<>(POSTGIS_IMAGE)
          .withDatabaseName("parking_finder_e2e")
          .withUsername("parking")
          .withPassword("parking");

  @Container
  private static final GenericContainer<?> REDIS =
      new GenericContainer<>(DockerImageName.parse("redis:7.0-alpine"))
          .withExposedPorts(6379);

  @DynamicPropertySource
  static void configureContainers(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
    registry.add("spring.datasource.username", POSTGRES::getUsername);
    registry.add("spring.datasource.password", POSTGRES::getPassword);
    registry.add("spring.data.redis.host", REDIS::getHost);
    registry.add("spring.data.redis.port", () -> REDIS.getMappedPort(6379));
    registry.add("app.cors.allowed-origins", () -> "http://localhost:4200");
  }

  @LocalServerPort private int port;
  @Autowired private TestRestTemplate restTemplate;
  @Autowired private ObjectMapper objectMapper;
  @Autowired private ParkingRepository parkingRepository;
  @Autowired private AppUserRepository appUserRepository;
  @Autowired private JwtService jwtService;
  @Autowired private StringRedisTemplate redisTemplate;
  @Autowired private SubscriptionProbe subscriptionProbe;

  private WebSocketStompClient stompClient;
  private StompSession stompSession;

  @AfterEach
  void tearDown() {
    if (stompSession != null && stompSession.isConnected()) {
      stompSession.disconnect();
    }
    if (stompClient != null) {
      stompClient.stop();
    }
  }

  @Test
  void adminOccupancy_shouldReachStompThroughCommittedPostgresAndRedisState() throws Exception {
    Parking parking =
        parkingRepository.findAll().stream()
            .filter(candidate -> candidate.getAvailableSlots() > 0)
            .filter(candidate -> candidate.getAvailableSlots() < candidate.getTotalSlots())
            .findFirst()
            .orElseThrow();
    int initialAvailableSlots = parking.getAvailableSlots();

    AppUser admin = new AppUser();
    admin.setEmail("realtime-admin-" + UUID.randomUUID() + "@example.com");
    admin.setPasswordHash("not-used-by-jwt-test");
    admin.setFullName("Realtime Admin");
    admin.setRole(Role.ADMIN);
    admin.setCreatedAt(Instant.now());
    admin = appUserRepository.saveAndFlush(admin);
    String accessToken = jwtService.generateAccessToken(admin);

    AvailabilityFrameHandler frameHandler = connectAndSubscribe();

    ParkingAvailabilitySnapshot enterSnapshot =
        applyOccupancy(parking.getId(), OccupancyAction.ENTER, accessToken);
    ParkingAvailabilityChanged enterEvent = frameHandler.awaitEvent();

    assertAvailabilityChange(
        enterSnapshot,
        enterEvent,
        parking.getId(),
        initialAvailableSlots - 1,
        parking.getTotalSlots(),
        ParkingAvailabilityChangeReason.OCCUPANCY_ENTER);
    assertStoredProjection(enterSnapshot);

    ParkingAvailabilitySnapshot exitSnapshot =
        applyOccupancy(parking.getId(), OccupancyAction.EXIT, accessToken);
    ParkingAvailabilityChanged exitEvent = frameHandler.awaitEvent();

    assertAvailabilityChange(
        exitSnapshot,
        exitEvent,
        parking.getId(),
        initialAvailableSlots,
        parking.getTotalSlots(),
        ParkingAvailabilityChangeReason.OCCUPANCY_EXIT);
    assertStoredProjection(exitSnapshot);
  }

  private AvailabilityFrameHandler connectAndSubscribe() throws Exception {
    StandardWebSocketClient webSocketClient = new StandardWebSocketClient();
    stompClient = new WebSocketStompClient(webSocketClient);
    MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
    converter.setObjectMapper(objectMapper);
    stompClient.setMessageConverter(converter);

    WebSocketHttpHeaders handshakeHeaders = new WebSocketHttpHeaders();
    handshakeHeaders.setOrigin("http://localhost:4200");
    stompSession =
        stompClient
            .connectAsync(
                "ws://localhost:" + port + RealtimeWebSocketDestinations.ENDPOINT,
                handshakeHeaders,
                new StompSessionHandlerAdapter() {})
            .get(Duration.ofSeconds(5).toMillis(), TimeUnit.MILLISECONDS);

    AvailabilityFrameHandler frameHandler = new AvailabilityFrameHandler();
    stompSession.subscribe(
        RealtimeWebSocketDestinations.PARKING_AVAILABILITY_TOPIC, frameHandler);
    subscriptionProbe.awaitSubscription();
    return frameHandler;
  }

  private ParkingAvailabilitySnapshot applyOccupancy(
      Long parkingId, OccupancyAction action, String accessToken) {
    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(accessToken);
    headers.setContentType(MediaType.APPLICATION_JSON);
    HttpEntity<OccupancyEventRequest> request =
        new HttpEntity<>(new OccupancyEventRequest(action), headers);

    ResponseEntity<ParkingAvailabilitySnapshot> response =
        restTemplate.exchange(
            "/admin/parkings/{parkingId}/occupancy-events",
            HttpMethod.POST,
            request,
            ParkingAvailabilitySnapshot.class,
            parkingId);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    return response.getBody();
  }

  private void assertAvailabilityChange(
      ParkingAvailabilitySnapshot snapshot,
      ParkingAvailabilityChanged event,
      Long parkingId,
      int expectedAvailableSlots,
      int totalSlots,
      ParkingAvailabilityChangeReason reason) {
    assertThat(snapshot).isNotNull();
    assertThat(snapshot.parkingId()).isEqualTo(parkingId);
    assertThat(snapshot.availableSlots()).isEqualTo(expectedAvailableSlots);
    assertThat(snapshot.totalSlots()).isEqualTo(totalSlots);

    assertThat(event.eventId()).isNotNull();
    assertThat(event.parkingId()).isEqualTo(snapshot.parkingId());
    assertThat(event.availableSlots()).isEqualTo(snapshot.availableSlots());
    assertThat(event.totalSlots()).isEqualTo(snapshot.totalSlots());
    assertThat(event.updatedAt()).isEqualTo(snapshot.updatedAt());
    assertThat(event.reason()).isEqualTo(reason);
  }

  private void assertStoredProjection(ParkingAvailabilitySnapshot expected) throws Exception {
    Parking persisted = parkingRepository.findById(expected.parkingId()).orElseThrow();
    assertThat(persisted.getAvailableSlots()).isEqualTo(expected.availableSlots());
    assertThat(persisted.getTotalSlots()).isEqualTo(expected.totalSlots());
    assertThat(persisted.getUpdatedAt()).isEqualTo(expected.updatedAt());

    assertThat(redisTemplate.opsForValue().get("parking:" + expected.parkingId() + ":slots"))
        .isEqualTo(String.valueOf(expected.availableSlots()));
    String cachedSnapshot =
        redisTemplate.opsForValue().get("parking:" + expected.parkingId() + ":availability");
    assertThat(cachedSnapshot).isNotBlank();
    assertThat(objectMapper.readValue(cachedSnapshot, ParkingAvailabilitySnapshot.class))
        .isEqualTo(expected);
  }

  private static final class AvailabilityFrameHandler implements StompFrameHandler {

    private final LinkedBlockingQueue<ParkingAvailabilityChanged> events =
        new LinkedBlockingQueue<>();

    @Override
    public Type getPayloadType(StompHeaders headers) {
      return ParkingAvailabilityChanged.class;
    }

    @Override
    public void handleFrame(StompHeaders headers, Object payload) {
      events.offer((ParkingAvailabilityChanged) payload);
    }

    ParkingAvailabilityChanged awaitEvent() throws InterruptedException {
      ParkingAvailabilityChanged event = events.poll(10, TimeUnit.SECONDS);
      assertThat(event).as("availability event received over STOMP").isNotNull();
      return event;
    }
  }

  static final class SubscriptionProbe {

    private final CompletableFuture<SessionSubscribeEvent> subscribed = new CompletableFuture<>();

    @EventListener
    public void onSubscription(SessionSubscribeEvent event) {
      subscribed.complete(event);
    }

    void awaitSubscription() throws Exception {
      SessionSubscribeEvent event = subscribed.get(5, TimeUnit.SECONDS);
      StompHeaderAccessor headers = StompHeaderAccessor.wrap(event.getMessage());
      assertThat(headers.getCommand()).isEqualTo(StompCommand.SUBSCRIBE);
      assertThat(headers.getDestination())
          .isEqualTo(RealtimeWebSocketDestinations.PARKING_AVAILABILITY_TOPIC);
    }
  }

  @TestConfiguration(proxyBeanMethods = false)
  static class ProbeConfiguration {

    @Bean
    SubscriptionProbe subscriptionProbe() {
      return new SubscriptionProbe();
    }
  }
}
