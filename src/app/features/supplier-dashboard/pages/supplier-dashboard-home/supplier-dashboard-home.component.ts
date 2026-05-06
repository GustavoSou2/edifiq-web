import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';

import { PageHeaderComponent }  from '../../../../shared/components/page-header/page-header.component';
import { StatCardComponent }    from '../../../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ButtonComponent }      from '../../../../shared/components/button/button.component';
import { ProposalStatus }       from '../../../../shared/types/domain.types';

interface RecentProposal {
  id:           string;
  order_ref:    string;
  buyer_name:   string;
  total_price:  number;
  status:       ProposalStatus;
  submitted_at: string;
}

interface UpcomingDelivery {
  id:           string;
  order_ref:    string;
  buyer_name:   string;
  address:      string;
  scheduled_at: string;
}

const MOCK_PROPOSALS: RecentProposal[] = [
  { id: 'p1', order_ref: '#EDQ-2024-0042', buyer_name: 'Construtora Alpha',  total_price: 4800,  status: 'submitted', submitted_at: '2024-01-15T10:00:00Z' },
  { id: 'p2', order_ref: '#EDQ-2024-0041', buyer_name: 'Obras Beta Ltda',    total_price: 2350,  status: 'accepted',  submitted_at: '2024-01-14T09:00:00Z' },
  { id: 'p3', order_ref: '#EDQ-2024-0040', buyer_name: 'Engenharia Gama',    total_price: 7100,  status: 'rejected',  submitted_at: '2024-01-13T08:00:00Z' },
  { id: 'p4', order_ref: '#EDQ-2024-0039', buyer_name: 'Construtora Delta',  total_price: 3200,  status: 'submitted', submitted_at: '2024-01-12T07:00:00Z' },
];

const MOCK_DELIVERIES: UpcomingDelivery[] = [
  { id: 'd1', order_ref: '#EDQ-2024-0041', buyer_name: 'Obras Beta Ltda',   address: 'Av. Paulista, 1000 — São Paulo, SP',   scheduled_at: '2024-01-18T08:00:00Z' },
  { id: 'd2', order_ref: '#EDQ-2024-0038', buyer_name: 'Construtora Épsilon', address: 'Rua das Flores, 200 — Campinas, SP', scheduled_at: '2024-01-19T10:00:00Z' },
];

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

    <!-- ── Stat Cards ──────────────────────────────────────── -->
    <div class="stats-grid">
      <edq-stat-card
        icon="🔍"
        label="Pedidos Disponíveis"
        value="8"
        change="+3 hoje"
        trend="up"
      />
      <edq-stat-card
        icon="💬"
        label="Propostas Enviadas"
        value="14"
        change="este mês"
        trend="neutral"
      />
      <edq-stat-card
        icon="✅"
        label="Propostas Aceitas"
        value="6"
        change="43% de conversão"
        trend="up"
      />
      <edq-stat-card
        icon="💰"
        label="Faturamento do Mês"
        value="R$ 28.400"
        change="+12% vs mês anterior"
        trend="up"
      />
    </div>

    <!-- ── Propostas Recentes ──────────────────────────────── -->
    <section class="dashboard-section">
      <div class="section-header">
        <h2 class="section-title">Propostas Recentes</h2>
        <edq-button variant="ghost" size="sm" routerLink="/app/my-proposals">
          Ver todas →
        </edq-button>
      </div>

      <div class="table-wrapper">
        <table class="data-table" aria-label="Propostas recentes">
          <thead>
            <tr>
              <th scope="col">Pedido</th>
              <th scope="col">Comprador</th>
              <th scope="col">Valor</th>
              <th scope="col">Status</th>
              <th scope="col">Enviada em</th>
              <th scope="col"><span class="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            @for (p of recentProposals(); track p.id) {
              <tr class="table-row">
                <td><span class="mono">{{ p.order_ref }}</span></td>
                <td class="buyer-name">{{ p.buyer_name }}</td>
                <td><span class="price">{{ p.total_price | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span></td>
                <td><edq-status-badge [status]="p.status" /></td>
                <td class="date-cell">{{ p.submitted_at | date:'dd/MM/yyyy' }}</td>
                <td>
                  <div class="row-actions">
                    <edq-button variant="ghost" size="sm" [routerLink]="['/app/my-proposals', p.id]">
                      Ver
                    </edq-button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>

    <!-- ── Próximas Entregas ───────────────────────────────── -->
    <section class="dashboard-section">
      <div class="section-header">
        <h2 class="section-title">Próximas Entregas</h2>
        <edq-button variant="ghost" size="sm" routerLink="/app/deliveries">
          Ver todas →
        </edq-button>
      </div>

      @if (upcomingDeliveries().length) {
        <div class="deliveries-list">
          @for (d of upcomingDeliveries(); track d.id) {
            <div class="delivery-card">
              <div class="delivery-card__icon" aria-hidden="true">🚛</div>
              <div class="delivery-card__body">
                <div class="delivery-card__ref">{{ d.order_ref }}</div>
                <div class="delivery-card__buyer">{{ d.buyer_name }}</div>
                <div class="delivery-card__address">📍 {{ d.address }}</div>
              </div>
              <div class="delivery-card__date">
                <span class="delivery-card__date-label">Agendado</span>
                <span class="delivery-card__date-value">{{ d.scheduled_at | date:'dd/MM · HH:mm' }}</span>
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

    <!-- ── Ação Rápida ─────────────────────────────────────── -->
    <section class="quick-action-banner">
      <div class="quick-action-banner__content">
        <span class="quick-action-banner__icon">🔍</span>
        <div>
          <p class="quick-action-banner__title">Há 8 pedidos disponíveis para você</p>
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
export class SupplierDashboardHomeComponent {
  protected readonly recentProposals   = signal(MOCK_PROPOSALS);
  protected readonly upcomingDeliveries = signal(MOCK_DELIVERIES);
}
