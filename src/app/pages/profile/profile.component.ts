import { Component, OnInit } from '@angular/core';
import { UserSessionService, UserSession } from '../../services/user-session.service';
import { BookingService, BookingData } from '../../services/booking.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: UserSession | null = null;
  bookings: BookingData[] = []; // <-- array for storing bookings

  constructor(
    private sessionService: UserSessionService,
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    this.sessionService.user$.subscribe(u => {
      this.user = u;

      if (u) {
        // Subscribe to Firestore Observable
        this.bookingService.getUserBookings(u.uid).subscribe(bookings => {
          this.bookings = bookings;
        });
      } else {
        this.bookings = [];
      }
    });
  }
}
