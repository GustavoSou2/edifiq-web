import {
  ChangeDetectionStrategy, Component, OnInit,
  inject, signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';

import { PageHeaderComponent }  from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ButtonComponent }      from '../../../../shared/components/button/button.component';
import { MapComponent, MapConfig } from '../../../../shared/components/map/map.component';
import { MapMarker }            from '../../../../shared/components/map/map.types';
import { DeliveriesApiService, DeliveryDetail, UpdateDeliveryStatusPayload } from '../../../../core/services/api/deliveries-api.service';
import { RolePanelService }     from '../../../../core/services/role-panel.service';
import { ToastService }         from '../../../../shared/services/toast.service';
import { RoutingService }       from '../../../../shared/services/routing.service';

interface TimelineStep {
  key:       string;
  label:     string;
  datetime:  string | null;
  completed: boolean;
  current:   boolean;
  icon:      'check' | 'truck' | 'circle' | 'flag';
}

@Component({
  selector: 'edq-delivery-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CurrencyPipe, DatePipe, PageHeaderComponent, StatusBadgeComponent, ButtonComponent, MapComponent],
  template: `
    @if (isLoading()) {
      <div class="page-loading">Carregando entrega...</div>
    } @else if (error()) {
      <div class="page-error" role="alert">{{ error() }}</div>
    } @else if (delivery()) {

      <edq-page-header
        [title]="delivery()!.orderReferenceCode ?? delivery()!.orderTitle ?? 'Entrega'"
        subtitle="Acompanhe o status desta entrega"
      >
        <edq-button slot="actions" variant="secondary" size="sm" routerLink="../">← Voltar</edq-button>
      </edq-page-header>

      <!-- ── KPI cards ─────────────────────────────────────── -->
      <div class="kpi-row">
        <div class="kpi-card">
          <span class="kpi-card__label">Status</span>
          <edq-status-badge [status]="$any(delivery()!.status)" />
        </div>
        <div class="kpi-card">
          <span class="kpi-card__label">Fornecedor</span>
          <span class="kpi-card__val">{{ delivery()!.supplierName ?? '—' }}</span>
          @if (delivery()!.supplierCity) {
            <span class="kpi-card__sub">📍 {{ delivery()!.supplierCity }}@if (delivery()!.supplierState) {, {{ delivery()!.supplierState }}}</span>
          }
        </div>
        <div class="kpi-card">
          <span class="kpi-card__label">Valor da Proposta</span>
          <span class="kpi-card__val kpi-card__val--price">
            {{ delivery()!.proposalTotalPrice | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
          </span>
        </div>
        <div class="kpi-card">
          <span class="kpi-card__label">Prazo acordado</span>
          <span class="kpi-card__val">
            @if (delivery()!.proposalDeliveryEtaHours) { {{ delivery()!.proposalDeliveryEtaHours }}h }
            @else if (delivery()!.proposalProposedDeliveryAt) { {{ delivery()!.proposalProposedDeliveryAt | date:'dd/MM HH:mm' }} }
            @else { — }
          </span>
        </div>
        @if (delivery()!.trackingCode) {
          <div class="kpi-card">
            <span class="kpi-card__label">Rastreamento</span>
            <span class="kpi-card__val mono">{{ delivery()!.trackingCode }}</span>
          </div>
        }
      </div>

      <!-- ── Layout: timeline + mapa ───────────────────────── -->
      <div class="tracking-layout">

        <!-- Timeline -->
        <section class="timeline-panel">
          <h2 class="panel-title">Linha do Tempo</h2>

          <div class="timeline">
            @for (step of timelineSteps(); track step.key; let last = $last) {
              <div class="tl-item"
                [class.tl-item--done]="step.completed && !step.current"
                [class.tl-item--current]="step.current"
                [class.tl-item--pending]="!step.completed && !step.current"
              >
                <div class="tl-icon-col">
                  <div class="tl-icon">
                    @if (step.icon === 'check') {
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 13l4 4L19 7"/></svg>
                    } @else if (step.icon === 'truck') {
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                    } @else if (step.icon === 'flag') {
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                    } @else {
                      <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true"><circle cx="4" cy="4" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
                    }
                  </div>
                  @if (!last) { <div class="tl-line"></div> }
                </div>
                <div class="tl-content">
                  <span class="tl-label">{{ step.label }}</span>
                  @if (step.datetime) {
                    <span class="tl-date">{{ step.datetime | date:'dd/MM/yyyy HH:mm' }}</span>
                  } @else {
                    <span class="tl-date tl-date--pending">Aguardando</span>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Endereços -->
          <div class="route-addresses">
            <div class="route-addr">
              <span class="route-addr__dot route-addr__dot--origin"></span>
              <div>
                <span class="route-addr__label">Origem</span>
                <span class="route-addr__val">{{ delivery()!.supplierName ?? 'Fornecedor' }}</span>
                @if (delivery()!.supplierCity) {
                  <span class="route-addr__sub">{{ delivery()!.supplierCity }}@if (delivery()!.supplierState) {, {{ delivery()!.supplierState }}}</span>
                }
              </div>
            </div>
            <div class="route-connector"></div>
            <div class="route-addr">
              <span class="route-addr__dot route-addr__dot--dest"></span>
              <div>
                <span class="route-addr__label">Destino</span>
                <span class="route-addr__val">{{ delivery()!.deliveryCity ?? 'Local de entrega' }}</span>
                <span class="route-addr__sub">{{ delivery()!.deliveryAddress }}</span>
              </div>
            </div>
          </div>

          <!-- Mensagem do fornecedor -->
          @if (delivery()!.proposalMessage) {
            <div class="supplier-note">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              {{ delivery()!.proposalMessage }}
            </div>
          }

          <!-- Prova de entrega -->
          @if (delivery()!.proofUrl) {
            <div class="proof-section">
              <span class="proof-section__label">Comprovante de Entrega</span>
              <a [href]="delivery()!.proofUrl" target="_blank" rel="noopener" class="proof-link">
                Ver comprovante →
              </a>
            </div>
          }

          <!-- Ações do fornecedor -->
          @if (rolePanel.isSupplier()) {
            <div class="supplier-actions">
              <h3 class="supplier-actions__title">Atualizar Status</h3>
              @if (delivery()!.status === 'scheduled') {
                <edq-button variant="primary" size="md" (click)="updateStatus('in_transit')" [disabled]="isUpdating()" style="width:100%">
                  {{ isUpdating() ? 'Atualizando...' : '🚚 Marcar como Em Trânsito' }}
                </edq-button>
              } @else if (delivery()!.status === 'in_transit') {
                <edq-button variant="primary" size="md" (click)="updateStatus('delivered')" [disabled]="isUpdating()" style="width:100%">
                  {{ isUpdating() ? 'Atualizando...' : '✅ Confirmar Entrega' }}
                </edq-button>
              } @else if (delivery()!.status === 'delivered') {
                <div class="delivered-badge">✅ Entrega confirmada</div>
              }
            </div>
          }
        </section>

        <!-- Mapa -->
        <section class="map-panel" aria-label="Mapa do trajeto de entrega">
          @if (routeLoading()) {
            <div class="map-skeleton">
              <div class="map-skeleton__spinner"></div>
              <span>Calculando rota...</span>
            </div>
          } @else {
            <edq-map
              [markers]="mapMarkers()"
              [route]="routePoints()"
              [height]="460"
              [config]="mapConfig"
              ariaLabel="Mapa do trajeto de entrega"
            />
          }
          @if (routeEta()) {
            <div class="map-eta">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              {{ routeEta() }}
            </div>
          }
        </section>
      </div>
    }
  `,
  styles: [`
    .page-loading, .page-error { padding: 48px; text-align: center; color: #6b7280; }
    .page-error { color: #dc2626; }
    .mono { font-family: var(--font-mono, monospace); font-size: 12px; }

    /* KPI row */
    .kpi-row {
      display: flex; flex-wrap: wrap; gap: 12px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: 10px;
      padding: 12px 16px;
      display: flex; flex-direction: column; gap: 3px;
      min-width: 140px; flex: 1;
    }
    .kpi-card__label { font-size: 10px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: .05em; }
    .kpi-card__val   { font-size: 14px; font-weight: 700; color: var(--color-text-primary, #111827); }
    .kpi-card__val--price { font-size: 18px; color: #059669; }
    .kpi-card__sub   { font-size: 11px; color: #9ca3af; }

    /* Layout */
    .tracking-layout {
      display: grid;
      grid-template-columns: 340px 1fr;
      gap: 24px;
      align-items: start;
    }

    /* Panel */
    .panel-title { font-size: 13px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: .06em; margin: 0 0 20px; }

    .timeline-panel {
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: 12px;
      padding: 20px;
      display: flex; flex-direction: column; gap: 20px;
    }

    /* Timeline */
    .timeline { display: flex; flex-direction: column; }
    .tl-item { display: flex; gap: 12px; }
    .tl-icon-col { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
    .tl-icon {
      width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: #f3f4f6; color: #9ca3af;
      border: 2px solid #e5e7eb;
      flex-shrink: 0;
    }
    .tl-item--done .tl-icon   { background: #ecfdf5; color: #059669; border-color: #a7f3d0; }
    .tl-item--current .tl-icon { background: #ede9fe; color: #6d28d9; border-color: #c4b5fd; }
    .tl-line { width: 2px; flex: 1; min-height: 20px; background: #e5e7eb; margin: 4px 0; }
    .tl-item--done + .tl-item .tl-line,
    .tl-item--done .tl-line { background: #a7f3d0; }
    .tl-content { padding-bottom: 20px; display: flex; flex-direction: column; gap: 2px; }
    .tl-label { font-size: 13px; font-weight: 600; color: var(--color-text-primary, #111827); }
    .tl-item--pending .tl-label { color: #9ca3af; }
    .tl-date { font-size: 11px; color: #9ca3af; }
    .tl-date--pending { font-style: italic; }

    /* Route addresses */
    .route-addresses { display: flex; flex-direction: column; gap: 0; }
    .route-addr { display: flex; align-items: flex-start; gap: 10px; }
    .route-addr__dot {
      width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 3px;
    }
    .route-addr__dot--origin { background: #4f46e5; }
    .route-addr__dot--dest   { background: #059669; }
    .route-addr > div { display: flex; flex-direction: column; gap: 1px; }
    .route-addr__label { font-size: 10px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: .05em; }
    .route-addr__val   { font-size: 13px; font-weight: 600; color: var(--color-text-primary, #111827); }
    .route-addr__sub   { font-size: 11px; color: #9ca3af; }
    .route-connector   { width: 2px; height: 20px; background: #e5e7eb; margin-left: 4px; }

    /* Supplier note */
    .supplier-note {
      display: flex; gap: 8px; align-items: flex-start;
      padding: 10px 12px; background: #f9fafb;
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: 8px; font-size: 12px; color: #6b7280; line-height: 1.5;
    }

    /* Proof */
    .proof-section { display: flex; flex-direction: column; gap: 4px; }
    .proof-section__label { font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: .05em; }
    .proof-link { font-size: 13px; color: #4f46e5; font-weight: 600; text-decoration: none; }
    .proof-link:hover { text-decoration: underline; }

    /* Supplier actions */
    .supplier-actions { border-top: 1px solid var(--color-border, #e5e7eb); padding-top: 16px; display: flex; flex-direction: column; gap: 10px; }
    .supplier-actions__title { font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; margin: 0; }
    .delivered-badge { text-align: center; padding: 10px; background: #ecfdf5; color: #065f46; border-radius: 8px; font-size: 13px; font-weight: 700; }

    /* Map */
    .map-panel { position: sticky; top: 24px; border-radius: 12px; overflow: hidden; border: 1px solid var(--color-border, #e5e7eb); }
    .map-skeleton {
      height: 460px; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 12px;
      background: #f9fafb; color: #9ca3af; font-size: 13px;
    }
    .map-skeleton__spinner {
      width: 28px; height: 28px; border: 3px solid #e5e7eb;
      border-top-color: #4f46e5; border-radius: 50%;
      animation: spin .8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .map-eta {
      position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
      display: flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,.95); backdrop-filter: blur(4px);
      padding: 6px 14px; border-radius: 99px;
      font-size: 12px; font-weight: 600; color: #374151;
      box-shadow: 0 2px 8px rgba(0,0,0,.12);
      white-space: nowrap;
    }

    @media (max-width: 900px) {
      .tracking-layout { grid-template-columns: 1fr; }
      .map-panel { position: static; }
      .kpi-row { flex-direction: column; }
      .kpi-card { min-width: unset; }
    }
  `],
  styleUrl: './delivery-detail.component.scss',
})
export class DeliveryDetailComponent implements OnInit {
  private readonly route         = inject(ActivatedRoute);
  private readonly deliveriesApi = inject(DeliveriesApiService);
  private readonly routing       = inject(RoutingService);
  private readonly toast         = inject(ToastService);
  protected readonly rolePanel   = inject(RolePanelService);

