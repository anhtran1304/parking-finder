# Frontend (Angular)

## Purpose
Frontend app for:
- map-based nearby parking discovery
- parking detail with slot status
- booking interaction and feedback
- live availability over STOMP with REST fallback recovery

## Run
```bash
npm install
npm start
```

## UX Goals
- fast first load with resolver
- clear loading/error states
- simple reactive data flow with RxJS
- instant absolute slot updates across map, list, filters, and detail state
- visible availability freshness without one timer per parking card

## Realtime Behavior

- One root service owns the native STOMP client and `/topic/parking-availability` subscription.
- The map shell ignores stale events by `updatedAt` and applies only absolute counts.
- While realtime is unavailable, the nearby REST query refreshes every 10 seconds.
- A reconnect triggers an immediate REST resync because Redis Pub/Sub has no replay.
- One sidebar clock updates all parking-card freshness labels.

## Verification

```bash
npm test
npm run build
```
