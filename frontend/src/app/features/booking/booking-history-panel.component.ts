import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, computed, inject, signal } from '@angular/core';
import { catchError, finalize, of } from 'rxjs';
import { BookingApiService } from '../../core/services/booking-api.service';
import { BookingBadgeState, BookingDetailResponse, BookingResponse } from '../../models/booking.model';
import { NearbyParkingResponse } from '../../models/parking.model';
import { IconComponent } from '../../shared/components/icon.component';
import { StateBadgeComponent } from '../../shared/components/state-badge.component';
import { PanelShellComponent } from '../../shared/ui/panel-shell/panel-shell.component';

@Component({
  selector: 'app-booking-center-panel',
  standalone: true,
  imports: [CommonModule, IconComponent, StateBadgeComponent, PanelShellComponent],
  template: `
    <app-panel-shell ariaLabel="My bookings">
      <div panelHeader class="pf-panel-header">
        <button class="pf-icon-button" type="button" (click)="backClicked.emit()" aria-label="Back to profile">
          <app-icon name="chevron-left" [size]="20" [strokeWidth]="2" />
        </button>
        <div class="pf-header-copy">
          <h2 class="pf-panel-title">My Bookings</h2>
          <p class="pf-panel-subtitle">{{ subtitleLabel() }}</p>
        </div>
      </div>

      <div panelBody class="pf-panel-body pf-panel-body--spacious">
        <!-- Current Reservation section -->
        @if (currentReservation(); as reservation) {
          <section class="section section--current">
            <h3 class="section-title">Current reservation</h3>
            <button
              type="button"
              class="current-card"
              (click)="bookingSelected.emit(reservation.id)"
            >
              <div class="current-card__header">
                <div class="current-card__identity">
                  <div class="current-card__text">
                    <span class="current-card__name">{{ reservationParkingName(reservation) }}</span>
                    <span class="current-card__address">{{ reservationAddress(reservation) }}</span>
                  </div>
                </div>
                <app-icon class="current-card__chevron" name="chevron-right" [size]="16" [strokeWidth]="2" />
              </div>

              <div class="current-card__meta">
                <app-state-badge [label]="reservation.status | titlecase" [state]="reservationBadgeState(reservation)" />
                <span class="current-card__countdown">{{ reservationCountdown() }}</span>
              </div>

              <div class="current-card__footer">
                @if (reservationDistance(reservation) !== null) {
                  <span class="current-card__distance">
                    <app-icon name="navigation" [size]="12" [strokeWidth]="2" />
                    {{ reservationDistance(reservation) }}
                  </span>
                }
                <span class="current-card__end">
                  <app-icon name="clock" [size]="12" [strokeWidth]="2" />
                  Ends {{ reservationEndLabel(reservation) }}
                </span>
              </div>

              <div class="current-card__actions" (click)="$event.stopPropagation()">
                <button type="button" class="current-card__action current-card__action--primary" (click)="bookingSelected.emit(reservation.id)">
                  View details
                </button>
                <button type="button" class="current-card__action current-card__action--secondary" (click)="navigateRequested.emit(reservation)">
                  <app-icon name="navigation" [size]="13" [strokeWidth]="2" />
                  Navigate
                </button>
              </div>
            </button>
          </section>
        }

        <!-- Recent bookings section -->
        <section class="section section--history">
          <h3 class="section-title">Recent bookings</h3>

          @if (historyLoading()) {
            <div class="pf-skeleton-group">
              <div class="pf-skeleton-block"></div>
              <div class="pf-skeleton-block"></div>
              <div class="pf-skeleton-block"></div>
            </div>
          } @else if (historyError()) {
            <div class="pf-empty-state">
              <app-icon name="alert-circle" [size]="22" />
              <span>{{ historyError() }}</span>
              <button class="retry-btn" type="button" (click)="loadPage(0)">Retry</button>
            </div>
          } @else if (pastBookings().length === 0) {
            <div class="pf-empty-state">
              <app-icon name="calendar" [size]="22" />
              <span>No past bookings yet</span>
            </div>
          } @else {
            <div class="timeline">
              @for (booking of pastBookings(); track booking.id) {
                <button
                  type="button"
                  [class]="'timeline-item timeline-item--' + statusClass(booking)"
                  (click)="openBookingDetail(booking)"
                >
                  <span class="timeline-marker">
                    <span [class]="'timeline-dot timeline-dot--' + statusClass(booking)"></span>
                  </span>
                  <span class="timeline-content">
                    <span class="timeline-topline">
                      <span class="timeline-name">{{ parkingName(booking) }}</span>
                    </span>
                    <app-state-badge [label]="booking.status | titlecase" [state]="badgeState(booking)" />
                    <span class="timeline-date">{{ fullDateLabel(booking) }}</span>
                    <span class="timeline-meta">
                      <span><app-icon name="clock" [size]="12" [strokeWidth]="2" />{{ durationLabel(booking) }}</span>
                      <span><app-icon name="dollar-sign" [size]="12" [strokeWidth]="2" />{{ bookingTotalLabel(booking) }}</span>
                    </span>
                  </span>
                  <app-icon class="timeline-chevron" name="arrow-right" [size]="14" [strokeWidth]="2" />
                </button>
              }
            </div>

            @if (hasMore()) {
              <button class="load-more-btn" type="button" (click)="loadNextPage()" [disabled]="loadingMore()">
                {{ loadingMore() ? 'Loading...' : 'Load more' }}
              </button>
            }
          }
        </section>
      </div>
    </app-panel-shell>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 0;
    }

    .section {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .section-title {
      margin: 0;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-secondary);
      letter-spacing: 0.02em;
    }

    /* Current reservation card */
    .current-card {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      padding: var(--spacing-lg);
      border: 2px solid rgba(26, 115, 232, 0.24);
      border-radius: var(--radius-lg);
      background: linear-gradient(135deg, rgba(232, 240, 254, 0.5), var(--color-bg-default));
      box-shadow: var(--shadow-sm);
      cursor: pointer;
      text-align: left;
      color: inherit;
      transition: all var(--duration-fast) ease;
    }

    .current-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-1px);
    }

    .current-card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-md);
    }

    .current-card__identity {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      min-width: 0;
    }

    .current-card__icon {
      width: 36px;
      height: 36px;
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

    .current-card__text {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .current-card__name {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .current-card__address {
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .current-card__chevron {
      flex-shrink: 0;
      color: var(--color-text-tertiary);
    }

    .current-card__meta {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .current-card__countdown {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
    }

    .current-card__footer {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
    }

    .current-card__distance,
    .current-card__end {
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }

    .current-card__actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-sm);
      padding-top: var(--spacing-sm);
      border-top: 1px solid rgba(26, 115, 232, 0.12);
    }

    .current-card__action {
      min-height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-xs);
      border-radius: var(--radius-md);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
      transition: all var(--duration-fast) ease;
    }

    .current-card__action--primary {
      border: 0;
      background: var(--color-primary-base);
      color: var(--color-text-inverse);
      box-shadow: var(--shadow-primary-sm);
    }

    .current-card__action--secondary {
      border: 1px solid var(--color-border-default);
      background: var(--color-bg-default);
      color: var(--color-text-primary);
    }

    .current-card__action:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }

    /* Timeline */
    .timeline {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .timeline::before {
      content: '';
      position: absolute;
      top: var(--spacing-lg);
      bottom: var(--spacing-lg);
      left: 27px;
      width: 1px;
      background: var(--color-border-subtle);
    }

    .timeline-item {
      position: relative;
      width: 100%;
      display: grid;
      grid-template-columns: 20px minmax(0, 1fr) auto;
      gap: var(--spacing-md);
      padding: var(--spacing-lg);
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-lg);
      background: var(--color-bg-default);
      box-shadow: var(--shadow-xs);
      color: inherit;
      text-align: left;
      cursor: pointer;
      transition: all var(--duration-fast) ease;
    }

    .timeline-item:hover {
      background: var(--color-bg-subtle);
      box-shadow: var(--shadow-sm);
      transform: translateY(-1px);
    }

    .timeline-marker {
      position: relative;
      display: flex;
      justify-content: center;
      padding-top: 5px;
    }

    .timeline-dot {
      position: relative;
      z-index: 1;
      width: 9px;
      height: 9px;
      border-radius: var(--radius-full);
      background: var(--color-border-default);
      box-shadow: 0 0 0 4px var(--color-bg-default);
    }

    .timeline-dot--completed { background: var(--color-primary-base); }
    .timeline-dot--cancelled { background: var(--color-border-default); }
    .timeline-dot--expired { background: var(--color-status-error); }

    .timeline-content {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .timeline-topline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-sm);
    }

    .timeline-name {
      min-width: 0;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .timeline-date,
    .timeline-meta {
      font-size: var(--font-size-xs);
      color: var(--color-text-tertiary);
    }

    .timeline-meta {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .timeline-meta span {
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }

    .timeline-chevron {
      align-self: center;
      color: var(--color-text-tertiary);
      flex-shrink: 0;
    }

    .load-more-btn,
    .retry-btn {
      width: 100%;
      min-height: 40px;
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-md);
      background: var(--color-bg-default);
      color: var(--color-primary-base);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
      transition: all var(--duration-fast) ease;
    }

    .load-more-btn:hover:not(:disabled),
    .retry-btn:hover {
      background: var(--color-primary-light);
      border-color: var(--color-primary-border-subtle);
    }

    .load-more-btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

  `],
})
export class BookingCenterPanelComponent implements OnInit, OnDestroy {
  @Output() backClicked = new EventEmitter<void>();
  @Output() bookingSelected = new EventEmitter<number>();
  @Output() navigateRequested = new EventEmitter<BookingDetailResponse>();

