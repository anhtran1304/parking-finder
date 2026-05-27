package com.parkingfinder.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.parkingfinder.dto.UserProfileResponse;
import com.parkingfinder.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;

  @GetMapping("/me")
  public UserProfileResponse getCurrentUser(
      @AuthenticationPrincipal UserDetails userDetails) {
    if (userDetails == null) {
      throw new IllegalStateException("Authenticated user is required");
    }
    return userService.getCurrentUserProfile(userDetails.getUsername());
  }
}
