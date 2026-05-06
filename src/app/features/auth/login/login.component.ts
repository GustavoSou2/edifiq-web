import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

interface LoginForm {
  email:    string;
  password: string;
}

@Component({
  selector: 'edq-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ButtonComponent, InputComponent, RouterLink],
  template: `
    <div class="auth-card">

      <div class="auth-card__header">
        <h2 class="auth-card__title">Bem-vindo de volta</h2>
        <p class="auth-card__subtitle">
          Entre na sua conta para continuar
        </p>
      </div>

      <div class="social-buttons">
        <button class="social-btn" type="button" aria-label="Entrar com Google">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          <span>Continuar com Google</span>
        </button>

        <button class="social-btn" type="button" aria-label="Entrar com Microsoft">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="0" y="0" width="8.5" height="8.5" fill="#F25022"/>
            <rect x="9.5" y="0" width="8.5" height="8.5" fill="#7FBA00"/>
            <rect x="0" y="9.5" width="8.5" height="8.5" fill="#00A4EF"/>
            <rect x="9.5" y="9.5" width="8.5" height="8.5" fill="#FFB900"/>
          </svg>
          <span>Continuar com Microsoft</span>
        </button>
      </div>

      <div class="auth-divider">
        <span>ou entre com e-mail</span>
      </div>

      @if (authService.error()) {
        <div class="auth-alert auth-alert--error" role="alert">
          <span class="auth-alert__icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
          </span>
          <span>{{ authService.error() }}</span>
        </div>
      }

      <form class="auth-form" (ngSubmit)="handleSubmit()" #loginForm="ngForm" novalidate>

        <edq-input
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          [variant]="emailVariant()"
          [hint]="emailHint()"
          [(value)]="form.email"
          [required]="true"
          autocomplete="email"
        />

        <div class="password-field">
          <edq-input
            label="Senha"
            type="password"
            placeholder="••••••••"
            [variant]="passwordVariant()"
            [hint]="passwordHint()"
            [(value)]="form.password"
            [required]="true"
            autocomplete="current-password"
          />
          <a class="forgot-link" routerLink="/auth/forgot-password">
            Esqueceu a senha?
          </a>
        </div>

        <edq-button
          variant="primary"
          type="submit"
          size="lg"
          [fullWidth]="true"
          [loading]="authService.isLoading()"
        >
          Entrar na conta
        </edq-button>

      </form>

      <p class="auth-card__footer">
        Não tem uma conta?
        <a routerLink="/auth/register">Criar conta grátis</a>
      </p>

    </div>
  `,
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  protected readonly authService = inject(AuthService);
  private readonly router        = inject(Router);
  private readonly toast         = inject(ToastService);

  /* ── Form state ─────────────────────────────────────────── */
  protected form: LoginForm = { email: '', password: '' };
  protected readonly submitted = signal(false);

  /* ── Validation computed ────────────────────────────────── */
  protected readonly emailValid = computed(() => {
    if (!this.submitted()) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email);
  });

  protected readonly passwordValid = computed(() => {
    if (!this.submitted()) return true;
    return this.form.password.length >= 6;
  });

  protected readonly emailVariant = computed(() =>
    !this.emailValid() ? 'error' : 'default'
  );

  protected readonly passwordVariant = computed(() =>
    !this.passwordValid() ? 'error' : 'default'
  );

  protected readonly emailHint = computed(() =>
    !this.emailValid() ? 'Informe um e-mail válido.' : ''
  );

  protected readonly passwordHint = computed(() =>
    !this.passwordValid() ? 'A senha deve ter pelo menos 6 caracteres.' : ''
  );

  protected readonly isFormValid = computed(() =>
    this.form.email.length > 0 && this.form.password.length > 0
  );

  /* ── Submit ─────────────────────────────────────────────── */
  async handleSubmit(): Promise<void> {
    this.submitted.set(true);
    this.authService.clearError();

    if (!this.emailValid() || !this.passwordValid()) return;

    const loadingId = this.toast.loading('Entrando na conta...');

    const ok = await this.authService.login({
      email:    this.form.email,
      password: this.form.password,
    });

    this.toast.dismiss(loadingId);

    if (ok) {
      this.toast.success('Login realizado!', { message: 'Bem-vindo de volta.' });
      await this.router.navigate(['/app/dashboard']);
    } else {
      this.toast.error(this.authService.error() ?? 'Falha ao entrar.', {
        message: 'Verifique seu e-mail e senha.',
      });
    }
  }
}
