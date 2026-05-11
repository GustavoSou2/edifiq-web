import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';

import { PageHeaderComponent }  from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ButtonComponent }      from '../../../../shared/components/button/button.component';
import { StatCardComponent }    from '../../../../shared/components/stat-card/stat-card.component';
import { Proposal, ProposalStatus } from '../../../../shared/types/domain.types';
import { ProposalsApiService }  from '../../../../core/services/api/proposals-api.service';

const STATUS_FILTERS: { value: ProposalStatus | 'all'; label: string }[] = [
  { value: 'all',       label: 'Todas' },
  { value: 'submitted', label: 'Enviadas' },
  { value: 'updated',   label: 'Atualizadas' },
  { value: 'withdrawn', label: 'Retiradas' },
];

@Component({
  selector: 'edq-my-proposals-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CurrencyPipe, PageHeaderComponent, StatusBadgeComponent, ButtonComponent, StatCardComponent],
  template: `
    <edq-page-header
      title="Minhas Propostas"
      subtitle="Acompanhe todas as propostas que você enviou"
    />

    <div class="stats-grid">
      <edq-stat-card icon="📤" label="Total Enviadas"  [value]="totalCount().toString()" />
      <edq-stat-card icon="✅" label="Aceitas"         [value]="acceptedCount().toString()" [change]="acceptedRate()" trend="up" />
      <edq-stat-card icon="❌" label="Recusadas"       [value]="rejectedCount().toString()" trend="down" />
      <edq-stat-card icon="⏳" label="Aguardando"      [value]="pendingCount().toString()" change="em aberto" trend="neutral" />
    </div>

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
    </div>

    @if (isLoading()) {
      <div class="table-loading" aria-live="polite">Carregando propostas...</div>
    } @else if (error()) {
      <div class="table-error" role="alert">{{ error() }}</div>
    } @else {
      <div class="table-wrapper">
        <table class="data-table" aria-label="Minhas propostas">
          <thead>
            <tr>
              <th scope="col">Pedido</th>
              <th scope="col">Valor</th>
              <th scope="col">Status</th>
              <th scope="col">Enviada em</th>
              <th scope="col"><span class="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            @for (p of filteredProposals(); track p.id) {
              <tr class="table-row">
                <td><span class="mono">{{ p.distributionId }}</span></td>
                <td>
                  <span class="price">
                    {{ p.totalPrice | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                  </span>
                </td>
                <td><edq-status-badge [status]="p.status" /></td>
                <td class="date-cell">—</td>
                <td>
                  <div class="row-actions">
                    <edq-button variant="ghost" size="sm" [routerLink]="[p.id]">Ver</edq-button>
                    @if (p.status === 'submitted') {
                      <edq-button variant="danger" size="sm" (clicked)="withdraw(p.id)">Retirar</edq-button>
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5">
                  <div class="table-empty">
                    <span>💬</span>
                    <p>Nenhuma proposta encontrada.</p>
                    <edq-button variant="primary" size="sm" routerLink="/app/available-orders">
                      Ver pedidos disponíveis
                    </edq-button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styleUrl: './my-proposals-list.component.scss',
})
export class MyProposalsListComponent implements OnInit {
  private readonly proposalsApi = inject(ProposalsApiService);

  protected readonly statusFilters = STATUS_FILTERS;
  protected readonly activeStatus  = signal<ProposalStatus | 'all'>('all');

  protected readonly proposals = signal<Proposal[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly error     = signal<string | null>(null);

  protected readonly totalCount    = computed(() => this.proposals().length);
  protected readonly acceptedCount = computed(() => this.proposals().filter(p => p.status === 'submitted').length);
  protected readonly rejectedCount = computed(() => this.proposals().filter(p => p.status === 'withdrawn').length);
  protected readonly pendingCount  = computed(() => this.proposals().filter(p => p.status === 'submitted').length);
  protected readonly acceptedRate  = computed(() => {
    const total = this.totalCount();
    if (!total) return '0%';
    return `${Math.round((this.acceptedCount() / total) * 100)}% de conversão`;
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    // Lista propostas do fornecedor logado — endpoint genérico de propostas
    this.proposalsApi.listByOrder('me').subscribe({
      next:  res => { this.proposals.set(res.data); this.isLoading.set(false); },
      error: ()  => { this.error.set('Erro ao carregar propostas.'); this.isLoading.set(false); },
    });
  }

  protected readonly filteredProposals = computed(() => {
    const status = this.activeStatus();
    if (status === 'all') return this.proposals();
    return this.proposals().filter(p => p.status === status);
  });

  protected withdraw(id: string): void {
    this.proposalsApi.withdraw(id).subscribe({
      next: updated => {
        this.proposals.update(list => list.map(p => p.id === id ? updated : p));
      },
    });
  }
}
