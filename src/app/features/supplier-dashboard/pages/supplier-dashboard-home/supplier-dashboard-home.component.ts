import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';

import { PageHeaderComponent }  from '../../../../shared/components/page-header/page-header.component';
import { StatCardComponent }    from '../../../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ButtonComponent }      from '../../../../shared/components/button/button.component';
import { Proposal, Delivery }   from '../../../../shared/types/domain.types';
import { ProposalsApiService }  from '../../../../core/services/api/proposals-api.service';
import { DeliveriesApiService } from '../../../../core/services/api/deliveries-api.service';
import { RolePanelService }     from '../../../../core/services/role-panel.service';
import { SupplierProfile }      from '../../../../core/services/api/supplier-profile-api.service';
import { SupplierOnboardingModalComponent } from '../../components/supplier-onboarding-modal/supplier-onboarding-modal.component';

@Component({
  selector: 'edq-supplier-dashboard-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, CurrencyPipe, DatePipe,
    PageHeaderComponent, StatCardComponent, StatusBadgeComponent, ButtonComponent,
    SupplierOnboardingModalComponent,
  ],
  template: `
    <!-- Modal de onboarding — exibido quando o tenant ainda não tem perfil de fornecedor -->
    @if (rolePanel.needsOnboarding()) {
      <edq-supplier-onboarding-modal
        (completed)="onOnboardingComplete($event)"
        (dismissed)="onOnboardingDismissed()"
      />
    }

    <edq-page-header
      title="Dashboard do Fornecedor"
      [subtitle]="rolePanel.supplierProfile()
        ? 'Bem-vindo, ' + rolePanel.supplierProfile()!.companyName
        : 'Visão geral das suas propostas e entregas'"
    />

    <!-- Banner de perfil incompleto (após dispensar o modal) -->
    @if (onboardingDismissed() && !rolePanel.supplierProfile()) {
      <div class="onboarding-banner" role="alert">
        <span>⚠️</span>
        <div>
          <strong>Seu perfil de fornecedor não está ativo.</strong>
          <span>Você não aparecerá para compradores até ativar seu perfil.</span>
        </div>
        <button class="onboarding-banner__btn" type="button" (click)="showOnboarding()">
          Ativar agora
        </button>
      </div>
    }

    <div class="stats-grid">
      <edq-stat-card
        icon="🔍"
        label="Pedidos Disponíveis"
        [value]="availableOrdersCount().toString()"
        trend="neutral"
      />
      <edq-stat-card
        icon="💬"
        label="Propostas Enviadas"
        [value]="proposals().length.toString()"
        trend="neutral"
      />
      <edq-stat-card
        icon="✅"
        label="Propostas Aceitas"
        [value]="acceptedCount().toString()"
        [change]="conversionRate()"
        trend="up"
      />
      <edq-stat-card
        icon="🚚"
        label="Entregas Pendentes"
        [value]="pendingDeliveries().length.toString()"
        trend="neutral"
      />
    </div>

    <!-- Perfil de fornecedor resumido -->
    @if (rolePanel.supplierProfile()) {
      <div class="profile-card">
        <div class="profile-card__info">
          <span class="profile-card__icon" aria-hidden="true">🏭</span>
          <div>
            <p class="profile-card__name">{{ rolePanel.supplierProfile()!.companyName }}</p>
            <p class="profile-card__meta">
              📍 {{ rolePanel.supplierProfile()!.city }}, {{ rolePanel.supplierProfile()!.state }}
              &nbsp;·&nbsp;
              🚚 Raio: {{ rolePanel.supplierProfile()!.maxDeliveryKm }} km
              &nbsp;·&nbsp;
              ★ {{ rolePanel.supplierProfile()!.reputationScore.toFixed(1) }}
            </p>
          </div>
        </div>
        <edq-button variant="ghost" size="sm" routerLink="/app/supplier-profile">
          Editar perfil
        </edq-button>
      </div>
    }

    <!-- Propostas Recentes -->
    <section class="dashboard-section">
      <div class="section-header">
        <h2 class="section-title">Propostas Recentes</h2>
        <edq-button variant="ghost" size="sm" routerLink="/app/my-proposals">Ver todas →</edq-button>
      </div>

      @if (proposalsLoading()) {
        <div class="table-loading">Carregando propostas...</div>
      } @else {
        <div class="table-wrapper">
          <table class="data-table" aria-label="Propostas recentes">
            <thead>
              <tr>
                <th scope="col">Pedido</th>
                <th scope="col">Valor</th>
                <th scope="col">Status</th>
                <th scope="col"><span class="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              @for (p of proposals().slice(0, 5); track p.id) {
                <tr class="table-row">
                  <td><span class="mono">{{ p.distributionId }}</span></td>
                  <td><span class="price">{{ p.totalPrice | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span></td>
                  <td><edq-status-badge [status]="p.status" /></td>
                  <td>
                    <edq-button variant="ghost" size="sm" [routerLink]="['/app/my-proposals', p.id]">Ver</edq-button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4">
                    <div class="table-empty">
                      <span>💬</span>
                      <p>Nenhuma proposta ainda.</p>
                      <edq-button variant="primary" size="sm" routerLink="/app/available-orders">
                        Ver pedidos disponíveis
                      </edq-button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>

    <!-- Próximas Entregas -->
    <section class="dashboard-section">
      <div class="section-header">
        <h2 class="section-title">Próximas Entregas</h2>
        <edq-button variant="ghost" size="sm" routerLink="/app/deliveries">Ver todas →</edq-button>
      </div>

      @if (deliveriesLoading()) {
        <div class="table-loading">Carregando entregas...</div>
      } @else if (pendingDeliveries().length) {
        <div class="deliveries-list">
          @for (d of pendingDeliveries(); track d.id) {
            <div class="delivery-card">
              <div class="delivery-card__icon" aria-hidden="true">🚛</div>
              <div class="delivery-card__body">
                <div class="delivery-card__ref">{{ d.selectionId ?? d.id }}</div>
              </div>
              <div class="delivery-card__date">
                <span class="delivery-card__date-label">Agendado</span>
                <span class="delivery-card__date-value">{{ d.scheduledAt | date:'dd/MM · HH:mm' }}</span>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="empty-state">
          <span>📦</span>
          <p>Nenhuma entrega agendada.</p>
        </div>
      }
    </section>

    <section class="quick-action-banner">
      <div class="quick-action-banner__content">
        <span class="quick-action-banner__icon">🔍</span>
        <div>
          <p class="quick-action-banner__title">
            {{ availableOrdersCount() }} pedido{{ availableOrdersCount() !== 1 ? 's' : '' }}
            disponível{{ availableOrdersCount() !== 1 ? 'is' : '' }} para você
          </p>
          <p class="quick-action-banner__sub">Envie propostas e aumente seu faturamento</p>
        </div>
      </div>
      <edq-button variant="primary" size="sm" routerLink="/app/available-orders">
        Ver Pedidos Disponíveis
      </edq-button>
    </section>
  `,
  styles: [`
    .onboarding-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      background: #fffbeb;
      border: 1px solid #fcd34d;
      border-radius: 10px;
      margin-bottom: 20px;
      font-size: 13px;
      color: #92400e;
    }
    .onboarding-banner strong { display: block; font-weight: 600; }
    .onboarding-banner__btn {
      margin-left: auto;
      padding: 6px 14px;
      background: #d97706;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }
    .onboarding-banner__btn:hover { background: #b45309; }

    .profile-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 16px 20px;
      background: var(--surface, #fff);
      border: 1px solid var(--border, #e5e7eb);
      border-radius: 12px;
      margin-bottom: 24px;
    }
    .profile-card__info { display: flex; align-items: center; gap: 12px; }
    .profile-card__icon { font-size: 28px; }
    .profile-card__name { font-size: 15px; font-weight: 600; color: var(--text-primary, #111827); margin: 0 0 2px; }
    .profile-card__meta { font-size: 12px; color: var(--text-secondary, #6b7280); margin: 0; }
  `],
  styleUrl: './supplier-dashboard-home.component.scss',
})
export class SupplierDashboardHomeComponent implements OnInit {
  private readonly proposalsApi  = inject(ProposalsApiService);
  private readonly deliveriesApi = inject(DeliveriesApiService);
  protected readonly rolePanel   = inject(RolePanelService);

