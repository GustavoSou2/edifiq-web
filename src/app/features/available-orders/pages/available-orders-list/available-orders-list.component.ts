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
import { ProposalsApiService, ReceivedDistribution } from '../../../../core/services/api/proposals-api.service';

@Component({
  selector: 'edq-available-orders-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, FormsModule, PageHeaderComponent, StatusBadgeComponent, ButtonComponent, InputComponent],
  template: `
    <edq-page-header
      title="Pedidos Disponíveis"
      subtitle="Pedidos distribuídos para você enviar propostas"
    />

    <div class="filters-bar">
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
        {{ filtered().length }} pedido{{ filtered().length !== 1 ? 's' : '' }} encontrado{{ filtered().length !== 1 ? 's' : '' }}
      </p>

      <div class="orders-grid">
        @for (dist of filtered(); track dist.id) {
          <div class="order-card">
            <div class="order-card__header">
              <div class="order-card__ref-row">
                <span class="order-card__ref">
                  {{ dist.order?.referenceCode ?? dist.order?.title ?? dist.orderId }}
                </span>
                @if (dist.order?.isUrgent) {
                  <span class="badge-urgent">URGENTE</span>
                }
              </div>
              <edq-status-badge [status]="$any(dist.status)" />
            </div>

            @if (dist.order?.deliveryCity) {
              <p class="order-card__location">
                📍 {{ dist.order!.deliveryCity }}, {{ dist.order!.deliveryState }}
              </p>
            }

            <p class="order-card__items-count">
              {{ dist.order?.items?.length ?? 0 }} ite{{ (dist.order?.items?.length ?? 0) === 1 ? 'm' : 'ns' }}
            </p>

            <div class="order-card__footer">
              <span class="order-card__date">{{ dist.distributedAt | date:'dd/MM/yyyy' }}</span>
              <edq-button variant="primary" size="sm" [routerLink]="[dist.id]">
                Ver e Propor
              </edq-button>
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <span>🔍</span>
            <p>Nenhum pedido disponível no momento.</p>
            <span class="empty-state__hint">
              Novos pedidos aparecem aqui quando compradores publicam pedidos na sua região.
            </span>
          </div>
        }
      </div>
    }
  `,
  styleUrl: './available-orders-list.component.scss',
})
export class AvailableOrdersListComponent implements OnInit {
  private readonly proposalsApi = inject(ProposalsApiService);

  protected searchQuery = '';
  protected urgentOnly  = false;

  protected readonly distributions = signal<ReceivedDistribution[]>([]);
  protected readonly isLoading     = signal(false);
  protected readonly error         = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.proposalsApi.listReceived().subscribe({
      next:  dists => { this.distributions.set(dists); this.isLoading.set(false); },
      error: ()    => { this.error.set('Erro ao carregar pedidos disponíveis.'); this.isLoading.set(false); },
    });
  }

  protected readonly filtered = computed(() => {
    let list = this.distributions();

    if (this.urgentOnly) {
      list = list.filter(d => d.order?.isUrgent);
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(d =>
        d.order?.title?.toLowerCase().includes(q) ||
        d.order?.referenceCode?.toLowerCase().includes(q) ||
        d.order?.deliveryCity?.toLowerCase().includes(q),
      );
    }

    return list;
  });
}
