package com.parkingfinder.config;

import com.parkingfinder.websocket.ReadOnlyStompChannelInterceptor;
import com.parkingfinder.websocket.RealtimeWebSocketDestinations;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

  static final long[] HEARTBEAT_INTERVALS = {10_000, 10_000};

  private final ReadOnlyStompChannelInterceptor readOnlyStompChannelInterceptor;

  @Value("${app.cors.allowed-origins}")
  private String[] allowedOrigins;

  @Override
  public void registerStompEndpoints(StompEndpointRegistry registry) {
    registry
        .addEndpoint(RealtimeWebSocketDestinations.ENDPOINT)
        .setAllowedOriginPatterns(allowedOrigins);
  }

  @Override
  public void configureMessageBroker(MessageBrokerRegistry registry) {
    registry.setApplicationDestinationPrefixes(RealtimeWebSocketDestinations.APPLICATION_PREFIX);
    registry
        .enableSimpleBroker(RealtimeWebSocketDestinations.BROKER_PREFIX)
        .setHeartbeatValue(HEARTBEAT_INTERVALS)
        .setTaskScheduler(webSocketHeartbeatScheduler());
  }

  @Override
  public void configureClientInboundChannel(ChannelRegistration registration) {
    registration.interceptors(readOnlyStompChannelInterceptor);
  }

  @Bean
  public TaskScheduler webSocketHeartbeatScheduler() {
    ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
    scheduler.setPoolSize(1);
    scheduler.setThreadNamePrefix("ws-heartbeat-");
    scheduler.setRemoveOnCancelPolicy(true);
    return scheduler;
  }
}
