export interface NearbyParkingResponse {
  id: number;
  name: string;
  availableSlots: number;
  totalSlots: number;
  hourlyRate: number;
  lat: number;
  lng: number;
  distanceMeters: number;
  updatedAt: string;
  parkingType?: string;
  hasEVCharging?: boolean;
  hasSecurity?: boolean;
  hasRoof?: boolean;
  rating?: number;
  reviewCount?: number;
}

export interface ParkingDetailResponse {
  id: number;
  name: string;
  totalSlots: number;
  availableSlots: number;
  lat: number;
  lng: number;
  updatedAt: string;
}
