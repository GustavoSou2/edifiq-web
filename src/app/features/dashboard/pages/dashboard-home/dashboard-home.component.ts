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
import { OrderSummary, OrderStatus, Proposal } from '../../../../shared/types/domain.types';
import { OrdersApiService }     from '../../../../core/services/api/orders-api.service';
import { toSlug } from 'src/app/core/functions/to-slug';

const STATUS_COLOR_MAP: Record<OrderStatus, string> = {
  draft:      '#9CA3AF',
  open:       '#2563EB',
  in_auction: '#DC2626',
  selected:   '#D97706',
  confirmed:  '#059669',
  cancelled:  '#DC2626',
  expired:    '#9CA3AF',
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
            <article class="ig-card">

              <!-- ── Banner ───────────────────────────────────── -->
              <a class="ig-card__banner" [routerLink]="['/app/orders', order.id]" [attr.aria-label]="'Ver pedido ' + (order.title ?? order.id)">
                <div class="ig-card__banner-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                </div>
                <div class="ig-card__status-float">
                  <edq-status-badge [status]="order.status" />
                </div>
              </a>

              <!-- ── Corpo ─────────────────────────────────────── -->
              <div class="ig-card__body">
                <div class="ig-card__author">
                  <div class="author-avatar" [style.background]="statusColor(order.status)">
                    {{ (order.title ?? order.id).slice(0, 2).toUpperCase() }}
                  </div>
                  <div class="author-info">
                    <span class="author-name">{{ order.title ?? order.id }}</span>
                    <span class="author-time">{{ order.createdAt | date:'dd/MM/yyyy · HH:mm' }}</span>
                  </div>
                </div>

                <div class="ig-card__items">
                  @if (order.deliveryCity) {
                    <span class="item-chip">
                      <span class="item-chip__qty">📍</span>
                      {{ order.deliveryCity }}, {{ order.deliveryState }}
                    </span>
                  }
                  @if (order.referenceCode) {
                    <span class="item-chip">
                      <span class="item-chip__qty">#</span>
                      {{ order.referenceCode }}
                    </span>
                  }
                  @if (order.isUrgent) {
                    <span class="item-chip item-chip--urgent">🔥 Urgente</span>
                  }
                </div>

                <div class="ig-card__actions">
                  <div class="ig-card__actions-left"></div>
                  <a class="ig-card__cta" [routerLink]="['/app/orders', order.id]">
                    Ver detalhes →
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
                <div class="proposal-row__avatar">??</div>
                <div class="proposal-row__info">
                  <span class="proposal-row__name">Fornecedor</span>
                  <span class="proposal-row__meta">
                    Dist. #{{ p.distributionId.slice(-4) }}
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

  private readonly ordersApi = inject(OrdersApiService);

  protected readonly orders          = signal<OrderSummary[]>([]);
  protected readonly recentProposals = signal<Proposal[]>([]);
  protected readonly isLoading       = signal(false);

  protected readonly feedFilters = [
    { value: 'all'        as const, label: 'Todos',       dot: 'gray'   },
    { value: 'in_auction' as const, label: 'Em Leilão',   dot: 'red'    },
    { value: 'open'       as const, label: 'Abertos',     dot: 'blue'   },
    { value: 'confirmed'  as const, label: 'Confirmados', dot: 'green'  },
  ];

  ngOnInit(): void {
    this.isLoading.set(true);
    this.ordersApi.list({ perPage: 20 }).subscribe({
      next:  (res: any) => { this.orders.set(res); this.isLoading.set(false); },
      error: ()  => this.isLoading.set(false),
    });
  }

  protected readonly filteredOrders = computed(() => {
    const f = this.activeFilter();
    if (f === 'all') return this.orders();
    return this.orders().filter(o => o.status === f);
  });

  protected readonly mapMarkers = computed<MapMarker[]>(() => []);

  protected statusColor(status: OrderStatus): string {
    return STATUS_COLOR_MAP[status];
  }

  toSlugOrderTitle = (title: string): string => toSlug(title);
}
