import { Component, OnInit, AfterViewChecked, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { UserSessionService } from 'src/app/services/user-session.service';

export interface Place {
  id: number;
  name: string;
  location: string;
  price: number;
  days?: number;
  description?: string;
  image?: string | null;
  lat?: number;
  lng?: number;
  type?: 'Adventure' | 'Cultural' | 'Food' | 'Nature';
}

@Component({
  selector: 'app-destinations',
  templateUrl: './destinations.component.html',
  styleUrls: ['./destinations.component.scss'],
})
export class DestinationsComponent
  implements OnInit, AfterViewChecked, OnDestroy
{
  // DATA
  destinations: string[] = [];
  placesMap: Record<string, Place[]> = {};
  selectedDestination: string | null = null;

  // UI lists
  popularPlaces: Place[] = []; // always 6 random cards
  filteredPlaces: Place[] = []; // destination-specific cards
  trendingPlaces: Place[] = [];
  favoritePlaces: Place[] = [];

  email: string = '';
  subscribed: boolean = false;

  private mapsInitialized: Record<string, boolean> = {};
  private mapsInstances: Record<string, L.Map> = {};

  private readonly PEXELS_API_KEY =
    'lziGnbzjpGpnwAGAu1KYKuJghDSuOVfworDozfcEESqesyoebEOalcTq';

  // Scroll Reveal
  private scrollRevealElements: NodeListOf<Element> | null = null;
  private scrollListener: (() => void) | null = null;
  private resizeListener: (() => void) | null = null;
  private ticking = false;
  private animationFrame: number | null = null;

  constructor(
    private router: Router,
    private sessionService: UserSessionService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.setCustomMarker();
    await this.loadDestinations();
    this.initScrollReveal();
    this.loadFavorites();

    // Pick 6 random places once on init
    this.showRandomPlaces();
  }

  // ===== SCROLL REVEAL =====
  private initScrollReveal(): void {
    this.scrollRevealElements = document.querySelectorAll(
      '.scroll-reveal, .title-reveal',
    );
    this.scrollListener = () => this.optimizedScrollReveal();
    this.resizeListener = () => this.optimizedScrollReveal();

    window.addEventListener('scroll', this.scrollListener, { passive: true });
    window.addEventListener('resize', this.resizeListener, { passive: true });

    this.revealOnScroll();
  }

  private optimizedScrollReveal(): void {
    if (!this.ticking) {
      this.animationFrame = requestAnimationFrame(() => {
        this.revealOnScroll();
        this.ticking = false;
      });
      this.ticking = true;
    }
  }

  private revealOnScroll(): void {
    if (!this.scrollRevealElements) return;
    const windowHeight = window.innerHeight;
    const scrollTop = window.pageYOffset;

    this.scrollRevealElements.forEach((element: Element, index: number) => {
      const htmlElement = element as HTMLElement;
      const elementTop =
        htmlElement.getBoundingClientRect().top + window.pageYOffset;
      const revealPoint = 100;
      if (scrollTop + windowHeight - revealPoint > elementTop) {
        if (!htmlElement.classList.contains('show')) {
          setTimeout(() => htmlElement.classList.add('show'), index * 50);
        }
      }
    });
  }

  // ===== DATA LOADING =====
  private async loadDestinations(): Promise<void> {
    try {
      const res = await fetch('assets/data/dummydata.json');
      const data = await res.json();
      this.destinations = data.destinations || [];
      this.placesMap = data.placesMap || {};
      this.trendingPlaces = data.trending || [];
      await this.loadTrendingImages();
    } catch (err) {
      console.error('Error loading destinations:', err);
    }
  }

  private async loadTrendingImages(): Promise<void> {
    const promises = (this.trendingPlaces || []).map(async (place, index) => {
      place.image = null;
      const img = await this.fetchImage(`${place.name} ${place.location}`);
      setTimeout(() => (place.image = img), 100 * index);
    });
    await Promise.allSettled(promises);
  }

  // private async fetchImage(query: string): Promise<string> {
  //   try {
  //     const res = await fetch(
  //       `https://api.pexels.com/v1/search?query=${encodeURIComponent(
  //         query,
  //       )}&per_page=1&orientation=landscape`,
  //       { headers: { Authorization: this.PEXELS_API_KEY } },
  //     );
  //     if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  //     const data = await res.json();
  //     if (data.photos?.length > 0) return data.photos[0].src.medium;
  //   } catch (err) {
  //     console.error('Error fetching image for:', query, err);
  //   }
  //   return `https://via.placeholder.com/400x250/4285f4/ffffff?text=${encodeURIComponent(
  //     query.split(' ')[0],
  //   )}`;
  // }

  // ===== RANDOM PLACES =====

  // Replace your existing fetchImage method with this improved version:

  private async fetchImage(query: string): Promise<string> {
    try {
      // Enhanced query with destination-focused keywords
      const enhancedQuery = `${query} travel destination landmark`;

      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(
          enhancedQuery,
        )}&per_page=15&orientation=landscape`,
        { headers: { Authorization: this.PEXELS_API_KEY } },
      );

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      if (data.photos?.length > 0) {
        // Score each photo based on quality indicators
        const scoredPhotos = data.photos.map((photo: any) => {
          const alt = (photo.alt || '').toLowerCase();
          let score = 0;

          // Heavily penalize people/vehicles
          const strongExclude = [
            'person',
            'people',
            'man',
            'woman',
            'men',
            'women',
            'car',
            'vehicle',
            'portrait',
            'face',
            'selfie',
          ];
          if (strongExclude.some((term) => alt.includes(term))) {
            score -= 100;
          }

          // Lightly penalize indoor/closeup shots
          const lightExclude = ['indoor', 'restaurant', 'closeup', 'close-up'];
          if (lightExclude.some((term) => alt.includes(term))) {
            score -= 30;
          }

          // Reward destination-related terms
          const goodTerms = [
            'landscape',
            'city',
            'architecture',
            'building',
            'monument',
            'view',
            'aerial',
            'landmark',
            'temple',
            'beach',
            'mountain',
            'scenic',
          ];
          goodTerms.forEach((term) => {
            if (alt.includes(term)) score += 20;
          });

          // Reward if query location name is in alt text
          const locationParts = query.toLowerCase().split(' ');
          locationParts.forEach((part) => {
            if (part.length > 3 && alt.includes(part)) score += 30;
          });

          return { photo, score };
        });

        // Sort by score and pick the best one
        scoredPhotos.sort((a, b) => b.score - a.score);

        // Use the highest scoring photo if it's decent (score > -50)
        if (scoredPhotos[0].score > -50) {
          return scoredPhotos[0].photo.src.medium;
        }

        // If all photos have bad scores, try fallback search
        return this.fetchSpecificDestinationImage(query);
      }
    } catch (err) {
      console.error('Error fetching image for:', query, err);
    }

    return `https://via.placeholder.com/400x250/4285f4/ffffff?text=${encodeURIComponent(
      query.split(' ')[0],
    )}`;
  }

  // Add this new method to your component:
  private async fetchSpecificDestinationImage(query: string): Promise<string> {
    try {
      // Extract just the place name (before any comma or 'in')
      const placeName = query.split(',')[0].split(' in ')[0].trim();

      // Try searching with just the place name + basic keywords
      const specificQuery = `${placeName} tourist destination`;

      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(
          specificQuery,
        )}&per_page=8&orientation=landscape`,
        { headers: { Authorization: this.PEXELS_API_KEY } },
      );

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      if (data.photos?.length > 0) {
        // Pick a random photo from the results to add variety
        const randomIndex = Math.floor(
          Math.random() * Math.min(3, data.photos.length),
        );
        return data.photos[randomIndex].src.medium;
      }
    } catch (err) {
      console.error('Fallback image search failed:', err);
    }

    // Last resort: use the original query without enhancements
    return this.fetchBasicImage(query);
  }

  // Add this final fallback method:
  private async fetchBasicImage(query: string): Promise<string> {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(
          query,
        )}&per_page=5&orientation=landscape`,
        { headers: { Authorization: this.PEXELS_API_KEY } },
      );

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      if (data.photos?.length > 0) {
        // Pick second or third image to avoid most common result
        const index = Math.min(1, data.photos.length - 1);
        return data.photos[index].src.medium;
      }
    } catch (err) {
      console.error('Basic image search failed:', err);
    }

    return `https://via.placeholder.com/400x250/4285f4/ffffff?text=${encodeURIComponent(
      query.split(' ')[0],
    )}`;
  }

  private showRandomPlaces(): void {
    const allPlaces: Place[] = Object.values(this.placesMap).flat();
    if (!allPlaces || allPlaces.length === 0) return;
    this.popularPlaces = this.shuffleArray(allPlaces).slice(0, 6);

    this.popularPlaces.forEach(async (place, idx) => {
      place.image = undefined;
      const img = await this.fetchImage(`${place.name} ${place.location}`);
      setTimeout(() => (place.image = img), 80 * idx);
    });
  }

  private shuffleArray<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ===== MAPS (only for filteredPlaces) =====
  private setCustomMarker(): void {
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="width:26px;height:36px;background:#3b82f6;border-radius:50% 50% 50% 0;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);transform:rotate(-45deg);position:relative;">
              <div style="width:12px;height:12px;background:#fff;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(45deg);"></div>
             </div>`,
      iconSize: [26, 36],
      iconAnchor: [13, 36],
      popupAnchor: [0, -36],
    });
    (L.Marker.prototype.options.icon as any) = customIcon;
  }

  private initializeMaps(): void {
    this.filteredPlaces.forEach((place) => {
      if (!place.lat || !place.lng) return;
      const mapId = `mini-map-${place.id}`;
      const mapEl = document.getElementById(mapId);
      if (!mapEl || this.mapsInitialized[mapId]) return;

      if (this.mapsInstances[mapId]) {
        this.mapsInstances[mapId].remove();
        delete this.mapsInstances[mapId];
      }

      const map = L.map(mapId, {
        center: [place.lat, place.lng],
        zoom: 13,
        scrollWheelZoom: false,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      L.marker([place.lat, place.lng])
        .addTo(map)
        .bindPopup(`<strong>${place.name}</strong><br>${place.location}`);

      this.mapsInstances[mapId] = map;
      this.mapsInitialized[mapId] = true;

      setTimeout(() => map.invalidateSize(), 100);
    });
  }

  private cleanupMaps(): void {
    Object.values(this.mapsInstances).forEach((m) => {
      try {
        m.remove();
      } catch {}
    });
    this.mapsInstances = {};
    this.mapsInitialized = {};
  }

  // ===== UI ACTIONS =====
  async onSelectDestination(destination: string): Promise<void> {
    this.selectedDestination = destination || null;

    if (!this.selectedDestination) {
      this.filteredPlaces = [];
      this.cleanupMaps();
      return;
    }

    const places = [...(this.placesMap[this.selectedDestination] || [])];
    this.filteredPlaces = this.shuffleArray(places);
    this.cleanupMaps();

    const imagePromises = this.filteredPlaces.map(async (place, idx) => {
      place.image = undefined;
      const img = await this.fetchImage(`${place.name} ${place.location}`);
      setTimeout(() => (place.image = img), 80 * idx);
    });
    await Promise.allSettled(imagePromises);

    this.mapsInitialized = {};
  }

  filterByType(type: string): void {
    if (!this.selectedDestination) return;
    this.filteredPlaces = type
      ? this.placesMap[this.selectedDestination].filter((p) => p.type === type)
      : [...this.placesMap[this.selectedDestination]];
    this.cleanupMaps();
  }

  onBookNow(placeId: number) {
    this.sessionService.user$
      .subscribe((user) => {
        if (user) {
          this.router.navigate(['/booking'], { queryParams: { placeId } });
        } else {
          alert('You need to login first to book.');
          this.router.navigate(['/login']);
        }
      })
      .unsubscribe();
  }

  subscribe(): void {
    if (!this.email.trim()) return;
    this.subscribed = true;
    this.email = '';
    setTimeout(() => (this.subscribed = false), 3000);
  }

  // ===== FAVORITES =====
  toggleFavorite(place: Place) {
    const exists = this.favoritePlaces.some((p) => p.id === place.id);
    this.favoritePlaces = exists
      ? this.favoritePlaces.filter((p) => p.id !== place.id)
      : [...this.favoritePlaces, { ...place }];
    this.saveFavorites();
  }

  isFavorite(place: Place): boolean {
    return this.favoritePlaces.some((p) => p.id === place.id);
  }

  private saveFavorites() {
    try {
      localStorage.setItem(
        'favoritePlaces',
        JSON.stringify(this.favoritePlaces),
      );
    } catch (err) {
      console.error('Error saving favorites:', err);
    }
  }

  private loadFavorites() {
    try {
      const favs = localStorage.getItem('favoritePlaces');
      if (favs) this.favoritePlaces = JSON.parse(favs);
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
  }

  // ===== LIFECYCLE =====
  ngAfterViewChecked(): void {
    if (this.filteredPlaces.length) this.initializeMaps();
    this.optimizedScrollReveal();
  }

  ngOnDestroy(): void {
    this.cleanupMaps();
    if (this.scrollListener)
      window.removeEventListener('scroll', this.scrollListener);
    if (this.resizeListener)
      window.removeEventListener('resize', this.resizeListener);
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
  }

  searchQuery: string = '';
  searchedPlaces: Place[] = [];

  onSearch(): void {
    const query = this.searchQuery.trim().toLowerCase();

    if (!query) {
      this.searchedPlaces = []; // show back random 6
      this.selectedDestination = ''; // reset dropdown selection
      this.filteredPlaces = []; // clear filtered list
      return;
    }

    const allPlaces: Place[] = Object.values(this.placesMap).flat();
    this.searchedPlaces = allPlaces.filter((p) =>
      p.name.toLowerCase().startsWith(query),
    );

    // Fetch images dynamically for each result
    this.searchedPlaces.forEach((place, idx) => {
      this.fetchImage(`${place.name} ${place.location}`).then((img) => {
        place.image = img;
      });
    });

    // Initialize maps for searched places after render
    setTimeout(() => {
      this.cleanupMaps();
      this.filteredPlaces = [...this.searchedPlaces]; // so map init still works
      this.initializeMaps();
    }, 200);
  }

  popularityFilter: 'high' | 'medium' | 'low' | '' = '';
  priceFilter: 'high' | 'medium' | 'low' | '' = '';

  onFilterChange(): void {
    let allPlaces: Place[] = Object.values(this.placesMap).flat();

    // Start with search query if present
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.trim().toLowerCase();
      allPlaces = allPlaces.filter((p) =>
        p.name.toLowerCase().startsWith(query),
      );
    }

    // Apply popularity filter
    if (this.popularityFilter) {
      allPlaces = allPlaces.filter((p) => {
        if (this.popularityFilter === 'high') return p.price >= 18000; // example
        if (this.popularityFilter === 'medium')
          return p.price >= 13000 && p.price < 18000;
        if (this.popularityFilter === 'low') return p.price < 13000;
        return true;
      });
    }

    // Apply price filter
    if (this.priceFilter) {
      allPlaces = allPlaces.sort((a, b) => {
        if (this.priceFilter === 'high') return b.price - a.price;
        if (this.priceFilter === 'medium') return a.price - b.price; // optional: adjust logic
        if (this.priceFilter === 'low') return a.price - b.price;
        return 0;
      });
    }

    this.searchedPlaces = allPlaces;
    setTimeout(() => {
      this.cleanupMaps();
      this.filteredPlaces = [...this.searchedPlaces];
      this.initializeMaps();
    }, 200);
  }
}
