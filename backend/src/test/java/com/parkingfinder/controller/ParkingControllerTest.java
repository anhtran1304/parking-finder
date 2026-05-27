package com.parkingfinder.controller;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.parkingfinder.dto.CreateParkingRequest;
import com.parkingfinder.dto.NearbyParkingResponse;
import com.parkingfinder.dto.ParkingDetailResponse;
import com.parkingfinder.service.JwtService;
import com.parkingfinder.service.ParkingService;

@WebMvcTest(ParkingController.class)
@AutoConfigureMockMvc(addFilters = false)
class ParkingControllerTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;

  @MockBean private ParkingService parkingService;
    @MockBean private JwtService jwtService;

  @Test
  void getParkingById_shouldReturnParkingDetail() throws Exception {
    when(parkingService.getById(1L))
        .thenReturn(new ParkingDetailResponse(1L, "A", "District 1", 100, 25, 10.7, 106.7, Instant.now()));

    mockMvc
        .perform(get("/parkings/1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(1))
        .andExpect(jsonPath("$.name").value("A"))
        .andExpect(jsonPath("$.address").value("District 1"))
        .andExpect(jsonPath("$.availableSlots").value(25));
  }

  @Test
  void getNearby_shouldReturnNearbyParkings() throws Exception {
    when(parkingService.getNearby(anyDouble(), anyDouble(), anyDouble()))
        .thenReturn(
            List.of(
                new NearbyParkingResponse(
                    1L,
                    "Parking A",
                    50,
                    20,
                    10.7769,
                    106.7010,
                    120L,
                    Instant.now(),
                    BigDecimal.valueOf(2.50),
                    "garage",
                    false,
                    true,
                    true,
                    BigDecimal.valueOf(4.5),
                    128)));

    mockMvc
        .perform(
            get("/parkings/nearby")
                .param("lat", "10.7769")
                .param("lng", "106.7010")
                .param("radius", "500"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value(1))
        .andExpect(jsonPath("$[0].name").value("Parking A"))
        .andExpect(jsonPath("$[0].totalSlots").value(50))
        .andExpect(jsonPath("$[0].availableSlots").value(20))
        .andExpect(jsonPath("$[0].hourlyRate").value(2.5))
        .andExpect(jsonPath("$[0].parkingType").value("garage"))
        .andExpect(jsonPath("$[0].hasSecurity").value(true));
  }

  @Test
  void getNearby_shouldReturnBadRequest_whenLatMissing() throws Exception {
    mockMvc
        .perform(get("/parkings/nearby").param("lng", "106.7010").param("radius", "500"))
        .andExpect(status().isBadRequest());

    verifyNoInteractions(parkingService);
  }

  @Test
  void getNearby_shouldReturnBadRequest_whenRadiusNonPositive() throws Exception {
    mockMvc
        .perform(
            get("/parkings/nearby")
                .param("lat", "10.7769")
                .param("lng", "106.7010")
                .param("radius", "0"))
        .andExpect(status().isBadRequest());

    verifyNoInteractions(parkingService);
  }

  @Test
  void createParking_shouldReturnCreatedParking() throws Exception {
    when(parkingService.createParking(any(CreateParkingRequest.class)))
        .thenReturn(
            new ParkingDetailResponse(
                10L, "Parking C", "District 2", 120, 120, 10.78, 106.72, Instant.now()));

    String requestBody =
        objectMapper.writeValueAsString(
            new CreateParkingRequest("Parking C", "District 2", 10.78, 106.72, 120));

    mockMvc
        .perform(
            post("/parkings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").value(10))
        .andExpect(jsonPath("$.name").value("Parking C"))
        .andExpect(jsonPath("$.address").value("District 2"))
        .andExpect(jsonPath("$.availableSlots").value(120));
  }

  @Test
  void createParking_shouldReturnBadRequest_whenPayloadInvalid() throws Exception {
    String requestBody =
        """
        {
          "name": "",
          "address": "District 2",
          "lat": 95.0,
          "lng": 106.72,
          "totalSlots": 0
        }
        """;

    mockMvc
        .perform(
            post("/parkings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

    verifyNoInteractions(parkingService);
  }
}
