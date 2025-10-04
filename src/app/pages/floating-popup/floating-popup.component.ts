import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-floating-popup',
  templateUrl: './floating-popup.component.html',
  styleUrls: ['./floating-popup.component.css']
})
export class FloatingPopupComponent implements OnInit, OnDestroy {
  showPromo = false;
  remainingHours = 23;
  remainingMinutes = 59;
  remainingSeconds = 45;
  private countdownInterval: any;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Show popup 2 seconds after page loads
    setTimeout(() => {
      this.showPromo = true;
      this.startCountdown();
    }, 2000);
  }

  ngOnDestroy(): void {
    // Clean up interval when component is destroyed
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds--;
      } else if (this.remainingMinutes > 0) {
        this.remainingMinutes--;
        this.remainingSeconds = 59;
      } else if (this.remainingHours > 0) {
        this.remainingHours--;
        this.remainingMinutes = 59;
        this.remainingSeconds = 59;
      } else {
        // Countdown finished
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }

  getFormattedTime(): string {
    const hours = this.remainingHours.toString().padStart(2, '0');
    const minutes = this.remainingMinutes.toString().padStart(2, '0');
    const seconds = this.remainingSeconds.toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  closePromo(): void {
    this.showPromo = false;
    
    // Clear countdown interval
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  onClaimOffer(): void {
    this.closePromo();
    this.router.navigate(['/destinations']);
  }
}