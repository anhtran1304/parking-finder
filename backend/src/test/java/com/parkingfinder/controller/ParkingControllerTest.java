package com.parkingfinder.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.parkingfinder.dto.ParkingDetailResponse;
import com.parkingfinder.service.ParkingService;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ParkingController.class)
class ParkingControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockBean private ParkingService parkingService;

  @Test
  void getParkingById_shouldReturnParkingDetail() throws Exception {
    when(parkingService.getById(1L))
        .thenReturn(new ParkingDetailResponse(1L, "A", 100, 25, 10.7, 106.7, Instant.now()));

    mockMvc
        .perform(get("/parkings/1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(1))
        .andExpect(jsonPath("$.name").value("A"))
        .andExpect(jsonPath("$.availableSlots").value(25));
  }
}
