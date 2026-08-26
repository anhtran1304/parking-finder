import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthSessionService } from '../core/services/auth-session.service';
import { BookingApiService } from '../core/services/booking-api.service';
import { ParkingAvailabilityRealtimeService } from '../core/services/parking-availability-realtime.service';
import { ParkingApiService } from '../core/services/parking-api.service';
import { BookingDetailResponse, BookingResponse } from '../models/booking.model';
import { ParkingAvailabilityEvent, RealtimeConnectionState } from '../models/parking-availability-event.model';
import { NearbyParkingResponse } from '../models/parking.model';
import { DialogService } from '../shared/ui/dialog/dialog.service';
import { ShellComponent } from './shell.component';

describe('ShellComponent cancel booking flow', () => {
  let component: ShellComponent;
  let bookingApi: jasmine.SpyObj<BookingApiService>;
  let parkingApi: jasmine.SpyObj<ParkingApiService>;
  let router: jasmine.SpyObj<Router>;
  let realtimeService: jasmine.SpyObj<ParkingAvailabilityRealtimeService>;
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
      'refreshNearby',
    ]);
    parkingApi.refreshNearby.and.returnValue(of([{ ...parking, availableSlots: 10 }]));
    realtimeService = jasmine.createSpyObj<ParkingAvailabilityRealtimeService>(
      'ParkingAvailabilityRealtimeService',
      ['connect', 'disconnect'],
      {
        availabilityEvents$: new Subject<ParkingAvailabilityEvent>(),
        connectionState$: new BehaviorSubject<RealtimeConnectionState>('disconnected'),
      }
    );
    realtimeService.disconnect.and.resolveTo();
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
          authSession,
          realtimeService
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
    expect(parkingApi.refreshNearby).toHaveBeenCalledTimes(1);
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

