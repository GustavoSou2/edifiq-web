import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * AuthLayoutComponent — shell split-screen para todas as telas de auth.
 * Lado esquerdo: painel visual com branding.
 * Lado direito: formulário (RouterOutlet).
 */
@Component({
  selector: 'edq-auth-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `
    <div class="auth-shell">

      <!-- ── Painel esquerdo — branding ─────────────────── -->
      <aside class="auth-panel">
        <div class="auth-panel__inner">

          <!-- Logo -->
          <div class="auth-panel__logo">
            <div class="logo-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="8" fill="white" fill-opacity="0.15"/>
                <path d="M7 14C7 10.134 10.134 7 14 7C17.866 7 21 10.134 21 14C21 17.866 17.866 21 14 21C10.134 21 7 17.866 7 14Z" stroke="white" stroke-width="2"/>
                <path d="M14 10V14L17 16" stroke="white" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <span class="logo-name">Edifiq</span>
          </div>

          <!-- Headline -->
          <div class="auth-panel__headline">
            <h1>Materiais certos,<br>no tempo certo.</h1>
            <p>
              Leilão reverso inteligente para construção civil.
              Receba propostas de fornecedores em minutos.
            </p>
          </div>

          <!-- Stats -->
          <div class="auth-panel__stats">
            <div class="stat">
              <span class="stat__value">+2.400</span>
              <span class="stat__label">Fornecedores ativos</span>
            </div>
            <div class="stat">
              <span class="stat__value">98%</span>
              <span class="stat__label">Taxa de resposta</span>
            </div>
            <div class="stat">
              <span class="stat__value">4min</span>
              <span class="stat__label">Tempo médio de proposta</span>
            </div>
          </div>

          <!-- Floating cards decorativos -->
          <div class="auth-panel__cards" aria-hidden="true">
            <div class="deco-card deco-card--1">
              <div class="deco-card__icon">🏗️</div>
              <div class="deco-card__text">
                <strong>Pedido #EDQ-0042</strong>
                <span>3 propostas recebidas</span>
              </div>
            </div>
            <div class="deco-card deco-card--2">
              <div class="deco-card__icon">⚡</div>
              <div class="deco-card__text">
                <strong>Proposta aceita</strong>
                <span>R$ 1.250,00 · 2h entrega</span>
              </div>
            </div>
          </div>

        </div>
      </aside>

      <!-- ── Painel direito — formulário ────────────────── -->
      <main class="auth-form-area">
        <div class="auth-form-area__inner">
          <router-outlet />
        </div>
      </main>

    </div>
  `,
  styleUrl: './auth-layout.component.scss',
})
export class AuthLayoutComponent {}
