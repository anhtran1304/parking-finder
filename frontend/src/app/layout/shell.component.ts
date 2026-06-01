import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { catchError, filter, finalize, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthSessionService } from '../core/services/auth-session.service';
import { BookingApiService } from '../core/services/booking-api.service';
import { ParkingApiService } from '../core/services/parking-api.service';
import { AuthOverlayComponent } from '../features/auth/components/auth-overlay/auth-overlay.component';
import type { AuthOverlayBookingContext, AuthOverlayMode } from '../features/auth/interfaces/auth-overlay.interface';
import { ActiveBookingBannerComponent } from '../features/booking/active-booking-banner.component';
import { BookingDetailComponent } from '../features/booking/booking-detail.component';
import { BookingCenterPanelComponent } from '../features/booking/booking-history-panel.component';
import { DialogService } from '../shared/ui/dialog/dialog.service';
import { ReservationDialogComponent, ReservationDialogResult } from '../shared/ui/dialog/reservation-dialog/reservation-dialog.component';
import { BookingDetailResponse, BookingResponse, CreateBookingRequest, ReservePayload } from '../models/booking.model';
import { NearbyParkingResponse } from '../models/parking.model';
import { DetailPanelComponent } from './detail-panel.component';
import { ProfilePanelComponent } from './profile-panel.component';
import { SidebarComponent } from './sidebar.component';
import { ParkingMapComponent } from '../features/parking/parking-map.component';
import { IconComponent } from '../shared/components/icon.component';

