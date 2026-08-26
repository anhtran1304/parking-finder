import { TestBed } from '@angular/core/testing';
import { HttpRequest } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ParkingApiService } from './parking-api.service';

describe('ParkingApiService', () => {
  let service: ParkingApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ParkingApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should cache nearby response by key', () => {
    let firstResult: unknown;
    let secondResult: unknown;

    service.getNearby(10.7, 106.7, 1000).subscribe((res) => (firstResult = res));
    service.getNearby(10.7, 106.7, 1000).subscribe((res) => (secondResult = res));

    const req = httpMock.expectOne((r: HttpRequest<unknown>) => r.url.endsWith('/parkings/nearby'));
    req.flush([{ id: 1, name: 'A', availableSlots: 5, lat: 10.7, lng: 106.7, distanceMeters: 100, updatedAt: new Date().toISOString() }]);

    expect(firstResult).toEqual(secondResult);
  });

  it('should bypass and replace the nearby cache when refreshing', () => {
    const initial = [{ id: 1, name: 'A', availableSlots: 5 }];
    const refreshed = [{ id: 1, name: 'A', availableSlots: 4 }];
    let cachedResult: unknown;

    service.getNearby(10.7, 106.7, 1000).subscribe();
    httpMock.expectOne((request) => request.url.endsWith('/parkings/nearby')).flush(initial);

    service.refreshNearby(10.7, 106.7, 1000).subscribe();
    httpMock.expectOne((request) => request.url.endsWith('/parkings/nearby')).flush(refreshed);

    service.getNearby(10.7, 106.7, 1000).subscribe((result) => (cachedResult = result));

    expect(cachedResult).toEqual(refreshed);
    httpMock.expectNone((request) => request.url.endsWith('/parkings/nearby'));
  });
});
