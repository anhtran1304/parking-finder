package com.parkingfinder.service;

import java.time.Instant;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.parkingfinder.domain.Booking;
import com.parkingfinder.domain.BookingStatus;
import com.parkingfinder.repository.BookingRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingLifecycleScheduler {

  private final BookingRepository bookingRepository;
  private final SlotCounterService slotCounterService;

  @Scheduled(fixedDelay = 60_000)
  @Transactional
  public void activateBookings() {
    int count = bookingRepository.activatePendingBookings(Instant.now());
    if (count > 0) {
      log.info("Activated {} booking(s) from PENDING to ACTIVE", count);
    }
  }

  @Scheduled(fixedDelay = 60_000)
  @Transactional
  public void expireBookings() {
    List<Booking> expirable = bookingRepository.findExpirable(Instant.now());
    if (expirable.isEmpty()) return;

    List<Long> activeIds =
        expirable.stream()
            .filter(b -> b.getStatus() == BookingStatus.ACTIVE)
            .map(Booking::getId)
            .toList();

    List<Long> pendingIds =
        expirable.stream()
            .filter(b -> b.getStatus() == BookingStatus.PENDING)
            .map(Booking::getId)
            .toList();

    if (!activeIds.isEmpty()) {
      bookingRepository.bulkUpdateStatus(activeIds, BookingStatus.COMPLETED);
    }
    if (!pendingIds.isEmpty()) {
      bookingRepository.bulkUpdateStatus(pendingIds, BookingStatus.EXPIRED);
    }

    for (Booking booking : expirable) {
      slotCounterService.releaseSlot(booking.getParkingId());
    }

    log.info(
        "Expired {} booking(s): {} COMPLETED, {} EXPIRED",
        expirable.size(),
        activeIds.size(),
        pendingIds.size());
  }
}
