package com.parkingfinder.websocket;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

@Component
public class ReadOnlyStompChannelInterceptor implements ChannelInterceptor {

  @Override
  public Message<?> preSend(Message<?> message, MessageChannel channel) {
    StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
    StompCommand command = accessor.getCommand();

    if (command == null
        || command == StompCommand.CONNECT
        || command == StompCommand.STOMP
        || command == StompCommand.DISCONNECT
        || command == StompCommand.UNSUBSCRIBE) {
      return message;
    }

    if (command == StompCommand.SUBSCRIBE
        && RealtimeWebSocketDestinations.PARKING_AVAILABILITY_TOPIC.equals(
            accessor.getDestination())) {
      return message;
    }

    throw new AccessDeniedException(
        "STOMP command is not allowed for the public read-only availability stream");
  }
}