export type ParkingFilter = 'available' | 'ev' | 'covered' | 'cheap';
type BookingFeedback = { type: 'success' | 'error'; message: string };
type BookingDetailReturnTarget = 'history' | 'map';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    ParkingMapComponent,
    DetailPanelComponent,
    ProfilePanelComponent,
    ActiveBookingBannerComponent,
    BookingDetailComponent,
    BookingCenterPanelComponent,
    AuthOverlayComponent,
    IconComponent,
  ],
  template: `
    <div class="shell" [class.shell--panel-open]="hasPanelOverlay()">
      <app-parking-map
        class="shell__map"
        [parkings]="filteredParkings()"
        [selectedId]="selectedParking()?.id ?? null"
        [hoveredId]="hoveredParkingId()"
        (markerClicked)="onParkingSelected($event)"
        (markerHovered)="onMarkerHovered($event)"
        (markerLeft)="onMarkerLeft()"
      ></app-parking-map>

      <div class="shell__vignette"></div>

      <app-sidebar
        class="shell__sidebar"
        [parkings]="filteredParkings()"
        [selectedId]="selectedParking()?.id ?? null"
        [hoveredId]="hoveredParkingId()"
        [activeFilters]="activeFilters()"
        (parkingSelected)="onParkingSelected($event)"
        (parkingHovered)="onCardHovered($event)"
        (parkingLeft)="onCardLeft()"
        (searchChange)="onSearch($event)"
        (filterToggled)="onFilterToggle($event)"
      ></app-sidebar>

      <button
        *ngIf="hasPanelOverlay()"
        class="shell__mobile-overlay-backdrop"
        type="button"
        aria-label="Close panel"
        (click)="closeMobileOverlay()"
      ></button>

      <app-active-booking-banner
        *ngIf="visibleActiveBooking() as booking"
        class="shell__active-booking"
        [booking]="booking"
        (viewClicked)="onActiveBookingView($event)"
        (dismissClicked)="onActiveBookingDismiss()"
      ></app-active-booking-banner>

      <!-- Avatar / profile toggle button -->
      <button
        class="shell__avatar-btn"
        [class.shell__avatar-btn--active]="profileOpen() || historyOpen()"
        (click)="onAvatarClick()"
        aria-label="Toggle profile"
      >
        @if (isAuthenticated()) {
          <span>{{ userInitials() }}</span>
        } @else {
          <app-icon name="user-round" [size]="18" />
        }
      </button>

      <!-- Profile panel -->
      <app-profile-panel
        *ngIf="profileOpen() && !historyOpen() && !selectedBookingDetailId()"
        class="shell__profile"
        (closeClicked)="onProfileClosed()"
        (historyRequested)="onProfileHistoryRequested()"
        (signedOut)="onProfileSignedOut()"
      ></app-profile-panel>

      <app-booking-center-panel
        *ngIf="historyOpen() && !selectedBookingDetailId()"
        class="shell__history"
        [parkings]="parkings()"
        (backClicked)="onHistoryBack()"
        (bookingSelected)="onHistoryBookingSelected($event)"
        (navigateRequested)="onBookingDetailNavigate($event)"
      ></app-booking-center-panel>

      <app-booking-detail
        *ngIf="selectedBookingDetailId() as bookingId"
        class="shell__booking-detail"
        [bookingId]="bookingId"
        [parkings]="parkings()"
        (closed)="onBookingDetailClosed()"
        (navigateRequested)="onBookingDetailNavigate($event)"
        (viewParkingRequested)="onBookingDetailViewParking($event)"
        (bookAgainRequested)="onBookingDetailBookAgain($event)"
        (cancelRequested)="onBookingDetailCancel()"
      ></app-booking-detail>

      <app-detail-panel
        *ngIf="selectedParking() && !profileOpen() && !historyOpen() && !selectedBookingDetailId()"
        class="shell__detail"
        [parking]="selectedParking()"
        [reserveDisabled]="(selectedParking()?.availableSlots ?? 0) <= 0"
        [reserveLoading]="false"
        reserveLabel="Reserve Spot"
        (reserveClicked)="onReserveIntent($event)"
        (navigateClicked)="onNavigate($event)"
        (closeClicked)="onDeselect()"
      ></app-detail-panel>

      <app-auth-overlay
        *ngIf="authMode() as mode"
        [mode]="mode"
        [bookingContext]="authOverlayContext()"
        (closed)="closeAuthOverlay()"
        (modeChanged)="setAuthMode($event)"
        (signedIn)="onAuthSuccess()"
      ></app-auth-overlay>

      <div
        *ngIf="bookingFeedback() as feedback"
        class="shell__feedback"
        [class.shell__feedback--success]="feedback.type === 'success'"
        [class.shell__feedback--error]="feedback.type === 'error'"
      >
        {{ feedback.message }}
      </div>
    </div>
  `,
  styles: [
    `
      .shell {
        --shell-edge: var(--panel-edge);
        --shell-panel-top: var(--panel-top);

        position: relative;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
      }

      .shell__map {
        position: absolute;
        inset: 0;
        z-index: 0;
      }

      .shell__vignette {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 120px;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.04), transparent);
        pointer-events: none;
        z-index: 1;
      }

      .shell__sidebar {
        position: absolute;
        top: var(--shell-edge);
        left: var(--shell-edge);
        bottom: var(--shell-edge);
        width: 360px;
        display: block;
        max-height: calc(100vh - 40px);
        z-index: 10;
        animation: panelSlideIn 0.4s var(--ease-out-expo) both;
      }

      .shell__avatar-btn {
        position: absolute;
        top: var(--shell-edge);
        right: var(--shell-edge);
        z-index: 20;
        width: 44px;
        height: 44px;
        border-radius: var(--radius-lg);
        background: var(--glass-bg-solid);
        backdrop-filter: blur(var(--glass-blur));
        -webkit-backdrop-filter: blur(var(--glass-blur));
        box-shadow: var(--shadow-md);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-primary-base);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-bold);
        transition: all var(--duration-fast) ease;
      }
      .shell__avatar-btn:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-lg);
      }
      .shell__avatar-btn--active {
        background: var(--color-primary-base);
        color: white;
        border-color: transparent;
        box-shadow: 0 4px 20px rgba(26, 115, 232, 0.4);
      }

      .shell__active-booking {
        position: absolute;
        top: var(--shell-edge);
        left: 400px;
        right: 84px;
        max-width: 420px;
        z-index: 25;
        animation: panelSlideIn 0.35s var(--ease-out-expo) both;
      }

      .shell__mobile-overlay-backdrop {
        display: none;
      }

      .shell__profile,
      .shell__history,
      .shell__booking-detail,
      .shell__detail {
        position: absolute;
        top: var(--shell-panel-top);
        right: var(--shell-edge);
        bottom: var(--shell-edge);
        width: var(--panel-width);
        height: auto;
        min-height: 0;
        z-index: 10;
        animation: panelSlideInRight 0.35s var(--ease-out-expo) both;
      }

      .shell__feedback {
        position: absolute;
        top: var(--shell-edge);
        left: 50%;
        transform: translateX(-50%);
        z-index: 50;
        width: min(420px, calc(100vw - 40px));
        padding: 12px 16px;
        border-radius: var(--radius-md);
        border: 1px solid transparent;
        box-shadow: var(--shadow-float);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        text-align: center;
        backdrop-filter: blur(var(--glass-blur));
        -webkit-backdrop-filter: blur(var(--glass-blur));
      }

      .shell__feedback--success {
        background: var(--badge-available-bg);
        border-color: rgba(46, 125, 50, 0.2);
        color: var(--badge-available-text);
      }

      .shell__feedback--error {
        background: var(--badge-full-bg);
        border-color: rgba(198, 40, 40, 0.18);
        color: var(--badge-full-text);
      }

      @media (max-width: 1279px) {
        .shell__sidebar {
          width: 320px;
        }

        .shell__active-booking {
          left: 360px;
          max-width: 340px;
        }

        .shell__detail,
        .shell__profile,
        .shell__history,
        .shell__booking-detail {
          width: var(--panel-width-compact);
        }
      }

      @media (max-width: 767px) {
        .shell__sidebar {
          top: auto;
          left: 12px;
          right: 12px;
          bottom: 12px;
          width: auto;
          max-height: 45vh;
        }

        .shell__detail,
        .shell__profile,
        .shell__history,
        .shell__booking-detail {
          position: absolute;
          top: auto;
          left: 0;
          right: 0;
          bottom: 0;
          width: auto;
          height: var(--panel-mobile-height);
          max-height: var(--panel-mobile-height);
          z-index: 40;
          animation: sheetSlideUp var(--duration-slow) var(--ease-out-expo) both;
        }

        .shell__active-booking {
          top: 72px;
          left: 12px;
          right: 12px;
          max-width: none;
        }

        .shell--panel-open .shell__active-booking {
          display: none;
        }

        .shell__mobile-overlay-backdrop {
          display: block;
          position: absolute;
          inset: 0;
          z-index: 30;
          border: 0;
          background: rgba(13, 27, 53, 0.2);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          animation: fadeIn var(--duration-normal) var(--ease-out-expo);
        }
      }
    `,
  ],
})
export class ShellComponent implements OnInit {
  private readonly dialogService = inject(DialogService);

