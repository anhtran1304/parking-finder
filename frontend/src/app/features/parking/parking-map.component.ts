import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import * as L from 'leaflet';
import { NearbyParkingResponse } from '../../models/parking.model';

@Component({
  selector: 'app-parking-map',
  standalone: true,
  imports: [CommonModule],
  template: `<div #mapRef class="map"></div>`,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      .map {
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class ParkingMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapRef', { static: true }) mapRef?: ElementRef<HTMLDivElement>;

  @Input() parkings: NearbyParkingResponse[] = [];
  @Input() selectedId: number | null = null;
  @Input() hoveredId: number | null = null;
  @Output() markerClicked = new EventEmitter<NearbyParkingResponse>();
  @Output() markerHovered = new EventEmitter<NearbyParkingResponse>();
  @Output() markerLeft = new EventEmitter<void>();

  private map?: L.Map;
  private markers = new Map<number, L.Marker>();
  private previousSelectedId: number | null = null;

  ngAfterViewInit(): void {
    if (!this.mapRef) return;

    this.map = L.map(this.mapRef.nativeElement, {
      zoomControl: false,
      attributionControl: true,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(this.map);

    this.renderMarkers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) return;

    if (changes['parkings']) {
      this.renderMarkers();
    }

    if (changes['selectedId']) {
      this.updateSelectedMarker();
      this.flyToSelected();
    }

    if (changes['hoveredId']) {
      this.updateHoveredMarker(changes['hoveredId'].previousValue);
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private renderMarkers(): void {
    this.markers.forEach((m) => m.remove());
    this.markers.clear();

    if (!this.map) return;

    if (this.parkings.length === 0) {
      this.map.setView([10.7769, 106.7009], 14);
      return;
    }

    this.parkings.forEach((item) => {
      const isSelected = item.id === this.selectedId;
      const isHovered = item.id === this.hoveredId;
      const icon = this.createMarkerIcon(item.availableSlots, isSelected, isHovered);
      const marker = L.marker([item.lat, item.lng], { icon }).addTo(this.map!);

      marker.on('click', () => this.markerClicked.emit(item));
      marker.on('mouseover', () => this.markerHovered.emit(item));
      marker.on('mouseout', () => this.markerLeft.emit());
      this.markers.set(item.id, marker);
    });

    const group = L.featureGroup(Array.from(this.markers.values()));
    this.map.fitBounds(group.getBounds().pad(0.3));
  }

  private flyToSelected(): void {
    if (!this.map || !this.selectedId) return;
    if (this.selectedId === this.previousSelectedId) return;
    this.previousSelectedId = this.selectedId;

    const item = this.parkings.find((p) => p.id === this.selectedId);
    if (item) {
      this.map.flyTo([item.lat, item.lng], 16, { duration: 0.8 });
    }
  }

  private updateSelectedMarker(): void {
    this.markers.forEach((marker, id) => {
      const item = this.parkings.find((p) => p.id === id);
      if (!item) return;
      const isSelected = id === this.selectedId;
      const isHovered = id === this.hoveredId;
      const icon = this.createMarkerIcon(item.availableSlots, isSelected, isHovered);
      marker.setIcon(icon);
    });
  }

  private updateHoveredMarker(previousHoveredId: number | null): void {
    // Remove hover from previous
    if (previousHoveredId && previousHoveredId !== this.selectedId) {
      const prevMarker = this.markers.get(previousHoveredId);
      const prevItem = this.parkings.find((p) => p.id === previousHoveredId);
      if (prevMarker && prevItem) {
        prevMarker.setIcon(this.createMarkerIcon(prevItem.availableSlots, false, false));
      }
    }

    // Add hover to current
    if (this.hoveredId && this.hoveredId !== this.selectedId) {
      const marker = this.markers.get(this.hoveredId);
      const item = this.parkings.find((p) => p.id === this.hoveredId);
      if (marker && item) {
        marker.setIcon(this.createMarkerIcon(item.availableSlots, false, true));
      }
    }
  }

  private markerStatus(availableSlots: number): 'available' | 'limited' | 'full' {
    if (availableSlots <= 0) return 'full';
    if (availableSlots <= 5) return 'limited';
    return 'available';
  }

  private createMarkerIcon(availableSlots: number, isSelected: boolean, isHovered: boolean): L.DivIcon {
    const status = this.markerStatus(availableSlots);
    let stateClass = '';
    if (isSelected) stateClass = ' map-marker-wrapper--selected';
    else if (isHovered) stateClass = ' map-marker-wrapper--hovered';

    const size = isSelected ? 50 : 44;

    return L.divIcon({
      className: `map-marker-wrapper map-marker-wrapper--${status}${stateClass}`,
      html: `<div class="map-marker"><span class="map-marker__inner"></span></div>`,
      iconSize: [size, size],
      iconAnchor: [Math.floor(size / 2), size],
      popupAnchor: [0, -size],
    });
  }
}
