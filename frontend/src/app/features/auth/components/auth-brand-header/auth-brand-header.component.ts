import { Component, Input } from '@angular/core';
import { IconComponent } from '../../../../shared/components/icon.component';

@Component({
  selector: 'app-auth-brand-header',
  standalone: true,
  imports: [IconComponent],
  template: `
    <header class="brand">
      <div class="brand__logo">
        <app-icon name="map-pin" [size]="20" [strokeWidth]="2.5" />
      </div>
      <div class="brand__text">
        <h2>{{ title }}</h2>
        <p>{{ subtitle }}</p>
      </div>
    </header>
  `,
  styles: [
    `
      .brand {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding-right: 40px;
      }

      .brand__logo {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, var(--color-primary-base), var(--color-primary-hover));
        border-radius: var(--radius-md);
        color: white;
        flex-shrink: 0;
        box-shadow: var(--shadow-primary-sm);
      }

      .brand__text h2 {
        margin: 0;
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        letter-spacing: var(--tracking-tight);
        line-height: var(--leading-tight);
      }

      .brand__text p {
        margin: 1px 0 0;
        font-size: var(--font-size-xs);
        color: var(--color-text-secondary);
      }
    `,
  ],
})
export class AuthBrandHeaderComponent {
  @Input() title = 'Parking Finder';
  @Input() subtitle = '';
}
