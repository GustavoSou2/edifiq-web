import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

import { createButtonConfig } from '../../factories/button.factory';
import { ButtonSize, ButtonType, ButtonVariant } from '../../types/ui.types';

/**
 * Edifiq — Button Component
 *
 * Componente de botão global com suporte a:
 * - 5 variantes visuais (primary, secondary, ghost, danger, success)
 * - 3 tamanhos (sm, md, lg)
 * - Estado de loading com spinner
 * - Estado desabilitado
 * - Largura total
 * - Modo icon-only (padding quadrado)
 * - Slot para ícone à esquerda ou direita via ng-content
 *
 * @example
 * <edq-button variant="primary" size="md">Criar Pedido</edq-button>
 * <edq-button variant="danger" [loading]="isSaving()">Excluir</edq-button>
 * <edq-button variant="secondary" [fullWidth]="true">Ver Propostas</edq-button>
 */
@Component({
  selector: 'edq-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [class]="config().hostClass"
      [type]="type()"
      [disabled]="config().ariaDisabled"
      [attr.aria-disabled]="config().ariaDisabled"
      [attr.aria-busy]="loading()"
      [attr.aria-label]="ariaLabel() || null"
      (click)="handleClick($event)"
    >
      <!-- Spinner de loading -->
      @if (loading()) {
        <span class="edq-btn__spinner" aria-hidden="true"></span>
      }

      <!-- Ícone à esquerda -->
      <ng-content select="[slot=icon-left]" />

      <!-- Conteúdo principal -->
      <span class="edq-btn__label">
        <ng-content />
      </span>

      <!-- Ícone à direita -->
      <ng-content select="[slot=icon-right]" />
    </button>
  `,
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  /* ── Inputs ─────────────────────────────────────────────── */
  readonly variant   = input<ButtonVariant>('primary');
  readonly size      = input<ButtonSize>('md');
  readonly type      = input<ButtonType>('button');
  readonly disabled  = input<boolean>(false);
  readonly loading   = input<boolean>(false);
  readonly fullWidth = input<boolean>(false);
  readonly iconOnly  = input<boolean>(false);
  readonly ariaLabel = input<string>('');

  /* ── Outputs ────────────────────────────────────────────── */
  readonly clicked = output<MouseEvent>();

  /* ── Computed ───────────────────────────────────────────── */
  readonly config = computed(() =>
    createButtonConfig(
      this.variant(),
      this.size(),
      this.disabled(),
      this.loading(),
      this.fullWidth(),
      this.iconOnly(),
    ),
  );

  /* ── Handlers ───────────────────────────────────────────── */
  handleClick(event: MouseEvent): void {
    if (this.config().ariaDisabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.clicked.emit(event);
  }
}
