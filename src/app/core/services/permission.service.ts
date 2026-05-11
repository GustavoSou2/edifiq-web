import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserRole, Role } from '../../shared/types/domain.types';

interface UserRoleApiResponse {
  data: UserRole[];
}

interface RoleApiResponse {
  data: Role[];
}

/**
 * PermissionService — carrega as roles e permissões do usuário logado.
 *
 * Fluxo:
 * 1. Após login, chama `load(userId)` para buscar as associações user-role
 * 2. Busca as roles completas (com permissions[]) via GET /v1/roles
 * 3. Cruza os dados para montar o conjunto de permissões ativas
 * 4. Expõe `hasPermission(key)` e `hasAnyPermission(...keys)` para guards e diretivas
 *
 * Chamado pelo AuthService após autenticação bem-sucedida.
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  /* ── State ──────────────────────────────────────────────── */
  private readonly _permissions = signal<Set<string>>(new Set());
  private readonly _roles       = signal<Role[]>([]);
  private readonly _loaded      = signal(false);

  /* ── Public ─────────────────────────────────────────────── */
  readonly roles       = this._roles.asReadonly();
  readonly loaded      = this._loaded.asReadonly();
  readonly permissions = computed(() => [...this._permissions()]);

  /**
   * Carrega as roles do usuário logado.
   * Deve ser chamado após autenticação (no AuthService.init / login).
   */
  async load(userId: string): Promise<void> {
    try {
      // Busca em paralelo: user-roles do tenant + todas as roles do tenant
      const [userRolesRes, rolesRes] = await Promise.all([
        firstValueFrom(
          this.http.get<UserRoleApiResponse>(`${this.base}/user-roles`),
        ),
        firstValueFrom(
          this.http.get<RoleApiResponse>(`${this.base}/roles`),
        ),
      ]);

      const allRoles = rolesRes.data;
      this._roles.set(allRoles);

      // Filtra apenas as associações do usuário atual
      const myRoleIds = new Set(
        userRolesRes.data
          .filter(ur => ur.userId === userId)
          .map(ur => ur.roleId),
      );

      // Agrega todas as permissões das roles do usuário
      const perms = new Set<string>();
      for (const role of allRoles) {
        if (myRoleIds.has(role.id)) {
          role.permissions.forEach(p => perms.add(p));
        }
      }

      this._permissions.set(perms);
      this._loaded.set(true);
    } catch {
      // Falha silenciosa — usuário sem permissões carregadas
      this._permissions.set(new Set());
      this._loaded.set(true);
    }
  }

  /** Limpa o estado ao fazer logout. */
  clear(): void {
    this._permissions.set(new Set());
    this._roles.set([]);
    this._loaded.set(false);
  }

  /** Verifica se o usuário possui uma permissão específica. */
  hasPermission(key: string): boolean {
    return this._permissions().has(key);
  }

  /** Verifica se o usuário possui ao menos uma das permissões listadas. */
  hasAnyPermission(...keys: string[]): boolean {
    return keys.some(k => this._permissions().has(k));
  }

  /** Verifica se o usuário possui todas as permissões listadas. */
  hasAllPermissions(...keys: string[]): boolean {
    return keys.every(k => this._permissions().has(k));
  }

  /**
   * Retorna as roles do usuário atual cruzando com as user-role associations.
   * Útil para exibir chips de role na listagem de usuários.
   */
  getRolesForUser(userId: string, userRoles: UserRole[]): Role[] {
    const roleIds = new Set(
      userRoles.filter(ur => ur.userId === userId).map(ur => ur.roleId),
    );
    return this._roles().filter(r => roleIds.has(r.id));
  }
}
