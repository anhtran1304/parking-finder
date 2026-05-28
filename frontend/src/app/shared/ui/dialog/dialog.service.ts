import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { DialogConfig, DialogRef, DialogState } from './dialog.model';

@Injectable({ providedIn: 'root' })
export class DialogService {
  readonly activeDialog = signal<DialogState | null>(null);

  open<T = boolean>(config: DialogConfig): DialogRef<T> {
    const afterClosed$ = new Subject<T | undefined>();

    const ref: DialogRef<T> = {
      afterClosed$,
      close: (result?: T) => {
        this.activeDialog.set(null);
        afterClosed$.next(result);
        afterClosed$.complete();
      },
    };

    this.activeDialog.set({
      config: {
        closeOnBackdrop: true,
        showClose: true,
        variant: 'primary',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        ...config,
      },
      ref: ref as DialogRef<unknown>,
    });

    return ref;
  }

  closeActive(): void {
    const current = this.activeDialog();
    if (current) {
      current.ref.close(undefined);
    }
  }
}
