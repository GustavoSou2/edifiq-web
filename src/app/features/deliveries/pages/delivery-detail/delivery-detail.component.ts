import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ButtonComponent }      from '../../../../shared/components/button/button.component';
import { MapComponent }         from '../../../../shared/components/map/map.component';
import { MapMarker }            from '../../../../shared/components/map/map.types';
import { RoutingService }       from '../../../../shared/services/routing.service';

interface TimelineStep {
  label:     string;
  datetime:  string;
  completed: boolean;
  current:   boolean;
}

/* ── Dados mock ─────────────────────────────────────────────*/

const TIMELINE_STEPS: TimelineStep[] = [
  { label: 'Pedido Confirmado',  datetime: '15/01/2024 09:55', completed: true,  current: false },
  { label: 'Entrega Agendada',   datetime: '15/01/2024 10:30', completed: true,  current: false },
  { label: 'Saiu para Entrega',  datetime: '16/01/2024 08:00', completed: true,  current: true  },
  { label: 'Entregue',           datetime: '—',                completed: false, current: false },
];

/*
 * Coordenadas reais em Indaiatuba-SP:
 *   Origem  — Depósito Central Ltda (área industrial)
 *   Destino — Av. Eng. Fábio Roberto Barnabé, 3950
 */
const ORIGIN_LAT = -23.0820;
const ORIGIN_LNG = -47.2050;
const DEST_LAT   = -23.0896;
const DEST_LNG   = -47.2189;

const ROUTE_MARKERS: MapMarker[] = [
  {
    lat:   ORIGIN_LAT,
    lng:   ORIGIN_LNG,
    label: 'Depósito Central Ltda',
    color: 'primary',
    popup: 'Depósito Central Ltda<br>Rua das Indústrias, 120 — Indaiatuba, SP',
  },
  {
    lat:   DEST_LAT,
    lng:   DEST_LNG,
    label: 'Local de Entrega',
    color: 'green',
    popup: 'Local de Entrega<br>Av. Eng. Fábio Roberto Barnabé, 3950 — Indaiatuba, SP',
  },
];

