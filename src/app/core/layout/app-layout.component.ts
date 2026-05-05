import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService }      from '../../features/auth/services/auth.service';
import { RolePanelService } from '../services/role-panel.service';
import { RoleToggleComponent } from '../components/role-toggle/role-toggle.component';

interface NavItem {
  path:   string;
  label:  string;
  icon:   string;
  badge?: string;
}

/* ── Navegação por painel ───────────────────────────────────*/

const BUYER_MAIN_NAV: NavItem[] = [
  { path: '/app/dashboard',  label: 'Dashboard',   icon: '📊' },
  { path: '/app/orders',     label: 'Pedidos',      icon: '📋', badge: '3' },
  { path: '/app/deliveries', label: 'Entregas',     icon: '🚛' },
  { path: '/app/analytics',  label: 'Analytics',    icon: '📈' },
];

const SUPPLIER_MAIN_NAV: NavItem[] = [
  { path: '/app/supplier-dashboard', label: 'Dashboard',    icon: '📊' },
  { path: '/app/available-orders',   label: 'Pedidos Disponíveis', icon: '🔍', badge: '8' },
  { path: '/app/my-proposals',       label: 'Minhas Propostas',    icon: '💬' },
  { path: '/app/deliveries',         label: 'Entregas',            icon: '🚛' },
  { path: '/app/my-reputation',      label: 'Reputação',           icon: '⭐' },
];

const BUYER_SECONDARY_NAV: NavItem[] = [
  { path: '/app/suppliers', label: 'Fornecedores', icon: '🏭' },
  { path: '/app/users',     label: 'Usuários',     icon: '👥' },
  { path: '/app/settings',  label: 'Configurações', icon: '⚙️' },
  { path: '/app/profile',   label: 'Meu Perfil',   icon: '👤' },
];

const SUPPLIER_SECONDARY_NAV: NavItem[] = [
  { path: '/app/settings', label: 'Configurações', icon: '⚙️' },
  { path: '/app/profile',  label: 'Meu Perfil',    icon: '👤' },
];

