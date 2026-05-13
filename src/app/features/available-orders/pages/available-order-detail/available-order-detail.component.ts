import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PageHeaderComponent }  from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ButtonComponent }      from '../../../../shared/components/button/button.component';
import { InputComponent }       from '../../../../shared/components/input/input.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MapComponent, MapConfig } from '@shared';
import { OrdersApiService } from 'src/app/core/services/api';

export type ProposalItemAvailability = 'in_stock' | 'backorder' | 'unavailable';

interface OrderItem {
  id:          string;
  description: string;
  quantity:    string;
  unit:        string;
}

interface OrderDetail {
  id:              string;
  referenceCode:   string | null;
  status:          'open' | 'in_auction';
  isUrgent:        boolean;
  deliveryCity:    string | null;
  deliveryState:   string | null;
  deliveryAddress: string;
  items:           OrderItem[];
  proposalCount:   number;
  expiresAt?:      string | null;
  createdAt:       string;
  notes?:          string | null;
}

interface ProposalItemForm {
  orderItemId:  string;
  unitPrice:    string;
  totalPrice:   string;
  availability: ProposalItemAvailability;
}

const MOCK_ORDER: OrderDetail = {
  id:              '1',
  referenceCode:   '#EDQ-2024-0042',
  status:          'in_auction',
  isUrgent:        true,
  deliveryCity:    'Indaiatuba',
  deliveryState:   'SP',
  deliveryAddress: 'Rua das Palmeiras, 500 — Indaiatuba, SP',
  items: [
    { id: 'item-1', description: 'Cimento CP-II',   quantity: '50',  unit: 'sacos' },
    { id: 'item-2', description: 'Areia média',     quantity: '10',  unit: 'm³' },
    { id: 'item-3', description: 'Brita 1',         quantity: '5',   unit: 'm³' },
    { id: 'item-4', description: 'Vergalhão CA-50', quantity: '200', unit: 'kg' },
  ],
  proposalCount: 3,
  expiresAt:     '2024-01-16T18:00:00Z',
  createdAt:     '2024-01-15T10:00:00Z',
  notes:         'Entrega obrigatória no período da manhã. Acesso pelo portão lateral.',
};

