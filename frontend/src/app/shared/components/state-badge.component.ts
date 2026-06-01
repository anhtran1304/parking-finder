import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-state-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="state">
      <span class="badge__dot"></span>
      {{ label }}
    </span>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        width: fit-content;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: var(--radius-full);
        padding: 4px 10px;
        font-size: var(--font-size-2xs);
        letter-spacing: 0.04em;
        font-weight: var(--font-weight-semibold);
        text-transform: uppercase;
      }

      .badge__dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
      }

      .good {
        background: var(--badge-available-bg);
        color: var(--badge-available-text);
      }

      .warn {
        background: var(--badge-limited-bg);
        color: var(--badge-limited-text);
      }

      .danger {
        background: var(--badge-full-bg);
        color: var(--badge-full-text);
      }
    `
  ]
})
export class StateBadgeComponent {
  @Input() label = 'Unknown';
  @Input() state: 'good' | 'warn' | 'danger' = 'good';
}
