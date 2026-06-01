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
    <form class="pf-form auth-form" (submit)="onSubmit($event)" novalidate>
      <label class="pf-field" for="signup-name">
        <span class="pf-field__label">Full name</span>
        <div class="pf-field__control">
          <app-icon name="user-round" [size]="16" [strokeWidth]="2" />
          <input
            class="pf-field__input"
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
        <p class="pf-form-error">{{ fieldErrorMessage(signupForm.fullName, 'Full name is required.') }}</p>
      }

      <label class="pf-field" for="signup-email">
        <span class="pf-field__label">Email</span>
        <div class="pf-field__control">
          <app-icon name="mail" [size]="16" [strokeWidth]="2" />
          <input
            class="pf-field__input"
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
        <p class="pf-form-error">{{ fieldErrorMessage(signupForm.email, 'Enter a valid email address.') }}</p>
      }

      <label class="pf-field" for="signup-password">
        <span class="pf-field__label">Password</span>
        <div class="pf-field__control">
          <app-icon name="lock" [size]="16" [strokeWidth]="2" />
          <input
            class="pf-field__input"
            id="signup-password"
            [type]="showPassword() ? 'text' : 'password'"
            [formField]="signupForm.password"
            placeholder="At least 8 characters"
            autocomplete="new-password"
            [attr.aria-invalid]="showFieldError(signupForm.password, submitted()) ? 'true' : 'false'"
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

      @if (showFieldError(signupForm.password, submitted())) {
        <p class="pf-form-error">{{ fieldErrorMessage(signupForm.password, 'Password must be at least 8 characters.') }}</p>
      }

      <label class="pf-field" for="signup-confirm-password">
        <span class="pf-field__label">Confirm password</span>
        <div class="pf-field__control">
          <app-icon name="shield" [size]="16" [strokeWidth]="2" />
          <input
            class="pf-field__input"
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
        <p class="pf-form-error">{{ fieldErrorMessage(signupForm.confirmPassword, 'Passwords do not match.') }}</p>
      }

      @if (errorMessage()) {
        <p class="pf-form-message pf-form-message--danger" role="alert">{{ errorMessage() }}</p>
      }

      <button class="pf-button pf-button--primary pf-button--full pf-button--lg auth-form__cta" type="submit" [disabled]="submitting()">
        @if (submitting()) {
          <span class="pf-button__spinner" aria-hidden="true"></span>
          <span>Creating account...</span>
        } @else {
          <span>Create Account</span>
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
