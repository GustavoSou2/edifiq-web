import { Routes } from '@angular/router';

export const SUPPLIER_DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/supplier-dashboard-home/supplier-dashboard-home.component').then(
        m => m.SupplierDashboardHomeComponent,
      ),
  },
];
