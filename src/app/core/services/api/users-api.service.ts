import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import {
  User,
  Role,
  PaginatedResponse,
  PaginationParams,
} from '../../../shared/types/domain.types';

export interface InviteUserPayload {
  name:    string;
  email:   string;
  roleIds: string[];
}

export interface UpdateUserPayload {
  name?:     string;
  phone?:    string;
  isActive?: boolean;
}

export interface CreateRolePayload {
  name:        string;
  permissions: string[];
}

@Injectable({ providedIn: 'root' })
export class UsersApiService extends ApiService {

  /** Lista usuários do tenant */
  list(params?: PaginationParams & { search?: string }): Observable<PaginatedResponse<User>> {
    return this.get<PaginatedResponse<User>>('/users', params as Record<string, unknown>);
  }

  /** Busca um usuário pelo ID */
  findById(id: string): Observable<User> {
    return this.get<User>(`/users/${id}`);
  }

  /** Convida um novo usuário */
  invite(payload: InviteUserPayload): Observable<User> {
    return this.post<User>('/users/invite', payload);
  }

  /** Atualiza dados de um usuário */
  update(id: string, payload: UpdateUserPayload): Observable<User> {
    return this.patch<User>(`/users/${id}`, payload);
  }

  /** Ativa/desativa um usuário */
  toggleActive(id: string, active: boolean): Observable<User> {
    return this.patch<User>(`/users/${id}`, { isActive: active });
  }

  /** Remove um usuário */
  remove(id: string): Observable<void> {
    return this.delete<void>(`/users/${id}`);
  }

  /* ── Roles ──────────────────────────────────────────────── */

  /** Lista roles do tenant */
  listRoles(): Observable<Role[]> {
    return this.get<Role[]>('/roles');
  }

  /** Cria uma role customizada */
  createRole(payload: CreateRolePayload): Observable<Role> {
    return this.post<Role>('/roles', payload);
  }

  /** Atualiza uma role */
  updateRole(id: string, payload: Partial<CreateRolePayload>): Observable<Role> {
    return this.put<Role>(`/roles/${id}`, payload);
  }

  /** Remove uma role */
  removeRole(id: string): Observable<void> {
    return this.delete<void>(`/roles/${id}`);
  }

  /** Atribui roles a um usuário */
  assignRoles(userId: string, roleIds: string[]): Observable<User> {
    return this.put<User>(`/users/${userId}/roles`, { roleIds });
  }
}
