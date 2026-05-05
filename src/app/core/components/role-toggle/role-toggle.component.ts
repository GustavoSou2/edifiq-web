import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RolePanelService, PanelRole, PANEL_CONFIGS } from '../../services/role-panel.service';

/**
 * RoleToggleComponent — toggle no header para alternar entre
 * painel de Comprador e painel de Fornecedor.
 *
 * Exibe um dropdown com as duas opções e um indicador visual
 * do painel ativo.
 */
@Component({
  selector: 'edq-role-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="role-toggle" [class.role-toggle--open]="open()">

      <!-- Trigger -->
      <button
        class="role-trigger"
        type="button"
        [attr.aria-expanded]="open()"
        aria-haspopup="listbox"
        aria-label="Alternar painel"
        (click)="toggleOpen()"
      >
        <span class="role-trigger__icon">{{ panelService.currentConfig().icon }}</span>

        <div class="role-trigger__text">
          <span class="role-trigger__label">{{ panelService.currentConfig().label }}</span>
          <span class="role-trigger__sub">Painel ativo</span>
        </div>

        <svg
          class="role-trigger__chevron"
          [class.role-trigger__chevron--up]="open()"
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          aria-hidden="true"
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <!-- Dropdown -->
      @if (open()) {
        <div
          class="role-dropdown"
          role="listbox"
          aria-label="Selecionar painel"
        >
          <div class="role-dropdown__header">
            Alternar painel
          </div>

          @for (config of panels; track config.role) {
            <button
              class="role-option"
              role="option"
              type="button"
              [class.role-option--active]="panelService.role() === config.role"
              [attr.aria-selected]="panelService.role() === config.role"
              (click)="selectRole(config.role)"
            >
              <div class="role-option__icon" [style.background]="config.color + '20'" [style.color]="config.color">
                {{ config.icon }}
              </div>
              <div class="role-option__text">
                <span class="role-option__label">{{ config.label }}</span>
                <span class="role-option__desc">{{ config.description }}</span>
              </div>
              @if (panelService.role() === config.role) {
                <span class="role-option__check" aria-hidden="true">✓</span>
              }
            </button>
          }

          <div class="role-dropdown__footer">
            <span class="role-dropdown__hint">
              A navegação muda conforme o painel selecionado
            </span>
          </div>
        </div>

        <!-- Backdrop para fechar ao clicar fora -->
        <div class="role-backdrop" (click)="close()"></div>
      }

    </div>
  `,
  styleUrl: './role-toggle.component.scss',
})
export class RoleToggleComponent {
  protected readonly panelService = inject(RolePanelService);
  protected readonly open         = signal(false);

  protected readonly panels = Object.values(PANEL_CONFIGS);

  toggleOpen(): void {
    this.open.update(v => !v);
  }

  close(): void {
    this.open.set(false);
  }

  selectRole(role: PanelRole): void {
    this.panelService.setRole(role);
    this.close();
  }
}
