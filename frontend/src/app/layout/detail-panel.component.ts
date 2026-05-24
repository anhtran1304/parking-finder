import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NearbyParkingResponse } from '../models/parking.model';
import { ButtonComponent } from '../shared/components/button.component';
import { IconComponent } from '../shared/components/icon.component';

interface AmenityItem {
  icon: string;
  label: string;
}

const AMENITY_MAP: Record<string, AmenityItem[]> = {
  garage: [
    { icon: 'shield', label: 'Security' },
    { icon: 'warehouse', label: 'Covered' },
    { icon: 'eye', label: 'CCTV' },
    { icon: 'circle-check', label: 'Accessible' },
  ],
  premium: [
    { icon: 'shield', label: 'Security' },
    { icon: 'eye', label: 'CCTV' },
    { icon: 'car', label: 'Valet' },
    { icon: 'zap', label: 'EV Charging' },
    { icon: 'calendar', label: 'Reservations' },
    { icon: 'warehouse', label: 'Covered' },
  ],
  open_lot: [
    { icon: 'circle-check', label: 'Accessible' },
    { icon: 'sun', label: 'Outdoor' },
    { icon: 'smartphone', label: 'Mobile Payment' },
  ],
  ev_station: [
    { icon: 'zap', label: 'EV Charging' },
    { icon: 'warehouse', label: 'Covered' },
    { icon: 'shield', label: 'Security' },
  ],
  transit: [
    { icon: 'warehouse', label: 'Covered' },
    { icon: 'arrow-right', label: 'Easy Access' },
    { icon: 'clock', label: '24/7' },
  ],
  smart: [
    { icon: 'scan', label: 'License Plate Recognition' },
    { icon: 'smartphone', label: 'App Reservation' },
    { icon: 'activity', label: 'Real-time Occupancy' },
    { icon: 'zap', label: 'EV Charging' },
    { icon: 'shield', label: 'Security' },
    { icon: 'warehouse', label: 'Covered' },
  ],
  mall: [
    { icon: 'warehouse', label: 'Covered' },
    { icon: 'shield', label: 'Security' },
    { icon: 'arrow-right', label: 'Easy Access' },
    { icon: 'circle-check', label: 'Accessible' },
  ],
  event: [
    { icon: 'shield', label: 'Security' },
    { icon: 'arrow-right', label: 'Easy Access' },
  ],
  airport: [
    { icon: 'zap', label: 'EV Charging' },
    { icon: 'warehouse', label: 'Covered' },
    { icon: 'shield', label: 'Security' },
    { icon: 'clock', label: '24/7' },
    { icon: 'calendar', label: 'Reservations' },
    { icon: 'eye', label: 'CCTV' },
  ],
};

const ABOUT_MAP: Record<string, string> = {
  garage: 'Secure covered parking facility with 24/7 surveillance and easy access to main roads.',
  premium: 'Premium parking with valet service, EV charging stations, and dedicated concierge.',
  open_lot: 'Budget-friendly open-air parking with mobile payment support and wide spaces.',
  ev_station: 'Dedicated EV charging hub with covered bays and fast-charging infrastructure.',
  transit: 'Convenient transit-connected parking with covered walkways and 24/7 availability.',
  smart: 'AI-powered smart facility with automatic license plate recognition and real-time occupancy.',
  mall: 'Spacious mall parking with direct access to shopping areas and family-friendly spaces.',
  event: 'Event parking with flexible capacity and dedicated traffic flow management.',
  airport: 'Long-term airport parking with shuttle service, EV charging, and premium security.',
};

