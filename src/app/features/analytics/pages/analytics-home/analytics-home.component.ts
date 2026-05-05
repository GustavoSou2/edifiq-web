import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

interface StatCard {
  label:  string;
  value:  string;
  icon:   string;
  trend?: string;
}

interface SupplierPerf {
  name:        string;
  orders:      number;
  avg_price:   string;
  reputation:  number;
  accept_rate: string;
}

interface CategorySaving {
  category: string;
  saving:   number;
  total:    number;
}

const STAT_CARDS: StatCard[] = [
  { label: 'Economia Total',            value: 'R$ 42.800', icon: '💰', trend: '+12% este mês' },
  { label: 'Ticket Médio',              value: 'R$ 1.240',  icon: '🧾', trend: '-3% este mês' },
  { label: 'Taxa de Conversão',         value: '78%',       icon: '📈', trend: '+5% este mês' },
  { label: 'Tempo Médio de Resposta',   value: '4 min',     icon: '⚡', trend: '-1 min este mês' },
];

const SUPPLIER_PERF: SupplierPerf[] = [
  { name: 'Depósito Central Ltda',    orders: 42, avg_price: 'R$ 1.180', reputation: 4.8, accept_rate: '94%' },
  { name: 'Jundiaí Materiais',        orders: 38, avg_price: 'R$ 1.050', reputation: 4.6, accept_rate: '89%' },
  { name: 'Materiais São Paulo S/A',  orders: 25, avg_price: 'R$ 1.320', reputation: 4.2, accept_rate: '82%' },
  { name: 'Construfácil Indaiatuba',  orders: 12, avg_price: 'R$ 980',   reputation: 3.1, accept_rate: '60%' },
];

const CATEGORY_SAVINGS: CategorySaving[] = [
  { category: 'Cimento',   saving: 18400, total: 22000 },
  { category: 'Agregados', saving: 12600, total: 15000 },
  { category: 'Alvenaria', saving: 7200,  total: 9500  },
  { category: 'Ferragens', saving: 4600,  total: 6000  },
];

@Component({
  selector: 'edq-analytics-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent],
  template: `
    <edq-page-header title="Analytics" subtitle="Inteligência operacional do seu negócio" />

    <!-- Stat Cards -->
    <div class="stat-grid">
      @for (card of statCards; track card.label) {
        <div class="stat-card">
          <div class="stat-card__icon">{{ card.icon }}</div>
          <div class="stat-card__body">
            <span class="stat-card__label">{{ card.label }}</span>
            <span class="stat-card__value">{{ card.value }}</span>
            @if (card.trend) {
              <span class="stat-card__trend">{{ card.trend }}</span>
            }
          </div>
        </div>
      }
    </div>

    <!-- Fornecedores por Performance -->
    <section class="analytics-section">
      <h2 class="section-title">Fornecedores por Performance</h2>
      <div class="table-wrapper">
        <table class="data-table" aria-label="Performance de fornecedores">
          <thead>
            <tr>
              <th scope="col">Fornecedor</th>
              <th scope="col">Pedidos Atendidos</th>
              <th scope="col">Preço Médio</th>
              <th scope="col">Reputação</th>
              <th scope="col">Taxa de Aceite</th>
            </tr>
          </thead>
          <tbody>
            @for (row of supplierPerf; track row.name) {
              <tr class="table-row">
                <td class="supplier-name">{{ row.name }}</td>
                <td class="mono">{{ row.orders }}</td>
                <td class="mono">{{ row.avg_price }}</td>
                <td>
                  <span class="rep-score" [class]="repClass(row.reputation)">★ {{ row.reputation.toFixed(1) }}</span>
                </td>
                <td class="mono">{{ row.accept_rate }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>

    <!-- Volume de Pedidos -->
    <section class="analytics-section">
      <h2 class="section-title">Volume de Pedidos</h2>
      <div class="chart-placeholder">
        <span class="chart-placeholder__icon">📊</span>
        <p class="chart-placeholder__text">Gráfico disponível em breve</p>
        <span class="chart-placeholder__hint">Integração com biblioteca de gráficos em desenvolvimento</span>
      </div>
    </section>

    <!-- Economia por Categoria -->
    <section class="analytics-section">
      <h2 class="section-title">Economia por Categoria</h2>
      <div class="savings-list">
        @for (item of categorySavings; track item.category) {
          <div class="savings-item">
            <div class="savings-item__header">
              <span class="savings-item__category">{{ item.category }}</span>
              <span class="savings-item__value">R$ {{ item.saving.toLocaleString('pt-BR') }}</span>
            </div>
            <div class="savings-bar-track">
              <div
                class="savings-bar-fill"
                [style.width.%]="(item.saving / item.total) * 100"
                [attr.aria-valuenow]="(item.saving / item.total) * 100"
                aria-valuemin="0"
                aria-valuemax="100"
                role="progressbar"
              ></div>
            </div>
            <span class="savings-item__pct">{{ ((item.saving / item.total) * 100).toFixed(0) }}% de economia</span>
          </div>
        }
      </div>
    </section>
  `,
  styleUrl: './analytics-home.component.scss',
})
export class AnalyticsHomeComponent {
  protected readonly statCards      = STAT_CARDS;
  protected readonly supplierPerf   = SUPPLIER_PERF;
  protected readonly categorySavings = CATEGORY_SAVINGS;

  protected repClass(score: number): string {
    if (score >= 4.5) return 'rep-score--green';
    if (score >= 3.0) return 'rep-score--orange';
    return 'rep-score--red';
  }
}