  protected readonly delivery     = signal<DeliveryDetail | null>(null);
  protected readonly isLoading    = signal(false);
  protected readonly error        = signal<string | null>(null);
  protected readonly isUpdating   = signal(false);
  protected readonly routePoints  = signal<[number, number][]>([]);
  protected readonly routeLoading = signal(false);
  protected readonly routeEta     = signal('');

  protected readonly mapConfig: MapConfig = {
    tileStyle: 'positron', fitBounds: true, fitBoundsPadding: [48, 48],
    fitBoundsMaxZoom: 15, markerSize: 26, markerTail: false,
    zoomControl: true, dragging: true, scrollWheelZoom: false,
    attribution: false, routeColor: '#4f46e5', routeWeight: 5, borderRadius: '0',
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.isLoading.set(true);
    this.deliveriesApi.findById(id).subscribe({
      next: async d => {
        this.delivery.set(d);
        this.isLoading.set(false);
        await this.loadRoute(d);
      },
      error: () => { this.error.set('Entrega não encontrada.'); this.isLoading.set(false); },
    });
  }

  private async loadRoute(d: DeliveryDetail): Promise<void> {
    if (!d.supplierLat || !d.supplierLng || !d.deliveryLat || !d.deliveryLng) return;
    this.routeLoading.set(true);
    const result = await this.routing.getRoute(d.supplierLat, d.supplierLng, d.deliveryLat, d.deliveryLng);
    if (result) {
      this.routePoints.set(result.points);
      this.routeEta.set(`~${result.durationText} · ${result.distanceText}`);
    } else {
      this.routePoints.set([[d.supplierLat, d.supplierLng], [d.deliveryLat, d.deliveryLng]]);
    }
    this.routeLoading.set(false);
  }

