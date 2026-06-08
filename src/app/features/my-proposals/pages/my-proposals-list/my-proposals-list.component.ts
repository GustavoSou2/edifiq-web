import {
  ChangeDetectionStrategy, Component, OnInit,
  computed, inject, signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';

import { PageHeaderComponent }  from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ButtonComponent }      from '../../../../shared/components/button/button.component';
import { StatCardComponent }    from '../../../../shared/components/stat-card/stat-card.component';
import { ProposalStatus }       from '../../../../shared/types/domain.types';
import { ProposalsApiService, ReceivedDistribution } from '../../../../core/services/api/proposals-api.service';

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
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe, PageHeaderComponent, StatusBadgeComponent, ButtonComponent, StatCardComponent],
  template: `
    <edq-page-header
      title="Minhas Propostas"
      subtitle="Propostas que você enviou para pedidos de compradores"
    />

    <!-- Stats -->
    <div class="stats-grid">
      <edq-stat-card icon="📤" label="Total Enviadas"  [value]="totalCount().toString()" />
      <edq-stat-card icon="⏳" label="Aguardando"      [value]="pendingCount().toString()" trend="neutral" />
      <edq-stat-card icon="✅" label="Aceitas"         [value]="acceptedCount().toString()" trend="up" />
      <edq-stat-card icon="❌" label="Retiradas"       [value]="withdrawnCount().toString()" trend="down" />
    </div>

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
          >{{ f.label }}</button>
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
              <th scope="col">Comprador</th>
              <th scope="col">Valor</th>
              <th scope="col">Prazo</th>
              <th scope="col">Status</th>
              <th scope="col"><span class="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            @for (d of filtered(); track d.id) {
              <tr class="table-row">
                <!-- Pedido -->
                <td>
                  <div class="order-cell">
                    <span class="order-cell__ref">
                      {{ d.order?.referenceCode ?? d.order?.title ?? d.orderId }}
                    </span>
                    @if (d.order?.isUrgent) {
                      <span class="badge-urgent">URGENTE</span>
                    }
                    @if (d.order?.deliveryCity) {
                      <span class="order-cell__loc">📍 {{ d.order!.deliveryCity }}</span>
                    }
                  </div>
                </td>

                <!-- Comprador (buyer tenant) -->
                <td class="muted-cell">{{ d.buyerTenantId | slice:0:8 }}…</td>

                <!-- Valor -->
                <td>
                  @if (d.proposal) {
                    <span class="price">{{ d.proposal.totalPrice | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
                  } @else {
                    <span class="muted">—</span>
                  }
                </td>

                <!-- Prazo -->
                <td>
                  @if (d.proposal?.deliveryEtaHours) {
                    <span>{{ d.proposal!.deliveryEtaHours }}h</span>
                  } @else if (d.proposal?.proposedDeliveryAt) {
                    <span>{{ d.proposal!.proposedDeliveryAt | date:'dd/MM' }}</span>
                  } @else {
                    <span class="muted">—</span>
                  }
                </td>

                <!-- Status -->
                <td>
                  @if (d.proposal) {
                    <edq-status-badge [status]="d.proposal.status" />
                  } @else {
                    <span class="muted-cell">Sem proposta</span>
                  }
                </td>

                <!-- Ações -->
                <td>
                  <div class="row-actions">
                    @if (d.proposal) {
                      <edq-button variant="ghost" size="sm" [routerLink]="[d.id]">Ver</edq-button>
                    } @else {
                      <edq-button variant="primary" size="sm" [routerLink]="['/app/available-orders', d.id]">
                        Propor
                      </edq-button>
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6">
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
  styles: [`
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin-bottom: 24px; }
    .order-cell { display: flex; flex-direction: column; gap: 2px; }
    .order-cell__ref { font-size: 13px; font-weight: 600; color: var(--color-text-primary, #111827); }
    .order-cell__loc { font-size: 11px; color: #9ca3af; }
    .badge-urgent {
      display: inline-block; padding: 1px 6px; border-radius: 99px;
      background: #e2445c; color: #fff; font-size: 9px; font-weight: 700;
      text-transform: uppercase; letter-spacing: .05em; width: fit-content;
    }
    .price { font-weight: 700; color: var(--color-text-primary, #111827); }
    .muted { color: #d1d5db; }
    .muted-cell { font-size: 12px; color: #9ca3af; }
  `],
  styleUrl: './my-proposals-list.component.scss',
})
export class MyProposalsListComponent implements OnInit {
  private readonly proposalsApi = inject(ProposalsApiService);

  protected readonly statusFilters = STATUS_FILTERS;
  protected readonly activeStatus  = signal<ProposalStatus | 'all'>('all');
  protected readonly distributions = signal<ReceivedDistribution[]>([]);
  protected readonly isLoading     = signal(false);
  protected readonly error         = signal<string | null>(null);

  protected readonly totalCount     = computed(() => this.distributions().filter(d => d.proposal).length);
  protected readonly pendingCount   = computed(() => this.distributions().filter(d => d.proposal?.status === 'submitted').length);
  protected readonly acceptedCount  = computed(() => this.distributions().filter(d => d.proposal?.status === 'updated').length);
  protected readonly withdrawnCount = computed(() => this.distributions().filter(d => d.proposal?.status === 'withdrawn').length);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.proposalsApi.listReceived().subscribe({
      next:  dists => { this.distributions.set(dists); this.isLoading.set(false); },
      error: ()    => { this.error.set('Erro ao carregar propostas.'); this.isLoading.set(false); },
    });
  }

  protected readonly filtered = computed(() => {
    const status = this.activeStatus();
    if (status === 'all') return this.distributions();
    return this.distributions().filter(d => d.proposal?.status === status);
  });
}
