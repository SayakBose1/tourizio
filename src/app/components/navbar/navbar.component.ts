import { Component, inject } from '@angular/core';
import { HostListener } from '@angular/core';
import {
  UserSessionService,
  UserSession,
} from '../../services/user-session.service';
import { Observable } from 'rxjs';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase.config';
import { Router, NavigationEnd } from '@angular/router'; // 👈 Import NavigationEnd

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  menuOpen = false;
  showProfileMenu = false;
  showLogoutSuccessToast = false;
  showLogoutErrorToast = false;

  private session = inject(UserSessionService);
  user$: Observable<UserSession | null> = this.session.user$;

  constructor(private router: Router) {
    // 👇 Close mobile menu & profile menu whenever route changes
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.menuOpen = false;
        this.showProfileMenu = false;
      }
    });
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  async logout() {
    try {
      await signOut(auth);
      this.session.clearUser();
      this.showProfileMenu = false;

      // Show success toast
      this.showLogoutSuccessToast = true;
      setTimeout(() => (this.showLogoutSuccessToast = false), 5000);

      this.router.navigate(['/']); // Optional: redirect home
    } catch (err) {
      console.error('Logout failed', err);

      // Show error toast
      this.showLogoutErrorToast = true;
      setTimeout(() => (this.showLogoutErrorToast = false), 5000);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const clickedInside = target.closest('.profile-dropdown-container');

    if (!clickedInside && this.showProfileMenu) {
      this.showProfileMenu = false;
    }
  }

  closeLogoutSuccessToast() {
    this.showLogoutSuccessToast = false;
  }

  closeLogoutErrorToast() {
    this.showLogoutErrorToast = false;
  }
}
