import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-booking-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="card">
      <h3>Create Booking</h3>
      <label>
        User ID
        <input type="text" [(ngModel)]="userId" placeholder="user-123" />
      </label>

      <label>
        Start
        <input type="datetime-local" [(ngModel)]="startTime" />
      </label>

      <label>
        End
        <input type="datetime-local" [(ngModel)]="endTime" />
      </label>

      <button (click)="submit()" [disabled]="!canSubmit">Book Slot</button>
    </section>
  `,
  styles: [
    `
      .card {
        display: grid;
        gap: 0.6rem;
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 1rem;
        background: var(--surface);
      }

      h3 {
        margin: 0 0 0.3rem;
      }

      label {
        display: grid;
        gap: 0.2rem;
        font-size: 0.92rem;
      }

      input {
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 0.55rem 0.65rem;
        font: inherit;
      }

      button {
        width: fit-content;
        border: 0;
        border-radius: 10px;
        padding: 0.55rem 0.9rem;
        background: var(--brand);
        color: #fff;
        cursor: pointer;
        font-weight: 700;
      }

      button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
    `
  ]
})
export class BookingWidgetComponent {
  @Input() parkingId = 0;
  @Output() bookingRequested = new EventEmitter<{
    parkingId: number;
    userId: string;
    startTime: string;
    endTime: string;
  }>();

  userId = '';
  startTime = '';
  endTime = '';

  get canSubmit(): boolean {
    return !!this.parkingId && !!this.userId && !!this.startTime && !!this.endTime;
  }

  submit(): void {
    if (!this.canSubmit) {
      return;
    }

    this.bookingRequested.emit({
      parkingId: this.parkingId,
      userId: this.userId,
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date(this.endTime).toISOString()
    });
  }
}
