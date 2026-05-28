import { Injectable, computed, signal } from '@angular/core';
import { AuthResponse, UserSession } from '../../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private static readonly STORAGE_KEY = 'parking-finder.auth.session';

  private readonly sessionSignal = signal<UserSession | null>(this.readSessionFromStorage());

  readonly session = this.sessionSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.getValidSession());

  setFromAuthResponse(response: AuthResponse): void {
    const nextSession: UserSession = {
      accessToken: response.accessToken,
      expiresAt: Date.now() + response.expiresIn * 1000,
      userId: response.userId,
      email: response.email,
      fullName: response.fullName,
    };

    this.sessionSignal.set(nextSession);
    this.persist(nextSession);
  }

  getValidSession(): UserSession | null {
    const current = this.sessionSignal();
    if (!current) {
      return null;
    }

    if (current.expiresAt <= Date.now()) {
      this.clearSession();
      return null;
    }

    return current;
  }

  clearSession(): void {
    this.sessionSignal.set(null);
    const storage = this.getStorage();
    storage?.removeItem(AuthSessionService.STORAGE_KEY);
  }

  private persist(session: UserSession): void {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }
    storage.setItem(AuthSessionService.STORAGE_KEY, JSON.stringify(session));
  }

  private readSessionFromStorage(): UserSession | null {
    const storage = this.getStorage();
    if (!storage) {
      return null;
    }

    const raw = storage.getItem(AuthSessionService.STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as UserSession;
      if (!parsed?.accessToken || !parsed?.expiresAt) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private getStorage(): Storage | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return window.sessionStorage;
  }
}
