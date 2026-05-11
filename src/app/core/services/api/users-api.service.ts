import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import {
  User,
  Role,
  UserRole,
  PaginatedResponse,
  PaginationParams,
} from '../../../shared/types/domain.types';

export interface InviteUserPayload {
  name:    string;
  email:   string;
  roleIds: string[];
}

export interface UpdateUserPayload {
  active?: boolean;
}

export interface CreateRolePayload {
  name:        string;
  permissions: string[];
}

export interface GrantRolePayload {
  userId: string;
  roleId: string;
}

@Injectable({ providedIn: 'root' })
export class UsersApiService extends ApiService {

  /* ── Users ──────────────────────────────────────────────── */

  /** Lista usuários do tenant — GET /v1/users */
  list(params?: PaginationParams & { search?: string }): Observable<PaginatedResponse<User>> {
    return this.get<PaginatedResponse<User>>('/v1/users', params as Record<string, unknown>);
  }

  /** Busca um usuário pelo ID — GET /v1/users/:id */
  findById(id: string): Observable<User> {
    return this.get<User>(`/v1/users/${id}`);
  }

  /** Convida um novo usuário — POST /v1/users */
  invite(payload: InviteUserPayload): Observable<User> {
    return this.post<User>('/v1/users', { email: payload.email });
  }

  /** Ativa/desativa um usuário — PATCH /v1/users/:id */
  toggleActive(id: string, active: boolean): Observable<User> {
    return this.patch<User>(`/v1/users/${id}`, { active });
  }

  /* ── Roles ──────────────────────────────────────────────── */

  /** Lista roles do tenant — GET /v1/roles */
  listRoles(): Observable<Role[]> {
    return this.get<Role[]>('/v1/roles');
  }

  /** Cria uma role customizada — POST /v1/roles */
  createRole(payload: CreateRolePayload): Observable<Role> {
    return this.post<Role>('/v1/roles', payload);
  }

  /** Atualiza uma role — PUT /v1/roles/:id */
  updateRole(id: string, payload: Partial<CreateRolePayload>): Observable<Role> {
    return this.put<Role>(`/v1/roles/${id}`, payload);
  }

  /** Remove uma role — DELETE /v1/roles/:id */
  removeRole(id: string): Observable<void> {
    return this.delete<void>(`/v1/roles/${id}`);
  }

  /* ── User-Roles (associações) ───────────────────────────── */

  /**
   * Lista todas as associações user↔role do tenant.
   * GET /v1/user-roles
   *
   * Para saber as roles de um usuário específico, filtre pelo userId:
   * `userRoles.filter(ur => ur.userId === userId)`
   */
  listUserRoles(): Observable<UserRole[]> {
    return this.get<UserRole[]>('/v1/user-roles');
  }

  /**
   * Concede uma role a um usuário.
   * POST /v1/user-roles — body: { userId, roleId }
   */
  grantRole(payload: GrantRolePayload): Observable<UserRole> {
    return this.post<UserRole>('/v1/user-roles', payload);
  }

  /**
   * Revoga uma role de um usuário.
   * DELETE /v1/user-roles/:id  (id da associação UserRole, não do usuário)
   */
  revokeRole(userRoleId: string): Observable<void> {
    return this.delete<void>(`/v1/user-roles/${userRoleId}`);
  }
}
