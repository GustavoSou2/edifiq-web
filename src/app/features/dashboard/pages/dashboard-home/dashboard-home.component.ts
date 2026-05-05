import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { PageHeaderComponent }  from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ButtonComponent }      from '../../../../shared/components/button/button.component';
import { MapComponent, MapMarker } from '../../../../shared/components/map/map.component';
import { OrderStatus, ProposalStatus } from '../../../../shared/types/domain.types';

export interface DashboardOrder {
  id:             string;
  reference_code: string;
  status:         OrderStatus;
  is_urgent:      boolean;
  delivery_city:  string;
  delivery_state: string;
  delivery_address: string;
  proposal_count: number;
  created_at:     string;
  lat:            number;
  lng:            number;
  items_summary:  string;
  items:          { description: string; quantity: string; unit: string }[];
  buyer_name:     string;
  buyer_initials: string;
  auction_ends_at?: string;
}

interface DashboardProposal {
  id:           string;
  order_id:     string;
  status:       ProposalStatus;
  total_price:  number;
  supplierName: string;
  submitted_at: string;
}

const STATUS_COLOR_MAP: Record<OrderStatus, string> = {
  draft:      '#A8ABBE',
  open:       '#0086C0',
  in_auction: '#E2445C',
  selected:   '#FFCB00',
  confirmed:  '#00C875',
  cancelled:  '#E2445C',
  expired:    '#A8ABBE',
};

const MAP_MARKER_COLOR: Record<OrderStatus, MapMarker['color']> = {
  draft:      'blue',
  open:       'blue',
  in_auction: 'red',
  selected:   'yellow',
  confirmed:  'green',
  cancelled:  'red',
  expired:    'blue',
};

