import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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

  private afAuth = inject(AngularFireAuth);
  private fb = inject(FormBuilder);
  private session = inject(UserSessionService);
  private router = inject(Router);

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async onLogin() {
    if (!this.loginForm.valid) return;

    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    try {
      const userCredential = await this.afAuth.signInWithEmailAndPassword(email, password);

      if (!userCredential.user?.emailVerified) {
        this.isEmailNotVerified = true;
        this.userEmail = email;
        return;
      }

      // Set session for email user
      this.session.setUser({
          uid: userCredential.user.uid,  
        email: email,
        displayName: email.split('@')[0],
        isGoogleUser: false
      });

      this.router.navigate(['/']); 
    } catch (error: any) {
      alert(error.message);
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
          isGoogleUser: true
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
