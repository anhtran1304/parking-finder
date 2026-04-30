import { Routes } from '@angular/router';
import { ParkingMapResolver } from './core/resolvers/parking-map.resolver';
import { ParkingDetailComponent } from './features/parking/parking-detail.component';
import { ParkingMapComponent } from './features/parking/parking-map.component';

export const routes: Routes = [
  {
    path: '',
    component: ParkingMapComponent,
    resolve: { nearby: ParkingMapResolver }
  },
  {
    path: 'parkings/:id',
    component: ParkingDetailComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