@Component({
  selector: 'edq-dashboard-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent, StatusBadgeComponent, ButtonComponent,
    RouterLink, CurrencyPipe, DatePipe,
    MapComponent,
  ],
  template: `
    <edq-page-header title="Dashboard" subtitle="Visão geral da operação">
      <edq-button slot="actions" variant="primary" size="sm" routerLink="/app/orders/new">
        + Novo Pedido
      </edq-button>
    </edq-page-header>

    <!-- ── Stats pills ──────────────────────────────────────── -->
    <div class="stats-row">
      <div class="stat-pill">
        <span class="stat-pill__dot dot-purple"></span>
        <span class="stat-pill__value">12</span>
        <span class="stat-pill__label">Pedidos abertos</span>
      </div>
      <div class="stat-pill">
        <span class="stat-pill__dot dot-red"></span>
        <span class="stat-pill__value">4</span>
        <span class="stat-pill__label">Em leilão</span>
      </div>
      <div class="stat-pill">
        <span class="stat-pill__dot dot-green"></span>
        <span class="stat-pill__value">38</span>
        <span class="stat-pill__label">Propostas recebidas</span>
      </div>
      <div class="stat-pill">
        <span class="stat-pill__dot dot-yellow"></span>
        <span class="stat-pill__value">R$ 8.420</span>
        <span class="stat-pill__label">Economia gerada</span>
      </div>
      <div class="stat-pill">
        <span class="stat-pill__dot dot-teal"></span>
        <span class="stat-pill__value">7</span>
        <span class="stat-pill__label">Entregas pendentes</span>
      </div>
    </div>

    <!-- ── Layout principal ─────────────────────────────────── -->
    <div class="dash-grid">

      <!-- ── Feed Instagram ──────────────────────────────────── -->
      <section class="feed-panel">

        <!-- Header + filtros -->
        <div class="feed-header">
          <h2 class="panel-title">Feed de Pedidos</h2>
          <div class="feed-filters">
            @for (f of feedFilters; track f.value) {
              <button
                class="feed-filter"
                [class.feed-filter--active]="activeFilter() === f.value"
                (click)="activeFilter.set(f.value)"
              >
                <span class="feed-filter__dot" [class]="'dot-' + f.dot"></span>
                {{ f.label }}
              </button>
            }
          </div>
        </div>

        <!-- Cards grid estilo Instagram -->
        <div class="ig-feed">
          @for (order of filteredOrders(); track order.id) {
            <article class="ig-card" [class.ig-card--urgent]="order.is_urgent">

              <!-- ── Banner: mini-mapa da localização ─────────── -->
              <a class="ig-card__banner" [routerLink]="['/app/orders', order.id]" aria-label="Ver pedido {{ order.reference_code }}">

                <!-- Mapa estático como "foto" do post -->
                <edq-map
                  [lat]="order.lat"
                  [lng]="order.lng"
                  [height]="200"
                  [zoom]="13"
                  [config]="{
                    dragging: false,
                    scrollWheelZoom: false,
                    doubleClickZoom: false,
                    touchZoom: false,
                    keyboard: false,
                    zoomControl: false,
                    attribution: false,
                    fitBounds: false,
                    markerColor: statusColor(order.status),
                    markerSize: 26,
                    markerTail: true,
                    borderRadius: '0'
                  }"
                />

                <!-- Overlay gradiente no topo -->
                <div class="ig-card__banner-overlay"></div>

                <!-- Badge de status flutuante (canto superior direito) -->
                <div class="ig-card__status-float">
                  <edq-status-badge [status]="order.status" />
                  @if (order.is_urgent) {
                    <span class="urgent-pill">🔥 URGENTE</span>
                  }
                </div>

                <!-- Localização flutuante (canto inferior esquerdo) -->
                <div class="ig-card__location-float">
                  <span class="location-pin">📍</span>
                  <div class="location-text">
                    <span class="location-city">{{ order.delivery_city }}, {{ order.delivery_state }}</span>
                    <span class="location-address">{{ order.delivery_address }}</span>
                  </div>
                </div>

                <!-- Timer de leilão (se in_auction) -->
                @if (order.status === 'in_auction') {
                  <div class="ig-card__timer">
                    <span class="timer-icon">⏱</span>
                    <span class="timer-label">Leilão ativo</span>
                  </div>
                }

              </a>

              <!-- ── Corpo do card (abaixo do banner) ──────────── -->
              <div class="ig-card__body">

                <!-- Linha do autor (como o perfil no Instagram) -->
                <div class="ig-card__author">
                  <div class="author-avatar" [style.background]="statusColor(order.status)">
                    {{ order.buyer_initials }}
                  </div>
                  <div class="author-info">
                    <span class="author-name">{{ order.buyer_name }}</span>
                    <span class="author-time">{{ order.created_at | date:'dd/MM/yyyy · HH:mm' }}</span>
                  </div>
                  <span class="ig-card__ref">{{ order.reference_code }}</span>
                </div>

                <!-- Itens do pedido (como a legenda do post) -->
                <div class="ig-card__items">
                  @for (item of order.items.slice(0, 3); track item.description) {
                    <span class="item-chip">
                      <span class="item-chip__qty">{{ item.quantity }}{{ item.unit }}</span>
                      {{ item.description }}
                    </span>
                  }
                  @if (order.items.length > 3) {
                    <span class="item-chip item-chip--more">+{{ order.items.length - 3 }} itens</span>
                  }
                </div>

                <!-- Rodapé: ações (como curtir/comentar/compartilhar) -->
                <div class="ig-card__actions">
                  <div class="ig-card__actions-left">
                    <!-- Propostas (como curtidas) -->
                    <button class="ig-action" [class.ig-action--active]="order.proposal_count > 0">
                      <span class="ig-action__icon">💬</span>
                      <span class="ig-action__count">{{ order.proposal_count }}</span>
                      <span class="ig-action__label">proposta{{ order.proposal_count !== 1 ? 's' : '' }}</span>
                    </button>
                  </div>

                  <a
                    class="ig-card__cta"
                    [routerLink]="['/app/orders', order.id]"
                    [class.ig-card__cta--auction]="order.status === 'in_auction'"
                  >
                    @if (order.status === 'in_auction') {
                      Ver propostas →
                    } @else if (order.status === 'open') {
                      Aguardando →
                    } @else {
                      Ver detalhes →
                    }
                  </a>
                </div>

              </div>
            </article>
          } @empty {
            <div class="feed-empty">
              <span>📦</span>
              <p>Nenhum pedido neste filtro.</p>
              <edq-button variant="primary" size="sm" routerLink="/app/orders/new">
                Criar pedido
              </edq-button>
            </div>
          }
        </div>

        <a class="feed-see-all" routerLink="/app/orders">Ver todos os pedidos →</a>
      </section>

      <!-- ── Painel lateral ──────────────────────────────────── -->
      <aside class="side-panel">

        <!-- Mapa geral -->
        <div class="mn-card map-card">
          <div class="panel-header">
            <h2 class="panel-title">Mapa de Pedidos</h2>
            <span class="map-legend">
              <span class="legend-dot dot-red"></span> Leilão
              <span class="legend-dot dot-green"></span> Confirmado
              <span class="legend-dot dot-blue"></span> Aberto
            </span>
          </div>
          <edq-map [markers]="mapMarkers()" [height]="280" />
        </div>

        <!-- Propostas recentes -->
        <div class="mn-card proposals-card">
          <div class="panel-header">
            <h2 class="panel-title">Propostas Recentes</h2>
            <a class="panel-link" routerLink="/app/orders">Ver todas →</a>
          </div>

          <div class="proposals-list">
            @for (p of recentProposals(); track p.id) {
              <div class="proposal-row">
                <div class="proposal-row__avatar">
                  {{ p.supplierName.slice(0, 2).toUpperCase() }}
                </div>
                <div class="proposal-row__info">
                  <span class="proposal-row__name">{{ p.supplierName }}</span>
                  <span class="proposal-row__meta">
                    Pedido #{{ p.order_id.slice(-4) }} · {{ p.submitted_at | date:'dd/MM HH:mm' }}
                  </span>
                </div>
                <div class="proposal-row__right">
                  <span class="proposal-row__price">
                    {{ p.total_price | currency:'BRL':'symbol':'1.2-2' }}
                  </span>
                  <edq-status-badge [status]="p.status" />
                </div>
              </div>
            }
          </div>
        </div>

      </aside>
    </div>
  `,
  styleUrl: './dashboard-home.component.scss',
})
export class DashboardHomeComponent {
  protected readonly activeFilter = signal<OrderStatus | 'all'>('all');

