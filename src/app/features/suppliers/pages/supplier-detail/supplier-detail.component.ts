import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ButtonComponent }      from '../../../../shared/components/button/button.component';
import { Supplier }             from '../../../../shared/types/domain.types';
import { SuppliersApiService }  from '../../../../core/services/api/suppliers-api.service';

type DetailTab = 'categories' | 'orders' | 'ratings';

@Component({
  selector: 'edq-supplier-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeaderComponent, StatusBadgeComponent, ButtonComponent],
  template: `
    @if (isLoading()) {
      <div class="page-loading">Carregando...</div>
    } @else if (error()) {
      <div class="page-error" role="alert">{{ error() }}</div>
    } @else if (supplier()) {
      <edq-page-header
        [title]="supplier()!.name"
        [subtitle]="supplier()!.city ? '📍 ' + supplier()!.city + (supplier()!.state ? ', ' + supplier()!.state : '') : 'Fornecedor'"
      >
        <div slot="actions" class="header-actions">
          <edq-button variant="secondary" size="sm" [routerLink]="['../', id(), 'edit']">Editar</edq-button>
          <edq-button variant="secondary" size="sm" routerLink="../">← Voltar</edq-button>
        </div>
      </edq-page-header>

      <!-- Vínculo com plataforma -->
      @if (supplier()!.linkedTenantId) {
        <div class="platform-banner">
          <span class="platform-banner__icon">🔗</span>
          <div>
            <strong>Fornecedor na plataforma</strong>
            <span>{{ supplier()!.linkedTenantName ?? supplier()!.linkedTenantId }} — recebe pedidos pelo painel de fornecedor do Edifiq.</span>
          </div>
        </div>
      }

      <!-- Info cards -->
      <div class="info-grid">
        <div class="info-card">
          <span class="info-card__label">Status</span>
          <edq-status-badge [status]="supplier()!.active ? 'active' : 'inactive'" />
        </div>
        <div class="info-card">
          <span class="info-card__label">Reputação</span>
          <span class="reputation-score" [class]="reputationClass(supplier()!.reputationScore)">
            ★ {{ supplier()!.reputationScore.toFixed(1) }}
          </span>
        </div>
        <div class="info-card">
          <span class="info-card__label">E-mail</span>
          <span class="info-card__value">{{ supplier()!.email ?? '—' }}</span>
        </div>
        <div class="info-card">
          <span class="info-card__label">Telefone</span>
          <span class="info-card__value">{{ supplier()!.phone ?? '—' }}</span>
        </div>
        <div class="info-card">
          <span class="info-card__label">Endereço</span>
          <span class="info-card__value">{{ supplier()!.address ?? '—' }}</span>
        </div>
        <div class="info-card">
          <span class="info-card__label">CEP</span>
          <span class="info-card__value">{{ supplier()!.postalCode ?? '—' }}</span>
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
            <div class="placeholder-empty">
              <p>Categorias serão exibidas aqui.</p>
            </div>
          }
          @case ('orders') {
            <div class="placeholder-empty">
              <p>Histórico de pedidos será exibido aqui.</p>
            </div>
          }
          @case ('ratings') {
            <div class="placeholder-empty">
              <p>Avaliações serão exibidas aqui.</p>
            </div>
          }
        }
      </div>
    }
  `,
  styles: [`
    .page-loading, .page-error { padding: 40px; text-align: center; color: #6b7280; }
    .page-error { color: #dc2626; }
    .header-actions { display: flex; gap: 8px; }
    .platform-banner {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 18px;
      background: #ede9fe;
      border: 1px solid #c4b5fd;
      border-radius: 10px;
      margin-bottom: 20px;
      font-size: 13px;
      color: #5b21b6;
    }
    .platform-banner__icon { font-size: 18px; flex-shrink: 0; }
    .platform-banner strong { display: block; font-weight: 600; margin-bottom: 2px; }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    .info-card {
      background: var(--surface, #fff);
      border: 1px solid var(--border, #e5e7eb);
      border-radius: 10px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .info-card__label { font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: .5px; }
    .info-card__value { font-size: 14px; color: var(--text-primary, #111827); }
    .reputation-score { font-weight: 700; font-size: 15px; }
    .reputation-score--green { color: #059669; }
    .reputation-score--orange { color: #d97706; }
    .reputation-score--red { color: #dc2626; }
    .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border, #e5e7eb); margin-bottom: 20px; }
    .tab {
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 500;
      color: #6b7280;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      transition: color .15s, border-color .15s;
    }
    .tab--active { color: #4f46e5; border-bottom-color: #4f46e5; }
    .placeholder-empty { padding: 32px; text-align: center; color: #9ca3af; font-size: 14px; }
  `],
  styleUrl: './supplier-detail.component.scss',
})
export class SupplierDetailComponent implements OnInit {
  readonly id = input<string>('');

  private readonly suppliersApi = inject(SuppliersApiService);

  protected readonly supplier  = signal<Supplier | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly error     = signal<string | null>(null);
  protected readonly activeTab = signal<DetailTab>('categories');

  protected readonly tabs: { id: DetailTab; label: string }[] = [
    { id: 'categories', label: 'Categorias' },
    { id: 'orders',     label: 'Histórico de Pedidos' },
    { id: 'ratings',    label: 'Avaliações' },
  ];

  ngOnInit(): void {
    this.isLoading.set(true);
    this.suppliersApi.findById(this.id()).subscribe({
      next:  supplier => { this.supplier.set(supplier); this.isLoading.set(false); },
      error: ()       => { this.error.set('Fornecedor não encontrado.'); this.isLoading.set(false); },
    });
  }

  protected reputationClass(score: number): string {
    if (score >= 4.5) return 'reputation-score--green';
    if (score >= 3.0) return 'reputation-score--orange';
    return 'reputation-score--red';
  }
}
