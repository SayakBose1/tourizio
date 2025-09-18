// payment.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { PaymentComponent } from './payment.component';

const routes: Routes = [
  { path: '', component: PaymentComponent, data: { animation: 'PaymentPage' } }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    PaymentComponent  // ✅ Import standalone component
  ]
})
export class PaymentModule {}
