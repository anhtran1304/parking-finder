package com.parkingfinder.controller;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.parkingfinder.domain.BookingStatus;
import com.parkingfinder.dto.BookingResponse;
import com.parkingfinder.dto.CreateBookingRequest;
import com.parkingfinder.exception.BookingReservationUnavailableException;
import com.parkingfinder.service.BookingService;
import com.parkingfinder.service.JwtService;

@WebMvcTest(BookingController.class)
@WithMockUser(username = "user-1@example.com", roles = "USER")
class BookingControllerTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  @MockBean private BookingService bookingService;
    @MockBean private JwtService jwtService;

  @Test
  void createBooking_shouldReturnCreatedBooking() throws Exception {
    CreateBookingRequest request =
                new CreateBookingRequest(1L, Instant.now().plusSeconds(300), Instant.now().plusSeconds(900));

    BookingResponse response =
        new BookingResponse(
            7L,
            1L,
            "user-1",
            request.startTime(),
            request.endTime(),
            BookingStatus.ACTIVE,
            Instant.now());

    when(bookingService.createBooking(any(CreateBookingRequest.class), anyString())).thenReturn(response);

    mockMvc
        .perform(
            post("/bookings")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(7))
        .andExpect(jsonPath("$.status").value("ACTIVE"));
  }

  @Test
  void createBooking_shouldReturnServiceUnavailable_whenReservationSystemUnavailable()
      throws Exception {
    CreateBookingRequest request =
        new CreateBookingRequest(1L, Instant.now().plusSeconds(300), Instant.now().plusSeconds(900));

    when(bookingService.createBooking(any(CreateBookingRequest.class), anyString()))
        .thenThrow(
            new BookingReservationUnavailableException(
                "Booking reservation system unavailable", new RuntimeException("redis down")));

    mockMvc
        .perform(
            post("/bookings")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isServiceUnavailable())
        .andExpect(jsonPath("$.code").value("BOOKING_RESERVATION_UNAVAILABLE"))
        .andExpect(jsonPath("$.message").value("Booking reservation system unavailable"));
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

    @Test
    void getCurrentUserBookings_shouldReturnPagedBookings_whenNoStatusFilter() throws Exception {
        BookingResponse booking =
                new BookingResponse(
                        13L,
                        4L,
                        "user-1@example.com",
                        Instant.now().minusSeconds(300),
                        Instant.now().plusSeconds(3300),
                        BookingStatus.ACTIVE,
                        Instant.now().minusSeconds(600));
        Page<BookingResponse> page = new PageImpl<>(List.of(booking), PageRequest.of(0, 10), 1);

        when(bookingService.getUserBookings(anyString(), any(), any())).thenReturn(page);

        mockMvc
                .perform(get("/bookings").param("page", "0").param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(13))
                .andExpect(jsonPath("$.content[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.number").value(0))
                .andExpect(jsonPath("$.size").value(10));
    }

    @Test
    void getCurrentUserBookings_shouldReturnFilteredPage_whenStatusProvided() throws Exception {
        BookingResponse booking =
                new BookingResponse(
                        14L,
                        5L,
                        "user-1@example.com",
                        Instant.now().minusSeconds(7200),
                        Instant.now().minusSeconds(3600),
                        BookingStatus.COMPLETED,
                        Instant.now().minusSeconds(8000));
        Page<BookingResponse> page = new PageImpl<>(List.of(booking), PageRequest.of(0, 5), 1);

        when(bookingService.getUserBookings(anyString(), any(), any())).thenReturn(page);

        mockMvc
                .perform(get("/bookings").param("status", "COMPLETED").param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(14))
                .andExpect(jsonPath("$.content[0].status").value("COMPLETED"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.size").value(5));
    }

    @Test
    @WithAnonymousUser
    void getCurrentUserBookings_shouldReturnUnauthorized_whenUnauthenticated() throws Exception {
        mockMvc
                .perform(get("/bookings"))
                .andExpect(status().isUnauthorized());
    }
}
