import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  input,
  output,
  signal,
} from '@angular/core';
import { Toast, ToastType } from './toast.types';

interface ToastMeta {
  icon:        string;   // SVG path data
  colorClass:  string;
  progressVar: string;   // CSS custom property para a cor da barra
}

const TOAST_META: Record<ToastType, ToastMeta> = {
  success: {
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>`,
    colorClass:  'toast--success',
    progressVar: 'var(--mn-green)',
  },
  error: {
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>`,
    colorClass:  'toast--error',
    progressVar: 'var(--mn-red)',
  },
  warning: {
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>`,
    colorClass:  'toast--warning',
    progressVar: 'var(--mn-yellow)',
  },
  info: {
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>`,
    colorClass:  'toast--info',
    progressVar: 'var(--mn-blue)',
  },
  loading: {
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="toast-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>`,
    colorClass:  'toast--loading',
    progressVar: 'var(--mn-purple)',
  },
};

@Component({
  selector: 'edq-toast-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="toast-item"
      [class]="meta().colorClass"
      [class.toast-item--leaving]="leaving()"
      role="alert"
      [attr.aria-label]="toast().title"
    >
      <!-- Barra de progresso -->
      @if ((toast().duration ?? 0) > 0) {
        <div
          class="toast-progress"
          [style.animation-duration.ms]="toast().duration"
          [style.background]="meta().progressVar"
        ></div>
      }

      <!-- Ícone -->
      <div class="toast-icon" [innerHTML]="meta().icon"></div>

      <!-- Conteúdo -->
      <div class="toast-content">
        <span class="toast-title">{{ toast().title }}</span>
        @if (toast().message) {
          <span class="toast-message">{{ toast().message }}</span>
        }
      </div>

      <!-- Botão fechar -->
      @if (toast().closable) {
        <button
          class="toast-close"
          type="button"
          aria-label="Fechar notificação"
          (click)="close()"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      }
    </div>
  `,
  styleUrl: './toast-item.component.scss',
})
export class ToastItemComponent implements OnInit, OnDestroy {
  readonly toast     = input.required<Toast>();
  readonly dismissed = output<string>();

  protected readonly leaving = signal(false);
  protected readonly meta    = () => TOAST_META[this.toast().type];

  private leaveTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    /* Pequeno delay para acionar a animação de entrada */
    requestAnimationFrame(() => {});
  }

  ngOnDestroy(): void {
    if (this.leaveTimer) clearTimeout(this.leaveTimer);
  }

  close(): void {
    /* Anima saída antes de emitir */
    this.leaving.set(true);
    this.leaveTimer = setTimeout(() => {
      this.dismissed.emit(this.toast().id);
    }, 280);
  }
}
