package com.parkingfinder.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.parkingfinder.dto.ApiErrorResponse;
import com.parkingfinder.dto.UserProfileResponse;
import com.parkingfinder.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "User", description = "User profile APIs")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

  private final UserService userService;

  @GetMapping("/me")
    @Operation(
      summary = "Get current user profile",
      description = "Return profile information of the authenticated user")
    @ApiResponses({
      @ApiResponse(
        responseCode = "200",
        description = "Profile returned",
        content = @Content(schema = @Schema(implementation = UserProfileResponse.class))),
      @ApiResponse(
        responseCode = "401",
        description = "Unauthorized",
        content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
      @ApiResponse(
        responseCode = "404",
        description = "User not found",
        content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
  public UserProfileResponse getCurrentUser(
      @AuthenticationPrincipal UserDetails userDetails) {
    if (userDetails == null) {
      throw new IllegalStateException("Authenticated user is required");
    }
    return userService.getCurrentUserProfile(userDetails.getUsername());
  }
}
