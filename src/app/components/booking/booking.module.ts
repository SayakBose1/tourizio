import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { BookingComponent } from './booking.component';

const routes: Routes = [
  { path: '', component: BookingComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes), // ✅ routes included here
    BookingComponent // since it's standalone
  ]
})
export class BookingModule {}
