package com.parkingfinder.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.parkingfinder.dto.BookingResponse;
import com.parkingfinder.dto.CreateBookingRequest;
import com.parkingfinder.service.BookingService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class BookingController {

  private final BookingService bookingService;

  @PostMapping
  public BookingResponse createBooking(@Valid @RequestBody CreateBookingRequest request) {
    return bookingService.createBooking(request);
  }

  @GetMapping("/{id}")
  public BookingResponse getById(@PathVariable Long id) {
    return bookingService.getById(id);
  }

  @PatchMapping("/{id}/cancel")
  public BookingResponse cancelBooking(@PathVariable Long id) {
    return bookingService.cancelBooking(id);
  }
}