@Component({
  selector: 'edq-delivery-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeaderComponent, StatusBadgeComponent, ButtonComponent, MapComponent],
  template: `
    <edq-page-header title="Entrega #DEL-0042" subtitle="Acompanhe o status desta entrega">
      <edq-button slot="actions" variant="secondary" size="sm" routerLink="../">← Voltar</edq-button>
    </edq-page-header>

    <!-- ── Info cards ─────────────────────────────────────── -->
    <div class="info-grid">
      <div class="info-card">
        <span class="info-card__label">Status</span>
        <edq-status-badge status="in_transit" />
      </div>
      <div class="info-card">
        <span class="info-card__label">Fornecedor</span>
        <span class="info-card__value">Depósito Central Ltda</span>
      </div>
      <div class="info-card">
        <span class="info-card__label">Pedido</span>
        <span class="info-card__value mono">#EDQ-2024-0042</span>
      </div>
      <div class="info-card">
        <span class="info-card__label">Agendado para</span>
        <span class="info-card__value">16/01/2024 às 08:00</span>
      </div>
      <div class="info-card">
        <span class="info-card__label">Rastreamento</span>
        <span class="info-card__value mono">TRK-003</span>
      </div>
    </div>

    <!-- ── Layout principal: timeline + mapa ──────────────── -->
    <div class="tracking-layout">

      <!-- ── Timeline ───────────────────────────────────────── -->
      <section class="timeline-panel">
        <h2 class="panel-title">Linha do Tempo</h2>

        <div class="timeline">
          @for (step of timelineSteps; track step.label; let last = $last) {
            <div class="timeline-item"
                 [class.timeline-item--completed]="step.completed"
                 [class.timeline-item--current]="step.current">

              <div class="timeline-icon-col">
                <div class="timeline-icon"
                     [class.timeline-icon--completed]="step.completed"
                     [class.timeline-icon--current]="step.current">
                  @if (step.completed && !step.current) {
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2.5"
                         stroke-linecap="round" stroke-linejoin="round">
                      <path d="M5 13l4 4L19 7"/>
                    </svg>
                  } @else if (step.current) {
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z"/>
                      <circle cx="5.5" cy="18.5" r="2.5"/>
                      <circle cx="18.5" cy="18.5" r="2.5"/>
                    </svg>
                  } @else {
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <circle cx="5" cy="5" r="4" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                  }
                </div>

                @if (!last) {
                  <div class="timeline-line"
                       [class.timeline-line--completed]="step.completed && !step.current">
                  </div>
                }
              </div>

              <div class="timeline-content">
                <span class="timeline-label"
                      [class.timeline-label--current]="step.current"
                      [class.timeline-label--done]="step.completed && !step.current">
                  {{ step.label }}
                </span>
                <span class="timeline-datetime">{{ step.datetime }}</span>
              </div>
            </div>
          }
        </div>

        <!-- Endereços de origem e destino -->
        <div class="route-addresses">
          <div class="route-address">
            <div class="route-address__dot route-address__dot--origin"></div>
            <div class="route-address__text">
              <span class="route-address__label">Origem</span>
              <span class="route-address__value">Depósito Central Ltda</span>
              <span class="route-address__sub">Rua das Indústrias, 120 — Indaiatuba, SP</span>
            </div>
          </div>
          <div class="route-address__connector"></div>
          <div class="route-address">
            <div class="route-address__dot route-address__dot--dest"></div>
            <div class="route-address__text">
              <span class="route-address__label">Destino</span>
              <span class="route-address__value">Local da Obra</span>
              <span class="route-address__sub">Av. Eng. Fábio Roberto Barnabé, 3950 — Indaiatuba, SP</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Mapa de rota ────────────────────────────────────── -->
      <section class="map-panel" aria-label="Mapa do trajeto de entrega">

        <!-- Legenda flutuante -->
        <div class="map-legend">
          <div class="map-legend__item">
            <span class="map-legend__dot map-legend__dot--origin"></span>
            <span>Depósito</span>
          </div>
          <div class="map-legend__sep"></div>
          <div class="map-legend__item">
            <span class="map-legend__dot map-legend__dot--dest"></span>
            <span>Destino</span>
          </div>
          <div class="map-legend__sep"></div>
          <div class="map-legend__item map-legend__item--live">
            <span class="map-legend__pulse"></span>
            <span>Em trânsito</span>
          </div>
        </div>

        <!-- Skeleton enquanto a rota carrega -->
        @if (routeLoading()) {
          <div class="map-skeleton" [style.height.px]="480">
            <div class="map-skeleton__spinner"></div>
            <span>Calculando rota...</span>
          </div>
        } @else {
          <edq-map
            [markers]="routeMarkers"
            [route]="routePoints()"
            [height]="480"
            [config]="{
              tileStyle:        'positron',
              fitBounds:        true,
              fitBoundsPadding: [56, 56],
              fitBoundsMaxZoom: 15,
              markerSize:       26,
              markerTail:       false,
              zoomControl:      true,
              dragging:         true,
              scrollWheelZoom:  false,
              attribution:      false,
              routeColor:       '#4F46E5',
              routeWeight:      5,
              borderRadius:     '0'
            }"
            ariaLabel="Mapa do trajeto de entrega"
          />
        }

        <!-- Chip de ETA — atualizado com dados reais da API -->
        @if (routeEta()) {
          <div class="map-eta">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            <span>{{ routeEta() }}</span>
          </div>
        }

        <!-- Erro de rota -->
        @if (routeError()) {
          <div class="map-error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4m0 4h.01"/>
            </svg>
            <span>Rota indisponível — exibindo linha direta</span>
          </div>
        }

      </section>
    </div>
  `,
  styleUrl: './delivery-detail.component.scss',
})
export class DeliveryDetailComponent implements OnInit {
  readonly id = input<string>('');

  private readonly routing = inject(RoutingService);

  protected readonly timelineSteps = TIMELINE_STEPS;
  protected readonly routeMarkers  = ROUTE_MARKERS;

  /* ── Estado da rota ─────────────────────────────────────── */
  protected readonly routePoints  = signal<[number, number][]>([]);
  protected readonly routeLoading = signal(true);
  protected readonly routeError   = signal(false);
  protected readonly routeEta     = signal('');

  async ngOnInit(): Promise<void> {
    await this.loadRoute();
  }

  private async loadRoute(): Promise<void> {
    this.routeLoading.set(true);
    this.routeError.set(false);

    const result = await this.routing.getRoute(
      ORIGIN_LAT, ORIGIN_LNG,
      DEST_LAT,   DEST_LNG,
    );

    if (result) {
      this.routePoints.set(result.points);
      this.routeEta.set(`~${result.durationText} · ${result.distanceText}`);
    } else {
      /* Fallback: linha reta entre os dois pontos */
      this.routePoints.set([[ORIGIN_LAT, ORIGIN_LNG], [DEST_LAT, DEST_LNG]]);
      this.routeError.set(true);
    }

    this.routeLoading.set(false);
  }
}
