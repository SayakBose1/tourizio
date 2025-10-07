import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../services/booking.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment.component.html',
  styleUrls: [],
})
export class PaymentComponent implements OnInit {
  cardNumber = '';
  expiryMonth = '';
  expiryYear = '';
  cvv = '';
  saveCard = false;
  totalAmount: number = 0;

  months = [
    '01',
    '02',
    '03',
    '04',
    '05',
    '06',
    '07',
    '08',
    '09',
    '10',
    '11',
    '12',
  ];
  years: number[] = [];
  bookingData: any = null;

  loading = false;
  cardType: string = '';

  // ✅ Captcha properties
  showCaptcha = false;
  captchaVerified = false;
  captchaLoading = false;

  // ✅ Payment Success Modal
  showPaymentSuccess = false;
  transactionId: string = '';
  transactionDate: string = '';

  constructor(
    private router: Router,
    private bookingService: BookingService,
    private afAuth: AngularFireAuth,
  ) {}

  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    this.years = Array.from({ length: 10 }, (_, i) => currentYear + i);

    const pendingBooking = localStorage.getItem('pendingBooking');
    if (pendingBooking) {
      this.bookingData = JSON.parse(pendingBooking);
      this.totalAmount = this.bookingData.people * this.bookingData.price;
    }
  }

  async makePayment(paymentForm: any) {
    if (!paymentForm.valid) {
      return;
    }

    if (!this.bookingData) {
      alert('No booking found!');
      return;
    }

    // ✅ Show captcha verification popup
    this.showCaptcha = true;
  }

  // ✅ Simulate captcha verification
  verifyCaptcha() {
    this.captchaLoading = true;

    // Simulate captcha verification delay (1.5 seconds)
    setTimeout(() => {
      this.captchaVerified = true;
      this.captchaLoading = false;

      // Auto-proceed to payment after verification
      setTimeout(() => {
        this.showCaptcha = false;
        this.processPay();
      }, 800);
    }, 1500);
  }

  // ✅ Close captcha modal
  closeCaptcha() {
    this.showCaptcha = false;
    this.captchaVerified = false;
    this.captchaLoading = false;
  }

  // ✅ Actual payment processing
  async processPay() {
    this.loading = true;
    try {
      const currentUser = await this.afAuth.currentUser;
      if (!currentUser) {
        alert('You must be logged in to make payment.');
        this.loading = false;
        return;
      }

      // Process payment
      await this.bookingService.addBooking(this.bookingData);
      await this.bookingService.sendBookingMail(this.bookingData);

      // Generate transaction ID
      this.transactionId = this.getRandomTxnId();
      this.transactionDate = this.getCurrentDateTime();

      // ✅ Show success modal instead of alert
      this.showPaymentSuccess = true;

      // Clear pending booking
      localStorage.removeItem('pendingBooking');
    } catch (err) {
      console.error('Payment/Booking failed:', err);
      alert('❌ Payment succeeded but booking could not be saved. Try again.');
    } finally {
      this.loading = false;
    }
  }

  // ✅ Helper methods for success modal
  getRandomTxnId(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  getCurrentDateTime(): string {
    const now = new Date();
    return now.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  getLastFourDigits(): string {
    return this.cardNumber ? this.cardNumber.slice(-4) : '****';
  }

  // ✅ Redirect to profile
  redirectToProfile(): void {
    this.showPaymentSuccess = false;
    this.router.navigate(['/profile']);
  }

  cancelPayment() {
    localStorage.removeItem('pendingBooking');
    alert('❌ Payment cancelled.');
    this.router.navigate(['/destinations']);
  }
}