@Component({
  selector: 'edq-available-order-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, FormsModule, PageHeaderComponent, StatusBadgeComponent, ButtonComponent, InputComponent, MapComponent, InputComponent],
  template: `
    <edq-page-header
      [title]="order()?.referenceCode ?? order()?.title "
      subtitle="Detalhes do pedido disponível"
    >
      <edq-button slot="actions" variant="ghost" size="sm" routerLink="/app/available-orders">
        ← Voltar
      </edq-button>
    </edq-page-header>

    <div class="address-map-preview">
      <edq-map
        [lat]="previewLat()"
        [lng]="previewLng()"
        [height]="220"
        [zoom]="15"
        [config]="previewMapConfig"
        ariaLabel="Preview do endereço"
      />
    </div>

    <div class="detail-layout">

      <!-- ── Coluna Principal ─────────────────────────────── -->
      <div class="detail-main">

        <div class="detail-card">
          <div class="detail-card__header">
            <h2 class="detail-card__title">Informações do Pedido</h2>
            <div class="detail-card__badges">
              <edq-status-badge [status]="order()?.status ?? 'PENDING'" />
              @if (order()?.isUrgent) {
                <span class="badge-urgent">URGENTE</span>
              }
            </div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <span class="info-item__label">Local de Entrega</span>
              <span class="info-item__value">📍 {{ order()?.deliveryAddress }}</span>
            </div>
            <div class="info-item">
              <span class="info-item__label">Cidade</span>
              <span class="info-item__value">{{ order()?.deliveryCity }}, {{ order()?.deliveryState }}</span>
            </div>
            <div class="info-item">
              <span class="info-item__label">Propostas Recebidas</span>
              <span class="info-item__value">{{ order()?.proposalCount ?? 0 }}</span>
            </div>
            <div class="info-item">
              <span class="info-item__label">Publicado em</span>
              <span class="info-item__value">{{ order()?.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div class="info-item info-item--full">
              <span class="info-item__label">Observações</span>
              <span class="info-item__value">{{ order()?.notes ?? 'Sem detalhes' }}</span>
            </div>
          </div>
        </div>

        <div class="detail-card">
          <h2 class="detail-card__title">Itens Solicitados</h2>
          <div class="table-wrapper" style="margin-top: 18px;">
            <table class="data-table" aria-label="Itens do pedido">
              <thead>
                <tr>
                  <th scope="col">Descrição</th>
                  <th scope="col">Quantidade</th>
                  <th scope="col">Unidade</th>
                </tr>
              </thead>
              <tbody>
                @for (item of order()?.items; track item.description) {
                  <tr class="table-row">
                    <td class="item-desc">{{ item.description }}</td>
                    <td class="mono">{{ item.quantity }}</td>
                    <td class="unit-cell">{{ item.unit }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ── Coluna Lateral: Enviar Proposta ──────────────── -->
      <aside class="detail-aside">
        <div class="proposal-form-card">
          <h2 class="proposal-form-card__title">Enviar Proposta</h2>
          <p class="proposal-form-card__sub">Preencha os preços e disponibilidade para cada item</p>

          <!-- Tabela de itens com preços -->
          <div class="proposal-items-section">
            <div class="table-wrapper">
              <table class="data-table proposal-items-table" aria-label="Preços dos itens da proposta">
                <thead>
                  <tr>
                    <th scope="col">Item</th>
                    <th scope="col">Qtd</th>
                    <th scope="col">Preço Unit. (R$)</th>
                    <th scope="col">Total (R$)</th>
                    <th scope="col">Disponibilidade</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of order()?.items; track item.id; let i = $index) {
                    <tr class="table-row proposal-item-row">
                      <td class="item-desc">{{ item.description }}</td>
                      <td class="mono">{{ item.quantity }} {{ item.unit }}</td>
                      <td class="price-cell">
                        <input
                          type="number"
                          class="price-input"
                          placeholder="0,00"
                          min="0"
                          step="0.01"
                          [(ngModel)]="proposalItems()[i].unitPrice"
                          (ngModelChange)="recalcTotal(i)"
                          [attr.aria-label]="'Preço unitário de ' + item.description"
                        />
                      </td>
                      <td class="mono total-cell">
                        {{ proposalItems()[i].totalPrice ? 'R$ ' + proposalItems()[i].totalPrice : '—' }}
                      </td>
                      <td class="availability-cell">
                        <select
                          class="availability-select"
                          [(ngModel)]="proposalItems()[i].availability"
                          [attr.aria-label]="'Disponibilidade de ' + item.description"
                        >
                          <option value="in_stock">Disponível</option>
                          <option value="backorder">Em espera</option>
                          <option value="unavailable">Indisponível</option>
                        </select>
                      </td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td colspan="3" class="total-label">Total Geral</td>
                    <td class="mono total-value">{{ grandTotal() ? 'R$ ' + grandTotal() : '—' }}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Prazo de entrega -->
          <div class="form-row" style="margin-top: 16px;">
            <div class="form-group">
              <label class="form-label" for="delivery-eta-hours">Prazo (horas)</label>
              <edq-input
                id="delivery-eta-hours"
                type="number"
                placeholder="Ex: 48"
                [(value)]="deliveryEtaHours"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="proposed-delivery-at">Data prevista de entrega</label>
              <input
                id="proposed-delivery-at"
                type="datetime-local"
                class="datetime-input"
                [(ngModel)]="proposedDeliveryAt"
                [attr.aria-label]="'Data e hora prevista de entrega'"
              />
            </div>
          </div>

          <!-- Observações -->
          <div class="form-group" style="margin-top: 12px;">
            <label class="form-label" for="proposal-message">Mensagem (opcional)</label>
            <textarea
              id="proposal-message"
              class="textarea"
              rows="3"
              placeholder="Condições de pagamento, detalhes da entrega, observações..."
              [(ngModel)]="proposalMessage"
            ></textarea>
          </div>

          <edq-button
            variant="primary"
            size="md"
            (click)="submitProposal()"
            [disabled]="!canSubmit()"
            style="margin-top: 16px; width: 100%;"
          >
            Enviar Proposta
          </edq-button>

          @if (submitted()) {
            <div class="success-message" role="alert" style="margin-top: 18px;">✅ Proposta enviada com sucesso!</div>
          }

          @if (submitError()) {
            <div class="error-message" role="alert">❌ {{ submitError() }}</div>
          }
        </div>
      </aside>
    </div>
  `,
  styleUrl: './available-order-detail.component.scss',
})
export class AvailableOrderDetailComponent {
  private readonly route            = inject(ActivatedRoute);
  private readonly router           = inject(Router);
  private readonly ordersApiService = inject(OrdersApiService);

