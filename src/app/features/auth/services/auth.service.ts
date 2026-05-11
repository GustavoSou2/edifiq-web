import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PermissionService } from '../../../core/services/permission.service';

export interface AuthUser {
  id:            string;
  fullName:      string;
  email:         string;
  emailVerified: boolean;
  avatarUrl:     string | null;
  phone:         string | null;
  tenant: {
    id:   string;
    name: string;
    slug: string;
  };
}

export interface LoginPayload {
  email:    string;
  password: string;
}

export interface RegisterPayload {
  tenantName: string;
  name:       string;
  email:      string;
  password:   string;
}

interface AuthResponse {
  tokenType:   string;
  accessToken: string;
  expiresAt:   string;
  userId:      string;
  tenantId:    string;
  user:        AuthUser;
}

interface MeResponse {
  user:       AuthUser;
  email:      string;
  tenantId:   string;
  tenantSlug: string;
}

const TOKEN_KEY = 'edq_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http        = inject(HttpClient);
  private readonly base        = `${environment.apiUrl}/v1`;
  private readonly permService = inject(PermissionService);

  /* ── State ──────────────────────────────────────────────── */
  private readonly _user         = signal<AuthUser | null>(null);
  private readonly _isLoading    = signal(false);
  private readonly _error        = signal<string | null>(null);
  private readonly _pendingEmail = signal<string | null>(null);
  private readonly _token        = signal<string | null>(null);
  private readonly _initialized  = signal(false);

  /* ── Public signals ─────────────────────────────────────── */
  readonly user         = this._user.asReadonly();
  readonly isLoading    = this._isLoading.asReadonly();
  readonly error        = this._error.asReadonly();
  readonly pendingEmail = this._pendingEmail.asReadonly();
  readonly token        = this._token.asReadonly();
  readonly initialized  = this._initialized.asReadonly();
  readonly isLoggedIn   = computed(() => this._user() !== null);

  /* ── Init — chamado via APP_INITIALIZER no boot ─────────── */
  async init(): Promise<void> {
    const stored = localStorage.getItem(TOKEN_KEY);

    if (!stored) {
      this._initialized.set(true);
      return;
    }

    // Coloca o token em memória para o interceptor incluí-lo na chamada /me
    this._token.set(stored);

    try {
      const res = await firstValueFrom(
        this.http.get<MeResponse>(`${this.base}/me`),
      );
      this._user.set(res.user);
      // Carrega permissões do usuário restaurado
      // await this.permService.load(res.user.id);
    } catch {
      // Token expirado ou inválido — limpa tudo silenciosamente
      this._clearSession();
    } finally {
      this._initialized.set(true);
    }
  }

  /* ── Login ──────────────────────────────────────────────── */
  async login(payload: LoginPayload): Promise<boolean> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.base}/auth/login`, payload),
      );

      this._setSession(res.user, res.accessToken);
      // Carrega permissões após login
      // await this.permService.load(res.user.id);
      return true;

    } catch (err) {
      console.error('[AuthService] login error:', err);
      this._error.set('E-mail ou senha incorretos. Tente novamente.');
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
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.base}/auth/register`, payload),
      );

      this._setSession(res.user, res.accessToken);
      this._pendingEmail.set(payload.email);
      // Carrega permissões após registro
      // await this.permService.load(res.user.id);
      return true;

    } catch (err: any) {
      this._error.set(
        err?.error?.message ?? 'Erro ao criar conta. Tente novamente.',
      );
      return false;

    } finally {
      this._isLoading.set(false);
    }
  }

  /* ── Resend verification link ───────────────────────────── */
  async resendVerificationLink(): Promise<boolean> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(
        this.http.post(`${this.base}/auth/resend-verification`, {
          email: this._pendingEmail() ?? this._user()?.email,
        }),
      );
      return true;
    } catch {
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  /* ── Dismiss pending email ──────────────────────────────── */
  dismissEmailVerification(): void {
    this._pendingEmail.set(null);
  }

  /* ── Logout ─────────────────────────────────────────────── */
  logout(): void {
    this._clearSession();
    this.permService.clear();
    this._pendingEmail.set(null);
    this._error.set(null);
  }

  clearError(): void {
    this._error.set(null);
  }

  /* ── Helpers privados ───────────────────────────────────── */
  private _setSession(user: AuthUser, token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this._token.set(token);
    this._user.set(user);
  }

  private _clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    this._token.set(null);
    this._user.set(null);
  }
}
