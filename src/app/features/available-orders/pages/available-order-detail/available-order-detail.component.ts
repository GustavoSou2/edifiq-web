import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PageHeaderComponent }  from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ButtonComponent }      from '../../../../shared/components/button/button.component';
import { MapComponent, MapConfig } from '@shared';
import {
  ProposalsApiService,
  ReceivedDistribution,
  SubmitProposalPayload,
} from '../../../../core/services/api/proposals-api.service';

type Availability = 'in_stock' | 'backorder' | 'unavailable';

interface ProposalItemForm {
  orderItemId:  string;
  description:  string;
  quantity:     number;
  unit:         string;
  unitPrice:    number | null;
  totalPrice:   number | null;
  availability: Availability;
}

@Component({
  selector: 'edq-available-order-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, DatePipe, CurrencyPipe, FormsModule,
    PageHeaderComponent, StatusBadgeComponent, ButtonComponent, MapComponent,
  ],
  template: `
    @if (isLoading()) {
      <div class="page-loading" aria-live="polite">Carregando pedido...</div>
    } @else if (error()) {
      <div class="page-error" role="alert">{{ error() }}</div>
    } @else if (distribution()) {

      <edq-page-header
        [title]="distribution()!.order?.referenceCode ?? distribution()!.order?.title ?? 'Pedido'"
        subtitle="Detalhes do pedido disponível"
      >
        <edq-button slot="actions" variant="ghost" size="sm" routerLink="/app/available-orders">
          ← Voltar
        </edq-button>
      </edq-page-header>

      <!-- ── Layout principal ──────────────────────────────── -->
      <div class="page-layout">

        <!-- ── Coluna esquerda: info + mapa ─────────────────── -->
        <div class="col-info">

          <!-- Info do pedido -->
          <div class="card">
            <div class="card__header">
              <h2 class="card__title">Pedido</h2>
              <div class="card__badges">
                <edq-status-badge [status]="$any(distribution()!.order?.status ?? distribution()!.status)" />
                @if (distribution()!.order?.isUrgent) {
                  <span class="badge-urgent">URGENTE</span>
                }
              </div>
            </div>
            <dl class="info-list">
              <div class="info-row">
                <dt>Entrega</dt>
                <dd>📍 {{ distribution()!.order?.deliveryAddress ?? '—' }}</dd>
              </div>
              <div class="info-row">
                <dt>Cidade</dt>
                <dd>
                  {{ distribution()!.order?.deliveryCity ?? '—' }}@if (distribution()!.order?.deliveryState) {, {{ distribution()!.order!.deliveryState }}}
                </dd>
              </div>
              <div class="info-row">
                <dt>Publicado</dt>
                <dd>{{ distribution()!.order?.createdAt | date:'dd/MM/yyyy' }}</dd>
              </div>
              @if (distribution()!.order?.notes) {
                <div class="info-row info-row--full">
                  <dt>Observações</dt>
                  <dd>{{ distribution()!.order!.notes }}</dd>
                </div>
              }
            </dl>
          </div>

          <!-- Mapa -->
          @if (distribution()!.order?.deliveryLat && distribution()!.order?.deliveryLng) {
            <div class="map-wrap">
              <edq-map
                [lat]="distribution()!.order!.deliveryLat!"
                [lng]="distribution()!.order!.deliveryLng!"
                [height]="180"
                [zoom]="14"
                [config]="mapConfig"
                ariaLabel="Localização de entrega"
              />
            </div>
          }
        </div>

        <!-- ── Coluna direita: proposta ──────────────────────── -->
        <div class="col-proposal">
          @if (submitted()) {
            <div class="success-card" role="status">
              <span class="success-card__icon">✅</span>
              <h3>Proposta enviada!</h3>
              <p>O comprador foi notificado e pode aceitar sua proposta.</p>
              <edq-button variant="secondary" size="sm" routerLink="/app/available-orders">
                Ver outros pedidos
              </edq-button>
            </div>
          } @else {
            <div class="proposal-card">

              <!-- Header com total -->
              <div class="proposal-card__header">
                <h2 class="proposal-card__title">Sua Proposta</h2>
                @if (grandTotal()) {
                  <span class="proposal-card__total">
                    {{ grandTotal()! | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                  </span>
                }
              </div>

              <!-- Tabela de itens — compacta e scrollável -->
              <div class="items-table-wrap">
                <table class="items-table" aria-label="Itens da proposta">
                  <thead>
                    <tr>
                      <th class="col-item">Item</th>
                      <th class="col-qty">Qtd</th>
                      <th class="col-price">Preço unit.</th>
                      <th class="col-total">Total</th>
                      <th class="col-avail">Disponib.</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of proposalItems(); track item.orderItemId; let i = $index) {
                      <tr [class.row--unavailable]="item.availability === 'unavailable'">

                        <!-- Nome do item -->
                        <td class="col-item">
                          <span class="item-name" [title]="item.description">{{ item.description }}</span>
                        </td>

                        <!-- Quantidade -->
                        <td class="col-qty mono">{{ item.quantity }} {{ item.unit }}</td>

                        <!-- Preço unitário -->
                        <td class="col-price">
                          <div class="price-wrap">
                            <span class="price-prefix">R$</span>
                            <input
                              type="number"
                              class="price-input"
                              placeholder="0,00"
                              min="0"
                              step="0.01"
                              [disabled]="item.availability === 'unavailable'"
                              [(ngModel)]="item.unitPrice"
                              (ngModelChange)="recalcTotal(i)"
                              [attr.aria-label]="'Preço unitário de ' + item.description"
                            />
                          </div>
                        </td>

                        <!-- Total calculado -->
                        <td class="col-total">
                          @if (item.totalPrice && item.availability !== 'unavailable') {
                            <span class="total-value">{{ item.totalPrice | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
                          } @else {
                            <span class="total-empty">—</span>
                          }
                        </td>

                        <!-- Disponibilidade — ícone toggle -->
                        <td class="col-avail">
                          <div class="avail-group" role="group" [attr.aria-label]="'Disponibilidade de ' + item.description">
                            <button
                              type="button"
                              class="avail-btn"
                              [class.avail-btn--active]="item.availability === 'in_stock'"
                              title="Disponível em estoque"
                              (click)="setAvailability(i, 'in_stock')"
                            >✓</button>
                            <button
                              type="button"
                              class="avail-btn avail-btn--order"
                              [class.avail-btn--active]="item.availability === 'backorder'"
                              title="Sob encomenda"
                              (click)="setAvailability(i, 'backorder')"
                            >⏳</button>
                            <button
                              type="button"
                              class="avail-btn avail-btn--no"
                              [class.avail-btn--active]="item.availability === 'unavailable'"
                              title="Indisponível"
                              (click)="setAvailability(i, 'unavailable')"
                            >✕</button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                  @if (grandTotal()) {
                    <tfoot>
                      <tr class="total-row">
                        <td colspan="3" class="total-row__label">Total geral</td>
                        <td class="total-row__value">{{ grandTotal()! | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  }
                </table>
              </div>

              <!-- Legenda de disponibilidade -->
              <div class="avail-legend">
                <span class="avail-legend__item"><span class="avail-legend__dot avail-legend__dot--ok"></span>Disponível</span>
                <span class="avail-legend__item"><span class="avail-legend__dot avail-legend__dot--order"></span>Encomenda</span>
                <span class="avail-legend__item"><span class="avail-legend__dot avail-legend__dot--no"></span>Indisponível</span>
              </div>

              <!-- Prazo e data -->
              <div class="delivery-row">
                <div class="field">
                  <label class="field__label" for="eta-hours">Prazo (horas)</label>
                  <input
                    id="eta-hours"
                    type="number"
                    class="field__input"
                    placeholder="Ex: 48"
                    min="1"
                    [(ngModel)]="deliveryEtaHours"
                  />
                </div>
                <div class="field">
                  <label class="field__label" for="delivery-date">Data prevista</label>
                  <input
                    id="delivery-date"
                    type="datetime-local"
                    class="field__input"
                    [(ngModel)]="proposedDeliveryAt"
                  />
                </div>
              </div>

              <!-- Mensagem -->
              <div class="field" style="margin-top: 10px;">
                <label class="field__label" for="message">Mensagem (opcional)</label>
                <textarea
                  id="message"
                  class="field__textarea"
                  rows="2"
                  placeholder="Condições de pagamento, observações..."
                  [(ngModel)]="proposalMessage"
                ></textarea>
              </div>

              @if (submitError()) {
                <div class="submit-error" role="alert">{{ submitError() }}</div>
              }

              <div style="margin-top: 16px;">
                <edq-button
                  variant="primary"
                  size="md"
                  (click)="submitProposal()"
                  [disabled]="!canSubmit() || isSaving()"
                  style="margin-top: 14px; width: 100%;"
                >
                  {{ isSaving() ? 'Enviando...' : 'Enviar Proposta' }}
                </edq-button>
              </div>

              @if (!canSubmit() && !isSaving() && proposalItems().length > 0) {
                <p class="submit-hint">Preencha o preço de todos os itens disponíveis.</p>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .page-loading, .page-error { padding: 48px; text-align: center; color: #6b7280; }
    .page-error { color: #dc2626; }

    /* ── Layout ─────────────────────────────────────────────── */
    .page-layout {
      display: grid;
      grid-template-columns: minmax(320px, 30dvw) 1fr;
      gap: 24px;
      align-items: start;
    }

    .col-info { display: flex; flex-direction: column; gap: 16px; }

    .col-proposal { min-width: 0; }

    /* ── Card base ──────────────────────────────────────────── */
    .card {
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: 12px;
      padding: 18px 20px;
    }
    .card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 14px;
      flex-wrap: wrap;
    }
    .card__title { font-size: 13px; font-weight: 700; color: var(--color-text-primary, #111827); margin: 0; }
    .card__badges { display: flex; gap: 6px; align-items: center; }
    .badge-urgent {
      background: #e2445c; color: #fff;
      font-size: 9px; font-weight: 700; letter-spacing: .06em;
      padding: 2px 6px; border-radius: 99px; text-transform: uppercase;
    }

    /* ── Info list ──────────────────────────────────────────── */
    .info-list { display: flex; flex-direction: column; gap: 8px; margin: 0; }
    .info-row {
      display: grid;
      grid-template-columns: 72px 1fr;
      gap: 8px;
      font-size: 12px;
    }
    .info-row--full { grid-template-columns: 1fr; }
    .info-row dt { color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; font-size: 10px; padding-top: 1px; }
    .info-row dd { color: var(--color-text-primary, #111827); margin: 0; }

    /* ── Map ────────────────────────────────────────────────── */
    .map-wrap {
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid var(--color-border, #e5e7eb);
    }

    /* ── Proposal card ──────────────────────────────────────── */
    .proposal-card {
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: 12px;
      padding: 20px;
    }
    .proposal-card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
      gap: 12px;
    }
    .proposal-card__title { font-size: 15px; font-weight: 700; color: var(--color-text-primary, #111827); margin: 0; }
    .proposal-card__total { font-size: 20px; font-weight: 800; color: #059669; }

    /* ── Items table ────────────────────────────────────────── */
    .items-table-wrap {
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: 10px;
      overflow: auto;
      max-height: 420px;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .items-table thead th {
      position: sticky;
      top: 0;
      background: var(--color-surface-alt, #f9fafb);
      font-size: 10px;
      font-weight: 700;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: .05em;
      padding: 8px 10px;
      border-bottom: 1px solid var(--color-border, #e5e7eb);
      white-space: nowrap;
      z-index: 1;
    }

    .items-table tbody tr {
      border-bottom: 1px solid var(--color-border, #e5e7eb);
      transition: background .1s;
    }
    .items-table tbody tr:last-child { border-bottom: none; }
    .items-table tbody tr:hover { background: #fafafa; }
    .items-table tbody tr.row--unavailable { opacity: .5; }

    .items-table td { padding: 8px 10px; vertical-align: middle; }

    /* Column widths */
    .col-item  { min-width: 140px; }
    .col-qty   { width: 80px; white-space: nowrap; color: #6b7280; }
    .col-price { width: 130px; }
    .col-total { width: 110px; white-space: nowrap; }
    .col-avail { width: 90px; }

    .item-name {
      display: block;
      font-weight: 600;
      color: var(--color-text-primary, #111827);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 200px;
    }
    .mono { font-family: var(--font-mono, monospace); font-size: 12px; }

    /* Price input */
    .price-wrap { display: flex; align-items: center; gap: 4px; }
    .price-prefix { font-size: 11px; color: #9ca3af; flex-shrink: 0; }
    .price-input {
      width: 100%;
      padding: 5px 7px;
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: 6px;
      font-size: 13px;
      font-family: var(--font-mono, monospace);
      color: var(--color-text-primary, #111827);
      background: var(--color-surface, #fff);
      outline: none;
      transition: border-color .12s;
      min-width: 0;
    }
    .price-input:focus { border-color: #4f46e5; box-shadow: 0 0 0 2px rgba(79,70,229,.1); }
    .price-input:disabled { background: #f3f4f6; cursor: not-allowed; }

    .total-value { font-weight: 700; color: #059669; font-size: 12px; }
    .total-empty { color: #d1d5db; }

    /* Availability buttons */
    .avail-group { display: flex; gap: 3px; }
    .avail-btn {
      width: 24px; height: 24px;
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: 5px;
      background: var(--color-surface, #fff);
      font-size: 11px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #9ca3af;
      transition: all .1s;
      padding: 0;
    }
    .avail-btn:hover { border-color: #a78bfa; color: #6d28d9; }
    .avail-btn--active { background: #ede9fe; border-color: #a78bfa; color: #6d28d9; }
    .avail-btn--order.avail-btn--active { background: #fef3c7; border-color: #fcd34d; color: #92400e; }
    .avail-btn--no.avail-btn--active { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }

    /* Total footer */
    .total-row { background: var(--color-surface-alt, #f9fafb); }
    .total-row__label {
      text-align: right;
      font-size: 11px;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: .05em;
      padding: 8px 10px;
    }
    .total-row__value {
      font-size: 14px;
      font-weight: 800;
      color: #059669;
      padding: 8px 10px;
    }

    /* Legend */
    .avail-legend {
      display: flex;
      gap: 14px;
      margin-top: 8px;
      margin-bottom: 14px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--color-border, #e5e7eb);
    }
    .avail-legend__item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #6b7280; }
    .avail-legend__dot {
      width: 8px; height: 8px; border-radius: 50%;
    }
    .avail-legend__dot--ok    { background: #6d28d9; }
    .avail-legend__dot--order { background: #92400e; }
    .avail-legend__dot--no    { background: #dc2626; }

    /* Delivery row */
    .delivery-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    /* Fields */
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field__label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: .04em; }
    .field__input {
      padding: 7px 10px;
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: 7px;
      font-size: 13px;
      font-family: inherit;
      color: var(--color-text-primary, #111827);
      background: var(--color-surface, #fff);
      outline: none;
      width: 100%;
      box-sizing: border-box;
      transition: border-color .12s;
    }
    .field__input:focus { border-color: #4f46e5; box-shadow: 0 0 0 2px rgba(79,70,229,.1); }
    .field__textarea {
      padding: 7px 10px;
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: 7px;
      font-size: 13px;
      font-family: inherit;
      color: var(--color-text-primary, #111827);
      background: var(--color-surface, #fff);
      resize: vertical;
      outline: none;
      width: 100%;
      box-sizing: border-box;
    }
    .field__textarea:focus { border-color: #4f46e5; box-shadow: 0 0 0 2px rgba(79,70,229,.1); }

    /* Submit */
    .submit-error {
      margin-top: 10px;
      padding: 8px 12px;
      background: #fef2f2;
      color: #dc2626;
      border-radius: 7px;
      font-size: 12px;
    }
    .submit-hint { margin-top: 6px; font-size: 11px; color: #9ca3af; text-align: center; }

    /* Success */
    .success-card {
      background: var(--color-surface, #fff);
      border: 1px solid #a7f3d0;
      border-radius: 12px;
      padding: 32px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    .success-card__icon { font-size: 40px; }
    .success-card h3 { font-size: 16px; font-weight: 700; color: #065f46; margin: 0; }
    .success-card p { font-size: 13px; color: #6b7280; margin: 0; }

    /* Responsive */
    @media (max-width: 900px) {
      .page-layout { grid-template-columns: 1fr; }
      .col-info { flex-direction: row; flex-wrap: wrap; }
      .col-info .card { flex: 1; min-width: 240px; }
      .col-info .map-wrap { flex: 1; min-width: 240px; }
    }
    @media (max-width: 600px) {
      .delivery-row { grid-template-columns: 1fr; }
      .col-info { flex-direction: column; }
      .items-table-wrap { max-height: none; overflow: visible; }
    }
  `],
  styleUrl: './available-order-detail.component.scss',
})
export class AvailableOrderDetailComponent implements OnInit {
  private readonly route        = inject(ActivatedRoute);
  private readonly proposalsApi = inject(ProposalsApiService);

