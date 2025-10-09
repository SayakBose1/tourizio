import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
  loading = true;
  showCancelSuccessToast = false;
  showCancelErrorToast = false;

  // ✅ Add booking success toast properties
  showBookingSuccessToast = false;
  bookingSuccessDetails: any = null;

  constructor(
    private sessionService: UserSessionService,
    private bookingService: BookingService,
    private router: Router, // ✅ Inject Router
  ) {
    // ✅ Check for navigation state in constructor
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      const state = navigation.extras.state;
      if (state['bookingSuccess']) {
        this.bookingSuccessDetails = state['bookingDetails'];
      }
    }
  }

  ngOnInit(): void {
    this.sessionService.user$.subscribe((u) => {
      this.user = u;

      if (u) {
        this.loading = true;
        this.bookingService.getUserBookings(u.uid).subscribe((bookings) => {
          this.bookings = bookings;
          this.loading = false;

          // ✅ Show success toast after bookings are loaded
          if (this.bookingSuccessDetails) {
            setTimeout(() => {
              this.showBookingSuccessToast = true;
              setTimeout(() => {
                this.showBookingSuccessToast = false;
                this.bookingSuccessDetails = null;
              }, 5000);
            }, 500);
          }
        });
      } else {
        this.bookings = [];
        this.loading = false;
      }
    });
  }

  onImgError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/default-avatar.png';
  }

  checkMail() {
    if (!this.user?.email) return;

    const domain = this.user.email.split('@')[1].toLowerCase();
    let webUrl = '';

    if (domain.includes('gmail.com')) {
      webUrl = 'https://mail.google.com/mail/u/0/#inbox';
    } else if (
      domain.includes('outlook.com') ||
      domain.includes('hotmail.com') ||
      domain.includes('live.com')
    ) {
      webUrl = 'https://outlook.live.com/mail/';
    } else if (domain.includes('yahoo.com')) {
      webUrl = 'https://mail.yahoo.com/';
    } else {
      webUrl = `https://${domain}`;
    }

    window.open(webUrl, '_blank');
  }

  private openLink(appUrl: string, webUrl: string) {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      const timeout = setTimeout(() => {
        window.open(webUrl, '_blank');
      }, 500);

      window.location.href = appUrl;
      window.addEventListener('blur', () => clearTimeout(timeout));
    } else {
      window.open(webUrl, '_blank');
    }
  }

  get memberSince(): Date | null {
    return this.user?.metadata?.creationTime
      ? new Date(this.user.metadata.creationTime)
      : null;
  }

  cancelBooking(bookingId: string | undefined): void {
    if (!bookingId) return;

    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    if (!confirm('Are you sure you want to cancel this booking?')) return;

    this.bookingService.deleteBooking(bookingId).subscribe({
      next: () => {
        this.bookings = this.bookings.filter((b) => b.id !== bookingId);
        this.showCancelSuccessToast = true;
        setTimeout(() => (this.showCancelSuccessToast = false), 5000);

        this.bookingService
          .sendCancellationMail(booking)
          .then(() => console.log('Cancellation email sent'))
          .catch((err) =>
            console.error('Failed to send cancellation email', err),
          );
      },
      error: (err) => {
        console.error(err);
        this.showCancelErrorToast = true;
        setTimeout(() => (this.showCancelErrorToast = false), 5000);
      },
    });
  }

  closeCancelSuccessToast() {
    this.showCancelSuccessToast = false;
  }

  closeCancelErrorToast() {
    this.showCancelErrorToast = false;
  }

  // ✅ Add method to close booking success toast
  closeBookingSuccessToast() {
    this.showBookingSuccessToast = false;
    this.bookingSuccessDetails = null;
  }
}
