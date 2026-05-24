import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NearbyParkingResponse } from '../models/parking.model';
import { ParkingFilter } from './shell.component';
import { ChipComponent } from '../shared/components/chip.component';
import { IconComponent } from '../shared/components/icon.component';
import { ParkingCardComponent } from '../shared/components/parking-card.component';
import { SearchBarComponent } from '../shared/components/search-bar.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, SearchBarComponent, ChipComponent, ParkingCardComponent, IconComponent],
  template: `
    <aside class="panel">
      <div class="panel__header">
        <div class="panel__brand">
          <div class="panel__logo">
            <app-icon name="map-pin" [size]="20" [strokeWidth]="2.5" />
          </div>
          <div class="panel__brand-text">
            <span class="panel__title">Parking Finder</span>
            <span class="panel__subtitle">{{ parkings.length }} spots nearby</span>
          </div>
        </div>

        <app-search-bar
          placeholder="Search location or parking..."
          (searchChange)="searchChange.emit($event)"
        ></app-search-bar>
      </div>

      <div class="panel__filters">
        <app-chip
          label="Available"
          [selected]="isFilterActive('available')"
          (toggled)="filterToggled.emit('available')"
        ></app-chip>
        <app-chip
          label="EV Charging"
          [selected]="isFilterActive('ev')"
          (toggled)="filterToggled.emit('ev')"
        ></app-chip>
        <app-chip
          label="Covered"
          [selected]="isFilterActive('covered')"
          (toggled)="filterToggled.emit('covered')"
        ></app-chip>
        <app-chip
          label="< $3/hr"
          [selected]="isFilterActive('cheap')"
          (toggled)="filterToggled.emit('cheap')"
        ></app-chip>
      </div>
      <div class="panel__list">
        <app-parking-card
          *ngFor="let item of parkings; trackBy: trackById"
          [name]="item.name"
          [distance]="formatDistance(item.distanceMeters)"
          [price]="(item.hourlyRate || 2).toString()"
          [availableSlots]="item.availableSlots"
          [totalSlots]="item.totalSlots || 0"
          [selected]="selectedId === item.id"
          [hovered]="hoveredId === item.id"
          (cardSelected)="parkingSelected.emit(item)"
          (cardHovered)="parkingHovered.emit(item)"
          (cardLeft)="parkingLeft.emit()"
        ></app-parking-card>

        <div class="panel__empty" *ngIf="parkings.length === 0">
          <app-icon name="search" [size]="40" [strokeWidth]="1.5" />
          <p>No parking found in this area</p>
        </div>
      </div>
    </aside>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }

      .panel {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--glass-bg);
        backdrop-filter: blur(var(--glass-blur));
        -webkit-backdrop-filter: blur(var(--glass-blur));
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-float);
        overflow: hidden;
      }

      .panel__header {
        padding: var(--spacing-xl) var(--spacing-xl) var(--spacing-md);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
      }

      .panel__brand {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
      }

      .panel__logo {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, var(--color-primary-base), var(--color-primary-hover));
        border-radius: var(--radius-md);
        color: white;
        padding: 7px;
        box-shadow: var(--shadow-primary-sm);
      }

      .panel__logo svg {
        width: 100%;
        height: 100%;
      }

      .panel__brand-text {
        display: flex;
        flex-direction: column;
      }

      .panel__title {
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        letter-spacing: var(--tracking-tight);
        line-height: var(--leading-tight);
      }

      .panel__subtitle {
        font-size: var(--font-size-xs);
        color: var(--color-text-secondary);
        margin-top: 1px;
      }

      .panel__filters {
        display: flex;
        gap: var(--spacing-sm);
        padding: var(--spacing-lg);
        overflow-x: auto;
        scrollbar-width: none;
        flex-wrap: wrap;
        border-bottom: 1px solid var(--color-border-subtle);
      }

      .panel__filters::-webkit-scrollbar {
        display: none;
      }

      .panel__list {
        flex: 1;
        overflow-y: auto;
        padding: var(--spacing-lg);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
        scrollbar-width: none;
      }

      .panel__list::-webkit-scrollbar {
        display: none;
      }

      .panel__empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--spacing-3xl) var(--spacing-xl);
        text-align: center;
        gap: var(--spacing-md);
      }

      .panel__empty app-icon {
        color: var(--color-text-disabled);
        opacity: 0.6;
      }

      .panel__empty p {
        margin: 0;
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
      }
    `,
  ],
})
export class SidebarComponent {
  @Input() parkings: NearbyParkingResponse[] = [];
  @Input() selectedId: number | null = null;
  @Input() hoveredId: number | null = null;
  @Input() activeFilters: ParkingFilter[] = [];
  @Output() parkingSelected = new EventEmitter<NearbyParkingResponse>();
  @Output() parkingHovered = new EventEmitter<NearbyParkingResponse>();
  @Output() parkingLeft = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() filterToggled = new EventEmitter<ParkingFilter>();

  isFilterActive(filter: ParkingFilter): boolean {
    return this.activeFilters.includes(filter);
  }

  formatDistance(meters: number): string {
    if (meters >= 1000) return (meters / 1000).toFixed(1) + 'km';
    return meters + 'm';
  }

  trackById(_: number, item: NearbyParkingResponse): number {
    return item.id;
  }
}
