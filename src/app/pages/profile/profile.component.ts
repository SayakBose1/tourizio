import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  UserSessionService,
  UserSession,
} from '../../services/user-session.service';
import { BookingService, BookingData } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { ChangeDetectorRef } from '@angular/core';

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

  // Delete Account Modal
  showDeleteModal = false;
  deletePassword = '';
  deleteLoading = false;
  showDeleteErrorToast = false;
  deleteErrorMessage = '';
  showDeleteSuccessToast = false;

  // Change Password Modal
  showChangePasswordModal = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordLoading = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  showPasswordSuccessToast = false;
  showPasswordErrorToast = false;
  passwordErrorMessage = '';

  // Update Profile Modal
  showUpdateProfileModal = false;
  newDisplayName = '';
  profileLoading = false;
  showProfileSuccessToast = false;
  showProfileErrorToast = false;
  profileErrorMessage = '';

  // Email Preferences Modal
  showEmailPreferencesModal = false;
  emailPreferences = {
    bookingConfirmations: true,
    promotions: true,
    travelUpdates: true,
    newsletter: false,
  };
  preferencesLoading = false;
  showPreferencesSuccessToast = false;
  showPreferencesErrorToast = false;
  preferencesErrorMessage = '';

  // Change Avatar Modal
  showChangeAvatarModal = false;
  selectedAvatar: string | null = null;
  avatarLoading = false;
  uploadedFile: File | null = null;
  showAvatarSuccessToast = false;
  showAvatarErrorToast = false;
  avatarErrorMessage = '';

  constructor(
    private sessionService: UserSessionService,
    private bookingService: BookingService,
    private authService: AuthService,
    private afAuth: AngularFireAuth,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {
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

  toggleSettings() {
    this.showSettings = !this.showSettings;
  }

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
    if (!this.user.isGoogleUser && !this.deletePassword) {
      this.deleteErrorMessage =
        'Please enter your password to confirm deletion.';
      this.showDeleteErrorToast = true;
      setTimeout(() => (this.showDeleteErrorToast = false), 5000);
      return;
    }
    this.deleteLoading = true;

    try {
      if (this.user.isGoogleUser) {
        await this.authService.reauthenticateWithGoogle();
      } else {
        await this.authService.reauthenticate(this.deletePassword);
      }

      await this.authService.deleteAccount();

      this.deleteLoading = false;
      this.showDeleteModal = false;
      this.showDeleteSuccessToast = true;
      setTimeout(() => (this.showDeleteSuccessToast = false), 5000);
    } catch (error: any) {
      this.deleteLoading = false;
      this.showDeleteModal = false;

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
  closeDeleteSuccessToast() {
    this.showDeleteSuccessToast = false;
  }

  // ✅ Change Password Methods
  openChangePassword() {
    if (this.user?.isGoogleUser) {
      alert(
        '⚠️ Google users cannot change password here.\n\nPlease manage your password through your Google account settings.',
      );
      this.showSettings = false;
      return;
    }

    this.showSettings = false;
    this.showChangePasswordModal = true;
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }

  closeChangePasswordModal() {
    this.showChangePasswordModal = false;
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordLoading = false;
    this.showCurrentPassword = false;
    this.showNewPassword = false;
    this.showConfirmPassword = false;
  }

  async confirmChangePassword() {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.passwordErrorMessage = 'Please fill in all fields.';
      this.showPasswordErrorToast = true;
      setTimeout(() => (this.showPasswordErrorToast = false), 5000);
      return;
    }

    if (this.newPassword.length < 6) {
      this.passwordErrorMessage =
        'New password must be at least 6 characters long.';
      this.showPasswordErrorToast = true;
      setTimeout(() => (this.showPasswordErrorToast = false), 5000);
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.passwordErrorMessage = 'New passwords do not match.';
      this.showPasswordErrorToast = true;
      setTimeout(() => (this.showPasswordErrorToast = false), 5000);
      return;
    }

    if (this.currentPassword === this.newPassword) {
      this.passwordErrorMessage =
        'New password must be different from current password.';
      this.showPasswordErrorToast = true;
      setTimeout(() => (this.showPasswordErrorToast = false), 5000);
      return;
    }

    this.passwordLoading = true;

    try {
      await this.authService.reauthenticate(this.currentPassword);
      const user = await this.afAuth.currentUser;
      if (user) {
        await user.updatePassword(this.newPassword);
        this.passwordLoading = false;
        this.closeChangePasswordModal();
        this.showPasswordSuccessToast = true;
        setTimeout(() => (this.showPasswordSuccessToast = false), 5000);
      }
    } catch (error: any) {
      this.passwordLoading = false;
      console.error('Change password error:', error);
      this.passwordErrorMessage =
        error.code === 'auth/wrong-password'
          ? 'Current password is incorrect.'
          : error.message || 'Failed to change password.';
      this.showPasswordErrorToast = true;
      setTimeout(() => (this.showPasswordErrorToast = false), 5000);
    }
  }

  closePasswordSuccessToast() {
    this.showPasswordSuccessToast = false;
  }
  closePasswordErrorToast() {
    this.showPasswordErrorToast = false;
  }

  // ✅ Update Profile Methods
  openUpdateProfile() {
    this.showSettings = false;
    this.showUpdateProfileModal = true;
    this.newDisplayName = this.user?.displayName || '';
  }

  closeUpdateProfileModal() {
    this.showUpdateProfileModal = false;
    this.newDisplayName = '';
    this.profileLoading = false;
  }

  async confirmUpdateProfile() {
    if (!this.newDisplayName || !this.newDisplayName.trim()) {
      this.profileErrorMessage = 'Please enter a display name.';
      this.showProfileErrorToast = true;
      setTimeout(() => (this.showProfileErrorToast = false), 5000);
      return;
    }

    const trimmedName = this.newDisplayName.trim();

    if (trimmedName === this.user?.displayName) {
      this.profileErrorMessage = 'No changes were made.';
      this.showProfileErrorToast = true;
      setTimeout(() => (this.showProfileErrorToast = false), 5000);
      return;
    }

    this.profileLoading = true;

    try {
      const user = await this.afAuth.currentUser;
      if (user) {
        await user.updateProfile({ displayName: trimmedName });
        if (this.user) {
          this.user.displayName = trimmedName;
          this.sessionService.setUser(this.user);
        }
        this.profileLoading = false;
        this.closeUpdateProfileModal();
        this.showProfileSuccessToast = true;
        setTimeout(() => (this.showProfileSuccessToast = false), 5000);
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      this.profileLoading = false;
      this.profileErrorMessage =
        error.message || 'Failed to update profile. Please try again.';
      this.showProfileErrorToast = true;
      setTimeout(() => (this.showProfileErrorToast = false), 5000);
    }
  }

  closeProfileSuccessToast() {
    this.showProfileSuccessToast = false;
  }
  closeProfileErrorToast() {
    this.showProfileErrorToast = false;
  }

  // ✅ Email Preferences Methods
  openEmailPreferences() {
    this.showSettings = false;
    this.showEmailPreferencesModal = true;
  }

  closeEmailPreferencesModal() {
    this.showEmailPreferencesModal = false;
    this.preferencesLoading = false;
  }

  loadEmailPreferences() {
    if (!this.user) return;
    const saved = localStorage.getItem(`emailPrefs_${this.user.uid}`);
    if (saved) {
      try {
        this.emailPreferences = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load email preferences', e);
      }
    }
  }

  saveEmailPreferences() {
    if (!this.user) return;
    this.preferencesLoading = true;

    setTimeout(() => {
      localStorage.setItem(
        `emailPrefs_${this.user!.uid}`,
        JSON.stringify(this.emailPreferences),
      );
      this.preferencesLoading = false;
      this.closeEmailPreferencesModal();
      this.showPreferencesSuccessToast = true;
      setTimeout(() => (this.showPreferencesSuccessToast = false), 5000);
    }, 500);
  }

  closePreferencesSuccessToast() {
    this.showPreferencesSuccessToast = false;
  }
  closePreferencesErrorToast() {
    this.showPreferencesErrorToast = false;
  }

  presetAvatars = [
    {
      name: 'Ninja',
      url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ninja',
    },
    {
      name: 'Pilot',
      url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pilot',
    },
    {
      name: 'Doctor',
      url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Doctor',
    },
    {
      name: 'Chef',
      url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chef',
    },
    {
      name: 'Artist',
      url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Artist',
    },
    {
      name: 'Gamer',
      url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gamer',
    },
    {
      name: 'Scientist',
      url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Scientist',
    },
    {
      name: 'Explorer',
      url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=explorer&accessories=sunglasses&clothing=hoodie&eyebrows=default&eyes=happy&mouth=smile&top=hat',
    },
    {
      name: 'Superhero',
      url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Superhero',
    },
    {
      name: 'Astronaut',
      url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Astronaut',
    },
    {
      name: 'Teacher',
      url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher',
    },
    {
      name: 'Musician',
      url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Musician',
    },
  ];

  openChangeAvatar() {
    this.showSettings = false;
    this.showChangeAvatarModal = true;
    this.selectedAvatar = this.user?.photoURL || null;
    this.uploadedFile = null;
  }

  closeChangeAvatarModal() {
    this.showChangeAvatarModal = false;
    this.selectedAvatar = null;
    this.uploadedFile = null;
    this.avatarLoading = false;
  }

  selectPresetAvatar(avatar: { name: string; url: string }) {
    this.selectedAvatar = avatar.url;
    this.uploadedFile = null;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.avatarErrorMessage = 'Please select an image file.';
      this.showAvatarErrorToast = true;
      setTimeout(() => (this.showAvatarErrorToast = false), 5000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.avatarErrorMessage = 'File size must be less than 5MB.';
      this.showAvatarErrorToast = true;
      setTimeout(() => (this.showAvatarErrorToast = false), 5000);
      return;
    }

    this.uploadedFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.selectedAvatar = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  async confirmChangeAvatar() {
    if (!this.selectedAvatar) {
      this.avatarErrorMessage = 'Please select an avatar.';
      this.showAvatarErrorToast = true;
      setTimeout(() => (this.showAvatarErrorToast = false), 5000);
      return;
    }

    this.avatarLoading = true;

    try {
      const user = await this.afAuth.currentUser;
      if (user) {
        await user.updateProfile({ photoURL: this.selectedAvatar });
        if (this.user) {
          // ✅ Pass a new object to trigger change detection
          this.user = {
            ...this.user,
            photoURL: this.selectedAvatar,
          };
          this.sessionService.setUser(this.user);
        }

        this.avatarLoading = false;
        this.closeChangeAvatarModal();
        this.showAvatarSuccessToast = true;
        setTimeout(() => (this.showAvatarSuccessToast = false), 5000);
      }
    } catch (error: any) {
      console.error('Update avatar error:', error);
      this.avatarLoading = false;
      this.avatarErrorMessage =
        error.message || 'Failed to update avatar. Please try again.';
      this.showAvatarErrorToast = true;
      setTimeout(() => (this.showAvatarErrorToast = false), 5000);
    }
  }

  closeAvatarSuccessToast() {
    this.showAvatarSuccessToast = false;
  }

  closeAvatarErrorToast() {
    this.showAvatarErrorToast = false;
  }
}
