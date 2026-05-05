import { Injectable, signal, computed } from '@angular/core';

export interface AuthUser {
  id:    string;
  name:  string;
  email: string;
}

export interface LoginPayload {
  email:    string;
  password: string;
}

export interface RegisterPayload {
  name:     string;
  email:    string;
  password: string;
}

export type AuthStep = 'login' | 'register' | 'confirm-email';

export interface AuthToken {
  accessToken:  string;
  refreshToken: string;
}

/**
 * AuthService — gerencia estado de autenticação via signals.
 * Em produção, substituir os métodos por chamadas HTTP reais.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  /* ── State ──────────────────────────────────────────────── */
  private readonly _user          = signal<AuthUser | null>(null);
  private readonly _isLoading     = signal(false);
  private readonly _error         = signal<string | null>(null);
  private readonly _pendingEmail  = signal<string | null>(null);
  private readonly _token         = signal<string | null>(null);

  /* ── Public readonly signals ────────────────────────────── */
  readonly user         = this._user.asReadonly();
  readonly isLoading    = this._isLoading.asReadonly();
  readonly error        = this._error.asReadonly();
  readonly pendingEmail = this._pendingEmail.asReadonly();
  readonly token        = this._token.asReadonly();
  readonly isLoggedIn   = computed(() => this._user() !== null);

  /* ── Login ──────────────────────────────────────────────── */
  async login(payload: LoginPayload): Promise<boolean> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      // Simula chamada de API (substituir por HttpClient)
      await this.simulateDelay(1200);

      if (payload.email === 'erro@teste.com') {
        throw new Error('E-mail ou senha incorretos. Tente novamente.');
      }

      this._user.set({
        id:    'usr_01',
        name:  'João Melo',
        email: payload.email,
      });
      this._token.set('mock-jwt-token-usr-01');

      return true;
    } catch (err) {
      this._error.set(err instanceof Error ? err.message : 'Erro inesperado.');
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  /* ── Register ───────────────────────────────────────────── */
  async register(payload: RegisterPayload): Promise<boolean> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      await this.simulateDelay(1400);

      if (payload.email === 'existente@teste.com') {
        throw new Error('Este e-mail já está cadastrado.');
      }

      this._pendingEmail.set(payload.email);
      return true;
    } catch (err) {
      this._error.set(err instanceof Error ? err.message : 'Erro inesperado.');
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  /* ── Confirm Email ──────────────────────────────────────── */
  async confirmEmail(code: string): Promise<boolean> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      await this.simulateDelay(1000);

      if (code !== '123456') {
        throw new Error('Código inválido. Verifique seu e-mail e tente novamente.');
      }

      const email = this._pendingEmail();
      this._user.set({
        id:    'usr_02',
        name:  'Novo Usuário',
        email: email ?? '',
      });
      this._pendingEmail.set(null);
      return true;
    } catch (err) {
      this._error.set(err instanceof Error ? err.message : 'Erro inesperado.');
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  /* ── Resend Code ────────────────────────────────────────── */
  async resendCode(): Promise<void> {
    this._isLoading.set(true);
    await this.simulateDelay(800);
    this._isLoading.set(false);
  }

  /* ── Logout ─────────────────────────────────────────────── */
  logout(): void {
    this._user.set(null);
    this._token.set(null);
    this._pendingEmail.set(null);
    this._error.set(null);
  }

  clearError(): void {
    this._error.set(null);
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
