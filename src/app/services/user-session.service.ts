import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { BehaviorSubject } from 'rxjs';

export interface UserSession {
  uid: string;               // Unique Firebase UID
  displayName: string;
  email: string;
  isGoogleUser: boolean;
  photoURL?: string;
   metadata?: {
    creationTime?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class UserSessionService {
  private userSubject = new BehaviorSubject<UserSession | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private afAuth: AngularFireAuth) {
    // Keep session alive on app reload
    this.afAuth.authState.subscribe(firebaseUser => {
      if (firebaseUser) {
        const providerData = firebaseUser.providerData || [];
        const isGoogleUser = providerData.some(p => p.providerId === 'google.com');

        if (isGoogleUser || firebaseUser.emailVerified) {
          // Set session automatically on reload/login
          this.userSubject.next({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || '',
            email: firebaseUser.email || '',
            isGoogleUser,
            photoURL: firebaseUser.photoURL || '',
            metadata: {
            creationTime: firebaseUser.metadata?.creationTime
          }
          });
        } else {
          this.userSubject.next(null);
        }
      } else {
        this.userSubject.next(null);
      }
    });
  }
  
  setUser(user: UserSession) {
    this.userSubject.next(user);
  }

  clearUser() {
    this.userSubject.next(null);
    this.afAuth.signOut();
  }
}
