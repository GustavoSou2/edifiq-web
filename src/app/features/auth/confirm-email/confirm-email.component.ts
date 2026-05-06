import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ButtonComponent } from '../../../shared/components/button/button.component';
import { AuthService }     from '../services/auth.service';
import { ToastService }    from '../../../shared/services/toast.service';

/**
 * ConfirmEmailComponent — tela informativa pós-cadastro.
 *
 * A conta já foi criada e o usuário já está logado.
 * Esta tela apenas informa que um link de verificação foi enviado
 * e oferece a opção de reenviar ou continuar sem verificar.
 *
 * Rota: /auth/confirm-email
 * Acessível também via banner no dashboard enquanto email_verified = false.
 */
@Component({
  selector: 'edq-confirm-email',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, RouterLink],
  template: `
    <div class="auth-card">

      <!-- Ícone animado -->
      <div class="email-sent-icon" aria-hidden="true">
        <div class="email-sent-icon__bg"></div>
        <svg class="email-sent-icon__svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
          <!-- Envelope body -->
          <rect x="4" y="10" width="40" height="28" rx="4"
            stroke="currentColor" stroke-width="2" fill="none"/>
          <!-- Envelope flap -->
          <path d="M4 14l20 14L44 14"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <!-- Linhas de velocidade (movimento) -->
          <line x1="0" y1="22" x2="6" y2="22"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
          <line x1="0" y1="28" x2="4" y2="28"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.25"/>
        </svg>
      </div>

      <!-- Header -->
      <div class="auth-card__header">
        <h2 class="auth-card__title">Verifique seu e-mail</h2>
        <p class="auth-card__subtitle">
          Enviamos um link de confirmação para<br>
          <strong>{{ email() }}</strong>
        </p>
      </div>

      <!-- Instruções -->
      <div class="instructions">
        <div class="instruction-step">
          <div class="instruction-step__num">1</div>
          <p>Abra o e-mail que enviamos para <strong>{{ email() }}</strong></p>
        </div>
        <div class="instruction-step">
          <div class="instruction-step__num">2</div>
          <p>Clique no botão <strong>"Confirmar e-mail"</strong> dentro do e-mail</p>
        </div>
        <div class="instruction-step">
          <div class="instruction-step__num">3</div>
          <p>Pronto — sua conta estará totalmente ativada</p>
        </div>
      </div>

      <!-- Status badge -->
      <div class="pending-badge" role="status">
        <span class="pending-badge__dot"></span>
        <span>Verificação pendente — você já pode usar a plataforma</span>
      </div>

      <!-- Ações -->
      <div class="confirm-actions">
        <!-- CTA principal: ir para o dashboard -->
        <edq-button
          variant="primary"
          size="lg"
          [fullWidth]="true"
          routerLink="/app/dashboard"
          (clicked)="goToDashboard()"
        >
          Ir para o Dashboard →
        </edq-button>

        <!-- Reenviar link -->
        <div class="resend-row">
          <span class="resend-row__text">Não recebeu o e-mail?</span>

          @if (resendCooldown() > 0) {
            <span class="resend-timer">Reenviar em {{ resendCooldown() }}s</span>
          } @else {
            <button
              type="button"
              class="resend-btn"
              [disabled]="authService.isLoading()"
              (click)="handleResend()"
            >
              @if (authService.isLoading()) {
                <svg class="resend-btn__spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              }
              Reenviar link
            </button>
          }
        </div>
      </div>

      <!-- Dica sobre spam -->
      <p class="spam-hint">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Não encontrou? Verifique a pasta de spam ou lixo eletrônico.
      </p>

      <!-- Voltar -->
      <p class="auth-card__footer">
        <a routerLink="/auth/login">← Voltar ao login</a>
      </p>

    </div>
  `,
  styleUrl: './confirm-email.component.scss',
})
export class ConfirmEmailComponent {
  protected readonly authService = inject(AuthService);
  private readonly router        = inject(Router);
  private readonly toast         = inject(ToastService);

  protected readonly resendCooldown = signal(0);
  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  protected readonly email = () =>
    this.authService.pendingEmail() ?? this.authService.user()?.email ?? 'seu e-mail';

  goToDashboard(): void {
    this.router.navigate(['/app/dashboard']);
  }

  async handleResend(): Promise<void> {
    const ok = await this.authService.resendVerificationLink();

    if (ok) {
      this.toast.success('Link reenviado!', {
        message: `Verifique a caixa de entrada de ${this.email()}.`,
      });
      this.startCooldown(60);
    } else {
      this.toast.error('Não foi possível reenviar.', {
        message: 'Tente novamente em alguns instantes.',
      });
    }
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
}
