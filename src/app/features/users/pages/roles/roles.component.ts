import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { Role } from '../../../../shared/types/domain.types';

const SYSTEM_ROLES: Partial<Role>[] = [
  {
    id: 'r1',
    name: 'Owner',
    is_system: true,
    permissions: [
      'orders.create', 'orders.view',
      'proposals.view', 'proposals.accept',
      'users.manage', 'settings.manage',
    ],
  },
  {
    id: 'r2',
    name: 'Admin',
    is_system: true,
    permissions: [
      'orders.create', 'orders.view',
      'proposals.view', 'proposals.accept',
      'users.manage',
    ],
  },
  {
    id: 'r3',
    name: 'Comprador',
    is_system: true,
    permissions: [
      'orders.create', 'orders.view',
      'proposals.view', 'proposals.accept',
    ],
  },
];

const PERMISSION_LABELS: Record<string, string> = {
  'orders.create':    'Criar Pedidos',
  'orders.view':      'Visualizar Pedidos',
  'proposals.view':   'Visualizar Propostas',
  'proposals.accept': 'Aceitar Propostas',
  'users.manage':     'Gerenciar Usuários',
  'settings.manage':  'Gerenciar Configurações',
};

@Component({
  selector: 'edq-roles',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeaderComponent, ButtonComponent],
  template: `
    <edq-page-header title="Perfis de Acesso" subtitle="Gerencie as permissões por perfil">
      <edq-button slot="actions" variant="secondary" size="sm" routerLink="../">← Voltar</edq-button>
      <edq-button slot="actions" variant="primary"   size="sm">+ Criar Perfil</edq-button>
    </edq-page-header>

    <div class="roles-grid">
      @for (role of roles; track role.id) {
        <div class="role-card">
          <div class="role-card__header">
            <h3 class="role-card__name">{{ role.name }}</h3>
            @if (role.is_system) {
              <span class="system-badge">Sistema</span>
            }
          </div>

          <div class="role-card__permissions">
            <p class="permissions-label">Permissões</p>
            <div class="permission-chips">
              @for (perm of role.permissions; track perm) {
                <span class="permission-chip">{{ permLabel(perm) }}</span>
              }
            </div>
          </div>

          <div class="role-card__footer">
            <edq-button variant="ghost" size="sm" [disabled]="role.is_system ?? false">
              {{ role.is_system ? 'Perfil do Sistema' : 'Editar' }}
            </edq-button>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './roles.component.scss',
})
export class RolesComponent {
  protected readonly roles = SYSTEM_ROLES;

  protected permLabel(perm: string): string {
    return PERMISSION_LABELS[perm] ?? perm;
  }
}
