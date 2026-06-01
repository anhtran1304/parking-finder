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
        class="pf-button pf-button--secondary"
        [disabled]="secondaryDisabled || loading"
        (click)="secondaryClick.emit()"
      >
        {{ secondaryLabel }}
      </button>
      <button
        type="button"
        class="pf-button pf-button--primary"
        [class.pf-button--danger]="variant === 'destructive'"
        [class.pf-button--warning]="variant === 'warning'"
        [disabled]="primaryDisabled || loading"
        (click)="primaryClick.emit()"
      >
        <span *ngIf="loading" class="pf-button__spinner" aria-hidden="true"></span>
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
