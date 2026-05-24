import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, of, tap } from 'rxjs';
import { ParkingApiService } from '../core/services/parking-api.service';
import { ParkingMapComponent } from '../features/parking/parking-map.component';
import { NearbyParkingResponse } from '../models/parking.model';
import { DetailPanelComponent } from './detail-panel.component';
import { SidebarComponent } from './sidebar.component';
import { environment } from '../../environments/environment';

export type ParkingFilter = 'available' | 'ev' | 'covered' | 'cheap';

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
        (reserveClicked)="onReserve($event)"
        (navigateClicked)="onNavigate($event)"
        (closeClicked)="onDeselect()"
      ></app-detail-panel>
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

  filteredParkings = computed(() => {
    const all = this.parkings();
    const filters = this.activeFilters();
    if (filters.length === 0) return all;

    return all.filter((p) => {
      for (const f of filters) {
        if (f === 'available' && p.availableSlots <= 0) return false;
      }
      return true;
    });
  });

  constructor(
    private readonly parkingApiService: ParkingApiService,
    private readonly router: Router
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
  }

  onDeselect(): void {
    this.selectedParking.set(null);
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
    // Search/filter logic will be added later.
  }

  onReserve(parking: NearbyParkingResponse): void {
    this.router.navigate(['/parkings', parking.id]);
  }

  onNavigate(parking: NearbyParkingResponse): void {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${parking.lat},${parking.lng}`,
      '_blank'
    );
  }
}
