import { Routes } from '@angular/router';

export const DELIVERIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/deliveries-list/deliveries-list.component').then(
        m => m.DeliveriesListComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/delivery-detail/delivery-detail.component').then(
        m => m.DeliveryDetailComponent,
      ),
  },
];
