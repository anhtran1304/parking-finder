import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-auth-entry-redirect',
  standalone: true,
  template: '',
})
export class AuthEntryRedirectComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  constructor() {
    const mode = this.route.snapshot.data['mode'] as 'sign-in' | 'sign-up' | undefined;
    const authMode = mode === 'sign-up' ? 'sign-up' : 'sign-in';
    const requestedReturn = this.route.snapshot.queryParamMap.get('returnUrl');
    const returnUrl = this.normalizeReturnUrl(requestedReturn);

    const destination = this.router.parseUrl(returnUrl);
    destination.queryParams = {
      ...destination.queryParams,
      auth: authMode,
      returnUrl,
    };

    void this.router.navigateByUrl(destination, { replaceUrl: true });
  }

  private normalizeReturnUrl(candidate: string | null): string {
    if (!candidate || !candidate.startsWith('/map')) {
      return '/map';
    }
    return candidate;
  }
}
