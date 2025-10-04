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

interface CachedImage {
  url: string;
  timestamp: number;
  query: string;
}

interface ImageCache {
  [key: string]: CachedImage;
}

@Component({
  selector: 'app-destinations',
  templateUrl: './destinations.component.html',
  styleUrls: ['./destinations.component.scss'],
})
export class DestinationsComponent implements OnInit, AfterViewChecked, OnDestroy {
  // DATA
  destinations: string[] = [];
  placesMap: Record<string, Place[]> = {};
  selectedDestination: string | null = null;

  // UI lists
  popularPlaces: Place[] = [];
  filteredPlaces: Place[] = [];
  trendingPlaces: Place[] = [];
  favoritePlaces: Place[] = [];

  email: string = '';
  subscribed: boolean = false;

  private mapsInitialized: Record<string, boolean> = {};
  private mapsInstances: Record<string, L.Map> = {};

  private readonly PEXELS_API_KEY = 'lziGnbzjpGpnwAGAu1KYKuJghDSuOVfworDozfcEESqesyoebEOalcTq';
  private readonly CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly CACHE_KEY = 'destination_images_cache';

  // Scroll Reveal
  private scrollRevealElements: NodeListOf<Element> | null = null;
  private scrollListener: (() => void) | null = null;
  private resizeListener: (() => void) | null = null;
  private ticking = false;
  private animationFrame: number | null = null;

  // Search & Filter
  searchQuery: string = '';
  searchedPlaces: Place[] = [];
  popularityFilter: 'high' | 'medium' | 'low' | '' = '';
  priceFilter: 'high' | 'medium' | 'low' | '' = '';

  constructor(
    private router: Router,
    private sessionService: UserSessionService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.setCustomMarker();
    await this.loadDestinations();
    this.initScrollReveal();
    this.loadFavorites();
    this.showRandomPlaces();
  }

