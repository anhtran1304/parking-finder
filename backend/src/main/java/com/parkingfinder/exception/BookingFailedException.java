package com.parkingfinder.exception;

public class BookingFailedException extends RuntimeException {

  public BookingFailedException(String message, Throwable cause) {
    super(message, cause);
  }
}
