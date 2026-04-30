import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { Subscription } from 'rxjs';
import { NearbyParkingResponse } from '../../models/parking.model';
import { StateBadgeComponent } from '../../shared/components/state-badge.component';

@Component({
  selector: 'app-parking-map',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, StateBadgeComponent],
  template: `
    <section class="grid">
      <div class="map-card">
        <div #mapRef class="map"></div>
      </div>

      <div class="list-card">
        <h2>Nearby Parkings</h2>
        <p class="hint">Preloaded by route resolver for faster first paint.</p>

        <ng-container *ngIf="nearby.length > 0; else empty">
          <article class="row" *ngFor="let item of nearby">
            <div>
              <a [routerLink]="['/parkings', item.id]">{{ item.name }}</a>
              <small>{{ item.distanceMeters }}m away</small>
            </div>
            <div class="meta">
              <app-state-badge
                [label]="badgeLabel(item.availableSlots)"
                [state]="badgeState(item.availableSlots)"
              ></app-state-badge>
              <small>{{ item.updatedAt | date: 'shortTime' }}</small>
            </div>
          </article>
        </ng-container>

        <ng-template #empty>
          <div class="empty">
            <strong>No parking data</strong>
            <p>Backend may be offline or there are no records in the selected area.</p>
          </div>
        </ng-template>
      </div>
    </section>
  `,
  styles: [
    `
      .grid {
        display: grid;
        grid-template-columns: 1.4fr 1fr;
        gap: 1rem;
      }

      .map-card,
      .list-card {
        border: 1px solid var(--border);
        border-radius: 14px;
        background: var(--surface);
        overflow: hidden;
      }

      .map {
        width: 100%;
        min-height: 560px;
      }

      .list-card {
        padding: 1rem;
        display: grid;
        gap: 0.8rem;
      }

      h2 {
        margin: 0;
      }

      .hint {
        margin: -0.2rem 0 0;
        color: var(--muted);
      }

      .row {
        display: flex;
        justify-content: space-between;
        gap: 0.8rem;
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 0.7rem;
        background: var(--surface-alt);
      }

      a {
        text-decoration: none;
        font-weight: 700;
      }

      small {
        display: block;
        color: var(--muted);
      }

      .meta {
        text-align: right;
      }

      .empty {
        border: 1px dashed var(--border);
        border-radius: 10px;
        padding: 0.9rem;
      }

      @media (max-width: 980px) {
        .grid {
          grid-template-columns: 1fr;
        }

        .map {
          min-height: 360px;
        }
      }
    `
  ]
})
export class ParkingMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapRef', { static: true }) mapRef?: ElementRef<HTMLDivElement>;

  nearby: NearbyParkingResponse[] = [];
  private map?: L.Map;
  private sub?: Subscription;

  constructor(private readonly route: ActivatedRoute) {
    this.nearby = this.route.snapshot.data['nearby'] ?? [];
  }

  ngAfterViewInit(): void {
    if (!this.mapRef) {
      return;
    }

    this.map = L.map(this.mapRef.nativeElement);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    if (this.nearby.length === 0) {
      this.map.setView([10.7769, 106.7009], 13);
      return;
    }

    const markers = this.nearby.map((item) => {
      const marker = L.marker([item.lat, item.lng]).addTo(this.map!);
      marker.bindPopup(`<strong>${item.name}</strong><br/>Slots: ${item.availableSlots}`);
      return marker;
    });

    const group = L.featureGroup(markers);
    this.map.fitBounds(group.getBounds().pad(0.25));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.map?.remove();
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
      return `Low: ${availableSlots}`;
    }
    return `${availableSlots} slots`;
  }
}