  readonly parkings = signal<NearbyParkingResponse[]>([]);
  readonly selectedParking = signal<NearbyParkingResponse | null>(null);
  readonly hoveredParkingId = signal<number | null>(null);
  readonly activeFilters = signal<ParkingFilter[]>([]);
  readonly searchQuery = signal('');
  readonly bookingInFlight = signal(false);
  readonly bookingFeedback = signal<BookingFeedback | null>(null);
  readonly activeBooking = signal<BookingDetailResponse | null>(null);
  readonly dismissedActiveBookingId = signal<number | null>(null);
  readonly selectedBookingDetailId = signal<number | null>(null);

  readonly authMode = signal<AuthOverlayMode | null>(null);
  readonly bookingDraft = signal<ReservePayload | null>(null);
  readonly profileOpen = signal(false);
  readonly historyOpen = signal(false);
  private readonly bookingDetailReturnTarget = signal<BookingDetailReturnTarget>('map');
  readonly isAuthenticated = computed(() => !!this.authSessionService.getValidSession());
  readonly userInitials = computed(() => {
    const name = this.authSessionService.session()?.fullName ?? '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || '?';
  });

  private readonly routeParkingId = signal<number | null>(null);
  private readonly bookingRouteActive = signal(false);
  readonly isBookingRoute = this.bookingRouteActive.asReadonly();

  readonly hasPanelOverlay = computed(() =>
    !!this.selectedBookingDetailId()
    || this.historyOpen()
    || this.profileOpen()
    || (!!this.selectedParking() && !this.historyOpen() && !this.profileOpen())
  );

  readonly visibleActiveBooking = computed(() => {
    const booking = this.activeBooking();
    if (!this.isAuthenticated() || !booking || this.dismissedActiveBookingId() === booking.id) {
      return null;
    }
    return booking;
  });

