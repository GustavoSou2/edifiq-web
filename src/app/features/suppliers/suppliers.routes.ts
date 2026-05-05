import { Routes } from '@angular/router';

export const SUPPLIERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/suppliers-list/suppliers-list.component').then(
        m => m.SuppliersListComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/supplier-detail/supplier-detail.component').then(
        m => m.SupplierDetailComponent,
      ),
  },
];
