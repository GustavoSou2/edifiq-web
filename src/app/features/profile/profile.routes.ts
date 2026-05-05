import { Routes } from '@angular/router';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/profile-home/profile-home.component').then(
        m => m.ProfileHomeComponent,
      ),
  },
];
