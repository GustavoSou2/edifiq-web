import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';

import { PageHeaderComponent }  from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ButtonComponent }      from '../../../../shared/components/button/button.component';
import { StatCardComponent }    from '../../../../shared/components/stat-card/stat-card.component';
import { ProposalStatus }       from '../../../../shared/types/domain.types';

interface MyProposal {
  id:           string;
  order_ref:    string;
  buyer_name:   string;
  delivery_city: string;
  total_price:  number;
  status:       ProposalStatus;
  submitted_at: string;
  expires_at?:  string;
}

const MOCK_MY_PROPOSALS: MyProposal[] = [
  { id: 'p1',  order_ref: '#EDQ-2024-0042', buyer_name: 'Construtora Alpha',    delivery_city: 'Indaiatuba', total_price: 4800,  status: 'submitted', submitted_at: '2024-01-15T10:00:00Z', expires_at: '2024-01-16T18:00:00Z' },
  { id: 'p2',  order_ref: '#EDQ-2024-0041', buyer_name: 'Obras Beta Ltda',      delivery_city: 'Campinas',   total_price: 2350,  status: 'accepted',  submitted_at: '2024-01-14T09:00:00Z' },
  { id: 'p3',  order_ref: '#EDQ-2024-0040', buyer_name: 'Engenharia Gama',      delivery_city: 'São Paulo',  total_price: 7100,  status: 'rejected',  submitted_at: '2024-01-13T08:00:00Z' },
  { id: 'p4',  order_ref: '#EDQ-2024-0039', buyer_name: 'Construtora Delta',    delivery_city: 'Sorocaba',   total_price: 3200,  status: 'submitted', submitted_at: '2024-01-12T07:00:00Z', expires_at: '2024-01-16T20:00:00Z' },
  { id: 'p5',  order_ref: '#EDQ-2024-0035', buyer_name: 'Obras Épsilon',        delivery_city: 'Santos',     total_price: 5600,  status: 'accepted',  submitted_at: '2024-01-10T06:00:00Z' },
  { id: 'p6',  order_ref: '#EDQ-2024-0030', buyer_name: 'Construtora Zeta',     delivery_city: 'Jundiaí',    total_price: 1900,  status: 'expired',   submitted_at: '2024-01-05T05:00:00Z' },
  { id: 'p7',  order_ref: '#EDQ-2024-0028', buyer_name: 'Engenharia Eta',       delivery_city: 'Bauru',      total_price: 8400,  status: 'withdrawn', submitted_at: '2024-01-03T04:00:00Z' },
  { id: 'p8',  order_ref: '#EDQ-2024-0025', buyer_name: 'Construtora Theta',    delivery_city: 'Campinas',   total_price: 3750,  status: 'accepted',  submitted_at: '2023-12-28T03:00:00Z' },
];

const STATUS_FILTERS: { value: ProposalStatus | 'all'; label: string }[] = [
  { value: 'all',       label: 'Todas' },
  { value: 'submitted', label: 'Enviadas' },
  { value: 'accepted',  label: 'Aceitas' },
  { value: 'rejected',  label: 'Recusadas' },
  { value: 'expired',   label: 'Expiradas' },
  { value: 'withdrawn', label: 'Retiradas' },
];

@Component({
  selector: 'edq-my-proposals-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CurrencyPipe, DatePipe, PageHeaderComponent, StatusBadgeComponent, ButtonComponent, StatCardComponent],
  template: `
    <edq-page-header
      title="Minhas Propostas"
      subtitle="Acompanhe todas as propostas que você enviou"
    />

    <!-- ── Resumo ──────────────────────────────────────────── -->
    <div class="stats-grid">
      <edq-stat-card icon="📤" label="Total Enviadas"  value="8"       />
      <edq-stat-card icon="✅" label="Aceitas"         value="3"  change="37.5%" trend="up"      />
      <edq-stat-card icon="❌" label="Recusadas"       value="1"  change="12.5%" trend="down"    />
      <edq-stat-card icon="⏳" label="Aguardando"      value="2"  change="em aberto" trend="neutral" />
    </div>

    <!-- ── Filtros ─────────────────────────────────────────── -->
    <div class="filters-bar">
      <div class="filter-tabs" role="tablist" aria-label="Filtrar por status">
        @for (f of statusFilters; track f.value) {
          <button
            class="filter-tab"
            role="tab"
            [class.filter-tab--active]="activeStatus() === f.value"
            [attr.aria-selected]="activeStatus() === f.value"
            (click)="activeStatus.set(f.value)"
          >
            {{ f.label }}
          </button>
        }
      </div>
    </div>

    <!-- ── Tabela ──────────────────────────────────────────── -->
    <div class="table-wrapper">
      <table class="data-table" aria-label="Minhas propostas">
        <thead>
          <tr>
            <th scope="col">Pedido</th>
            <th scope="col">Comprador</th>
            <th scope="col">Cidade</th>
            <th scope="col">Valor</th>
            <th scope="col">Status</th>
            <th scope="col">Enviada em</th>
            <th scope="col"><span class="sr-only">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          @for (p of filteredProposals(); track p.id) {
            <tr class="table-row">
              <td><span class="mono">{{ p.order_ref }}</span></td>
              <td class="buyer-name">{{ p.buyer_name }}</td>
              <td class="city-cell">📍 {{ p.delivery_city }}</td>
              <td>
                <span class="price" [class.price--accepted]="p.status === 'accepted'">
                  {{ p.total_price | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                </span>
              </td>
              <td><edq-status-badge [status]="p.status" /></td>
              <td class="date-cell">{{ p.submitted_at | date:'dd/MM/yyyy' }}</td>
              <td>
                <div class="row-actions">
                  <edq-button variant="ghost" size="sm" [routerLink]="[p.id]">Ver</edq-button>
                  @if (p.status === 'submitted') {
                    <edq-button variant="danger" size="sm">Retirar</edq-button>
                  }
                </div>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="7">
                <div class="table-empty">
                  <span>💬</span>
                  <p>Nenhuma proposta encontrada.</p>
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
  `,
  styleUrl: './my-proposals-list.component.scss',
})
export class MyProposalsListComponent {
  protected readonly statusFilters = STATUS_FILTERS;
  protected readonly activeStatus  = signal<ProposalStatus | 'all'>('all');

  protected readonly filteredProposals = computed(() => {
    const status = this.activeStatus();
    if (status === 'all') return MOCK_MY_PROPOSALS;
    return MOCK_MY_PROPOSALS.filter(p => p.status === status);
  });
}
