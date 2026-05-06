import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageHeaderComponent }  from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ButtonComponent }      from '../../../../shared/components/button/button.component';
import { MapComponent, MapMarker } from '../../../../shared/components/map/map.component';
import { MapConfig } from '../../../../shared/components/map/map.types';
import { OrderStatus } from '../../../../shared/types/domain.types';

type DetailTab = 'items' | 'proposals' | 'distribution' | 'history';

/* Configuração do banner de mapa — interativo mas sem controles excessivos */
const BANNER_MAP_CONFIG: MapConfig = {
  zoomControl:      true,
  dragging:         true,
  scrollWheelZoom:  false,   /* evita scroll acidental na página */
  doubleClickZoom:  true,
  touchZoom:        true,
  keyboard:         false,
  attribution:      false,
  tileStyle:        'positron',
  fitBounds:        false,
  markerSize:       34,
  markerTail:       true,
  borderRadius:     '0',
};

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
  selector: 'edq-order-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeaderComponent, StatusBadgeComponent, ButtonComponent, MapComponent],
  template: `
    <!-- ── Banner de mapa ─────────────────────────────────── -->
    <div class="map-banner">
      <edq-map
        [lat]="order().lat"
        [lng]="order().lng"
        [height]="400"
        [zoom]="15"
        [config]="bannerConfig()"
        ariaLabel="Localização da obra — {{ order().delivery_address }}"
      />

      <!-- Overlay com informações sobre o banner -->
      <div class="map-banner__overlay">
        <div class="map-banner__info">
          <div class="map-banner__location">
            <span class="map-banner__pin">📍</span>
            <div>
              <span class="map-banner__city">{{ order().delivery_city }}, {{ order().delivery_state }}</span>
              <span class="map-banner__address">{{ order().delivery_address }}</span>
            </div>
          </div>
          <div class="map-banner__badges">
            <edq-status-badge [status]="order().status" />
            @if (order().is_urgent) {
              <span class="urgent-pill">🔥 URGENTE</span>
            }
            @if (order().status === 'in_auction') {
              <span class="auction-live-pill">⏱ Leilão ativo</span>
            }
          </div>
        </div>
      </div>
    </div>

    <!-- ── Page header ────────────────────────────────────── -->
    <div class="detail-content">
      <edq-page-header
        [title]="order().reference_code"
        [subtitle]="'Criado em ' + order().created_at + ' por ' + order().buyer_name"
      >
        <edq-button slot="actions" variant="secondary" size="sm" routerLink="../">
          ← Voltar
        </edq-button>
        @if (order().status === 'in_auction' || order().status === 'open') {
          <edq-button slot="actions" variant="primary" size="sm" routerLink="proposals">
            Ver Propostas
          </edq-button>
        }
      </edq-page-header>

      <!-- ── Info cards ─────────────────────────────────────── -->
      <div class="order-info-grid">
        <div class="info-card">
          <span class="info-card__label">Status</span>
          <edq-status-badge [status]="order().status" />
        </div>
        <div class="info-card">
          <span class="info-card__label">Urgência</span>
          @if (order().is_urgent) {
            <span class="badge-urgent">URGENTE</span>
          } @else {
            <span class="info-card__value">Normal</span>
          }
        </div>
        <div class="info-card">
          <span class="info-card__label">Cidade</span>
          <span class="info-card__value">{{ order().delivery_city }}, {{ order().delivery_state }}</span>
        </div>
        <div class="info-card">
          <span class="info-card__label">Duração do Leilão</span>
          <span class="info-card__value">{{ order().auction_duration_min }} min</span>
        </div>
        <div class="info-card">
          <span class="info-card__label">Propostas</span>
          <span class="info-card__value info-card__value--highlight">
            {{ order().proposal_count }} recebida{{ order().proposal_count !== 1 ? 's' : '' }}
          </span>
        </div>
        <div class="info-card">
          <span class="info-card__label">Fornecedores</span>
          <span class="info-card__value">Até {{ order().max_suppliers }}</span>
        </div>
      </div>

      <!-- ── Tabs ───────────────────────────────────────────── -->
      <div class="tabs" role="tablist" aria-label="Seções do pedido">
        @for (tab of tabs; track tab.id) {
          <button
            class="tab"
            role="tab"
            [class.tab--active]="activeTab() === tab.id"
            [attr.aria-selected]="activeTab() === tab.id"
            [attr.aria-controls]="'tab-panel-' + tab.id"
            (click)="activeTab.set(tab.id)"
          >
            {{ tab.label }}
            @if (tab.count) {
              <span class="tab__count">{{ tab.count }}</span>
            }
          </button>
        }
      </div>

      <!-- ── Tab content ────────────────────────────────────── -->
      <div class="tab-content" role="tabpanel">
        @switch (activeTab()) {

          @case ('items') {
            <div class="items-table-wrapper">
              <table class="data-table" aria-label="Itens do pedido">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Descrição</th>
                    <th scope="col">Categoria</th>
                    <th scope="col">Qtd</th>
                    <th scope="col">Unidade</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of order().items; track item.description; let i = $index) {
                    <tr>
                      <td class="mono">{{ i + 1 }}</td>
                      <td>{{ item.description }}</td>
                      <td><span class="category-chip">{{ item.category }}</span></td>
                      <td class="mono">{{ item.quantity }}</td>
                      <td class="mono">{{ item.unit }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          @case ('proposals') {
            <div class="tab-placeholder">
              <span class="tab-placeholder__icon">💬</span>
              <p>{{ order().proposal_count }} propostas recebidas.</p>
              <a routerLink="proposals" class="tab-link">Ver comparativo completo →</a>
            </div>
          }

          @case ('distribution') {
            <div class="tab-placeholder">
              <span class="tab-placeholder__icon">📡</span>
              <p>{{ order().notified_suppliers }} fornecedores notificados.</p>
            </div>
          }

          @case ('history') {
            <div class="history-timeline">
              @for (event of order().history; track event.time) {
                <div class="timeline-item">
                  <div class="timeline-dot" [class.timeline-dot--primary]="$first"></div>
                  <div class="timeline-content">
                    <span class="timeline-action">{{ event.action }}</span>
                    <span class="timeline-time">{{ event.time }}</span>
                  </div>
                </div>
              }
            </div>
          }

        }
      </div>
    </div>
  `,
  styleUrl: './order-detail.component.scss',
})
export class OrderDetailComponent {
  readonly id = input<string>('');

