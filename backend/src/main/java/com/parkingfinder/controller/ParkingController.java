package com.parkingfinder.controller;

import com.parkingfinder.dto.NearbyParkingResponse;
import com.parkingfinder.dto.ParkingDetailResponse;
import com.parkingfinder.service.ParkingService;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.parkingfinder.dto.CreateParkingRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;

@RestController
@RequestMapping("/parkings")
@RequiredArgsConstructor
@Validated
public class ParkingController {

  private final ParkingService parkingService;

  @GetMapping("/nearby")
  public List<NearbyParkingResponse> getNearby(
      @RequestParam @NotNull Double lat,
      @RequestParam @NotNull Double lng,
      @RequestParam(defaultValue = "1000") @DecimalMin("1") Double radius) {
    return parkingService.getNearby(lat, lng, radius);
  }

  @GetMapping("/{id}")
  public ParkingDetailResponse getById(@PathVariable Long id) {
    return parkingService.getById(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ParkingDetailResponse createParking(@Valid @RequestBody CreateParkingRequest request) {
    return parkingService.createParking(request);
  }
}
