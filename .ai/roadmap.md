# Parking Finder Roadmap

## Phase 1: Core Search
Backend plan
- setup_docker
- design_database
- implement_parking_entity
- nearby_search_api

Frontend plan
- setup_angular
- map_view_basic
- call_nearby_api
- render_parking_markers

## Phase 2: Booking
Backend plan
- implement_booking_naive
- reproduce_race_condition
- implement_redis_atomic_booking

Frontend plan
- parking_detail_page
- booking_button
- booking_result_feedback

## Phase 3: Realtime
Backend plan
- websocket_setup
- redis_pubsub

Frontend plan
- websocket_client
- realtime_slot_update_ui

## Phase 4: UX
Backend plan
- cache_optimization
- error_contract_hardening

Frontend plan
- loading_state
- error_state
- last_updated_label
- highlight_almost_full
