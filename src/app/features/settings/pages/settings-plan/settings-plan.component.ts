import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

type PlanName = 'free' | 'starter' | 'pro' | 'enterprise';

interface PlanCard {
  name:     PlanName;
  label:    string;
  price:    string;
  users:    number;
  suppliers: number;
  orders:   number;
  features: string[];
  current:  boolean;
}

interface UsageItem {
  label:   string;
  used:    number;
  max:     number;
  unit:    string;
}

const PLANS: PlanCard[] = [
  {
    name: 'free', label: 'Free', price: 'Grátis',
    users: 3, suppliers: 20, orders: 50,
    features: ['Pedidos básicos', 'Suporte por email'],
    current: false,
  },
  {
    name: 'starter', label: 'Starter', price: 'R$ 299/mês',
    users: 10, suppliers: 100, orders: 200,
    features: ['Tudo do Free', 'Relatórios básicos', 'Suporte prioritário'],
    current: false,
  },
  {
    name: 'pro', label: 'Pro', price: 'R$ 799/mês',
    users: 30, suppliers: 500, orders: 1000,
    features: ['Tudo do Starter', 'Analytics avançado', 'API access', 'Webhooks'],
    current: true,
  },
  {
    name: 'enterprise', label: 'Enterprise', price: 'Sob consulta',
    users: 999, suppliers: 9999, orders: 99999,
    features: ['Tudo do Pro', 'SLA garantido', 'Suporte dedicado', 'SSO'],
    current: false,
  },
];

const USAGE: UsageItem[] = [
  { label: 'Usuários',          used: 12,  max: 30,   unit: 'usuários' },
  { label: 'Fornecedores',      used: 87,  max: 500,  unit: 'fornecedores' },
  { label: 'Pedidos este mês',  used: 342, max: 1000, unit: 'pedidos' },
];

@Component({
  selector: 'edq-settings-plan',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, PageHeaderComponent, ButtonComponent],
  template: `
    <edq-page-header title="Configurações" subtitle="Gerencie as configurações da sua conta" />

    <div class="settings-layout">
      <!-- Sidebar Nav -->
      <nav class="settings-nav" aria-label="Navegação de configurações">
        <a class="settings-nav__link" routerLink="../company"  routerLinkActive="settings-nav__link--active">Empresa</a>
        <a class="settings-nav__link" routerLink="../plan"     routerLinkActive="settings-nav__link--active">Plano & Assinatura</a>
        <a class="settings-nav__link" routerLink="../webhooks" routerLinkActive="settings-nav__link--active">Webhooks</a>
        <a class="settings-nav__link" routerLink="../audit"    routerLinkActive="settings-nav__link--active">Auditoria</a>
      </nav>

      <!-- Content -->
      <div class="settings-content">
        <!-- Current Plan -->
        <section class="settings-section">
          <h2 class="settings-section__title">Plano Atual — Pro</h2>
          <div class="usage-list">
            @for (item of usage; track item.label) {
              <div class="usage-item">
                <div class="usage-item__header">
                  <span class="usage-item__label">{{ item.label }}</span>
                  <span class="usage-item__count">{{ item.used }}/{{ item.max }} {{ item.unit }}</span>
                </div>
                <div class="usage-bar-track">
                  <div
                    class="usage-bar-fill"
                    [class.usage-bar-fill--warn]="pct(item) >= 80"
                    [style.width.%]="pct(item)"
                    role="progressbar"
                    [attr.aria-valuenow]="pct(item)"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
                <span class="usage-item__pct">{{ pct(item) }}% utilizado</span>
              </div>
            }
          </div>
        </section>

        <!-- Plan Comparison -->
        <section class="settings-section">
          <h2 class="settings-section__title">Comparativo de Planos</h2>
          <div class="plans-grid">
            @for (plan of plans; track plan.name) {
              <div class="plan-card" [class.plan-card--current]="plan.current">
                @if (plan.current) {
                  <span class="plan-current-badge">Plano Atual</span>
                }
                <h3 class="plan-card__name">{{ plan.label }}</h3>
                <p class="plan-card__price">{{ plan.price }}</p>
                <ul class="plan-card__limits">
                  <li>{{ plan.users === 999 ? 'Ilimitado' : plan.users }} usuários</li>
                  <li>{{ plan.suppliers === 9999 ? 'Ilimitado' : plan.suppliers }} fornecedores</li>
                  <li>{{ plan.orders === 99999 ? 'Ilimitado' : plan.orders }} pedidos/mês</li>
                </ul>
                <ul class="plan-card__features">
                  @for (feat of plan.features; track feat) {
                    <li>✓ {{ feat }}</li>
                  }
                </ul>
                <edq-button
                  [variant]="plan.current ? 'secondary' : 'primary'"
                  size="sm"
                  [disabled]="plan.current"
                  class="plan-card__btn"
                >
                  {{ plan.current ? 'Plano Atual' : 'Selecionar' }}
                </edq-button>
              </div>
            }
          </div>
        </section>
      </div>
    </div>
  `,
  styleUrl: './settings-plan.component.scss',
})
export class SettingsPlanComponent {
  protected readonly plans = PLANS;
  protected readonly usage = USAGE;

  protected pct(item: UsageItem): number {
    return Math.round((item.used / item.max) * 100);
  }
}