  protected readonly distribution  = signal<ReceivedDistribution | null>(null);
  protected readonly proposalItems = signal<ProposalItemForm[]>([]);
  protected readonly isLoading     = signal(false);
  protected readonly isSaving      = signal(false);
  protected readonly error         = signal<string | null>(null);
  protected readonly submitted     = signal(false);
  protected readonly submitError   = signal<string | null>(null);

  protected deliveryEtaHours   = '';
  protected proposedDeliveryAt = '';
  protected proposalMessage    = '';

  protected readonly mapConfig: MapConfig = {
    zoomControl: false, dragging: false, scrollWheelZoom: false,
    tileStyle: 'positron', markerSize: 24, markerTail: true,
    markerColor: '#4F46E5', fitBounds: false, attribution: false,
    borderRadius: '10px',
  };

  ngOnInit(): void {
    const distributionId = this.route.snapshot.paramMap.get('id') ?? '';
    this.isLoading.set(true);

    this.proposalsApi.listReceived().subscribe({
      next: dists => {
        const found = dists.find(d => d.id === distributionId) ?? null;
        this.distribution.set(found);
        if (found?.order?.items) {
          this.proposalItems.set(
            found.order.items.map(item => ({
              orderItemId:  item.id,
              description:  item.description,
              quantity:     Number(item.quantity),
              unit:         item.unit,
              unitPrice:    null,
              totalPrice:   null,
              availability: 'in_stock',
            }))
          );
        }
        this.isLoading.set(false);
        if (!found) this.error.set('Distribuição não encontrada.');
      },
      error: () => {
        this.error.set('Erro ao carregar pedido.');
        this.isLoading.set(false);
      },
    });
  }

