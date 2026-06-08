import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupplierProfileApiService, SupplierProfile } from './api/supplier-profile-api.service';

export type PanelRole = 'buyer' | 'supplier';

export interface PanelConfig {
  role:        PanelRole;
  label:       string;
  description: string;
  color:       string;
  accentColor: string;
  icon:        string;
  dashboardPath: string;
}

export const PANEL_CONFIGS: Record<PanelRole, PanelConfig> = {
  buyer: {
    role:          'buyer',
    label:         'Comprador',
    description:   'Crie pedidos e gerencie propostas',
    color:         '#4F46E5',
    accentColor:   '#6366f1',
    icon:          'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
    dashboardPath: '/app/dashboard',
  },
  supplier: {
    role:          'supplier',
    label:         'Fornecedor',
    description:   'Responda pedidos e gerencie entregas',
    color:         '#059669',
    accentColor:   '#10b981',
    icon:          'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    dashboardPath: '/app/supplier-dashboard',
  },
};

@Injectable({ providedIn: 'root' })
export class RolePanelService {
  private readonly supplierProfileApi = inject(SupplierProfileApiService);
  private readonly router             = inject(Router);

  private readonly STORAGE_KEY = 'edq_panel_role';

  private readonly _role = signal<PanelRole>(this.loadFromStorage());

  /** true durante a animação de transição entre painéis */
  readonly isTransitioning = signal(false);

  /** Perfil de fornecedor do tenant logado */
  readonly supplierProfile = signal<SupplierProfile | null>(null);
  readonly profileLoading  = signal(false);
  readonly needsOnboarding = signal(false);

  readonly role          = this._role.asReadonly();
  readonly isBuyer       = computed(() => this._role() === 'buyer');
  readonly isSupplier    = computed(() => this._role() === 'supplier');
  readonly currentConfig = computed(() => PANEL_CONFIGS[this._role()]);

  loadSupplierProfile(): void {
    if (this.profileLoading()) return;
    this.profileLoading.set(true);
    this.supplierProfileApi.getProfile().subscribe({
      next: profile => {
        this.supplierProfile.set(profile);
        this.needsOnboarding.set(false);
        this.profileLoading.set(false);
      },
      error: (err) => {
        this.profileLoading.set(false);
        if (err?.status === 404) {
          this.supplierProfile.set(null);
          this.needsOnboarding.set(true);
        }
      },
    });
  }

  onboardingComplete(profile: SupplierProfile): void {
    this.supplierProfile.set(profile);
    this.needsOnboarding.set(false);
  }

  /**
   * Muda o painel com animação de transição.
   * Mostra loading por 1.8s, navega para o dashboard do novo painel,
   * depois esconde o loading.
   */
  setRole(role: PanelRole): void {
    if (this._role() === role) return;

    this.isTransitioning.set(true);
    this._role.set(role);
    localStorage.setItem(this.STORAGE_KEY, role);

    // Navega para o dashboard do novo painel durante a transição
    const targetPath = PANEL_CONFIGS[role].dashboardPath;

    setTimeout(() => {
      this.router.navigate([targetPath]);
      setTimeout(() => {
        this.isTransitioning.set(false);
      }, 600); // fade-out após navegar
    }, 1800); // duração da animação
  }

  toggle(): void {
    this.setRole(this._role() === 'buyer' ? 'supplier' : 'buyer');
  }

  private loadFromStorage(): PanelRole {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored === 'supplier' ? 'supplier' : 'buyer';
  }
}
