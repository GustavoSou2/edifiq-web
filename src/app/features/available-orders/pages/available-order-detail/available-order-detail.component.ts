import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PageHeaderComponent }  from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ButtonComponent }      from '../../../../shared/components/button/button.component';
import { InputComponent }       from '../../../../shared/components/input/input.component';

interface OrderItem {
  description: string;
  quantity:    string;
  unit:        string;
}

interface OrderDetail {
  id:             string;
  reference_code: string;
  status:         'open' | 'in_auction';
  is_urgent:      boolean;
  delivery_city:  string;
  delivery_state: string;
  delivery_address: string;
  items:          OrderItem[];
  buyer_name:     string;
  proposal_count: number;
  auction_ends_at?: string;
  created_at:     string;
  notes?:         string;
}

const MOCK_ORDER: OrderDetail = {
  id: '1',
  reference_code: '#EDQ-2024-0042',
  status: 'in_auction',
  is_urgent: true,
  delivery_city: 'Indaiatuba',
  delivery_state: 'SP',
  delivery_address: 'Rua das Palmeiras, 500 — Indaiatuba, SP',
  items: [
    { description: 'Cimento CP-II',    quantity: '50',  unit: 'sacos' },
    { description: 'Areia média',      quantity: '10',  unit: 'm³' },
    { description: 'Brita 1',          quantity: '5',   unit: 'm³' },
    { description: 'Vergalhão CA-50',  quantity: '200', unit: 'kg' },
  ],
  buyer_name:     'Construtora Alpha',
  proposal_count: 3,
  auction_ends_at: '2024-01-16T18:00:00Z',
  created_at: '2024-01-15T10:00:00Z',
  notes: 'Entrega obrigatória no período da manhã. Acesso pelo portão lateral.',
};

@Component({
  selector: 'edq-available-order-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, FormsModule, PageHeaderComponent, StatusBadgeComponent, ButtonComponent, InputComponent, CommonModule],
  template: `
    <edq-page-header
      [title]="order.reference_code"
      subtitle="Detalhes do pedido disponível"
    >
      <edq-button slot="actions" variant="ghost" size="sm" routerLink="/app/available-orders">
        ← Voltar
      </edq-button>
    </edq-page-header>

    <div class="detail-layout">

      <!-- ── Coluna Principal ─────────────────────────────── -->
      <div class="detail-main">

        <!-- Info do pedido -->
        <div class="detail-card">
          <div class="detail-card__header">
            <h2 class="detail-card__title">Informações do Pedido</h2>
            <div class="detail-card__badges">
              <edq-status-badge [status]="order.status" />
              @if (order.is_urgent) {
                <span class="badge-urgent">URGENTE</span>
              }
            </div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <span class="info-item__label">Comprador</span>
              <span class="info-item__value">{{ order.buyer_name }}</span>
            </div>
            <div class="info-item">
              <span class="info-item__label">Local de Entrega</span>
              <span class="info-item__value">📍 {{ order.delivery_address }}</span>
            </div>
            <div class="info-item">
              <span class="info-item__label">Propostas Recebidas</span>
              <span class="info-item__value">{{ order.proposal_count }}</span>
            </div>
            <div class="info-item">
              <span class="info-item__label">Publicado em</span>
              <span class="info-item__value">{{ order.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            @if (order.auction_ends_at) {
              <div class="info-item info-item--highlight">
                <span class="info-item__label">⏱️ Leilão encerra em</span>
                <span class="info-item__value">{{ order.auction_ends_at | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
            }
            @if (order.notes) {
              <div class="info-item info-item--full">
                <span class="info-item__label">Observações</span>
                <span class="info-item__value">{{ order.notes }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Itens do pedido -->
        <div class="detail-card">
          <h2 class="detail-card__title">Itens Solicitados</h2>
          <div class="table-wrapper">
            <table class="data-table" aria-label="Itens do pedido">
              <thead>
                <tr>
                  <th scope="col">Descrição</th>
                  <th scope="col">Quantidade</th>
                  <th scope="col">Unidade</th>
                </tr>
              </thead>
              <tbody>
                @for (item of order.items; track item.description) {
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
          <p class="proposal-form-card__sub">Preencha os dados para participar deste pedido</p>

          <div class="form-group">
            <label class="form-label" for="total-price">Valor Total (R$)</label>
            <edq-input
              id="total-price"
              type="number"
              placeholder="0,00"
              [(value)]="proposalPrice"
            >
              <span slot="prefix">R$</span>
            </edq-input>
          </div>

          <div class="form-group">
            <label class="form-label" for="delivery-days">Prazo de Entrega (dias)</label>
            <edq-input
              id="delivery-days"
              type="number"
              placeholder="Ex: 3"
              [(value)]="deliveryDays"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="notes">Observações (opcional)</label>
            <textarea
              id="notes"
              class="textarea"
              rows="3"
              placeholder="Condições de pagamento, detalhes da entrega..."
              [(ngModel)]="proposalNotes"
            ></textarea>
          </div>

          <edq-button
            variant="primary"
            size="md"
            [disabled]="!canSubmit()"
            (click)="submitProposal()"
          >
            Enviar Proposta
          </edq-button>

          @if (submitted()) {
            <div class="success-message" role="alert">
              ✅ Proposta enviada com sucesso!
            </div>
          }
        </div>
      </aside>
    </div>
  `,
  styleUrl: './available-order-detail.component.scss',
})
export class AvailableOrderDetailComponent {
  protected readonly order = MOCK_ORDER;

  protected proposalPrice = '';
  protected deliveryDays  = '';
  protected proposalNotes = '';
  protected readonly submitted = signal(false);

  protected readonly canSubmit = computed(
    () => !!this.proposalPrice && !!this.deliveryDays && !this.submitted(),
  );

  protected submitProposal(): void {
    if (!this.canSubmit()) return;
    // TODO: integrar com API
    this.submitted.set(true);
  }
}
