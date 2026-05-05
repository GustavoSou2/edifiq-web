import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

type DetailTab = 'categories' | 'orders' | 'ratings';

@Component({
  selector: 'edq-supplier-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeaderComponent, StatusBadgeComponent, ButtonComponent],
  template: `
    <edq-page-header title="Depósito Central Ltda" subtitle="Fornecedor ativo desde 2022">
      <edq-button slot="actions" variant="secondary" size="sm" routerLink="../">← Voltar</edq-button>
    </edq-page-header>

    <!-- Info cards -->
    <div class="info-grid">
      <div class="info-card">
        <span class="info-card__label">Status</span>
        <edq-status-badge status="active" />
      </div>
      <div class="info-card">
        <span class="info-card__label">Reputação</span>
        <span class="reputation-score reputation-score--green">★ 4.8</span>
      </div>
      <div class="info-card">
        <span class="info-card__label">Total de Entregas</span>
        <span class="info-card__value info-card__value--highlight">142</span>
      </div>
      <div class="info-card">
        <span class="info-card__label">SLA de Resposta</span>
        <span class="info-card__value">30 min</span>
      </div>
      <div class="info-card">
        <span class="info-card__label">Raio de Entrega</span>
        <span class="info-card__value">80 km</span>
      </div>
      <div class="info-card">
        <span class="info-card__label">Cidade</span>
        <span class="info-card__value">📍 Campinas, SP</span>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs" role="tablist">
      @for (tab of tabs; track tab.id) {
        <button
          class="tab"
          role="tab"
          [class.tab--active]="activeTab() === tab.id"
          [attr.aria-selected]="activeTab() === tab.id"
          (click)="activeTab.set(tab.id)"
        >
          {{ tab.label }}
        </button>
      }
    </div>

    <!-- Tab content -->
    <div class="tab-content" role="tabpanel">
      @switch (activeTab()) {
        @case ('categories') {
          <div class="placeholder-list">
            <div class="placeholder-item">
              <span class="category-chip">Cimento</span>
              <span class="placeholder-desc">Fornece sacos de cimento CP-II e CP-III</span>
            </div>
            <div class="placeholder-item">
              <span class="category-chip">Agregados</span>
              <span class="placeholder-desc">Areia, brita e pedra britada</span>
            </div>
            <div class="placeholder-item">
              <span class="category-chip">Alvenaria</span>
              <span class="placeholder-desc">Blocos cerâmicos e tijolos</span>
            </div>
          </div>
        }
        @case ('orders') {
          <div class="placeholder-list">
            <div class="placeholder-item">
              <span class="mono">#EDQ-2024-0040</span>
              <edq-status-badge status="confirmed" />
              <span class="placeholder-desc">Entregue em 18/01/2024</span>
            </div>
            <div class="placeholder-item">
              <span class="mono">#EDQ-2024-0035</span>
              <edq-status-badge status="confirmed" />
              <span class="placeholder-desc">Entregue em 10/01/2024</span>
            </div>
            <div class="placeholder-item">
              <span class="mono">#EDQ-2024-0028</span>
              <edq-status-badge status="cancelled" />
              <span class="placeholder-desc">Cancelado em 02/01/2024</span>
            </div>
          </div>
        }
        @case ('ratings') {
          <div class="placeholder-list">
            <div class="rating-item">
              <div class="rating-header">
                <span class="rating-score">★★★★★</span>
                <span class="rating-date">15/01/2024</span>
              </div>
              <p class="rating-comment">Entrega rápida e materiais de qualidade. Recomendo!</p>
            </div>
            <div class="rating-item">
              <div class="rating-header">
                <span class="rating-score">★★★★☆</span>
                <span class="rating-date">08/01/2024</span>
              </div>
              <p class="rating-comment">Bom atendimento, pequeno atraso na entrega.</p>
            </div>
            <div class="rating-item">
              <div class="rating-header">
                <span class="rating-score">★★★★★</span>
                <span class="rating-date">02/01/2024</span>
              </div>
              <p class="rating-comment">Excelente fornecedor, sempre pontual.</p>
            </div>
          </div>
        }
      }
    </div>
  `,
  styleUrl: './supplier-detail.component.scss',
})
export class SupplierDetailComponent {
  readonly id = input<string>('');

  protected readonly activeTab = signal<DetailTab>('categories');

  protected readonly tabs: { id: DetailTab; label: string }[] = [
    { id: 'categories', label: 'Categorias' },
    { id: 'orders',     label: 'Histórico de Pedidos' },
    { id: 'ratings',    label: 'Avaliações' },
  ];
}
