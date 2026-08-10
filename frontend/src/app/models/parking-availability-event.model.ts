export const PARKING_AVAILABILITY_REASONS = [
  'BOOKING_CREATED',
  'BOOKING_CANCELLED',
  'BOOKING_COMPLETED',
  'BOOKING_EXPIRED',
  'OCCUPANCY_ENTER',
  'OCCUPANCY_EXIT',
] as const;

export type ParkingAvailabilityReason = (typeof PARKING_AVAILABILITY_REASONS)[number];

export interface ParkingAvailabilityEvent {
  eventId: string;
  parkingId: number;
  availableSlots: number;
  totalSlots: number;
  updatedAt: string;
  reason: ParkingAvailabilityReason;
}

export type RealtimeConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting';
