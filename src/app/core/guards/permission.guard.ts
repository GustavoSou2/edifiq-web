import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { PermissionService } from '../services/permission.service';
import { AuthService } from '../../features/auth/services/auth.service';

/**
 * permissionGuard — protege rotas que exigem permissões específicas.
 *
 * Uso nas rotas:
 * ```ts
 * {
 *   path: 'users',
 *   canActivate: [authGuard, permissionGuard('users.manage')],
 * }
 * ```
 *
 * Redireciona para /app/dashboard se o usuário não tiver a permissão.
 * Aguarda o PermissionService terminar de carregar antes de checar.
 */
export function permissionGuard(...requiredPermissions: string[]): CanActivateFn {
  return () => {
    const permissions = inject(PermissionService);
    const auth        = inject(AuthService);
    const router      = inject(Router);

    const check = () => {
      if (!auth.isLoggedIn()) {
        return router.createUrlTree(['/auth/login']);
      }
      const allowed = permissions.hasAnyPermission(...requiredPermissions);
      return allowed ? true : router.createUrlTree(['/app/dashboard']);
    };

    // Se já carregou, responde imediatamente
    if (permissions.loaded()) {
      return check();
    }

    // Aguarda o carregamento terminar
    return toObservable(permissions.loaded).pipe(
      filter(done => done),
      take(1),
      map(() => check()),
    );
  };
}
