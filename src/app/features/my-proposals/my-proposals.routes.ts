import { Routes } from '@angular/router';

export const MY_PROPOSALS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/my-proposals-list/my-proposals-list.component').then(
        m => m.MyProposalsListComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/my-proposal-detail/my-proposal-detail.component').then(
        m => m.MyProposalDetailComponent,
      ),
  },
];
