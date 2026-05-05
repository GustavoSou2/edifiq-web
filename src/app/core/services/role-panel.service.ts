import { Injectable, computed, signal } from '@angular/core';

export type PanelRole = 'buyer' | 'supplier';

export interface PanelConfig {
  role:        PanelRole;
  label:       string;
  description: string;
  color:       string;
  icon:        string;
}

export const PANEL_CONFIGS: Record<PanelRole, PanelConfig> = {
  buyer: {
    role:        'buyer',
    label:       'Comprador',
    description: 'Crie pedidos e gerencie propostas',
    color:       '#6C5CE7',
    icon:        '🛒',
  },
  supplier: {
    role:        'supplier',
    label:       'Fornecedor',
    description: 'Responda pedidos e gerencie entregas',
    color:       '#00C875',
    icon:        '🏭',
  },
};

/**
 * RolePanelService — gerencia qual painel está ativo (Comprador ou Fornecedor).
 * Persiste a escolha no localStorage para sobreviver a reloads.
 */
@Injectable({ providedIn: 'root' })
export class RolePanelService {
  private readonly STORAGE_KEY = 'edq_panel_role';

  private readonly _role = signal<PanelRole>(this.loadFromStorage());

  readonly role          = this._role.asReadonly();
  readonly isBuyer       = computed(() => this._role() === 'buyer');
  readonly isSupplier    = computed(() => this._role() === 'supplier');
  readonly currentConfig = computed(() => PANEL_CONFIGS[this._role()]);

  setRole(role: PanelRole): void {
    this._role.set(role);
    localStorage.setItem(this.STORAGE_KEY, role);
  }

  toggle(): void {
    this.setRole(this._role() === 'buyer' ? 'supplier' : 'buyer');
  }

  private loadFromStorage(): PanelRole {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored === 'supplier' ? 'supplier' : 'buyer';
  }
}
