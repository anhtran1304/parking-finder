import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [class]="'pf-button pf-button--' + variant"
      [disabled]="disabled || loading"
    >
      <span class="pf-button__spinner" *ngIf="loading"></span>
      <ng-content></ng-content>
    </button>
  `,
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() disabled = false;
  @Input() loading = false;
}
