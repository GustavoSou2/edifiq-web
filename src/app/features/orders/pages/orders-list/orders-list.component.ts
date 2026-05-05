import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { Order, OrderStatus } from '../../../../shared/types/domain.types';
import { DatePipe } from '@angular/common';

const MOCK_ORDERS: Order[] = [
  { id: '1', reference_code: '#EDQ-2024-0042', status: 'in_auction', is_urgent: true,  delivery_city: 'Indaiatuba', delivery_state: 'SP', proposal_count: 3, created_at: '2024-01-15T10:00:00Z' } as any,
  { id: '2', reference_code: '#EDQ-2024-0041', status: 'open',       is_urgent: false, delivery_city: 'Campinas',   delivery_state: 'SP', proposal_count: 0, created_at: '2024-01-14T09:00:00Z' } as any,
  { id: '3', reference_code: '#EDQ-2024-0040', status: 'confirmed',  is_urgent: false, delivery_city: 'São Paulo',  delivery_state: 'SP', proposal_count: 5, created_at: '2024-01-13T08:00:00Z' } as any,
  { id: '4', reference_code: '#EDQ-2024-0039', status: 'selected',   is_urgent: true,  delivery_city: 'Sorocaba',   delivery_state: 'SP', proposal_count: 4, created_at: '2024-01-12T07:00:00Z' } as any,
  { id: '5', reference_code: '#EDQ-2024-0038', status: 'draft',      is_urgent: false, delivery_city: 'Jundiaí',    delivery_state: 'SP', proposal_count: 0, created_at: '2024-01-11T06:00:00Z' } as any,
  { id: '6', reference_code: '#EDQ-2024-0037', status: 'cancelled',  is_urgent: false, delivery_city: 'Bauru',      delivery_state: 'SP', proposal_count: 2, created_at: '2024-01-10T05:00:00Z' } as any,
];

const STATUS_FILTERS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all',        label: 'Todos' },
  { value: 'draft',      label: 'Rascunho' },
  { value: 'open',       label: 'Aberto' },
  { value: 'in_auction', label: 'Em Leilão' },
  { value: 'selected',   label: 'Selecionado' },
  { value: 'confirmed',  label: 'Confirmado' },
  { value: 'cancelled',  label: 'Cancelado' },
];

@Component({
  selector: 'edq-orders-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule, PageHeaderComponent, StatusBadgeComponent, ButtonComponent, InputComponent, DatePipe],
  template: `
    <edq-page-header title="Pedidos" subtitle="Gerencie todos os pedidos de materiais">
      <edq-button slot="actions" variant="secondary" size="sm">Exportar</edq-button>
      <edq-button slot="actions" variant="primary"   size="sm" routerLink="new">+ Novo Pedido</edq-button>
    </edq-page-header>

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

      <div class="filters-right">
        <edq-input
          type="search"
          placeholder="Buscar pedido..."
          size="sm"
          [(value)]="searchQuery"
        >
          <span slot="prefix">🔍</span>
        </edq-input>

        <label class="urgent-toggle">
          <input type="checkbox" [(ngModel)]="urgentOnly" />
          <span>Apenas urgentes</span>
        </label>
      </div>
    </div>

    <!-- Tabela -->
    <div class="table-wrapper">
      <table class="data-table" aria-label="Lista de pedidos">
        <thead>
          <tr>
            <th scope="col">Referência</th>
            <th scope="col">Status</th>
            <th scope="col">Cidade</th>
            <th scope="col">Propostas</th>
            <th scope="col">Criado em</th>
            <th scope="col"><span class="sr-only">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          @for (order of filteredOrders(); track order.id) {
            <tr class="table-row" [class.table-row--urgent]="order.is_urgent">
              <td>
                <div class="ref-cell">
                  <span class="ref-code">{{ order.reference_code }}</span>
                  @if (order.is_urgent) {
                    <span class="badge-urgent">URGENTE</span>
                  }
                </div>
              </td>
              <td><edq-status-badge [status]="order.status" /></td>
              <td class="city-cell">📍 {{ order.delivery_city }}, {{ order.delivery_state }}</td>
              <td>
                <span class="proposal-count" [class.proposal-count--zero]="!order.proposal_count">
                  {{ order.proposal_count ?? 0 }}
                </span>
              </td>
              <td class="date-cell">{{ order.created_at | date:'dd/MM/yyyy' }}</td>
              <td>
                <div class="row-actions">
                  <edq-button variant="ghost" size="sm" [routerLink]="[order.id]">
                    Ver
                  </edq-button>
                  @if (order.status === 'in_auction') {
                    <edq-button variant="primary" size="sm" [routerLink]="[order.id, 'proposals']">
                      Propostas
                    </edq-button>
                  }
                </div>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="6">
                <div class="table-empty">
                  <span>📦</span>
                  <p>Nenhum pedido encontrado.</p>
                  <edq-button variant="primary" size="sm" routerLink="new">Criar primeiro pedido</edq-button>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styleUrl: './orders-list.component.scss',
})
export class OrdersListComponent {
  protected readonly statusFilters = STATUS_FILTERS;
  protected readonly activeStatus  = signal<OrderStatus | 'all'>('all');
  protected searchQuery            = '';
  protected urgentOnly             = false;

  protected readonly filteredOrders = computed(() => {
    let list = MOCK_ORDERS;
    const status = this.activeStatus();
    if (status !== 'all') list = list.filter(o => o.status === status);
    if (this.urgentOnly)  list = list.filter(o => o.is_urgent);
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(o =>
        o.reference_code.toLowerCase().includes(q) ||
        o.delivery_city.toLowerCase().includes(q),
      );
    }
    return list;
  });
}
