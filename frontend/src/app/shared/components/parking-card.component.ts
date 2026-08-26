import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconComponent } from './icon.component';

export type ParkingAvailability = 'available' | 'limited' | 'full';

@Component({
  selector: 'app-parking-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <article
      class="card"
      [class.card--selected]="selected"
      [class.card--hovered]="hovered"
      (click)="cardSelected.emit()"
      (mouseenter)="cardHovered.emit()"
      (mouseleave)="cardLeft.emit()"
    >
      <h3 class="card__name">{{ name }}</h3>

      <div class="card__meta">
        <span class="card__distance">
          <app-icon name="map-pin" [size]="13" [strokeWidth]="2" />
          {{ distance }}
        </span>
        <span class="card__price">\${{ price }}/hr</span>
      </div>

      <div class="card__status-row">
        <div class="card__status" [ngClass]="'card__status--' + availability">
          <span class="card__dot"></span>
          <span class="card__status-text">{{ statusLabel }}</span>
        </div>
        <span
          class="card__freshness"
          [attr.title]="freshnessTitle"
          [attr.aria-label]="freshnessTitle"
        >{{ freshnessLabel }}</span>
      </div>
    </article>
  `,
  styles: [
    `
      .card {
        padding: var(--spacing-lg) var(--spacing-xl);
        border-radius: var(--radius-lg);
        border: 1px solid var(--color-border-subtle);
        background: var(--color-bg-default);
        cursor: pointer;
        transition:
          transform var(--duration-fast) var(--ease-out-expo),
          box-shadow var(--duration-fast) var(--ease-out-expo),
          border-color var(--duration-fast) var(--ease-out-expo),
          background var(--duration-fast) var(--ease-out-expo);
      }

      .card:hover,
      .card--hovered {
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
        border-color: var(--color-border-default);
      }

      .card--selected {
        background: var(--color-primary-light);
        border-color: rgba(26, 115, 232, 0.35);
        box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.08), var(--shadow-md);
        transform: translateY(-1px);
      }

      .card__name {
        margin: 0;
        font-size: var(--font-size-md);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        line-height: var(--leading-snug);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .card__meta {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        margin-top: var(--spacing-sm);
      }

      .card__distance {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        font-size: var(--font-size-xs);
        color: var(--color-text-secondary);
      }

      .card__price {
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-medium);
        color: var(--color-primary-base);
      }

      .card__status-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--spacing-sm);
        margin-top: var(--spacing-sm);
      }

      .card__status {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
      }

      .card__dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .card__status-text {
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-medium);
      }

      .card__freshness {
        flex-shrink: 0;
        color: var(--color-text-tertiary);
        font-size: 10px;
        font-weight: var(--font-weight-medium);
        white-space: nowrap;
      }

      .card__status--available .card__dot {
        background: var(--color-primary-base);
        box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.15);
      }
      .card__status--available .card__status-text {
        color: var(--color-primary-base);
      }

      .card__status--limited .card__dot {
        background: var(--color-parking-limited);
        box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.15);
      }
      .card__status--limited .card__status-text {
        color: var(--badge-limited-text);
      }

      .card__status--full .card__dot {
        background: var(--color-parking-full);
      }
      .card__status--full .card__status-text {
        color: var(--color-text-disabled);
      }
    `,
  ],
})
export class ParkingCardComponent {
  @Input() name = '';
  @Input() distance = '';
  @Input() price = '0';
  @Input() availableSlots = 0;
  @Input() totalSlots = 0;
  @Input({ required: true }) updatedAt = '';
  @Input({ required: true }) nowMs = Date.now();
  @Input() selected = false;
  @Input() hovered = false;
  @Output() cardSelected = new EventEmitter<void>();
  @Output() cardHovered = new EventEmitter<void>();
  @Output() cardLeft = new EventEmitter<void>();

  get availability(): ParkingAvailability {
    if (this.availableSlots <= 0) return 'full';
    if (this.availableSlots <= 5) return 'limited';
    return 'available';
  }

  get statusLabel(): string {
    if (this.availableSlots <= 0) return '0 spots \u2014 full';
    if (this.availableSlots <= 5) return `${this.availableSlots} spots left`;
    return `${this.availableSlots} spots available`;
  }

  get freshnessLabel(): string {
    const updatedAtMs = Date.parse(this.updatedAt);
    if (Number.isNaN(updatedAtMs)) {
      return 'Update time unavailable';
    }

    const ageSeconds = Math.max(0, Math.floor((this.nowMs - updatedAtMs) / 1000));
    if (ageSeconds < 5) {
      return 'Updated just now';
    }
    if (ageSeconds < 60) {
      return `Updated ${ageSeconds}s ago`;
    }

    const ageMinutes = Math.floor(ageSeconds / 60);
    if (ageMinutes < 60) {
      return `Updated ${ageMinutes}m ago`;
    }

    const ageHours = Math.floor(ageMinutes / 60);
    if (ageHours < 24) {
      return `Updated ${ageHours}h ago`;
    }

    return `Updated ${Math.floor(ageHours / 24)}d ago`;
  }

  get freshnessTitle(): string {
    const updatedAtMs = Date.parse(this.updatedAt);
    if (Number.isNaN(updatedAtMs)) {
      return 'Availability update time unavailable';
    }
    return `Last updated ${new Date(updatedAtMs).toLocaleString()}`;
  }
}
