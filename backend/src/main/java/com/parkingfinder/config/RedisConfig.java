package com.parkingfinder.config;

import com.parkingfinder.redis.ParkingAvailabilityRedisContract;
import com.parkingfinder.redis.ParkingAvailabilityRedisSubscriber;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

@Configuration
public class RedisConfig {

  @Bean
  public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
    return new StringRedisTemplate(connectionFactory);
  }

  @Bean
  public ChannelTopic parkingAvailabilityTopic() {
    return new ChannelTopic(ParkingAvailabilityRedisContract.CHANNEL);
  }

  @Bean
  public RedisMessageListenerContainer redisMessageListenerContainer(
      RedisConnectionFactory connectionFactory,
      ParkingAvailabilityRedisSubscriber subscriber,
      ChannelTopic parkingAvailabilityTopic) {
    RedisMessageListenerContainer container = new RedisMessageListenerContainer();
    container.setConnectionFactory(connectionFactory);
    container.addMessageListener(subscriber, parkingAvailabilityTopic);
    return container;
  }
}
