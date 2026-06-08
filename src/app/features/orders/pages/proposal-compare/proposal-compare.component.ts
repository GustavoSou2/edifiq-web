import {
  ChangeDetectionStrategy, Component, OnInit, OnDestroy,
  computed, inject, signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ButtonComponent }     from '../../../../shared/components/button/button.component';
import { MapComponent, MapConfig } from '../../../../shared/components/map/map.component';
import { Proposal, Order }     from '../../../../shared/types/domain.types';
import { OrdersApiService }    from '../../../../core/services/api/orders-api.service';
import { ToastService }        from '../../../../shared/services/toast.service';

interface CompareCell {
  unitPrice:    number | null;
  totalPrice:   number | null;
  availability: 'in_stock' | 'backorder' | 'unavailable';
  isBest:       boolean;
}

interface CompareRow {
  orderItemId: string;
  description: string;
  quantity:    number;
  unit:        string;
  cells:       CompareCell[];
}

@Component({
  selector: 'edq-proposal-compare',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CurrencyPipe, DatePipe, DecimalPipe, PageHeaderComponent, ButtonComponent, MapComponent],
  template: `
    @if (isLoading()) {
      <div class="page-loading">Carregando propostas...</div>
    } @else if (error()) {
      <div class="page-error" role="alert">{{ error() }}</div>
    } @else {

      <edq-page-header
        [title]="order()?.referenceCode ?? order()?.title ?? 'Comparar Propostas'"
        [subtitle]="proposals().length + ' proposta' + (proposals().length !== 1 ? 's' : '') + ' recebida' + (proposals().length !== 1 ? 's' : '')"
      >
        <edq-button slot="actions" variant="secondary" size="sm" routerLink="../">← Voltar</edq-button>
      </edq-page-header>

      <!-- Status -->
      @if (order()?.status === 'open' || order()?.status === 'in_auction') {
        <div class="status-pill status-pill--live">
          <span class="live-dot"></span>Leilão em andamento
        </div>
      } @else if (order()?.status === 'selected') {
        <div class="status-pill status-pill--done">✅ Proposta selecionada</div>
      }

      @if (proposals().length === 0) {
        <div class="empty">
          <span>📭</span>
          <p>Nenhuma proposta recebida ainda.</p>
          <span>Os fornecedores notificados ainda não enviaram propostas.</span>
        </div>
      } @else {

        <!-- ══════════════════════════════════════════════════
             CARDS DE PROPOSTA
        ══════════════════════════════════════════════════ -->
        <div class="cards-grid">
          @for (p of sortedProposals(); track p.id; let i = $index) {
            <article
              class="pcard"
              [class.pcard--winner]="i === 0"
              [class.pcard--selected]="selectedProposalId() === p.id"
              [attr.aria-label]="'Proposta de ' + (p.supplierName ?? 'Fornecedor')"
            >

              <!-- ── Topo: identidade do fornecedor ── -->
              <header class="pcard__header">
                <div class="pcard__avatar" [style.background]="avatarColor(i)">
                  {{ initials(p.supplierName) }}
                </div>
                <div class="pcard__identity">
                  <span class="pcard__name">{{ p.supplierName ?? 'Fornecedor' }}</span>
                  @if (p.supplierCity) {
                    <span class="pcard__loc">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                      {{ p.supplierCity }}@if (p.supplierState) {, {{ p.supplierState }}}
                    </span>
                  }
                </div>
                @if (i === 0) {
                  <span class="pcard__winner-badge">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    Melhor preço
                  </span>
                }
              </header>

              <!-- ── Preço principal ── -->
              <div class="pcard__price-block">
                <span class="pcard__price">{{ p.totalPrice | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
                @if (i === 0 && savings(p) > 0) {
                  <span class="pcard__saving">
                    {{ savings(p) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }} mais barato
                  </span>
                }
              </div>

              <!-- ── Métricas em grid ── -->
              <div class="pcard__metrics">

                <!-- Reputação com anel SVG -->
                <div class="metric-card metric-card--rep">
                  <div class="rep-ring" [attr.aria-label]="'Reputação: ' + (p.supplierReputationScore ?? 0)">
                    <svg viewBox="0 0 36 36" class="rep-ring__svg" aria-hidden="true">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" stroke-width="3"/>
                      <circle
                        cx="18" cy="18" r="15.9" fill="none"
                        [attr.stroke]="repRingColor(p.supplierReputationScore)"
                        stroke-width="3"
                        stroke-linecap="round"
                        stroke-dasharray="100"
                        [attr.stroke-dashoffset]="repRingOffset(p.supplierReputationScore)"
                        transform="rotate(-90 18 18)"
                      />
                    </svg>
                    <span class="rep-ring__val" [class]="repClass(p.supplierReputationScore)">
                      {{ p.supplierReputationScore != null ? (p.supplierReputationScore | number:'1.1-1') : '—' }}
                    </span>
                  </div>
                  <div class="metric-card__info">
                    <span class="metric-card__label">Reputação</span>
                    @if (p.supplierTotalRatings) {
                      <span class="metric-card__sub">{{ p.supplierTotalRatings }} avaliações</span>
                    }
                    @if (p.supplierTotalDeliveries) {
                      <span class="metric-card__sub">{{ p.supplierTotalDeliveries }} entregas</span>
                    }
                  </div>
                </div>

                <!-- Prazo -->
                <div class="metric-card">
                  <div class="metric-card__icon metric-card__icon--blue">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  </div>
                  <div class="metric-card__info">
                    <span class="metric-card__label">Prazo</span>
                    <span class="metric-card__val">
                      @if (p.deliveryEtaHours) { {{ p.deliveryEtaHours }}h }
                      @else if (p.proposedDeliveryAt) { {{ p.proposedDeliveryAt | date:'dd/MM HH:mm' }} }
                      @else { — }
                    </span>
                    @if (p.supplierResponseSlaMin) {
                      <span class="metric-card__sub">SLA {{ p.supplierResponseSlaMin }}min</span>
                    }
                  </div>
                </div>

                <!-- Cobertura de itens -->
                <div class="metric-card">
                  <div class="metric-card__icon metric-card__icon--green">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                  </div>
                  <div class="metric-card__info">
                    <span class="metric-card__label">Cobertura</span>
                    <span class="metric-card__val">{{ availableCount(p) }}/{{ p.items?.length ?? '?' }}</span>
                    <div class="coverage-bar">
                      <div
                        class="coverage-bar__fill"
                        [style.width.%]="p.items?.length ? (availableCount(p) / p.items!.length) * 100 : 0"
                        [class.coverage-bar__fill--full]="availableCount(p) === (p.items?.length ?? 0)"
                      ></div>
                    </div>
                  </div>
                </div>

                <!-- Raio de entrega -->
                @if (p.supplierMaxDeliveryKm) {
                  <div class="metric-card">
                    <div class="metric-card__icon metric-card__icon--purple">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
                    </div>
                    <div class="metric-card__info">
                      <span class="metric-card__label">Raio</span>
                      <span class="metric-card__val">{{ p.supplierMaxDeliveryKm }} km</span>
                    </div>
                  </div>
                }
              </div>

              <!-- ── Mensagem do fornecedor ── -->
              @if (p.message) {
                <div class="pcard__message">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  {{ p.message }}
                </div>
              }

              <!-- ── Mini mapa ── -->
              @if (p.supplierLat && p.supplierLng) {
                <div class="pcard__map">
                  <edq-map
                    [lat]="p.supplierLat"
                    [lng]="p.supplierLng"
                    [height]="110"
                    [zoom]="12"
                    [config]="miniMapConfig"
                    [attr.aria-label]="'Localização de ' + p.supplierName"
                  />
                </div>
              }

              <!-- ── Ação ── -->
              <footer class="pcard__footer">
                @if (selectedProposalId() === p.id) {
                  <div class="pcard__selected-tag">✅ Proposta Selecionada</div>
                } @else if (order()?.status !== 'selected') {
                  <edq-button
                    [variant]="i === 0 ? 'primary' : 'secondary'"
                    size="md"
                    (click)="selectProposal(p.id)"
                    [disabled]="!!selecting()"
                    style="width: 100%;"
                  >
                    {{ selecting() === p.id ? 'Confirmando...' : (i === 0 ? '✓ Escolher Esta Proposta' : 'Selecionar') }}
                  </edq-button>
                }
              </footer>

            </article>
          }
        </div>

        <!-- ══════════════════════════════════════════════════
             TABELA COMPARATIVA POR ITEM
        ══════════════════════════════════════════════════ -->
        @if (compareRows().length > 0) {
          <section class="compare-section">
            <h2 class="compare-section__title">Preço por Item</h2>
            <div class="compare-wrap">
              <table class="compare-table" aria-label="Comparativo de preços por item">
                <thead>
                  <tr>
                    <th class="ct-item" scope="col">Item</th>
                    <th class="ct-qty"  scope="col">Qtd</th>
                    @for (p of sortedProposals(); track p.id; let i = $index) {
                      <th class="ct-price" scope="col" [class.ct-price--winner]="i === 0">
                        <div class="ct-th">
                          <span class="ct-th__dot" [style.background]="avatarColor(i)"></span>
                          {{ shortName(p.supplierName) }}
                        </div>
                      </th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (row of compareRows(); track row.orderItemId) {
                    <tr class="ct-row">
                      <td class="ct-item ct-item-name">{{ row.description }}</td>
                      <td class="ct-qty mono">{{ row.quantity }} {{ row.unit }}</td>
                      @for (cell of row.cells; track $index) {
                        <td class="ct-price ct-cell"
                          [class.ct-cell--best]="cell.isBest"
                          [class.ct-cell--unavail]="cell.availability === 'unavailable'"
                          [class.ct-cell--backorder]="cell.availability === 'backorder'"
                        >
                          @if (cell.availability === 'unavailable') {
                            <span class="ct-unavail">✕</span>
                          } @else if (cell.totalPrice != null) {
                            <div class="ct-price-val">
                              {{ cell.totalPrice | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                              @if (cell.isBest) { <span class="ct-best-arrow">↓</span> }
                              @if (cell.availability === 'backorder') { <span class="ct-backorder">enc.</span> }
                            </div>
                          } @else { <span class="ct-empty">—</span> }
                        </td>
                      }
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr class="ct-total">
                    <td colspan="2" class="ct-total__label">Total</td>
                    @for (p of sortedProposals(); track p.id; let i = $index) {
                      <td class="ct-price ct-total__val" [class.ct-total__val--winner]="i === 0">
                        {{ p.totalPrice | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                      </td>
                    }
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        }
      }
    }
  `,
  styles: [`
    .page-loading { padding: 48px; text-align: center; color: #6b7280; }
    .page-error   { padding: 48px; text-align: center; color: #dc2626; }
    .mono { font-family: var(--font-mono, monospace); font-size: 12px; }

    /* Status pill */
    .status-pill {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 6px 14px; border-radius: 99px;
      font-size: 12px; font-weight: 600; margin-bottom: 24px;
    }
    .status-pill--live { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }
    .status-pill--done { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .live-dot {
      width: 7px; height: 7px; border-radius: 50%; background: #dc2626;
      animation: blink 1.4s infinite;
    }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }

    /* Empty */
    .empty {
      padding: 72px 24px; text-align: center;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      font-size: 13px; color: #9ca3af;
    }
    .empty span:first-child { font-size: 44px; }
    .empty p { font-size: 15px; font-weight: 600; color: #374151; margin: 0; }

    /* ── Cards grid ─────────────────────────────────────────── */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 36px;
    }

    /* ── Proposal card ──────────────────────────────────────── */
    .pcard {
      background: var(--color-surface, #fff);
      border: 1.5px solid var(--color-border, #e5e7eb);
      border-radius: 16px;
      padding: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: box-shadow .18s, border-color .18s;
    }
    .pcard:hover { box-shadow: 0 8px 32px rgba(0,0,0,.09); }
    .pcard--winner {
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79,70,229,.12);
    }
    .pcard--selected {
      border-color: #059669;
      box-shadow: 0 0 0 3px rgba(5,150,105,.12);
    }

    /* Header */
    .pcard__header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 18px 18px 0;
      position: relative;
    }
    .pcard__avatar {
      width: 42px; height: 42px; border-radius: 11px;
      display: flex; align-items: center; justify-content: center;
      font-size: 15px; font-weight: 800; color: #fff; flex-shrink: 0;
    }
    .pcard__identity { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
    .pcard__name {
      font-size: 14px; font-weight: 700;
      color: var(--color-text-primary, #111827);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .pcard__loc {
      display: flex; align-items: center; gap: 3px;
      font-size: 11px; color: #9ca3af;
    }
    .pcard__winner-badge {
      display: flex; align-items: center; gap: 4px;
      padding: 3px 9px; border-radius: 99px;
      background: #4f46e5; color: #fff;
      font-size: 10px; font-weight: 700;
      white-space: nowrap; flex-shrink: 0;
    }

    /* Price block */
    .pcard__price-block {
      padding: 14px 18px 0;
      display: flex; flex-direction: column; gap: 2px;
    }
    .pcard__price {
      font-size: 28px; font-weight: 800; letter-spacing: -.02em;
      color: var(--color-text-primary, #111827);
      line-height: 1;
    }
    .pcard__saving {
      font-size: 11px; font-weight: 600; color: #059669;
    }

    /* Metrics grid */
    .pcard__metrics {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      padding: 14px 18px;
    }

    .metric-card {
      background: var(--color-surface-alt, #f9fafb);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: 10px;
      padding: 10px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .metric-card--rep { grid-column: 1 / -1; }

    .metric-card__icon {
      width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .metric-card__icon--blue   { background: #eff6ff; color: #2563eb; }
    .metric-card__icon--green  { background: #f0fdf4; color: #059669; }
    .metric-card__icon--purple { background: #f5f3ff; color: #7c3aed; }

    .metric-card__info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .metric-card__label { font-size: 10px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: .05em; }
    .metric-card__val   { font-size: 15px; font-weight: 700; color: var(--color-text-primary, #111827); }
    .metric-card__sub   { font-size: 10px; color: #9ca3af; }

    /* Reputation ring */
    .rep-ring {
      position: relative;
      width: 48px; height: 48px; flex-shrink: 0;
    }
    .rep-ring__svg { width: 100%; height: 100%; }
    .rep-ring__val {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 800;
    }
    .rep-score--high { color: #059669; }
    .rep-score--mid  { color: #d97706; }
    .rep-score--low  { color: #dc2626; }

    /* Coverage bar */
    .coverage-bar {
      height: 4px; background: #e5e7eb; border-radius: 99px;
      overflow: hidden; width: 100%; margin-top: 4px;
    }
    .coverage-bar__fill {
      height: 100%; background: #d97706; border-radius: 99px; transition: width .3s;
    }
    .coverage-bar__fill--full { background: #059669; }

    /* Message */
    .pcard__message {
      margin: 0 18px;
      padding: 9px 12px;
      background: #f9fafb;
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: 9px;
      font-size: 12px; color: #6b7280; line-height: 1.5;
      display: flex; gap: 7px; align-items: flex-start;
    }

    /* Mini map */
    .pcard__map {
      margin: 12px 18px 0;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid var(--color-border, #e5e7eb);
    }

    /* Footer */
    .pcard__footer {
      padding: 14px 18px 18px;
      margin-top: auto;
    }
    .pcard__selected-tag {
      text-align: center; padding: 10px;
      background: #ecfdf5; color: #065f46;
      border-radius: 9px; font-size: 13px; font-weight: 700;
    }

    /* ── Compare section ────────────────────────────────────── */
    .compare-section { margin-top: 4px; }
    .compare-section__title {
      font-size: 13px; font-weight: 700; color: #6b7280;
      text-transform: uppercase; letter-spacing: .06em; margin: 0 0 12px;
    }
    .compare-wrap {
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: 12px; overflow: auto;
    }
    .compare-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .compare-table thead th {
      position: sticky; top: 0;
      background: var(--color-surface-alt, #f9fafb);
      padding: 9px 14px;
      font-size: 10px; font-weight: 700; color: #9ca3af;
      text-transform: uppercase; letter-spacing: .06em;
      border-bottom: 1px solid var(--color-border, #e5e7eb);
      white-space: nowrap; text-align: left;
    }
    .ct-price--winner { background: #f5f3ff !important; color: #6d28d9 !important; }
    .ct-row { border-bottom: 1px solid var(--color-border, #e5e7eb); }
    .ct-row:last-child { border-bottom: none; }
    .ct-row:hover { background: #fafafa; }
    .ct-row td { padding: 10px 14px; vertical-align: middle; }
    .ct-item { min-width: 160px; }
    .ct-qty  { width: 80px; color: #6b7280; }
    .ct-price { width: 130px; text-align: right; }
    .ct-item-name { font-weight: 600; color: var(--color-text-primary, #111827); }
    .ct-th { display: flex; align-items: center; gap: 6px; }
    .ct-th__dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
    .ct-cell { text-align: right; }
    .ct-cell--best     { background: #f0fdf4; }
    .ct-cell--unavail  { background: #fef2f2; }
    .ct-cell--backorder{ background: #fffbeb; }
    .ct-price-val { display: flex; align-items: center; justify-content: flex-end; gap: 5px; font-weight: 600; }
    .ct-best-arrow { color: #059669; font-weight: 800; }
    .ct-backorder  { font-size: 10px; color: #92400e; }
    .ct-unavail    { color: #fca5a5; font-size: 14px; }
    .ct-empty      { color: #d1d5db; }
    .ct-total { background: var(--color-surface-alt, #f9fafb); border-top: 2px solid var(--color-border, #e5e7eb); }
    .ct-total__label {
      font-size: 10px; font-weight: 700; color: #9ca3af;
      text-transform: uppercase; letter-spacing: .06em;
      text-align: right; padding: 10px 14px;
    }
    .ct-total__val { font-size: 14px; font-weight: 800; color: #111827; text-align: right; padding: 10px 14px; }
    .ct-total__val--winner { color: #4f46e5; }

    @media (max-width: 640px) {
      .cards-grid { grid-template-columns: 1fr; }
      .pcard__metrics { grid-template-columns: 1fr 1fr; }
    }
  `],
  styleUrl: './proposal-compare.component.scss',
})
export class ProposalCompareComponent implements OnInit, OnDestroy {
  private readonly route     = inject(ActivatedRoute);
  private readonly ordersApi = inject(OrdersApiService);
  private readonly toast     = inject(ToastService);

