import { Routes } from '@angular/router';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/users-list/users-list.component').then(
        m => m.UsersListComponent,
      ),
  },
  {
    path: 'roles',
    loadComponent: () =>
      import('./pages/roles/roles.component').then(
        m => m.RolesComponent,
      ),
  },
];
