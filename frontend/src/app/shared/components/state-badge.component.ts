import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-state-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="state">{{ label }}</span>
  `,
  styles: [
    `
      .badge {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 0.2rem 0.6rem;
        font-size: 0.76rem;
        letter-spacing: 0.03em;
        font-weight: 700;
        text-transform: uppercase;
      }

      .good {
        background: #d6efdf;
        color: #1b6b41;
      }

      .warn {
        background: #fce8be;
        color: #8d5f00;
      }

      .danger {
        background: #f8d5d5;
        color: #943232;
      }
    `
  ]
})
export class StateBadgeComponent {
  @Input() label = 'Unknown';
  @Input() state: 'good' | 'warn' | 'danger' = 'good';
}