  readonly filteredParkings = computed(() => {
    const all = this.parkings();
    const filters = this.activeFilters();
    const q = this.searchQuery().toLowerCase();

    return all.filter((parking) => {
      if (q && !parking.name.toLowerCase().includes(q)) {
        return false;
      }

      for (const filterValue of filters) {
        if (filterValue === 'available' && parking.availableSlots <= 0) {
          return false;
        }
      }

      return true;
    });
  });

  readonly bookingDurationLabel = computed(() => {
    const duration = this.bookingDraft()?.durationHours;
    if (!duration) {
      return '1 hour';
    }
    return duration === 24 ? '1 day' : `${duration} hours`;
  });

  readonly authOverlayContext = computed<AuthOverlayBookingContext | null>(() => {
    const parking = this.selectedParking();
    const draft = this.bookingDraft();

    if (!parking || !draft) {
      return null;
    }

    const hourlyRate = parking.hourlyRate ?? 2;
    const estimatedTotal = hourlyRate * draft.durationHours;

    return {
      parkingName: parking.name,
      locationLabel: this.buildLocationLabel(parking),
      durationLabel: draft.durationHours === 24 ? '1 day' : `${draft.durationHours}h`,
      hourlyRateLabel: `$${this.formatPrice(hourlyRate)}/h`,
      estimatedTotalLabel: `~$${this.formatPrice(estimatedTotal)}`,
    };
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly parkingApiService: ParkingApiService,
    private readonly bookingApiService: BookingApiService,
    private readonly authSessionService: AuthSessionService
  ) {
    effect(() => {
      const parkingId = this.routeParkingId();
      const allParkings = this.parkings();

      if (parkingId === null) {
        this.selectedParking.set(null);
        return;
      }

      const matched = allParkings.find((item) => item.id === parkingId) ?? null;
      this.selectedParking.set(matched);
    });

    effect(() => {
      if (!this.isBookingRoute()) {
        return;
      }

      const selected = this.selectedParking();
      const draft = this.bookingDraft();
      if (!selected) {
        return;
      }

      if (!draft || draft.parkingId !== selected.id) {
        this.bookingDraft.set({
          parkingId: selected.id,
          durationHours: draft?.durationHours ?? 1,
        });
      }
    });
  }

  ngOnInit(): void {
    const center = environment.defaultMapCenter;
    this.parkingApiService
      .getNearby(center.lat, center.lng, environment.defaultRadiusMeters)
      .pipe(catchError(() => of([])))
      .subscribe((data) => this.parkings.set(data));

    this.route.paramMap.subscribe((params) => {
      const rawParkingId = params.get('parkingId');
      if (!rawParkingId) {
        this.routeParkingId.set(null);
        return;
      }

      const parsedId = Number(rawParkingId);
      this.routeParkingId.set(Number.isFinite(parsedId) ? parsedId : null);
    });

    this.route.queryParamMap.subscribe((params) => {
      const mode = params.get('auth');
      this.authMode.set(mode === 'sign-in' || mode === 'sign-up' ? mode : null);
    });

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.syncRouteState());

    this.syncRouteState();
    this.loadActiveBooking();
  }

  onParkingSelected(parking: NearbyParkingResponse): void {
    this.selectedParking.set(parking);
    this.bookingFeedback.set(null);
    this.bookingDraft.set(null);
    this.selectedBookingDetailId.set(null);
    this.profileOpen.set(false);
    this.historyOpen.set(false);

    void this.router.navigate(['/map', parking.id], {
      queryParams: { auth: null, returnUrl: null },
      queryParamsHandling: 'merge',
    });
  }

  onDeselect(): void {
    this.bookingFeedback.set(null);
    this.bookingDraft.set(null);
    this.selectedBookingDetailId.set(null);
    this.historyOpen.set(false);
    this.closeAuthOverlay(false);

    void this.router.navigate(['/map'], {
      queryParams: { auth: null, returnUrl: null },
      queryParamsHandling: 'merge',
    });
  }

