package com.parkingfinder.exception;

public class BookingReservationUnavailableException extends RuntimeException {

  public BookingReservationUnavailableException(String message, Throwable cause) {
    super(message, cause);
  }
}
