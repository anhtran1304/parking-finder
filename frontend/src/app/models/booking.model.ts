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
  status: 'CONFIRMED' | 'FAILED';
  createdAt: string;
}
