import { Routes } from '@angular/router';
import { ParkingDetailComponent } from './features/parking/parking-detail.component';
import { ShellComponent } from './layout/shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
  },
  {
    path: 'parkings/:id',
    component: ParkingDetailComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
