import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormField,
  type FieldTree,
  email,
  form,
  minLength,
  required,
  validate,
} from '@angular/forms/signals';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { IconComponent } from '../../../../shared/components/icon.component';
import { AuthApiService } from '../../../../core/services/auth-api.service';
import { RegisterRequest } from '../../../../models/auth.model';
import { SignUpFormModel } from '../../interfaces/auth-form.interface';

@Component({
  selector: 'app-sign-up-form',
  standalone: true,
  imports: [CommonModule, IconComponent, FormField],
  template: `
    <form class="form" (submit)="onSubmit($event)" novalidate>
      <label class="field" for="signup-name">
        <span>Full name</span>
        <div class="field__control">
          <app-icon name="user-round" [size]="16" [strokeWidth]="2" />
          <input
            id="signup-name"
            type="text"
            [formField]="signupForm.fullName"
            placeholder="Your full name"
            autocomplete="name"
            [attr.aria-invalid]="showFieldError(signupForm.fullName, submitted()) ? 'true' : 'false'"
          />
        </div>
      </label>

      @if (showFieldError(signupForm.fullName, submitted())) {
        <p class="form__error">{{ fieldErrorMessage(signupForm.fullName, 'Full name is required.') }}</p>
      }

      <label class="field" for="signup-email">
        <span>Email</span>
        <div class="field__control">
          <app-icon name="mail" [size]="16" [strokeWidth]="2" />
          <input
            id="signup-email"
            type="email"
            [formField]="signupForm.email"
            placeholder="you@company.com"
            autocomplete="email"
            [attr.aria-invalid]="showFieldError(signupForm.email, submitted()) ? 'true' : 'false'"
          />
        </div>
      </label>

      @if (showFieldError(signupForm.email, submitted())) {
        <p class="form__error">{{ fieldErrorMessage(signupForm.email, 'Enter a valid email address.') }}</p>
      }

      <label class="field" for="signup-password">
        <span>Password</span>
        <div class="field__control">
          <app-icon name="lock" [size]="16" [strokeWidth]="2" />
          <input
            id="signup-password"
            [type]="showPassword() ? 'text' : 'password'"
            [formField]="signupForm.password"
            placeholder="At least 8 characters"
            autocomplete="new-password"
            [attr.aria-invalid]="showFieldError(signupForm.password, submitted()) ? 'true' : 'false'"
          />
          <button
            class="field__toggle"
            type="button"
            (click)="showPassword.set(!showPassword())"
            [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
          >
            <app-icon [name]="showPassword() ? 'eye-off' : 'eye'" [size]="16" [strokeWidth]="2" />
          </button>
        </div>
      </label>

      @if (showFieldError(signupForm.password, submitted())) {
        <p class="form__error">{{ fieldErrorMessage(signupForm.password, 'Password must be at least 8 characters.') }}</p>
      }

      <label class="field" for="signup-confirm-password">
        <span>Confirm password</span>
        <div class="field__control">
          <app-icon name="shield" [size]="16" [strokeWidth]="2" />
          <input
            id="signup-confirm-password"
            type="password"
            [formField]="signupForm.confirmPassword"
            placeholder="Re-enter password"
            autocomplete="new-password"
            [attr.aria-invalid]="showFieldError(signupForm.confirmPassword, submitted()) ? 'true' : 'false'"
          />
        </div>
      </label>

      @if (showFieldError(signupForm.confirmPassword, submitted())) {
        <p class="form__error">{{ fieldErrorMessage(signupForm.confirmPassword, 'Passwords do not match.') }}</p>
      }

      @if (errorMessage()) {
        <p class="form__message form__message--error" role="alert">{{ errorMessage() }}</p>
      }

      <button class="form__cta" type="submit" [disabled]="submitting()">
        @if (submitting()) {
          <span class="form__spinner" aria-hidden="true"></span>
          <span>Creating account...</span>
        } @else {
          <span>Create Account</span>
        }
      </button>
    </form>
  `,
  styles: [
    `
      .form {
        margin-top: var(--spacing-xl);
        display: grid;
        gap: var(--spacing-md);
      }

      .field {
        display: grid;
        gap: var(--spacing-xs);
      }

      .field > span {
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-secondary);
      }

      .field__control {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: var(--spacing-sm);
        min-height: 44px;
        border-radius: var(--radius-md);
        border: 1px solid var(--color-border-default);
        background: var(--color-bg-default);
        padding: 0 var(--spacing-md);
        transition:
          border-color var(--duration-fast) ease,
          box-shadow var(--duration-fast) ease;
      }

      .field__control:focus-within {
        border-color: var(--color-primary-base);
        box-shadow: 0 0 0 4px rgba(26, 115, 232, 0.08);
      }

      .field__control app-icon {
        color: var(--color-text-tertiary);
      }

      .field__control input {
        border: 0;
        outline: none;
        width: 100%;
        min-height: 42px;
        background: transparent;
        font-size: var(--font-size-sm);
        color: var(--color-text-primary);
      }

      .field__control input::placeholder {
        color: var(--color-text-tertiary);
      }

      .field__control input:-webkit-autofill,
      .field__control input:-webkit-autofill:hover,
      .field__control input:-webkit-autofill:focus {
        -webkit-box-shadow: 0 0 0 100px var(--color-bg-default) inset !important;
        -webkit-text-fill-color: var(--color-text-primary) !important;
        transition: background-color 5000s ease-in-out 0s;
      }

      .field__toggle {
        border: 0;
        width: 28px;
        height: 28px;
        border-radius: var(--radius-full);
        background: transparent;
        color: var(--color-text-tertiary);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all var(--duration-fast) ease;
      }

      .field__toggle:hover {
        background: rgba(0, 0, 0, 0.05);
        color: var(--color-text-secondary);
      }

      .form__error {
        margin: -4px 0 0;
        font-size: var(--font-size-2xs);
        color: var(--color-status-error);
      }

      .form__message {
        margin: 0;
        font-size: var(--font-size-xs);
        border-radius: var(--radius-sm);
        padding: var(--spacing-sm) var(--spacing-md);
      }

      .form__message--error {
        color: var(--color-status-error);
        background: rgba(239, 68, 68, 0.08);
        border: 1px solid rgba(239, 68, 68, 0.16);
      }

      .form__cta {
        margin-top: var(--spacing-xs);
        min-height: 44px;
        border: 0;
        border-radius: var(--radius-md);
        background: linear-gradient(135deg, var(--color-primary-base), var(--color-primary-hover));
        color: var(--color-text-inverse);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm);
        box-shadow: var(--shadow-primary-sm);
        transition:
          transform var(--duration-fast) var(--ease-out-expo),
          box-shadow var(--duration-fast) var(--ease-out-expo);
      }

      .form__cta:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: var(--shadow-primary-md);
      }

      .form__cta:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        box-shadow: none;
      }

      .form__spinner {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.82);
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `,
  ],
})
export class SignUpFormComponent {
  @Output() registered = new EventEmitter<{ email: string }>();

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

