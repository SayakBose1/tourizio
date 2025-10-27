import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  web3formsKey = 'ed7befcf-3cfe-405c-a6b8-b871ea4ea2ff';

  contact = {
    name: '',
    email: '',
    phone: '',
    inquiryType: '',
    message: '',
  };

  isSubmitting = false;
  showSuccessMessage = false;
  showErrorMessage = false;
  showSuccessToast: boolean = false;
  showErrorToast: boolean = false;

  constructor(private http: HttpClient) {}

  async submitContact(contactForm: any) {
    if (this.isSubmitting) return;

    this.isSubmitting = true;
    this.showSuccessMessage = false;
    this.showErrorMessage = false;

    try {
      // Prepare form data for Web3Forms
      const formData = new FormData();
      formData.append('access_key', this.web3formsKey);
      formData.append('name', this.contact.name);
      formData.append('email', this.contact.email);
      formData.append('phone', this.contact.phone || '');
      formData.append('inquiry_type', this.contact.inquiryType || '');
      formData.append('message', this.contact.message);
      formData.append('subject', 'New Contact Form Submission - Tourism App');

      // Optional: Add additional metadata
      formData.append('from_name', this.contact.name);
      formData.append('reply_to', this.contact.email);

      const response = await this.http
        .post('https://api.web3forms.com/submit', formData)
        .toPromise();

      // Success
      this.showSuccessMessage = true;
      
      // ✅ Show success toast
      this.showSuccessToast = true;
      setTimeout(() => {
        this.showSuccessToast = false;
      }, 5000);
      
      this.resetForm();

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        this.showSuccessMessage = false;
      }, 5000);

      // ✅ Reset form and model correctly
    contactForm.resetForm();
    this.contact = {
      name: '',
      email: '',
      phone: '',
      inquiryType: '',
      message: '',
    };
    } catch (error) {
      console.error('Error submitting form:', error);
      this.showErrorMessage = true;

      // ✅ Show error toast
      this.showErrorToast = true;
      setTimeout(() => {
        this.showErrorToast = false;
      }, 5000);

      // Auto-hide error message after 5 seconds
      setTimeout(() => {
        this.showErrorMessage = false;
      }, 5000);
    } finally {
      this.isSubmitting = false;
    }
  }

  resetForm() {
    this.contact = {
      name: '',
      email: '',
      phone: '',
      inquiryType: '',
      message: '',
    };
  }

  // Alternative method using async/await with better error handling
  async submitContactAlternative() {
    if (this.isSubmitting) return;

    this.isSubmitting = true;
    this.showSuccessMessage = false;
    this.showErrorMessage = false;

    const formData = {
      access_key: this.web3formsKey,
      name: this.contact.name,
      email: this.contact.email,
      phone: this.contact.phone || '',
      inquiry_type: this.contact.inquiryType || '',
      message: this.contact.message,
      subject: 'New Contact Form Submission - Tourism App',
      from_name: this.contact.name,
      reply_to: this.contact.email,
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    try {
      const response: any = await this.http
        .post('https://api.web3forms.com/submit', formData, { headers })
        .toPromise();

      if (response.success) {
        this.showSuccessMessage = true;
        
        // ✅ Show success toast
        this.showSuccessToast = true;
        setTimeout(() => {
          this.showSuccessToast = false;
        }, 5000);
        
        this.resetForm();

        setTimeout(() => {
          this.showSuccessMessage = false;
        }, 5000);
      } else {
        throw new Error(response.message || 'Submission failed');
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      this.showErrorMessage = true;

      // ✅ Show error toast
      this.showErrorToast = true;
      setTimeout(() => {
        this.showErrorToast = false;
      }, 5000);

      setTimeout(() => {
        this.showErrorMessage = false;
      }, 5000);
    } finally {
      this.isSubmitting = false;
    }
  }

  // ✅ Methods to manually close toasts
  closeSuccessToast() {
    this.showSuccessToast = false;
  }

  closeErrorToast() {
    this.showErrorToast = false;
  }
}