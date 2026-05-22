# Experiment: Race Condition on Last Slot (Naive DB Baseline)

## Goal
Reproduce overselling when booking is implemented with DB check only (no Redis).

## Current Implementation (Baseline)
- `POST /bookings`
- service flow: `countActiveBookings` -> compare with `totalSlots` -> `save booking`
- booking status used for active reservation: `ACTIVE`

## Why This Is Vulnerable
Two concurrent requests can both read the same active count before either insert commits.

## Setup
- create one parking with `total_slots = 1`
- ensure active bookings = 0
- send concurrent requests to `POST /bookings` for the same parking

## Expected Baseline Result
- oversell can happen: more bookings than total slots

## Portfolio Note
"I initially implemented booking using DB checks only. Under concurrent load, I observed
overselling due to race conditions. I then moved to Redis atomic decrement in the next phase."

## Record Template
- concurrency level:
- requests sent:
- bookings created:
- expected max bookings:
- oversell observed (yes/no):