@Component({
  selector: 'edq-app-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, RoleToggleComponent],
  template: `
    <div class="app-shell" [class.sidebar-collapsed]="sidebarCollapsed()">

      <!-- ── Sidebar ──────────────────────────────────────── -->
      <aside
        class="sidebar"
        [class.sidebar--collapsed]="sidebarCollapsed()"
        [class.sidebar--supplier]="rolePanel.isSupplier()"
      >

        <!-- Logo -->
        <div class="sidebar__logo">
          <div class="logo-mark">
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="10" stroke="white" stroke-width="1.5"/>
              <path d="M11 6v5l3 2" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          @if (!sidebarCollapsed()) {
            <span class="logo-text">Edifiq</span>
          }
        </div>

        <!-- Panel indicator na sidebar -->
        @if (!sidebarCollapsed()) {
          <div class="sidebar__panel-badge" [class.sidebar__panel-badge--supplier]="rolePanel.isSupplier()">
            <span>{{ rolePanel.currentConfig().icon }}</span>
            <span>{{ rolePanel.currentConfig().label }}</span>
          </div>
        }

        <!-- Nav principal -->
        <nav class="sidebar__nav" aria-label="Navegação principal">
          @for (item of mainNav(); track item.path) {
            <a
              class="nav-item"
              [routerLink]="item.path"
              routerLinkActive="nav-item--active"
              [attr.aria-label]="item.label"
              [title]="sidebarCollapsed() ? item.label : ''"
            >
              <span class="nav-item__icon" aria-hidden="true">{{ item.icon }}</span>
              @if (!sidebarCollapsed()) {
                <span class="nav-item__label">{{ item.label }}</span>
                @if (item.badge) {
                  <span class="nav-item__badge">{{ item.badge }}</span>
                }
              }
            </a>
          }
        </nav>

        <div class="sidebar__sep"></div>

        <!-- Nav secundária -->
        <nav class="sidebar__nav" aria-label="Configurações">
          @for (item of secondaryNav(); track item.path) {
            <a
              class="nav-item"
              [routerLink]="item.path"
              routerLinkActive="nav-item--active"
              [attr.aria-label]="item.label"
              [title]="sidebarCollapsed() ? item.label : ''"
            >
              <span class="nav-item__icon" aria-hidden="true">{{ item.icon }}</span>
              @if (!sidebarCollapsed()) {
                <span class="nav-item__label">{{ item.label }}</span>
              }
            </a>
          }
        </nav>

        <!-- Footer -->
        <div class="sidebar__footer">
          @if (!sidebarCollapsed()) {
            <div class="plan-chip">
              <span class="plan-chip__dot"></span>
              <span>Plano Pro</span>
            </div>
          }

          <button
            class="user-btn"
            type="button"
            [title]="authService.user()?.name ?? ''"
            (click)="handleLogout()"
            aria-label="Sair da conta"
          >
            <div class="user-avatar">{{ userInitials() }}</div>
            @if (!sidebarCollapsed()) {
              <div class="user-info">
                <span class="user-name">{{ authService.user()?.name }}</span>
                <span class="user-email">{{ authService.user()?.email }}</span>
              </div>
            }
          </button>
        </div>

        <!-- Toggle collapse -->
        <button
          class="sidebar__toggle"
          type="button"
          [attr.aria-label]="sidebarCollapsed() ? 'Expandir menu' : 'Recolher menu'"
          (click)="toggleSidebar()"
        >
          {{ sidebarCollapsed() ? '›' : '‹' }}
        </button>

      </aside>

      <!-- ── Main ──────────────────────────────────────────── -->
      <main class="app-main">

        <!-- Topbar -->
        <header class="topbar">
          <div class="topbar__left">
            <button
              class="mobile-menu-btn"
              type="button"
              aria-label="Abrir menu"
              (click)="toggleMobileMenu()"
            >
              ☰
            </button>

            <!-- Breadcrumb do painel atual -->
            <div class="topbar__panel-info">
              <span class="topbar__panel-icon">{{ rolePanel.currentConfig().icon }}</span>
              <span class="topbar__panel-label">
                Painel {{ rolePanel.currentConfig().label }}
              </span>
            </div>
          </div>

          <div class="topbar__right">
            <!-- ★ Role Toggle ★ -->
            <edq-role-toggle />

            <div class="topbar__divider"></div>

            <button class="topbar-btn" type="button" aria-label="Notificações">
              🔔
              <span class="notif-dot" aria-hidden="true"></span>
            </button>
            <button class="topbar-btn" type="button" aria-label="Ajuda">
              ❓
            </button>
          </div>
        </header>

        <!-- Panel transition banner -->
        @if (showTransitionBanner()) {
          <div
            class="panel-transition-banner"
            [class.panel-transition-banner--supplier]="rolePanel.isSupplier()"
            role="status"
            aria-live="polite"
          >
            <span class="panel-transition-banner__icon">{{ rolePanel.currentConfig().icon }}</span>
            <div class="panel-transition-banner__text">
              <strong>Painel {{ rolePanel.currentConfig().label }} ativo</strong>
              <span>{{ rolePanel.currentConfig().description }}</span>
            </div>
            <button
              class="panel-transition-banner__close"
              type="button"
              aria-label="Fechar aviso"
              (click)="dismissBanner()"
            >✕</button>
          </div>
        }

        <!-- Page content -->
        <div class="page-content">
          <router-outlet />
        </div>

      </main>

    </div>

    <!-- Mobile overlay -->
    @if (mobileMenuOpen()) {
      <div
        class="mobile-overlay"
        role="presentation"
        (click)="toggleMobileMenu()"
      ></div>
    }
  `,
  styleUrl: './app-layout.component.scss',
})
export class AppLayoutComponent {
  protected readonly authService = inject(AuthService);
  protected readonly rolePanel   = inject(RolePanelService);
  private readonly router        = inject(Router);

  protected readonly sidebarCollapsed    = signal(false);
  protected readonly mobileMenuOpen      = signal(false);
  protected readonly showTransitionBanner = signal(false);

  constructor() {
    let firstRun = true;
    effect(() => {
      /* Lê o role para registrar a dependência */
      this.rolePanel.role();
      if (firstRun) { firstRun = false; return; }
      /* Mostra o banner por 4s ao trocar de painel */
      this.showTransitionBanner.set(true);
      setTimeout(() => this.showTransitionBanner.set(false), 4000);
    });
  }

  /* Navegação reativa ao painel */
  protected readonly mainNav = computed<NavItem[]>(() =>
    this.rolePanel.isBuyer() ? BUYER_MAIN_NAV : SUPPLIER_MAIN_NAV
  );

  protected readonly secondaryNav = computed<NavItem[]>(() =>
    this.rolePanel.isBuyer() ? BUYER_SECONDARY_NAV : SUPPLIER_SECONDARY_NAV
  );

  protected readonly userInitials = () => {
    const name = this.authService.user()?.name ?? '';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  dismissBanner(): void {
    this.showTransitionBanner.set(false);
  }

  async handleLogout(): Promise<void> {
    this.authService.logout();
    await this.router.navigate(['/auth/login']);
  }
}
