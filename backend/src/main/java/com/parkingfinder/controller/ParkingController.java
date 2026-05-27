package com.parkingfinder.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.parkingfinder.dto.ApiErrorResponse;
import com.parkingfinder.dto.CreateParkingRequest;
import com.parkingfinder.dto.NearbyParkingResponse;
import com.parkingfinder.dto.ParkingDetailResponse;
import com.parkingfinder.service.ParkingService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/parkings")
@RequiredArgsConstructor
@Validated
@Tag(name = "Parking", description = "Parking discovery and parking detail APIs")
public class ParkingController {

  private final ParkingService parkingService;

  @GetMapping("/nearby")
    @Operation(
      summary = "Find nearby parkings",
      description = "Search parking spots by location and radius")
    @ApiResponses({
      @ApiResponse(responseCode = "200", description = "Nearby parkings returned"),
      @ApiResponse(
        responseCode = "400",
        description = "Invalid latitude, longitude, or radius",
        content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
  public List<NearbyParkingResponse> getNearby(
      @Parameter(description = "Latitude", required = true)
      @RequestParam @NotNull Double lat,
      @Parameter(description = "Longitude", required = true)
      @RequestParam @NotNull Double lng,
      @Parameter(description = "Search radius in meters")
      @RequestParam(defaultValue = "1000") @DecimalMin("1") Double radius) {
    return parkingService.getNearby(lat, lng, radius);
  }

  @GetMapping("/{id}")
    @Operation(
      summary = "Get parking detail",
      description = "Get detail information for a parking by id")
    @ApiResponses({
      @ApiResponse(
        responseCode = "200",
        description = "Parking found",
        content = @Content(schema = @Schema(implementation = ParkingDetailResponse.class))),
      @ApiResponse(
        responseCode = "404",
        description = "Parking not found",
        content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
  public ParkingDetailResponse getById(@PathVariable Long id) {
    return parkingService.getById(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
    @Operation(
      summary = "Create parking",
      description = "Create a new parking location")
    @ApiResponses({
      @ApiResponse(
        responseCode = "201",
        description = "Parking created",
        content = @Content(schema = @Schema(implementation = ParkingDetailResponse.class))),
      @ApiResponse(
        responseCode = "400",
        description = "Validation error",
        content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
  public ParkingDetailResponse createParking(@Valid @RequestBody CreateParkingRequest request) {
    return parkingService.createParking(request);
  }
}
