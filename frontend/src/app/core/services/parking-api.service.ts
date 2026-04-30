import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, shareReplay, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { NearbyParkingResponse, ParkingDetailResponse } from '../../models/parking.model';

@Injectable({ providedIn: 'root' })
export class ParkingApiService {
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly nearbyCache = new Map<string, Observable<NearbyParkingResponse[]>>();
  private readonly detailCache = new Map<number, Observable<ParkingDetailResponse>>();

  constructor(private readonly http: HttpClient) {}

  getNearby(lat: number, lng: number, radius: number): Observable<NearbyParkingResponse[]> {
    const key = `${lat.toFixed(4)}:${lng.toFixed(4)}:${Math.round(radius)}`;
    const cached = this.nearbyCache.get(key);
    if (cached) {
      return cached;
    }

    const params = new HttpParams().set('lat', lat).set('lng', lng).set('radius', radius);
    const request$ = this.http
      .get<NearbyParkingResponse[]>(`${this.baseUrl}/parkings/nearby`, { params })
      .pipe(shareReplay(1));

    this.nearbyCache.set(key, request$);
    return request$;
  }

  getParkingDetail(parkingId: number, useCache = true): Observable<ParkingDetailResponse> {
    if (useCache) {
      const cached = this.detailCache.get(parkingId);
      if (cached) {
        return cached;
      }
    }

    const request$ = this.http
      .get<ParkingDetailResponse>(`${this.baseUrl}/parkings/${parkingId}`)
      .pipe(shareReplay(1));

    this.detailCache.set(parkingId, request$);
    return request$;
  }

  pollParkingDetail(parkingId: number): Observable<ParkingDetailResponse> {
    return timer(0, environment.pollingIntervalMs).pipe(
      switchMap(() => this.getParkingDetail(parkingId, false))
    );
  }

  evictParkingDetail(parkingId: number): void {
    this.detailCache.delete(parkingId);
  }
}
