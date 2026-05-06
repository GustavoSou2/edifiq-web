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
import { MapComponent }         from '../../../../shared/components/map/map.component';
import { MapConfig }            from '../../../../shared/components/map/map.types';
import { OrderStatus }          from '../../../../shared/types/domain.types';

type DetailTab = 'items' | 'proposals' | 'distribution' | 'history';

const BANNER_MAP_CONFIG: MapConfig = {
  zoomControl:     true,
  dragging:        true,
  scrollWheelZoom: false,
  doubleClickZoom: true,
  touchZoom:       true,
  keyboard:        false,
  attribution:     false,
  tileStyle:       'positron',
  fitBounds:       false,
  markerSize:      34,
  markerTail:      true,
  borderRadius:    '0',
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
        [lat]="order().deliveryLat ?? -23.5505"
        [lng]="order().deliveryLng ?? -46.6333"
        [height]="400"
        [zoom]="15"
        [config]="bannerConfig()"
        [ariaLabel]="'Localização da obra — ' + order().deliveryAddress"
      />

      <div class="map-banner__overlay">
        <div class="map-banner__info">
          <div class="map-banner__location">
            <span class="map-banner__pin">📍</span>
            <div>
              <span class="map-banner__city">{{ order().deliveryCity }}, {{ order().deliveryState }}</span>
              <span class="map-banner__address">{{ order().deliveryAddress }}</span>
            </div>
          </div>
          <div class="map-banner__badges">
            <edq-status-badge [status]="order().status" />
            @if (order().isUrgent) {
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
        [title]="order().referenceCode ?? order().id"
        [subtitle]="'Criado em ' + order().createdAt"
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
          @if (order().isUrgent) {
            <span class="badge-urgent">URGENTE</span>
          } @else {
            <span class="info-card__value">Normal</span>
          }
        </div>
        <div class="info-card">
          <span class="info-card__label">Cidade</span>
          <span class="info-card__value">{{ order().deliveryCity }}, {{ order().deliveryState }}</span>
        </div>
        <div class="info-card">
          <span class="info-card__label">Duração do Leilão</span>
          <span class="info-card__value">{{ order().auctionDurationMin }} min</span>
        </div>
        <div class="info-card">
          <span class="info-card__label">Propostas</span>
          <span class="info-card__value info-card__value--highlight">
            {{ order().proposalCount ?? 0 }} recebida{{ (order().proposalCount ?? 0) !== 1 ? 's' : '' }}
          </span>
        </div>
        <div class="info-card">
          <span class="info-card__label">Fornecedores</span>
          <span class="info-card__value">Até {{ order().maxSuppliers }}</span>
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
                  @for (item of order().items ?? []; track item.id; let i = $index) {
                    <tr>
                      <td class="mono">{{ i + 1 }}</td>
                      <td>{{ item.description }}</td>
                      <td><span class="category-chip">{{ item.category?.name ?? '—' }}</span></td>
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
              <p>{{ order().proposalCount ?? 0 }} propostas recebidas.</p>
              <a routerLink="proposals" class="tab-link">Ver comparativo completo →</a>
            </div>
          }

          @case ('distribution') {
            <div class="tab-placeholder">
              <span class="tab-placeholder__icon">📡</span>
              <p>Fornecedores notificados para este pedido.</p>
            </div>
          }

          @case ('history') {
            <div class="tab-placeholder">
              <span class="tab-placeholder__icon">🕐</span>
              <p>Histórico de eventos do pedido.</p>
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
    { id: 'items',        label: 'Itens' },
    { id: 'proposals',    label: 'Propostas' },
    { id: 'distribution', label: 'Fornecedores Convidados' },
    { id: 'history',      label: 'Histórico' },
  ];

  /* TODO: substituir por OrdersApiService.findById(this.id()) */
  protected readonly order = signal({
    id:                 '1',
    referenceCode:      '#EDQ-2024-0042' as string | null,
    status:             'in_auction' as OrderStatus,
    isUrgent:           true,
    deliveryCity:       'Indaiatuba' as string | null,
    deliveryState:      'SP' as string | null,
    deliveryAddress:    'Av. Eng. Fábio Roberto Barnabé, 3950 — Jardim Morada do Sol',
    deliveryLat:        -23.0896 as number | null,
    deliveryLng:        -47.2189 as number | null,
    auctionDurationMin: 60,
    maxSuppliers:       5,
    proposalCount:      3 as number | undefined,
    createdAt:          '2024-01-15T10:00:00Z',
    items:              [] as { id: string; description: string; category?: { name: string } | null; quantity: number; unit: string }[],
  });

  protected readonly bannerConfig = computed<MapConfig>(() => ({
    ...BANNER_MAP_CONFIG,
    markerColor: STATUS_COLOR_MAP[this.order().status],
  }));
}
