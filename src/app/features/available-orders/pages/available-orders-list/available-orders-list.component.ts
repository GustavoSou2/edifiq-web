import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PageHeaderComponent }  from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ButtonComponent }      from '../../../../shared/components/button/button.component';
import { InputComponent }       from '../../../../shared/components/input/input.component';
import { OrderStatus }          from '../../../../shared/types/domain.types';

interface AvailableOrder {
  id:             string;
  reference_code: string;
  status:         OrderStatus;
  is_urgent:      boolean;
  delivery_city:  string;
  delivery_state: string;
  items_summary:  string;
  proposal_count: number;
  auction_ends_at?: string;
  created_at:     string;
}

const MOCK_AVAILABLE_ORDERS: AvailableOrder[] = [
  {
    id: '1', reference_code: '#EDQ-2024-0042', status: 'in_auction', is_urgent: true,
    delivery_city: 'Indaiatuba', delivery_state: 'SP',
    items_summary: 'Cimento CP-II (50 sacos), Areia média (10m³)',
    proposal_count: 3, auction_ends_at: '2024-01-16T18:00:00Z', created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2', reference_code: '#EDQ-2024-0041', status: 'open', is_urgent: false,
    delivery_city: 'Campinas', delivery_state: 'SP',
    items_summary: 'Tijolos 8 furos (2000 un), Argamassa (20 sacos)',
    proposal_count: 0, created_at: '2024-01-14T09:00:00Z',
  },
  {
    id: '3', reference_code: '#EDQ-2024-0040', status: 'open', is_urgent: false,
    delivery_city: 'São Paulo', delivery_state: 'SP',
    items_summary: 'Vergalhão CA-50 (500 kg), Arame recozido (10 kg)',
    proposal_count: 1, created_at: '2024-01-13T08:00:00Z',
  },
  {
    id: '4', reference_code: '#EDQ-2024-0039', status: 'in_auction', is_urgent: true,
    delivery_city: 'Sorocaba', delivery_state: 'SP',
    items_summary: 'Telha cerâmica (500 un), Cumeeira (20 un)',
    proposal_count: 5, auction_ends_at: '2024-01-16T20:00:00Z', created_at: '2024-01-12T07:00:00Z',
  },
  {
    id: '5', reference_code: '#EDQ-2024-0038', status: 'open', is_urgent: false,
    delivery_city: 'Jundiaí', delivery_state: 'SP',
    items_summary: 'Tinta acrílica branca (50 L), Massa corrida (20 kg)',
    proposal_count: 2, created_at: '2024-01-11T06:00:00Z',
  },
  {
    id: '6', reference_code: '#EDQ-2024-0037', status: 'open', is_urgent: false,
    delivery_city: 'Bauru', delivery_state: 'SP',
    items_summary: 'Piso cerâmico 60x60 (80 m²), Rejunte (10 kg)',
    proposal_count: 0, created_at: '2024-01-10T05:00:00Z',
  },
  {
    id: '7', reference_code: '#EDQ-2024-0036', status: 'in_auction', is_urgent: false,
    delivery_city: 'Ribeirão Preto', delivery_state: 'SP',
    items_summary: 'Porta de madeira (5 un), Dobradiças (15 un)',
    proposal_count: 2, auction_ends_at: '2024-01-17T12:00:00Z', created_at: '2024-01-09T04:00:00Z',
  },
  {
    id: '8', reference_code: '#EDQ-2024-0035', status: 'open', is_urgent: true,
    delivery_city: 'Santos', delivery_state: 'SP',
    items_summary: 'Impermeabilizante (20 L), Manta asfáltica (50 m²)',
    proposal_count: 1, created_at: '2024-01-08T03:00:00Z',
  },
];

const STATUS_FILTERS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all',        label: 'Todos' },
  { value: 'open',       label: 'Aberto' },
  { value: 'in_auction', label: 'Em Leilão' },
];

@Component({
  selector: 'edq-available-orders-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, FormsModule, PageHeaderComponent, StatusBadgeComponent, ButtonComponent, InputComponent],
  template: `
    <edq-page-header
      title="Pedidos Disponíveis"
      subtitle="Pedidos abertos para envio de propostas"
    />

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

      <div class="filters-right">
        <edq-input
          type="search"
          placeholder="Buscar pedido ou cidade..."
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

    <!-- ── Contador ────────────────────────────────────────── -->
    <p class="results-count">
      {{ filteredOrders().length }} pedido{{ filteredOrders().length !== 1 ? 's' : '' }} encontrado{{ filteredOrders().length !== 1 ? 's' : '' }}
    </p>

    <!-- ── Cards de Pedidos ────────────────────────────────── -->
    <div class="orders-grid">
      @for (order of filteredOrders(); track order.id) {
        <div class="order-card" [class.order-card--urgent]="order.is_urgent">

          <!-- Header -->
          <div class="order-card__header">
            <div class="order-card__ref-row">
              <span class="order-card__ref">{{ order.reference_code }}</span>
              @if (order.is_urgent) {
                <span class="badge-urgent">URGENTE</span>
              }
            </div>
            <edq-status-badge [status]="order.status" />
          </div>

          <!-- Itens -->
          <p class="order-card__items">{{ order.items_summary }}</p>

          <!-- Localização -->
          <div class="order-card__location">
            <span>📍</span>
            <span>{{ order.delivery_city }}, {{ order.delivery_state }}</span>
          </div>

          <!-- Leilão countdown -->
          @if (order.auction_ends_at) {
            <div class="order-card__auction">
              <span class="order-card__auction-icon">⏱️</span>
              <span>Leilão encerra em {{ order.auction_ends_at | date:'dd/MM · HH:mm' }}</span>
            </div>
          }

          <!-- Footer -->
          <div class="order-card__footer">
            <span class="order-card__proposals">
              {{ order.proposal_count }} proposta{{ order.proposal_count !== 1 ? 's' : '' }}
            </span>
            <edq-button variant="primary" size="sm" [routerLink]="[order.id]">
              Enviar Proposta
            </edq-button>
          </div>
        </div>
      } @empty {
        <div class="empty-state">
          <span>🔍</span>
          <p>Nenhum pedido disponível no momento.</p>
          <span class="empty-state__hint">Novos pedidos aparecem aqui assim que forem publicados.</span>
        </div>
      }
    </div>
  `,
  styleUrl: './available-orders-list.component.scss',
})
export class AvailableOrdersListComponent {
  protected readonly statusFilters = STATUS_FILTERS;
  protected readonly activeStatus  = signal<OrderStatus | 'all'>('all');
  protected searchQuery            = '';
  protected urgentOnly             = false;

  protected readonly filteredOrders = computed(() => {
    let list = MOCK_AVAILABLE_ORDERS;
    const status = this.activeStatus();
    if (status !== 'all') list = list.filter(o => o.status === status);
    if (this.urgentOnly)  list = list.filter(o => o.is_urgent);
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(o =>
        o.reference_code.toLowerCase().includes(q) ||
        o.delivery_city.toLowerCase().includes(q)  ||
        o.items_summary.toLowerCase().includes(q),
      );
    }
    return list;
  });
}
