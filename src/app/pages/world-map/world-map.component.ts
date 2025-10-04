import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import placesData from 'src/assets/data/dummydata.json';

@Component({
  selector: 'app-world-map',
  templateUrl: './world-map.component.html',
  styleUrls: ['./world-map.component.css'],
})
export class WorldMapComponent implements OnInit {
  map!: L.Map;

  // Pexels API key
  private readonly PEXELS_API_KEY =
    'lziGnbzjpGpnwAGAu1KYKuJghDSuOVfworDozfcEESqesyoebEOalcTq';

  ngOnInit(): void {
    this.initMap();
    this.addMarkers();
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [20.5937, 78.9629], // India center
      zoom: 5,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);
  }

  private createCustomMarker(): L.DivIcon {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
              width:26px;
              height:36px;
              background:#3b82f6;
              border-radius:50% 50% 50% 0;
              border:2px solid #fff;
              box-shadow:0 2px 6px rgba(0,0,0,0.4);
              transform:rotate(-45deg);
              position:relative;">
                <div style="
                  width:12px;
                  height:12px;
                  background:#fff;
                  border-radius:50%;
                  position:absolute;
                  top:50%;
                  left:50%;
                  transform:translate(-50%,-50%) rotate(45deg);
                "></div>
             </div>`,
      iconSize: [26, 36],
      iconAnchor: [13, 36],
      popupAnchor: [0, -36],
    });
  }

  private async addMarkers(): Promise<void> {
    const placesMap = placesData.placesMap;
    const customIcon = this.createCustomMarker();

    for (const state in placesMap) {
      if (!placesMap.hasOwnProperty(state)) continue;

      const destinations = placesMap[state];

      for (const dest of destinations) {
        if (dest.lat && dest.lng) {
          const coords: [number, number] = [dest.lat, dest.lng];
          const marker = L.marker(coords, { icon: customIcon }).addTo(this.map);

          const imgUrl = await this.fetchImage(`${dest.name} ${state}`);

          const randomRating = Math.floor(Math.random() * 3) + 3;
          dest.rating = randomRating;

          const popupHtml = this.createPopupHtml(dest, state, imgUrl);

          // Instead of .bindPopup(), use click event for a custom div overlay
          marker.on('click', (e) => {
            const popup = L.DomUtil.create('div', 'custom-popup');
            popup.innerHTML = popupHtml;

            const popupPane = this.map.getPanes().popupPane;
            popupPane.innerHTML = ''; // clear previous popup
            popupPane.appendChild(popup);

            // Get the marker's pixel position
            const point = this.map.latLngToContainerPoint(coords);

            // Calculate popup dimensions (approximate)
            const popupWidth = 280;
            const popupHeight = 250; // approximate height of your popup

            // Position popup above and centered on marker
            popup.style.position = 'absolute';
            popup.style.left = `${point.x - popupWidth / 2}px`; // center horizontally
            popup.style.top = `${point.y - popupHeight - 10}px`; // above marker with 10px gap
            popup.style.zIndex = '1000';

            // Prevent popup from going off-screen
            const mapSize = this.map.getSize();
            const currentLeft = parseFloat(popup.style.left);
            const currentTop = parseFloat(popup.style.top);

            // Adjust if going off left edge
            if (currentLeft < 10) {
              popup.style.left = '10px';
            }
            // Adjust if going off right edge
            if (currentLeft + popupWidth > mapSize.x - 10) {
              popup.style.left = `${mapSize.x - popupWidth - 10}px`;
            }
            // Adjust if going off top edge
            if (currentTop < 10) {
              popup.style.top = `${point.y + 40}px`; // show below marker instead
            }

            // Close button handler
            const closeBtn = popup.querySelector('.close-btn');
            if (closeBtn) {
              closeBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                popupPane.innerHTML = '';
              });
            }
          });
        }
      }
    }

    // Close popup when map clicked
    this.map.on('click', () => {
      const popupPane = this.map.getPanes().popupPane;
      popupPane.innerHTML = '';
    });
  }

  private createPopupHtml(dest: any, state: string, imgUrl: string): string {
    const rating = dest.rating || 4;
    return `
    <div class="map-card" style="
        width: 280px; 
        padding: 0; 
        border-radius: 20px; 
        overflow: hidden;
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        position: relative;
    ">
      <!-- Close Button -->
      <button class="close-btn" style="
          position: absolute;
          top: 8px;
          right: 8px;
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: none;
          border-radius: 50%;
          font-size: 20px;
          font-weight: bold;
          color: #64748b;
          cursor: pointer;
          z-index: 10;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          transition: all 0.2s ease;
      ">&times;</button>

      <!-- Image with Gradient Overlay -->
      <div style="position: relative; overflow: hidden;">
        <img src="${imgUrl}" style="
            width: 100%;
            height: 140px;
            object-fit: cover;
            display: block;
        "/>
        <div style="
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: linear-gradient(to top, rgba(0,0,0,0.5), transparent);
        "></div>
      </div>

      <!-- Content -->
      <div style="padding: 16px;">
        <h3 style="
            margin: 0 0 6px 0;
            font-size: 18px;
            font-weight: 700;
            color: #1e293b;
            line-height: 1.3;
        ">${dest.name}</h3>
        
        <p style="
            margin: 0 0 12px 0;
            color: #64748b;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 4px;
        ">
          <span style="color: #3b82f6;">🚩</span>
          ${state}
        </p>
        
        <div style="
            display: flex;
            align-items: center;
            gap: 8px;
            padding-top: 8px;
            border-top: 1px solid #e5e7eb;
        ">
          <div style="display: flex; gap: 2px;">
            ${this.renderStars(rating)}
          </div>
          <span style="
              color: #64748b;
              font-size: 13px;
              font-weight: 600;
          ">${rating}.0</span>
        </div>
      </div>
    </div>
  `;
  }

  private renderStars(rating: number): string {
    const fullStar = '★';
    const emptyStar = '☆';
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
      starsHtml +=
        i <= rating
          ? `<span style="color:#f59e0b">${fullStar}</span>`
          : `<span style="color:#ccc">${emptyStar}</span>`;
    }
    return starsHtml;
  }

  // ===== IMAGE FETCHING =====
  private readonly CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly CACHE_KEY = 'worldmap_images_cache';

  private async fetchImage(query: string): Promise<string> {
    const cachedUrl = this.getCachedImage(query);
    if (cachedUrl) return cachedUrl;

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

          const excludeStrong = [
            'person',
            'people',
            'man',
            'woman',
            'car',
            'vehicle',
            'portrait',
            'face',
          ];
          const excludeLight = ['indoor', 'restaurant', 'closeup', 'close-up'];

          if (excludeStrong.some((term) => alt.includes(term))) score -= 100;
          if (excludeLight.some((term) => alt.includes(term))) score -= 30;

          const goodTerms = [
            'landscape',
            'city',
            'architecture',
            'building',
            'landmark',
            'temple',
            'beach',
            'mountain',
            'view',
            'scenic',
          ];
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

    return `https://via.placeholder.com/250x150/4285f4/ffffff?text=${encodeURIComponent(query.split(' ')[0])}`;
  }

  private async fetchSpecificDestinationImage(query: string): Promise<string> {
    const cacheKey = query + '_specific';
    const cachedUrl = this.getCachedImage(cacheKey);
    if (cachedUrl) return cachedUrl;

    try {
      const specificQuery = `${query.split(',')[0].split(' in ')[0].trim()} tourist destination`;
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(specificQuery)}&per_page=8&orientation=landscape`,
        { headers: { Authorization: this.PEXELS_API_KEY } },
      );

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      if (data.photos?.length > 0) {
        const randomIndex = Math.floor(
          Math.random() * Math.min(3, data.photos.length),
        );
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
        const imageUrl = data.photos[0].src.medium;
        this.cacheImage(cacheKey, imageUrl);
        return imageUrl;
      }
    } catch (err) {
      console.error('Basic image search failed:', err);
    }

    return `https://via.placeholder.com/250x150/4285f4/ffffff?text=${encodeURIComponent(query.split(' ')[0])}`;
  }

  // ===== IMAGE CACHING =====

  private getCachedImage(query: string): string | null {
    try {
      const cacheStr = localStorage.getItem(this.CACHE_KEY);
      if (!cacheStr) return null;

      const cache = JSON.parse(cacheStr);
      const normalizedQuery = this.normalizeQuery(query);
      const cached = cache[normalizedQuery];
      if (!cached) return null;

      const now = Date.now();
      if (now - cached.timestamp > this.CACHE_DURATION) {
        this.removeFromCache(normalizedQuery);
        return null;
      }

      return cached.url;
    } catch {
      return null;
    }
  }

  private cacheImage(query: string, url: string): void {
    try {
      const cacheStr = localStorage.getItem(this.CACHE_KEY);
      const cache = cacheStr ? JSON.parse(cacheStr) : {};
      const normalizedQuery = this.normalizeQuery(query);

      cache[normalizedQuery] = {
        url,
        timestamp: Date.now(),
        query: normalizedQuery,
      };

      const entries = Object.entries(cache) as [
        string,
        { url: string; timestamp: number; query: string },
      ][];
      if (entries.length > 200) {
        entries
          .sort((a, b) => a[1].timestamp - b[1].timestamp)
          .slice(0, 50)
          .forEach(([key]) => delete cache[key]);
      }

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (err) {
      console.error('Error caching image:', err);
    }
  }

  private removeFromCache(query: string): void {
    try {
      const cacheStr = localStorage.getItem(this.CACHE_KEY);
      if (!cacheStr) return;
      const cache = JSON.parse(cacheStr);
      delete cache[query];
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch {}
  }

  private normalizeQuery(query: string): string {
    return query.toLowerCase().trim().replace(/\s+/g, ' ');
  }
}
