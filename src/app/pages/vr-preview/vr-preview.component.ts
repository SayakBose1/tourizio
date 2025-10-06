import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UnsplashService } from '../../services/unsplash.service';

interface Place {
  id: number;
  name: string;
  location: string;
  imgUrl?: string;
}

@Component({
  selector: 'app-vr-preview',
  templateUrl: './vr-preview.component.html',
  styleUrls: ['./vr-preview.component.css'],
})
export class VrPreviewComponent implements OnInit {
  places: Place[] = [];
  filteredPlaces: Place[] = [];
  currentIndex: number = 0;
  searchQuery: string = '';
  isLoading: boolean = false;
  noResultsFound: boolean = false;

  constructor(private http: HttpClient, private unsplashService: UnsplashService) {}

  ngOnInit(): void {
    // Load JSON from assets
    this.http.get<any>('assets/data/dummydata.json').subscribe((data) => {
      const placesMap = data.placesMap;

      // Flatten all places into a single array
      Object.keys(placesMap).forEach((state) => {
        placesMap[state].forEach((place: Place) => this.places.push(place));
      });

      // Initialize filtered places with all places
      this.filteredPlaces = [...this.places];

      // Load image for the first place
      if (this.filteredPlaces.length > 0) {
        this.loadImage(this.currentPlace);
      }
    });
  }

  get currentPlace(): Place {
    return this.filteredPlaces[this.currentIndex];
  }

  loadImage(place: Place): void {
    if (!place) return;
    if (place.imgUrl) return; // Already loaded

    this.isLoading = true;
    const query = `${place.name} panorama`;

    this.unsplashService.searchPhotos(query, 1).subscribe({
      next: (res) => {
        if (res.results && res.results.length > 0) {
          place.imgUrl = res.results[0].urls.regular;
        } else {
          // fallback image
          place.imgUrl =
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080';
        }
        this.isLoading = false;
      },
      error: () => {
        place.imgUrl =
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080';
        this.isLoading = false;
      }
    });
  }

  onSearchChange(): void {
    const query = this.searchQuery.toLowerCase().trim();

    if (query === '') {
      // Reset to all places
      this.filteredPlaces = [...this.places];
      this.noResultsFound = false;
    } else {
      // Filter places by name or location
      this.filteredPlaces = this.places.filter(place =>
        place.name.toLowerCase().includes(query) ||
        place.location.toLowerCase().includes(query)
      );
      this.noResultsFound = this.filteredPlaces.length === 0;
    }

    // Reset to first item after filtering
    this.currentIndex = 0;

    // Load image for the first filtered place
    if (this.filteredPlaces.length > 0) {
      this.loadImage(this.currentPlace);
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.onSearchChange();
  }

  nextImage(): void {
    if (this.currentIndex < this.filteredPlaces.length - 1) {
      this.currentIndex++;
      this.loadImage(this.currentPlace);
    }
  }

  prevImage(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.loadImage(this.currentPlace);
    }
  }

  // Quick jump to a specific place (optional utility method)
  goToPlace(index: number): void {
    if (index >= 0 && index < this.filteredPlaces.length) {
      this.currentIndex = index;
      this.loadImage(this.currentPlace);
    }
  }
}