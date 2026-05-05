import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

/**
 * PageHeaderComponent — cabeçalho padrão de página.
 * Exibe título, subtítulo e um slot para ações (botões).
 *
 * @example
 * <edq-page-header title="Pedidos" subtitle="Gerencie seus pedidos">
 *   <edq-button slot="actions" variant="primary">Novo Pedido</edq-button>
 * </edq-page-header>
 */
@Component({
  selector: 'edq-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div class="page-header__text">
        <h1 class="page-header__title">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="page-header__subtitle">{{ subtitle() }}</p>
        }
      </div>
      <div class="page-header__actions">
        <ng-content select="[slot=actions]" />
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display:         flex;
      align-items:     flex-start;
      justify-content: space-between;
      gap:             var(--space-4);
      margin-bottom:   var(--space-8);
      flex-wrap:       wrap;
    }
    .page-header__text { display: flex; flex-direction: column; gap: var(--space-1); }
    .page-header__title {
      font-family:    var(--font-display);
      font-size:      var(--text-2xl);
      font-weight:    800;
      color:          var(--color-text-primary);
      letter-spacing: -0.03em;
      line-height:    1.15;
    }
    .page-header__subtitle {
      font-size: var(--text-base);
      color:     var(--color-text-secondary);
    }
    .page-header__actions {
      display:     flex;
      align-items: center;
      gap:         var(--space-3);
      flex-shrink: 0;
    }
  `],
})
export class PageHeaderComponent {
  readonly title    = input.required<string>();
  readonly subtitle = input<string>('');
}
