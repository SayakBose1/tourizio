import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import {
  trigger,
  transition,
  style,
  animate,
  query,
} from '@angular/animations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    trigger('routeAnimations', [
      transition('* <=> *', [
        // Start with page invisible
        query(':enter', [style({ opacity: 0 })], { optional: true }),

        // Fade out old page
        query(':leave', [animate('300ms ease', style({ opacity: 0 }))], {
          optional: true,
        }),

        // Fade in new page
        query(':enter', [animate('300ms ease', style({ opacity: 1 }))], {
          optional: true,
        }),
      ]),
    ]),
  ],
})
export class AppComponent {
  title = 'Tourism Platform';
  constructor(private router: Router) {}

  isAuthPage(): boolean {
    const url = this.router.url;
    return (
      url.startsWith('/login') ||
      url.startsWith('/signup') ||
      url.startsWith('/profile')
    );
  }

  prepareRoute(outlet: RouterOutlet) {
    return (
      outlet &&
      outlet.activatedRouteData &&
      outlet.activatedRouteData['animation']
    );
  }
}
