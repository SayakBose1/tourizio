// import { Component, OnInit } from '@angular/core';
// import { UserSessionService, UserSession } from '../../services/user-session.service';
// import { BookingService, BookingData } from '../../services/booking.service';

// @Component({
//   selector: 'app-profile',
//   templateUrl: './profile.component.html',
//   styleUrls: ['./profile.component.css']
// })
// export class ProfileComponent implements OnInit {
//   user: UserSession | null = null;
//   bookings: BookingData[] = []; // <-- array for storing bookings

//   constructor(
//     private sessionService: UserSessionService,
//     private bookingService: BookingService
//   ) {}

//   ngOnInit(): void {
//     this.sessionService.user$.subscribe(u => {
//       this.user = u;

//       if (u) {
//         // Subscribe to Firestore Observable
//         this.bookingService.getUserBookings(u.uid).subscribe(bookings => {
//           this.bookings = bookings;
//         });
//       } else {
//         this.bookings = [];
//       }
//     });
//   }
// }
import { Component, OnInit } from '@angular/core';
import {
  UserSessionService,
  UserSession,
} from '../../services/user-session.service';
import { BookingService, BookingData } from '../../services/booking.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  user: UserSession | null = null;
  bookings: BookingData[] = [];
  loading = true; // add loading state

  constructor(
    private sessionService: UserSessionService,
    private bookingService: BookingService,
  ) {}

  ngOnInit(): void {
    this.sessionService.user$.subscribe((u) => {
      this.user = u;

      if (u) {
        this.loading = true;
        this.bookingService.getUserBookings(u.uid).subscribe((bookings) => {
          this.bookings = bookings;
          this.loading = false;
        });
      } else {
        this.bookings = [];
        this.loading = false;
      }
    });
  }

  // Fallback if Google profile photo breaks
  onImgError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/default-avatar.png';
  }

  checkMail() {
    if (!this.user?.email) return;

    // Extract domain from email
    const domain = this.user.email.split('@')[1].toLowerCase();

    if (domain.includes('gmail.com')) {
      window.open('https://mail.google.com', '_blank');
    } else if (
      domain.includes('outlook.com') ||
      domain.includes('hotmail.com') ||
      domain.includes('live.com')
    ) {
      window.open('https://outlook.live.com/mail/', '_blank');
    } else if (domain.includes('yahoo.com')) {
      window.open('https://mail.yahoo.com', '_blank');
    } else {
      // fallback: open default mail provider
      window.open(`https://${domain}`, '_blank');
    }
  }
}
