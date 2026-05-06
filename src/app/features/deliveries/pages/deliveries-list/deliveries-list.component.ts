import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

import { PageHeaderComponent }  from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ButtonComponent }      from '../../../../shared/components/button/button.component';
import { Delivery, DeliveryStatus } from '../../../../shared/types/domain.types';
import { DeliveriesApiService } from '../../../../core/services/api/deliveries-api.service';

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
  imports: [RouterLink, DatePipe, PageHeaderComponent, StatusBadgeComponent, ButtonComponent],
  template: `
    <edq-page-header title="Entregas" subtitle="Acompanhe todas as entregas" />

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
      <div class="table-loading" aria-live="polite">Carregando entregas...</div>
    } @else if (error()) {
      <div class="table-error" role="alert">{{ error() }}</div>
    } @else {
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
                <td><span class="mono">{{ delivery.orderSelectionId }}</span></td>
                <td>{{ delivery.orderSelection?.proposal?.supplier?.companyName ?? '—' }}</td>
                <td><edq-status-badge [status]="delivery.status" /></td>
                <td class="date-cell">{{ delivery.scheduledAt | date:'dd/MM/yyyy HH:mm' }}</td>
                <td class="date-cell">{{ delivery.deliveredAt ? (delivery.deliveredAt | date:'dd/MM/yyyy HH:mm') : '—' }}</td>
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
    }
  `,
  styleUrl: './deliveries-list.component.scss',
})
export class DeliveriesListComponent implements OnInit {
  private readonly deliveriesApi = inject(DeliveriesApiService);

  protected readonly statusFilters = STATUS_FILTERS;
  protected readonly activeStatus  = signal<DeliveryStatus | 'all'>('all');

  protected readonly deliveries = signal<Delivery[]>([]);
  protected readonly isLoading  = signal(false);
  protected readonly error      = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.deliveriesApi.list().subscribe({
      next:  res => { this.deliveries.set(res.data); this.isLoading.set(false); },
      error: ()  => { this.error.set('Erro ao carregar entregas.'); this.isLoading.set(false); },
    });
  }

  protected readonly filteredDeliveries = computed(() => {
    const status = this.activeStatus();
    if (status === 'all') return this.deliveries();
    return this.deliveries().filter(d => d.status === status);
  });
}
