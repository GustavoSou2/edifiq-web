import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'edq-proposal-compare',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeaderComponent, StatusBadgeComponent, ButtonComponent],
  template: `
    <edq-page-header title="Comparar Propostas" subtitle="Pedido #EDQ-2024-0042 · 3 propostas recebidas">
      <edq-button slot="actions" variant="secondary" size="sm" routerLink="../">← Voltar ao Pedido</edq-button>
    </edq-page-header>

    <!-- Timer -->
    <div class="auction-banner">
      <span class="auction-banner__icon">🔴</span>
      <span class="auction-banner__text">Leilão em andamento</span>
      <span class="auction-timer">⏱ 42:15</span>
    </div>

    <!-- Proposal cards -->
    <div class="proposals-grid">
      @for (proposal of proposals(); track proposal.id; let i = $index) {
        <div class="proposal-card" [class.proposal-card--best]="i === 0">
          @if (i === 0) {
            <div class="best-badge">⭐ Melhor Oferta</div>
          }

          <div class="proposal-card__supplier">
            <div class="supplier-avatar">{{ proposal.supplierInitials }}</div>
            <div>
              <div class="supplier-name">{{ proposal.supplierName }}</div>
              <div class="supplier-rep">
                <span class="rep-stars">{{ proposal.stars }}</span>
                <span class="rep-score" [class]="'rep-score--' + proposal.repClass">{{ proposal.score }}</span>
                <span class="rep-count">({{ proposal.ratings }})</span>
              </div>
            </div>
          </div>

          <div class="proposal-metrics">
            <div class="metric">
              <span class="metric__label">Preço Total</span>
              <span class="metric__value metric__value--price">
                R$ {{ proposal.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
              </span>
            </div>
            <div class="metric">
              <span class="metric__label">Prazo de Entrega</span>
              <span class="metric__value">{{ proposal.deliveryLabel }}</span>
            </div>
            <div class="metric">
              <span class="metric__label">Itens disponíveis</span>
              <span class="metric__value">{{ proposal.availableItems }}/{{ proposal.totalItems }}</span>
            </div>
          </div>

          <edq-status-badge [status]="proposal.status" />

          <edq-button
            [variant]="i === 0 ? 'primary' : 'secondary'"
            [fullWidth]="true"
            (clicked)="selectProposal(proposal.id)"
            [loading]="selecting() === proposal.id"
          >
            {{ i === 0 ? '✓ Escolher Esta Proposta' : 'Selecionar' }}
          </edq-button>
        </div>
      }
    </div>

    <!-- Tabela comparativa por item -->
    <section class="compare-section">
      <h2 class="compare-section__title">Comparativo por Item</h2>

      <div class="compare-table-wrapper">
        <table class="compare-table" aria-label="Comparativo de preços por item">
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Qtd</th>
              @for (p of proposals(); track p.id) {
                <th scope="col">{{ p.supplierName }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (item of compareItems(); track item.id) {
              <tr>
                <td>{{ item.description }}</td>
                <td class="mono">{{ item.quantity }} {{ item.unit }}</td>
                @for (price of item.prices; track $index) {
                  <td class="price-cell" [class.price-cell--best]="price.isBest">
                    @if (price.available) {
                      R$ {{ price.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
                      @if (price.isBest) { <span class="best-mark">↓</span> }
                    } @else {
                      <span class="unavailable">Indisponível</span>
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
  styleUrl: './proposal-compare.component.scss',
})
export class ProposalCompareComponent {
  protected readonly selecting = signal<string | null>(null);

  protected readonly proposals = signal([
    { id: 'p1', supplierName: 'Depósito Central Ltda', supplierInitials: 'DC', stars: '★★★★★', score: '4.8', repClass: 'high', ratings: 203, price: 1250.00, deliveryLabel: '2 horas', availableItems: 3, totalItems: 3, status: 'submitted' as const },
    { id: 'p2', supplierName: 'Materiais São Paulo',   supplierInitials: 'MS', stars: '★★★★☆', score: '4.2', repClass: 'mid',  ratings: 87,  price: 1380.00, deliveryLabel: '4 horas', availableItems: 3, totalItems: 3, status: 'submitted' as const },
    { id: 'p3', supplierName: 'Construfácil',          supplierInitials: 'CF', stars: '★★★☆☆', score: '3.1', repClass: 'low',  ratings: 34,  price: 1190.00, deliveryLabel: '6 horas', availableItems: 2, totalItems: 3, status: 'submitted' as const },
  ]);

  protected readonly compareItems = signal([
    { id: 'i1', description: 'Cimento CP-II 50kg', quantity: 20, unit: 'saco', prices: [
      { value: 28.50, available: true,  isBest: true  },
      { value: 31.00, available: true,  isBest: false },
      { value: 27.00, available: true,  isBest: false },
    ]},
    { id: 'i2', description: 'Areia média lavada', quantity: 5, unit: 'm³', prices: [
      { value: 180.00, available: true,  isBest: false },
      { value: 175.00, available: true,  isBest: true  },
      { value: 0,      available: false, isBest: false },
    ]},
    { id: 'i3', description: 'Bloco cerâmico 9x19x19', quantity: 500, unit: 'un', prices: [
      { value: 1.20, available: true,  isBest: true  },
      { value: 1.35, available: true,  isBest: false },
      { value: 0,    available: false, isBest: false },
    ]},
  ]);

  async selectProposal(id: string): Promise<void> {
    this.selecting.set(id);
    await new Promise(r => setTimeout(r, 1200));
    this.selecting.set(null);
    // TODO: navegar para confirmação
  }
}
