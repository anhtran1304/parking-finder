import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogService } from '../dialog.service';
import { IconComponent } from '../../../components/icon.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    @if (state(); as dialog) {
      <div class="confirm">
        @if (dialog.config.icon) {
          <div
            class="confirm__icon"
            [class.confirm__icon--destructive]="dialog.config.variant === 'destructive'"
            [class.confirm__icon--warning]="dialog.config.variant === 'warning'"
          >
            <app-icon [name]="dialog.config.icon" [size]="24" [strokeWidth]="2" />
          </div>
        }

        <h3 class="confirm__title">{{ dialog.config.title }}</h3>

        @if (dialog.config.description) {
          <p class="confirm__description">{{ dialog.config.description }}</p>
        }

        <div class="confirm__actions">
          @if (dialog.config.cancelText) {
            <button
              type="button"
              class="confirm__btn confirm__btn--secondary"
              (click)="onCancel()"
            >
              {{ dialog.config.cancelText }}
            </button>
          }
          <button
            type="button"
            class="confirm__btn confirm__btn--primary"
            [class.confirm__btn--destructive]="dialog.config.variant === 'destructive'"
            [class.confirm__btn--warning]="dialog.config.variant === 'warning'"
            (click)="onConfirm()"
          >
            {{ dialog.config.confirmText }}
          </button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .confirm {
        display: grid;
        gap: var(--spacing-sm);
        text-align: center;
        padding-top: var(--spacing-sm);
      }

      .confirm__icon {
        width: 48px;
        height: 48px;
        margin: 0 auto var(--spacing-xs);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-full);
        background: var(--color-primary-light);
        color: var(--color-primary-base);
      }

      .confirm__icon--destructive {
        background: rgba(239, 68, 68, 0.1);
        color: #EF4444;
      }

      .confirm__icon--warning {
        background: rgba(245, 158, 11, 0.1);
        color: #F59E0B;
      }

      .confirm__title {
        margin: 0;
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        letter-spacing: var(--tracking-tight);
      }

      .confirm__description {
        margin: 0;
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
        line-height: var(--leading-normal);
      }

      .confirm__actions {
        margin-top: var(--spacing-lg);
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-sm);
      }

      .confirm__btn {
        min-height: 42px;
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition:
          transform var(--duration-fast) var(--ease-out-expo),
          box-shadow var(--duration-fast) var(--ease-out-expo);
      }

      .confirm__btn--secondary {
        border: 1px solid var(--color-border-default);
        background: var(--color-bg-default);
        color: var(--color-text-primary);
      }

      .confirm__btn--secondary:hover {
        box-shadow: var(--shadow-xs);
        transform: translateY(-1px);
      }

      .confirm__btn--primary {
        border: 0;
        background: linear-gradient(135deg, var(--color-primary-base), var(--color-primary-hover));
        color: var(--color-text-inverse);
        box-shadow: var(--shadow-primary-sm);
      }

      .confirm__btn--primary:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-primary-md);
      }

      .confirm__btn--destructive {
        background: linear-gradient(135deg, #EF4444, #DC2626);
        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
      }

      .confirm__btn--destructive:hover {
        box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
      }

      .confirm__btn--warning {
        background: linear-gradient(135deg, #F59E0B, #D97706);
        box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
      }

      .confirm__btn--warning:hover {
        box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  private readonly dialogService = inject(DialogService);

  readonly state = this.dialogService.activeDialog;

  onConfirm(): void {
    const current = this.state();
    if (current) {
      current.ref.close(true);
    }
  }

  onCancel(): void {
    const current = this.state();
    if (current) {
      current.ref.close(false);
    }
  }
}
