import { Component, inject } from '@angular/core';
import { UserSessionService, UserSession } from '../../services/user-session.service';
import { Observable } from 'rxjs';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase.config';
import { Router, NavigationEnd } from '@angular/router';  // 👈 Import NavigationEnd

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  menuOpen = false;
  showProfileMenu = false;

  private session = inject(UserSessionService);
  user$: Observable<UserSession | null> = this.session.user$;

  constructor(private router: Router) {
    // 👇 Close mobile menu & profile menu whenever route changes
    this.router.events.subscribe(event => {
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
      console.log('User logged out successfully');
      this.router.navigate(['/']); // 👈 Optional: Redirect to home after logout
    } catch (err) {
      console.error('Logout failed', err);
    }
  }
}
