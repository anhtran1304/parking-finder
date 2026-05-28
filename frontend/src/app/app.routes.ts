import { Routes } from '@angular/router';
import { AuthEntryRedirectComponent } from './features/auth/auth-entry-redirect.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password.component';
import { ShellComponent } from './layout/shell.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'map',
  },
  {
    path: 'map',
    component: ShellComponent,
  },
  {
    path: 'map/:parkingId',
    component: ShellComponent,
  },
  {
    path: 'map/:parkingId/booking',
    component: ShellComponent,
    canActivate: [authGuard],
  },
  {
    path: 'parkings/:parkingId',
    redirectTo: 'map/:parkingId',
  },
  {
    path: 'auth/sign-in',
    component: AuthEntryRedirectComponent,
    data: { mode: 'sign-in' },
  },
  {
    path: 'auth/sign-up',
    component: AuthEntryRedirectComponent,
    data: { mode: 'sign-up' },
  },
  {
    path: 'auth/forgot-password',
    component: ForgotPasswordComponent,
  },
  {
    path: 'bookings',
    redirectTo: 'map',
  },
  {
    path: 'bookings/:bookingId',
    redirectTo: 'map',
  },
  {
    path: 'profile',
    redirectTo: 'map',
  },
  {
    path: 'profile/payment',
    redirectTo: 'map',
  },
  {
    path: 'profile/vehicles',
    redirectTo: 'map',
  },
  {
    path: '**',
    redirectTo: 'map',
  },
];
