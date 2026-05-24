import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-chip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="chip"
      [class.chip--selected]="selected"
      (click)="toggled.emit(!selected)"
    >
      {{ label }}
    </button>
  `,
  styles: [
    `
      .chip {
        display: inline-flex;
        align-items: center;
        padding: 5px 12px;
        border-radius: var(--radius-full);
        border: 1px solid var(--overlay-light);
        background: rgba(255, 255, 255, 0.7);
        color: var(--color-text-secondary);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        cursor: pointer;
        transition: all var(--duration-fast) var(--ease-out-expo);
        white-space: nowrap;
      }

      .chip:hover {
        background: rgba(255, 255, 255, 0.95);
        box-shadow: var(--shadow-sm);
      }

      .chip--selected {
        background: var(--color-primary-base);
        color: var(--color-text-inverse);
        border-color: var(--color-primary-base);
        box-shadow: var(--shadow-primary-sm);
      }

      .chip--selected:hover {
        background: var(--color-primary-hover);
      }
    `,
  ],
})
export class ChipComponent {
  @Input() label = '';
  @Input() selected = false;
  @Output() toggled = new EventEmitter<boolean>();
}
