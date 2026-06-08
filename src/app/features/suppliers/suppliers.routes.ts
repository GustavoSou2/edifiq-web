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
    path: 'new',
    loadComponent: () =>
      import('./pages/supplier-form/supplier-form.component').then(
        m => m.SupplierFormComponent,
      ),
    title: 'Novo Fornecedor — Edifiq',
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/supplier-form/supplier-form.component').then(
        m => m.SupplierFormComponent,
      ),
    title: 'Editar Fornecedor — Edifiq',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/supplier-detail/supplier-detail.component').then(
        m => m.SupplierDetailComponent,
      ),
  },
];
