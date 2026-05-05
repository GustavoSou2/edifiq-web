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
import { Delivery, DeliveryStatus } from '../../../../shared/types/domain.types';

const MOCK_DELIVERIES: Partial<Delivery>[] = [
  {
    id: '1',
    tracking_code: 'TRK-001',
    status: 'delivered',
    scheduled_at: '2024-01-16T08:00:00Z',
    delivered_at: '2024-01-16T10:30:00Z',
    supplier: { id: 's1', name: 'Depósito Central Ltda' } as any,
    order_id: '#EDQ-2024-0040',
    created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    tracking_code: 'TRK-002',
    status: 'in_transit',
    scheduled_at: '2024-01-17T09:00:00Z',
    delivered_at: null,
    supplier: { id: 's2', name: 'Materiais São Paulo S/A' } as any,
    order_id: '#EDQ-2024-0041',
    created_at: '2024-01-16T00:00:00Z',
  },
  {
    id: '3',
    tracking_code: 'TRK-003',
    status: 'scheduled',
    scheduled_at: '2024-01-18T14:00:00Z',
    delivered_at: null,
    supplier: { id: 's5', name: 'Jundiaí Materiais' } as any,
    order_id: '#EDQ-2024-0042',
    created_at: '2024-01-17T00:00:00Z',
  },
  {
    id: '4',
    tracking_code: 'TRK-004',
    status: 'failed',
    scheduled_at: '2024-01-15T10:00:00Z',
    delivered_at: null,
    supplier: { id: 's3', name: 'Construfácil Indaiatuba' } as any,
    order_id: '#EDQ-2024-0039',
    created_at: '2024-01-14T00:00:00Z',
  },
  {
    id: '5',
    tracking_code: 'TRK-005',
    status: 'delivered',
    scheduled_at: '2024-01-14T08:00:00Z',
    delivered_at: '2024-01-14T11:00:00Z',
    supplier: { id: 's1', name: 'Depósito Central Ltda' } as any,
    order_id: '#EDQ-2024-0038',
    created_at: '2024-01-13T00:00:00Z',
  },
];

const STATUS_FILTERS: { value: DeliveryStatus | 'all'; label: string }[] = [
  { value: 'all',        label: 'Todos' },
  { value: 'scheduled',  label: 'Agendado' },
  { value: 'in_transit', label: 'Em Trânsito' },
  { value: 'delivered',  label: 'Entregue' },
  { value: 'failed',     label: 'Falhou' },
];

@Component({
  selector: 'edq-deliveries-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeaderComponent, StatusBadgeComponent, ButtonComponent],
  template: `
    <edq-page-header title="Entregas" subtitle="Acompanhe todas as entregas" />

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
    </div>

    <!-- Tabela -->
    <div class="table-wrapper">
      <table class="data-table" aria-label="Lista de entregas">
        <thead>
          <tr>
            <th scope="col">Pedido</th>
            <th scope="col">Fornecedor</th>
            <th scope="col">Status</th>
            <th scope="col">Agendado para</th>
            <th scope="col">Entregue em</th>
            <th scope="col"><span class="sr-only">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          @for (delivery of filteredDeliveries(); track delivery.id) {
            <tr class="table-row">
              <td><span class="mono">{{ delivery.order_id }}</span></td>
              <td>{{ delivery.supplier?.name }}</td>
              <td><edq-status-badge [status]="delivery.status!" /></td>
              <td class="date-cell">{{ formatDate(delivery.scheduled_at) }}</td>
              <td class="date-cell">{{ delivery.delivered_at ? formatDate(delivery.delivered_at) : '—' }}</td>
              <td>
                <div class="row-actions">
                  <edq-button variant="ghost" size="sm" [routerLink]="[delivery.id]">Ver</edq-button>
                </div>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="6">
                <div class="table-empty">
                  <span>🚚</span>
                  <p>Nenhuma entrega encontrada.</p>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styleUrl: './deliveries-list.component.scss',
})
export class DeliveriesListComponent {
  protected readonly statusFilters = STATUS_FILTERS;
  protected readonly activeStatus  = signal<DeliveryStatus | 'all'>('all');

  protected readonly filteredDeliveries = computed(() => {
    const status = this.activeStatus();
    if (status === 'all') return MOCK_DELIVERIES;
    return MOCK_DELIVERIES.filter(d => d.status === status);
  });

  protected formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
}