@Component({
  selector: 'app-detail-panel',
  standalone: true,
  imports: [CommonModule, ButtonComponent, IconComponent],
  template: `
    <aside class="panel" *ngIf="parking">
      <!-- --- HEADER (pinned) --- -->
      <div class="panel__header">
        <div class="panel__header-row">
          <div class="panel__header-left">
            <h2 class="panel__name">{{ parking.name }}</h2>
            <div class="panel__rating">
              <div class="panel__stars">
                <span *ngFor="let star of stars" class="panel__star" [class.panel__star--filled]="star <= filledStars">★</span>
              </div>
              <span class="panel__rating-value">{{ parking.rating || 4.0 }}</span>
              <span class="panel__rating-count">({{ parking.reviewCount || 0 }} reviews)</span>
            </div>
          </div>
          <button class="panel__close" (click)="closeClicked.emit()" aria-label="Close">
            <app-icon name="x" [size]="20" [strokeWidth]="2" />
          </button>
        </div>
      </div>

      <!-- --- MEDIA (pinned, never shrinks) --- -->
      <div class="panel__media-wrapper">
      <div class="panel__media">
        <!-- Placeholder shown when no images -->
        <div class="panel__media-placeholder" *ngIf="images.length === 0">
          <app-icon name="image" [size]="36" [strokeWidth]="1.5" />
        </div>
        <!-- Fade-based slide track -->
        <div class="panel__image-track">
          <div
            *ngFor="let img of images; let i = index"
            class="panel__image-slide"
            [class.panel__image-slide--active]="i === activeImageIndex"
          >
            <img [src]="img" [alt]="'Parking image ' + (i + 1)" loading="lazy" />
          </div>
        </div>
        <!-- Bottom gradient overlay -->
        <div class="panel__media-overlay"></div>
        <!-- Nav arrows -->
        <div class="panel__image-nav" *ngIf="images.length > 1">
          <button class="panel__image-arrow" (click)="scrollImage(-1)" aria-label="Previous image">
            <app-icon name="chevron-left" [size]="16" [strokeWidth]="2" />
          </button>
          <button class="panel__image-arrow" (click)="scrollImage(1)" aria-label="Next image">
            <app-icon name="chevron-right" [size]="16" [strokeWidth]="2" />
          </button>
        </div>
        <!-- Dot indicators -->
        <div class="panel__image-dots" *ngIf="images.length > 1">
          <span
            *ngFor="let img of images; let i = index"
            class="panel__image-dot"
            [class.panel__image-dot--active]="i === activeImageIndex"
          ></span>
        </div>
      </div>
      </div>

      <!-- --- BODY (scrollable) --- -->
      <div class="panel__body">
        <!-- Status badges -->
        <div class="panel__badges">
          <span class="panel__badge" [ngClass]="'panel__badge--' + availabilityStatus">
            <span class="panel__badge-dot"></span>
            {{ availabilityLabel }}
          </span>
          <span class="panel__distance">{{ parking.distanceMeters }}m away</span>
        </div>

        <!-- Address -->
        <div class="panel__address">
          <app-icon name="map-pin" [size]="16" [strokeWidth]="2" />
          <span>{{ '123 Street Name, District' }}</span>
        </div>

        <!-- Info grid -->
        <div class="panel__info-grid">
          <div class="panel__info-cell">
            <app-icon name="dollar-sign" [size]="18" [strokeWidth]="2" />
            <span class="panel__info-cell-label">Price</span>
            <span class="panel__info-cell-value">\${{ parking.hourlyRate || 2 }}/hr</span>
          </div>
          <div class="panel__info-cell">
            <app-icon name="layout-grid" [size]="18" [strokeWidth]="2" />
            <span class="panel__info-cell-label">Capacity</span>
            <span class="panel__info-cell-value">{{ parking.availableSlots }}/{{ parking.totalSlots }}</span>
          </div>
          <div class="panel__info-cell">
            <app-icon name="clock" [size]="18" [strokeWidth]="2" />
            <span class="panel__info-cell-label">Hours</span>
            <span class="panel__info-cell-value">24/7</span>
          </div>
        </div>

        <!-- About -->
        <div class="panel__about">
          <h3 class="panel__section-title">About</h3>
          <p class="panel__about-text">{{ aboutText }}</p>
        </div>

        <!-- Features / Amenities grid -->
        <div class="panel__amenities">
          <h3 class="panel__section-title">Amenities</h3>
          <div class="panel__amenities-grid">
            <div class="panel__amenity" *ngFor="let a of amenities">
              <app-icon [name]="a.icon" [size]="20" [strokeWidth]="2" />
              <span>{{ a.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- --- ACTIONS (pinned footer) --- -->
      <div class="panel__actions">
        <app-button variant="secondary" (click)="onNavigateClicked()">
          <app-icon name="navigation" [size]="16" [strokeWidth]="2" />
          Directions
        </app-button>
        <app-button variant="primary" (click)="onReserveClicked()">
          Reserve Spot
        </app-button>
      </div>
    </aside>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .panel {
        position: relative;
        display: flex;
        flex-direction: column;
        max-height: calc(100vh - 40px);
        background: var(--glass-bg);
        backdrop-filter: blur(var(--glass-blur));
        -webkit-backdrop-filter: blur(var(--glass-blur));
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-float);
        overflow: hidden;
      }

      /* --- Header (pinned top) --- */
      .panel__header {
        flex-shrink: 0;
        padding: var(--spacing-2xl) var(--spacing-2xl) var(--spacing-lg);
      }

      .panel__header-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--spacing-md);
      }

      .panel__header-left {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .panel__name {
        margin: 0;
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        letter-spacing: var(--tracking-tight);
        line-height: var(--leading-tight);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .panel__close {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-full);
        color: var(--color-text-secondary);
        transition: all var(--duration-fast) ease;
        padding: 6px;
        flex-shrink: 0;
      }

      .panel__close:hover {
        background: rgba(0, 0, 0, 0.05);
        color: var(--color-text-primary);
      }

      /* --- Rating --- */
      .panel__rating {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
      }

      .panel__stars {
        display: flex;
        gap: 1px;
      }

      .panel__star {
        font-size: 13px;
        color: var(--color-border-default);
      }

      .panel__star--filled {
        color: var(--color-rating);
      }

      .panel__rating-value {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .panel__rating-count {
        font-size: var(--font-size-xs);
        color: var(--color-text-secondary);
      }

      /* --- Media (pinned, never shrinks) --- */
      .panel__media-wrapper {
        padding: 0 var(--spacing-2xl) var(--spacing-xl);
        flex-shrink: 0;
      }

      .panel__media {
        position: relative;
        min-height: clamp(180px, 28vh, 260px);
        background: linear-gradient(135deg, var(--color-bg-subtle), var(--color-border-subtle));
        overflow: hidden;
        border-radius: var(--radius-2xl);
        border: 1px solid rgba(0, 0, 0, 0.06);
      }

      .panel__media-placeholder {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-text-tertiary);
        opacity: 0.4;
      }

      /* Fade-based carousel track */
      .panel__image-track {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: inherit;
      }

      .panel__image-slide {
        position: absolute;
        inset: 0;
        opacity: 0;
        transition: opacity 350ms ease;
      }

      .panel__image-slide--active {
        opacity: 1;
      }

      .panel__image-slide img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 400ms ease;
      }

      .panel__media:hover .panel__image-slide--active img {
        transform: scale(1.02);
      }

      /* Bottom gradient overlay */
      .panel__media-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 64px;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.22), transparent);
        pointer-events: none;
        z-index: 1;
      }

      .panel__image-nav {
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        display: flex;
        justify-content: space-between;
        padding: 0 var(--spacing-sm);
        transform: translateY(-50%);
        pointer-events: none;
        z-index: 2;
      }

      .panel__image-arrow {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.9);
        border-radius: var(--radius-full);
        box-shadow: var(--shadow-sm);
        pointer-events: all;
        transition: all var(--duration-fast) ease;
        padding: 4px;
      }

      .panel__image-arrow:hover {
        background: #ffffff;
        box-shadow: var(--shadow-md);
      }

      .panel__image-arrow app-icon {
        color: var(--color-text-primary);
      }

      .panel__image-dots {
        position: absolute;
        bottom: var(--spacing-sm);
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 6px;
        z-index: 2;
      }

      .panel__image-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transition: all var(--duration-fast) ease;
      }

      .panel__image-dot--active {
        background: #ffffff;
        transform: scale(1.3);
      }

      /* --- Body (scrollable middle) --- */
      .panel__body {
        flex: 1;
        overflow-y: auto;
        scroll-behavior: smooth;
        padding: 0 var(--spacing-2xl) var(--spacing-xl);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
        scrollbar-width: none;
      }

      .panel__body::-webkit-scrollbar {
        display: none;
      }

      /* --- Badges --- */
      .panel__badges {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
      }

      .panel__badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: var(--radius-full);
        font-size: var(--font-size-2xs);
        font-weight: var(--font-weight-semibold);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .panel__badge-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
      }

      .panel__badge--available {
        background: var(--badge-available-bg);
        color: var(--badge-available-text);
      }

      .panel__badge--limited {
        background: var(--badge-limited-bg);
        color: var(--badge-limited-text);
      }

      .panel__badge--full {
        background: var(--badge-full-bg);
        color: var(--badge-full-text);
      }

      .panel__distance {
        font-size: var(--font-size-xs);
        color: var(--color-text-secondary);
      }

      /* --- Address --- */
      .panel__address {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        color: var(--color-text-secondary);
        font-size: var(--font-size-sm);
      }

      .panel__address app-icon {
        flex-shrink: 0;
      }

      /* --- Info Grid --- */
      .panel__info-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--spacing-sm);
      }

      .panel__info-cell {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: var(--spacing-md);
        background: var(--color-bg-subtle);
        border-radius: var(--radius-md);
        border: 1px solid var(--color-border-subtle);
        text-align: center;
      }

      .panel__info-cell app-icon {
        color: var(--color-primary-base);
        flex-shrink: 0;
      }

      .panel__info-cell-label {
        font-size: var(--font-size-2xs);
        color: var(--color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .panel__info-cell-value {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
        letter-spacing: var(--tracking-tight);
      }

      /* --- About --- */
      .panel__section-title {
        margin: 0 0 var(--spacing-sm);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .panel__about-text {
        margin: 0;
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
        line-height: var(--leading-relaxed);
      }

      /* --- Amenities Grid --- */
      .panel__amenities-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
        gap: var(--spacing-sm);
      }

      .panel__amenity {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-md) var(--spacing-lg);
        background: var(--color-bg-subtle);
        border-radius: var(--radius-md);
        border: 1px solid var(--color-border-subtle);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-secondary);
        min-height: 48px;
        cursor: default;
        transition: all var(--duration-fast) ease;
      }

      .panel__amenity:hover {
        background: var(--color-bg-default);
        box-shadow: var(--shadow-sm);
        transform: translateY(-1px);
        color: var(--color-text-primary);
      }

      .panel__amenity app-icon {
        flex-shrink: 0;
        color: var(--color-primary-base);
      }

      /* --- Actions (pinned footer) --- */
      .panel__actions {
        flex-shrink: 0;
        display: flex;
        gap: var(--spacing-sm);
        padding: var(--spacing-lg) var(--spacing-2xl);
        border-top: 1px solid var(--color-border-subtle);
        background: var(--glass-bg);
      }

      .panel__actions app-button {
        flex: 1;
        display: block;
      }

      .panel__actions app-button ::ng-deep .btn {
        width: 100%;
        justify-content: center;
      }
    `,
  ],
})
export class DetailPanelComponent {
  @Input() parking: NearbyParkingResponse | null = null;
  @Input() images: string[] = [];
  @Output() reserveClicked = new EventEmitter<NearbyParkingResponse>();
  @Output() navigateClicked = new EventEmitter<NearbyParkingResponse>();
  @Output() closeClicked = new EventEmitter<void>();