  onAvatarClick(): void {
    if (!this.isAuthenticated()) {
      this.setAuthMode('sign-in');
      return;
    }

    this.selectedBookingDetailId.set(null);

    if (this.historyOpen()) {
      this.historyOpen.set(false);
      this.profileOpen.set(false);
      return;
    }

    this.profileOpen.set(!this.profileOpen());
  }

  onProfileClosed(): void {
    this.profileOpen.set(false);
  }

  onProfileHistoryRequested(): void {
    this.selectedBookingDetailId.set(null);
    this.profileOpen.set(false);
    this.historyOpen.set(true);
  }

  onHistoryBack(): void {
    this.historyOpen.set(false);
    this.profileOpen.set(true);
  }

  onHistoryViewParking(parkingId: number): void {
    const parking = this.findParkingById(parkingId);
    if (!parking) {
      this.bookingFeedback.set({
        type: 'error',
        message: 'Parking is not available in the current map area.',
      });
      return;
    }

    this.historyOpen.set(false);
    this.profileOpen.set(false);
    this.selectedBookingDetailId.set(null);
    this.bookingFeedback.set(null);
    this.bookingDraft.set(null);
    this.selectedParking.set(parking);

    void this.router.navigate(['/map', parking.id], {
      queryParams: { auth: null, returnUrl: null },
      queryParamsHandling: 'merge',
    });
  }

  onHistoryBookAgain(parkingId: number): void {
    const parking = this.findParkingById(parkingId);
    if (!parking) {
      this.bookingFeedback.set({
        type: 'error',
        message: 'Parking is not available in the current map area.',
      });
      return;
    }

    this.historyOpen.set(false);
    this.profileOpen.set(false);
    this.selectedBookingDetailId.set(null);
    this.selectedParking.set(parking);
    this.onReserveIntent({ parkingId, durationHours: 1 });
  }

  onHistoryBookingSelected(bookingId: number): void {
    this.bookingDetailReturnTarget.set('history');
    this.selectedBookingDetailId.set(bookingId);
    this.historyOpen.set(false);
    this.profileOpen.set(false);
    this.bookingFeedback.set(null);
    this.bookingDraft.set(null);
  }

  onActiveBookingView(bookingId: number): void {
    this.bookingDetailReturnTarget.set('map');
    this.selectedBookingDetailId.set(bookingId);
    this.historyOpen.set(false);
    this.profileOpen.set(false);
    this.selectedParking.set(null);
    this.bookingFeedback.set(null);
    this.bookingDraft.set(null);

    void this.router.navigate(['/map'], {
      queryParams: { auth: null, returnUrl: null },
      queryParamsHandling: 'merge',
    });
  }

  onBookingDetailClosed(): void {
    const returnTarget = this.bookingDetailReturnTarget();
    this.selectedBookingDetailId.set(null);

    if (returnTarget === 'history') {
      this.historyOpen.set(true);
      this.profileOpen.set(false);
      return;
    }

    this.historyOpen.set(false);
    this.profileOpen.set(false);
    this.selectedParking.set(null);
    void this.router.navigate(['/map'], {
      queryParams: { auth: null, returnUrl: null },
      queryParamsHandling: 'merge',
    });
  }

  onBookingDetailNavigate(booking: BookingDetailResponse): void {
    const parking = this.findParkingById(booking.parkingId);
    if (parking) {
      this.onNavigate(parking);
      return;
    }

    const query = [booking.parkingName, booking.parkingAddress].filter(Boolean).join(', ');
    if (!query) {
      this.bookingFeedback.set({
        type: 'error',
        message: 'Navigation is unavailable for this booking.',
      });
      return;
    }

    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
  }

  onBookingDetailViewParking(parkingId: number): void {
    this.onHistoryViewParking(parkingId);
  }

  onBookingDetailBookAgain(parkingId: number): void {
    this.onHistoryBookAgain(parkingId);
  }

  onBookingDetailCancel(): void {
    this.bookingFeedback.set({
      type: 'error',
      message: 'Cancel booking is coming soon.',
    });
  }

  onActiveBookingDismiss(): void {
    const booking = this.activeBooking();
    if (booking) {
      this.dismissedActiveBookingId.set(booking.id);
    }
  }

