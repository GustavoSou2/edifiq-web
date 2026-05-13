import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from 'src/app/features/auth/services/auth.service';
import { TenantApiService } from './api';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

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
    color:       '#4F46E5',
    icon:        'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
  },
  supplier: {
    role:        'supplier',
    label:       'Fornecedor',
    description: 'Responda pedidos e gerencie entregas',
    color:       '#059669',
    icon:        'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
};

/**
 * RolePanelService — gerencia qual painel está ativo (Comprador ou Fornecedor).
 * Persiste a escolha no localStorage para sobreviver a reloads.
 */
@Injectable({ providedIn: 'root' })
export class RolePanelService {
  private authService = inject(AuthService);
  private tenantApiService = inject(TenantApiService);

  private readonly STORAGE_KEY = 'edq_panel_role';

  private readonly _role = signal<PanelRole>(this.loadFromStorage());
  private hasSupplier   = signal<boolean>(true);

  readonly role          = this._role.asReadonly();
  readonly isBuyer       = computed(() => this._role() === 'buyer');
  readonly isSupplier    = computed(() => this._role() === 'supplier');
  readonly currentConfig = computed(() => PANEL_CONFIGS[this._role()]);

  private tenantId = this.authService.tenantId();


  constructor() {
    this.tenantApiService.listSupplierByTenantId(<string>this.tenantId).pipe(
      map(({_embedded: {suppliers}}: any) => {
        this.hasSupplier.set(!!suppliers && suppliers.length > 0)
      })
    ).subscribe();

  }

  setRole(role: PanelRole): void {
    if (role === 'supplier' && !this.hasSupplier()) {

    } else  {
      this._role.set(role);
      localStorage.setItem(this.STORAGE_KEY, role);
    }
    
  }

  toggle(): void {
    this.setRole(this._role() === 'buyer' ? 'supplier' : 'buyer');
  }

  private loadFromStorage(): PanelRole {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored === 'supplier' ? 'supplier' : 'buyer';
  }
}
