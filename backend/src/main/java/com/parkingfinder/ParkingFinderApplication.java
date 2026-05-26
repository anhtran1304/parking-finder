package com.parkingfinder;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ParkingFinderApplication {

  public static void main(String[] args) {
    SpringApplication.run(ParkingFinderApplication.class, args);
  }
}
