import { Routes } from '@angular/router';

export const ANALYTICS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/analytics-home/analytics-home.component').then(
        m => m.AnalyticsHomeComponent,
      ),
  },
];
