package com.parkingfinder.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import com.parkingfinder.redis.ParkingAvailabilityRedisContract;
import com.parkingfinder.redis.ParkingAvailabilityRedisSubscriber;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.test.util.ReflectionTestUtils;

class RedisConfigTest {

  private final RedisConfig config = new RedisConfig();

  @Test
  void redisMessageListenerContainer_shouldRegisterOneExactAvailabilityTopic() {
    RedisConnectionFactory connectionFactory = mock(RedisConnectionFactory.class);
    ParkingAvailabilityRedisSubscriber subscriber =
        mock(ParkingAvailabilityRedisSubscriber.class);
    ChannelTopic topic = config.parkingAvailabilityTopic();

    RedisMessageListenerContainer container =
        config.redisMessageListenerContainer(connectionFactory, subscriber, topic);

    assertThat(topic.getTopic()).isEqualTo(ParkingAvailabilityRedisContract.CHANNEL);
    assertThat(container.getConnectionFactory()).isSameAs(connectionFactory);
    Map<?, ?> listenerTopics =
        (Map<?, ?>) ReflectionTestUtils.getField(container, "listenerTopics");
    assertThat(listenerTopics).hasSize(1);
    assertThat(listenerTopics.containsKey(subscriber)).isTrue();
    assertThat(listenerTopics.get(subscriber)).isEqualTo(Set.of(topic));
  }
}
