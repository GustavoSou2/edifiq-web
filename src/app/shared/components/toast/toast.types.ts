export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Toast {
  id:        string;
  type:      ToastType;
  title:     string;
  message?:  string;
  duration?: number;   // ms — 0 = persiste até fechar manualmente
  closable?: boolean;
}

export interface ToastOptions {
  message?:  string;
  duration?: number;
  closable?: boolean;
}
