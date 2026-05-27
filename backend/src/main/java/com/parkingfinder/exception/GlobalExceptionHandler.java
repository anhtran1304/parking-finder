package com.parkingfinder.exception;

import java.time.Instant;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.parkingfinder.dto.ApiErrorResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<ApiErrorResponse> handleNotFound(
      ResourceNotFoundException ex, HttpServletRequest request) {
    return build(HttpStatus.NOT_FOUND, "NOT_FOUND", ex.getMessage(), request.getRequestURI());
  }

  @ExceptionHandler(NoAvailableSlotException.class)
  public ResponseEntity<ApiErrorResponse> handleNoSlot(
      NoAvailableSlotException ex, HttpServletRequest request) {
    return build(HttpStatus.CONFLICT, "NO_AVAILABLE_SLOT", ex.getMessage(), request.getRequestURI());
  }

  @ExceptionHandler(BookingReservationUnavailableException.class)
  public ResponseEntity<ApiErrorResponse> handleBookingReservationUnavailable(
      BookingReservationUnavailableException ex, HttpServletRequest request) {
    return build(
        HttpStatus.SERVICE_UNAVAILABLE,
        "BOOKING_RESERVATION_UNAVAILABLE",
        ex.getMessage(),
        request.getRequestURI());
  }

  @ExceptionHandler(DuplicateEmailException.class)
  public ResponseEntity<ApiErrorResponse> handleDuplicateEmail(
      DuplicateEmailException ex, HttpServletRequest request) {
    return build(HttpStatus.CONFLICT, "DUPLICATE_EMAIL", ex.getMessage(), request.getRequestURI());
  }

  @ExceptionHandler(
      {IllegalArgumentException.class, IllegalStateException.class, ConstraintViolationException.class})
  public ResponseEntity<ApiErrorResponse> handleBadRequest(
      RuntimeException ex, HttpServletRequest request) {
    return build(HttpStatus.BAD_REQUEST, "BAD_REQUEST", ex.getMessage(), request.getRequestURI());
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiErrorResponse> handleMethodArgumentNotValid(
      MethodArgumentNotValidException ex, HttpServletRequest request) {
    String message =
        ex.getBindingResult().getFieldErrors().stream()
            .findFirst()
            .map(FieldError::getDefaultMessage)
            .orElse("Validation failed");
    return build(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message, request.getRequestURI());
  }

  @ExceptionHandler(MissingServletRequestParameterException.class)
  public ResponseEntity<ApiErrorResponse> handleMissingRequestParameter(
      MissingServletRequestParameterException ex, HttpServletRequest request) {
    return build(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", ex.getMessage(), request.getRequestURI());
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiErrorResponse> handleGeneric(Exception ex, HttpServletRequest request) {
    return build(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "INTERNAL_ERROR",
        "Unexpected server error",
        request.getRequestURI());
  }

  private ResponseEntity<ApiErrorResponse> build(
      HttpStatus status, String code, String message, String path) {
    return ResponseEntity.status(status)
        .body(new ApiErrorResponse(code, message, Instant.now(), path));
  }
}
