import { AsyncPipe, CommonModule, DatePipe, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BehaviorSubject, Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { BookingWidgetComponent } from '../booking/booking-widget.component';
import { BookingApiService } from '../../core/services/booking-api.service';
import { ParkingApiService } from '../../core/services/parking-api.service';
import { CreateBookingRequest } from '../../models/booking.model';
import { ParkingDetailResponse } from '../../models/parking.model';
import { StateBadgeComponent } from '../../shared/components/state-badge.component';

@Component({
  selector: 'app-parking-detail',
  standalone: true,
  imports: [CommonModule, AsyncPipe, RouterLink, DatePipe, NgIf, BookingWidgetComponent, StateBadgeComponent],
  template: `
    <a routerLink="/" class="back">← Back to map</a>

    <ng-container *ngIf="parking$ | async as parking; else loading">
      <section class="card">
        <h2>{{ parking.name }}</h2>
        <p>
          Last updated: <strong>{{ parking.updatedAt | date: 'mediumTime' }}</strong>
        </p>
        <p>
          Coordinates: {{ parking.lat | number: '1.4-4' }}, {{ parking.lng | number: '1.4-4' }}
        </p>

        <app-state-badge
          [label]="badgeLabel(parking.availableSlots)"
          [state]="badgeState(parking.availableSlots)"
        ></app-state-badge>
      </section>

      <section class="message success" *ngIf="successMessage$ | async as successMessage">
        {{ successMessage }}
      </section>
      <section class="message error" *ngIf="errorMessage$ | async as errorMessage">
        {{ errorMessage }}
      </section>

      <app-booking-widget
        [parkingId]="parking.id"
        (bookingRequested)="onBookingRequested($event)"
      ></app-booking-widget>
    </ng-container>

    <ng-template #loading>
      <section class="card">
        <p>Loading parking detail...</p>
      </section>
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: grid;
        gap: 0.9rem;
      }

      .back {
        text-decoration: none;
        width: fit-content;
        font-weight: 700;
      }

      .card {
        border: 1px solid var(--border);
        border-radius: 12px;
        background: var(--surface);
        padding: 1rem;
      }

      h2 {
        margin-top: 0;
      }

      .message {
        border-radius: 10px;
        padding: 0.7rem 0.9rem;
        border: 1px solid transparent;
      }

      .success {
        background: #e3f5ea;
        border-color: #c6e9d3;
      }

      .error {
        background: #fae4e4;
        border-color: #f3cece;
      }
    `
  ]
})
export class ParkingDetailComponent {
  readonly successMessage$ = new BehaviorSubject<string>('');
  readonly errorMessage$ = new BehaviorSubject<string>('');

  readonly parking$: Observable<ParkingDetailResponse> = this.route.paramMap.pipe(
    map((params) => Number(params.get('id'))),
    switchMap((parkingId) => this.parkingApiService.pollParkingDetail(parkingId)),
    catchError(() => {
      this.errorMessage$.next('Unable to load parking details.');
      return of({
        id: 0,
        name: 'Unavailable',
        totalSlots: 0,
        availableSlots: 0,
        lat: 0,
        lng: 0,
        updatedAt: new Date().toISOString()
      });
    })
  );

  constructor(
    private readonly route: ActivatedRoute,
    private readonly parkingApiService: ParkingApiService,
    private readonly bookingApiService: BookingApiService
  ) {}

  onBookingRequested(request: CreateBookingRequest): void {
    this.successMessage$.next('');
    this.errorMessage$.next('');

    this.bookingApiService
      .createBooking(request)
      .pipe(
        tap((response) => {
          this.parkingApiService.evictParkingDetail(response.parkingId);
          this.successMessage$.next(`Booking #${response.id} created successfully.`);
        }),
        catchError((error) => {
          const backendMessage = error?.error?.message;
          this.errorMessage$.next(backendMessage ?? 'Booking failed. Please try again.');
          return of(null);
        })
      )
      .subscribe();
  }

  badgeState(availableSlots: number): 'good' | 'warn' | 'danger' {
    if (availableSlots <= 0) {
      return 'danger';
    }
    if (availableSlots <= 5) {
      return 'warn';
    }
    return 'good';
  }

  badgeLabel(availableSlots: number): string {
    if (availableSlots <= 0) {
      return 'Full';
    }
    if (availableSlots <= 5) {
      return `Almost full (${availableSlots})`;
    }
    return `${availableSlots} slots available`;
  }
}
