package com.parkingfinder.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.parkingfinder.domain.BookingStatus;
import com.parkingfinder.dto.ApiErrorResponse;
import com.parkingfinder.dto.BookingDetailResponse;
import com.parkingfinder.dto.BookingResponse;
import com.parkingfinder.dto.CreateBookingRequest;
import com.parkingfinder.service.BookingService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
@Tag(name = "Booking", description = "Booking creation, history, detail, and cancellation APIs")
@SecurityRequirement(name = "bearerAuth")
public class BookingController {

  private final BookingService bookingService;

  @PostMapping
    @Operation(
      summary = "Create booking",
      description = "Create a booking for the authenticated user")
    @ApiResponses({
      @ApiResponse(
        responseCode = "200",
        description = "Booking created",
        content = @Content(schema = @Schema(implementation = BookingResponse.class))),
      @ApiResponse(
        responseCode = "400",
        description = "Validation or business rule error",
        content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
      @ApiResponse(
        responseCode = "401",
        description = "Unauthorized",
        content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
      @ApiResponse(
        responseCode = "409",
        description = "No available slot",
        content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
      @ApiResponse(
        responseCode = "503",
        description = "Reservation system unavailable",
        content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
  public BookingResponse createBooking(
      @Valid @RequestBody CreateBookingRequest request,
      @AuthenticationPrincipal UserDetails userDetails) {
    if (userDetails == null) {
      throw new IllegalStateException("Authenticated user is required");
    }
    return bookingService.createBooking(request, userDetails.getUsername());
  }

  @GetMapping
    @Operation(
      summary = "Get booking history",
      description = "Get paginated booking history for the authenticated user with optional status filter")
    @ApiResponses({
      @ApiResponse(responseCode = "200", description = "History retrieved"),
      @ApiResponse(
        responseCode = "400",
        description = "Invalid pagination, sort, or filter parameter",
        content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
      @ApiResponse(
        responseCode = "401",
        description = "Unauthorized",
        content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
  public Page<BookingResponse> getCurrentUserBookings(
      @AuthenticationPrincipal UserDetails userDetails,
      @Parameter(description = "Page index, zero-based")
      @RequestParam(defaultValue = "0") int page,
      @Parameter(description = "Page size")
      @RequestParam(defaultValue = "10") int size,
      @Parameter(description = "Sort field, default createdAt")
      @RequestParam(defaultValue = "createdAt") String sortBy,
      @Parameter(description = "Sort direction, ASC or DESC")
      @RequestParam(defaultValue = "DESC") Sort.Direction direction,
      @Parameter(description = "Optional status filter")
      @RequestParam(required = false) BookingStatus status) {
    if (userDetails == null) {
      throw new IllegalStateException("Authenticated user is required");
    }

    Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
    return bookingService.getUserBookings(userDetails.getUsername(), status, pageable);
  }

  @GetMapping("/active")
    @Operation(
      summary = "Get active booking",
      description = "Get the current ACTIVE booking for the authenticated user")
    @ApiResponses({
      @ApiResponse(
        responseCode = "200",
        description = "Active booking returned, or empty body when no active booking exists",
        content = @Content(schema = @Schema(implementation = BookingResponse.class))),
      @ApiResponse(
        responseCode = "401",
        description = "Unauthorized",
        content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
  public ResponseEntity<BookingResponse> getActiveBooking(
      @AuthenticationPrincipal UserDetails userDetails) {
    if (userDetails == null) {
      throw new IllegalStateException("Authenticated user is required");
    }

    BookingResponse activeBooking = bookingService.getActiveUserBooking(userDetails.getUsername());
    if (activeBooking == null) {
      return ResponseEntity.ok().build();
    }
    return ResponseEntity.ok(activeBooking);
  }

  @GetMapping("/{id}")
    @Operation(
      summary = "Get booking detail",
      description = "Get booking detail by ID, scoped to the authenticated user")
    @ApiResponses({
      @ApiResponse(
        responseCode = "200",
        description = "Booking found",
        content = @Content(schema = @Schema(implementation = BookingDetailResponse.class))),
      @ApiResponse(
        responseCode = "401",
        description = "Unauthorized",
        content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
      @ApiResponse(
        responseCode = "404",
        description = "Booking not found or not owned by caller",
        content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
  public BookingDetailResponse getById(
      @PathVariable Long id,
      @AuthenticationPrincipal UserDetails userDetails) {
    if (userDetails == null) {
      throw new IllegalStateException("Authenticated user is required");
    }
    return bookingService.getByIdForUser(id, userDetails.getUsername());
  }

  @PatchMapping("/{id}/cancel")
    @Operation(
      summary = "Cancel booking",
      description = "Cancel booking when current status is PENDING or ACTIVE")
    @ApiResponses({
      @ApiResponse(
        responseCode = "200",
        description = "Booking cancelled",
        content = @Content(schema = @Schema(implementation = BookingResponse.class))),
      @ApiResponse(
        responseCode = "400",
        description = "Invalid state transition",
        content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
      @ApiResponse(
        responseCode = "401",
        description = "Unauthorized",
        content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
      @ApiResponse(
        responseCode = "404",
        description = "Booking not found",
        content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
  public BookingResponse cancelBooking(@PathVariable Long id) {
    return bookingService.cancelBooking(id);
  }
}
