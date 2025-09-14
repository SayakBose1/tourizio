import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService, BookingData } from '../../services/booking.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';

interface Place {
  id: number;
  name: string;
  location: string;
  price: number;
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss']
})
export class BookingComponent implements OnInit {
  booking = { name: '', destination: '', date: '', people: 1 };
  selectedPlace: Place | null = null;
  placesMap: Record<string, Place[]> = {};

  // ✅ New properties
  successMessage = '';
  errorMessage = '';
  isBooking = false; // loading state for button

  constructor(
    private route: ActivatedRoute,
    private bookingService: BookingService,
    private afAuth: AngularFireAuth,
    private router: Router
  ) {}

  ngOnInit() {
    fetch('assets/data/dummydata.json')
      .then(res => res.json())
      .then((data: any) => {
        this.placesMap = data.placesMap || {};

        const placeId = +this.route.snapshot.queryParams['placeId'];
        if (placeId) this.prefillBooking(placeId);
      })
      .catch(err => console.error('Error loading places JSON', err));
  }

  prefillBooking(placeId: number) {
    const allPlaces: Place[] = Object.values(this.placesMap).flat();
    this.selectedPlace = allPlaces.find(p => p.id === placeId) || null;
    if (this.selectedPlace) this.booking.destination = this.selectedPlace.name;
  }

  async confirmBooking() {
    if (!this.selectedPlace) return alert('Please select a destination.');
    if (this.isBooking) return; // prevent multiple clicks

    const currentUser = await this.afAuth.currentUser;
    if (!currentUser) {
      return alert('You must be logged in to confirm a booking.');
    }

    this.isBooking = true;
    this.successMessage = '';
    this.errorMessage = '';

    const bookingData: BookingData & { userId: string; email?: string } = {
      userId: currentUser.uid,
      name: this.booking.name,
      destination: this.selectedPlace.name,
      date: this.booking.date,
      people: this.booking.people,
      price: this.selectedPlace.price,
      email: currentUser.email || ''
    };

    try {
      await this.bookingService.addBooking(bookingData);
      await this.bookingService.sendBookingMail(bookingData);

      alert('Booking successful! Please check your mail for booking details.');

      this.successMessage = 'Booking successful! A confirmation email has been sent.';
      this.errorMessage = '';

      // Reset form
      this.booking = { name: '', destination: '', date: '', people: 1 };
      this.selectedPlace = null;

      // Navigate to My Bookings page
      this.router.navigate(['/profile']);
    } catch (err) {
      console.error('Booking failed', err);
      alert('Booking failed. Please try again.');
      this.errorMessage = 'Booking failed. Please try again.';
      this.successMessage = '';
    } finally {
      this.isBooking = false;
    }
  }
}