  protected readonly order              = signal<Order | null>(null);
  protected readonly proposals          = signal<Proposal[]>([]);
  protected readonly selectedProposalId = signal<string | null>(null);
  protected readonly isLoading          = signal(false);
  protected readonly error              = signal<string | null>(null);
  protected readonly selecting          = signal<string | null>(null);

  private orderId = '';
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  protected readonly miniMapConfig: MapConfig = {
    zoomControl: false, dragging: false, scrollWheelZoom: false,
    tileStyle: 'positron', markerSize: 20, markerTail: false,
    markerColor: '#4f46e5', fitBounds: false, attribution: false,
    borderRadius: '0',
  };

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') ?? '';
    this.load();
    this.pollInterval = setInterval(() => {
      if (this.order()?.status === 'open' || this.order()?.status === 'in_auction') {
        this.loadProposals();
      }
    }, 15_000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  private load(): void {
    this.isLoading.set(true);
    this.ordersApi.findById(this.orderId).subscribe({
      next: order => {
        this.order.set(order);
        this.loadProposals();
        this.ordersApi.getSelection(this.orderId).subscribe({
          next: (sel: any) => this.selectedProposalId.set(sel?.proposalId ?? null),
          error: () => {},
        });
      },
      error: () => { this.error.set('Pedido não encontrado.'); this.isLoading.set(false); },
    });
  }

  private loadProposals(): void {
    this.ordersApi.listProposals(this.orderId).subscribe({
      next: (p: any) => { this.proposals.set(p as Proposal[]); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  protected readonly sortedProposals = computed(() =>
    [...this.proposals()].sort((a, b) => a.totalPrice - b.totalPrice)
  );

  protected readonly compareRows = computed((): CompareRow[] => {
    const sorted = this.sortedProposals();
    if (!sorted.length || !this.order()?.items?.length) return [];
    return (this.order()!.items ?? []).map(orderItem => {
      const cells: CompareCell[] = sorted.map(proposal => {
        const pi = proposal.items?.find(i => i.orderItemId === orderItem.id);
        return {
          unitPrice:    pi?.unitPrice  ?? null,
          totalPrice:   pi?.totalPrice ?? null,
          availability: (pi?.availability ?? 'unavailable') as any,
          isBest:       false,
        };
      });
      const prices = cells.filter(c => c.availability !== 'unavailable' && c.totalPrice != null).map(c => c.totalPrice!);
      const min = prices.length ? Math.min(...prices) : null;
      if (min != null) cells.forEach(c => { c.isBest = c.availability !== 'unavailable' && c.totalPrice === min; });
      return { orderItemId: orderItem.id, description: orderItem.description, quantity: orderItem.quantity, unit: orderItem.unit ?? '', cells };
    });
  });

  protected selectProposal(proposalId: string): void {
    if (this.selecting()) return;
    this.selecting.set(proposalId);
    this.ordersApi.selectProposal(this.orderId, { proposalId }).subscribe({
      next: () => {
        this.selectedProposalId.set(proposalId);
        this.selecting.set(null);
        this.toast.success('Proposta selecionada! Entrega agendada.');
        this.ordersApi.findById(this.orderId).subscribe({ next: o => this.order.set(o) });
      },
      error: () => { this.selecting.set(null); this.toast.error('Erro ao selecionar proposta.'); },
    });
  }

  protected savings(p: Proposal): number {
    const max = Math.max(...this.proposals().map(x => x.totalPrice));
    return max - p.totalPrice;
  }

  protected availableCount(p: Proposal): number {
    return p.items?.filter(i => i.availability !== 'unavailable').length ?? 0;
  }

  protected initials(name: string | null): string {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  protected shortName(name: string | null): string {
    if (!name) return '?';
    return name.split(' ')[0];
  }

  protected repRingOffset(score: number | null): number {
    if (score == null) return 100;
    // circumference = 100, offset = 100 - (score/5)*100
    return 100 - (score / 5) * 100;
  }

  protected repRingColor(score: number | null): string {
    if (score == null) return '#e5e7eb';
    if (score >= 4) return '#059669';
    if (score >= 3) return '#d97706';
    return '#dc2626';
  }

  protected repClass(score: number | null): string {
    if (score == null) return '';
    return score >= 4 ? 'rep-score--high' : score >= 3 ? 'rep-score--mid' : 'rep-score--low';
  }

  protected avatarColor(i: number): string {
    return ['#4f46e5','#059669','#d97706','#dc2626','#7c3aed','#0891b2'][i % 6];
  }
}
