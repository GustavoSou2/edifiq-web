import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

export type StatCardTrend = 'up' | 'down' | 'neutral';

/**
 * StatCardComponent — card de métrica para dashboards.
 */
@Component({
  selector: 'edq-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stat-card">
      <div class="stat-card__header">
        <span class="stat-card__icon" aria-hidden="true">{{ icon() }}</span>
        <span class="stat-card__label">{{ label() }}</span>
      </div>
      <div class="stat-card__value">{{ value() }}</div>
      @if (change()) {
        <div class="stat-card__change" [class]="'stat-card__change--' + trend()">
          {{ trend() === 'up' ? '↑' : trend() === 'down' ? '↓' : '→' }}
          {{ change() }}
        </div>
      }
    </div>
  `,
  styles: [`
    .stat-card {
      background:    var(--color-surface);
      border:        1px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding:       var(--space-6);
      display:       flex;
      flex-direction: column;
      gap:           var(--space-3);
      transition:    box-shadow var(--transition-base);

      &:hover { box-shadow: var(--shadow-md); }
    }
    .stat-card__header {
      display:     flex;
      align-items: center;
      gap:         var(--space-2);
    }
    .stat-card__icon { font-size: 1.25rem; }
    .stat-card__label {
      font-size:   var(--text-sm);
      font-weight: 500;
      color:       var(--color-text-secondary);
    }
    .stat-card__value {
      font-family:    var(--font-display);
      font-size:      var(--text-3xl);
      font-weight:    800;
      color:          var(--color-text-primary);
      letter-spacing: -0.03em;
      line-height:    1;
    }
    .stat-card__change {
      font-size:   var(--text-xs);
      font-weight: 600;
      padding:     3px 8px;
      border-radius: var(--radius-full);
      width:       fit-content;

      &--up      { background: var(--color-success-bg); color: var(--color-success); }
      &--down    { background: var(--color-danger-bg);  color: var(--color-danger); }
      &--neutral { background: var(--color-surface-alt); color: var(--color-text-secondary); }
    }
  `],
})
export class StatCardComponent {
  readonly label  = input.required<string>();
  readonly value  = input.required<string>();
  readonly icon   = input<string>('📊');
  readonly change = input<string>('');
  readonly trend  = input<StatCardTrend>('neutral');
}
