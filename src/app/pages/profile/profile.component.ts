import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  UserSessionService,
  UserSession,
} from '../../services/user-session.service';
import { BookingService, BookingData } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';

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
  showBookingSuccessToast = false;
  bookingSuccessDetails: any = null;
  showSettings = false;
  showDeleteModal = false;
  deletePassword = '';
  deleteLoading = false;
  showDeleteErrorToast = false;
  deleteErrorMessage = '';
  showDeleteSuccessToast = false;
  showChangePasswordModal = false;
  newPassword = '';
  showUpdateProfileModal = false;
  updatedDisplayName = '';
  showEmailPreferencesModal = false;
  prefBookingEmails = false;
  prefPromotions = false;
  showChangeProfileModal = false;

  constructor(
    private sessionService: UserSessionService,
    private bookingService: BookingService,
    private authService: AuthService,
    private router: Router,
  ) {
    // Check for navigation state in constructor
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

          // Show success toast after bookings are loaded
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

  closeBookingSuccessToast() {
    this.showBookingSuccessToast = false;
    this.bookingSuccessDetails = null;
  }

  // Settings panel methods
  toggleSettings() {
    this.showSettings = !this.showSettings;
  }

  // Delete account methods
  openDeleteAccount() {
    this.showDeleteModal = true;
    this.showSettings = false;
    this.deletePassword = '';
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.deletePassword = '';
    this.deleteLoading = false;
  }

  async confirmDeleteAccount() {
    if (!this.user) return;

    // Validate password for email/password users
    if (!this.user.isGoogleUser && !this.deletePassword) {
      this.deleteErrorMessage =
        'Please enter your password to confirm deletion.';
      this.showDeleteErrorToast = true;
      setTimeout(() => (this.showDeleteErrorToast = false), 5000);
      return;
    }

    this.deleteLoading = true;

    try {
      // Re-authenticate before deleting
      if (this.user.isGoogleUser) {
        await this.authService.reauthenticateWithGoogle();
      } else {
        await this.authService.reauthenticate(this.deletePassword);
      }

      // Delete the account
      await this.authService.deleteAccount();

      // ✅ Show success toast
      this.deleteLoading = false;
      this.showDeleteModal = false;
      this.showDeleteSuccessToast = true;

      // Hide success toast after 5 seconds
      setTimeout(() => (this.showDeleteSuccessToast = false), 5000);
    } catch (error: any) {
      this.deleteLoading = false;
      this.showDeleteModal = false;

      // Handle different error types
      if (error.code === 'auth/wrong-password') {
        this.deleteErrorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/requires-recent-login') {
        this.deleteErrorMessage =
          'For security reasons, please log out and log back in before deleting your account.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        this.deleteErrorMessage = 'Authentication cancelled. Please try again.';
      } else if (error.message) {
        this.deleteErrorMessage = error.message;
      } else {
        this.deleteErrorMessage = 'Failed to delete account. Please try again.';
      }

      this.showDeleteErrorToast = true;
      setTimeout(() => (this.showDeleteErrorToast = false), 5000);
    }
  }

  closeDeleteErrorToast() {
    this.showDeleteErrorToast = false;
  }

  // ✅ Close delete success toast
  closeDeleteSuccessToast() {
    this.showDeleteSuccessToast = false;
  }

  // Change Password
  openChangePassword() {
    this.showChangePasswordModal = true;
    this.showSettings = false;
  }

  closeChangePasswordModal() {
    this.showChangePasswordModal = false;
    this.newPassword = '';
  }

  async updatePassword() {
    if (!this.newPassword) return alert('Enter new password');

    try {
      const user = await this.authService.getCurrentUser();
      if (user) {
        await user.updatePassword(this.newPassword);
        alert('Password updated successfully');
        this.closeChangePasswordModal();
      }
    } catch (error: any) {
      alert(error.message || 'Failed to update password');
    }
  }

  // Update Profile
  openUpdateProfile() {
    this.showUpdateProfileModal = true;
    this.showSettings = false;
    this.updatedDisplayName = this.user?.displayName || '';
  }

  closeUpdateProfileModal() {
    this.showUpdateProfileModal = false;
  }

  async saveProfileUpdate() {
    if (!this.updatedDisplayName) return alert('Enter display name');

    try {
      const user = await this.authService.getCurrentUser();
      if (user) {
        await user.updateProfile({ displayName: this.updatedDisplayName });
        alert('Profile updated successfully');
        this.user!.displayName = this.updatedDisplayName; // update locally
        this.closeUpdateProfileModal();
      }
    } catch (error: any) {
      alert(error.message || 'Failed to update profile');
    }
  }

  // Email Preferences
  openEmailPreferences() {
    this.showEmailPreferencesModal = true;
    this.showSettings = false;

    // Load current preferences from user metadata or Firestore
    // Example placeholders:
    this.prefBookingEmails = true;
    this.prefPromotions = false;
  }

  closeEmailPreferencesModal() {
    this.showEmailPreferencesModal = false;
  }

  saveEmailPreferences() {
    // TODO: Save preferences to Firestore
    alert('Email preferences saved');
    this.closeEmailPreferencesModal();
  }

  predefinedAvatars: string[] = [
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Phoenix',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Nebula',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Thunder',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Eclipse',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Cosmic',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Cipher',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Quantum',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Velvet',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Doctor',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Ninja',
  ];

  selectedAvatar: string | null = null;
  customAvatar: string | null = null;

  openChangeProfileModal() {
    this.showChangeProfileModal = true;
    this.showSettings = false;
    this.selectedAvatar = this.user?.photoURL || null;
    this.customAvatar = null;
  }

  closeChangeProfileModal() {
    this.showChangeProfileModal = false;
    this.selectedAvatar = null;
    this.customAvatar = null;
  }

  selectAvatar(avatar: string) {
    this.selectedAvatar = avatar;
    this.customAvatar = null; // reset custom if predefined is selected
  }

  uploadCustomAvatar(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.customAvatar = e.target.result;
        this.selectedAvatar = null; // reset predefined if custom is selected
      };
      reader.readAsDataURL(file);
    }
  }

  async saveProfileAvatar() {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user) return;

      let avatarUrl = this.selectedAvatar || this.customAvatar;
      if (!avatarUrl) return alert('Select or upload an avatar');

      await user.updateProfile({ photoURL: avatarUrl });

      // Update locally
      this.user!.photoURL = avatarUrl;
      alert('Profile avatar updated successfully');
      this.closeChangeProfileModal();
    } catch (error: any) {
      alert(error.message || 'Failed to update avatar');
    }
  }
}
