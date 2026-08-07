import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, computed, inject, signal } from '@angular/core';
import { catchError, finalize, of } from 'rxjs';
import { BookingApiService } from '../../core/services/booking-api.service';
import { BookingBadgeState, BookingDetailResponse } from '../../models/booking.model';
import { NearbyParkingResponse } from '../../models/parking.model';
import { IconComponent } from '../../shared/components/icon.component';
import { StateBadgeComponent } from '../../shared/components/state-badge.component';
import { PanelShellComponent } from '../../shared/ui/panel-shell/panel-shell.component';
import { BookingActionsComponent } from './booking-actions.component';

@Component({
  selector: 'app-booking-detail',
  standalone: true,
  imports: [CommonModule, IconComponent, StateBadgeComponent, PanelShellComponent, BookingActionsComponent],
  template: `
    <app-panel-shell ariaLabel="Reservation details">
      <div panelHeader class="pf-panel-header">
        <button class="pf-icon-button" type="button" (click)="closed.emit()" aria-label="Back from booking detail">
          <app-icon name="chevron-left" [size]="20" [strokeWidth]="2" />
        </button>
        <div class="pf-header-copy">
          <h2 class="pf-panel-title">Reservation details</h2>
          <p class="pf-panel-subtitle">{{ headerSubtitle() }}</p>
        </div>
      </div>

      <div panelBody class="pf-panel-body">
        @if (detailLoading()) {
          <div class="pf-skeleton-group">
            <div class="pf-skeleton-line pf-skeleton-line--wide"></div>
            <div class="pf-skeleton-line"></div>
            <div class="pf-skeleton-block pf-skeleton-block--tall"></div>
            <div class="pf-skeleton-line pf-skeleton-line--wide"></div>
            <div class="pf-skeleton-line"></div>
          </div>
        } @else if (detailError()) {
          <div class="pf-empty-state">
            <app-icon name="alert-circle" [size]="22" />
            <span>{{ detailError() }}</span>
          </div>
        } @else if (selectedBooking(); as booking) {
          <!-- Hero section -->
          <section class="hero">
            <div class="hero__identity">
              <!-- <div class="hero__icon" aria-hidden="true">
                <span>{{ parkingInitials(booking) }}</span>
              </div> -->
              <div class="hero__text">
                <h3 class="hero__name">{{ parkingName(booking) }}</h3>
                <p class="hero__address">
                  <app-icon name="map-pin" [size]="13" [strokeWidth]="2" />
                  {{ parkingAddress(booking) }}
                </p>
              </div>
            </div>

            <div class="hero__status-row">
              <app-state-badge [label]="statusLabel(booking)" [state]="badgeState(booking)" />
              @if (distanceLabel(booking) !== 'Not available') {
                <span class="hero__distance">{{ distanceLabel(booking) }}</span>
              }
            </div>

            @if (isLiveBooking(booking)) {
              <div class="hero__countdown" [class.hero__countdown--active]="booking.status === 'ACTIVE'">
                <strong>{{ remainingLabel() }}</strong>
                <span>{{ countdownDescription(booking) }}</span>
              </div>
            }
          </section>

          <!-- Reservation summary -->
          <section class="info-card" aria-labelledby="booking-info-title">
            <h3 id="booking-info-title" class="info-card__title">Reservation summary</h3>
            <div class="info-card__grid">
              <div class="info-item info-item--full">
                <span class="info-item__label">Booked at</span>
                <span class="info-item__value">{{ dateTimeLabel(booking.createdAt) }}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">Duration</span>
                <span class="info-item__value">{{ durationLabel(booking) }}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">Total cost</span>
                <span class="info-item__value info-item__value--accent">{{ totalCostLabel(booking) }}</span>
              </div>
              <div class="info-item info-item--full">
                <span class="info-item__label">Reservation window</span>
                <div class="info-item__window">
                  <span>{{ dateTimeLabel(booking.startTime) }}</span>
                  <span class="info-item__arrow" aria-hidden="true">&rarr;</span>
                  <span>{{ dateTimeLabel(booking.endTime) }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Parking information -->
          <section class="info-card" aria-labelledby="parking-info-title">
            <h3 id="parking-info-title" class="info-card__title">Parking information</h3>
            <div class="info-card__list">
              <div class="info-row">
                <app-icon name="map-pin" [size]="15" [strokeWidth]="2" />
                <div class="info-row__content">
                  <span class="info-row__label">Address</span>
                  <span class="info-row__value">{{ parkingAddress(booking) }}</span>
                </div>
              </div>
              <div class="info-row">
                <app-icon name="dollar-sign" [size]="15" [strokeWidth]="2" />
                <div class="info-row__content">
                  <span class="info-row__label">Hourly rate</span>
                  <span class="info-row__value">{{ rateLabel(booking) }}</span>
                </div>
              </div>
              @if (distanceLabel(booking) !== 'Not available') {
                <div class="info-row">
                  <app-icon name="navigation" [size]="15" [strokeWidth]="2" />
                  <div class="info-row__content">
                    <span class="info-row__label">Distance</span>
                    <span class="info-row__value">{{ distanceLabel(booking) }}</span>
                  </div>
                </div>
              }
            </div>
          </section>
        }
      </div>

      @if (selectedBooking(); as booking) {
        <div panelFooter class="pf-panel-footer">
          <app-booking-actions
            [status]="booking.status"
            [cancelLoading]="cancelLoading"
            (navigateClicked)="navigateRequested.emit(booking)"
            (viewParkingClicked)="viewParkingRequested.emit(booking.parkingId)"
            (bookAgainClicked)="bookAgainRequested.emit(booking.parkingId)"
            (cancelClicked)="onCancelClicked()"
          />
        </div>
      }
    </app-panel-shell>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 0;
      }

      /* Hero section */
      .hero {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
        padding: var(--spacing-lg);
        border: 1px solid var(--color-border-subtle);
        border-radius: var(--radius-lg);
        background: var(--color-bg-default);
        box-shadow: var(--shadow-xs);
      }

      .hero__identity {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
      }

      .hero__icon {
        width: 42px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-md);
        background: var(--color-primary-base);
        color: var(--color-text-inverse);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-bold);
        letter-spacing: 0.04em;
        flex-shrink: 0;
      }

      .hero__text {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .hero__name {
        margin: 0;
        font-size: var(--font-size-base);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
        letter-spacing: var(--tracking-tight);
        line-height: var(--leading-tight);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .hero__address {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: var(--font-size-xs);
        color: var(--color-text-secondary);
        line-height: var(--leading-relaxed);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .hero__address app-icon {
        flex-shrink: 0;
        color: var(--color-primary-base);
      }

      .hero__status-row {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
      }

      .hero__distance {
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-secondary);
      }

      .hero__countdown {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-2xs);
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        border: 1px solid var(--color-border-subtle);
        background: var(--color-bg-subtle);
      }

      .hero__countdown--active {
        border-color: rgba(16, 185, 129, 0.24);
        background: var(--badge-available-bg);
      }

      .hero__countdown strong {
        font-size: 1.4rem;
        line-height: 1;
        color: var(--color-text-primary);
      }

      .hero__countdown span {
        font-size: var(--font-size-xs);
        color: var(--color-text-secondary);
        line-height: var(--leading-relaxed);
      }

      /* Info card sections */
      .info-card {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .info-card__title {
        margin: 0;
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-secondary);
        letter-spacing: 0.02em;
      }

      .info-card__grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1px;
        border: 1px solid var(--color-border-subtle);
        border-radius: var(--radius-lg);
        background: var(--color-border-subtle);
        overflow: hidden;
        box-shadow: var(--shadow-xs);
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-2xs);
        padding: var(--spacing-md) var(--spacing-lg);
        background: var(--color-bg-default);
      }

      .info-item--full {
        grid-column: 1 / -1;
      }

      .info-item__label {
        font-size: var(--font-size-xs);
        color: var(--color-text-tertiary);
        line-height: 1.2;
      }

      .info-item__value {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        line-height: var(--leading-relaxed);
      }

      .info-item__value--accent {
        color: var(--color-primary-base);
      }

      .info-item__window {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--spacing-xs);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        line-height: var(--leading-relaxed);
      }

      .info-item__arrow {
        color: var(--color-text-tertiary);
      }

      /* Parking info list */
      .info-card__list {
        display: flex;
        flex-direction: column;
        border: 1px solid var(--color-border-subtle);
        border-radius: var(--radius-lg);
        background: var(--color-bg-default);
        overflow: hidden;
        box-shadow: var(--shadow-xs);
      }

      .info-row {
        display: flex;
        align-items: flex-start;
        gap: var(--spacing-md);
        padding: var(--spacing-md) var(--spacing-lg);
        border-bottom: 1px solid var(--color-border-subtle);
      }

      .info-row:last-child {
        border-bottom: 0;
      }

      .info-row > app-icon {
        flex-shrink: 0;
        margin-top: 2px;
        color: var(--color-text-tertiary);
      }

      .info-row__content {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .info-row__label {
        font-size: var(--font-size-xs);
        color: var(--color-text-tertiary);
      }

      .info-row__value {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        line-height: var(--leading-relaxed);
      }
    `,
  ],
})
export class BookingDetailComponent implements OnInit, OnDestroy {
  @Input() cancelLoading = false;
  @Output() closed = new EventEmitter<void>();
  @Output() navigateRequested = new EventEmitter<BookingDetailResponse>();
  @Output() viewParkingRequested = new EventEmitter<number>();
  @Output() bookAgainRequested = new EventEmitter<number>();
  @Output() cancelRequested = new EventEmitter<BookingDetailResponse>();

