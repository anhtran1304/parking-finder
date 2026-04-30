# Experiment: Race Condition on Last Slot

## Goal
Validate booking consistency when many users try to book the last slot.

## Setup
- seed one parking with `available_slots = 1`
- run concurrent `POST /bookings`
- observe Redis counter, DB updates, and final booking count

## Success Criteria
- only one booking is confirmed
- `available_slots` never goes below 0
- failed paths rollback Redis reserve correctly

## Record Template
- concurrency level:
- confirmed bookings:
- DB slot after test:
- rollback behavior observed:
