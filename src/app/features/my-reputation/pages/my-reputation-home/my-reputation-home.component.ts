import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatCardComponent }   from '../../../../shared/components/stat-card/stat-card.component';

interface Review {
  id:          string;
  buyer_name:  string;
  order_ref:   string;
  rating:      number;
  comment:     string;
  created_at:  string;
}

interface ReputationMetric {
  label: string;
  value: number;
  max:   number;
  icon:  string;
}

const MOCK_REVIEWS: Review[] = [
  { id: 'r1', buyer_name: 'Construtora Alpha',   order_ref: '#EDQ-2024-0041', rating: 5, comment: 'Entrega no prazo, material de excelente qualidade. Recomendo!',                    created_at: '2024-01-14T10:00:00Z' },
  { id: 'r2', buyer_name: 'Obras Beta Ltda',     order_ref: '#EDQ-2024-0038', rating: 4, comment: 'Boa entrega, apenas um pequeno atraso de 30 minutos. Material conforme pedido.',   created_at: '2024-01-10T09:00:00Z' },
  { id: 'r3', buyer_name: 'Engenharia Gama',     order_ref: '#EDQ-2024-0035', rating: 5, comment: 'Perfeito! Melhor fornecedor que já trabalhamos. Preço justo e entrega rápida.',     created_at: '2024-01-05T08:00:00Z' },
  { id: 'r4', buyer_name: 'Construtora Delta',   order_ref: '#EDQ-2024-0030', rating: 3, comment: 'Material ok, mas a comunicação poderia ser melhor durante o processo.',             created_at: '2023-12-28T07:00:00Z' },
  { id: 'r5', buyer_name: 'Obras Épsilon',       order_ref: '#EDQ-2024-0025', rating: 5, comment: 'Excelente! Entrega antecipada e material de primeira qualidade.',                  created_at: '2023-12-20T06:00:00Z' },
  { id: 'r6', buyer_name: 'Construtora Zeta',    order_ref: '#EDQ-2024-0020', rating: 4, comment: 'Muito bom. Preço competitivo e atendimento ágil.',                                 created_at: '2023-12-15T05:00:00Z' },
];

const METRICS: ReputationMetric[] = [
  { label: 'Pontualidade',    value: 4.8, max: 5, icon: '⏰' },
  { label: 'Qualidade',       value: 4.9, max: 5, icon: '⭐' },
  { label: 'Comunicação',     value: 4.3, max: 5, icon: '💬' },
  { label: 'Preço Justo',     value: 4.6, max: 5, icon: '💰' },
];

@Component({
  selector: 'edq-my-reputation-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, PageHeaderComponent, StatCardComponent],
  template: `
    <edq-page-header
      title="Reputação"
      subtitle="Avaliações e métricas de desempenho"
    />

    <!-- ── Score Principal ────────────────────────────────── -->
    <div class="reputation-hero">
      <div class="reputation-hero__score-block">
        <div class="reputation-hero__stars" aria-label="Nota {{ overallScore() }} de 5">
          @for (star of starsArray(); track $index) {
            <span class="star" [class.star--filled]="star === 'full'" [class.star--half]="star === 'half'">★</span>
          }
        </div>
        <div class="reputation-hero__score">{{ overallScore().toFixed(1) }}</div>
        <div class="reputation-hero__count">{{ reviews().length }} avaliações</div>
      </div>

      <div class="reputation-hero__divider" aria-hidden="true"></div>

      <div class="reputation-hero__metrics">
        @for (m of metrics; track m.label) {
          <div class="metric-row">
            <span class="metric-row__icon" aria-hidden="true">{{ m.icon }}</span>
            <span class="metric-row__label">{{ m.label }}</span>
            <div class="metric-row__bar-track" role="progressbar" [attr.aria-valuenow]="m.value" aria-valuemin="0" [attr.aria-valuemax]="m.max">
              <div class="metric-row__bar-fill" [style.width.%]="(m.value / m.max) * 100"></div>
            </div>
            <span class="metric-row__value">{{ m.value.toFixed(1) }}</span>
          </div>
        }
      </div>
    </div>

    <!-- ── Stats ──────────────────────────────────────────── -->
    <div class="stats-grid">
      <edq-stat-card icon="📦" label="Pedidos Atendidos"   value="42"  change="+5 este mês"    trend="up"      />
      <edq-stat-card icon="✅" label="Taxa de Conclusão"   value="94%" change="+2% este mês"   trend="up"      />
      <edq-stat-card icon="⚡" label="Tempo Médio Entrega" value="1.2d" change="-0.3d este mês" trend="up"     />
      <edq-stat-card icon="🔄" label="Taxa de Recompra"    value="68%" change="clientes fiéis"  trend="neutral" />
    </div>

    <!-- ── Avaliações ─────────────────────────────────────── -->
    <section class="reviews-section">
      <h2 class="section-title">Avaliações dos Compradores</h2>

      <!-- Distribuição de estrelas -->
      <div class="rating-distribution">
        @for (n of [5, 4, 3, 2, 1]; track n) {
          <div class="rating-dist-row">
            <span class="rating-dist-row__label">{{ n }}★</span>
            <div class="rating-dist-row__track">
              <div
                class="rating-dist-row__fill"
                [style.width.%]="ratingPercent(n)"
                role="progressbar"
                [attr.aria-valuenow]="ratingPercent(n)"
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
            <span class="rating-dist-row__count">{{ ratingCount(n) }}</span>
          </div>
        }
      </div>

      <!-- Lista de reviews -->
      <div class="reviews-list">
        @for (r of reviews(); track r.id) {
          <div class="review-card">
            <div class="review-card__header">
              <div class="review-card__buyer-info">
                <div class="review-card__avatar" aria-hidden="true">
                  {{ r.buyer_name.charAt(0) }}
                </div>
                <div>
                  <div class="review-card__buyer-name">{{ r.buyer_name }}</div>
                  <div class="review-card__order-ref">{{ r.order_ref }}</div>
                </div>
              </div>
              <div class="review-card__meta">
                <div class="review-card__stars" [attr.aria-label]="r.rating + ' estrelas'">
                  @for (i of [1,2,3,4,5]; track i) {
                    <span class="star" [class.star--filled]="i <= r.rating">★</span>
                  }
                </div>
                <div class="review-card__date">{{ r.created_at | date:'dd/MM/yyyy' }}</div>
              </div>
            </div>
            <p class="review-card__comment">{{ r.comment }}</p>
          </div>
        }
      </div>
    </section>
  `,
  styleUrl: './my-reputation-home.component.scss',
})
export class MyReputationHomeComponent {
  protected readonly reviews = signal(MOCK_REVIEWS);
  protected readonly metrics = METRICS;

  protected readonly overallScore = computed(() => {
    const rs = this.reviews();
    if (!rs.length) return 0;
    return rs.reduce((sum, r) => sum + r.rating, 0) / rs.length;
  });

  protected readonly starsArray = computed((): ('full' | 'half' | 'empty')[] => {
    const score = this.overallScore();
    return [1, 2, 3, 4, 5].map(i => {
      if (score >= i)       return 'full';
      if (score >= i - 0.5) return 'half';
      return 'empty';
    });
  });

  protected ratingCount(stars: number): number {
    return this.reviews().filter(r => r.rating === stars).length;
  }

  protected ratingPercent(stars: number): number {
    const total = this.reviews().length;
    if (!total) return 0;
    return (this.ratingCount(stars) / total) * 100;
  }
}
