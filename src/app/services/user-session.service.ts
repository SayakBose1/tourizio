import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { BehaviorSubject } from 'rxjs';

export interface UserSession {
  uid: string;
  displayName: string;
  email: string;
  isGoogleUser: boolean;
  photoURL?: string;
  metadata?: {
    creationTime?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class UserSessionService {
  private userSubject = new BehaviorSubject<UserSession | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private afAuth: AngularFireAuth) {
    // Keep session alive on app reload
    this.afAuth.authState.subscribe(async (firebaseUser) => {
      if (firebaseUser) {
        const providerData = firebaseUser.providerData || [];
        const isGoogleUser = providerData.some(
          (p) => p?.providerId === 'google.com',
        );

        if (isGoogleUser || firebaseUser.emailVerified) {
          const userData: UserSession = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || '',
            email: firebaseUser.email || '',
            isGoogleUser,
            photoURL: firebaseUser.photoURL || '',
            metadata: {
              creationTime: firebaseUser.metadata?.creationTime,
            },
          };

          // Preload image if it's a Google user with photo
          if (isGoogleUser && firebaseUser.photoURL) {
            await this.preloadImage(firebaseUser.photoURL);
          }

          // Set session automatically on reload/login
          this.userSubject.next(userData);
        } else {
          this.userSubject.next(null);
        }
      } else {
        this.userSubject.next(null);
      }
    });
  }

  /**
   * Preloads an image to browser cache for faster display
   */
  private preloadImage(url: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve();
      };
      img.onerror = () => {
        // Resolve anyway to avoid blocking user session
        console.warn('Failed to preload user photo:', url);
        resolve();
      };
      img.src = url;
    });
  }

  /**
   * Manually set user session
   */
  setUser(user: UserSession): void {
    this.userSubject.next(user);
  }

  /**
   * Get current user synchronously
   */
  getCurrentUser(): UserSession | null {
    return this.userSubject.value;
  }

  /**
   * Clear user session and sign out
   */
  clearUser(): void {
    this.userSubject.next(null);
    this.afAuth.signOut();
  }
}
