import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BookingResponse } from '../../models/booking.model';
import { IconComponent } from '../../shared/components/icon.component';

type BookingStatus = BookingResponse['status'];

@Component({
  selector: 'app-booking-actions',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <section class="actions" aria-label="Booking actions">
      @if (status === 'ACTIVE') {
        <button class="pf-button pf-button--primary pf-button--sm" type="button" (click)="navigateClicked.emit()">
          <app-icon name="navigation" [size]="15" [strokeWidth]="2" />
          Navigate
        </button>
        <button class="pf-button pf-button--danger-soft pf-button--sm" type="button" (click)="cancelClicked.emit()">
          <app-icon name="ban" [size]="15" [strokeWidth]="2" />
          Cancel booking
        </button>
        <button
          class="pf-button pf-button--secondary pf-button--sm pf-button--wide"
          type="button"
          disabled
          aria-label="Extend booking is not available yet"
          title="Coming soon"
        >
          <app-icon name="clock" [size]="15" [strokeWidth]="2" />
          Extend booking
        </button>
      } @else if (status === 'PENDING') {
        <button class="pf-button pf-button--primary pf-button--sm" type="button" (click)="navigateClicked.emit()">
          <app-icon name="navigation" [size]="15" [strokeWidth]="2" />
          Navigate
        </button>
        <button class="pf-button pf-button--danger-soft pf-button--sm" type="button" (click)="cancelClicked.emit()">
          <app-icon name="x-circle" [size]="15" [strokeWidth]="2" />
          Cancel booking
        </button>
      } @else {
        <button class="pf-button pf-button--primary pf-button--sm" type="button" (click)="bookAgainClicked.emit()">
          Book again
          <app-icon name="arrow-right" [size]="15" [strokeWidth]="2" />
        </button>
        <button class="pf-button pf-button--secondary pf-button--sm" type="button" (click)="viewParkingClicked.emit()">
          <app-icon name="map-pin" [size]="15" [strokeWidth]="2" />
          View parking
        </button>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-sm);
      }

    `,
  ],
})
export class BookingActionsComponent {
  @Input() status: BookingStatus = 'PENDING';
  @Output() navigateClicked = new EventEmitter<void>();
  @Output() viewParkingClicked = new EventEmitter<void>();
  @Output() bookAgainClicked = new EventEmitter<void>();
  @Output() cancelClicked = new EventEmitter<void>();
}
