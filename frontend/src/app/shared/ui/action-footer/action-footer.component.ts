import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-action-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="actions">
      <button
        *ngIf="secondaryLabel"
        type="button"
        class="actions__btn actions__btn--secondary"
        [disabled]="secondaryDisabled || loading"
        (click)="secondaryClick.emit()"
      >
        {{ secondaryLabel }}
      </button>
      <button
        type="button"
        class="actions__btn actions__btn--primary"
        [class.actions__btn--destructive]="variant === 'destructive'"
        [class.actions__btn--warning]="variant === 'warning'"
        [disabled]="primaryDisabled || loading"
        (click)="primaryClick.emit()"
      >
        <span *ngIf="loading" class="actions__spinner" aria-hidden="true"></span>
        {{ loading ? loadingLabel : primaryLabel }}
      </button>
    </div>
  `,
  styles: [
    `
      .actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-sm);
      }

      .actions__btn {
        min-height: 42px;
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm);
        transition:
          transform var(--duration-fast) var(--ease-out-expo),
          box-shadow var(--duration-fast) var(--ease-out-expo);
      }

      .actions__btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .actions__btn--secondary {
        border: 1px solid var(--color-border-default);
        background: var(--color-bg-default);
        color: var(--color-text-primary);
      }

      .actions__btn--secondary:hover:not(:disabled) {
        box-shadow: var(--shadow-xs);
        transform: translateY(-1px);
      }

      .actions__btn--primary {
        border: 0;
        background: linear-gradient(135deg, var(--color-primary-base), var(--color-primary-hover));
        color: var(--color-text-inverse);
        box-shadow: var(--shadow-primary-sm);
      }

      .actions__btn--primary:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: var(--shadow-primary-md);
      }

      .actions__btn--destructive {
        background: linear-gradient(135deg, #EF4444, #DC2626);
        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
      }

      .actions__btn--destructive:hover:not(:disabled) {
        box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
      }

      .actions__btn--warning {
        background: linear-gradient(135deg, #F59E0B, #D97706);
        box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
      }

      .actions__btn--warning:hover:not(:disabled) {
        box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);
      }

      .actions__spinner {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.82);
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class ActionFooterComponent {
  @Input({ required: true }) primaryLabel = '';
  @Input() secondaryLabel = '';
  @Input() loadingLabel = 'Processing...';
  @Input() primaryDisabled = false;
  @Input() secondaryDisabled = false;
  @Input() loading = false;
  @Input() variant: 'primary' | 'destructive' | 'warning' = 'primary';

  @Output() primaryClick = new EventEmitter<void>();
  @Output() secondaryClick = new EventEmitter<void>();
}
