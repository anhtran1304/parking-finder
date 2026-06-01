import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormField,
  type FieldTree,
  email,
  form,
  minLength,
  required,
} from '@angular/forms/signals';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { IconComponent } from '../../../../shared/components/icon.component';
import { AuthApiService } from '../../../../core/services/auth-api.service';
import { AuthSessionService } from '../../../../core/services/auth-session.service';
import { LoginRequest } from '../../../../models/auth.model';
import { SignInFormModel } from '../../interfaces/auth-form.interface';

@Component({
  selector: 'app-sign-in-form',
  standalone: true,
  imports: [CommonModule, IconComponent, FormField],
  template: `
    <form class="pf-form auth-form" (submit)="onSubmit($event)" novalidate>
      <label class="pf-field" for="signin-email">
        <span class="pf-field__label">Email</span>
        <div class="pf-field__control">
          <app-icon name="mail" [size]="16" [strokeWidth]="2" />
          <input
            class="pf-field__input"
            id="signin-email"
            type="email"
            [formField]="signinForm.email"
            placeholder="you@company.com"
            autocomplete="email"
            [attr.aria-invalid]="showFieldError(signinForm.email, submitted()) ? 'true' : 'false'"
          />
        </div>
      </label>

      @if (showFieldError(signinForm.email, submitted())) {
        <p class="pf-form-error">{{ fieldErrorMessage(signinForm.email, 'Enter a valid email address.') }}</p>
      }

      <label class="pf-field" for="signin-password">
        <span class="pf-field__label">Password</span>
        <div class="pf-field__control">
          <app-icon name="lock" [size]="16" [strokeWidth]="2" />
          <input
            class="pf-field__input"
            id="signin-password"
            [type]="showPassword() ? 'text' : 'password'"
            [formField]="signinForm.password"
            placeholder="Enter your password"
            autocomplete="current-password"
            [attr.aria-invalid]="showFieldError(signinForm.password, submitted()) ? 'true' : 'false'"
          />
          <button
            class="pf-field__toggle"
            type="button"
            (click)="showPassword.set(!showPassword())"
            [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
          >
            <app-icon [name]="showPassword() ? 'eye-off' : 'eye'" [size]="16" [strokeWidth]="2" />
          </button>
        </div>
      </label>

      @if (showFieldError(signinForm.password, submitted())) {
        <p class="pf-form-error">{{ fieldErrorMessage(signinForm.password, 'Password is invalid.') }}</p>
      }

      @if (errorMessage()) {
        <p class="pf-form-message pf-form-message--danger" role="alert">{{ errorMessage() }}</p>
      }

      @if (successMessage()) {
        <p class="pf-form-message pf-form-message--success" role="status">{{ successMessage() }}</p>
      }

      <button class="pf-button pf-button--primary pf-button--full pf-button--lg auth-form__cta" type="submit" [disabled]="submitting()">
        @if (submitting()) {
          <span class="pf-button__spinner" aria-hidden="true"></span>
          <span>Signing in...</span>
        } @else {
          <span>Sign In</span>
        }
      </button>
    </form>
  `,
  styles: [
    `
      .auth-form {
        margin-top: var(--spacing-xl);
      }

      .auth-form__cta {
        margin-top: var(--spacing-xs);
      }
    `,
  ],
})
export class SignInFormComponent {
  @Input() initialEmail = '';
  @Input() successMessage = signal<string | null>(null);

  @Output() signedIn = new EventEmitter<void>();

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

  private readonly model = signal<SignInFormModel>({
    email: '',
    password: '',
  });

  readonly signinForm = form(this.model, (schema) => {
    required(schema.email, { message: 'Email is required.' });
    email(schema.email, { message: 'Enter a valid email address.' });
    required(schema.password, { message: 'Password is required.' });
    minLength(schema.password, 6, { message: 'Password must be at least 6 characters.' });
  });

  constructor(
    private readonly authApiService: AuthApiService,
    private readonly authSessionService: AuthSessionService
  ) {}

  showFieldError(field: FieldTree<unknown>, submitAttempted: boolean): boolean {
    const state = field();
    return (submitAttempted || state.touched()) && state.errors().length > 0;
  }

  fieldErrorMessage(field: FieldTree<unknown>, fallback: string): string {
    const error = field().errors()[0];
    return error?.message ?? fallback;
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (!this.signinForm().valid()) {
      this.signinForm.email().markAsTouched();
      this.signinForm.password().markAsTouched();
      return;
    }

    const payload: LoginRequest = {
      email: this.model().email.trim(),
      password: this.model().password,
    };

    this.submitting.set(true);

    this.authApiService
      .login(payload)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (response) => {
          this.authSessionService.setFromAuthResponse(response);
          this.signedIn.emit();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.resolveError(error));
        },
      });
  }

  setEmail(email: string): void {
    this.model.update((m) => ({ ...m, email }));
  }

  private resolveError(error: HttpErrorResponse): string {
    const backend = error.error?.message as string | undefined;
    if (backend && backend.trim()) return backend;
    if (error.status === 0) return 'Unable to connect to server. Please try again.';
    if (error.status === 400 || error.status === 401 || error.status === 409) {
      return 'Please review your input and try again.';
    }
    return 'Authentication failed. Please try again in a moment.';
  }
}
