import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { Supplier, SupplierStatus } from '../../../../shared/types/domain.types';

const MOCK_SUPPLIERS: Partial<Supplier>[] = [
  {
    id: '1',
    name: 'Depósito Central Ltda',
    city: 'Campinas',
    state: 'SP',
    reputation_score: 4.8,
    response_sla_min: 30,
    total_deliveries: 142,
    status: 'active',
    categories: [{ id: 'c1', name: 'Cimento', slug: 'cimento', parent_id: null }, { id: 'c2', name: 'Agregados', slug: 'agregados', parent_id: null }],
    created_at: '2022-03-10T00:00:00Z',
  },
  {
    id: '2',
    name: 'Materiais São Paulo S/A',
    city: 'São Paulo',
    state: 'SP',
    reputation_score: 4.2,
    response_sla_min: 45,
    total_deliveries: 98,
    status: 'active',
    categories: [{ id: 'c3', name: 'Alvenaria', slug: 'alvenaria', parent_id: null }],
    created_at: '2021-07-22T00:00:00Z',
  },
  {
    id: '3',
    name: 'Construfácil Indaiatuba',
    city: 'Indaiatuba',
    state: 'SP',
    reputation_score: 3.1,
    response_sla_min: 60,
    total_deliveries: 55,
    status: 'inactive',
    categories: [{ id: 'c4', name: 'Ferragens', slug: 'ferragens', parent_id: null }],
    created_at: '2023-01-05T00:00:00Z',
  },
  {
    id: '4',
    name: 'Ferro & Aço Sorocaba',
    city: 'Sorocaba',
    state: 'SP',
    reputation_score: 2.7,
    response_sla_min: 90,
    total_deliveries: 20,
    status: 'blocked',
    categories: [{ id: 'c5', name: 'Metais', slug: 'metais', parent_id: null }],
    created_at: '2023-06-18T00:00:00Z',
  },
  {
    id: '5',
    name: 'Jundiaí Materiais',
    city: 'Jundiaí',
    state: 'SP',
    reputation_score: 4.6,
    response_sla_min: 20,
    total_deliveries: 210,
    status: 'active',
    categories: [{ id: 'c1', name: 'Cimento', slug: 'cimento', parent_id: null }, { id: 'c6', name: 'Tintas', slug: 'tintas', parent_id: null }],
    created_at: '2020-11-30T00:00:00Z',
  },
];

const STATUS_FILTERS: { value: SupplierStatus | 'all'; label: string }[] = [
  { value: 'all',      label: 'Todos' },
  { value: 'active',   label: 'Ativo' },
  { value: 'inactive', label: 'Inativo' },
  { value: 'blocked',  label: 'Bloqueado' },
];

@Component({
  selector: 'edq-suppliers-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeaderComponent, StatusBadgeComponent, ButtonComponent, InputComponent],
  template: `
    <edq-page-header title="Fornecedores" subtitle="Gerencie sua rede de fornecedores">
      <edq-button slot="actions" variant="primary" size="sm" routerLink="new">+ Novo Fornecedor</edq-button>
    </edq-page-header>

    <!-- Filtros -->
    <div class="filters-bar">
      <div class="filter-tabs" role="tablist" aria-label="Filtrar por status">
        @for (f of statusFilters; track f.value) {
          <button
            class="filter-tab"
            role="tab"
            [class.filter-tab--active]="activeStatus() === f.value"
            [attr.aria-selected]="activeStatus() === f.value"
            (click)="activeStatus.set(f.value)"
          >
            {{ f.label }}
          </button>
        }
      </div>

      <div class="filters-right">
        <edq-input
          type="search"
          placeholder="Buscar fornecedor..."
          size="sm"
          [(value)]="searchQuery"
        >
          <span slot="prefix">🔍</span>
        </edq-input>
      </div>
    </div>

    <!-- Tabela -->
    <div class="table-wrapper">
      <table class="data-table" aria-label="Lista de fornecedores">
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Cidade/Estado</th>
            <th scope="col">Categorias</th>
            <th scope="col">Reputação</th>
            <th scope="col">SLA</th>
            <th scope="col">Status</th>
            <th scope="col"><span class="sr-only">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          @for (supplier of filteredSuppliers(); track supplier.id) {
            <tr class="table-row">
              <td>
                <span class="supplier-name">{{ supplier.name }}</span>
              </td>
              <td class="city-cell">📍 {{ supplier.city }}, {{ supplier.state }}</td>
              <td>
                <div class="category-chips">
                  @for (cat of supplier.categories?.slice(0, 2); track cat.id) {
                    <span class="category-chip">{{ cat.name }}</span>
                  }
                  @if ((supplier.categories?.length ?? 0) > 2) {
                    <span class="category-chip category-chip--more">+{{ (supplier.categories?.length ?? 0) - 2 }}</span>
                  }
                </div>
              </td>
              <td>
                <span class="reputation-score" [class]="reputationClass(supplier.reputation_score ?? 0)">
                  ★ {{ supplier.reputation_score?.toFixed(1) }}
                </span>
              </td>
              <td class="sla-cell">{{ supplier.response_sla_min }} min</td>
              <td><edq-status-badge [status]="supplier.status!" /></td>
              <td>
                <div class="row-actions">
                  <edq-button variant="ghost" size="sm" [routerLink]="[supplier.id]">Ver</edq-button>
                </div>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="7">
                <div class="table-empty">
                  <span>🏭</span>
                  <p>Nenhum fornecedor encontrado.</p>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styleUrl: './suppliers-list.component.scss',
})
export class SuppliersListComponent {
  protected readonly statusFilters = STATUS_FILTERS;
  protected readonly activeStatus  = signal<SupplierStatus | 'all'>('all');
  protected readonly searchQuery   = signal('');

  protected readonly filteredSuppliers = computed(() => {
    let list = MOCK_SUPPLIERS;
    const status = this.activeStatus();
    if (status !== 'all') list = list.filter(s => s.status === status);
    const q = this.searchQuery().toLowerCase();
    if (q) {
      list = list.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q),
      );
    }
    return list;
  });

  protected reputationClass(score: number): string {
    if (score >= 4.5) return 'reputation-score--green';
    if (score >= 3.0) return 'reputation-score--orange';
    return 'reputation-score--red';
  }
}