  private readonly bookingApiService = inject(BookingApiService);
  private readonly pageSize = 10;
  private readonly fallbackHourlyRate = 2;
  private readonly parkingOptions = signal<NearbyParkingResponse[]>([]);
  private readonly now = signal(Date.now());
  private timerId: ReturnType<typeof setInterval> | null = null;

  @Input() set parkings(value: NearbyParkingResponse[] | null) {
    this.parkingOptions.set(value ?? []);
  }

  readonly currentReservation = signal<BookingDetailResponse | null>(null);
  readonly bookings = signal<BookingResponse[]>([]);
  readonly historyLoading = signal(true);
  readonly loadingMore = signal(false);
  readonly historyError = signal<string | null>(null);
  readonly currentPage = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);

  /** Only COMPLETED / CANCELLED / EXPIRED — sorted newest first */
  readonly pastBookings = computed(() =>
    [...this.bookings()]
      .filter((b) => b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'EXPIRED')
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
  );

  readonly hasMore = computed(() => this.currentPage() + 1 < this.totalPages());

  readonly subtitleLabel = computed(() => {
    const reservation = this.currentReservation();
    const pastCount = this.pastBookings().length;
    if (reservation && pastCount > 0) {
      return `Active reservation + ${pastCount} past`;
    }
    if (reservation) {
      return 'Active reservation';
    }
    if (this.historyLoading()) {
      return 'Loading';
    }
    return pastCount === 1 ? '1 past booking' : `${pastCount} past bookings`;
  });

  readonly reservationCountdown = computed(() => {
    const reservation = this.currentReservation();
    if (!reservation) {
      return '';
    }
    if (reservation.status === 'PENDING') {
      const minutes = Math.ceil((new Date(reservation.startTime).getTime() - this.now()) / 60000);
      return minutes > 0 ? `Starts in ${this.compactDuration(minutes)}` : 'Awaiting activation';
    }
    if (reservation.status === 'ACTIVE') {
      const minutes = Math.ceil((new Date(reservation.endTime).getTime() - this.now()) / 60000);
      return minutes > 0 ? `${this.compactDuration(minutes)} left` : 'Ending now';
    }
    return '';
  });

  ngOnInit(): void {
    this.timerId = setInterval(() => this.now.set(Date.now()), 30000);
    this.loadActiveReservation();
    this.loadPage(0);
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  loadPage(page: number): void {
    const firstPage = page === 0;
    this.historyError.set(null);

    if (firstPage) {
      this.historyLoading.set(true);
    } else {
      this.loadingMore.set(true);
    }

    this.bookingApiService
      .getBookingHistory(page, this.pageSize)
      .pipe(
        catchError(() => {
          this.historyError.set('Could not load past bookings.');
          return of(null);
        }),
        finalize(() => {
          this.historyLoading.set(false);
          this.loadingMore.set(false);
        })
      )
      .subscribe((response) => {
        if (!response) {
          return;
        }
        this.bookings.set(firstPage ? response.content : [...this.bookings(), ...response.content]);
        this.currentPage.set(response.number);
        this.totalPages.set(response.totalPages);
        this.totalElements.set(response.totalElements);
      });
  }

  loadNextPage(): void {
    if (!this.hasMore() || this.loadingMore()) {
      return;
    }
    this.loadPage(this.currentPage() + 1);
  }

  openBookingDetail(booking: BookingResponse): void {
    this.bookingSelected.emit(booking.id);
  }

  reservationParkingName(reservation: BookingDetailResponse): string {
    return reservation.parkingName || this.parkingFor(reservation)?.name || `Parking #${reservation.parkingId}`;
  }

  reservationAddress(reservation: BookingDetailResponse): string {
    return reservation.parkingAddress || 'Address not available';
  }

  reservationBadgeState(reservation: BookingDetailResponse): BookingBadgeState {
    return reservation.status === 'ACTIVE' ? 'good' : 'warn';
  }

  reservationDistance(reservation: BookingDetailResponse): string | null {
    const parking = this.parkingFor(reservation);
    if (!parking) {
      return null;
    }
    return parking.distanceMeters >= 1000
      ? `${(parking.distanceMeters / 1000).toFixed(1)} km`
      : `${parking.distanceMeters} m`;
  }

  reservationEndLabel(reservation: BookingDetailResponse): string {
    return new Date(reservation.endTime).toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  // History timeline helpers
  parkingName(booking: BookingResponse): string {
    return this.parkingFor(booking)?.name ?? `Parking #${booking.parkingId}`;
  }

  bookingTotalLabel(booking: BookingResponse): string {
    return this.currencyLabel(this.durationHours(booking) * this.hourlyRate(booking));
  }

  durationLabel(booking: BookingResponse): string {
    return this.hoursLabel(this.durationHours(booking));
  }

  fullDateLabel(booking: BookingResponse): string {
    return new Date(booking.startTime).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  statusClass(booking: BookingResponse): string {
    return booking.status.toLowerCase();
  }

  badgeState(booking: BookingResponse): BookingBadgeState {
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

  private loadActiveReservation(): void {
    this.bookingApiService
      .getActiveBooking()
      .pipe(catchError(() => of(null)))
      .subscribe((active) => this.currentReservation.set(active));
  }

  private parkingFor(booking: BookingResponse | BookingDetailResponse): NearbyParkingResponse | undefined {
    return this.parkingOptions().find((p) => p.id === booking.parkingId);
  }

  private hourlyRate(booking: BookingResponse): number {
    return this.parkingFor(booking)?.hourlyRate ?? this.fallbackHourlyRate;
  }

  private durationHours(booking: BookingResponse): number {
    const start = new Date(booking.startTime).getTime();
    const end = new Date(booking.endTime).getTime();
    return Math.max((end - start) / (1000 * 60 * 60), 0);
  }

  private currencyLabel(value: number): string {
    return Number.isInteger(value) ? `$${value}` : `$${value.toFixed(2)}`;
  }

  private hoursLabel(value: number): string {
    if (value >= 24) {
      const days = value / 24;
      return Number.isInteger(days) ? `${days}d` : `${days.toFixed(1)}d`;
    }
    return Number.isInteger(value) ? `${value}h` : `${value.toFixed(1)}h`;
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
}