  readonly stars = [1, 2, 3, 4, 5];
  activeImageIndex = 0;

  get filledStars(): number {
    return Math.round(this.parking?.rating || 4);
  }

  get amenities(): AmenityItem[] {
    const type = this.parking?.parkingType || 'garage';
    return AMENITY_MAP[type] || AMENITY_MAP['garage'];
  }

  get aboutText(): string {
    const type = this.parking?.parkingType || 'garage';
    return ABOUT_MAP[type] || ABOUT_MAP['garage'];
  }

  scrollImage(direction: number): void {
    this.activeImageIndex = Math.max(0, Math.min(this.images.length - 1, this.activeImageIndex + direction));
  }

  onReserveClicked(): void {
    if (this.parking) {
      this.reserveClicked.emit(this.parking);
    }
  }

  onNavigateClicked(): void {
    if (this.parking) {
      this.navigateClicked.emit(this.parking);
    }
  }

  get availabilityStatus(): 'available' | 'limited' | 'full' {
    if (!this.parking) return 'full';
    if (this.parking.availableSlots <= 0) return 'full';
    if (this.parking.availableSlots <= 5) return 'limited';
    return 'available';
  }

  get availabilityLabel(): string {
    if (!this.parking) return 'Unknown';
    if (this.parking.availableSlots <= 0) return 'Full';
    if (this.parking.availableSlots <= 5) return `Limited`;
    return `Available`;
  }
}