  private readonly bookingApiService = inject(BookingApiService);
  private readonly currentBookingId = signal<number | null>(null);
  private readonly parkingOptions = signal<NearbyParkingResponse[]>([]);
  private readonly now = signal(Date.now());
  private timerId: ReturnType<typeof setInterval> | null = null;

  readonly selectedBooking = signal<BookingDetailResponse | null>(null);
  readonly detailLoading = signal(false);
  readonly detailError = signal<string | null>(null);

  readonly headerSubtitle = computed(() => {
    const booking = this.selectedBooking();
    if (booking) {
      return `Ref #${booking.id}`;
    }
    const bookingId = this.currentBookingId();
    return bookingId ? `Ref #${bookingId}` : '';
  });

  readonly remainingLabel = computed(() => {
    const booking = this.selectedBooking();
    if (!booking) {
      return '';
    }

    if (booking.status === 'PENDING') {
      const minutesUntilStart = Math.ceil((new Date(booking.startTime).getTime() - this.now()) / 60000);
      return minutesUntilStart > 0 ? `Starts in ${this.compactDuration(minutesUntilStart)}` : 'Awaiting activation';
    }

    if (booking.status === 'ACTIVE') {
      const remainingMinutes = Math.ceil((new Date(booking.endTime).getTime() - this.now()) / 60000);
      return remainingMinutes > 0 ? `${this.compactDuration(remainingMinutes)} left` : 'Ending now';
    }

    return this.statusLabel(booking);
  });

