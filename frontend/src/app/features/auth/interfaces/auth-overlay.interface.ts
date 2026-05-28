export type AuthOverlayMode = 'sign-in' | 'sign-up';

export interface AuthOverlayBookingContext {
  parkingName: string;
  locationLabel: string;
  durationLabel: string;
  hourlyRateLabel: string;
  estimatedTotalLabel: string;
}
