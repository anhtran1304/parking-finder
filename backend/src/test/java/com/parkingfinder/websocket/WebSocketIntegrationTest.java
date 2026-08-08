package com.parkingfinder.websocket;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.parkingfinder.config.WebSocketConfig;
import com.parkingfinder.event.ParkingAvailabilityChangeReason;
import com.parkingfinder.event.ParkingAvailabilityChanged;
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
import org.springframework.boot.actuate.autoconfigure.security.servlet.ManagementWebSecurityAutoConfiguration;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;
import org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration;
import org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.broker.SimpleBrokerMessageHandler;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import org.springframework.web.socket.messaging.WebSocketStompClient;

@SpringBootTest(
    classes = WebSocketIntegrationTest.TestApplication.class,
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = "app.cors.allowed-origins=http://localhost:4200")
class WebSocketIntegrationTest {

  @LocalServerPort private int port;
  @Autowired private ObjectMapper objectMapper;
  @Autowired private ParkingAvailabilityStompPublisher publisher;
  @Autowired private SimpleBrokerMessageHandler simpleBrokerMessageHandler;
  @Autowired private SubscriptionProbe subscriptionProbe;

  private WebSocketStompClient stompClient;
  private StompSession session;

  @AfterEach
  void tearDown() {
    if (session != null && session.isConnected()) {
      session.disconnect();
    }
    if (stompClient != null) {
      stompClient.stop();
    }
  }

  @Test
  void allowedOrigin_shouldReceiveSerializedAvailabilityEvent() throws Exception {
    session = connect("http://localhost:4200");
    CompletableFuture<ParkingAvailabilityChanged> received = new CompletableFuture<>();
    session.subscribe(
        RealtimeWebSocketDestinations.PARKING_AVAILABILITY_TOPIC,
        new AvailabilityFrameHandler(received));
    subscriptionProbe.awaitSubscription();

    ParkingAvailabilityChanged event =
        new ParkingAvailabilityChanged(
            UUID.randomUUID(),
            42L,
            7,
            20,
            Instant.parse("2026-08-08T10:30:00Z"),
            ParkingAvailabilityChangeReason.BOOKING_CREATED);
    publisher.publish(event);

    assertThat(received.get(5, TimeUnit.SECONDS)).isEqualTo(event);
  }

  @Test
  void disallowedOrigin_shouldRejectHandshake() {
    assertThatThrownBy(() -> connect("https://untrusted.example"))
        .isInstanceOf(Exception.class);
  }

  @Test
  void simpleBroker_shouldUseTenSecondHeartbeats() {
    assertThat(simpleBrokerMessageHandler.getHeartbeatValue()).containsExactly(10_000, 10_000);
  }

  private StompSession connect(String origin) throws Exception {
    StandardWebSocketClient webSocketClient = new StandardWebSocketClient();
    stompClient = new WebSocketStompClient(webSocketClient);
    MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
    converter.setObjectMapper(objectMapper);
    stompClient.setMessageConverter(converter);
    WebSocketHttpHeaders headers = new WebSocketHttpHeaders();
    headers.setOrigin(origin);
    return stompClient
        .connectAsync(
            "ws://localhost:" + port + RealtimeWebSocketDestinations.ENDPOINT,
            headers,
            new StompSessionHandlerAdapter() {})
        .get(Duration.ofSeconds(5).toMillis(), TimeUnit.MILLISECONDS);
  }

  private static final class AvailabilityFrameHandler implements StompFrameHandler {

    private final CompletableFuture<ParkingAvailabilityChanged> received;

    private AvailabilityFrameHandler(
        CompletableFuture<ParkingAvailabilityChanged> received) {
      this.received = received;
    }

    @Override
    public Type getPayloadType(StompHeaders headers) {
      return ParkingAvailabilityChanged.class;
    }

    @Override
    public void handleFrame(StompHeaders headers, Object payload) {
      received.complete((ParkingAvailabilityChanged) payload);
    }
  }

  static final class SubscriptionProbe {

    private final LinkedBlockingQueue<SessionSubscribeEvent> events = new LinkedBlockingQueue<>();

    @EventListener
    public void onSubscription(SessionSubscribeEvent event) {
      events.offer(event);
    }

    void awaitSubscription() throws InterruptedException {
      SessionSubscribeEvent event = events.poll(5, TimeUnit.SECONDS);
      assertThat(event).isNotNull();
      StompCommand command = StompHeaderAccessor.wrap(event.getMessage()).getCommand();
      assertThat(command).isEqualTo(StompCommand.SUBSCRIBE);
    }
  }

  @SpringBootConfiguration
  @EnableAutoConfiguration(
      exclude = {
        DataSourceAutoConfiguration.class,
        HibernateJpaAutoConfiguration.class,
        FlywayAutoConfiguration.class,
        RedisAutoConfiguration.class,
        RedisRepositoriesAutoConfiguration.class,
        SecurityAutoConfiguration.class,
        SecurityFilterAutoConfiguration.class,
        UserDetailsServiceAutoConfiguration.class,
        ManagementWebSecurityAutoConfiguration.class
      })
  @Import({
    WebSocketConfig.class,
    ReadOnlyStompChannelInterceptor.class,
    ParkingAvailabilityStompPublisher.class
  })
  static class TestApplication {

    @Bean
    SubscriptionProbe subscriptionProbe() {
      return new SubscriptionProbe();
    }
  }
}
