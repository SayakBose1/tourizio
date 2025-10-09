// import { Injectable } from '@angular/core';
// import { AngularFireAuth } from '@angular/fire/compat/auth';
// import firebase from 'firebase/compat/app';
// import { Router } from '@angular/router';
// import { UserSessionService } from './user-session.service'; // Add this import

// @Injectable({
//   providedIn: 'root'
// })
// export class AuthService {
//   constructor(
//     private afAuth: AngularFireAuth,
//     private router: Router,
//     private userSessionService: UserSessionService // Inject this
//   ) {}

//   // Signup
//   signUp(email: string, password: string) {
//     return this.afAuth.createUserWithEmailAndPassword(email, password);
//   }

//   // Login
//   login(email: string, password: string) {
//     return this.afAuth.signInWithEmailAndPassword(email, password);
//   }

//   // Logout - Improved version
//   async logout() {
//     try {
//       await this.afAuth.signOut();
//       this.userSessionService.clearUser(); // Clear user session
//       this.router.navigate(['/login']);
//     } catch (error) {
//       console.error('Logout error:', error);
//       throw error;
//     }
//   }

//   // Google Sign In
//   async signInWithGoogle() {
//     try {
//       const provider = new firebase.auth.GoogleAuthProvider();
//       return await this.afAuth.signInWithPopup(provider);
//     } catch (error) {
//       console.error('Google sign in error:', error);
//       throw error;
//     }
//   }

//   // Get current user
//   getUser() {
//     return this.afAuth.authState;
//   }

//   // Get current user promise (useful for route guards)
//   getCurrentUser() {
//     return this.afAuth.currentUser;
//   }
// }
import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import { Router } from '@angular/router';
import { UserSessionService } from './user-session.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router,
    private userSessionService: UserSessionService,
  ) {}

  // Signup
  signUp(email: string, password: string) {
    return this.afAuth.createUserWithEmailAndPassword(email, password);
  }

  // Login
  login(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  // Logout - Signs out user but keeps account
  async logout() {
    try {
      await this.afAuth.signOut();
      this.userSessionService.clearUser();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Delete Account - Completely removes user from Firebase Auth and Firestore
  async deleteAccount() {
    try {
      const user = await this.afAuth.currentUser;

      if (!user) {
        throw new Error('No user is currently signed in');
      }

      const uid = user.uid;

      // 1. Delete user data from Firestore (adjust collection names as needed)
      await this.deleteUserDataFromFirestore(uid);

      // 2. Delete user from Firebase Authentication
      await user.delete();

      // 3. Clear session and redirect
      this.userSessionService.clearUser();
      console.log('✅ Account deleted successfully');
    } catch (error: any) {
      console.error('Delete account error:', error);

      // Handle re-authentication requirement
      if (error.code === 'auth/requires-recent-login') {
        throw new Error(
          'For security reasons, please log in again before deleting your account.',
        );
      }

      throw error;
    }
  }

  // Delete user data from Firestore
  private async deleteUserDataFromFirestore(uid: string) {
    try {
      // Delete from users collection
      await this.firestore.collection('users').doc(uid).delete();

      // Delete user's bookings
      const bookingsSnapshot = await this.firestore
        .collection('bookings', (ref) => ref.where('userId', '==', uid))
        .get()
        .toPromise();

      if (bookingsSnapshot) {
        const batch = this.firestore.firestore.batch();
        bookingsSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }

      console.log('✅ User data deleted from Firestore');
    } catch (error) {
      console.error('Error deleting Firestore data:', error);
      throw error;
    }
  }

  // Re-authenticate user (needed before sensitive operations like account deletion)
  async reauthenticate(password: string) {
    try {
      const user = await this.afAuth.currentUser;

      if (!user || !user.email) {
        throw new Error('No user is currently signed in');
      }

      const credential = firebase.auth.EmailAuthProvider.credential(
        user.email,
        password,
      );

      await user.reauthenticateWithCredential(credential);
      console.log('✅ Re-authentication successful');
    } catch (error) {
      console.error('Re-authentication error:', error);
      throw error;
    }
  }

  // Re-authenticate Google user
  async reauthenticateWithGoogle() {
    try {
      const user = await this.afAuth.currentUser;

      if (!user) {
        throw new Error('No user is currently signed in');
      }

      const provider = new firebase.auth.GoogleAuthProvider();
      await user.reauthenticateWithPopup(provider);
      console.log('✅ Re-authentication successful');
    } catch (error) {
      console.error('Re-authentication error:', error);
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

  // Get current user promise
  getCurrentUser() {
    return this.afAuth.currentUser;
  }
}
