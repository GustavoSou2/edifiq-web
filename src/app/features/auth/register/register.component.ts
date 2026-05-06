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

interface RegisterForm {
  name:            string;
  email:           string;
  password:        string;
  confirmPassword: string;
}

@Component({
  selector: 'edq-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ButtonComponent, InputComponent, RouterLink],
  template: `
    <div class="auth-card">

      <!-- Header -->
      <div class="auth-card__header">
        <h2 class="auth-card__title">Criar sua conta</h2>
        <p class="auth-card__subtitle">
          Grátis para começar. Sem cartão de crédito.
        </p>
      </div>

      <!-- Social login -->
      <div class="social-buttons">
        <button class="social-btn" type="button" aria-label="Cadastrar com Google">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          <span>Cadastrar com Google</span>
        </button>
      </div>

      <!-- Divider -->
      <div class="auth-divider">
        <span>ou crie com e-mail</span>
      </div>

      <!-- Error alert -->
      @if (authService.error()) {
        <div class="auth-alert auth-alert--error" role="alert">
          <span class="auth-alert__icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
          </span>
          <span>{{ authService.error() }}</span>
        </div>
      }

      <!-- Form -->
      <form class="auth-form" (ngSubmit)="handleSubmit()" novalidate>

        <edq-input
          label="Nome completo"
          type="text"
          placeholder="João da Silva"
          [variant]="nameVariant()"
          [hint]="nameHint()"
          [(value)]="form.name"
          [required]="true"
          autocomplete="name"
        />

        <edq-input
          label="E-mail corporativo"
          type="email"
          placeholder="joao@construtora.com.br"
          [variant]="emailVariant()"
          [hint]="emailHint()"
          [(value)]="form.email"
          [required]="true"
          autocomplete="email"
        />

        <edq-input
          label="Senha"
          type="password"
          placeholder="Mínimo 8 caracteres"
          [variant]="passwordVariant()"
          [hint]="passwordHint()"
          [(value)]="form.password"
          [required]="true"
          [maxLength]="64"
          autocomplete="new-password"
        />

        <edq-input
          label="Confirmar senha"
          type="password"
          placeholder="Repita a senha"
          [variant]="confirmVariant()"
          [hint]="confirmHint()"
          [(value)]="form.confirmPassword"
          [required]="true"
          autocomplete="new-password"
        />

        <!-- Password strength -->
        @if (form.password.length > 0) {
          <div class="password-strength" aria-label="Força da senha">
            <div class="strength-bars">
              @for (bar of strengthBars(); track $index) {
                <div class="strength-bar" [class]="'strength-bar--' + bar"></div>
              }
            </div>
            <span class="strength-label" [class]="'strength-label--' + strengthLevel()">
              {{ strengthText() }}
            </span>
          </div>
        }

        <!-- Terms -->
        <label class="terms-check">
          <input
            type="checkbox"
            class="terms-check__input"
            [(ngModel)]="acceptedTerms"
            name="terms"
          />
          <span class="terms-check__box" aria-hidden="true"></span>
          <span class="terms-check__label">
            Concordo com os
            <a href="#" target="_blank">Termos de Uso</a>
            e a
            <a href="#" target="_blank">Política de Privacidade</a>
          </span>
        </label>

        <edq-button
          variant="primary"
          type="submit"
          size="lg"
          [fullWidth]="true"
          [loading]="authService.isLoading()"
        >
          Criar conta grátis
        </edq-button>

      </form>

      <!-- Footer -->
      <p class="auth-card__footer">
        Já tem uma conta?
        <a routerLink="/auth/login">Entrar</a>
      </p>

    </div>
  `,
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  protected readonly authService = inject(AuthService);
  private readonly router        = inject(Router);

  /* ── Form state ─────────────────────────────────────────── */
  protected form: RegisterForm = {
    name:            '',
    email:           '',
    password:        '',
    confirmPassword: '',
  };
  protected acceptedTerms      = false;
  protected readonly submitted = signal(false);

  /* ── Validation ─────────────────────────────────────────── */
  protected readonly nameValid = computed(() => {
    if (!this.submitted()) return true;
    return this.form.name.trim().length >= 2;
  });

  protected readonly emailValid = computed(() => {
    if (!this.submitted()) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email);
  });

  protected readonly passwordValid = computed(() => {
    if (!this.submitted()) return true;
    return this.form.password.length >= 8;
  });

  protected readonly confirmValid = computed(() => {
    if (!this.submitted()) return true;
    return this.form.confirmPassword === this.form.password;
  });

  protected readonly nameVariant     = computed(() => !this.nameValid()     ? 'error' : 'default');
  protected readonly emailVariant    = computed(() => !this.emailValid()    ? 'error' : 'default');
  protected readonly passwordVariant = computed(() => !this.passwordValid() ? 'error' : 'default');
  protected readonly confirmVariant  = computed(() => !this.confirmValid()  ? 'error' : 'default');

  protected readonly nameHint     = computed(() => !this.nameValid()     ? 'Informe seu nome completo.' : '');
  protected readonly emailHint    = computed(() => !this.emailValid()    ? 'Informe um e-mail válido.' : '');
  protected readonly passwordHint = computed(() => !this.passwordValid() ? 'A senha deve ter pelo menos 8 caracteres.' : '');
  protected readonly confirmHint  = computed(() => !this.confirmValid()  ? 'As senhas não coincidem.' : '');

  /* ── Password strength ──────────────────────────────────── */
  protected readonly strengthScore = computed(() => {
    const p = this.form.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8)  score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return Math.min(score, 4);
  });

  protected readonly strengthLevel = computed(() => {
    const s = this.strengthScore();
    if (s <= 1) return 'weak';
    if (s === 2) return 'fair';
    if (s === 3) return 'good';
    return 'strong';
  });

  protected readonly strengthText = computed(() => {
    const map: Record<string, string> = {
      weak:   'Fraca',
      fair:   'Razoável',
      good:   'Boa',
      strong: 'Forte',
    };
    return map[this.strengthLevel()];
  });

  protected readonly strengthBars = computed(() => {
    const score = this.strengthScore();
    const level = this.strengthLevel();
    return Array.from({ length: 4 }, (_, i) => (i < score ? level : 'empty'));
  });

  protected readonly canSubmit = computed(() =>
    this.form.name.length > 0 &&
    this.form.email.length > 0 &&
    this.form.password.length > 0 &&
    this.form.confirmPassword.length > 0 &&
    this.acceptedTerms
  );

  /* ── Submit ─────────────────────────────────────────────── */
  async handleSubmit(): Promise<void> {
    this.submitted.set(true);
    this.authService.clearError();

    if (!this.nameValid() || !this.emailValid() || !this.passwordValid() || !this.confirmValid()) return;

    const ok = await this.authService.register({
      name:     this.form.name,
      email:    this.form.email,
      password: this.form.password,
    });

    if (ok) {
      await this.router.navigate(['/auth/confirm-email']);
    }
  }
}
