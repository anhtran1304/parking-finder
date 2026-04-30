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
}
