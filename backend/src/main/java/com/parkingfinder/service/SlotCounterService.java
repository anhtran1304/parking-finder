package com.parkingfinder.service;

import java.util.List;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class SlotCounterService {

  private static final String KEY_PREFIX = "parking:";

  private final StringRedisTemplate redisTemplate;

  private final DefaultRedisScript<Long> reserveScript =
      new DefaultRedisScript<>(
          """
          local current = redis.call('GET', KEYS[1])
          if not current then
            redis.call('SET', KEYS[1], ARGV[1])
            current = ARGV[1]
          end
          if tonumber(current) <= 0 then
            return -1
          end
          return redis.call('DECR', KEYS[1])
          """,
          Long.class);

  public boolean tryReserveSlot(Long parkingId, int fallbackAvailableSlots) {
    String key = slotKey(parkingId);
    Long result =
        redisTemplate.execute(
            reserveScript, List.of(key), String.valueOf(Math.max(fallbackAvailableSlots, 0)));
    return result != null && result >= 0;
  }

  public void rollbackReserve(Long parkingId) {
    redisTemplate.opsForValue().increment(slotKey(parkingId));
  }

  public void syncSlot(Long parkingId, int availableSlots) {
    redisTemplate.opsForValue().set(slotKey(parkingId), String.valueOf(Math.max(availableSlots, 0)));
  }

  private String slotKey(Long parkingId) {
    return KEY_PREFIX + parkingId + ":slots";
  }
}
