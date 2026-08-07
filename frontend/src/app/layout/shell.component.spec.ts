import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { AuthSessionService } from '../core/services/auth-session.service';
import { BookingApiService } from '../core/services/booking-api.service';
import { ParkingApiService } from '../core/services/parking-api.service';
import { BookingDetailResponse, BookingResponse } from '../models/booking.model';
import { NearbyParkingResponse } from '../models/parking.model';
import { DialogService } from '../shared/ui/dialog/dialog.service';
import { ShellComponent } from './shell.component';

describe('ShellComponent cancel booking flow', () => {
  let component: ShellComponent;
  let bookingApi: jasmine.SpyObj<BookingApiService>;
  let parkingApi: jasmine.SpyObj<ParkingApiService>;
  let router: jasmine.SpyObj<Router>;
  let dialogService: DialogService;

  const booking: BookingDetailResponse = {
    id: 42,
    parkingId: 7,
    parkingName: 'Central Parking',
    parkingAddress: 'District 1',
    hourlyRate: 2,
    userId: 'user-1',
    startTime: '2026-08-07T10:00:00Z',
    endTime: '2026-08-07T11:00:00Z',
    status: 'ACTIVE',
    createdAt: '2026-08-07T09:00:00Z',
  };

  const cancelledResponse: BookingResponse = {
    ...booking,
    status: 'CANCELLED',
  };

  const parking: NearbyParkingResponse = {
    id: 7,
    name: 'Central Parking',
    availableSlots: 9,
    totalSlots: 10,
    hourlyRate: 2,
    lat: 10.77,
    lng: 106.7,
    distanceMeters: 200,
    updatedAt: '2026-08-07T09:00:00Z',
  };

  beforeEach(() => {
    bookingApi = jasmine.createSpyObj<BookingApiService>('BookingApiService', [
      'cancelBooking',
      'createBooking',
      'getActiveBooking',
    ]);
    parkingApi = jasmine.createSpyObj<ParkingApiService>('ParkingApiService', [
      'evictParkingDetail',
      'getNearby',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate'], { events: new Subject() });
    const authSession = jasmine.createSpyObj<AuthSessionService>('AuthSessionService', ['getValidSession']);
    authSession.getValidSession.and.returnValue({
      accessToken: 'access-token',
      expiresAt: Date.now() + 60_000,
      userId: 1,
      email: 'user@example.com',
      fullName: 'Test User',
    });

    TestBed.configureTestingModule({ providers: [DialogService] });
    dialogService = TestBed.inject(DialogService);
    component = TestBed.runInInjectionContext(
      () =>
        new ShellComponent(
          { paramMap: of(), queryParamMap: of() } as unknown as ActivatedRoute,
          router,
          parkingApi,
          bookingApi,
          authSession
        )
    );
    component.parkings.set([parking]);
    component.activeBooking.set(booking);
    component.selectedBookingDetailId.set(booking.id);
  });

  it('should require destructive confirmation before calling the API', () => {
    component.onBookingDetailCancel(booking);

    const dialog = dialogService.activeDialog();
    expect(dialog?.config.variant).toBe('destructive');
    expect(bookingApi.cancelBooking).not.toHaveBeenCalled();

    dialog?.ref.close(false);
    expect(bookingApi.cancelBooking).not.toHaveBeenCalled();
  });

  it('should refresh booking state and return to history after successful cancellation', () => {
    bookingApi.cancelBooking.and.returnValue(of(cancelledResponse));
    component.onHistoryBookingSelected(booking.id);

    component.onBookingDetailCancel(booking);
    dialogService.activeDialog()?.ref.close(true);

    expect(bookingApi.cancelBooking).toHaveBeenCalledOnceWith(booking.id);
    expect(component.parkings()[0].availableSlots).toBe(10);
    expect(parkingApi.evictParkingDetail).toHaveBeenCalledOnceWith(parking.id);
    expect(component.activeBooking()).toBeNull();
    expect(component.selectedBookingDetailId()).toBeNull();
    expect(component.historyOpen()).toBeTrue();
    expect(component.bookingFeedback()).toEqual({
      type: 'success',
      message: 'Booking #42 cancelled. The parking slot is available again.',
    });
  });

  it('should block duplicate cancellation attempts while the request is pending', () => {
    const response$ = new Subject<BookingResponse>();
    bookingApi.cancelBooking.and.returnValue(response$);

    component.onBookingDetailCancel(booking);
    dialogService.activeDialog()?.ref.close(true);
    component.onBookingDetailCancel(booking);

    expect(component.cancelInFlight()).toBeTrue();
    expect(bookingApi.cancelBooking).toHaveBeenCalledTimes(1);

    response$.next(cancelledResponse);
    response$.complete();
    expect(component.cancelInFlight()).toBeFalse();
  });

  it('should keep booking detail open and show a specific error when cancellation fails', () => {
    bookingApi.cancelBooking.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 404 }))
    );

    component.onBookingDetailCancel(booking);
    dialogService.activeDialog()?.ref.close(true);

    expect(component.selectedBookingDetailId()).toBe(booking.id);
    expect(component.cancelInFlight()).toBeFalse();
    expect(component.bookingFeedback()).toEqual({
      type: 'error',
      message: 'Booking not found or no longer available.',
    });
  });
});