  // ===== SCROLL REVEAL =====
  private initScrollReveal(): void {
    this.scrollRevealElements = document.querySelectorAll('.scroll-reveal, .title-reveal');
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
      const elementTop = htmlElement.getBoundingClientRect().top + window.pageYOffset;
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

  // ===== IMAGE CACHING =====
  private getCachedImage(query: string): string | null {
    try {
      const cacheStr = localStorage.getItem(this.CACHE_KEY);
      if (!cacheStr) return null;

      const cache: ImageCache = JSON.parse(cacheStr);
      const normalizedQuery = this.normalizeQuery(query);
      const cached = cache[normalizedQuery];

      if (!cached) return null;

      const now = Date.now();
      if (now - cached.timestamp > this.CACHE_DURATION) {
        this.removeFromCache(normalizedQuery);
        return null;
      }

      return cached.url;
    } catch (err) {
      console.error('Error reading image cache:', err);
      return null;
    }
  }

  private cacheImage(query: string, url: string): void {
    try {
      const cacheStr = localStorage.getItem(this.CACHE_KEY);
      const cache: ImageCache = cacheStr ? JSON.parse(cacheStr) : {};
      
      const normalizedQuery = this.normalizeQuery(query);
      cache[normalizedQuery] = {
        url,
        timestamp: Date.now(),
        query: normalizedQuery,
      };

      const entries = Object.entries(cache);
      if (entries.length > 200) {
        entries
          .sort((a, b) => a[1].timestamp - b[1].timestamp)
          .slice(0, 50)
          .forEach(([key]) => delete cache[key]);
      }

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (err) {
      console.error('Error caching image:', err);
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        this.clearOldCache();
        this.cacheImage(query, url);
      }
    }
  }

  private normalizeQuery(query: string): string {
    return query.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  private removeFromCache(query: string): void {
    try {
      const cacheStr = localStorage.getItem(this.CACHE_KEY);
      if (!cacheStr) return;

      const cache: ImageCache = JSON.parse(cacheStr);
      delete cache[query];
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (err) {
      console.error('Error removing from cache:', err);
    }
  }

  private clearOldCache(): void {
    try {
      const cacheStr = localStorage.getItem(this.CACHE_KEY);
      if (!cacheStr) return;

      const cache: ImageCache = JSON.parse(cacheStr);
      const now = Date.now();
      
      const recentCache: ImageCache = {};
      Object.entries(cache).forEach(([key, value]) => {
        if (now - value.timestamp < 7 * 24 * 60 * 60 * 1000) {
          recentCache[key] = value;
        }
      });

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(recentCache));
    } catch (err) {
      console.error('Error clearing old cache:', err);
    }
  }

  // ===== IMAGE FETCHING =====
  private async fetchImage(query: string): Promise<string> {
    const cachedUrl = this.getCachedImage(query);
    if (cachedUrl) {
      return cachedUrl;
    }

    try {
      const enhancedQuery = `${query} travel destination landmark`;

      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(enhancedQuery)}&per_page=15&orientation=landscape`,
        { headers: { Authorization: this.PEXELS_API_KEY } },
      );

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      if (data.photos?.length > 0) {
        const scoredPhotos = data.photos.map((photo: any) => {
          const alt = (photo.alt || '').toLowerCase();
          let score = 0;

          const strongExclude = ['person', 'people', 'man', 'woman', 'men', 'women', 'car', 'vehicle', 'portrait', 'face', 'selfie'];
          if (strongExclude.some((term) => alt.includes(term))) {
            score -= 100;
          }

          const lightExclude = ['indoor', 'restaurant', 'closeup', 'close-up'];
          if (lightExclude.some((term) => alt.includes(term))) {
            score -= 30;
          }

          const goodTerms = ['landscape', 'city', 'architecture', 'building', 'monument', 'view', 'aerial', 'landmark', 'temple', 'beach', 'mountain', 'scenic'];
          goodTerms.forEach((term) => {
            if (alt.includes(term)) score += 20;
          });

          const locationParts = query.toLowerCase().split(' ');
          locationParts.forEach((part) => {
            if (part.length > 3 && alt.includes(part)) score += 30;
          });

          return { photo, score };
        });

        scoredPhotos.sort((a, b) => b.score - a.score);

        if (scoredPhotos[0].score > -50) {
          const imageUrl = scoredPhotos[0].photo.src.medium;
          this.cacheImage(query, imageUrl);
          return imageUrl;
        }

        return this.fetchSpecificDestinationImage(query);
      }
    } catch (err) {
      console.error('Error fetching image for:', query, err);
    }

    return `https://via.placeholder.com/400x250/4285f4/ffffff?text=${encodeURIComponent(query.split(' ')[0])}`;
  }

  private async fetchSpecificDestinationImage(query: string): Promise<string> {
    const cacheKey = query + '_specific';
    const cachedUrl = this.getCachedImage(cacheKey);
    if (cachedUrl) return cachedUrl;

    try {
      const placeName = query.split(',')[0].split(' in ')[0].trim();
      const specificQuery = `${placeName} tourist destination`;

      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(specificQuery)}&per_page=8&orientation=landscape`,
        { headers: { Authorization: this.PEXELS_API_KEY } },
      );

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      if (data.photos?.length > 0) {
        const randomIndex = Math.floor(Math.random() * Math.min(3, data.photos.length));
        const imageUrl = data.photos[randomIndex].src.medium;
        this.cacheImage(cacheKey, imageUrl);
        return imageUrl;
      }
    } catch (err) {
      console.error('Fallback image search failed:', err);
    }

    return this.fetchBasicImage(query);
  }

  private async fetchBasicImage(query: string): Promise<string> {
    const cacheKey = query + '_basic';
    const cachedUrl = this.getCachedImage(cacheKey);
    if (cachedUrl) return cachedUrl;

    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
        { headers: { Authorization: this.PEXELS_API_KEY } },
      );

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      if (data.photos?.length > 0) {
        const index = Math.min(1, data.photos.length - 1);
        const imageUrl = data.photos[index].src.medium;
        this.cacheImage(cacheKey, imageUrl);
        return imageUrl;
      }
    } catch (err) {
      console.error('Basic image search failed:', err);
    }

    return `https://via.placeholder.com/400x250/4285f4/ffffff?text=${encodeURIComponent(query.split(' ')[0])}`;
  }

  // ===== RANDOM PLACES =====
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

  // ===== MAPS =====
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
      localStorage.setItem('favoritePlaces', JSON.stringify(this.favoritePlaces));
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

  // ===== SEARCH & FILTER =====
  onSearch(): void {
    const query = this.searchQuery.trim().toLowerCase();

    if (!query) {
      this.searchedPlaces = [];
      this.selectedDestination = '';
      this.filteredPlaces = [];
      return;
    }

    const allPlaces: Place[] = Object.values(this.placesMap).flat();
    this.searchedPlaces = allPlaces.filter((p) => p.name.toLowerCase().startsWith(query));

    this.searchedPlaces.forEach((place) => {
      this.fetchImage(`${place.name} ${place.location}`).then((img) => {
        place.image = img;
      });
    });

    setTimeout(() => {
      this.cleanupMaps();
      this.filteredPlaces = [...this.searchedPlaces];
      this.initializeMaps();
    }, 200);
  }

  onFilterChange(): void {
    let allPlaces: Place[] = Object.values(this.placesMap).flat();

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.trim().toLowerCase();
      allPlaces = allPlaces.filter((p) => p.name.toLowerCase().startsWith(query));
    }

    if (this.popularityFilter) {
      allPlaces = allPlaces.filter((p) => {
        if (this.popularityFilter === 'high') return p.price >= 18000;
        if (this.popularityFilter === 'medium') return p.price >= 13000 && p.price < 18000;
        if (this.popularityFilter === 'low') return p.price < 13000;
        return true;
      });
    }

    if (this.priceFilter) {
      allPlaces = allPlaces.sort((a, b) => {
        if (this.priceFilter === 'high') return b.price - a.price;
        if (this.priceFilter === 'medium') return a.price - b.price;
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

  openWiki(destinationName: string) {
    if (!destinationName) return;
    const wikiUrl = `https://en.wikipedia.org/wiki/${destinationName.replace(/\s+/g, '_')}`;
    window.open(wikiUrl, '_blank');
  }

  // ===== LIFECYCLE =====
  ngAfterViewChecked(): void {
    if (this.filteredPlaces.length) this.initializeMaps();
    this.optimizedScrollReveal();
  }

  ngOnDestroy(): void {
    this.cleanupMaps();
    if (this.scrollListener) window.removeEventListener('scroll', this.scrollListener);
    if (this.resizeListener) window.removeEventListener('resize', this.resizeListener);
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
  }
}