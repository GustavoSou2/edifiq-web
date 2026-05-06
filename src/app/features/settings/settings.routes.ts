import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  { path: '', redirectTo: 'company', pathMatch: 'full' },
  {
    path: 'company',
    loadComponent: () =>
      import('./pages/settings-company/settings-company.component').then(
        m => m.SettingsCompanyComponent,
      ),
  },
  {
    path: 'plan',
    loadComponent: () =>
      import('./pages/settings-plan/settings-plan.component').then(
        m => m.SettingsPlanComponent,
      ),
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./pages/settings-categories/settings-categories.component').then(
        m => m.SettingsCategoriesComponent,
      ),
  },
  {
    path: 'webhooks',
    loadComponent: () =>
      import('./pages/settings-webhooks/settings-webhooks.component').then(
        m => m.SettingsWebhooksComponent,
      ),
  },
  {
    path: 'audit',
    loadComponent: () =>
      import('./pages/settings-audit/settings-audit.component').then(
        m => m.SettingsAuditComponent,
      ),
  },
];