  protected recalcTotal(index: number): void {
    const items = [...this.proposalItems()];
    const row   = { ...items[index] };
    row.totalPrice = (row.unitPrice != null && row.unitPrice > 0 && row.quantity > 0)
      ? parseFloat((row.unitPrice * row.quantity).toFixed(2))
      : null;
    items[index] = row;
    this.proposalItems.set(items);
  }

  protected setAvailability(index: number, value: Availability): void {
    const items = [...this.proposalItems()];
    items[index] = { ...items[index], availability: value };
    if (value === 'unavailable') {
      items[index].unitPrice  = null;
      items[index].totalPrice = null;
    }
    this.proposalItems.set(items);
  }

  protected readonly grandTotal = computed(() => {
    const sum = this.proposalItems().reduce((acc, row) =>
      acc + (row.availability !== 'unavailable' && row.totalPrice ? row.totalPrice : 0), 0);
    return sum > 0 ? sum : null;
  });

  protected readonly canSubmit = computed(() => {
    if (this.submitted() || this.proposalItems().length === 0) return false;
    return this.proposalItems().every(
      item => item.availability === 'unavailable' || (item.unitPrice != null && item.unitPrice > 0),
    );
  });

  protected submitProposal(): void {
    if (!this.canSubmit()) return;
    const dist = this.distribution();
    if (!dist) return;

    this.isSaving.set(true);
    this.submitError.set(null);

    const payload: SubmitProposalPayload = {
      status:             'submitted',
      deliveryEtaHours:   this.deliveryEtaHours ? parseInt(this.deliveryEtaHours, 10) : null,
      proposedDeliveryAt: this.proposedDeliveryAt ? new Date(this.proposedDeliveryAt).toISOString() : null,
      message:            this.proposalMessage || null,
      items: this.proposalItems().map(row => ({
        orderItemId:  row.orderItemId,
        unitPrice:    row.unitPrice  ?? 0,
        totalPrice:   row.totalPrice ?? 0,
        availability: row.availability,
      })),
    };

    this.proposalsApi.submitToDistribution(dist.id, payload).subscribe({
      next:  () => { this.submitted.set(true); this.isSaving.set(false); },
      error: () => {
        this.submitError.set('Erro ao enviar proposta. Verifique os dados e tente novamente.');
        this.isSaving.set(false);
      },
    });
  }
}
