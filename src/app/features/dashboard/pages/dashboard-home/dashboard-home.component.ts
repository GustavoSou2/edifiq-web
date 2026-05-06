import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { PageHeaderComponent }  from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ButtonComponent }      from '../../../../shared/components/button/button.component';
import { MapComponent, MapMarker } from '../../../../shared/components/map/map.component';
import { Order, OrderStatus, Proposal } from '../../../../shared/types/domain.types';
import { OrdersApiService }     from '../../../../core/services/api/orders-api.service';
import { ProposalsApiService }  from '../../../../core/services/api/proposals-api.service';

const STATUS_COLOR_MAP: Record<OrderStatus, string> = {
  draft:      '#9CA3AF',
  open:       '#2563EB',
  in_auction: '#DC2626',
  selected:   '#D97706',
  confirmed:  '#059669',
  cancelled:  '#DC2626',
  expired:    '#9CA3AF',
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
            <article class="ig-card" [class.ig-card--urgent]="order.isUrgent">

              <!-- ── Banner: mini-mapa da localização ─────────── -->
              <a class="ig-card__banner" [routerLink]="['/app/orders', order.id]" aria-label="Ver pedido {{ order.referenceCode }}">

                <!-- Mapa estático como "foto" do post -->
                <edq-map
                  [lat]="order.deliveryLat ?? -23.5505"
                  [lng]="order.deliveryLng ?? -46.6333"
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
                    tileStyle: 'positron_lite',
                    fitBounds: false,
                    markerColor: statusColor(order.status),
                    markerSize: 28,
                    markerTail: true,
                    borderRadius: '0'
                  }"
                />

                <!-- Overlay gradiente no topo -->
                <div class="ig-card__banner-overlay"></div>

                <!-- Badge de status flutuante (canto superior direito) -->
                <div class="ig-card__status-float">
                  <edq-status-badge [status]="order.status" />
                  @if (order.isUrgent) {
                    <span class="urgent-pill">🔥 URGENTE</span>
                  }
                </div>

                <!-- Localização flutuante (canto inferior esquerdo) -->
                <div class="ig-card__location-float">
                  <span class="location-pin">📍</span>
                  <div class="location-text">
                    <span class="location-city">{{ order.deliveryCity }}, {{ order.deliveryState }}</span>
                    <span class="location-address">{{ order.deliveryAddress }}</span>
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

                <!-- Status + timer visíveis apenas no mobile (os do banner ficam ocultos) -->
                <div class="ig-card__mobile-meta">
                  <edq-status-badge [status]="order.status" />
                  @if (order.isUrgent) {
                    <span class="badge-urgent-sm">URGENTE</span>
                  }
                  @if (order.status === 'in_auction') {
                    <span class="ig-card__timer-inline">⏱ Leilão ativo</span>
                  }
                </div>

                <!-- Localização visível apenas no mobile -->
                <div class="ig-card__mobile-location">
                  <span>📍</span>
                  <span>{{ order.deliveryCity }}, {{ order.deliveryState }}</span>
                </div>

                <!-- Linha do autor (como o perfil no Instagram) -->
                <div class="ig-card__author">
                  <div class="author-avatar" [style.background]="statusColor(order.status)">
                    {{ order.referenceCode?.slice(-2) }}
                  </div>
                  <div class="author-info">
                    <span class="author-name">{{ order.deliveryCity }}, {{ order.deliveryState }}</span>
                    <span class="author-time">{{ order.createdAt | date:'dd/MM/yyyy · HH:mm' }}</span>
                  </div>
                  <span class="ig-card__ref">{{ order.referenceCode }}</span>
                </div>

                <!-- Itens do pedido (como a legenda do post) -->
                <div class="ig-card__items">
                  @for (item of (order.items ?? []).slice(0, 3); track item.id) {
                    <span class="item-chip">
                      <span class="item-chip__qty">{{ item.quantity }} {{ item.unit }}</span>
                      {{ item.description }}
                    </span>
                  }
                  @if ((order.items?.length ?? 0) > 3) {
                    <span class="item-chip item-chip--more">+{{ (order.items?.length ?? 0) - 3 }} itens</span>
                  }
                </div>

                <!-- Rodapé: ações (como curtir/comentar/compartilhar) -->
                <div class="ig-card__actions">
                  <div class="ig-card__actions-left">
                    <!-- Propostas (como curtidas) -->
                    <button class="ig-action" [class.ig-action--active]="(order.proposalCount ?? 0) > 0">
                      <span class="ig-action__icon">💬</span>
                      <span class="ig-action__count">{{ order.proposalCount }}</span>
                      <span class="ig-action__label">proposta{{ order.proposalCount !== 1 ? 's' : '' }}</span>
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
          <edq-map [markers]="mapMarkers()" [height]="280" [config]="{ tileStyle: 'positron', markerSize: 22, markerTail: false, attribution: false }" />
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
                  {{ p.supplier?.companyName?.slice(0, 2)?.toUpperCase() ?? '??' }}
                </div>
                <div class="proposal-row__info">
                  <span class="proposal-row__name">{{ p.supplier?.companyName ?? 'Fornecedor' }}</span>
                  <span class="proposal-row__meta">
                    Pedido #{{ p.orderId.slice(-4) }} · {{ p.submittedAt | date:'dd/MM HH:mm' }}
                  </span>
                </div>
                <div class="proposal-row__right">
                  <span class="proposal-row__price">
                    {{ p.totalPrice | currency:'BRL':'symbol':'1.2-2' }}
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
export class DashboardHomeComponent implements OnInit {
  protected readonly activeFilter = signal<OrderStatus | 'all'>('all');

  private readonly ordersApi     = inject(OrdersApiService);
  private readonly proposalsApi  = inject(ProposalsApiService);

  protected readonly orders           = signal<Order[] >([]);
  protected readonly recentProposals  = signal<Proposal[]>([]);
  protected readonly isLoading        = signal(false);

  protected readonly feedFilters = [
    { value: 'all'        as const, label: 'Todos',       dot: 'gray'   },
    { value: 'in_auction' as const, label: 'Em Leilão',   dot: 'red'    },
    { value: 'open'       as const, label: 'Abertos',     dot: 'blue'   },
    { value: 'confirmed'  as const, label: 'Confirmados', dot: 'green'  },
  ];

  ngOnInit(): void {
    this.isLoading.set(true);
    this.ordersApi.list({ perPage: 20 }).subscribe({
      next:  res => { this.orders.set(res.data); this.isLoading.set(false); },
      error: ()  => this.isLoading.set(false),
    });
  }

  protected readonly filteredOrders = computed(() => {
    const f = this.activeFilter();
    if (f === 'all') return this.orders();
    return this.orders().filter(o => o.status === f);
  });

  protected readonly mapMarkers = computed<MapMarker[]>(() =>
    this.orders()
      .filter((o): o is Order & { deliveryLat: number; deliveryLng: number } =>
        o.deliveryLat != null && o.deliveryLng != null
      )
      .map(o => ({
        lat:   o.deliveryLat,
        lng:   o.deliveryLng,
        label: o.referenceCode ?? o.id,
        color: MAP_MARKER_COLOR[o.status],
        popup: `${o.deliveryCity ?? ''}, ${o.deliveryState ?? ''}`,
      }))
  );

  protected statusColor(status: OrderStatus): string {
    return STATUS_COLOR_MAP[status];
  }
}
