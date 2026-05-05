import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  QueryList,
  signal,
  ViewChildren,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ButtonComponent } from '../../../shared/components/button/button.component';
import { AuthService } from '../services/auth.service';

const CODE_LENGTH = 6;

@Component({
  selector: 'edq-confirm-email',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ButtonComponent, RouterLink],
  template: `
    <div class="auth-card">

      <!-- Header -->
      <div class="auth-card__header">
        <!-- Ícone animado -->
        <div class="confirm-icon" aria-hidden="true">
          <div class="confirm-icon__ring"></div>
          <span class="confirm-icon__emoji">📬</span>
        </div>

        <h2 class="auth-card__title">Verifique seu e-mail</h2>
        <p class="auth-card__subtitle">
          Enviamos um código de 6 dígitos para<br>
          <strong>{{ authService.pendingEmail() ?? 'seu e-mail' }}</strong>
        </p>
      </div>

      <!-- Error alert -->
      @if (authService.error()) {
        <div class="auth-alert auth-alert--error" role="alert">
          <span class="auth-alert__icon">⚠️</span>
          <span>{{ authService.error() }}</span>
        </div>
      }

      <!-- Success alert -->
      @if (resendSuccess()) {
        <div class="auth-alert auth-alert--success" role="status">
          <span class="auth-alert__icon">✅</span>
          <span>Novo código enviado! Verifique sua caixa de entrada.</span>
        </div>
      }

      <!-- OTP Input -->
      <form class="auth-form" (ngSubmit)="handleSubmit()" novalidate>

        <div class="otp-group" role="group" aria-label="Código de verificação">
          @for (digit of digits(); track $index) {
            <input
              #otpInput
              type="text"
              inputmode="numeric"
              maxlength="1"
              pattern="[0-9]"
              class="otp-input"
              [class.otp-input--filled]="digit !== ''"
              [class.otp-input--error]="hasError()"
              [value]="digit"
              [attr.aria-label]="'Dígito ' + ($index + 1)"
              (keydown)="handleKeydown($event, $index)"
              (input)="handleInput($event, $index)"
              (paste)="handlePaste($event)"
              (focus)="handleFocus($index)"
            />
          }
        </div>

        @if (hasError()) {
          <p class="otp-error" role="alert">
            Código inválido. Tente novamente.
          </p>
        }

        <edq-button
          variant="primary"
          type="submit"
          size="lg"
          [fullWidth]="true"
          [loading]="authService.isLoading()"
          [disabled]="!isCodeComplete()"
        >
          Verificar e-mail
        </edq-button>

      </form>

      <!-- Resend -->
      <div class="resend-area">
        <p class="resend-text">Não recebeu o código?</p>

        @if (resendCooldown() > 0) {
          <span class="resend-timer">
            Reenviar em {{ resendCooldown() }}s
          </span>
        } @else {
          <button
            type="button"
            class="resend-btn"
            [disabled]="authService.isLoading()"
            (click)="handleResend()"
          >
            Reenviar código
          </button>
        }
      </div>

      <!-- Back -->
      <p class="auth-card__footer">
        <a routerLink="/auth/register">← Voltar ao cadastro</a>
      </p>

    </div>
  `,
  styleUrl: './confirm-email.component.scss',
})
export class ConfirmEmailComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly router        = inject(Router);

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  /* ── State ──────────────────────────────────────────────── */
  protected readonly digits         = signal<string[]>(Array(CODE_LENGTH).fill(''));
  protected readonly hasError       = signal(false);
  protected readonly resendSuccess  = signal(false);
  protected readonly resendCooldown = signal(0);

  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  /* ── Computed ───────────────────────────────────────────── */
  protected readonly isCodeComplete = computed(() =>
    this.digits().every(d => d !== '')
  );

  protected readonly fullCode = computed(() =>
    this.digits().join('')
  );

  ngOnInit(): void {
    // Redireciona se não há e-mail pendente
    if (!this.authService.pendingEmail()) {
      this.router.navigate(['/auth/register']);
    }
  }

  /* ── OTP Handlers ───────────────────────────────────────── */
  handleInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(-1);

    this.updateDigit(index, value);
    input.value = value;

    if (value && index < CODE_LENGTH - 1) {
      this.focusInput(index + 1);
    }

    this.hasError.set(false);
    this.authService.clearError();
  }

  handleKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      if (this.digits()[index] === '' && index > 0) {
        this.updateDigit(index - 1, '');
        this.focusInput(index - 1);
      } else {
        this.updateDigit(index, '');
      }
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      this.focusInput(index - 1);
    }

    if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      this.focusInput(index + 1);
    }
  }

  handlePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    const digits  = pasted.replace(/\D/g, '').slice(0, CODE_LENGTH).split('');

    const newDigits = Array(CODE_LENGTH).fill('');
    digits.forEach((d, i) => { newDigits[i] = d; });
    this.digits.set(newDigits);

    // Foca no próximo campo vazio ou no último
    const nextEmpty = newDigits.findIndex(d => d === '');
    this.focusInput(nextEmpty === -1 ? CODE_LENGTH - 1 : nextEmpty);
  }

  handleFocus(index: number): void {
    // Seleciona o conteúdo ao focar
    setTimeout(() => {
      const input = this.otpInputs?.get(index)?.nativeElement;
      input?.select();
    });
  }

  /* ── Submit ─────────────────────────────────────────────── */
  async handleSubmit(): Promise<void> {
    if (!this.isCodeComplete()) return;

    this.hasError.set(false);
    this.authService.clearError();

    const ok = await this.authService.confirmEmail(this.fullCode());

    if (ok) {
      await this.router.navigate(['/dashboard']);
    } else {
      this.hasError.set(true);
      this.digits.set(Array(CODE_LENGTH).fill(''));
      setTimeout(() => this.focusInput(0));
    }
  }

  /* ── Resend ─────────────────────────────────────────────── */
  async handleResend(): Promise<void> {
    this.resendSuccess.set(false);
    await this.authService.resendCode();
    this.resendSuccess.set(true);
    this.startCooldown(60);

    setTimeout(() => this.resendSuccess.set(false), 4000);
  }

  private startCooldown(seconds: number): void {
    this.resendCooldown.set(seconds);
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);

    this.cooldownInterval = setInterval(() => {
      this.resendCooldown.update(v => {
        if (v <= 1) {
          clearInterval(this.cooldownInterval!);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  }

  /* ── Helpers ────────────────────────────────────────────── */
  private updateDigit(index: number, value: string): void {
    this.digits.update(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  private focusInput(index: number): void {
    setTimeout(() => {
      this.otpInputs?.get(index)?.nativeElement.focus();
    });
  }
}
