import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { BookingResponse } from '../../models/booking.model';
import { AuthSessionService } from './auth-session.service';
import { BookingApiService } from './booking-api.service';

describe('BookingApiService', () => {
  let service: BookingApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    const authSessionSpy = jasmine.createSpyObj<AuthSessionService>('AuthSessionService', ['getValidSession']);
    authSessionSpy.getValidSession.and.returnValue({
      accessToken: 'access-token',
      expiresAt: Date.now() + 60_000,
      userId: 1,
      email: 'user@example.com',
      fullName: 'Test User',
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: AuthSessionService, useValue: authSessionSpy }],
    });

    service = TestBed.inject(BookingApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should cancel a booking with the authenticated request contract', () => {
    const response: BookingResponse = {
      id: 42,
      parkingId: 7,
      userId: 'user-1',
      startTime: '2026-08-07T10:00:00Z',
      endTime: '2026-08-07T11:00:00Z',
      status: 'CANCELLED',
      createdAt: '2026-08-07T09:00:00Z',
    };
    let actual: BookingResponse | undefined;

    service.cancelBooking(42).subscribe((value) => (actual = value));

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/bookings/42/cancel`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toBeNull();
    expect(request.request.withCredentials).toBeTrue();
    expect(request.request.headers.get('Authorization')).toBe('Bearer access-token');
    request.flush(response);

    expect(actual).toEqual(response);
  });
});
