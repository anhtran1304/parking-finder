import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DialogOutletComponent } from './shared/ui/dialog/index';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, DialogOutletComponent],
  template: `<router-outlet></router-outlet><app-dialog-outlet />`,
})
export class AppComponent {}
