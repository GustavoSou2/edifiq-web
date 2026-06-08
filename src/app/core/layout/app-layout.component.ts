import {
  ChangeDetectionStrategy, Component, OnInit,
  computed, inject, signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService }              from '../../features/auth/services/auth.service';
import { RolePanelService }         from '../services/role-panel.service';
import { RoleToggleComponent }      from '../components/role-toggle/role-toggle.component';
import { PanelTransitionComponent } from '../components/panel-transition/panel-transition.component';

interface NavItem { path: string; label: string; icon: string; badge?: string; }

const ICONS = {
  dashboard:   'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  orders:      'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  deliveries:  'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  analytics:   'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  search:      'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  proposals:   'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  reputation:  'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  suppliers:   'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  users:       'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  settings:    'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  profile:     'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  roles:       'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  categories:  'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z',
  more:        'M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z',
  bell:        'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  help:        'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  menu:        'M4 6h16M4 12h16M4 18h16',
  chevronLeft: 'M15 19l-7-7 7-7',
  chevronRight:'M9 5l7 7-7 7',
};

const BUYER_MAIN_NAV: NavItem[] = [
  { path: '/app/dashboard',  label: 'Dashboard',  icon: ICONS.dashboard },
  { path: '/app/orders',     label: 'Pedidos',     icon: ICONS.orders    },
  { path: '/app/deliveries', label: 'Entregas',    icon: ICONS.deliveries },
  { path: '/app/analytics',  label: 'Analytics',   icon: ICONS.analytics  },
];

const SUPPLIER_MAIN_NAV: NavItem[] = [
  { path: '/app/supplier-dashboard', label: 'Dashboard',           icon: ICONS.dashboard  },
  { path: '/app/available-orders',   label: 'Pedidos Disponíveis', icon: ICONS.search     },
  { path: '/app/my-proposals',       label: 'Minhas Propostas',    icon: ICONS.proposals  },
  { path: '/app/deliveries',         label: 'Entregas',            icon: ICONS.deliveries },
  { path: '/app/my-reputation',      label: 'Reputação',           icon: ICONS.reputation },
];

const BUYER_SECONDARY_NAV: NavItem[] = [
  { path: '/app/suppliers',  label: 'Fornecedores',  icon: ICONS.suppliers  },
  { path: '/app/users',      label: 'Usuários',      icon: ICONS.users      },
  { path: '/app/roles',      label: 'Roles',         icon: ICONS.roles      },
  { path: '/app/categories', label: 'Categorias',    icon: ICONS.categories },
  { path: '/app/settings',   label: 'Configurações', icon: ICONS.settings   },
  { path: '/app/profile',    label: 'Meu Perfil',    icon: ICONS.profile    },
];

const SUPPLIER_SECONDARY_NAV: NavItem[] = [
  { path: '/app/settings', label: 'Configurações', icon: ICONS.settings },
  { path: '/app/profile',  label: 'Meu Perfil',    icon: ICONS.profile  },
];

