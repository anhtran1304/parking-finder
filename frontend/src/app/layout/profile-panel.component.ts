import { Component, EventEmitter, OnInit, Output, computed, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { AuthApiService } from '../core/services/auth-api.service';
import { AuthSessionService } from '../core/services/auth-session.service';
import { BookingApiService } from '../core/services/booking-api.service';
import { BookingResponse } from '../models/booking.model';
import { IconComponent } from '../shared/components/icon.component';
import { PanelShellComponent } from '../shared/ui/panel-shell/panel-shell.component';

@Component({
  selector: 'app-profile-panel',
  standalone: true,
  imports: [IconComponent, PanelShellComponent],
  template: `
    <app-panel-shell ariaLabel="Profile">
      <!-- ── Profile Header ───────────────────────────────────── -->
      <div panelHeader class="pf-panel-header pf-panel-header--block profile-header">
        <div class="profile-top-row">
          <div class="profile-summary">
            <div class="avatar">{{ userInitials() }}</div>
            <div class="identity-copy">
              <h2 class="user-name">{{ session()?.fullName ?? 'Parking User' }}</h2>
              <p class="user-email">{{ session()?.email }}</p>
            </div>
          </div>

          <button class="pf-icon-button" (click)="closeClicked.emit()" aria-label="Close profile">
            <app-icon name="x" [size]="20" [strokeWidth]="2" />
          </button>
        </div>
      </div>

      <!-- ── Scrollable Body ──────────────────────────────────── -->
      <div panelBody class="pf-panel-body pf-panel-body--spacious">

        <!-- Recent Booking Preview -->
        <div class="section">
          <h3 class="section-title">Recent Booking</h3>

          @if (bookingsLoading()) {
            <div class="list-card"><div class="skeleton-row"></div></div>
          } @else if (recentBookings().length === 0) {
            <div class="pf-empty-state pf-empty-state--plain">
              <app-icon name="calendar" [size]="20" />
              <span>No bookings yet</span>
            </div>
          } @else {
            <div class="list-card">
              <div class="booking-row">
                <span class="booking-accent"
                  [class]="'booking-accent--' + recentBookings()[0].status.toLowerCase()">
                </span>
                <div class="row-content">
                  <span class="row-label">Parking #{{ recentBookings()[0].parkingId }}</span>
                  <span class="row-sub">{{ bookingDateLabel(recentBookings()[0]) }} · {{ durationLabel(recentBookings()[0]) }}</span>
                </div>
                <span class="status-badge"
                  [class]="'status-badge--' + recentBookings()[0].status.toLowerCase()">
                  {{ recentBookings()[0].status }}
                </span>
              </div>
              <button class="action-link" type="button" (click)="historyRequested.emit()">
                My Bookings <app-icon name="arrow-right" [size]="11" />
              </button>
            </div>
          }
        </div>

        <!-- Vehicles Preview (max 2) -->
        <div class="section">
          <h3 class="section-title">Vehicles <span class="section-count">(2)</span></h3>
          <div class="list-card">
            <div class="vehicle-row">
              <span class="vehicle-icon"><app-icon name="car" [size]="14" /></span>
              <div class="row-content">
                <span class="row-label">Toyota Camry</span>
                <span class="row-sub">51A-12345</span>
              </div>
            </div>
            <div class="row-divider"></div>
            <div class="vehicle-row"> 
              <span class="vehicle-icon"><app-icon name="car" [size]="14" /></span>
              <div class="row-content">
                <span class="row-label">Honda Civic</span>
                <span class="row-sub">59B-56789</span>
              </div>
            </div>
            <button class="action-link">
              View All <app-icon name="arrow-right" [size]="11" />
            </button>
          </div>
        </div>

        <!-- Payment Preview (primary card only) -->
        <div class="section">
          <h3 class="section-title">Payment Methods</h3>
          <div class="list-card">
            <div class="payment-row">
              <span class="payment-scheme">VISA</span>
              <div class="row-content">
                <span class="row-label">Visa ••••1234</span>
                <span class="row-sub">Primary</span>
              </div>
            </div>
            <button class="action-link">
              Manage <app-icon name="arrow-right" [size]="11" />
            </button>
          </div>
        </div>

        <!-- Sign Out -->
        <div class="section">
          <button class="signout-btn" (click)="onSignOut()" [disabled]="signingOut()">
            <app-icon name="log-out" [size]="15" />
            {{ signingOut() ? 'Signing out…' : 'Sign Out' }}
          </button>
        </div>
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

    .profile-top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-lg);
      width: 100%;
    }

    .profile-summary {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
      min-width: 0;
      flex: 1;
    }

    .identity-copy {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2xs);
    }

    /* Compact avatar keeps identity visible without hero height */
    .avatar {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: var(--color-primary-light);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-bold);
      color: var(--color-primary-base);
      letter-spacing: var(--tracking-tight);
      flex-shrink: 0;
    }

    .user-name {
      margin: 0;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      letter-spacing: var(--tracking-tight);
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-email {
      margin: 0;
      font-size: var(--font-size-xs);
      color: var(--color-text-tertiary);
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .edit-btn {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: var(--spacing-sm);
      width: 100%;
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--radius-sm);
      background: transparent;
      border: 1px solid var(--color-border-subtle);
      color: var(--color-primary-base);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
      transition: all var(--duration-fast) ease;
    }
    .edit-btn:hover {
      background: var(--color-primary-light);
      color: var(--color-primary-base);
    }

    /* ── Section scaffold ────────────────────────────────────── */
    .section {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      padding: 0;
    }
    .section-title {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0;
    }
    .section-count {
      font-weight: var(--font-weight-medium);
      letter-spacing: 0;
      text-transform: none;
    }

    /* ── List card ───────────────────────────────────────────── */
    .list-card {
      background: var(--color-bg-default);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border-subtle);
      overflow: hidden;
      box-shadow: var(--shadow-xs);
    }

    .list-card + .list-card {
      margin-top: var(--spacing-lg);
    }

    .vehicle-row, .payment-row, .booking-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-lg);
    }
    .booking-row {
      cursor: pointer;
      transition: background var(--duration-fast) ease;
    }

    .row-divider {
      height: 1px;
      background: var(--color-border-subtle);
      margin: 0 var(--spacing-lg);
    }

    .row-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2xs);
    }
    .row-label {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .row-sub {
      font-size: 0.6875rem;
      color: var(--color-text-tertiary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ── Vehicle rows ────────────────────────────────────────── */
    .vehicle-icon {
      width: 27px;
      height: 27px;
      border-radius: var(--radius-sm);
      background: var(--color-primary-light);
      color: var(--color-primary-base);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    /* ── Payment rows ────────────────────────────────────────── */
    .payment-scheme {
      width: 36px;
      height: 22px;
      border-radius: var(--radius-sm);
      background: var(--color-primary-light);
      color: var(--color-primary-base);
      border: 1px solid var(--color-primary-border-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.5625rem;
      font-weight: var(--font-weight-bold);
      letter-spacing: 0.03em;
      flex-shrink: 0;
    }

    /* ── Shared section footer link ──────────────────────────── */
    .action-link {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 5px;
      width: 100%;
      padding: 9px 12px;
      background: transparent;
      border: none;
      border-top: 1px solid var(--color-border-subtle);
      cursor: pointer;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      color: var(--color-primary-base);
      transition: background var(--duration-fast) ease;
    }
    .action-link:hover { background: var(--color-primary-light); }

    /* ── Booking rows ────────────────────────────────────────── */
    .booking-row:hover { background: var(--color-bg-subtle); }

    .booking-accent {
      width: 3px;
      height: 30px;
      border-radius: var(--radius-full);
      flex-shrink: 0;
    }
    .booking-accent--active    { background: var(--color-parking-available, #10B981); }
    .booking-accent--pending   { background: var(--color-parking-limited, #F59E0B); }
    .booking-accent--completed { background: var(--color-border-default); }
    .booking-accent--cancelled { background: var(--color-border-default); }
    .booking-accent--expired   { background: var(--color-status-error); }

    .status-badge {
      font-size: 0.575rem;
      font-weight: var(--font-weight-semibold);
      padding: 2px 6px;
      border-radius: var(--radius-full);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      flex-shrink: 0;
    }
    .status-badge--active    { background: var(--badge-available-bg); color: var(--badge-available-text); }
    .status-badge--pending   { background: var(--badge-limited-bg); color: var(--badge-limited-text); }
    .status-badge--completed { background: var(--color-bg-subtle); color: var(--color-text-tertiary); }
    .status-badge--cancelled { background: var(--color-bg-subtle); color: var(--color-text-tertiary); }
    .status-badge--expired   { background: var(--badge-full-bg); color: var(--badge-full-text); }

    /* ── Skeleton loading ────────────────────────────────────── */
    .skeleton-row {
      height: 50px;
      margin: 0;
      background: linear-gradient(
        90deg,
        var(--color-bg-subtle) 25%,
        var(--color-border-subtle) 50%,
        var(--color-bg-subtle) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position:  200% 0; }
    }

    /* ── Sign out ────────────────────────────────────────────── */
    .signout-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      width: 100%;
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      background: var(--color-bg-subtle);
      border: 1px solid var(--color-border-subtle);
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      transition: all var(--duration-fast) ease;
    }
    .signout-btn:hover {
      background: #FEF2F2;
      border-color: var(--color-danger-border-strong);
      color: var(--color-status-error);
    }
    .signout-btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

  `],
})
export class ProfilePanelComponent implements OnInit {
  @Output() closeClicked = new EventEmitter<void>();
  @Output() historyRequested = new EventEmitter<void>();
  @Output() signedOut = new EventEmitter<void>();

