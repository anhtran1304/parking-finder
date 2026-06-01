import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, computed, signal } from '@angular/core';
import { BookingDetailResponse } from '../../models/booking.model';
import { IconComponent } from '../../shared/components/icon.component';
import { StateBadgeComponent } from '../../shared/components/state-badge.component';

@Component({
  selector: 'app-active-booking-banner',
  standalone: true,
  imports: [CommonModule, IconComponent, StateBadgeComponent],
  template: `
    @if (activeBooking(); as booking) {
      <aside class="active-banner" [class.active-banner--pending]="booking.status === 'PENDING'" aria-label="Current booking">
        <div class="active-banner__icon">
          <app-icon name="clock" [size]="18" [strokeWidth]="2" />
        </div>

        <div class="active-banner__content">
          <div class="active-banner__topline">
            <app-state-badge [label]="statusLabel()" [state]="badgeState()" />
            <span class="active-banner__time">{{ remainingLabel() }}</span>
          </div>
          <h2 class="active-banner__title">{{ booking.parkingName }}</h2>
          <p class="active-banner__meta">
            <span>
              <app-icon name="map-pin" [size]="13" [strokeWidth]="2" />
              {{ booking.parkingAddress || 'Parking #' + booking.parkingId }}
            </span>
            <span>{{ timeWindowLabel() }}</span>
          </p>
        </div>

        <div class="active-banner__actions">
          <button
            class="active-banner__button"
            type="button"
            title="View booking detail"
            aria-label="View active booking detail"
            (click)="viewClicked.emit(booking.id)"
          >
            <app-icon name="arrow-right" [size]="16" [strokeWidth]="2" />
          </button>
          <button
            class="active-banner__button"
            type="button"
            title="Dismiss"
            aria-label="Dismiss active booking banner"
            (click)="dismissClicked.emit()"
          >
            <app-icon name="x" [size]="16" [strokeWidth]="2" />
          </button>
        </div>
      </aside>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .active-banner {
        width: 100%;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-xl);
        background: var(--glass-bg-solid);
        backdrop-filter: blur(var(--glass-blur));
        -webkit-backdrop-filter: blur(var(--glass-blur));
        box-shadow: var(--shadow-float);
      }

      .active-banner__icon {
        width: 34px;
        height: 34px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-lg);
        background: var(--badge-available-bg);
        color: var(--badge-available-text);
        flex-shrink: 0;
      }

      .active-banner--pending .active-banner__icon {
        background: var(--badge-limited-bg);
        color: var(--badge-limited-text);
      }

      .active-banner__content {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-2xs);
      }

      .active-banner__topline {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
      }

      .active-banner__time {
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-secondary);
        white-space: nowrap;
      }

      .active-banner__title {
        margin: 0;
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .active-banner__meta {
        margin: 0;
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        min-width: 0;
        font-size: var(--font-size-xs);
        color: var(--color-text-tertiary);
      }

      .active-banner__meta span {
        min-width: 0;
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-2xs);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .active-banner__actions {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-xs);
      }

      .active-banner__button {
        width: 30px;
        height: 30px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--color-border-subtle);
        border-radius: var(--radius-full);
        background: var(--color-bg-default);
        color: var(--color-text-secondary);
        cursor: pointer;
        transition: all var(--duration-fast) ease;
      }

      .active-banner__button:hover {
        color: var(--color-text-primary);
        box-shadow: var(--shadow-sm);
        transform: translateY(-1px);
      }

      @media (max-width: 767px) {
        .active-banner {
          grid-template-columns: minmax(0, 1fr) auto;
        }

        .active-banner__icon {
          display: none;
        }

        .active-banner__meta {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--spacing-2xs);
        }
      }
    `,
  ],
})
export class ActiveBookingBannerComponent implements OnInit, OnDestroy {
  @Output() viewClicked = new EventEmitter<number>();
  @Output() dismissClicked = new EventEmitter<void>();

  readonly activeBooking = signal<BookingDetailResponse | null>(null);
  private readonly now = signal(Date.now());
  private timerId: ReturnType<typeof setInterval> | null = null;

  @Input() set booking(value: BookingDetailResponse | null) {
    this.activeBooking.set(value);
  }

  readonly remainingLabel = computed(() => {
    const booking = this.activeBooking();
    if (!booking) {
      return '';
    }

    if (booking.status === 'PENDING') {
      const minutesUntilStart = Math.ceil((new Date(booking.startTime).getTime() - this.now()) / 60000);
      return minutesUntilStart > 0 ? `Starts in ${this.compactDuration(minutesUntilStart)}` : 'Awaiting activation';
    }

    const remainingMinutes = Math.ceil((new Date(booking.endTime).getTime() - this.now()) / 60000);
    if (remainingMinutes <= 0) {
      return 'Ending now';
    }

    return `${this.compactDuration(remainingMinutes)} left`;
  });

  readonly statusLabel = computed(() => {
    const status = this.activeBooking()?.status ?? 'ACTIVE';
    return status.charAt(0) + status.slice(1).toLowerCase();
  });

  readonly badgeState = computed(() => {
    const status = this.activeBooking()?.status;
    if (status === 'PENDING') {
      return 'warn';
    }

    if (status === 'CANCELLED' || status === 'EXPIRED') {
      return 'danger';
    }

    return 'good';
  });

  private compactDuration(totalMinutes: number): string {
    if (totalMinutes < 60) {
      return `${totalMinutes} min`;
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

  readonly timeWindowLabel = computed(() => {
    const booking = this.activeBooking();
    if (!booking) {
      return '';
    }

    const start = new Date(booking.startTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    const end = new Date(booking.endTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${start} - ${end}`;
  });

  ngOnInit(): void {
    this.timerId = setInterval(() => this.now.set(Date.now()), 30000);
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }
}