import { Routes } from '@angular/router';

export const ROLES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/roles-home/roles-home.component').then(
        m => m.RolesHomeComponent,
      ),
  },
];