  protected readonly feedFilters = [
    { value: 'all'        as const, label: 'Todos',       dot: 'gray'   },
    { value: 'in_auction' as const, label: 'Em Leilão',   dot: 'red'    },
    { value: 'open'       as const, label: 'Abertos',     dot: 'blue'   },
    { value: 'confirmed'  as const, label: 'Confirmados', dot: 'green'  },
  ];

  protected readonly allOrders = signal<DashboardOrder[]>([
    {
      id: '1', reference_code: '#EDQ-0042',
      status: 'in_auction', is_urgent: true,
      delivery_city: 'Indaiatuba', delivery_state: 'SP',
      delivery_address: 'Av. Eng. Fábio Roberto Barnabé, 3950',
      proposal_count: 3,
      created_at: '2024-01-15T10:00:00Z',
      lat: -23.0896, lng: -47.2189,
      items_summary: '20 sacos cimento CP-II, 5m³ areia, 500 blocos',
      items: [
        { description: 'Cimento CP-II 50kg', quantity: '20', unit: ' sacos' },
        { description: 'Areia média lavada',  quantity: '5',  unit: 'm³' },
        { description: 'Bloco cerâmico 9x19', quantity: '500', unit: ' un' },
      ],
      buyer_name: 'João Melo', buyer_initials: 'JM',
    },
    {
      id: '2', reference_code: '#EDQ-0041',
      status: 'open', is_urgent: false,
      delivery_city: 'Campinas', delivery_state: 'SP',
      delivery_address: 'R. Irmã Serafina, 1010 — Cambuí',
      proposal_count: 0,
      created_at: '2024-01-14T09:00:00Z',
      lat: -22.9056, lng: -47.0608,
      items_summary: '100m² piso cerâmico, argamassa',
      items: [
        { description: 'Piso cerâmico 60x60', quantity: '100', unit: 'm²' },
        { description: 'Argamassa AC-II',      quantity: '20',  unit: ' sacos' },
      ],
      buyer_name: 'Ana Souza', buyer_initials: 'AS',
    },
    {
      id: '3', reference_code: '#EDQ-0040',
      status: 'confirmed', is_urgent: false,
      delivery_city: 'São Paulo', delivery_state: 'SP',
      delivery_address: 'R. Augusta, 2345 — Consolação',
      proposal_count: 5,
      created_at: '2024-01-13T08:00:00Z',
      lat: -23.5505, lng: -46.6333,
      items_summary: 'Ferragens estruturais, 50kg vergalhão',
      items: [
        { description: 'Vergalhão CA-50 10mm', quantity: '50',  unit: 'kg' },
        { description: 'Arame recozido',        quantity: '5',   unit: 'kg' },
        { description: 'Espaçador plástico',    quantity: '200', unit: ' un' },
      ],
      buyer_name: 'Carlos Lima', buyer_initials: 'CL',
    },
    {
      id: '4', reference_code: '#EDQ-0039',
      status: 'selected', is_urgent: true,
      delivery_city: 'Sorocaba', delivery_state: 'SP',
      delivery_address: 'Av. Itavuvu, 11777 — Jd. Vera Cruz',
      proposal_count: 4,
      created_at: '2024-01-12T07:00:00Z',
      lat: -23.5015, lng: -47.4526,
      items_summary: 'Tintas, massa corrida, 20L solvente',
      items: [
        { description: 'Tinta acrílica branca', quantity: '18', unit: 'L' },
        { description: 'Massa corrida PVA',      quantity: '4',  unit: ' galões' },
        { description: 'Solvente universal',     quantity: '20', unit: 'L' },
      ],
      buyer_name: 'Ricardo Alves', buyer_initials: 'RA',
    },
    {
      id: '5', reference_code: '#EDQ-0038',
      status: 'open', is_urgent: false,
      delivery_city: 'Ribeirão Preto', delivery_state: 'SP',
      delivery_address: 'Av. Presidente Vargas, 3201',
      proposal_count: 1,
      created_at: '2024-01-11T06:00:00Z',
      lat: -21.1775, lng: -47.8103,
      items_summary: 'Tubos PVC 100mm, conexões hidráulicas',
      items: [
        { description: 'Tubo PVC 100mm 6m', quantity: '20', unit: ' barras' },
        { description: 'Joelho 90° PVC',    quantity: '15', unit: ' un' },
        { description: 'Luva simples PVC',  quantity: '10', unit: ' un' },
      ],
      buyer_name: 'Fernanda Costa', buyer_initials: 'FC',
    },
    {
      id: '6', reference_code: '#EDQ-0037',
      status: 'in_auction', is_urgent: false,
      delivery_city: 'Santos', delivery_state: 'SP',
      delivery_address: 'Av. Ana Costa, 555 — Vila Mathias',
      proposal_count: 2,
      created_at: '2024-01-10T05:00:00Z',
      lat: -23.9608, lng: -46.3336,
      items_summary: 'Madeira pinus 3x3, compensado 18mm',
      items: [
        { description: 'Madeira pinus 3x3 3m', quantity: '50', unit: ' peças' },
        { description: 'Compensado 18mm',       quantity: '10', unit: ' chapas' },
      ],
      buyer_name: 'Marcos Vieira', buyer_initials: 'MV',
    },
  ]);

