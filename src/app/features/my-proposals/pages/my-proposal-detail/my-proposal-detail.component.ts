import {
  ChangeDetectionStrategy, Component, OnInit,
  inject, signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';

import { PageHeaderComponent }  from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ButtonComponent }      from '../../../../shared/components/button/button.component';
import { ProposalsApiService, ReceivedDistribution } from '../../../../core/services/api/proposals-api.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'edq-my-proposal-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CurrencyPipe, DatePipe, PageHeaderComponent, StatusBadgeComponent, ButtonComponent],
  template: `
    @if (isLoading()) {
      <div class="page-loading">Carregando...</div>
    } @else if (error()) {
      <div class="page-error" role="alert">{{ error() }}</div>
    } @else if (dist()) {

      <edq-page-header
        [title]="dist()!.order?.referenceCode ?? dist()!.order?.title ?? 'Proposta'"
        subtitle="Detalhes da proposta enviada"
      >
        <edq-button slot="actions" variant="ghost" size="sm" routerLink="/app/my-proposals">
          ← Voltar
        </edq-button>
      </edq-page-header>

      <div class="detail-layout">

        <!-- ── Coluna principal ──────────────────────────────── -->
        <div class="detail-main">

          <!-- Status banner -->
          @if (dist()!.proposal) {
            <div class="status-banner" [class]="statusBannerClass()">
              <edq-status-badge [status]="dist()!.proposal!.status" />
              <span>{{ statusMessage() }}</span>
            </div>
          }

          <!-- Dados da proposta -->
          @if (dist()!.proposal) {
            <div class="card">
              <h2 class="card__title">Sua Proposta</h2>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-item__label">Valor Total</span>
                  <span class="info-item__value info-item__value--price">
                    {{ dist()!.proposal!.totalPrice | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">Prazo</span>
                  <span class="info-item__value">
                    @if (dist()!.proposal!.deliveryEtaHours) {
                      {{ dist()!.proposal!.deliveryEtaHours }}h
                    } @else if (dist()!.proposal!.proposedDeliveryAt) {
                      {{ dist()!.proposal!.proposedDeliveryAt | date:'dd/MM/yyyy HH:mm' }}
                    } @else { — }
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">Distribuído em</span>
                  <span class="info-item__value">{{ dist()!.distributedAt | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                @if (dist()!.proposal!.message) {
                  <div class="info-item info-item--full">
                    <span class="info-item__label">Mensagem enviada</span>
                    <span class="info-item__value">{{ dist()!.proposal!.message }}</span>
                  </div>
                }
              </div>

              <!-- Itens cotados -->
              @if (dist()!.proposal!.items?.length) {
                <h3 class="card__subtitle">Itens Cotados</h3>
                <div class="table-wrapper">
                  <table class="data-table" aria-label="Itens da proposta">
                    <thead>
                      <tr>
                        <th scope="col">Item</th>
                        <th scope="col">Preço Unit.</th>
                        <th scope="col">Total</th>
                        <th scope="col">Disponib.</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of dist()!.proposal!.items; track item.id) {
                        <tr class="table-row" [class.row--unavail]="item.availability === 'unavailable'">
                          <td class="item-name">
                            {{ orderItemName(item.orderItemId) }}
                          </td>
                          <td class="mono">{{ item.unitPrice | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
                          <td class="mono">{{ item.totalPrice | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
                          <td>
                            @if (item.availability === 'in_stock') {
                              <span class="avail avail--ok">Disponível</span>
                            } @else if (item.availability === 'backorder') {
                              <span class="avail avail--order">Encomenda</span>
                            } @else {
                              <span class="avail avail--no">Indisponível</span>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          } @else {
            <!-- Distribuição sem proposta ainda -->
            <div class="card card--empty">
              <p>Você ainda não enviou uma proposta para este pedido.</p>
              <edq-button variant="primary" size="sm" [routerLink]="['/app/available-orders', dist()!.id]">
                Enviar Proposta
              </edq-button>
            </div>
          }

          <!-- Dados do pedido -->
          @if (dist()!.order) {
            <div class="card">
              <h2 class="card__title">Pedido do Comprador</h2>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-item__label">Entrega</span>
                  <span class="info-item__value">📍 {{ dist()!.order!.deliveryAddress }}</span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">Cidade</span>
                  <span class="info-item__value">
                    {{ dist()!.order!.deliveryCity ?? '—' }}@if (dist()!.order!.deliveryState) {, {{ dist()!.order!.deliveryState }}}
                  </span>
                </div>
                @if (dist()!.order!.notes) {
                  <div class="info-item info-item--full">
                    <span class="info-item__label">Observações</span>
                    <span class="info-item__value">{{ dist()!.order!.notes }}</span>
                  </div>
                }
              </div>

              @if (dist()!.order!.items?.length) {
                <h3 class="card__subtitle">Itens Solicitados</h3>
                <div class="table-wrapper">
                  <table class="data-table" aria-label="Itens do pedido">
                    <thead>
                      <tr>
                        <th scope="col">Descrição</th>
                        <th scope="col">Qtd</th>
                        <th scope="col">Unidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of dist()!.order!.items; track item.id) {
                        <tr class="table-row">
                          <td class="item-name">{{ item.description }}</td>
                          <td class="mono">{{ item.quantity }}</td>
                          <td class="muted-cell">{{ item.unit }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          }
        </div>

        <!-- ── Coluna lateral: ações ─────────────────────────── -->
        <aside class="detail-aside">
          <div class="action-card">
            <h3 class="action-card__title">Ações</h3>

            @if (!dist()!.proposal) {
              <p class="action-card__hint">Você ainda não enviou uma proposta para este pedido.</p>
              <edq-button variant="primary" size="md" [routerLink]="['/app/available-orders', dist()!.id]" style="width:100%">
                Enviar Proposta
              </edq-button>
            } @else if (dist()!.proposal!.status === 'submitted') {
              <p class="action-card__hint">Sua proposta está aguardando avaliação do comprador.</p>
              <edq-button
                variant="danger" size="md"
                (click)="withdraw()"
                [disabled]="isWithdrawing()"
                style="width:100%"
              >
                {{ isWithdrawing() ? 'Retirando...' : 'Retirar Proposta' }}
              </edq-button>
            } @else if (dist()!.proposal!.status === 'withdrawn') {
              <p class="action-card__hint">Você retirou esta proposta.</p>
              <edq-button variant="secondary" size="md" routerLink="/app/available-orders" style="width:100%">
                Ver Novos Pedidos
              </edq-button>
            } @else if (dist()!.proposal!.status === 'updated') {
              <p class="action-card__hint">Proposta atualizada — aguardando decisão do comprador.</p>
            }
          </div>
        </aside>
      </div>
    }
  `,
  styles: [`
    .page-loading, .page-error { padding: 48px; text-align: center; color: #6b7280; }
    .page-error { color: #dc2626; }

    .detail-layout {
      display: grid;
      grid-template-columns: 1fr 260px;
      gap: 24px;
      align-items: start;
    }
    .detail-main { display: flex; flex-direction: column; gap: 20px; }

    .status-banner {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px; border-radius: 10px;
      font-size: 13px; font-weight: 500;
    }
    .status-banner--submitted { background: #fffbeb; border: 1px solid #fcd34d; color: #92400e; }
    .status-banner--updated   { background: #eff6ff; border: 1px solid #93c5fd; color: #1e40af; }
    .status-banner--withdrawn { background: #f9fafb; border: 1px solid #e5e7eb; color: #6b7280; }

    .card {
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: 12px;
      padding: 20px 24px;
    }
    .card--empty {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; padding: 32px; text-align: center;
      color: #6b7280; font-size: 14px;
    }
    .card__title { font-size: 14px; font-weight: 700; color: var(--color-text-primary, #111827); margin: 0 0 16px; }
    .card__subtitle { font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: .05em; margin: 20px 0 10px; }

    .info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; }
    .info-item { display: flex; flex-direction: column; gap: 3px; }
    .info-item--full { grid-column: 1 / -1; }
    .info-item__label { font-size: 10px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: .05em; }
    .info-item__value { font-size: 13px; color: var(--color-text-primary, #111827); }
    .info-item__value--price { font-size: 22px; font-weight: 800; }

    .table-wrapper { border: 1px solid var(--color-border, #e5e7eb); border-radius: 9px; overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .data-table thead th {
      background: var(--color-surface-alt, #f9fafb);
      padding: 8px 12px; font-size: 10px; font-weight: 700; color: #9ca3af;
      text-transform: uppercase; letter-spacing: .05em;
      border-bottom: 1px solid var(--color-border, #e5e7eb); text-align: left;
    }
    .data-table td { padding: 9px 12px; border-bottom: 1px solid var(--color-border, #e5e7eb); vertical-align: middle; }
    .table-row:last-child td { border-bottom: none; }
    .row--unavail { opacity: .5; }
    .item-name { font-weight: 600; color: var(--color-text-primary, #111827); }
    .mono { font-family: var(--font-mono, monospace); font-size: 12px; font-weight: 600; }
    .muted-cell { font-size: 12px; color: #9ca3af; }

    .avail { padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; }
    .avail--ok    { background: #ecfdf5; color: #065f46; }
    .avail--order { background: #fffbeb; color: #92400e; }
    .avail--no    { background: #fef2f2; color: #dc2626; }

    .action-card {
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: 12px;
      padding: 20px;
      display: flex; flex-direction: column; gap: 12px;
      position: sticky; top: 24px;
    }
    .action-card__title { font-size: 14px; font-weight: 700; color: var(--color-text-primary, #111827); margin: 0; }
    .action-card__hint  { font-size: 13px; color: #6b7280; margin: 0; line-height: 1.5; }

    @media (max-width: 768px) {
      .detail-layout { grid-template-columns: 1fr; }
      .action-card { position: static; }
    }
  `],
  styleUrl: './my-proposal-detail.component.scss',
})
export class MyProposalDetailComponent implements OnInit {
  private readonly route        = inject(ActivatedRoute);
  private readonly proposalsApi = inject(ProposalsApiService);
  private readonly toast        = inject(ToastService);

