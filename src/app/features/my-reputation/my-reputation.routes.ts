import { Routes } from '@angular/router';

export const MY_REPUTATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/my-reputation-home/my-reputation-home.component').then(
        m => m.MyReputationHomeComponent,
      ),
  },
];