  protected readonly filteredOrders = computed(() => {
    const f = this.activeFilter();
    if (f === 'all') return this.allOrders();
    return this.allOrders().filter(o => o.status === f);
  });

  protected readonly mapMarkers = computed<MapMarker[]>(() =>
    this.allOrders().map(o => ({
      lat:   o.lat,
      lng:   o.lng,
      label: o.reference_code,
      color: MAP_MARKER_COLOR[o.status],
      popup: `${o.delivery_city}, ${o.delivery_state}<br>${o.items_summary}`,
    }))
  );

  protected readonly recentProposals = signal<DashboardProposal[]>([
    { id: 'p1', order_id: '0042', status: 'submitted', total_price: 1250.00, supplierName: 'Depósito Central Ltda', submitted_at: '2024-01-15T10:30:00Z' },
    { id: 'p2', order_id: '0042', status: 'submitted', total_price: 1380.00, supplierName: 'Materiais São Paulo',   submitted_at: '2024-01-15T10:45:00Z' },
    { id: 'p3', order_id: '0041', status: 'accepted',  total_price: 890.50,  supplierName: 'Construfácil',          submitted_at: '2024-01-14T11:00:00Z' },
  ]);

  /** Retorna a cor hex do status para o marcador do mapa */
  protected statusColor(status: OrderStatus): string {
    return STATUS_COLOR_MAP[status];
  }
}
