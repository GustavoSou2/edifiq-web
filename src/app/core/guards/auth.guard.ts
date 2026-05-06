import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../../features/auth/services/auth.service';

/**
 * Protege rotas que exigem autenticação.
 * Aguarda o APP_INITIALIZER terminar antes de checar o estado,
 * evitando redirecionamentos falsos durante o boot.
 */
export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  // Se o init já terminou, responde imediatamente
  if (auth.initialized()) {
    return auth.isLoggedIn() ? true : router.createUrlTree(['/auth/login']);
  }

  // Aguarda o init completar (caso o guard rode antes do APP_INITIALIZER)
  return toObservable(auth.initialized).pipe(
    filter(done => done),
    take(1),
    map(() => auth.isLoggedIn() ? true : router.createUrlTree(['/auth/login'])),
  );
};
