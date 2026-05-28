import { Component, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <main class="forgot-page">
      <article class="forgot-card">
        <a class="forgot-card__back" [routerLink]="['/auth/sign-in']" [queryParams]="{ returnUrl: returnUrl() }">
          <app-icon name="arrow-right" [size]="14" [strokeWidth]="2.4" />
          <span>Back to Sign In</span>
        </a>

        <header>
          <h1>Forgot password?</h1>
          <p>
            Password reset flow will be enabled soon. Leave your email and we will notify you when
            recovery is available.
          </p>
        </header>

        <form (submit)="onSubmit($event)" class="forgot-card__form" novalidate>
          <label for="forgot-email">Email</label>
          <div class="forgot-card__field">
            <app-icon name="mail" [size]="16" [strokeWidth]="2" />
            <input
              id="forgot-email"
              type="email"
              [value]="email()"
              (input)="onEmailInput($event)"
              placeholder="you@company.com"
              autocomplete="email"
            />
          </div>

          <button type="submit" [disabled]="!email().trim()">Notify me</button>
        </form>

        @if (submitted()) {
          <p class="forgot-card__success">Thanks. We saved your interest for early access.</p>
        }
      </article>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background:
          radial-gradient(700px 340px at 0% 0%, rgba(26, 115, 232, 0.14), transparent 60%),
          linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%);
      }

      .forgot-page {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
      }

      .forgot-card {
        width: min(480px, 100%);
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(255, 255, 255, 0.86);
        box-shadow: 0 20px 44px rgba(13, 27, 53, 0.13);
        padding: 24px;
      }

      .forgot-card__back {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        text-decoration: none;
        color: rgba(26, 115, 232, 0.94);
        font-size: 0.84rem;
        font-weight: 600;
      }

      .forgot-card__back app-icon {
        transform: rotate(180deg);
      }

      header {
        margin-top: 12px;
      }

      h1 {
        margin: 0;
        font-size: 1.75rem;
        color: #0d1b35;
      }

      p {
        margin: 10px 0 0;
        color: rgba(13, 27, 53, 0.67);
        line-height: 1.6;
      }

      .forgot-card__form {
        margin-top: 20px;
        display: grid;
        gap: 8px;
      }

      label {
        font-size: 0.82rem;
        font-weight: 600;
        color: rgba(13, 27, 53, 0.8);
      }

      .forgot-card__field {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        gap: 10px;
        border: 1px solid rgba(26, 115, 232, 0.2);
        border-radius: 12px;
        min-height: 46px;
        padding: 0 12px;
        background: #fff;
      }

      .forgot-card__field app-icon {
        color: rgba(13, 27, 53, 0.44);
      }

      .forgot-card__field input {
        border: 0;
        outline: 0;
        min-height: 44px;
        background: transparent;
        font-size: 0.95rem;
      }

      button {
        margin-top: 6px;
        min-height: 46px;
        border-radius: 12px;
        border: 0;
        background: linear-gradient(135deg, #1a73e8, #1557b0);
        color: #fff;
        font-weight: 700;
        cursor: pointer;
      }

      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .forgot-card__success {
        margin-top: 14px;
        font-size: 0.85rem;
        color: #0f766e;
        background: rgba(16, 185, 129, 0.12);
        border: 1px solid rgba(16, 185, 129, 0.24);
        padding: 10px 12px;
        border-radius: 10px;
      }

      @media (max-width: 767px) {
        .forgot-page {
          padding: 12px;
        }

        .forgot-card {
          border-radius: 16px;
          padding: 18px;
        }
      }
    `,
  ],
})
export class ForgotPasswordComponent {
  readonly email = signal('');
  readonly submitted = signal(false);
  readonly returnUrl = signal('/');

  constructor(private readonly route: ActivatedRoute) {
    const candidate = this.route.snapshot.queryParamMap.get('returnUrl');
    this.returnUrl.set(candidate && candidate.startsWith('/') ? candidate : '/');
  }

  onEmailInput(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
    this.submitted.set(false);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.email().trim()) {
      return;
    }
    this.submitted.set(true);
  }
}
