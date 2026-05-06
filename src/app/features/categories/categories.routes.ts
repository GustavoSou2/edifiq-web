import { Routes } from '@angular/router';

export const CATEGORIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/categories-home/categories-home.component').then(
        m => m.CategoriesHomeComponent,
      ),
  },
];