  protected readonly proposals            = signal<Proposal[]>([]);
  protected readonly allDeliveries        = signal<Delivery[]>([]);
  protected readonly proposalsLoading     = signal(false);
  protected readonly deliveriesLoading    = signal(false);
  protected readonly availableOrdersCount = signal(0);
  protected readonly acceptedCount        = signal(0);
  protected readonly conversionRate       = signal('');
  protected readonly pendingDeliveries    = signal<Delivery[]>([]);
  protected readonly onboardingDismissed  = signal(false);

  ngOnInit(): void {
    // Verifica se o tenant já tem perfil de fornecedor
    this.rolePanel.loadSupplierProfile();
    this.loadProposals();
    this.loadDeliveries();
    this.loadAvailableOrders();
  }

  protected onOnboardingComplete(profile: SupplierProfile): void {
    this.rolePanel.onboardingComplete(profile);
    this.onboardingDismissed.set(false);
  }

  protected onOnboardingDismissed(): void {
    this.rolePanel.needsOnboarding.set(false);
    this.onboardingDismissed.set(true);
  }

  protected showOnboarding(): void {
    this.onboardingDismissed.set(false);
    this.rolePanel.needsOnboarding.set(true);
  }

  private loadProposals(): void {
    this.proposalsLoading.set(true);
    this.proposalsApi.listReceived().subscribe({
      next: dists => {
        const proposals = dists.filter(d => d.proposal).map(d => d.proposal!) as any[];
        this.proposals.set(proposals);
        const accepted = proposals.filter((p: any) => p.status === 'submitted').length;
        this.acceptedCount.set(accepted);
        const rate = proposals.length ? Math.round((accepted / proposals.length) * 100) : 0;
        this.conversionRate.set(`${rate}% de conversão`);
        this.proposalsLoading.set(false);
      },
      error: () => this.proposalsLoading.set(false),
    });
  }

  private loadDeliveries(): void {
    this.deliveriesLoading.set(true);
    this.deliveriesApi.list({ status: 'scheduled' }).subscribe({
      next: deliveries => {
        this.allDeliveries.set(deliveries);
        this.pendingDeliveries.set(
          deliveries.filter(d => d.status === 'scheduled' || d.status === 'in_transit')
        );
        this.deliveriesLoading.set(false);
      },
      error: () => this.deliveriesLoading.set(false),
    });
  }

  private loadAvailableOrders(): void {
    this.proposalsApi.listReceived().subscribe({
      next: dists => this.availableOrdersCount.set(dists.length),
      error: () => {},
    });
  }
}
