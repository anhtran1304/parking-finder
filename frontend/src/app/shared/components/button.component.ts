import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [class]="'btn btn--' + variant"
      [class.btn--loading]="loading"
      [disabled]="disabled || loading"
    >
      <span class="btn__spinner" *ngIf="loading"></span>
      <ng-content></ng-content>
    </button>
  `,
  styles: [
    `
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm);
        padding: 10px var(--spacing-xl);
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        line-height: var(--leading-normal);
        border: none;
        cursor: pointer;
        transition: all var(--duration-fast) var(--ease-out-expo);
        white-space: nowrap;
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn:active:not(:disabled) {
        transform: scale(0.97);
      }

      .btn--primary {
        background: linear-gradient(135deg, var(--color-primary-base), var(--color-primary-hover));
        color: var(--color-text-inverse);
        box-shadow: var(--shadow-primary-sm);
      }

      .btn--primary:hover:not(:disabled) {
        box-shadow: var(--shadow-primary-md);
        transform: translateY(-1px);
      }

      .btn--primary:active:not(:disabled) {
        transform: scale(0.97);
        box-shadow: var(--shadow-primary-xs);
      }

      .btn--secondary {
        background: var(--overlay-subtle);
        color: var(--color-text-primary);
        border: 1px solid var(--color-border-default);
      }

      .btn--secondary:hover:not(:disabled) {
        background: var(--overlay-light);
        box-shadow: var(--shadow-sm);
      }

      .btn--ghost {
        background: transparent;
        color: var(--color-primary-base);
      }

      .btn--ghost:hover:not(:disabled) {
        background: rgba(26, 115, 232, 0.06);
      }

      .btn__spinner {
        width: 14px;
        height: 14px;
        border: 2px solid currentColor;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() disabled = false;
  @Input() loading = false;
}
