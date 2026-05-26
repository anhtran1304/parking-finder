import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, of, tap } from 'rxjs';
import { BookingApiService } from '../core/services/booking-api.service';
import { ParkingApiService } from '../core/services/parking-api.service';
import { ParkingMapComponent } from '../features/parking/parking-map.component';
import { CreateBookingRequest, ReservePayload } from '../models/booking.model';
import { NearbyParkingResponse } from '../models/parking.model';
import { DetailPanelComponent } from './detail-panel.component';
import { SidebarComponent } from './sidebar.component';
import { environment } from '../../environments/environment';

export type ParkingFilter = 'available' | 'ev' | 'covered' | 'cheap';
type BookingFeedback = { type: 'success' | 'error'; message: string };

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, SidebarComponent, ParkingMapComponent, DetailPanelComponent],
  template: `
    <div class="shell">
      <app-parking-map
        class="shell__map"
        [parkings]="filteredParkings()"
        [selectedId]="selectedParking()?.id ?? null"
        [hoveredId]="hoveredParkingId()"
        (markerClicked)="onParkingSelected($event)"
        (markerHovered)="onMarkerHovered($event)"
        (markerLeft)="onMarkerLeft()"
      ></app-parking-map>

      <div class="shell__vignette"></div>

      <app-sidebar
        class="shell__sidebar"
        [parkings]="filteredParkings()"
        [selectedId]="selectedParking()?.id ?? null"
        [hoveredId]="hoveredParkingId()"
        [activeFilters]="activeFilters()"
        (parkingSelected)="onParkingSelected($event)"
        (parkingHovered)="onCardHovered($event)"
        (parkingLeft)="onCardLeft()"
        (searchChange)="onSearch($event)"
        (filterToggled)="onFilterToggle($event)"
      ></app-sidebar>

      <app-detail-panel
        *ngIf="selectedParking()"
        class="shell__detail"
        [parking]="selectedParking()"
        [reserveDisabled]="bookingInFlight() || (selectedParking()?.availableSlots ?? 0) <= 0"
        [reserveLoading]="bookingInFlight()"
        [reserveLabel]="bookingInFlight() ? 'Reserving...' : 'Reserve Spot'"
        (reserveClicked)="onReserve($event)"
        (navigateClicked)="onNavigate($event)"
        (closeClicked)="onDeselect()"
      ></app-detail-panel>

      <div
        *ngIf="bookingFeedback() as feedback"
        class="shell__feedback"
        [class.shell__feedback--success]="feedback.type === 'success'"
        [class.shell__feedback--error]="feedback.type === 'error'"
      >
        {{ feedback.message }}
      </div>
    </div>
  `,
  styles: [
    `
      .shell {
        position: relative;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
      }

      .shell__map {
        position: absolute;
        inset: 0;
        z-index: 0;
      }

      .shell__vignette {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 120px;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.04), transparent);
        pointer-events: none;
        z-index: 1;
      }

      .shell__sidebar {
        position: absolute;
        top: 20px;
        left: 20px;
        bottom: 20px;
        width: 360px;
        display: block;
        max-height: calc(100vh - 40px);
        z-index: 10;
        animation: panelSlideIn 0.4s var(--ease-out-expo) both;
      }

      .shell__detail {
        position: absolute;
        top: 20px;
        right: 20px;
        width: 340px;
        max-height: calc(100vh - 40px);
        z-index: 10;
        animation: panelSlideInRight 0.35s var(--ease-out-expo) both;
      }

      .shell__feedback {
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 20;
        width: min(420px, calc(100vw - 40px));
        padding: 12px 16px;
        border-radius: var(--radius-md);
        border: 1px solid transparent;
        box-shadow: var(--shadow-float);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        text-align: center;
        backdrop-filter: blur(var(--glass-blur));
        -webkit-backdrop-filter: blur(var(--glass-blur));
      }

      .shell__feedback--success {
        background: var(--badge-available-bg);
        border-color: rgba(46, 125, 50, 0.2);
        color: var(--badge-available-text);
      }

      .shell__feedback--error {
        background: var(--badge-full-bg);
        border-color: rgba(198, 40, 40, 0.18);
        color: var(--badge-full-text);
      }

      @media (max-width: 1279px) {
        .shell__sidebar {
          width: 320px;
        }

        .shell__detail {
          width: 300px;
        }
      }

      @media (max-width: 767px) {
        .shell__sidebar {
          top: auto;
          left: 12px;
          right: 12px;
          bottom: 12px;
          width: auto;
          max-height: 45vh;
        }

        .shell__detail {
          display: none;
        }
      }
    `,
  ],
})
export class ShellComponent implements OnInit {
  parkings = signal<NearbyParkingResponse[]>([]);
  selectedParking = signal<NearbyParkingResponse | null>(null);
  hoveredParkingId = signal<number | null>(null);
  activeFilters = signal<ParkingFilter[]>([]);
  searchQuery = signal('');
  bookingInFlight = signal(false);
  bookingFeedback = signal<BookingFeedback | null>(null);

