import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../services/booking.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import jsPDF from 'jspdf';
import { UserSessionService } from 'src/app/services/user-session.service';

// ✅ Booking History Interface
interface BookingHistory {
  transactionId: string;
  transactionDate: string;
  bookingData: any;
  userName: string;
  userEmail: string;
  cardLastFour: string;
  totalAmount: number;
}

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css'],
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

  // ✅ User details
  userName: string = '';
  userEmail: string = '';

  constructor(
    private router: Router,
    private bookingService: BookingService,
    private afAuth: AngularFireAuth,
    private userSessionService: UserSessionService, // ✅ Injected
  ) {}

  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    this.years = Array.from({ length: 10 }, (_, i) => currentYear + i);

    const pendingBooking = localStorage.getItem('pendingBooking');
    if (pendingBooking) {
      this.bookingData = JSON.parse(pendingBooking);
      this.totalAmount = this.bookingData.people * this.bookingData.price;
    }

    // ✅ Get logged-in user from UserSessionService
    const currentUser = this.userSessionService.getCurrentUser();
    if (currentUser) {
      this.userName = currentUser.displayName || 'Unknown User';
      this.userEmail = currentUser.email || 'No Email';
    } else {
      this.userName = 'Guest User';
      this.userEmail = 'Not Logged In';
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

      // ✅ Save booking to localStorage history
      this.saveBookingToHistory();

      // ✅ Show success modal instead of alert
      this.showPaymentSuccess = true;

      setTimeout(() => {
        this.showToast = true;
        setTimeout(() => {
          this.showToast = false;
        }, 5000);
      }, 500);

      // Clear pending booking
      localStorage.removeItem('pendingBooking');
    } catch (err) {
      console.error('Payment/Booking failed:', err);
      alert('❌ Payment succeeded but booking could not be saved. Try again.');
    } finally {
      this.loading = false;
    }
  }

  // ✅ Save booking to localStorage history
  saveBookingToHistory(): void {
    const bookingRecord: BookingHistory = {
      transactionId: this.transactionId,
      transactionDate: this.transactionDate,
      bookingData: this.bookingData,
      userName: this.userName,
      userEmail: this.userEmail,
      cardLastFour: this.getLastFourDigits(),
      totalAmount: this.totalAmount,
    };

    // Get existing booking history or create new array
    const existingHistory = localStorage.getItem('bookingHistory');
    let bookingHistory: BookingHistory[] = existingHistory
      ? JSON.parse(existingHistory)
      : [];

    // Add new booking to the beginning of array (most recent first)
    bookingHistory.unshift(bookingRecord);

    // Optional: Limit to last 50 bookings to prevent localStorage overflow
    if (bookingHistory.length > 50) {
      bookingHistory = bookingHistory.slice(0, 50);
    }

    // Save back to localStorage
    localStorage.setItem('bookingHistory', JSON.stringify(bookingHistory));
    console.log('✅ Booking saved to history:', bookingRecord);
  }

  // ✅ Optional: Get all booking history
  getBookingHistory(): BookingHistory[] {
    const history = localStorage.getItem('bookingHistory');
    return history ? JSON.parse(history) : [];
  }

  // ✅ Optional: Clear booking history
  clearBookingHistory(): void {
    localStorage.removeItem('bookingHistory');
    console.log('🗑️ Booking history cleared');
  }

  // ✅ Optional: Get specific booking by transaction ID
  getBookingByTxnId(txnId: string): BookingHistory | undefined {
    const history = this.getBookingHistory();
    return history.find((booking) => booking.transactionId === txnId);
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

  downloadReceipt(): void {
    const doc = new jsPDF();

    // Colors
    const primaryColor: [number, number, number] = [41, 128, 185]; // Blue
    const successColor: [number, number, number] = [39, 174, 96]; // Green
    const textDark: [number, number, number] = [44, 62, 80]; // Dark gray
    const textLight: [number, number, number] = [127, 140, 141]; // Light gray
    const bgLight: [number, number, number] = [236, 240, 241]; // Light background

    // Header Background
    doc.setFillColor(...primaryColor);
    const headerHeight = 28; // slightly shorter header
    doc.rect(0, 0, 210, headerHeight, 'F');

    // Title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);

    // Vertically center text
    const textY = headerHeight / 2 + 7; // +7 to roughly center text (adjust if needed)
    doc.text('PAYMENT RECEIPT', 105, textY, { align: 'center' });

    // Success Badge
    doc.setFillColor(...successColor);
    doc.roundedRect(155, 50, 35, 10, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('PAID', 172.5, 56.5, { align: 'center' });

    // Transaction ID Box
    doc.setFillColor(...bgLight);
    doc.roundedRect(20, 50, 125, 10, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textDark);
    doc.text(`Transaction ID: #TXN${this.transactionId}`, 25, 56.5);

    // Date & Time
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textLight);
    doc.text(this.transactionDate, 25, 64);

    // Divider
    doc.setDrawColor(...bgLight);
    doc.setLineWidth(0.5);
    doc.line(20, 72, 190, 72);

    // Customer Information Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('CUSTOMER DETAILS', 20, 82);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textDark);
    doc.text('Name:', 20, 92);
    doc.setFont('helvetica', 'bold');
    doc.text(this.userName, 50, 92);

    doc.setFont('helvetica', 'normal');
    doc.text('Email:', 20, 100);
    doc.setFont('helvetica', 'bold');
    doc.text(this.userEmail, 50, 100);

    // Divider
    doc.setDrawColor(...bgLight);
    doc.line(20, 107, 190, 107);

    // Payment Information Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('PAYMENT DETAILS', 20, 117);

    // Payment info with icons/bullets
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textDark);

    doc.text('•', 20, 127);
    doc.text('Payment Method:', 25, 127);
    doc.setFont('helvetica', 'bold');
    doc.text(`Card ending in ${this.getLastFourDigits()}`, 70, 127);

    doc.setFont('helvetica', 'normal');
    doc.text('•', 20, 135);
    doc.text('Payment Status:', 25, 135);
    doc.setTextColor(...successColor);
    doc.setFont('helvetica', 'bold');
    doc.text('SUCCESS', 70, 135);

    // Amount Box - Highlighted
    doc.setFillColor(248, 249, 250);
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(1);
    doc.roundedRect(20, 145, 170, 22, 3, 3, 'FD');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textLight);
    doc.text('Total Amount Paid', 30, 154);

    let amountText = `${this.totalAmount}.00 INR`;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);

    // Measure text width
    let textWidth = doc.getTextWidth(amountText);
    const maxWidth = 150; // maximum width that fits in the box
    let fontSize = 16;

    // Auto scale font if text too wide
    while (textWidth > maxWidth && fontSize > 10) {
      fontSize -= 1;
      doc.setFontSize(fontSize);
      textWidth = doc.getTextWidth(amountText);
    }

    doc.text(amountText, 185, 161, { align: 'right' });

    // Footer Section
    doc.setFillColor(...bgLight);
    doc.rect(0, 175, 210, 122, 'F');

    // Thank you message with icon
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Thank You for Your Booking!', 105, 188, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textLight);
    doc.text(
      'This is a computer-generated receipt and does not require a signature.',
      105,
      196,
      { align: 'center' },
    );

    // Contact info box
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(40, 205, 130, 20, 2, 2, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textDark);
    doc.text('Need Help?', 105, 212, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textLight);
    doc.text(
      'Email: support@tourizio.com | Phone: +1 (555) 123-4567',
      105,
      218,
      {
        align: 'center',
      },
    );

    // Bottom decorative line
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(2);
    doc.line(70, 235, 140, 235);

    // Company branding
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('TOURIZIO', 105, 245, { align: 'center' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textLight);
    doc.text('Making Travel Memorable', 105, 250, { align: 'center' });

    doc.setFontSize(6);
    doc.text('© 2025 Tourizio. All rights reserved.', 105, 260, {
      align: 'center',
    });

    // Save the PDF
    doc.save(`Receipt_TXN${this.transactionId}.pdf`);
  }

  // Add these properties to your component class
  showToast: boolean = false;

  // Add this method to show the toast
  showSuccessToast() {
    this.showToast = true;
    // Auto-hide toast after 5 seconds
    setTimeout(() => {
      this.showToast = false;
    }, 5000);
  }

  // Add this method to manually close the toast
  closeToast() {
    this.showToast = false;
  }

  // Update your payment success logic to trigger the toast
  // Call this when payment is successful (probably in your makePayment method)
  onPaymentSuccess() {
    this.showPaymentSuccess = true;
    this.showSuccessToast(); // Add this line to show the toast
    // ... rest of your success logic
  }
}
