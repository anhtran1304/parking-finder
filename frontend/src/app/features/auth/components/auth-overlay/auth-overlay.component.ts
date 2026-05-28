import { Component, EventEmitter, Input, Output, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalShellComponent } from '../../../../shared/ui/modal-shell/modal-shell.component';
import { AuthBrandHeaderComponent } from '../auth-brand-header/auth-brand-header.component';
import { SocialLoginSectionComponent } from '../social-login-section/social-login-section.component';
import { SignInFormComponent } from '../sign-in-form/sign-in-form.component';
import { SignUpFormComponent } from '../sign-up-form/sign-up-form.component';
import { AuthOverlayMode, AuthOverlayBookingContext } from '../../interfaces/auth-overlay.interface';

@Component({
  selector: 'app-auth-overlay',
  standalone: true,
  imports: [
    CommonModule,
    ModalShellComponent,
    AuthBrandHeaderComponent,
    SocialLoginSectionComponent,
    SignInFormComponent,
    SignUpFormComponent,
  ],
  template: `
    <app-modal-shell
      [open]="true"
      size="md"
      [bottomSheet]="true"
      ariaLabel="Authentication"
      (closed)="closed.emit()"
    >
      <app-auth-brand-header
        title="Parking Finder"
        [subtitle]="mode === 'sign-in' ? 'Sign in to continue' : 'Create your account'"
      />

      @if (mode === 'sign-in') {
        <app-sign-in-form
          [successMessage]="successMessage"
          (signedIn)="signedIn.emit()"
        />
      } @else {
        <app-sign-up-form
          (registered)="onRegistered($event)"
        />
      }

      <app-social-login-section
        [hint]="socialHint()"
        (googleClicked)="onGoogleClick()"
      />

      <div class="footer">
        @if (mode === 'sign-in') {
          <span>New here?</span>
          <button type="button" class="footer__link" (click)="switchMode('sign-up')">Create account</button>
        } @else {
          <span>Already have an account?</span>
          <button type="button" class="footer__link" (click)="switchMode('sign-in')">Sign in</button>
        }
      </div>
    </app-modal-shell>
  `,
  styles: [
    `
      .footer {
        margin-top: var(--spacing-lg);
        display: flex;
        justify-content: center;
        align-items: center;
        gap: var(--spacing-xs);
        font-size: var(--font-size-xs);
        color: var(--color-text-secondary);
      }

      .footer__link {
        border: 0;
        background: transparent;
        color: var(--color-primary-base);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        cursor: pointer;
        transition: opacity var(--duration-fast) ease;
      }

      .footer__link:hover {
        opacity: 0.8;
      }
    `,
  ],
})
export class AuthOverlayComponent {
  @Input({ required: true }) mode: AuthOverlayMode = 'sign-in';
  @Input() bookingContext: AuthOverlayBookingContext | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() modeChanged = new EventEmitter<AuthOverlayMode>();
  @Output() signedIn = new EventEmitter<void>();

  @ViewChild(SignInFormComponent) signInForm?: SignInFormComponent;

  readonly socialHint = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  switchMode(mode: AuthOverlayMode): void {
    this.socialHint.set(null);
    this.successMessage.set(null);
    this.modeChanged.emit(mode);
  }

  onRegistered(event: { email: string }): void {
    this.successMessage.set('Account created. Please sign in to continue.');
    this.modeChanged.emit('sign-in');

    // Pre-fill email in sign-in form after it renders
    setTimeout(() => {
      this.signInForm?.setEmail(event.email);
    });
  }

  onGoogleClick(): void {
    this.socialHint.set('Google OAuth will be available in a future release.');
  }
}
