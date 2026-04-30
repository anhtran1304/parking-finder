export interface NearbyParkingResponse {
  id: number;
  name: string;
  availableSlots: number;
  lat: number;
  lng: number;
  distanceMeters: number;
  updatedAt: string;
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
