import { Component, Input } from '@angular/core';
import { IconComponent } from '../../components/icon.component';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  imports: [IconComponent],
  template: `
    <button
      class="pf-icon-button"
      [class.pf-icon-button--subtle]="variant === 'subtle'"
      type="button"
      [attr.aria-label]="ariaLabel"
    >
      <app-icon [name]="icon" [size]="size" [strokeWidth]="strokeWidth" />
    </button>
  `,
})
export class IconButtonComponent {
  @Input({ required: true }) icon = '';
  @Input() size = 20;
  @Input() strokeWidth = 2;
  @Input() ariaLabel = '';
  @Input() variant: 'ghost' | 'subtle' = 'ghost';
}
