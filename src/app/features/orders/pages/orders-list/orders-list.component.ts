import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import { PageHeaderComponent }  from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ButtonComponent }      from '../../../../shared/components/button/button.component';
import { InputComponent }       from '../../../../shared/components/input/input.component';
import { Order, OrderStatus }   from '../../../../shared/types/domain.types';
import { OrdersApiService }     from '../../../../core/services/api/orders-api.service';
import { DatePipe }             from '@angular/common';

const STATUS_FILTERS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all',        label: 'Todos' },
  { value: 'draft',      label: 'Rascunho' },
  { value: 'open',       label: 'Aberto' },
  { value: 'in_auction', label: 'Em Leilão' },
  { value: 'selected',   label: 'Selecionado' },
  { value: 'confirmed',  label: 'Confirmado' },
  { value: 'cancelled',  label: 'Cancelado' },
];

@Component({
  selector: 'edq-orders-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule, PageHeaderComponent, StatusBadgeComponent, ButtonComponent, InputComponent, DatePipe],
  template: `
    <edq-page-header title="Pedidos" subtitle="Gerencie todos os pedidos de materiais">
      <edq-button slot="actions" variant="secondary" size="sm">Exportar</edq-button>
      <edq-button slot="actions" variant="primary"   size="sm" routerLink="new">+ Novo Pedido</edq-button>
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
          placeholder="Buscar pedido..."
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
      <div class="table-wrapper">
        <table class="data-table" aria-label="Lista de pedidos">
          <thead>
            <tr>
              <th scope="col">Título</th>
              <th scope="col">Status</th>
              <th scope="col">Itens</th>
              <th scope="col">Criado em</th>
              <th scope="col"><span class="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            @for (order of filteredOrders(); track order.id) {
              <tr class="table-row">
                <td>
                  <div class="ref-cell">
                    <span class="ref-code">{{ order.title }}</span>
                  </div>
                </td>
                <td><edq-status-badge [status]="order.status" /></td>
                <td class="city-cell">{{ order.items?.length ?? 0 }} item(s)</td>
                <td>
                  <span class="proposal-count">—</span>
                </td>
                <td class="date-cell">{{ order.createdAt | date:'dd/MM/yyyy' }}</td>
                <td>
                  <div class="row-actions">
                    <edq-button variant="ghost" size="sm" [routerLink]="[order.id]">Ver</edq-button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6">
                  <div class="table-empty">
                    <span>📦</span>
                    <p>Nenhum pedido encontrado.</p>
                    <edq-button variant="primary" size="sm" routerLink="new">Criar primeiro pedido</edq-button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styleUrl: './orders-list.component.scss',
})
export class OrdersListComponent implements OnInit {
  private readonly ordersApi = inject(OrdersApiService);

  protected readonly statusFilters = STATUS_FILTERS;
  protected readonly activeStatus  = signal<OrderStatus | 'all'>('all');
  protected searchQuery            = '';
  protected urgentOnly             = false;

  protected readonly orders    = signal<Order[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly error     = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.ordersApi.list().subscribe({
      next:  res  => { this.orders.set(res.data); this.isLoading.set(false); },
      error: ()   => { this.error.set('Erro ao carregar pedidos.'); this.isLoading.set(false); },
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
