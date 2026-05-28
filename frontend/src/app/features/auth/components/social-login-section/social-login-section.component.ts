import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-social-login-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="social-section">
      <div class="social-section__divider"><span>or continue with</span></div>

      <button type="button" class="social-section__btn" (click)="googleClicked.emit()">
        <img src="/assets/icons/google.svg" alt="Google icon" width="20" height="20" />
        <span>Continue with Google</span>
      </button>

      @if (hint) {
        <p class="social-section__hint">{{ hint }}</p>
      }
    </div>
  `,
  styles: [
    `
      .social-section__divider {
        margin: var(--spacing-lg) 0 var(--spacing-md);
        text-align: center;
        position: relative;
      }

      .social-section__divider::before {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        top: 50%;
        border-top: 1px solid var(--color-border-default);
      }

      .social-section__divider span {
        position: relative;
        padding: 0 var(--spacing-sm);
        background: var(--glass-bg-solid);
        font-size: var(--font-size-2xs);
        color: var(--color-text-tertiary);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .social-section__btn {
        width: 100%;
        min-height: 42px;
        border-radius: var(--radius-md);
        border: 1px solid var(--color-border-default);
        background: var(--color-bg-default);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        cursor: pointer;
        transition:
          border-color var(--duration-fast) ease,
          box-shadow var(--duration-fast) ease,
          transform var(--duration-fast) var(--ease-out-expo);
      }

      .social-section__btn:hover {
        border-color: var(--color-border-default);
        box-shadow: var(--shadow-sm);
        transform: translateY(-1px);
      }

      .social-section__hint {
        margin: var(--spacing-sm) 0 0;
        text-align: center;
        font-size: var(--font-size-2xs);
        color: var(--color-text-tertiary);
      }
    `,
  ],
})
export class SocialLoginSectionComponent {
  @Input() hint: string | null = null;

  @Output() googleClicked = new EventEmitter<void>();
}
