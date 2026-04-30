# WebSocket vs Polling

## Current Choice
Use polling for MVP. Keep WebSocket as next iteration.

## Why Polling First
- simpler implementation and operations
- enough for side-project scale and learning
- easier to debug during early development

## When to move to WebSocket
- frequent real-time updates are needed
- polling starts causing high redundant traffic
- user experience requires instant push updates
