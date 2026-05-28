import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-floating-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="card"
      [class]="'card card--' + elevation + ' card--' + padding"
    >
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      .card {
        border-radius: var(--radius-xl);
        background: var(--glass-bg-solid);
        border: 1px solid var(--glass-border);
        backdrop-filter: blur(var(--glass-blur));
        -webkit-backdrop-filter: blur(var(--glass-blur));
      }

      .card--sm {
        box-shadow: var(--shadow-sm);
      }

      .card--md {
        box-shadow: var(--shadow-md);
      }

      .card--float {
        box-shadow: var(--shadow-float);
      }

      .card--compact {
        padding: var(--spacing-md);
      }

      .card--default {
        padding: var(--spacing-xl);
      }

      .card--spacious {
        padding: var(--spacing-2xl);
      }
    `,
  ],
})
export class FloatingCardComponent {
  @Input() elevation: 'sm' | 'md' | 'float' = 'float';
  @Input() padding: 'compact' | 'default' | 'spacious' = 'default';
}
