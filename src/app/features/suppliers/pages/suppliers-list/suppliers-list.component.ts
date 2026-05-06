import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageHeaderComponent }  from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ButtonComponent }      from '../../../../shared/components/button/button.component';
import { InputComponent }       from '../../../../shared/components/input/input.component';
import { Supplier, SupplierStatus } from '../../../../shared/types/domain.types';
import { SuppliersApiService }  from '../../../../core/services/api/suppliers-api.service';

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

    @if (isLoading()) {
      <div class="table-loading" aria-live="polite">Carregando fornecedores...</div>
    } @else if (error()) {
      <div class="table-error" role="alert">{{ error() }}</div>
    } @else {
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
                <td><span class="supplier-name">{{ supplier.companyName }}</span></td>
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
                  <span class="reputation-score" [class]="reputationClass(supplier.reputationScore)">
                    ★ {{ supplier.reputationScore.toFixed(1) }}
                  </span>
                </td>
                <td class="sla-cell">{{ supplier.responseSlaMin }} min</td>
                <td><edq-status-badge [status]="supplier.status" /></td>
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
    }
  `,
  styleUrl: './suppliers-list.component.scss',
})
export class SuppliersListComponent implements OnInit {
  private readonly suppliersApi = inject(SuppliersApiService);

  protected readonly statusFilters = STATUS_FILTERS;
  protected readonly activeStatus  = signal<SupplierStatus | 'all'>('all');
  protected readonly searchQuery   = signal('');

  protected readonly suppliers = signal<Supplier[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly error     = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.suppliersApi.list().subscribe({
      next:  res => { this.suppliers.set(res.data); this.isLoading.set(false); },
      error: ()  => { this.error.set('Erro ao carregar fornecedores.'); this.isLoading.set(false); },
    });
  }

  protected readonly filteredSuppliers = computed(() => {
    let list = this.suppliers();
    const status = this.activeStatus();
    if (status !== 'all') list = list.filter(s => s.status === status);
    const q = this.searchQuery().toLowerCase();
    if (q) {
      list = list.filter(s =>
        s.companyName?.toLowerCase().includes(q) ||
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
