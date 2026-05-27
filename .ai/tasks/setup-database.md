# Task: Setup Database

Last reviewed: 2026-05-27

## Goal
Prepare PostgreSQL + PostGIS schema for parking, booking, and auth workflows.

## Core Requirements

1. Enable PostGIS extension
2. Manage schema only through Flyway migrations
3. Add indexes for geo and booking lifecycle queries

## Current Migration Plan

- V1__init_schema.sql
  - create parking and booking tables
  - enable PostGIS
  - create GIST index on parking.location

- V2__geography_address_seed.sql
  - add address and geography seed updates

- V3__enrich_parking_data.sql
  - add parking business fields (hourly_rate, parking_type, amenities, rating)
  - reseed richer parking dataset

- V4__booking_status_index.sql
  - add booking status + time indexes

- V5__auth_schema.sql
  - create app_user and refresh_token tables
  - add unique/index constraints for token lookup

## Verification Checklist

- Flyway runs clean on empty database
- parking.location has GIST index
- booking has status-time composite indexes
- app_user.email is unique
- refresh_token.token_hash is unique and indexed

## Rules

- Do not mutate schema manually in runtime
- Use append-only migration strategy
- Keep PostgreSQL as source of truth for booking correctness
