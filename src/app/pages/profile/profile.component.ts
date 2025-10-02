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
  loading = true; // loading state for bookings

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

  // Open inbox on desktop or mobile
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

    // Open web inbox in new tab (works for desktop and mobile reliably)
    window.open(webUrl, '_blank');
  }

  // Helper function: open app if mobile, else web
  private openLink(appUrl: string, webUrl: string) {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      // Try opening app; fallback to web after 500ms
      const timeout = setTimeout(() => {
        window.open(webUrl, '_blank');
      }, 500);

      // Attempt to open app
      window.location.href = appUrl;

      // Clear timeout if app opens (blur event triggers)
      window.addEventListener('blur', () => clearTimeout(timeout));
    } else {
      // Desktop: open web inbox
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

    if (!confirm('Are you sure you want to cancel this booking?')) return;

    this.bookingService.deleteBooking(bookingId).subscribe({
      next: () => {
        // Remove the cancelled booking from local array
        this.bookings = this.bookings.filter((b) => b.id !== bookingId);
        alert('Booking cancelled successfully!');
      },
      error: (err) => {
        console.error(err);
        alert('Failed to cancel booking. Try again.');
      },
    });
  }
}
