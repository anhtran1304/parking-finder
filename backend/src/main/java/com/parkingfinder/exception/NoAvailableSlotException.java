package com.parkingfinder.exception;

public class NoAvailableSlotException extends RuntimeException {

  public NoAvailableSlotException(String message) {
    super(message);
  }
}
