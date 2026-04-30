import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NearbyParkingResponse } from '../../models/parking.model';
import { ParkingApiService } from '../services/parking-api.service';

@Injectable({ providedIn: 'root' })
export class ParkingMapResolver implements Resolve<NearbyParkingResponse[]> {
  constructor(private readonly parkingApiService: ParkingApiService) {}

  resolve(): Observable<NearbyParkingResponse[]> {
    const center = environment.defaultMapCenter;
    return this.parkingApiService
      .getNearby(center.lat, center.lng, environment.defaultRadiusMeters)
      .pipe(catchError(() => of([])));
  }
}
