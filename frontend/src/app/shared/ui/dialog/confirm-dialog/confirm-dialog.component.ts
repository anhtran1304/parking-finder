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
              class="pf-button pf-button--secondary"
              (click)="onCancel()"
            >
              {{ dialog.config.cancelText }}
            </button>
          }
          <button
            type="button"
            class="pf-button pf-button--primary"
            [class.pf-button--danger]="dialog.config.variant === 'destructive'"
            [class.pf-button--warning]="dialog.config.variant === 'warning'"
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
        background: var(--color-danger-surface);
        color: var(--color-status-error);
      }

      .confirm__icon--warning {
        background: var(--color-warning-surface);
        color: var(--color-status-warning);
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
