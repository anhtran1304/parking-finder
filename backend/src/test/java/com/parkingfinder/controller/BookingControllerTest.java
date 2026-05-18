package com.parkingfinder.controller;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.parkingfinder.domain.BookingStatus;
import com.parkingfinder.dto.BookingResponse;
import com.parkingfinder.dto.CreateBookingRequest;
import com.parkingfinder.service.BookingService;

@WebMvcTest(BookingController.class)
class BookingControllerTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  @MockBean private BookingService bookingService;

  @Test
  void createBooking_shouldReturnCreatedBooking() throws Exception {
    CreateBookingRequest request =
        new CreateBookingRequest(
            1L, "user-1", Instant.now().plusSeconds(300), Instant.now().plusSeconds(900));

    BookingResponse response =
        new BookingResponse(
            7L,
            1L,
            "user-1",
            request.startTime(),
            request.endTime(),
            BookingStatus.ACTIVE,
            Instant.now());

    when(bookingService.createBooking(any(CreateBookingRequest.class))).thenReturn(response);

    mockMvc
        .perform(
            post("/bookings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(7))
        .andExpect(jsonPath("$.status").value("ACTIVE"));
  }

  @Test
  void getBooking_shouldReturnBookingDetail() throws Exception {
    BookingResponse response =
        new BookingResponse(
            9L,
            2L,
            "user-9",
            Instant.now().plusSeconds(300),
            Instant.now().plusSeconds(1200),
            BookingStatus.ACTIVE,
            Instant.now());

    when(bookingService.getById(9L)).thenReturn(response);

    mockMvc
        .perform(get("/bookings/9"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(9))
        .andExpect(jsonPath("$.parkingId").value(2));
  }
}
