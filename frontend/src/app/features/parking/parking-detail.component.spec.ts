import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { BookingApiService } from '../../core/services/booking-api.service';
import { ParkingApiService } from '../../core/services/parking-api.service';
import { ParkingDetailComponent } from './parking-detail.component';

describe('ParkingDetailComponent', () => {
  let component: ParkingDetailComponent;
  let fixture: ComponentFixture<ParkingDetailComponent>;

  beforeEach(async () => {
    const parkingSpy = jasmine.createSpyObj<ParkingApiService>('ParkingApiService', ['pollParkingDetail', 'evictParkingDetail']);
    parkingSpy.pollParkingDetail.and.returnValue(
      of({
        id: 1,
        name: 'A',
        totalSlots: 100,
        availableSlots: 10,
        lat: 10.7,
        lng: 106.7,
        updatedAt: new Date().toISOString()
      })
    );

    const bookingSpy = jasmine.createSpyObj<BookingApiService>('BookingApiService', ['createBooking']);
    bookingSpy.createBooking.and.returnValue(
      of({
        id: 1,
        parkingId: 1,
        userId: 'u',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      })
    );

    await TestBed.configureTestingModule({
      imports: [ParkingDetailComponent],
      providers: [
        { provide: ParkingApiService, useValue: parkingSpy },
        { provide: BookingApiService, useValue: bookingSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: () => '1' })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ParkingDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
