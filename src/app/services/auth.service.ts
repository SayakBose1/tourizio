import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { Router } from '@angular/router';
import { UserSessionService } from './user-session.service'; // Add this import

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private afAuth: AngularFireAuth, 
    private router: Router,
    private userSessionService: UserSessionService // Inject this
  ) {}

  // Signup
  signUp(email: string, password: string) {
    return this.afAuth.createUserWithEmailAndPassword(email, password);
  }

  // Login
  login(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  // Logout - Improved version
  async logout() {
    try {
      await this.afAuth.signOut();
      this.userSessionService.clearUser(); // Clear user session
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Google Sign In
  async signInWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      return await this.afAuth.signInWithPopup(provider);
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  }

  // Get current user
  getUser() {
    return this.afAuth.authState;
  }

  // Get current user promise (useful for route guards)
  getCurrentUser() {
    return this.afAuth.currentUser;
  }
}