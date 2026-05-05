import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

interface TimelineStep {
  icon:      string;
  label:     string;
  datetime:  string;
  completed: boolean;
  current:   boolean;
}

const TIMELINE_STEPS: TimelineStep[] = [
  { icon: '✅', label: 'Pedido Confirmado',    datetime: '15/01/2024 09:55', completed: true,  current: false },
  { icon: '📅', label: 'Entrega Agendada',     datetime: '15/01/2024 10:30', completed: true,  current: false },
  { icon: '🚚', label: 'Saiu para Entrega',    datetime: '16/01/2024 08:00', completed: true,  current: true  },
  { icon: '📦', label: 'Entregue',             datetime: '—',                completed: false, current: false },
];

@Component({
  selector: 'edq-delivery-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeaderComponent, StatusBadgeComponent, ButtonComponent],
  template: `
    <edq-page-header title="Entrega #DEL-0042" subtitle="Acompanhe o status desta entrega">
      <edq-button slot="actions" variant="secondary" size="sm" routerLink="../">← Voltar</edq-button>
    </edq-page-header>

    <!-- Info cards -->
    <div class="info-grid">
      <div class="info-card">
        <span class="info-card__label">Status</span>
        <edq-status-badge status="in_transit" />
      </div>
      <div class="info-card">
        <span class="info-card__label">Fornecedor</span>
        <span class="info-card__value">Depósito Central Ltda</span>
      </div>
      <div class="info-card">
        <span class="info-card__label">Pedido</span>
        <span class="info-card__value mono">#EDQ-2024-0042</span>
      </div>
      <div class="info-card">
        <span class="info-card__label">Agendado para</span>
        <span class="info-card__value">16/01/2024 às 08:00</span>
      </div>
      <div class="info-card">
        <span class="info-card__label">Código de Rastreamento</span>
        <span class="info-card__value mono">TRK-003</span>
      </div>
    </div>

    <!-- Timeline -->
    <div class="timeline-section">
      <h2 class="section-title">Linha do Tempo</h2>
      <div class="timeline">
        @for (step of timelineSteps; track step.label; let last = $last) {
          <div class="timeline-item" [class.timeline-item--completed]="step.completed" [class.timeline-item--current]="step.current">
            <div class="timeline-icon-col">
              <div class="timeline-icon" [class.timeline-icon--completed]="step.completed" [class.timeline-icon--current]="step.current">
                {{ step.icon }}
              </div>
              @if (!last) {
                <div class="timeline-line" [class.timeline-line--completed]="step.completed"></div>
              }
            </div>
            <div class="timeline-content">
              <span class="timeline-label" [class.timeline-label--current]="step.current">{{ step.label }}</span>
              <span class="timeline-datetime">{{ step.datetime }}</span>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './delivery-detail.component.scss',
})
export class DeliveryDetailComponent {
  readonly id = input<string>('');

  protected readonly timelineSteps = TIMELINE_STEPS;
}
