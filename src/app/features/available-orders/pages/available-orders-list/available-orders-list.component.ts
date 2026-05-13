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
import { FormsModule } from '@angular/forms';

import { PageHeaderComponent }  from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ButtonComponent }      from '../../../../shared/components/button/button.component';
import { InputComponent }       from '../../../../shared/components/input/input.component';
import { Order, OrderSummary, OrderStatus }   from '../../../../shared/types/domain.types';
import { OrdersApiService }     from '../../../../core/services/api/orders-api.service';
import { filter, map } from 'rxjs';

const STATUS_FILTERS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all',        label: 'Todos' },
  { value: 'open',       label: 'Aberto' },
];

@Component({
  selector: 'edq-available-orders-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, FormsModule, PageHeaderComponent, StatusBadgeComponent, ButtonComponent, InputComponent],
  template: `
    <edq-page-header
      title="Pedidos Disponíveis"
      subtitle="Pedidos abertos para envio de propostas"
    />

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
          placeholder="Buscar pedido ou cidade..."
          size="sm"
          [(value)]="searchQuery"
        >
          <span slot="prefix">🔍</span>
        </edq-input>

        <label class="urgent-toggle">
          <input type="checkbox" [(ngModel)]="urgentOnly" />
          <span>Apenas urgentes</span>
        </label>
      </div>
    </div>

    @if (isLoading()) {
      <div class="table-loading" aria-live="polite">Carregando pedidos...</div>
    } @else if (error()) {
      <div class="table-error" role="alert">{{ error() }}</div>
    } @else {
      <p class="results-count">
        {{ filteredOrders().length }} pedido{{ filteredOrders().length !== 1 ? 's' : '' }} encontrado{{ filteredOrders().length !== 1 ? 's' : '' }}
      </p>

      <div class="orders-grid">
        @for (order of filteredOrders(); track order.id) {
          <div class="order-card">

            <div class="order-card__header">
              <div class="order-card__ref-row">
                <span class="order-card__ref">{{ order.title }}</span>
              </div>
              <edq-status-badge [status]="order.status" />
            </div>

            <p class="order-card__items">
              {{ order.deliveryCity ? '📍 ' + order.deliveryCity + ', ' + order.deliveryState : '—' }}
            </p>

            @if (order.deliveryCity) {
              <div class="order-card__auction">
                <span class="order-card__auction-icon">📅</span>
                <span>{{ order.createdAt | date:'dd/MM/yyyy' }}</span>
              </div>
            }

            <div class="order-card__footer">
              <span class="order-card__proposals">
                {{ order.isUrgent ? '🔥 Urgente' : 'Normal' }}
              </span>
              <edq-button variant="primary" size="sm" [routerLink]="[order.id]">
                Enviar Proposta
              </edq-button>
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <span>🔍</span>
            <p>Nenhum pedido disponível no momento.</p>
            <span class="empty-state__hint">Novos pedidos aparecem aqui assim que forem publicados.</span>
          </div>
        }
      </div>
    }
  `,
  styleUrl: './available-orders-list.component.scss',
})
export class AvailableOrdersListComponent implements OnInit {
  private readonly ordersApi = inject(OrdersApiService);

  protected readonly statusFilters = STATUS_FILTERS;
  protected readonly activeStatus  = signal<OrderStatus | 'all'>('all');
  protected searchQuery            = '';
  protected urgentOnly             = false;

  protected readonly orders    = signal<OrderSummary[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly error     = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.ordersApi.list({ status: 'open' }).pipe(map((orders: any) => orders.filter((order: any) => order.status === 'open'))).subscribe({
      next:  (orders: any) => { this.orders.set(orders); this.isLoading.set(false); },
      error: ()  => { this.error.set('Erro ao carregar pedidos.'); this.isLoading.set(false); },
    });
  }

  protected readonly filteredOrders = computed(() => {
    let list = this.orders();
    const status = this.activeStatus();
    if (status !== 'all') list = list.filter(o => o.status === status);
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(o => o.title?.toLowerCase().includes(q));
    }
    return list;
  });
}
