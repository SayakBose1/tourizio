import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { SignupComponent } from './pages/signup/signup.component';
import { ProfileComponent } from './pages/profile/profile.component';

const routes: Routes = [
  { path: '', component: HomeComponent, data: { animation: 'HomePage' } },

  {
    path: 'destinations',
    loadChildren: () =>
      import('./components/destinations/destination.module').then(
        (m) => m.DestinationsModule,
      ),
    data: { animation: 'DestinationsPage' },
  },
  {
    path: 'booking',
    loadChildren: () =>
      import('./components/booking/booking.module').then(
        (m) => m.BookingModule,
      ),
    data: { animation: 'BookingPage' },
  },
  {
    path: 'contact',
    loadChildren: () =>
      import('./components/contact/contact.module').then(
        (m) => m.ContactModule,
      ),
    data: { animation: 'ContactPage' },
  },

  {
    path: 'login',
    component: LoginComponent,
    data: { animation: 'LoginPage' },
  },
  {
    path: 'signup',
    component: SignupComponent,
    data: { animation: 'SignupPage' },
  },
  {
    path: 'profile',
    component: ProfileComponent,
    data: { animation: 'ProfilePage' },
  },
  {
    path: 'blog',
    loadChildren: () =>
      import('./pages/blog/blog.module').then((m) => m.BlogModule),
    data: { animation: 'BlogPage' },
  },
  {
    path: 'payment',
    loadChildren: () =>
      import('./pages/payment/payment.module').then((m) => m.PaymentModule),
    data: { animation: 'PaymentPage' },
  },

  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'top',
      anchorScrolling: 'enabled',
      preloadingStrategy: PreloadAllModules,
      initialNavigation: 'enabledBlocking', 
      canceledNavigationResolution: 'replace', 
      urlUpdateStrategy: 'eager', 
      onSameUrlNavigation: 'reload',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
