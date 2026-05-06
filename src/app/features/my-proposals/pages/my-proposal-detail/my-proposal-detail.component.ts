import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';

import { PageHeaderComponent }  from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ButtonComponent }      from '../../../../shared/components/button/button.component';
import { ProposalStatus }       from '../../../../shared/types/domain.types';

interface ProposalDetail {
  id:            string;
  order_ref:     string;
  buyer_name:    string;
  delivery_city: string;
  delivery_address: string;
  total_price:   number;
  delivery_days: number;
  status:        ProposalStatus;
  submitted_at:  string;
  expires_at?:   string;
  notes?:        string;
  items: { description: string; quantity: string; unit: string }[];
}

const MOCK_PROPOSAL: ProposalDetail = {
  id:            'p1',
  order_ref:     '#EDQ-2024-0042',
  buyer_name:    'Construtora Alpha',
  delivery_city: 'Indaiatuba',
  delivery_address: 'Rua das Palmeiras, 500 — Indaiatuba, SP',
  total_price:   4800,
  delivery_days: 2,
  status:        'submitted',
  submitted_at:  '2024-01-15T10:00:00Z',
  expires_at:    '2024-01-16T18:00:00Z',
  notes:         'Entrega disponível no período da manhã. Frete incluso no valor.',
  items: [
    { description: 'Cimento CP-II',   quantity: '50',  unit: 'sacos' },
    { description: 'Areia média',     quantity: '10',  unit: 'm³' },
    { description: 'Brita 1',         quantity: '5',   unit: 'm³' },
    { description: 'Vergalhão CA-50', quantity: '200', unit: 'kg' },
  ],
};

@Component({
  selector: 'edq-my-proposal-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CurrencyPipe, DatePipe, PageHeaderComponent, StatusBadgeComponent, ButtonComponent],
  template: `
    <edq-page-header
      [title]="proposal.order_ref"
      subtitle="Detalhes da proposta enviada"
    >
      <edq-button slot="actions" variant="ghost" size="sm" routerLink="/app/my-proposals">
        ← Voltar
      </edq-button>
    </edq-page-header>

    <div class="detail-layout">

      <!-- ── Coluna Principal ─────────────────────────────── -->
      <div class="detail-main">

        <!-- Status da proposta -->
        <div class="status-banner" [class]="'status-banner--' + proposal.status">
          <edq-status-badge [status]="proposal.status" />
          <span class="status-banner__text">{{ statusMessage() }}</span>
        </div>

        <!-- Dados da proposta -->
        <div class="detail-card">
          <h2 class="detail-card__title">Sua Proposta</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-item__label">Valor Total</span>
              <span class="info-item__value info-item__value--price">
                {{ proposal.total_price | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-item__label">Prazo de Entrega</span>
              <span class="info-item__value">{{ proposal.delivery_days }} dia{{ proposal.delivery_days !== 1 ? 's' : '' }}</span>
            </div>
            <div class="info-item">
              <span class="info-item__label">Enviada em</span>
              <span class="info-item__value">{{ proposal.submitted_at | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            @if (proposal.expires_at) {
              <div class="info-item">
                <span class="info-item__label">Expira em</span>
                <span class="info-item__value">{{ proposal.expires_at | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
            }
            @if (proposal.notes) {
              <div class="info-item info-item--full">
                <span class="info-item__label">Observações</span>
                <span class="info-item__value">{{ proposal.notes }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Pedido relacionado -->
        <div class="detail-card">
          <h2 class="detail-card__title">Pedido Relacionado</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-item__label">Comprador</span>
              <span class="info-item__value">{{ proposal.buyer_name }}</span>
            </div>
            <div class="info-item">
              <span class="info-item__label">Local de Entrega</span>
              <span class="info-item__value">📍 {{ proposal.delivery_address }}</span>
            </div>
          </div>

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
                @for (item of proposal.items; track item.description) {
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

      <!-- ── Coluna Lateral ───────────────────────────────── -->
      <aside class="detail-aside">
        <div class="action-card">
          <h3 class="action-card__title">Ações</h3>

          @if (proposal.status === 'submitted') {
            <p class="action-card__hint">Sua proposta está aguardando avaliação do comprador.</p>
            <edq-button variant="danger" size="md">Retirar Proposta</edq-button>
          }

          @if (proposal.status === 'accepted') {
            <p class="action-card__hint success">🎉 Sua proposta foi aceita! Prepare-se para a entrega.</p>
            <edq-button variant="primary" size="md" routerLink="/app/deliveries">
              Ver Entregas
            </edq-button>
          }

          @if (proposal.status === 'rejected') {
            <p class="action-card__hint">Sua proposta não foi selecionada desta vez.</p>
            <edq-button variant="primary" size="md" routerLink="/app/available-orders">
              Ver Novos Pedidos
            </edq-button>
          }
        </div>
      </aside>
    </div>
  `,
  styleUrl: './my-proposal-detail.component.scss',
})
export class MyProposalDetailComponent {
  protected readonly proposal = MOCK_PROPOSAL;

  protected statusMessage(): string {
    const messages: Record<ProposalStatus, string> = {
      pending:   'Proposta em rascunho',
      submitted: 'Aguardando avaliação do comprador',
      accepted:  'Parabéns! Sua proposta foi aceita',
      rejected:  'Proposta não selecionada',
      expired:   'Proposta expirada',
      withdrawn: 'Proposta retirada por você',
    };
    return messages[this.proposal.status] ?? '';
  }
}
