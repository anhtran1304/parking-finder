package com.parkingfinder.controller;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.parkingfinder.config.SecurityConfig;
import com.parkingfinder.domain.OccupancyAction;
import com.parkingfinder.dto.ParkingAvailabilitySnapshot;
import com.parkingfinder.exception.AvailabilityUnavailableException;
import com.parkingfinder.exception.ResourceNotFoundException;
import com.parkingfinder.service.JwtService;
import com.parkingfinder.service.ParkingAvailabilityService;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AdminParkingController.class)
@Import(SecurityConfig.class)
class AdminParkingControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockBean private ParkingAvailabilityService parkingAvailabilityService;
  @MockBean private JwtService jwtService;

  @Test
  @WithMockUser(username = "admin@example.com", roles = "ADMIN")
  void applyOccupancyEvent_shouldReturnSnapshotForAdmin() throws Exception {
    Instant updatedAt = Instant.parse("2026-08-08T10:30:00Z");
    when(parkingAvailabilityService.applyOccupancyEvent(42L, OccupancyAction.ENTER))
        .thenReturn(new ParkingAvailabilitySnapshot(42L, 7, 20, updatedAt));

    mockMvc
        .perform(
            post("/admin/parkings/42/occupancy-events")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"ENTER\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.parkingId").value(42))
        .andExpect(jsonPath("$.availableSlots").value(7))
        .andExpect(jsonPath("$.totalSlots").value(20))
        .andExpect(jsonPath("$.updatedAt").value("2026-08-08T10:30:00Z"));

    verify(parkingAvailabilityService).applyOccupancyEvent(42L, OccupancyAction.ENTER);
  }

  @Test
  @WithMockUser(username = "user@example.com", roles = "USER")
  void applyOccupancyEvent_shouldReturnForbiddenForRegularUser() throws Exception {
    mockMvc
        .perform(
            post("/admin/parkings/42/occupancy-events")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"ENTER\"}"))
        .andExpect(status().isForbidden());

    verifyNoInteractions(parkingAvailabilityService);
  }

  @Test
  void applyOccupancyEvent_shouldReturnUnauthorizedWithoutAuthentication() throws Exception {
    mockMvc
        .perform(
            post("/admin/parkings/42/occupancy-events")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"ENTER\"}"))
        .andExpect(status().isUnauthorized());

    verifyNoInteractions(parkingAvailabilityService);
  }

  @Test
  @WithMockUser(username = "admin@example.com", roles = "ADMIN")
  void applyOccupancyEvent_shouldReturnBadRequestForMissingAction() throws Exception {
    mockMvc
        .perform(
            post("/admin/parkings/42/occupancy-events")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

    verifyNoInteractions(parkingAvailabilityService);
  }

  @Test
  @WithMockUser(username = "admin@example.com", roles = "ADMIN")
  void applyOccupancyEvent_shouldReturnBadRequestForUnknownAction() throws Exception {
    mockMvc
        .perform(
            post("/admin/parkings/42/occupancy-events")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"enter\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

    verifyNoInteractions(parkingAvailabilityService);
  }

  @Test
  @WithMockUser(username = "admin@example.com", roles = "ADMIN")
  void applyOccupancyEvent_shouldReturnBadRequestForAvailabilityBoundary() throws Exception {
    when(parkingAvailabilityService.applyOccupancyEvent(42L, OccupancyAction.EXIT))
        .thenThrow(new IllegalStateException("Parking is already at full availability"));

    mockMvc
        .perform(
            post("/admin/parkings/42/occupancy-events")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"EXIT\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("BAD_REQUEST"));
  }

  @Test
  @WithMockUser(username = "admin@example.com", roles = "ADMIN")
  void applyOccupancyEvent_shouldReturnNotFoundForMissingParking() throws Exception {
    when(parkingAvailabilityService.applyOccupancyEvent(404L, OccupancyAction.ENTER))
        .thenThrow(new ResourceNotFoundException("Parking not found: 404"));

    mockMvc
        .perform(
            post("/admin/parkings/404/occupancy-events")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"ENTER\"}"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("NOT_FOUND"));
  }

  @Test
  @WithMockUser(username = "admin@example.com", roles = "ADMIN")
  void applyOccupancyEvent_shouldReturnServiceUnavailableWhenRedisFails() throws Exception {
    when(parkingAvailabilityService.applyOccupancyEvent(42L, OccupancyAction.ENTER))
        .thenThrow(
            new AvailabilityUnavailableException(
                "Parking availability system unavailable", new RuntimeException("redis down")));

    mockMvc
        .perform(
            post("/admin/parkings/42/occupancy-events")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"ENTER\"}"))
        .andExpect(status().isServiceUnavailable())
        .andExpect(jsonPath("$.code").value("AVAILABILITY_UNAVAILABLE"));
  }
}