  private readonly model = signal<SignUpFormModel>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  readonly signupForm = form(this.model, (schema) => {
    required(schema.fullName, { message: 'Full name is required.' });
    minLength(schema.fullName, 2, { message: 'Full name must be at least 2 characters.' });
    required(schema.email, { message: 'Email is required.' });
    email(schema.email, { message: 'Enter a valid email address.' });
    required(schema.password, { message: 'Password is required.' });
    minLength(schema.password, 8, { message: 'Password must be at least 8 characters.' });
    required(schema.confirmPassword, { message: 'Please confirm your password.' });
    validate(schema.confirmPassword, ({ value, valueOf }) => {
      const confirmPassword = value();
      const password = valueOf(schema.password);
      if (!confirmPassword || !password || confirmPassword === password) return undefined;
      return { kind: 'password-mismatch', message: 'Passwords do not match.' };
    });
  });

  constructor(private readonly authApiService: AuthApiService) {}

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

    if (!this.signupForm().valid()) {
      this.signupForm.fullName().markAsTouched();
      this.signupForm.email().markAsTouched();
      this.signupForm.password().markAsTouched();
      this.signupForm.confirmPassword().markAsTouched();
      return;
    }

    const payload: RegisterRequest = {
      fullName: this.model().fullName.trim(),
      email: this.model().email.trim(),
      password: this.model().password,
    };

    this.submitting.set(true);

    this.authApiService
      .register(payload)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.registered.emit({ email: this.model().email.trim() });
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.resolveError(error));
        },
      });
  }

  private resolveError(error: HttpErrorResponse): string {
    const backend = error.error?.message as string | undefined;
    if (backend && backend.trim()) return backend;
    if (error.status === 0) return 'Unable to connect to server. Please try again.';
    if (error.status === 409) return 'An account with this email already exists.';
    return 'Registration failed. Please try again in a moment.';
  }
}
