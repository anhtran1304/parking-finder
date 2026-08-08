package com.parkingfinder.controller;

import com.parkingfinder.dto.ApiErrorResponse;
import com.parkingfinder.dto.OccupancyEventRequest;
import com.parkingfinder.dto.ParkingAvailabilitySnapshot;
import com.parkingfinder.service.ParkingAvailabilityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/parkings")
@RequiredArgsConstructor
@Tag(name = "Admin parking", description = "Administrative parking simulation APIs")
@SecurityRequirement(name = "bearerAuth")
public class AdminParkingController {

  private final ParkingAvailabilityService parkingAvailabilityService;

  @PostMapping("/{parkingId}/occupancy-events")
  @Operation(
      summary = "Simulate parking occupancy",
      description = "Apply one vehicle ENTER or EXIT event to parking availability")
  @ApiResponses({
    @ApiResponse(
        responseCode = "200",
        description = "Occupancy event applied",
        content = @Content(schema = @Schema(implementation = ParkingAvailabilitySnapshot.class))),
    @ApiResponse(
        responseCode = "400",
        description = "Action is invalid or availability boundary would be exceeded",
        content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
    @ApiResponse(
        responseCode = "401",
        description = "Authentication required",
        content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
    @ApiResponse(
        responseCode = "403",
        description = "Admin role required",
        content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
    @ApiResponse(
        responseCode = "404",
        description = "Parking not found",
        content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
    @ApiResponse(
        responseCode = "503",
        description = "Availability system unavailable",
        content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
  })
  public ParkingAvailabilitySnapshot applyOccupancyEvent(
      @PathVariable Long parkingId, @Valid @RequestBody OccupancyEventRequest request) {
    return parkingAvailabilityService.applyOccupancyEvent(parkingId, request.action());
  }
}
