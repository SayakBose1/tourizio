import { Component, Input, AfterViewInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-mini-map',
  templateUrl: './mini-map.component.html',
  styleUrls: ['./mini-map.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MiniMapComponent implements AfterViewInit, OnDestroy {
  @Input() lat!: number;
  @Input() lng!: number;
  @Input() zoom: number = 13;
  @Input() mapId!: string;
  @Input() placeName?: string;

  private map!: L.Map;

  ngAfterViewInit(): void {
    if (!this.mapId) {
      console.error('Map ID is required for MiniMapComponent!');
      return;
    }

    // Fix marker icons with CSS-based solution
    this.setupCustomMarkerIcon();
    this.initializeMap();
  }

  private setupCustomMarkerIcon(): void {
    // Create a custom CSS-based marker icon
    const customIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div class="marker-pin">
          <div class="marker-dot"></div>
        </div>
      `,
      iconSize: [30, 40],
      iconAnchor: [15, 40],
      popupAnchor: [0, -40]
    });

    // Set as default for this component
    L.Marker.prototype.options.icon = customIcon;
  }

  private initializeMap(): void {
    try {
      const mapElement = document.getElementById(this.mapId);
      if (!mapElement) {
        console.error(`Map element with ID ${this.mapId} not found`);
        return;
      }

      this.map = L.map(this.mapId, {
        center: [this.lat, this.lng],
        zoom: this.zoom,
        scrollWheelZoom: false,
        dragging: false,
        zoomControl: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
      }).addTo(this.map);

      // Add marker
      const popupContent = this.placeName || `Location: ${this.lat}, ${this.lng}`;
      L.marker([this.lat, this.lng])
        .addTo(this.map)
        .bindPopup(popupContent);

      // Ensure proper rendering
      setTimeout(() => {
        this.map.invalidateSize();
      }, 100);

    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}