  filteredParkings = computed(() => {
    const all = this.parkings();
    const filters = this.activeFilters();
    const q = this.searchQuery().toLowerCase();

    return all.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      for (const f of filters) {
        if (f === 'available' && p.availableSlots <= 0) return false;
      }
      return true;
    });
  });

  constructor(
    private readonly parkingApiService: ParkingApiService,
    private readonly bookingApiService: BookingApiService
  ) {}

  ngOnInit(): void {
    const center = environment.defaultMapCenter;
    this.parkingApiService
      .getNearby(center.lat, center.lng, environment.defaultRadiusMeters)
      .pipe(
        catchError(() => of([])),
        tap((data) => console.log('Fetched parkings:', data))
      )
      .subscribe((data) => this.parkings.set(data));
  }

  onParkingSelected(parking: NearbyParkingResponse): void {
    this.selectedParking.set(parking);
    this.bookingFeedback.set(null);
  }

  onDeselect(): void {
    this.selectedParking.set(null);
    this.bookingFeedback.set(null);
  }

  onCardHovered(parking: NearbyParkingResponse): void {
    this.hoveredParkingId.set(parking.id);
  }

  onCardLeft(): void {
    this.hoveredParkingId.set(null);
  }

  onMarkerHovered(parking: NearbyParkingResponse): void {
    this.hoveredParkingId.set(parking.id);
  }

  onMarkerLeft(): void {
    this.hoveredParkingId.set(null);
  }

  onFilterToggle(filter: ParkingFilter): void {
    const current = this.activeFilters();
    if (current.includes(filter)) {
      this.activeFilters.set(current.filter((f) => f !== filter));
    } else {
      this.activeFilters.set([...current, filter]);
    }
  }

  onSearch(query: string): void {
    this.searchQuery.set(query.trim());
  }

  onReserve(payload: ReservePayload): void {
    if (this.bookingInFlight()) return;

    const parking = this.selectedParking();
    if (!parking) return;

    if (parking.availableSlots <= 0) {
      this.bookingFeedback.set({
        type: 'error',
        message: 'No slots are available for this parking.',
      });
      return;
    }

    this.bookingInFlight.set(true);
    this.bookingFeedback.set(null);

    this.bookingApiService
      .createBooking(this.buildBookingRequest(payload))
      .pipe(
        tap((response) => {
          this.applyBookedSlot(response.parkingId);
          this.parkingApiService.evictParkingDetail(response.parkingId);
          this.bookingFeedback.set({
            type: 'success',
            message: `Booking #${response.id} confirmed — ${payload.durationHours === 24 ? '1 day' : payload.durationHours + 'h'}.`,
          });
        }),
        catchError((error: HttpErrorResponse) => {
          this.bookingFeedback.set({
            type: 'error',
            message: this.bookingErrorMessage(error),
          });
          return of(null);
        }),
        finalize(() => this.bookingInFlight.set(false))
      )
      .subscribe();
  }

  onNavigate(parking: NearbyParkingResponse): void {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${parking.lat},${parking.lng}`,
      '_blank'
    );
  }

  private buildBookingRequest(payload: ReservePayload): CreateBookingRequest {
    const startTime = new Date(Date.now() + 5 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + payload.durationHours * 60 * 60 * 1000);

    return {
      parkingId: payload.parkingId,
      userId: 'demo-user',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    };
  }

  private applyBookedSlot(parkingId: number): void {
    let updatedSelection: NearbyParkingResponse | null = null;
    const updatedParkings = this.parkings().map((parking) => {
      if (parking.id !== parkingId) return parking;

      const updated = {
        ...parking,
        availableSlots: Math.max(parking.availableSlots - 1, 0),
        updatedAt: new Date().toISOString(),
      };
      updatedSelection = updated;
      return updated;
    });

    this.parkings.set(updatedParkings);
    if (updatedSelection) {
      this.selectedParking.set(updatedSelection);
    }
  }

  private bookingErrorMessage(error: HttpErrorResponse): string {
    const code = error.error?.code;
    if (code === 'NO_AVAILABLE_SLOT' || error.status === 409) {
      return 'No slots are available for this parking.';
    }
    if (code === 'BOOKING_RESERVATION_UNAVAILABLE' || error.status === 503) {
      return 'Booking reservation system unavailable. Please try again shortly.';
    }
    return error.error?.message ?? 'Booking failed. Please try again.';
  }
}
