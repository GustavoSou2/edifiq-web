import { Routes } from '@angular/router';

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/orders-list/orders-list.component').then(m => m.OrdersListComponent),
    title: 'Pedidos — Edifiq',
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/order-create/order-create.component').then(m => m.OrderCreateComponent),
    title: 'Novo Pedido — Edifiq',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/order-detail/order-detail.component').then(m => m.OrderDetailComponent),
    title: 'Pedido — Edifiq',
  },
  {
    path: ':id/proposals',
    loadComponent: () =>
      import('./pages/proposal-compare/proposal-compare.component').then(m => m.ProposalCompareComponent),
    title: 'Comparar Propostas — Edifiq',
  },
];
