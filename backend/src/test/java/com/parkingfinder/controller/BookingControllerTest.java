package com.parkingfinder.controller;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.parkingfinder.domain.BookingStatus;
import com.parkingfinder.dto.BookingDetailResponse;
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
  void getBooking_shouldReturnEnrichedDetail_whenOwnerRequests() throws Exception {
    BookingDetailResponse response =
        new BookingDetailResponse(
            9L,
            2L,
            "Central Parking",
            "45 Le Loi St",
            BigDecimal.valueOf(4),
            "user-1@example.com",
            Instant.now().plusSeconds(300),
            Instant.now().plusSeconds(1200),
            BookingStatus.ACTIVE,
            Instant.now());

    when(bookingService.getByIdForUser(eq(9L), anyString())).thenReturn(response);

    mockMvc
        .perform(get("/bookings/9"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(9))
        .andExpect(jsonPath("$.parkingName").value("Central Parking"))
        .andExpect(jsonPath("$.parkingAddress").value("45 Le Loi St"));
  }

  @Test
  void getBooking_shouldReturnNotFound_whenNotOwnedByCaller() throws Exception {
    when(bookingService.getByIdForUser(eq(51L), anyString()))
        .thenThrow(new com.parkingfinder.exception.ResourceNotFoundException("Booking not found: 51"));

    mockMvc
        .perform(get("/bookings/51"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.message").value("Booking not found: 51"));
  }

  @Test
  @WithAnonymousUser
  void getBooking_shouldReturnUnauthorized_whenUnauthenticated() throws Exception {
    mockMvc
        .perform(get("/bookings/9"))
        .andExpect(status().isUnauthorized());
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

    @Test
    void getActiveBooking_shouldReturnBooking_whenExists() throws Exception {
        BookingDetailResponse activeBooking =
            new BookingDetailResponse(
                        31L,
                        8L,
                "Opera House Parking",
                "7 Lam Son Square",
                BigDecimal.valueOf(5),
                        "user-1@example.com",
                        Instant.now().minusSeconds(300),
                        Instant.now().plusSeconds(1800),
                        BookingStatus.ACTIVE,
                        Instant.now().minusSeconds(600));

        when(bookingService.getActiveUserBooking(anyString())).thenReturn(activeBooking);

        mockMvc
                .perform(get("/bookings/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(31))
                .andExpect(jsonPath("$.parkingName").value("Opera House Parking"))
                .andExpect(jsonPath("$.parkingAddress").value("7 Lam Son Square"))
                .andExpect(jsonPath("$.hourlyRate").value(5))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void getActiveBooking_shouldReturnEmptyBody_whenNotFound() throws Exception {
        when(bookingService.getActiveUserBooking(anyString())).thenReturn(null);

        mockMvc
                .perform(get("/bookings/active"))
                .andExpect(status().isOk())
                .andExpect(content().string(""));
    }

    @Test
    @WithAnonymousUser
    void getActiveBooking_shouldReturnUnauthorized_whenUnauthenticated() throws Exception {
        mockMvc
                .perform(get("/bookings/active"))
                .andExpect(status().isUnauthorized());
    }

  @Test
  void cancelBooking_shouldReturnOk_whenOwnerCancels() throws Exception {
    BookingResponse response =
        new BookingResponse(
            10L,
            1L,
            "user-1@example.com",
            Instant.now().minusSeconds(300),
            Instant.now().plusSeconds(3300),
            BookingStatus.CANCELLED,
            Instant.now().minusSeconds(600));

    when(bookingService.cancelBookingForUser(eq(10L), anyString())).thenReturn(response);

    mockMvc
        .perform(patch("/bookings/10/cancel").with(csrf()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(10))
        .andExpect(jsonPath("$.status").value("CANCELLED"));
  }

  @Test
  void cancelBooking_shouldReturnNotFound_whenNotOwnedByCaller() throws Exception {
    when(bookingService.cancelBookingForUser(eq(10L), anyString()))
        .thenThrow(new com.parkingfinder.exception.ResourceNotFoundException("Booking not found: 10"));

    mockMvc
        .perform(patch("/bookings/10/cancel").with(csrf()))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.message").value("Booking not found: 10"));
  }

  @Test
  @WithAnonymousUser
  void cancelBooking_shouldReturnUnauthorized_whenUnauthenticated() throws Exception {
    mockMvc
        .perform(patch("/bookings/10/cancel").with(csrf()))
        .andExpect(status().isUnauthorized());
  }
}