describe('ShellComponent realtime availability synchronization', () => {
  let component: ShellComponent;
  let bookingApi: jasmine.SpyObj<BookingApiService>;
  let parkingApi: jasmine.SpyObj<ParkingApiService>;
  let realtimeService: jasmine.SpyObj<ParkingAvailabilityRealtimeService>;
  let authSession: jasmine.SpyObj<AuthSessionService>;
  let availabilityEvents: Subject<ParkingAvailabilityEvent>;
  let connectionState: BehaviorSubject<RealtimeConnectionState>;

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

  const event: ParkingAvailabilityEvent = {
    eventId: '9195c9e9-2a3e-4c39-b457-b3aca12df75a',
    parkingId: parking.id,
    availableSlots: 0,
    totalSlots: 12,
    updatedAt: '2026-08-07T09:05:00Z',
    reason: 'OCCUPANCY_ENTER',
  };

  beforeEach(() => {
    availabilityEvents = new Subject<ParkingAvailabilityEvent>();
    connectionState = new BehaviorSubject<RealtimeConnectionState>('disconnected');
    bookingApi = jasmine.createSpyObj<BookingApiService>('BookingApiService', [
      'cancelBooking',
      'createBooking',
      'getActiveBooking',
    ]);
    bookingApi.getActiveBooking.and.returnValue(of(null));
    parkingApi = jasmine.createSpyObj<ParkingApiService>('ParkingApiService', [
      'evictParkingDetail',
      'getNearby',
      'refreshNearby',
    ]);
    parkingApi.getNearby.and.returnValue(of([parking]));
    parkingApi.refreshNearby.and.returnValue(of([parking]));
    realtimeService = jasmine.createSpyObj<ParkingAvailabilityRealtimeService>(
      'ParkingAvailabilityRealtimeService',
      ['connect', 'disconnect'],
      {
        availabilityEvents$: availabilityEvents.asObservable(),
        connectionState$: connectionState.asObservable(),
      }
    );
    realtimeService.disconnect.and.resolveTo();

    const router = jasmine.createSpyObj<Router>('Router', ['navigate'], {
      events: new Subject(),
      url: '/map/7',
    });
    authSession = jasmine.createSpyObj<AuthSessionService>(
      'AuthSessionService',
      ['getValidSession'],
      { session: signal(null), isAuthenticated: signal(false) }
    );
    authSession.getValidSession.and.returnValue(null);

    TestBed.configureTestingModule({ providers: [DialogService] });
    component = TestBed.runInInjectionContext(
      () =>
        new ShellComponent(
          {
            paramMap: of(convertToParamMap({ parkingId: '7' })),
            queryParamMap: of(convertToParamMap({})),
          } as unknown as ActivatedRoute,
          router,
          parkingApi,
          bookingApi,
          authSession,
          realtimeService
        )
    );
  });

  afterEach(() => component.ngOnDestroy());

  it('connects once, synchronizes matching UI state, and disconnects on destroy', () => {
    component.ngOnInit();
    TestBed.flushEffects();
    component.activeFilters.set(['available']);

    availabilityEvents.next(event);
    TestBed.flushEffects();

    expect(realtimeService.connect).toHaveBeenCalledTimes(1);
    expect(component.parkings()[0]).toEqual(jasmine.objectContaining({
      availableSlots: 0,
      totalSlots: 12,
      updatedAt: event.updatedAt,
    }));
    expect(component.selectedParking()?.availableSlots).toBe(0);
    expect(component.filteredParkings()).toEqual([]);
    expect(parkingApi.evictParkingDetail).toHaveBeenCalledOnceWith(parking.id);

    component.ngOnDestroy();
    expect(realtimeService.disconnect).toHaveBeenCalledTimes(1);
  });

  it('ignores stale, unknown, and duplicate absolute events', () => {
    component.ngOnInit();
    availabilityEvents.next(event);
    availabilityEvents.next({ ...event, availableSlots: 8, updatedAt: '2026-08-07T09:04:00Z' });
    availabilityEvents.next({ ...event, parkingId: 99, updatedAt: '2026-08-07T09:06:00Z' });
    availabilityEvents.next(event);

    expect(component.parkings()[0].availableSlots).toBe(0);
    expect(parkingApi.evictParkingDetail).toHaveBeenCalledTimes(1);
  });

  it('polls only while unavailable and immediately resyncs after reconnect', fakeAsync(() => {
    component.ngOnInit();

    tick(environment.pollingIntervalMs - 1);
    expect(parkingApi.refreshNearby).not.toHaveBeenCalled();
    tick(1);
    expect(parkingApi.refreshNearby).toHaveBeenCalledTimes(1);

    connectionState.next('connected');
    tick(environment.pollingIntervalMs);
    expect(parkingApi.refreshNearby).toHaveBeenCalledTimes(1);

    connectionState.next('reconnecting');
    tick(environment.pollingIntervalMs);
    expect(parkingApi.refreshNearby).toHaveBeenCalledTimes(2);

    connectionState.next('connected');
    expect(parkingApi.refreshNearby).toHaveBeenCalledTimes(3);

    component.ngOnDestroy();
  }));

  it('preserves newer realtime availability when a stale REST refresh completes', () => {
    const refreshResult = new Subject<NearbyParkingResponse[]>();
    parkingApi.refreshNearby.and.returnValue(refreshResult);
    component.ngOnInit();
    connectionState.next('connected');
    availabilityEvents.next(event);

    connectionState.next('reconnecting');
    connectionState.next('connected');
    refreshResult.next([{ ...parking, availableSlots: 8 }]);

    expect(component.parkings()[0]).toEqual(jasmine.objectContaining({
      availableSlots: 0,
      totalSlots: 12,
      updatedAt: event.updatedAt,
    }));
  });

  it('preserves the last known state when fallback refresh fails', fakeAsync(() => {
    parkingApi.refreshNearby.and.returnValue(throwError(() => new Error('offline')));
    component.ngOnInit();

    tick(environment.pollingIntervalMs);

    expect(component.parkings()).toEqual([parking]);
    component.ngOnDestroy();
  }));

  it('refreshes authoritative availability after booking without local arithmetic', () => {
    const bookingResponse: BookingResponse = {
      id: 42,
      parkingId: parking.id,
      userId: 'user-1',
      startTime: '2026-08-07T10:00:00Z',
      endTime: '2026-08-07T11:00:00Z',
      status: 'PENDING',
      createdAt: '2026-08-07T09:00:00Z',
    };
    authSession.getValidSession.and.returnValue({} as never);
    bookingApi.createBooking.and.returnValue(of(bookingResponse));
    component.parkings.set([parking]);
    component.selectedParking.set(parking);
    component.bookingDraft.set({ parkingId: parking.id, durationHours: 1 });

    component.confirmBooking();

    expect(parkingApi.refreshNearby).toHaveBeenCalledTimes(1);
    expect(component.parkings()[0].availableSlots).toBe(9);
  });
});
