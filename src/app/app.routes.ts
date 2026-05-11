import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'landing',
    pathMatch: 'full',
  },

  /* ── Landing page (público) ─────────────────────────────── */
  {
    path: 'landing',
    loadComponent: () =>
      import('./features/landing/landing.component').then(m => m.LandingComponent),
    title: 'Edifiq — Leilão reverso de materiais de construção',
  },

  /* ── Auth (público) ─────────────────────────────────────── */
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(r => r.AUTH_ROUTES),
  },

  /* ── App (protegido) ────────────────────────────────────── */
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layout/app-layout.component').then(m => m.AppLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      /* ── Painel Comprador ───────────────────────────────── */
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
        title: 'Dashboard — Edifiq',
      },
      {
        path: 'orders',
        //canActivate: [permissionGuard('orders.view', 'orders.create')],
        loadChildren: () =>
          import('./features/orders/orders.routes').then(m => m.ORDERS_ROUTES),
        title: 'Pedidos — Edifiq',
      },
      {
        path: 'suppliers',
        //canActivate: [permissionGuard('suppliers.view', 'suppliers.manage')],
        loadChildren: () =>
          import('./features/suppliers/suppliers.routes').then(m => m.SUPPLIERS_ROUTES),
        title: 'Fornecedores — Edifiq',
      },
      {
        path: 'deliveries',
        //canActivate: [permissionGuard('deliveries.view', 'deliveries.manage')],
        loadChildren: () =>
          import('./features/deliveries/deliveries.routes').then(m => m.DELIVERIES_ROUTES),
        title: 'Entregas — Edifiq',
      },
      {
        path: 'users',
        //canActivate: [permissionGuard('users.manage')],
        loadChildren: () =>
          import('./features/users/users.routes').then(m => m.USERS_ROUTES),
        title: 'Usuários — Edifiq',
      },
      {
        path: 'analytics',
        //canActivate: [permissionGuard('analytics.view')],
        loadChildren: () =>
          import('./features/analytics/analytics.routes').then(m => m.ANALYTICS_ROUTES),
        title: 'Analytics — Edifiq',
      },
      {
        path: 'settings',
        //canActivate: [permissionGuard('settings.manage')],
        loadChildren: () =>
          import('./features/settings/settings.routes').then(m => m.SETTINGS_ROUTES),
        title: 'Configurações — Edifiq',
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES),
        title: 'Meu Perfil — Edifiq',
      },

      /* ── Painel Fornecedor ──────────────────────────────── */
      {
        path: 'supplier-dashboard',
        loadChildren: () =>
          import('./features/supplier-dashboard/supplier-dashboard.routes').then(
            m => m.SUPPLIER_DASHBOARD_ROUTES,
          ),
        title: 'Dashboard Fornecedor — Edifiq',
      },
      {
        path: 'available-orders',
        loadChildren: () =>
          import('./features/available-orders/available-orders.routes').then(
            m => m.AVAILABLE_ORDERS_ROUTES,
          ),
        title: 'Pedidos Disponíveis — Edifiq',
      },
      {
        path: 'my-proposals',
        loadChildren: () =>
          import('./features/my-proposals/my-proposals.routes').then(
            m => m.MY_PROPOSALS_ROUTES,
          ),
        title: 'Minhas Propostas — Edifiq',
      },

      /* ── Administração ──────────────────────────────────── */
      {
        path: 'categories',
        //canActivate: [permissionGuard('settings.manage')],
        loadChildren: () =>
          import('./features/categories/categories.routes').then(m => m.CATEGORIES_ROUTES),
        title: 'Categorias — Edifiq',
      },
      {
        path: 'roles',
       // canActivate: [permissionGuard('users.manage')],
        loadChildren: () =>
          import('./features/roles/roles.routes').then(m => m.ROLES_ROUTES),
        title: 'Perfis de Acesso — Edifiq',
      },
      {
        path: 'my-reputation',
        loadChildren: () =>
          import('./features/my-reputation/my-reputation.routes').then(
            m => m.MY_REPUTATION_ROUTES,
          ),
        title: 'Reputação — Edifiq',
      },
    ],
  },

  /* ── Fallback ───────────────────────────────────────────── */
  { path: '**', redirectTo: 'auth/login' },
];