  protected readonly activeTab = signal<DetailTab>('items');

  protected readonly tabs: { id: DetailTab; label: string; count?: number }[] = [
    { id: 'items',        label: 'Itens',                   count: 3 },
    { id: 'proposals',    label: 'Propostas',               count: 3 },
    { id: 'distribution', label: 'Fornecedores Convidados', count: 5 },
    { id: 'history',      label: 'Histórico' },
  ];

  /* Mock — substituir por service call usando this.id() */
  protected readonly order = signal({
    reference_code:       '#EDQ-2024-0042',
    status:               'in_auction' as OrderStatus,
    is_urgent:            true,
    delivery_city:        'Indaiatuba',
    delivery_state:       'SP',
    delivery_address:     'Av. Eng. Fábio Roberto Barnabé, 3950 — Jardim Morada do Sol',
    auction_duration_min: 60,
    max_suppliers:        5,
    proposal_count:       3,
    notified_suppliers:   5,
    created_at:           '15/01/2024 às 10:00',
    buyer_name:           'João Melo',
    lat:                  -23.0896,
    lng:                  -47.2189,
    items: [
      { description: 'Saco de Cimento CP-II 50kg', category: 'Cimento',   quantity: '20',  unit: 'saco' },
      { description: 'Areia média lavada',          category: 'Agregados', quantity: '5',   unit: 'm³'   },
      { description: 'Bloco cerâmico 9x19x19',      category: 'Alvenaria', quantity: '500', unit: 'un'   },
    ],
    history: [
      { action: 'Leilão iniciado',           time: '15/01/2024 10:00' },
      { action: 'Pedido publicado',          time: '15/01/2024 09:55' },
      { action: 'Pedido criado por João Melo', time: '15/01/2024 09:50' },
    ],
  });

  /** Config do banner: interativo mas sem scroll-zoom para não atrapalhar a página */
  protected readonly bannerConfig = computed<MapConfig>(() => ({
    ...BANNER_MAP_CONFIG,
    markerColor: STATUS_COLOR_MAP[this.order().status],
  }));
}
