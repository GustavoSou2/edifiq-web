import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  DeliveryStatus,
  OrderStatus,
  ProposalStatus,
  SupplierStatus,
} from '../../types/domain.types';

type AnyStatus = OrderStatus | ProposalStatus | DeliveryStatus | SupplierStatus;

interface BadgeConfig {
  label: string;
  cls:   string;
  dot:   string;
}

const STATUS_MAP: Record<string, BadgeConfig> = {
  /* Orders */
  draft:       { label: 'Rascunho',          cls: 'badge--muted',   dot: '#A09D97' },
  open:        { label: 'Aberto',             cls: 'badge--info',    dot: '#0F6CBD' },
  in_auction:  { label: 'Em Leilão',          cls: 'badge--auction', dot: '#E8521A' },
  selected:    { label: 'Proposta Escolhida', cls: 'badge--warning', dot: '#C47A00' },
  confirmed:   { label: 'Confirmado',         cls: 'badge--success', dot: '#1A9E5C' },
  cancelled:   { label: 'Cancelado',          cls: 'badge--danger',  dot: '#D93025' },
  expired:     { label: 'Expirado',           cls: 'badge--muted',   dot: '#A09D97' },
  /* Proposals */
  pending:     { label: 'Aguardando',         cls: 'badge--info',    dot: '#0F6CBD' },
  submitted:   { label: 'Enviada',            cls: 'badge--warning', dot: '#C47A00' },
  accepted:    { label: 'Aceita',             cls: 'badge--success', dot: '#1A9E5C' },
  rejected:    { label: 'Recusada',           cls: 'badge--danger',  dot: '#D93025' },
  withdrawn:   { label: 'Retirada',           cls: 'badge--muted',   dot: '#A09D97' },
  /* Deliveries */
  scheduled:   { label: 'Agendado',           cls: 'badge--info',    dot: '#0F6CBD' },
  in_transit:  { label: 'Em Trânsito',        cls: 'badge--warning', dot: '#C47A00' },
  delivered:   { label: 'Entregue',           cls: 'badge--success', dot: '#1A9E5C' },
  failed:      { label: 'Falhou',             cls: 'badge--danger',  dot: '#D93025' },
  returned:    { label: 'Devolvido',          cls: 'badge--muted',   dot: '#A09D97' },
  /* Suppliers */
  active:      { label: 'Ativo',              cls: 'badge--success', dot: '#1A9E5C' },
  inactive:    { label: 'Inativo',            cls: 'badge--muted',   dot: '#A09D97' },
  blocked:     { label: 'Bloqueado',          cls: 'badge--danger',  dot: '#D93025' },
};

/**
 * StatusBadgeComponent — badge semântico de status.
 *
 * @example
 * <edq-status-badge status="in_auction" />
 * <edq-status-badge status="delivered" />
 */
@Component({
  selector: 'edq-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge" [class]="config().cls">
      <span class="badge__dot" [style.background]="config().dot" aria-hidden="true"></span>
      {{ config().label }}
    </span>
  `,
  styles: [`
    .badge {
      display:       inline-flex;
      align-items:   center;
      gap:           5px;
      padding:       3px 10px;
      border-radius: var(--radius-full);
      font-size:     var(--text-xs);
      font-weight:   600;
      white-space:   nowrap;
      letter-spacing: 0.01em;
    }
    .badge__dot {
      width:         6px;
      height:        6px;
      border-radius: var(--radius-full);
      flex-shrink:   0;
    }
    .badge--info    { background: var(--color-info-bg);    color: var(--color-info); }
    .badge--success { background: var(--color-success-bg); color: var(--color-success); }
    .badge--warning { background: var(--color-warning-bg); color: var(--color-warning); }
    .badge--danger  { background: var(--color-danger-bg);  color: var(--color-danger); }
    .badge--muted   { background: var(--color-surface-alt); color: var(--color-text-secondary); }
    .badge--auction {
      background: var(--color-primary-light);
      color:      var(--color-primary-dark);
      animation:  pulse-urgent 2s infinite;
    }
  `],
})
export class StatusBadgeComponent {
  readonly status = input.required<AnyStatus>();

  readonly config = computed(
    () => STATUS_MAP[this.status()] ?? { label: this.status(), cls: 'badge--muted', dot: '#A09D97' },
  );
}
