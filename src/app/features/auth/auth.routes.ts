import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './auth-layout/auth-layout.component';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./login/login.component').then(m => m.LoginComponent),
        title: 'Entrar — Edifiq',
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./register/register.component').then(m => m.RegisterComponent),
        title: 'Criar conta — Edifiq',
      },
      {
        path: 'confirm-email',
        loadComponent: () =>
          import('./confirm-email/confirm-email.component').then(
            m => m.ConfirmEmailComponent,
          ),
        title: 'Confirmar e-mail — Edifiq',
      },
    ],
  },
];
