import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { BookingBadgeState, BookingDetailResponse } from '../../models/booking.model';
import { IconComponent } from '../../shared/components/icon.component';
import { StateBadgeComponent } from '../../shared/components/state-badge.component';

@Component({
  selector: 'app-booking-summary-card',
  standalone: true,
  imports: [CommonModule, IconComponent, StateBadgeComponent],
  template: `
    @if (booking) {
      <section class="summary-card" aria-label="Booking summary">
        <div class="summary-card__topline">
          <app-state-badge [label]="statusLabel" [state]="badgeState" />
          <span class="summary-card__countdown">{{ remainingLabel }}</span>
        </div>

        <div class="summary-card__parking">
          <h3>{{ parkingTitle() }}</h3>
          <p>
            <app-icon name="map-pin" [size]="14" [strokeWidth]="2" />
            <span>{{ parkingAddress() }}</span>
          </p>
        </div>

        <div class="summary-card__window">
          <app-icon name="clock" [size]="15" [strokeWidth]="2" />
          <span>{{ startLabel }}</span>
          <span class="summary-card__arrow" aria-hidden="true">&rarr;</span>
          <span>{{ endLabel }}</span>
        </div>
      </section>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .summary-card {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
        padding: var(--spacing-lg);
        border: 1px solid rgba(26, 115, 232, 0.16);
        border-radius: var(--radius-lg);
        background: linear-gradient(135deg, rgba(232, 240, 254, 0.9), rgba(255, 255, 255, 0.96));
        box-shadow: var(--shadow-xs);
      }

      .summary-card__topline {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--spacing-md);
      }

      .summary-card__countdown {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
        white-space: nowrap;
      }

      .summary-card__parking {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .summary-card__parking h3 {
        margin: 0;
        font-size: var(--font-size-base);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
        letter-spacing: var(--tracking-tight);
        line-height: var(--leading-tight);
      }

      .summary-card__parking p {
        margin: 0;
        display: flex;
        align-items: flex-start;
        gap: var(--spacing-xs);
        font-size: var(--font-size-xs);
        color: var(--color-text-secondary);
        line-height: var(--leading-relaxed);
      }

      .summary-card__parking app-icon,
      .summary-card__window app-icon {
        flex-shrink: 0;
        color: var(--color-primary-base);
      }

      .summary-card__window {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--spacing-xs);
        padding-top: var(--spacing-md);
        border-top: 1px solid rgba(26, 115, 232, 0.12);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        line-height: var(--leading-relaxed);
      }

      .summary-card__arrow {
        color: var(--color-text-tertiary);
      }
    `,
  ],
})
export class BookingSummaryCardComponent {
  @Input() booking: BookingDetailResponse | null = null;
  @Input() statusLabel = 'Active';
  @Input() badgeState: BookingBadgeState = 'good';
  @Input() remainingLabel = '';
  @Input() startLabel = '';
  @Input() endLabel = '';

  parkingTitle(): string {
    return this.booking?.parkingName || `Parking #${this.booking?.parkingId ?? ''}`;
  }

  parkingAddress(): string {
    return this.booking?.parkingAddress || 'Address not available';
  }
}