  protected readonly mapMarkers = () => {
    const d = this.delivery();
    if (!d) return [];
    const markers: MapMarker[] = [];
    if (d.supplierLat && d.supplierLng) {
      markers.push({ lat: d.supplierLat, lng: d.supplierLng, label: d.supplierName ?? 'Fornecedor', color: 'primary', popup: d.supplierName ?? 'Fornecedor' });
    }
    if (d.deliveryLat && d.deliveryLng) {
      markers.push({ lat: d.deliveryLat, lng: d.deliveryLng, label: 'Destino', color: 'green', popup: d.deliveryAddress });
    }
    return markers;
  };

  protected readonly timelineSteps = () => {
    const d = this.delivery();
    if (!d) return [];
    const status = d.status;

    const steps: TimelineStep[] = [
      {
        key: 'scheduled', label: 'Entrega Agendada', icon: 'check',
        datetime: d.scheduledAt,
        completed: ['scheduled','in_transit','delivered','failed','returned'].includes(status),
        current: status === 'scheduled',
      },
      {
        key: 'in_transit', label: 'Saiu para Entrega', icon: 'truck',
        datetime: d.dispatchedAt,
        completed: ['in_transit','delivered'].includes(status),
        current: status === 'in_transit',
      },
      {
        key: 'delivered', label: 'Entregue', icon: 'flag',
        datetime: d.deliveredAt,
        completed: status === 'delivered',
        current: false,
      },
    ];

    if (status === 'failed' || status === 'returned') {
      steps.push({
        key: status, label: status === 'failed' ? 'Falhou' : 'Devolvido', icon: 'circle',
        datetime: null, completed: true, current: true,
      });
    }

    return steps;
  };

  protected updateStatus(newStatus: string): void {
    const d = this.delivery();
    if (!d) return;
    this.isUpdating.set(true);
    this.deliveriesApi.updateStatus(d.id, { status: newStatus }).subscribe({
      next: () => {
        this.delivery.set({ ...d, status: newStatus, dispatchedAt: newStatus === 'in_transit' ? new Date().toISOString() : d.dispatchedAt, deliveredAt: newStatus === 'delivered' ? new Date().toISOString() : d.deliveredAt });
        this.toast.success(newStatus === 'in_transit' ? 'Entrega marcada como em trânsito.' : 'Entrega confirmada!');
        this.isUpdating.set(false);
      },
      error: () => { this.toast.error('Erro ao atualizar status.'); this.isUpdating.set(false); },
    });
  }
}
