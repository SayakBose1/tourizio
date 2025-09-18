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
  styleUrls: []
})
export class PaymentComponent implements OnInit {
  cardNumber = '';
  expiryMonth = '';
  expiryYear = '';
  cvv = '';
  saveCard = false;
  totalAmount: number = 0;

  months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
  years: number[] = [];
  bookingData: any = null;

  loading = false; // ✅ Added for button animation

  constructor(
    private router: Router,
    private bookingService: BookingService,
    private afAuth: AngularFireAuth
  ) {}

  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    this.years = Array.from({ length: 10 }, (_, i) => currentYear + i);

    // ✅ Load booking from localStorage
    const pendingBooking = localStorage.getItem('pendingBooking');
    if (pendingBooking) {
      this.bookingData = JSON.parse(pendingBooking);
      this.totalAmount = this.bookingData.people * this.bookingData.price;
    }
  }

  async makePayment() {
    if (!this.bookingData) {
      alert('No booking found!');
      return;
    }

    this.loading = true; // ✅ Start loading

    try {
      const currentUser = await this.afAuth.currentUser;
      if (!currentUser) {
        alert('You must be logged in to make payment.');
        this.loading = false;
        return;
      }

      // ✅ Save booking in Firestore
      await this.bookingService.addBooking(this.bookingData);

      // ✅ Send booking confirmation email
      await this.bookingService.sendBookingMail(this.bookingData);

      alert(`✅ Payment Successful! INR ${this.totalAmount} Paid. Please check your mail for booking details.`);

      // Clear storage
      localStorage.removeItem('pendingBooking');

      // Redirect to profile
      this.router.navigate(['/profile']);
    } catch (err) {
      console.error('Payment/Booking failed:', err);
      alert('❌ Payment succeeded but booking could not be saved. Try again.');
    } finally {
      this.loading = false; // ✅ Stop loading
    }
  }

  cancelPayment() {
    alert('❌ Payment cancelled.');
    this.router.navigate(['/destinations']);
  }
}
