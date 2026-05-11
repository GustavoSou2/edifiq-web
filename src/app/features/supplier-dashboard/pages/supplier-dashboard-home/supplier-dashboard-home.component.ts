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
import { OrdersApiService }     from '../../../../core/services/api/orders-api.service';

@Component({
  selector: 'edq-supplier-dashboard-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, CurrencyPipe, DatePipe,
    PageHeaderComponent, StatCardComponent, StatusBadgeComponent, ButtonComponent,
  ],
  template: `
    <edq-page-header
      title="Dashboard do Fornecedor"
      subtitle="Visão geral das suas propostas e entregas"
    />

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
                <th scope="col">Enviada em</th>
                <th scope="col"><span class="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              @for (p of proposals().slice(0, 5); track p.id) {
                <tr class="table-row">
                  <td><span class="mono">{{ p.distributionId }}</span></td>
                  <td><span class="price">{{ p.totalPrice | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span></td>
                  <td><edq-status-badge [status]="p.status" /></td>
                  <td class="date-cell">—</td>
                  <td>
                    <edq-button variant="ghost" size="sm" [routerLink]="['/app/my-proposals', p.id]">Ver</edq-button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5"><div class="table-empty"><span>💬</span><p>Nenhuma proposta ainda.</p></div></td></tr>
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
                <div class="delivery-card__supplier">—</div>
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
            {{ availableOrdersCount() }} pedido{{ availableOrdersCount() !== 1 ? 's' : '' }} disponível{{ availableOrdersCount() !== 1 ? 'is' : '' }} para você
          </p>
          <p class="quick-action-banner__sub">Envie propostas e aumente seu faturamento</p>
        </div>
      </div>
      <edq-button variant="primary" size="sm" routerLink="/app/available-orders">
        Ver Pedidos Disponíveis
      </edq-button>
    </section>
  `,
  styleUrl: './supplier-dashboard-home.component.scss',
})
export class SupplierDashboardHomeComponent implements OnInit {
  private readonly proposalsApi  = inject(ProposalsApiService);
  private readonly deliveriesApi = inject(DeliveriesApiService);
  private readonly ordersApi     = inject(OrdersApiService);

  protected readonly proposals         = signal<Proposal[]>([]);
  protected readonly allDeliveries     = signal<Delivery[]>([]);
  protected readonly proposalsLoading  = signal(false);
  protected readonly deliveriesLoading = signal(false);
  protected readonly availableOrdersCount = signal(0);

  protected readonly acceptedCount = signal(0);
  protected readonly conversionRate = signal('');
  protected readonly pendingDeliveries = signal<Delivery[]>([]);

  ngOnInit(): void {
    this.loadProposals();
    this.loadDeliveries();
    this.loadAvailableOrders();
  }

  private loadProposals(): void {
    this.proposalsLoading.set(true);
    this.proposalsApi.listByOrder('me').subscribe({
      next: res => {
        this.proposals.set(res.data);
        const accepted = res.data.filter(p => p.status === 'submitted').length;
        this.acceptedCount.set(accepted);
        const rate = res.data.length ? Math.round((accepted / res.data.length) * 100) : 0;
        this.conversionRate.set(`${rate}% de conversão`);
        this.proposalsLoading.set(false);
      },
      error: () => this.proposalsLoading.set(false),
    });
  }

  private loadDeliveries(): void {
    this.deliveriesLoading.set(true);
    this.deliveriesApi.list({ status: 'scheduled' }).subscribe({
      next: res => {
        this.allDeliveries.set(res.data);
        this.pendingDeliveries.set(res.data.filter(d => d.status === 'scheduled' || d.status === 'in_transit'));
        this.deliveriesLoading.set(false);
      },
      error: () => this.deliveriesLoading.set(false),
    });
  }

  private loadAvailableOrders(): void {
    this.ordersApi.list({ status: 'open' }).subscribe({
      next: res => this.availableOrdersCount.set(res.total),
      error: () => {},
    });
  }
}
