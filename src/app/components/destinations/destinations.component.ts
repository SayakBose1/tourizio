import { Component, OnInit, AfterViewChecked, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import * as L from "leaflet";
import { UserSessionService } from "src/app/services/user-session.service";

export interface Place {
  id: number;
  name: string;
  location: string;
  price: number;
  days?: number;
  image?: string;
  lat?: number;
  lng?: number;
  type?: "Adventure" | "Cultural" | "Food" | "Nature";
}

@Component({
  selector: "app-destinations",
  templateUrl: "./destinations.component.html",
  styleUrls: ["./destinations.component.scss"],
})
export class DestinationsComponent
  implements OnInit, AfterViewChecked, OnDestroy
{
  destinations: string[] = [];
  placesMap: Record<string, Place[]> = {};
  selectedDestination: string | null = null;
  popularPlaces: Place[] = [];
  filteredPlaces: Place[] = [];
  trendingPlaces: Place[] = [];

  private mapsInitialized: Record<number, boolean> = {};
  private mapsInstances: Record<number, L.Map> = {};

  email: string = "";
  subscribed: boolean = false;

  private readonly PEXELS_API_KEY =
    "lziGnbzjpGpnwAGAu1KYKuJghDSuOVfworDozfcEESqesyoebEOalcTq";

  ngOnInit(): void {
    this.setCustomMarker();
    this.loadDestinations();
  }

  private async loadDestinations(): Promise<void> {
    try {
      const res = await fetch("assets/data/dummydata.json");
      const data = await res.json();
      this.destinations = data.destinations || [];
      this.placesMap = data.placesMap || {};
      this.trendingPlaces = data.trending || [];
      this.loadTrendingImages();
    } catch (err) {
      console.error("Error loading destinations:", err);
    }
  }

  private async loadTrendingImages(): Promise<void> {
    const promises = this.trendingPlaces.map(async (place, index) => {
      place.image = null; // start with no image so skeleton shows
      const img = await this.fetchImage(`${place.name} ${place.location}`);
      setTimeout(() => (place.image = img), 100 * index);
    });
    await Promise.allSettled(promises);
  }

  private setCustomMarker(): void {
    const customIcon = L.divIcon({
      className: "custom-marker",
      html: `
        <div style="
          width: 26px;
          height: 36px;
          background: #3b82f6;
          border-radius: 50% 50% 50% 0;
          border: 2px solid #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          transform: rotate(-45deg);
          position: relative;">
          <div style="
            width: 12px;
            height: 12px;
            background: #fff;
            border-radius: 50%;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(45deg);
          "></div>
        </div>
      `,
      iconSize: [26, 36],
      iconAnchor: [13, 36],
      popupAnchor: [0, -36],
    });

    // Apply as default icon
    (L.Marker.prototype.options.icon as any) = customIcon;
  }

  private async fetchImage(query: string): Promise<string> {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`,
        { headers: { Authorization: this.PEXELS_API_KEY } }
      );
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data.photos?.length > 0) return data.photos[0].src.medium;
    } catch (err) {
      console.error("Error fetching image for:", query, err);
    }
    return `https://via.placeholder.com/400x250/4285f4/ffffff?text=${encodeURIComponent(query.split(" ")[0])}`;
  }

  async onSelectDestination(destination: string): Promise<void> {
    this.selectedDestination = destination;
    this.popularPlaces = [...(this.placesMap[destination] || [])];
    this.filteredPlaces = [...this.popularPlaces];

    this.cleanupMaps();

    // Fetch images for popular places
    const imagePromises = this.popularPlaces.map(async (place, index) => {
      place.image = undefined; // 👈 no broken URL anymore
      const img = await this.fetchImage(`${place.name} ${place.location}`);
      setTimeout(() => (place.image = img), 100 * index);
    });

    await Promise.allSettled(imagePromises);

    // Reset map initialization flags
    this.mapsInitialized = {};
  }

  filterByType(type: string): void {
    this.filteredPlaces = type
      ? this.popularPlaces.filter((p) => p.type === type)
      : [...this.popularPlaces];
    this.cleanupMaps();
  }

  ngAfterViewChecked(): void {
    this.initializeMaps();
  }

  private initializeMaps(): void {
    this.filteredPlaces.forEach((place) => {
      if (!place.lat || !place.lng) return;

      const mapId = `mini-map-${place.id}`;
      const mapEl = document.getElementById(mapId);
      if (!mapEl || this.mapsInitialized[place.id]) return;

      // Remove old map instance if it exists
      if (this.mapsInstances[place.id]) {
        this.mapsInstances[place.id].remove();
        delete this.mapsInstances[place.id];
      }

      const map = L.map(mapId, {
        center: [place.lat, place.lng],
        zoom: 13,
        scrollWheelZoom: false,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      L.marker([place.lat, place.lng])
        .addTo(map)
        .bindPopup(`<strong>${place.name}</strong><br>${place.location}`);

      this.mapsInstances[place.id] = map;
      this.mapsInitialized[place.id] = true;

      // Ensure map renders correctly
      setTimeout(() => map.invalidateSize(), 100);
    });
  }

  private cleanupMaps(): void {
    Object.values(this.mapsInstances).forEach((map) => map.remove());
    this.mapsInstances = {};
    this.mapsInitialized = {};
  }

  ngOnDestroy(): void {
    this.cleanupMaps();
  }

  subscribe(): void {
    if (!this.email.trim()) return;
    this.subscribed = true;
    this.email = "";
    setTimeout(() => (this.subscribed = false), 3000);
  }

  constructor(
    private router: Router,
    private sessionService: UserSessionService
  ) {}
  onBookNow(placeId: number) {
    this.sessionService.user$
      .subscribe((user) => {
        if (user) {
          // User is logged in, navigate to booking page
          this.router.navigate(["/booking"], { queryParams: { placeId } });
        } else {
          // User not logged in
          alert("You need to login first to book.");
          this.router.navigate(["/login"]);
        }
      })
      .unsubscribe(); // Unsubscribe immediately to avoid memory leaks
  }
}
