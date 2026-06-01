export type BookingDurationHours = 1 | 2 | 4 | 24;

export interface ReservePayload {
  parkingId: number;
  durationHours: BookingDurationHours;
}

export interface CreateBookingRequest {
  parkingId: number;
  userId?: string;
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

export interface BookingDetailResponse extends BookingResponse {
  parkingName: string;
  parkingAddress: string;
  hourlyRate?: number;
}

export type BookingBadgeState = 'good' | 'warn' | 'danger';

export interface BookingHistoryItemViewModel extends BookingResponse {
  parkingName: string;
  badgeState: BookingBadgeState;
}

export interface BookingDetailViewModel extends BookingDetailResponse {
  dateLabel: string;
  durationLabel: string;
  totalLabel: string;
  timeRangeLabel: string;
  badgeState: BookingBadgeState;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
