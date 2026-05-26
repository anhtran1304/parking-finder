export type BookingDurationHours = 1 | 2 | 4 | 24;

export interface ReservePayload {
  parkingId: number;
  durationHours: BookingDurationHours;
}

export interface CreateBookingRequest {
  parkingId: number;
  userId: string;
  startTime: string;
  endTime: string;
}

export interface BookingResponse {
  id: number;
  parkingId: number;
  userId: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  createdAt: string;
}
