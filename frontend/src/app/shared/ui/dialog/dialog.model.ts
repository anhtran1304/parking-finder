import { Type } from '@angular/core';
import { Subject } from 'rxjs';

export type DialogVariant = 'primary' | 'destructive' | 'warning';

export type DialogBackdrop = 'default' | 'subtle';
export type DialogPosition = 'center' | 'contextual';

export interface DialogConfig {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  icon?: string;
  component?: Type<unknown>;
  data?: Record<string, unknown>;
  closeOnBackdrop?: boolean;
  showClose?: boolean;
  backdrop?: DialogBackdrop;
  position?: DialogPosition;
}

export interface DialogRef<T = boolean> {
  afterClosed$: Subject<T | undefined>;
  close(result?: T): void;
}

export interface DialogState {
  config: DialogConfig;
  ref: DialogRef<unknown>;
}