  protected readonly previewLat  = signal(-23.5505);
  protected readonly previewLng  = signal(-46.6333);
  protected readonly submitted   = signal(false);
  protected readonly submitError = signal<string | null>(null);

  protected readonly previewMapConfig: MapConfig = {
    zoomControl: true, dragging: true, scrollWheelZoom: true,
    tileStyle: 'positron', markerSize: 32, markerTail: true,
    markerColor: '#4F46E5', fitBounds: false, attribution: false,
    borderRadius: 'var(--radius-lg)',
  };

  private readonly paramMap = toSignal(
    this.route.paramMap.pipe(map(params => ({ id: params.get('id') }))),
    { initialValue: { id: null } },
  );
  readonly id = computed(() => this.paramMap().id ?? '');

  order = signal<any | null>(MOCK_ORDER);

  /** Reactive list of form rows — one per order item */
  proposalItems = signal<ProposalItemForm[]>(
    MOCK_ORDER.items.map(item => ({
      orderItemId:  item.id,
      unitPrice:    '',
      totalPrice:   '',
      availability: 'in_stock' as ProposalItemAvailability,
    }))
  );

  protected deliveryEtaHours   = '';
  protected proposedDeliveryAt = '';
  protected proposalMessage    = '';

  private distribuitions = toSignal(
    this.ordersApiService.listDistributions(this.id())
  )

  /** Recalculate totalPrice for a given row when unitPrice changes */
  recalcTotal(index: number): void {
    const currentOrder = this.order();
    if (!currentOrder) return;

    const items    = [...this.proposalItems()];
    const row      = { ...items[index] };
    const quantity = parseFloat(currentOrder.items[index]?.quantity ?? '0');
    const unit     = parseFloat(row.unitPrice);

    if (!isNaN(unit) && !isNaN(quantity) && unit > 0) {
      row.totalPrice = (unit * quantity).toFixed(2);
    } else {
      row.totalPrice = '';
    }

    items[index] = row;
    this.proposalItems.set(items);
  }

  /** Sum of all rows that have a valid totalPrice */
  protected readonly grandTotal = computed(() => {
    const sum = this.proposalItems().reduce((acc, row) => {
      const val = parseFloat(row.totalPrice);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    return sum > 0 ? sum.toFixed(2) : '';
  });

  protected readonly canSubmit = computed(() => {
    if (this.submitted()) return false;
    const allHavePrice = this.proposalItems().every(
      item => item.availability === 'unavailable' || !!item.unitPrice
    );
    return allHavePrice;
  });

  protected submitProposal(): void {
    if (!this.canSubmit()) return;

    const payload = {
      status:             'submitted' as const,
      deliveryEtaHours:   this.deliveryEtaHours ? parseInt(this.deliveryEtaHours, 10) : null,
      proposedDeliveryAt: this.proposedDeliveryAt
        ? new Date(this.proposedDeliveryAt).toISOString()
        : null,
      message: this.proposalMessage || null,
      items: this.proposalItems().map(row => ({
        orderItemId:  row.orderItemId,
        unitPrice:    parseFloat(row.unitPrice)  || 0,
        totalPrice:   parseFloat(row.totalPrice) || 0,
        availability: row.availability,
      })),
    };

    console.log('[AvailableOrderDetail] Submitting proposal:', payload);

    // TODO: integrar com ProposalsApiService
    this.ordersApiService.createProposal(this.id(), payload).subscribe()
    this.submitted.set(true);
  }

  constructor() {
    this.ordersApiService.findById(this.id()).subscribe({
      next: (order: any) => {
        console.log(order);
        this.order.set(order);
        // Reset proposal items whenever order data arrives
        this.proposalItems.set(
          (order.items ?? []).map((item: OrderItem) => ({
            orderItemId:  item.id,
            unitPrice:    '',
            totalPrice:   '',
            availability: 'AVAILABLE' as ProposalItemAvailability,
          }))
        );
      },
    });
  }
}