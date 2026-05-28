import { Component, inject } from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { DialogService } from './dialog.service';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-dialog-outlet',
  standalone: true,
  imports: [CommonModule, NgComponentOutlet, ModalShellComponent, ConfirmDialogComponent],
  template: `
    @if (dialogService.activeDialog(); as dialog) {
      <app-modal-shell
        [open]="true"
        size="sm"
        [bottomSheet]="true"
        [showClose]="dialog.config.showClose ?? true"
        [closeOnBackdrop]="dialog.config.closeOnBackdrop ?? true"
        [ariaLabel]="dialog.config.title"
        [backdrop]="dialog.config.backdrop ?? 'default'"
        [position]="dialog.config.position ?? 'center'"
        (closed)="dialogService.closeActive()"
      >
        @if (dialog.config.component) {
          <ng-container *ngComponentOutlet="dialog.config.component" />
        } @else {
          <app-confirm-dialog />
        }
      </app-modal-shell>
    }
  `,
})
export class DialogOutletComponent {
  readonly dialogService = inject(DialogService);
}
