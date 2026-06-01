import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogService } from '../dialog.service';
import { IconComponent } from '../../../components/icon.component';
import { BookingDurationHours } from '../../../../models/booking.model';

export interface ReservationDialogData {
  parkingName: string;
  hourlyRate: number;
  parkingId: number;
}

export interface ReservationDialogResult {
  confirmed: boolean;
  durationHours: BookingDurationHours;
}

@Component({
  selector: 'app-reservation-dialog',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    @if (state(); as dialog) {
      <div class="reservation">
        <div class="reservation__header">
          <h3 class="reservation__title">Confirm reservation</h3>
          <button
            class="reservation__close"
            type="button"
            (click)="onClose()"
            aria-label="Close"
          >
            <app-icon name="x" [size]="18" [strokeWidth]="2" />
          </button>
        </div>

        <p class="reservation__parking-name">{{ data().parkingName }}</p>

        <div class="reservation__section">
          <span class="reservation__label">Select duration</span>
          <div class="reservation__chips">
            @for (opt of durationOptions; track opt.value) {
              <button
                type="button"
                class="reservation__chip"
                [class.reservation__chip--active]="selectedDuration() === opt.value"
                (click)="selectDuration(opt.value)"
              >
                {{ opt.label }}
              </button>
            }
          </div>
        </div>

        <div class="reservation__section">
          <span class="reservation__label">Estimated total</span>
          <span class="reservation__total">\${{ totalPrice() }}</span>
        </div>

        <p class="reservation__note">Reservation starts immediately.</p>

        <div class="reservation__actions">
          <button
            type="button"
            class="pf-button pf-button--secondary"
            (click)="onClose()"
          >
            Cancel
          </button>
          <button
            type="button"
            class="pf-button pf-button--primary"
            (click)="onConfirm()"
          >
            Confirm Reservation
          </button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .reservation {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
      }

      .reservation__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: var(--spacing-sm);
        border-bottom: 1px solid var(--color-border-subtle);
      }

      .reservation__title {
        margin: 0;
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        letter-spacing: var(--tracking-tight);
      }

      .reservation__close {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 0;
        border-radius: var(--radius-full);
        background: transparent;
        color: var(--color-text-tertiary);
        cursor: pointer;
        transition: all var(--duration-fast) ease;
      }

      .reservation__close:hover {
        background: var(--overlay-hover);
        color: var(--color-text-primary);
      }

      .reservation__parking-name {
        margin: 0;
        font-size: var(--font-size-base);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-primary);
      }

      .reservation__section {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .reservation__label {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-secondary);
      }

      .reservation__chips {
        display: flex;
        gap: var(--spacing-xs);
      }

      .reservation__chip {
        flex: 1;
        padding: 8px 0;
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-md);
        background: var(--color-bg-default);
        color: var(--color-text-secondary);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        cursor: pointer;
        transition: all var(--duration-fast) ease;
        text-align: center;
      }

      .reservation__chip:hover:not(.reservation__chip--active) {
        border-color: var(--color-primary-base);
        color: var(--color-primary-base);
      }

      .reservation__chip--active {
        background: var(--color-primary-base);
        border-color: var(--color-primary-base);
        color: var(--color-text-inverse);
      }

      .reservation__total {
        font-size: var(--font-size-2xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
        letter-spacing: var(--tracking-tight);
      }

      .reservation__note {
        margin: 0;
        font-size: var(--font-size-sm);
        color: var(--color-text-tertiary);
      }

      .reservation__actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-sm);
        padding-top: var(--spacing-sm);
      }

    `,
  ],
})
export class ReservationDialogComponent {
  private readonly dialogService = inject(DialogService);

  readonly state = this.dialogService.activeDialog;

  readonly durationOptions: { label: string; value: BookingDurationHours }[] = [
    { label: '1h', value: 1 },
    { label: '2h', value: 2 },
    { label: '4h', value: 4 },
    { label: 'Day', value: 24 },
  ];

  readonly selectedDuration = signal<BookingDurationHours>(1);

  readonly data = computed<ReservationDialogData>(() => {
    const config = this.state()?.config;
    return (config?.data as unknown as ReservationDialogData) ?? { parkingName: '', hourlyRate: 2, parkingId: 0 };
  });

  readonly totalPrice = computed(() => {
    const rate = this.data().hourlyRate;
    const hours = this.selectedDuration();
    return (rate * hours).toFixed(2);
  });

  selectDuration(value: BookingDurationHours): void {
    this.selectedDuration.set(value);
  }

  onConfirm(): void {
    const current = this.state();
    if (current) {
      current.ref.close({
        confirmed: true,
        durationHours: this.selectedDuration(),
      } as unknown);
    }
  }

  onClose(): void {
    const current = this.state();
    if (current) {
      current.ref.close(undefined);
    }
  }
}