  closeMobileOverlay(): void {
    if (this.selectedBookingDetailId()) {
      this.onBookingDetailClosed();
      return;
    }

    if (this.historyOpen()) {
      this.historyOpen.set(false);
      this.profileOpen.set(false);
      return;
    }

    if (this.profileOpen()) {
      this.onProfileClosed();
      return;
    }

    if (this.selectedParking()) {
      this.onDeselect();
    }
  }

  onProfileSignedOut(): void {
    this.profileOpen.set(false);
    this.historyOpen.set(false);
    this.selectedParking.set(null);
    this.selectedBookingDetailId.set(null);
    this.activeBooking.set(null);
    this.dismissedActiveBookingId.set(null);
    void this.router.navigate(['/map'], {
      queryParams: { auth: null, returnUrl: null },
      queryParamsHandling: 'merge',
    });
  }

  onCardHovered(parking: NearbyParkingResponse): void {
    this.hoveredParkingId.set(parking.id);
  }

  onCardLeft(): void {
    this.hoveredParkingId.set(null);
  }

  onMarkerHovered(parking: NearbyParkingResponse): void {
    this.hoveredParkingId.set(parking.id);
  }

  onMarkerLeft(): void {
    this.hoveredParkingId.set(null);
  }

  onFilterToggle(filterValue: ParkingFilter): void {
    const current = this.activeFilters();
    if (current.includes(filterValue)) {
      this.activeFilters.set(current.filter((entry) => entry !== filterValue));
      return;
    }
    this.activeFilters.set([...current, filterValue]);
  }

  onSearch(query: string): void {
    this.searchQuery.set(query.trim());
  }

  onReserveIntent(payload: ReservePayload): void {
    const selected = this.selectedParking();
    if (!selected) {
      return;
    }

    if (selected.availableSlots <= 0) {
      this.bookingFeedback.set({
        type: 'error',
        message: 'No slots are available for this parking.',
      });
      return;
    }

    this.bookingFeedback.set(null);
    this.bookingDraft.set(payload);

    if (!this.authSessionService.getValidSession()) {
      this.setAuthMode('sign-in');
      return;
    }

    this.openBookingDialog();
  }

