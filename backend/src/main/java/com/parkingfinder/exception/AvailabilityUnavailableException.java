package com.parkingfinder.exception;

public class AvailabilityUnavailableException extends RuntimeException {

  public AvailabilityUnavailableException(String message, Throwable cause) {
    super(message, cause);
  }
}