@Component({
  selector: 'edq-app-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, RoleToggleComponent, PanelTransitionComponent],
  template: `
    <!-- ── Tela de transição entre painéis ──────────────── -->
    <edq-panel-transition />

    <div
      class="app-shell"
      [class.sidebar-collapsed]="sidebarCollapsed()"
      [class.app-shell--supplier]="rolePanel.isSupplier()"
      [style]="panelCssVars()"
    >

      <!-- ── Sidebar ──────────────────────────────────────── -->
      <aside
        class="sidebar"
        [class.sidebar--collapsed]="sidebarCollapsed()"
        [class.mobile-open]="mobileMenuOpen()"
      >
        <div class="sidebar__inner">

          <!-- Logo + painel badge -->
          <div class="sidebar__top">
            <div class="sidebar__logo">
              <div class="logo-mark" [style.background]="rolePanel.currentConfig().color">
                <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="11" r="10" stroke="white" stroke-width="1.5"/>
                  <path d="M11 6v5l3 2" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </div>
              @if (!sidebarCollapsed()) {
                <span class="logo-text">Edifiq</span>
              }
            </div>

            @if (!sidebarCollapsed()) {
              <!-- Badge de painel com identidade visual forte -->
              <div class="panel-badge">
                <div class="panel-badge__icon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path [attr.d]="rolePanel.currentConfig().icon"/>
                  </svg>
                </div>
                <div class="panel-badge__text">
                  <span class="panel-badge__role">{{ rolePanel.currentConfig().label }}</span>
                  <span class="panel-badge__desc">{{ rolePanel.currentConfig().description }}</span>
                </div>
              </div>
            }
          </div>

          <!-- Nav principal -->
          <nav class="sidebar__nav" aria-label="Navegação principal">
            @for (item of mainNav(); track item.path) {
              <a
                class="nav-item"
                [routerLink]="item.path"
                routerLinkActive="nav-item--active"
                [attr.aria-label]="item.label"
                [title]="sidebarCollapsed() ? item.label : ''"
                (click)="closeMobileMenu()"
              >
                <svg class="nav-item__icon" width="18" height="18" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
                     aria-hidden="true">
                  <path [attr.d]="item.icon"/>
                </svg>
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
                class="nav-item nav-item--secondary"
                [routerLink]="item.path"
                routerLinkActive="nav-item--active"
                [attr.aria-label]="item.label"
                [title]="sidebarCollapsed() ? item.label : ''"
                (click)="closeMobileMenu()"
              >
                <svg class="nav-item__icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
                     aria-hidden="true">
                  <path [attr.d]="item.icon"/>
                </svg>
                @if (!sidebarCollapsed()) {
                  <span class="nav-item__label">{{ item.label }}</span>
                }
              </a>
            }
          </nav>
        </div>

        <!-- Footer do sidebar -->
        <div class="sidebar__footer">
          <button
            class="user-btn"
            type="button"
            [title]="authService.user()?.fullName ?? 'Sair'"
            (click)="handleLogout()"
            aria-label="Sair da conta"
          >
            <div class="user-avatar">{{ userInitials() }}</div>
            @if (!sidebarCollapsed()) {
              <div class="user-info">
                <span class="user-name">{{ authService.user()?.fullName }}</span>
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
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path [attr.d]="sidebarCollapsed() ? icons.chevronRight : icons.chevronLeft"/>
          </svg>
        </button>
      </aside>

      <!-- ── Main ──────────────────────────────────────────── -->
      <main class="app-main">

        <!-- Topbar -->
        <header class="topbar">
          <div class="topbar__left">
            <button class="mobile-menu-btn" type="button" aria-label="Abrir menu" (click)="toggleMobileMenu()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path [attr.d]="icons.menu"/>
              </svg>
            </button>

            <!-- Logo mobile -->
            <div class="topbar__mobile-logo">
              <div class="logo-mark logo-mark--sm" [style.background]="rolePanel.currentConfig().color">
                <svg width="12" height="12" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="11" r="10" stroke="white" stroke-width="1.5"/>
                  <path d="M11 6v5l3 2" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </div>
              <span class="topbar__mobile-logo-text">Edifiq</span>
            </div>

            <!-- Indicador de painel no topbar (mobile/tablet) -->
            <div class="topbar__panel-chip">
              <span class="topbar__panel-dot"></span>
              <span>{{ rolePanel.currentConfig().label }}</span>
            </div>
          </div>

          <div class="topbar__right">
            <edq-role-toggle />
            <div class="topbar__divider"></div>
            <button class="topbar-btn" type="button" aria-label="Notificações">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path [attr.d]="icons.bell"/>
              </svg>
              <span class="notif-dot" aria-hidden="true"></span>
            </button>
          </div>
        </header>

        <!-- Page content -->
        <div class="page-content">
          <router-outlet />
        </div>
      </main>
    </div>

    <!-- Mobile overlay -->
    @if (mobileMenuOpen()) {
      <div class="mobile-overlay" role="presentation" (click)="toggleMobileMenu()"></div>
    }

    <!-- Bottom Nav mobile -->
    <nav class="bottom-nav" aria-label="Navegação principal mobile">
      @for (item of mainNav().slice(0, 4); track item.path) {
        <a
          class="bottom-nav__item"
          [class.bottom-nav__item--active]="isActiveRoute(item.path)"
          [routerLink]="item.path"
          [attr.aria-label]="item.label"
          [attr.aria-current]="isActiveRoute(item.path) ? 'page' : null"
        >
          <svg class="bottom-nav__icon" width="22" height="22" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
               aria-hidden="true">
            <path [attr.d]="item.icon"/>
          </svg>
          <span class="bottom-nav__label">{{ item.label }}</span>
        </a>
      }
      <button class="bottom-nav__item" type="button" aria-label="Mais opções" (click)="toggleMobileMenu()">
        <svg class="bottom-nav__icon" width="22" height="22" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
             aria-hidden="true">
          <path [attr.d]="icons.more"/>
        </svg>
        <span class="bottom-nav__label">Mais</span>
      </button>
    </nav>
  `,
  styleUrl: './app-layout.component.scss',
})
export class AppLayoutComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  protected readonly rolePanel   = inject(RolePanelService);
  private readonly router        = inject(Router);

  protected readonly icons = ICONS;
  protected readonly sidebarCollapsed = signal(false);
  protected readonly mobileMenuOpen   = signal(false);

  protected readonly panelCssVars = computed(() => {
    const c = this.rolePanel.currentConfig();
    return `--panel-color: ${c.color}; --panel-color-light: ${c.color}1a; --panel-color-glow: ${c.color}40;`;
  });

  ngOnInit(): void {
    // Ao iniciar, navega para o dashboard do painel atual (sem animação)
    const currentPath = this.router.url;
    const isAtRoot = currentPath === '/app' || currentPath === '/app/';
    if (isAtRoot) {
      this.router.navigate([this.rolePanel.currentConfig().dashboardPath]);
    }
  }

  protected readonly mainNav = computed<NavItem[]>(() =>
    this.rolePanel.isBuyer() ? BUYER_MAIN_NAV : SUPPLIER_MAIN_NAV
  );

  protected readonly secondaryNav = computed<NavItem[]>(() =>
    this.rolePanel.isBuyer() ? BUYER_SECONDARY_NAV : SUPPLIER_SECONDARY_NAV
  );

  protected readonly userInitials = () => {
    const name = this.authService.user()?.fullName ?? '';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'U';
  };

  toggleSidebar():    void { this.sidebarCollapsed.update(v => !v); }
  toggleMobileMenu(): void { this.mobileMenuOpen.update(v => !v); }
  closeMobileMenu():  void { this.mobileMenuOpen.set(false); }

  async handleLogout(): Promise<void> {
    this.authService.logout();
    await this.router.navigate(['/auth/login']);
  }

  isActiveRoute(path: string): boolean {
    return this.router.url.startsWith(path);
  }
}
