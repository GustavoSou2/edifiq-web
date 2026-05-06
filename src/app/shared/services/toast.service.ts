import { Injectable, signal } from '@angular/core';
import { Toast, ToastOptions, ToastType } from '../components/toast/toast.types';

const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 3500,
  error:   6000,
  warning: 5000,
  info:    4000,
  loading: 0,      // persiste até ser fechado manualmente
};

/**
 * ToastService — gerencia a fila de notificações via signals.
 *
 * @example
 * const toast = inject(ToastService);
 *
 * toast.success('Pedido criado!');
 * toast.error('Falha ao salvar', { message: 'Verifique os campos.' });
 * toast.warning('Leilão expirando', { message: '5 minutos restantes.' });
 * toast.info('Nova proposta recebida');
 *
 * // Loading — retorna o id para fechar depois
 * const id = toast.loading('Salvando pedido...');
 * toast.dismiss(id);
 *
 * // Fechar todos
 * toast.clear();
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  private readonly timers  = new Map<string, ReturnType<typeof setTimeout>>();

  readonly toasts = this._toasts.asReadonly();

  /* ── Atalhos por tipo ───────────────────────────────────── */

  success(title: string, options?: ToastOptions): string {
    return this.add('success', title, options);
  }

  error(title: string, options?: ToastOptions): string {
    return this.add('error', title, options);
  }

  warning(title: string, options?: ToastOptions): string {
    return this.add('warning', title, options);
  }

  info(title: string, options?: ToastOptions): string {
    return this.add('info', title, options);
  }

  loading(title: string, options?: ToastOptions): string {
    return this.add('loading', title, { duration: 0, closable: true, ...options });
  }

  /* ── Controle ───────────────────────────────────────────── */

  dismiss(id: string): void {
    this.remove(id);
  }

  clear(): void {
    this.timers.forEach(t => clearTimeout(t));
    this.timers.clear();
    this._toasts.set([]);
  }

  /* ── Interno ────────────────────────────────────────────── */

  private add(type: ToastType, title: string, options?: ToastOptions): string {
    const id       = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const duration = options?.duration ?? DEFAULT_DURATION[type];
    const closable = options?.closable ?? true;

    const toast: Toast = { id, type, title, duration, closable, message: options?.message };

    this._toasts.update(list => [...list, toast]);

    if (duration > 0) {
      const timer = setTimeout(() => this.remove(id), duration);
      this.timers.set(id, timer);
    }

    return id;
  }

  private remove(id: string): void {
    if (this.timers.has(id)) {
      clearTimeout(this.timers.get(id));
      this.timers.delete(id);
    }
    this._toasts.update(list => list.filter(t => t.id !== id));
  }
}
