import { Component, Input } from '@angular/core';
import { IconComponent } from '../../components/icon.component';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  imports: [IconComponent],
  template: `
    <button
      class="icon-btn"
      [class.icon-btn--subtle]="variant === 'subtle'"
      type="button"
      [attr.aria-label]="ariaLabel"
    >
      <app-icon [name]="icon" [size]="size" [strokeWidth]="strokeWidth" />
    </button>
  `,
  styles: [
    `
      .icon-btn {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 0;
        border-radius: var(--radius-full);
        background: transparent;
        color: var(--color-text-secondary);
        cursor: pointer;
        padding: 6px;
        transition: all var(--duration-fast) ease;
      }

      .icon-btn:hover {
        background: rgba(0, 0, 0, 0.05);
        color: var(--color-text-primary);
      }

      .icon-btn--subtle {
        color: var(--color-text-tertiary);
      }

      .icon-btn--subtle:hover {
        background: rgba(0, 0, 0, 0.04);
        color: var(--color-text-secondary);
      }
    `,
  ],
})
export class IconButtonComponent {
  @Input({ required: true }) icon = '';
  @Input() size = 20;
  @Input() strokeWidth = 2;
  @Input() ariaLabel = '';
  @Input() variant: 'ghost' | 'subtle' = 'ghost';
}
