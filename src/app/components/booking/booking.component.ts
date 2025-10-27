import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../../services/booking.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';

interface Place {
  id: number;
  name: string;
  location: string;
  price: number;
  days?: number;
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss'],
})
export class BookingComponent implements OnInit {
  booking = {
    name: '',
    destination: '',
    date: '',
    people: null as number | null,
  };
  selectedPlace: Place | null = null;
  placesMap: Record<string, Place[]> = {};
  allPlaces: Place[] = [];
  isManualSelection = false; // Track if user manually selected from dropdown

  successMessage = '';
  errorMessage = '';
  isBooking = false;

  constructor(
    private route: ActivatedRoute,
    private bookingService: BookingService,
    private afAuth: AngularFireAuth,
    private router: Router,
  ) {}

  ngOnInit() {
    fetch('assets/data/dummydata.json')
      .then((res) => res.json())
      .then((data: any) => {
        this.placesMap = data.placesMap || {};
        // Flatten all places into a single array for dropdown
        this.allPlaces = Object.values(this.placesMap).flat();

        const placeId = +this.route.snapshot.queryParams['placeId'];
        if (placeId) {
          this.prefillBooking(placeId);
        }
      })
      .catch((err) => console.error('Error loading places JSON', err));
  }

  prefillBooking(placeId: number) {
    this.selectedPlace = this.allPlaces.find((p) => p.id === placeId) || null;
    if (this.selectedPlace) {
      this.booking.destination = this.selectedPlace.name;
      this.isManualSelection = false; // This came from destinations page
    }
  }

  onDestinationChange(placeName: string) {
    if (!placeName) {
      this.selectedPlace = null;
      this.booking.destination = '';
      return;
    }

    this.selectedPlace = this.allPlaces.find((p) => p.name === placeName) || null;
    if (this.selectedPlace) {
      this.booking.destination = this.selectedPlace.name;
      this.isManualSelection = true; // User manually selected from dropdown
    }
  }

  async confirmBooking() {
    if (!this.selectedPlace) {
      return alert('Please select a destination.');
    }

    if (!this.booking.people || this.booking.people < 1) {
      return alert('Please enter number of people.');
    }

    const currentUser = await this.afAuth.currentUser;
    if (!currentUser) {
      return alert('You must be logged in to confirm a booking.');
    }

    // Prepare booking data
    const bookingData = {
      userId: currentUser.uid,
      name: this.booking.name,
      destination: this.selectedPlace.name,
      date: this.booking.date,
      people: this.booking.people,
      price: this.selectedPlace.price,
      email: currentUser.email || '',
    };

    // Save pending booking in localStorage for Payment page
    localStorage.setItem('pendingBooking', JSON.stringify(bookingData));

    // ✅ Redirect to payment page
    this.router.navigate(['/payment']);
  }

  calculateProgress(): number {
    let progress = 0;
    const totalFields = 4; // name, destination, date, people

    if (this.booking.name) progress += 25;
    if (this.booking.destination) progress += 25;
    if (this.booking.date) progress += 25;
    if (this.booking.people && this.booking.people >= 1) progress += 25;

    return progress;
  }
}