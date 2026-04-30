# Task: Setup Frontend (Angular)

## Goal
Initialize Angular app focused on:
- map-based parking search
- fast UI response
- clean reactive data flow

---

## Project Setup

- Angular (latest)
- Use standalone components (if possible)
- Enable strict mode

---

## Core Libraries

- RxJS (required)
- Angular Router
- (Optional) Map library:
  - Google Maps OR Leaflet

---

## Folder Structure

src/app/
├── core/            # services, interceptors
├── features/
│   ├── parking/
│   └── booking/
├── shared/          # reusable components
└── models/          # interfaces

---

## Core Features

### 1. Parking Map View
- Show nearby parkings
- Display:
  - name
  - available slots

### 2. Parking Detail
- Show full info
- Show slot status

### 3. Booking
- Simple booking button
- Show success/failure

---

## Data Flow (IMPORTANT)

Use RxJS properly:

- Use Observables for API calls
- Avoid manual subscriptions when possible
- Prefer async pipe

---

## Performance Strategy

- Use Resolver for preloading data before route
- Avoid unnecessary re-render
- Cache API result in service (basic)

---

## API Integration

Backend endpoints:

- GET /parkings/nearby
- GET /parkings/{id}
- POST /bookings

---

## UI/UX Rules

- Show loading state
- Show error state clearly
- Always show last updated time for slot data

---

## Optional (Nice to have)

- Polling every 5-10 seconds for slot update
- Highlight "almost full" parking

---

## Deliverables

- Angular app running
- Map view working
- Can search and book parking

---

## Notes for AI Agent

- Keep UI simple and functional
- Focus on data flow clarity
- Do not overcomplicate state management
