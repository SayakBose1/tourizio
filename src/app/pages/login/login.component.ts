import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { GoogleAuthProvider } from 'firebase/auth';
import { UserSessionService } from '../../services/user-session.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  isEmailNotVerified = false;
  userEmail = '';
  showSuccessToast = false;
  showErrorToast = false;
  successMessage = '';
  errorMessage = '';

  private afAuth = inject(AngularFireAuth);
  private fb = inject(FormBuilder);
  private session = inject(UserSessionService);
  private router = inject(Router);

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  async onLogin() {
    Object.keys(this.loginForm.controls).forEach((key) => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
      control?.markAsDirty();
    });

    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    try {
      const userCredential = await this.afAuth.signInWithEmailAndPassword(
        email,
        password,
      );

      // Check email verification
      if (!userCredential.user?.emailVerified) {
        this.showErrorToast = true;
        this.errorMessage = 'Email not verified. Please check your inbox.';
        setTimeout(() => (this.showErrorToast = false), 5000);
        await userCredential.user.sendEmailVerification();
        this.userEmail = email;
        return;
      }

      // Successful login
      this.session.setUser({
        uid: userCredential.user.uid,
        email: email,
        displayName: userCredential.user.displayName || email.split('@')[0],
        isGoogleUser: false,
      });

      this.showSuccessToast = true;
      this.successMessage = `Welcome back, ${userCredential.user.displayName || email.split('@')[0]}!`;
      setTimeout(() => (this.showSuccessToast = false), 5000);

      this.router.navigate(['/']);
    } catch (error: any) {
      // Handle Firebase auth errors
      this.showErrorToast = true;
      if (error.code === 'auth/user-not-found') {
        this.errorMessage = 'User not found. Please sign up first.';
      } else if (error.code === 'auth/wrong-password') {
        this.errorMessage = 'Incorrect password. Try again.';
      } else if (error.code === 'auth/invalid-email') {
        this.errorMessage = 'Invalid email format.';
      } else if (error.code === 'auth/invalid-credential') {
        this.errorMessage = 'Invalid credentials. Check email or login method.';
      } else {
        this.errorMessage = error.message || 'Login failed. Try again.';
      }

      setTimeout(() => (this.showErrorToast = false), 5000);
    } finally {
      this.isLoading = false;
    }
  }

  async loginWithGoogle() {
    this.isLoading = true;
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await this.afAuth.signInWithPopup(provider);
      if (userCredential.user) {
        this.session.setUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email!,
          displayName: userCredential.user.displayName || '',
          photoURL: userCredential.user.photoURL || '',
          isGoogleUser: true,
        });
        this.router.navigate(['/']);
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      this.isLoading = false;
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async resendVerificationEmail() {
    const user = await this.afAuth.currentUser;
    if (user) {
      await user.sendEmailVerification();
      alert('Verification email resent!');
    }
  }

  goToSignup() {
    this.router.navigate(['/signup']);
  }
}