  confirmBooking(): void {
    if (this.bookingInFlight()) {
      return;
    }

    const selected = this.selectedParking();
    const draft = this.bookingDraft();
    if (!selected || !draft) {
      return;
    }

    if (!this.authSessionService.getValidSession()) {
      this.setAuthMode('sign-in');
      return;
    }

    if (selected.availableSlots <= 0) {
      this.bookingFeedback.set({
        type: 'error',
        message: 'No slots are available for this parking.',
      });
      return;
    }

    this.bookingInFlight.set(true);
    this.bookingFeedback.set(null);

    this.bookingApiService
      .createBooking(this.buildBookingRequest(draft))
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.bookingFeedback.set({
            type: 'error',
            message: this.bookingErrorMessage(error),
          });
          return of(null);
        }),
        finalize(() => this.bookingInFlight.set(false))
      )
      .subscribe((response) => {
        if (!response) {
          return;
        }

        const durationLabel = this.bookingDurationLabel();
        this.applyBookedSlot(response.parkingId);
        this.parkingApiService.evictParkingDetail(response.parkingId);
        this.bookingDraft.set(null);
        this.bookingFeedback.set({
          type: 'success',
          message: `Booking #${response.id} confirmed — ${durationLabel}.`,
        });
        this.showCurrentBooking(response, selected);

        void this.router.navigate(['/map', response.parkingId], {
          queryParams: { auth: null, returnUrl: null },
          queryParamsHandling: 'merge',
        });
      });
  }

  cancelBookingRoute(): void {
    this.bookingDraft.set(null);
    const selected = this.selectedParking();

    if (selected) {
      void this.router.navigate(['/map', selected.id], {
        queryParamsHandling: 'merge',
      });
      return;
    }

    void this.router.navigate(['/map'], {
      queryParamsHandling: 'merge',
    });
  }

  onAuthSuccess(): void {
    this.closeAuthOverlay();
    this.loadActiveBooking();

    if (this.bookingDraft()) {
      this.openBookingDialog();
    }
  }

  setAuthMode(mode: AuthOverlayMode): void {
    this.authMode.set(mode);

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        auth: mode,
        returnUrl: this.currentPath(),
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  closeAuthOverlay(clearQuery: boolean = true): void {
    this.authMode.set(null);

    if (!clearQuery) {
      return;
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        auth: null,
        returnUrl: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onNavigate(parking: NearbyParkingResponse): void {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${parking.lat},${parking.lng}`,
      '_blank'
    );
  }

  private openBookingDialog(): void {
    const selected = this.selectedParking();
    if (!selected) {
      return;
    }

    const ref = this.dialogService.open<ReservationDialogResult | undefined>({
      title: 'Confirm reservation',
      component: ReservationDialogComponent,
      data: {
        parkingName: selected.name,
        hourlyRate: selected.hourlyRate ?? 2,
        parkingId: selected.id,
      },
      backdrop: 'subtle',
      position: 'center',
      showClose: false,
      closeOnBackdrop: true,
    });

    ref.afterClosed$.subscribe((result) => {
      if (result?.confirmed) {
        this.bookingDraft.set({ parkingId: selected.id, durationHours: result.durationHours });
        this.confirmBooking();
      } else {
        this.bookingDraft.set(null);
      }
    });
  }

  private loadActiveBooking(): void {
    if (!this.authSessionService.getValidSession()) {
      this.activeBooking.set(null);
      this.dismissedActiveBookingId.set(null);
      return;
    }

    this.bookingApiService
      .getActiveBooking()
      .pipe(catchError(() => of(null)))
      .subscribe((booking) => {
        this.activeBooking.set(booking);
        if (!booking) {
          this.dismissedActiveBookingId.set(null);
        }
      });
  }

  private showCurrentBooking(response: BookingResponse, parking: NearbyParkingResponse): void {
    this.dismissedActiveBookingId.set(null);
    this.activeBooking.set({
      ...response,
      parkingName: parking.name,
      parkingAddress: this.buildLocationLabel(parking),
      hourlyRate: parking.hourlyRate,
    });
  }

  private buildBookingRequest(payload: ReservePayload): CreateBookingRequest {
    const startTime = new Date(Date.now() + 5 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + payload.durationHours * 60 * 60 * 1000);

    return {
      parkingId: payload.parkingId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    };
  }

  private applyBookedSlot(parkingId: number): void {
    let updatedSelection: NearbyParkingResponse | null = null;

    const updated = this.parkings().map((parking) => {
      if (parking.id !== parkingId) {
        return parking;
      }

      const next = {
        ...parking,
        availableSlots: Math.max(parking.availableSlots - 1, 0),
        updatedAt: new Date().toISOString(),
      };
      updatedSelection = next;
      return next;
    });

    this.parkings.set(updated);
    if (updatedSelection) {
      this.selectedParking.set(updatedSelection);
    }
  }

  private findParkingById(parkingId: number): NearbyParkingResponse | null {
    return this.parkings().find((parking) => parking.id === parkingId) ?? null;
  }

  private bookingErrorMessage(error: HttpErrorResponse): string {
    const code = error.error?.code;
    if (code === 'NO_AVAILABLE_SLOT' || error.status === 409) {
      return 'No slots are available for this parking.';
    }

    if (error.status === 401) {
      return 'Session expired. Please sign in again to continue.';
    }

    if (code === 'BOOKING_RESERVATION_UNAVAILABLE' || error.status === 503) {
      return 'Booking reservation system unavailable. Please try again shortly.';
    }

    return error.error?.message ?? 'Booking failed. Please try again.';
  }

  private buildLocationLabel(parking: NearbyParkingResponse): string {
    return `${this.formatDistance(parking.distanceMeters)} from your current map area`;
  }

  private formatDistance(distanceMeters: number): string {
    if (distanceMeters >= 1000) {
      return `${(distanceMeters / 1000).toFixed(1)} km`;
    }
    return `${distanceMeters} m`;
  }

  private formatPrice(value: number): string {
    return Number.isInteger(value) ? `${value}` : value.toFixed(2);
  }

  private syncRouteState(): void {
    const path = this.currentPath();
    this.bookingRouteActive.set(/^\/map\/\d+\/booking$/.test(path));
  }

  private currentPath(): string {
    const [path] = this.router.url.split('?');
    return path || '/map';
  }
}