  protected readonly dist         = signal<ReceivedDistribution | null>(null);
  protected readonly isLoading    = signal(false);
  protected readonly error        = signal<string | null>(null);
  protected readonly isWithdrawing = signal(false);

  ngOnInit(): void {
    const distributionId = this.route.snapshot.paramMap.get('id') ?? '';
    this.isLoading.set(true);

    this.proposalsApi.listReceived().subscribe({
      next: dists => {
        const found = dists.find(d => d.id === distributionId) ?? null;
        this.dist.set(found);
        this.isLoading.set(false);
        if (!found) this.error.set('Proposta não encontrada.');
      },
      error: () => { this.error.set('Erro ao carregar proposta.'); this.isLoading.set(false); },
    });
  }

  /** Retorna o nome do item do pedido pelo orderItemId */
  protected orderItemName(orderItemId: string): string {
    const items = this.dist()?.order?.items ?? [];
    return items.find(i => i.id === orderItemId)?.description ?? orderItemId.slice(0, 8) + '…';
  }

  protected statusMessage(): string {
    const status = this.dist()?.proposal?.status;
    const map: Record<string, string> = {
      submitted: 'Aguardando avaliação do comprador',
      updated:   'Proposta atualizada — em avaliação',
      withdrawn: 'Proposta retirada por você',
    };
    return status ? (map[status] ?? '') : '';
  }

  protected statusBannerClass(): string {
    return `status-banner--${this.dist()?.proposal?.status ?? 'submitted'}`;
  }

  protected withdraw(): void {
    const proposalId = this.dist()?.proposal?.id;
    if (!proposalId) return;

    this.isWithdrawing.set(true);
    this.proposalsApi.withdraw(proposalId).subscribe({
      next: () => {
        this.toast.success('Proposta retirada.');
        // Atualiza o status localmente
        const d = this.dist();
        if (d?.proposal) {
          this.dist.set({ ...d, proposal: { ...d.proposal, status: 'withdrawn' } });
        }
        this.isWithdrawing.set(false);
      },
      error: () => {
        this.toast.error('Erro ao retirar proposta.');
        this.isWithdrawing.set(false);
      },
    });
  }
}
