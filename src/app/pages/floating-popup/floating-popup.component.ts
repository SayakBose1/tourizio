import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-floating-popup',
  templateUrl: './floating-popup.component.html',
  styleUrls: ['./floating-popup.component.css']
})
export class FloatingPopupComponent implements OnInit {
  showPromo = false;

  ngOnInit(): void {
    // Show popup 2 seconds after page loads
    setTimeout(() => {
      this.showPromo = true;
    }, 2000);
  }

  closePromo(): void {
    this.showPromo = false;
  }
}
