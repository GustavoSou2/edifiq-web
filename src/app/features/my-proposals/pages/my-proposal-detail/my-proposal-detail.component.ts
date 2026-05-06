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
  id:              string;
  orderId:         string;
  deliveryCity:    string;
  deliveryAddress: string;
  totalPrice:      number;
  deliveryMin:     number;
  status:          ProposalStatus;
  submittedAt:     string;
  expiresAt?:      string | null;
  notes?:          string | null;
  items: { description: string; quantity: string; unit: string }[];
}

const MOCK_PROPOSAL: ProposalDetail = {
  id:              'p1',
  orderId:         '#EDQ-2024-0042',
  deliveryCity:    'Indaiatuba',
  deliveryAddress: 'Rua das Palmeiras, 500 — Indaiatuba, SP',
  totalPrice:      4800,
  deliveryMin:     2880,
  status:          'submitted',
  submittedAt:     '2024-01-15T10:00:00Z',
  expiresAt:       '2024-01-16T18:00:00Z',
  notes:           'Entrega disponível no período da manhã. Frete incluso no valor.',
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
      [title]="proposal.orderId"
      subtitle="Detalhes da proposta enviada"
    >
      <edq-button slot="actions" variant="ghost" size="sm" routerLink="/app/my-proposals">
        ← Voltar
      </edq-button>
    </edq-page-header>

    <div class="detail-layout">

      <div class="detail-main">

        <div class="status-banner" [class]="'status-banner--' + proposal.status">
          <edq-status-badge [status]="proposal.status" />
          <span class="status-banner__text">{{ statusMessage() }}</span>
        </div>

        <div class="detail-card">
          <h2 class="detail-card__title">Sua Proposta</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-item__label">Valor Total</span>
              <span class="info-item__value info-item__value--price">
                {{ proposal.totalPrice | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-item__label">Prazo de Entrega</span>
              <span class="info-item__value">{{ proposal.deliveryMin }} min</span>
            </div>
            <div class="info-item">
              <span class="info-item__label">Enviada em</span>
              <span class="info-item__value">{{ proposal.submittedAt | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            @if (proposal.expiresAt) {
              <div class="info-item">
                <span class="info-item__label">Expira em</span>
                <span class="info-item__value">{{ proposal.expiresAt | date:'dd/MM/yyyy HH:mm' }}</span>
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

        <div class="detail-card">
          <h2 class="detail-card__title">Pedido Relacionado</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-item__label">Local de Entrega</span>
              <span class="info-item__value">📍 {{ proposal.deliveryAddress }}</span>
            </div>
            <div class="info-item">
              <span class="info-item__label">Cidade</span>
              <span class="info-item__value">{{ proposal.deliveryCity }}</span>
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

      <aside class="detail-aside">
        <div class="action-card">
          <h3 class="action-card__title">Ações</h3>

          @if (proposal.status === 'submitted') {
            <p class="action-card__hint">Sua proposta está aguardando avaliação do comprador.</p>
            <edq-button variant="danger" size="md">Retirar Proposta</edq-button>
          }

          @if (proposal.status === 'accepted') {
            <p class="action-card__hint success">🎉 Sua proposta foi aceita! Prepare-se para a entrega.</p>
            <edq-button variant="primary" size="md" routerLink="/app/deliveries">Ver Entregas</edq-button>
          }

          @if (proposal.status === 'rejected') {
            <p class="action-card__hint">Sua proposta não foi selecionada desta vez.</p>
            <edq-button variant="primary" size="md" routerLink="/app/available-orders">Ver Novos Pedidos</edq-button>
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