  private readonly authSessionService = inject(AuthSessionService);
  private readonly authApiService = inject(AuthApiService);
  private readonly bookingApiService = inject(BookingApiService);

  readonly session = this.authSessionService.session;

  readonly userInitials = computed(() => {
    const name = this.session()?.fullName ?? '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'PF';
  });

  readonly recentBookings = signal<BookingResponse[]>([]);
  readonly bookingsLoading = signal(true);
  readonly signingOut = signal(false);

  ngOnInit(): void {
    this.bookingApiService
      .getBookingHistory(0, 1)
      .pipe(catchError(() => of({ content: [] as BookingResponse[], totalElements: 0, totalPages: 0, size: 1, number: 0 })))
      .subscribe((page) => {
        this.recentBookings.set(page.content);
        this.bookingsLoading.set(false);
      });
  }

  onSignOut(): void {
    if (this.signingOut()) return;
    this.signingOut.set(true);
    this.authApiService
      .logout()
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.authSessionService.clearSession();
        this.signingOut.set(false);
        this.signedOut.emit();
      });
  }

  bookingDateLabel(booking: BookingResponse): string {
    const date = new Date(booking.createdAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  durationLabel(booking: BookingResponse): string {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    const hours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    return hours >= 24 ? '1 day' : `${hours}h`;
  }
}
