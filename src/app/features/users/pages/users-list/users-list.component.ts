import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { User } from '../../../../shared/types/domain.types';

interface UserRow extends Partial<User> {
  roles_labels: string[];
}

const MOCK_USERS: UserRow[] = [
  {
    id: '1',
    name: 'João Melo',
    email: 'joao.melo@empresa.com',
    is_active: true,
    last_login_at: '2024-01-15T10:00:00Z',
    roles_labels: ['Admin'],
  },
  {
    id: '2',
    name: 'Ana Souza',
    email: 'ana.souza@empresa.com',
    is_active: true,
    last_login_at: '2024-01-14T09:30:00Z',
    roles_labels: ['Comprador'],
  },
  {
    id: '3',
    name: 'Carlos Lima',
    email: 'carlos.lima@empresa.com',
    is_active: true,
    last_login_at: '2024-01-13T08:00:00Z',
    roles_labels: ['Comprador', 'Visualizador'],
  },
  {
    id: '4',
    name: 'Fernanda Costa',
    email: 'fernanda.costa@empresa.com',
    is_active: false,
    last_login_at: '2023-12-20T14:00:00Z',
    roles_labels: ['Visualizador'],
  },
  {
    id: '5',
    name: 'Ricardo Alves',
    email: 'ricardo.alves@empresa.com',
    is_active: true,
    last_login_at: null,
    roles_labels: ['Admin', 'Comprador'],
  },
];

@Component({
  selector: 'edq-users-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeaderComponent, ButtonComponent],
  template: `
    <edq-page-header title="Usuários & Permissões" subtitle="Controle de acesso da equipe">
      <edq-button slot="actions" variant="secondary" size="sm" routerLink="roles">Gerenciar Roles</edq-button>
      <edq-button slot="actions" variant="primary"   size="sm">+ Convidar Usuário</edq-button>
    </edq-page-header>

    <!-- Tabela -->
    <div class="table-wrapper">
      <table class="data-table" aria-label="Lista de usuários">
        <thead>
          <tr>
            <th scope="col">Usuário</th>
            <th scope="col">Email</th>
            <th scope="col">Roles</th>
            <th scope="col">Status</th>
            <th scope="col">Último Login</th>
            <th scope="col"><span class="sr-only">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          @for (user of users(); track user.id) {
            <tr class="table-row">
              <td>
                <div class="user-cell">
                  <div class="user-avatar" [attr.aria-label]="user.name">
                    {{ initials(user.name ?? '') }}
                  </div>
                  <span class="user-name">{{ user.name }}</span>
                </div>
              </td>
              <td class="email-cell">{{ user.email }}</td>
              <td>
                <div class="role-chips">
                  @for (role of user.roles_labels; track role) {
                    <span class="role-chip">{{ role }}</span>
                  }
                </div>
              </td>
              <td>
                <button
                  class="status-toggle"
                  [class.status-toggle--active]="user.is_active"
                  (click)="toggleActive(user)"
                  [attr.aria-label]="user.is_active ? 'Desativar usuário' : 'Ativar usuário'"
                >
                  <span class="status-toggle__dot"></span>
                  {{ user.is_active ? 'Ativo' : 'Inativo' }}
                </button>
              </td>
              <td class="date-cell">{{ user.last_login_at ? formatDate(user.last_login_at) : 'Nunca' }}</td>
              <td>
                <div class="row-actions">
                  <edq-button variant="ghost" size="sm">Editar</edq-button>
                </div>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="6">
                <div class="table-empty">
                  <span>👥</span>
                  <p>Nenhum usuário encontrado.</p>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styleUrl: './users-list.component.scss',
})
export class UsersListComponent {
  protected readonly users = signal<UserRow[]>(MOCK_USERS);

  protected initials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  }

  protected toggleActive(user: UserRow): void {
    this.users.update(list =>
      list.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u),
    );
  }
}
