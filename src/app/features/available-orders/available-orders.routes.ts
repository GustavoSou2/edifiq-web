import { Routes } from '@angular/router';

export const AVAILABLE_ORDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/available-orders-list/available-orders-list.component').then(
        m => m.AvailableOrdersListComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/available-order-detail/available-order-detail.component').then(
        m => m.AvailableOrderDetailComponent,
      ),
  },
];