  @Input() set bookingId(value: number | null) {
    if (!value) {
      this.currentBookingId.set(null);
      this.selectedBooking.set(null);
      return;
    }

    if (value === this.currentBookingId()) {
      return;
    }

    this.currentBookingId.set(value);
    this.loadBooking(value);
  }

  @Input() set parkings(value: NearbyParkingResponse[] | null) {
    this.parkingOptions.set(value ?? []);
  }

  ngOnInit(): void {
    this.timerId = setInterval(() => this.now.set(Date.now()), 30000);
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  statusLabel(booking: BookingDetailResponse): string {
    return booking.status.charAt(0) + booking.status.slice(1).toLowerCase();
  }

  badgeState(booking: BookingDetailResponse): BookingBadgeState {
    switch (booking.status) {
      case 'ACTIVE':
      case 'COMPLETED':
        return 'good';
      case 'PENDING':
        return 'warn';
      case 'CANCELLED':
      case 'EXPIRED':
        return 'danger';
    }
  }

  countdownDescription(booking: BookingDetailResponse): string {
    if (booking.status === 'ACTIVE') {
      return 'Reservation is active until the end time below.';
    }
    if (booking.status === 'PENDING') {
      return 'Reservation is confirmed and waiting for its start time.';
    }
    return `Reservation is ${booking.status.toLowerCase()}.`;
  }

  isLiveBooking(booking: BookingDetailResponse): boolean {
    return booking.status === 'ACTIVE' || booking.status === 'PENDING';
  }

  onCancelClicked(): void {
    const booking = this.selectedBooking();
    if (booking) {
      this.cancelRequested.emit(booking);
    }
  }

  parkingInitials(booking: BookingDetailResponse): string {
    const words = this.parkingName(booking).split(/\s+/).filter(Boolean);
    return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'P';
  }

  parkingName(booking: BookingDetailResponse): string {
    return booking.parkingName || this.parkingFor(booking)?.name || `Parking #${booking.parkingId}`;
  }

  parkingAddress(booking: BookingDetailResponse): string {
    return booking.parkingAddress || 'Address not available';
  }

  dateTimeLabel(value: string): string {
    return new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  durationLabel(booking: BookingDetailResponse): string {
    const minutes = Math.round(this.durationHours(booking) * 60);
    if (minutes >= 1440) {
      const days = minutes / 1440;
      return Number.isInteger(days) ? `${days} day${days === 1 ? '' : 's'}` : `${days.toFixed(1)} days`;
    }
    if (minutes >= 60 && minutes % 60 === 0) {
      const hours = minutes / 60;
      return `${hours} hour${hours === 1 ? '' : 's'}`;
    }
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes} min`;
  }

  totalCostLabel(booking: BookingDetailResponse): string {
    const rate = this.hourlyRate(booking);
    if (rate === null) {
      return 'Not available';
    }
    return `$${this.formatPrice(rate * this.durationHours(booking))}`;
  }

  distanceLabel(booking: BookingDetailResponse): string {
    const parking = this.parkingFor(booking);
    if (!parking) {
      return 'Not available';
    }
    return this.formatDistance(parking.distanceMeters);
  }

  rateLabel(booking: BookingDetailResponse): string {
    const rate = this.hourlyRate(booking);
    return rate === null ? 'Not available' : `$${this.formatPrice(rate)}/hr`;
  }

  private loadBooking(bookingId: number): void {
    this.selectedBooking.set(null);
    this.detailError.set(null);
    this.detailLoading.set(true);

    this.bookingApiService
      .getBooking(bookingId)
      .pipe(
        catchError(() => {
          this.detailError.set('Booking detail could not be loaded.');
          return of(null);
        }),
        finalize(() => this.detailLoading.set(false))
      )
      .subscribe((detail) => {
        if (detail && this.currentBookingId() === bookingId) {
          this.selectedBooking.set(detail);
        }
      });
  }

  private parkingFor(booking: BookingDetailResponse): NearbyParkingResponse | undefined {
    return this.parkingOptions().find((parking) => parking.id === booking.parkingId);
  }

  private hourlyRate(booking: BookingDetailResponse): number | null {
    return booking.hourlyRate ?? this.parkingFor(booking)?.hourlyRate ?? null;
  }

  private durationHours(booking: BookingDetailResponse): number {
    const start = new Date(booking.startTime).getTime();
    const end = new Date(booking.endTime).getTime();
    return Math.max((end - start) / (1000 * 60 * 60), 0);
  }

  private compactDuration(totalMinutes: number): string {
    if (totalMinutes < 60) {
      return `${Math.max(totalMinutes, 0)} min`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours < 24) {
      return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours === 0 ? `${days}d` : `${days}d ${remainingHours}h`;
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
}
