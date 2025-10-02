import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import emailjs from '@emailjs/browser';

export interface BookingData {
  id?: string;       // Firestore document ID
  userId: string;
  name: string;
  destination: string;
  date: string;
  people: number;
  price: number;
  email?: string; // For sending confirmation
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  constructor(private firestore: AngularFirestore) {}

  // Add a new booking
  addBooking(data: BookingData) {
    return this.firestore.collection('bookings').add(data);
  }

  // Get bookings for a specific user
  getUserBookings(userId: string): Observable<BookingData[]> {
    return this.firestore
      .collection<BookingData>('bookings', ref => ref.where('userId', '==', userId))
      .snapshotChanges()
      .pipe(
        map(actions =>
          actions.map(a => {
            const data = a.payload.doc.data() as BookingData;
            const id = a.payload.doc.id;
            return { id, ...data };
          })
        )
      );
  }

  // Delete a booking by ID (for cancel button)
  deleteBooking(bookingId: string): Observable<void> {
    const docRef = this.firestore.doc(`bookings/${bookingId}`);
    return from(docRef.delete());
  }

  // Send booking confirmation email via EmailJS
  async sendBookingMail(data: BookingData) {
    if (!data.email) {
      console.warn('No email found for booking, skipping email send.');
      return;
    }

    const templateParams = {
      customer_name: data.name,
      customer_email: data.email,
      destination: data.destination,
      travel_date: data.date,
      number_of_people: data.people,
      price_per_person: data.price,
      total_amount: data.price * data.people,
      booking_date: new Date().toLocaleDateString(),
      booking_id: data.id || Math.random().toString(36).substring(2, 10).toUpperCase(),
      company_name: 'Tourizio',
      support_email: 'support@tourizio.com',
      support_phone: '+1 (555) 123-4567'
    };

    try {
      await emailjs.send(
        'service_ks2s0td',   
        'template_emc74op',  
        templateParams,
        'vEluSFRJDT2jlYQ1K' 
      );
      console.log('✅ Booking confirmation email sent!');
    } catch (err) {
      console.error('❌ Failed to send booking email:', err);
    }
  }
}
