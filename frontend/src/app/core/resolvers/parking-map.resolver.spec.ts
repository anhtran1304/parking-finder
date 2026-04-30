import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ParkingApiService } from '../services/parking-api.service';
import { ParkingMapResolver } from './parking-map.resolver';

describe('ParkingMapResolver', () => {
  let resolver: ParkingMapResolver;

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj<ParkingApiService>('ParkingApiService', ['getNearby']);
    apiSpy.getNearby.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [ParkingMapResolver, { provide: ParkingApiService, useValue: apiSpy }]
    });

    resolver = TestBed.inject(ParkingMapResolver);
  });

  it('should resolve nearby list', (done) => {
    resolver.resolve().subscribe((result) => {
      expect(result).toEqual([]);
      done();
    });
  });
});
