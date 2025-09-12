import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { UserSessionService } from '../../services/user-session.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  signupForm!: FormGroup;
  showPassword = false;
  isLoading = false;
  isEmailSent = false;
  userEmail = '';
  resendCountdown = 0;
  isResendDisabled = false;

  private afAuth = inject(AngularFireAuth);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private session = inject(UserSessionService);

  ngOnInit(): void {
    this.signupForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  // Email/Password signup (DO NOT set session here)
  async onSignup() {
  if (this.signupForm.valid && !this.isLoading) {
    this.isLoading = true;
    const { email, password, name } = this.signupForm.value;

    try {
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
      await userCredential.user?.updateProfile({ displayName: name });
      await userCredential.user?.sendEmailVerification();

      this.isEmailSent = true;
      this.userEmail = email;

      alert(' Verification email sent. Please verify your email first.');
      
      // Optional: navigate to a "check-email" page
      this.router.navigate(['/check-email']); 

    } catch (error: any) {
      alert(error.message);
    } finally {
      this.isLoading = false;
    }
  }
}

  // Google signup/login (immediately set session)
  async signupWithGoogle() {
    this.isLoading = true;
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const userCredential = await this.afAuth.signInWithPopup(provider);

      const user = userCredential.user;
      if (user) {
        this.session.setUser({
            uid: userCredential.user.uid, 
          displayName: user.displayName || '',
          email: user.email || '',
          isGoogleUser: true,
          photoURL: user.photoURL || ''
        });
      }

      alert('Google signup/login successful!');
      this.router.navigate(['/']); 
    } catch (error: any) {
      alert(error.message);
    } finally {
      this.isLoading = false;
    }
  }

  // Resend verification email
  async resendVerificationEmail() {
    if (!this.isResendDisabled) {
      this.isResendDisabled = true;
      this.isLoading = true;
      try {
        const user = await this.afAuth.currentUser;
        if (user && !user.emailVerified) {
          await user.sendEmailVerification();
          alert('Verification email resent!');
          this.startResendCountdown();
        }
      } catch (error: any) {
        alert(error.message);
      } finally {
        this.isLoading = false;
      }
    }
  }

  private startResendCountdown() {
    this.resendCountdown = 30;
    const timer = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0) {
        this.isResendDisabled = false;
        clearInterval(timer);
      }
    }, 1000);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  get name() { return this.signupForm.get('name'); }
  get email() { return this.signupForm.get('email'); }
  get password() { return this.signupForm.get('password'); }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
