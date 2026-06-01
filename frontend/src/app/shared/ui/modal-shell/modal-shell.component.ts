import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../components/icon.component';

@Component({
  selector: 'app-modal-shell',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div
      *ngIf="open"
      class="modal"
      [class.modal--bottom-sheet]="bottomSheet"
      [class.modal--contextual]="position === 'contextual'"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="ariaLabel"
    >
      <div
        class="modal__backdrop"
        [class.modal__backdrop--subtle]="backdrop === 'subtle'"
        (click)="backdropClick()"
      ></div>

      <div class="modal__surface" [class]="'modal__surface--' + size">
        <button
          *ngIf="showClose"
          class="pf-icon-button modal__close"
          type="button"
          (click)="closed.emit()"
          aria-label="Close dialog"
        >
          <app-icon name="x" [size]="20" [strokeWidth]="2" />
        </button>

        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      .modal {
        position: fixed;
        inset: 0;
        z-index: 100;
        display: grid;
        place-items: center;
        padding: var(--spacing-lg);
      }

      .modal__backdrop {
        position: absolute;
        inset: 0;
        background: rgba(13, 27, 53, 0.28);
        backdrop-filter: blur(var(--glass-blur));
        -webkit-backdrop-filter: blur(var(--glass-blur));
        animation: fadeIn var(--duration-normal) var(--ease-out-expo);
      }

      .modal__backdrop--subtle {
        background: rgba(0, 0, 0, 0.12);
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
      }

      .modal--contextual {
        place-items: center end;
        padding-right: var(--spacing-2xl);
      }

      .modal__surface {
        position: relative;
        z-index: 1;
        max-height: calc(100vh - 40px);
        overflow-y: auto;
        scrollbar-width: none;
        border-radius: var(--radius-xl);
        background: var(--glass-bg-solid);
        border: 1px solid var(--glass-border);
        box-shadow: var(--shadow-float);
        padding: var(--spacing-2xl);
        animation: cardSlideUp var(--duration-slow) var(--ease-out-expo);
      }

      .modal__surface::-webkit-scrollbar {
        display: none;
      }

      .modal__surface--sm {
        width: min(360px, calc(100vw - 32px));
      }

      .modal__surface--md {
        width: min(420px, calc(100vw - 32px));
      }

      .modal__surface--lg {
        width: min(560px, calc(100vw - 32px));
      }

      .modal__close {
        position: absolute;
        top: var(--spacing-lg);
        right: var(--spacing-lg);
      }

      /* Responsive bottom-sheet on mobile */
      .modal--bottom-sheet {
        @media (max-width: 767px) {
          padding: 0;
          align-items: end;
        }
      }

      .modal--bottom-sheet .modal__surface {
        @media (max-width: 767px) {
          width: 100%;
          max-height: 90vh;
          border-radius: var(--radius-xl) var(--radius-xl) 0 0;
          padding: var(--spacing-xl);
          animation: sheetSlideUp var(--duration-slow) var(--ease-out-expo);
        }
      }
    `,
  ],
})
export class ModalShellComponent {
  @Input() open = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() bottomSheet = true;
  @Input() showClose = true;
  @Input() ariaLabel = 'Dialog';
  @Input() closeOnBackdrop = true;
  @Input() backdrop: 'default' | 'subtle' = 'default';
  @Input() position: 'center' | 'contextual' = 'center';

  @Output() closed = new EventEmitter<void>();

  backdropClick(): void {
    if (this.closeOnBackdrop) {
      this.closed.emit();
    }
  }
}
