import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { ToastService } from '../../services/toast.service';
import { ToastItemComponent } from './toast-item.component';

/**
 * ToastContainerComponent — renderiza a pilha de toasts.
 * Deve ser adicionado UMA VEZ no AppComponent ou no layout raiz.
 *
 * @example
 * // app.ts
 * imports: [ToastContainerComponent]
 *
 * // app.html
 * <edq-toast-container />
 */
@Component({
  selector: 'edq-toast-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ToastItemComponent],
  template: `
    <div
      class="toast-container"
      role="region"
      aria-label="Notificações"
      aria-live="polite"
      aria-atomic="false"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <edq-toast-item
          [toast]="toast"
          (dismissed)="toastService.dismiss($event)"
        />
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position:       fixed;
      bottom:         var(--space-6);
      right:          var(--space-6);
      z-index:        9999;
      display:        flex;
      flex-direction: column;
      gap:            var(--space-3);
      pointer-events: none;
      max-width:      380px;
      width:          calc(100vw - var(--space-12));

      @media (max-width: 480px) {
        bottom:    var(--space-4);
        right:     var(--space-4);
        left:      var(--space-4);
        max-width: 100%;
        width:     auto;
      }
    }
  `],
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
}
