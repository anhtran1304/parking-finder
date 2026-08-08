package com.parkingfinder.websocket;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;

class ReadOnlyStompChannelInterceptorTest {

  private final ReadOnlyStompChannelInterceptor interceptor =
      new ReadOnlyStompChannelInterceptor();

  @ParameterizedTest
  @MethodSource("allowedLifecycleCommands")
  void preSend_shouldAllowConnectionLifecycleCommands(StompCommand command) {
    Message<byte[]> message = message(command, null);

    assertThat(interceptor.preSend(message, null)).isSameAs(message);
  }

  @Test
  void preSend_shouldAllowExactAvailabilitySubscription() {
    Message<byte[]> message =
        message(
            StompCommand.SUBSCRIBE,
            RealtimeWebSocketDestinations.PARKING_AVAILABILITY_TOPIC);

    assertThat(interceptor.preSend(message, null)).isSameAs(message);
  }

  @ParameterizedTest
  @MethodSource("deniedMessages")
  void preSend_shouldDenyWritesAndUnsupportedSubscriptions(Message<byte[]> message) {
    assertThatThrownBy(() -> interceptor.preSend(message, null))
        .isInstanceOf(AccessDeniedException.class)
        .hasMessageContaining("read-only");
  }

  private static Stream<StompCommand> allowedLifecycleCommands() {
    return Stream.of(
        StompCommand.CONNECT,
        StompCommand.STOMP,
        StompCommand.DISCONNECT,
        StompCommand.UNSUBSCRIBE);
  }

  private static Stream<Message<byte[]>> deniedMessages() {
    return Stream.of(
        message(
            StompCommand.SEND,
            RealtimeWebSocketDestinations.PARKING_AVAILABILITY_TOPIC),
        message(StompCommand.SUBSCRIBE, "/topic/another-stream"),
        message(StompCommand.SUBSCRIBE, "/topic/**"),
        message(StompCommand.ACK, null));
  }

  private static Message<byte[]> message(StompCommand command, String destination) {
    StompHeaderAccessor accessor = StompHeaderAccessor.create(command);
    if (destination != null) {
      accessor.setDestination(destination);
    }
    return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
  }
}
